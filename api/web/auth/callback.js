import {
  exchangeGoogleCode,
  fetchGoogleUser,
  getCallbackUrl,
  getRequestOrigin,
  getWebSession,
  saveGoogleSession,
  setAuthHeaders,
} from '../_session.js';

function redirectToAuthStatus(req, res, status) {
  const url = new URL(getRequestOrigin(req));
  url.searchParams.set('auth', status === 'cancelled' ? 'cancelled' : 'error');
  res.writeHead(302, { Location: url.toString() });
  return res.end();
}

export default async function handler(req, res) {
  setAuthHeaders(res, 'GET, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { code, error: oauthError, state } = req.query || {};
  if (oauthError) {
    return redirectToAuthStatus(req, res, String(oauthError) === 'access_denied' ? 'cancelled' : 'error');
  }
  if (!code || !state) return redirectToAuthStatus(req, res, 'error');

  try {
    const session = await getWebSession(req, res);
    if (!session.oauthState || session.oauthState !== state) {
      session.destroy();
      return redirectToAuthStatus(req, res, 'error');
    }

    delete session.oauthState;
    const tokenData = await exchangeGoogleCode({ code: String(code), redirectUri: getCallbackUrl(req) });
    if (!tokenData.refresh_token && !session.googleRefreshToken) {
      session.destroy();
      return redirectToAuthStatus(req, res, 'error');
    }

    const user = await fetchGoogleUser(tokenData.access_token);
    saveGoogleSession(session, tokenData, user);
    await session.save();

    res.writeHead(302, { Location: getRequestOrigin(req) });
    return res.end();
  } catch {
    return redirectToAuthStatus(req, res, 'error');
  }
}
