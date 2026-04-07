// Background service worker for Calendur
// Handles OAuth token management and message passing

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'getAuthToken') {
    chrome.identity.getAuthToken({ interactive: message.interactive !== false }, (token) => {
      if (chrome.runtime.lastError) {
        sendResponse({ error: chrome.runtime.lastError.message });
      } else {
        sendResponse({ token });
      }
    });
    return true; // keep channel open for async response
  }

  if (message.type === 'removeCachedToken') {
    chrome.identity.removeCachedAuthToken({ token: message.token }, () => {
      sendResponse({ success: true });
    });
    return true;
  }

  if (message.type === 'getUserInfo') {
    chrome.identity.getAuthToken({ interactive: false }, async (token) => {
      if (chrome.runtime.lastError || !token) {
        sendResponse({ error: 'Not authenticated' });
        return;
      }
      try {
        const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const info = await res.json();
        sendResponse({ email: info.email, name: info.name });
      } catch (err) {
        sendResponse({ error: err.message });
      }
    });
    return true;
  }
});
