// Background service worker for Calendur
// Uses launchWebAuthFlow for OAuth (works with unpacked extensions in Brave/Chrome)

const REDIRECT_URI = chrome.identity.getRedirectURL();
const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/userinfo.email',
].join(' ');

let cachedToken = null;
let cachedTokenExpiresAt = null;
let refreshPromise = null;

// Restore token from storage on service worker startup
chrome.storage.local.get(['authToken', 'authTokenExpiresAt'], (result) => {
  if (result.authToken) {
    cachedToken = result.authToken;
    cachedTokenExpiresAt = result.authTokenExpiresAt || null;
  }
});

function getClientId() {
  return chrome.runtime.getManifest().oauth2.client_id;
}

function extractTokenData(redirectUrl) {
  const url = new URL(redirectUrl);
  const hash = url.hash.substring(1);
  const params = new URLSearchParams(hash);
  return {
    token: params.get('access_token'),
    expiresIn: parseInt(params.get('expires_in')) || 3600,
  };
}

function saveToken(token, expiresInSeconds = 3600) {
  const expiresAt = Date.now() + expiresInSeconds * 1000;
  cachedToken = token;
  cachedTokenExpiresAt = expiresAt;
  chrome.storage.local.set({ authToken: token, authTokenExpiresAt: expiresAt });
}

function clearToken() {
  cachedToken = null;
  cachedTokenExpiresAt = null;
  chrome.storage.local.remove(['authToken', 'authTokenExpiresAt']);
}

function isTokenFresh() {
  // Consider token expired if within 60s of expiry or no expiry info
  if (!cachedToken) return false;
  if (!cachedTokenExpiresAt) return false;
  return Date.now() < cachedTokenExpiresAt - 60000;
}

// Get a valid token — restores from storage, checks expiry, re-auths if needed
async function getValidToken(interactive) {
  // Deduplicate concurrent refresh attempts
  if (refreshPromise) return refreshPromise;

  // Fast path: in-memory token is still fresh
  if (cachedToken && isTokenFresh()) return cachedToken;

  // Check storage in case service worker restarted
  const stored = await chrome.storage.local.get(['authToken', 'authTokenExpiresAt']);
  if (stored.authToken) {
    cachedToken = stored.authToken;
    cachedTokenExpiresAt = stored.authTokenExpiresAt || null;
    if (isTokenFresh()) return cachedToken;
  }

  // Token is missing or expired — need to re-authenticate
  clearToken();

  if (!interactive) return null;

  // Interactive re-auth (shows Google login popup)
  refreshPromise = new Promise((resolve, reject) => {
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', getClientId());
    authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
    authUrl.searchParams.set('response_type', 'token');
    authUrl.searchParams.set('scope', SCOPES);
    authUrl.searchParams.set('prompt', 'consent');

    chrome.identity.launchWebAuthFlow(
      { url: authUrl.toString(), interactive: true },
      (redirectUrl) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        if (!redirectUrl) {
          reject(new Error('No redirect URL received'));
          return;
        }
        const { token, expiresIn } = extractTokenData(redirectUrl);
        if (token) {
          saveToken(token, expiresIn);
          resolve(token);
        } else {
          reject(new Error('No access token in response'));
        }
      }
    );
  }).finally(() => { refreshPromise = null; });

  return refreshPromise;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'getAuthToken') {
    getValidToken(message.interactive !== false)
      .then(token => sendResponse({ token }))
      .catch(err => sendResponse({ error: err.message }));
    return true;
  }

  if (message.type === 'removeCachedToken') {
    clearToken();
    sendResponse({ success: true });
    return true;
  }

  if (message.type === 'getUserInfo') {
    (async () => {
      try {
        const token = await getValidToken(false);
        if (!token) {
          sendResponse({ error: 'Not authenticated' });
          return;
        }
        const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 401) {
          clearToken();
          sendResponse({ error: 'Token expired' });
          return;
        }
        const info = await res.json();
        sendResponse({ email: info.email, name: info.name });
      } catch (err) {
        sendResponse({ error: err.message });
      }
    })();
    return true;
  }
});
