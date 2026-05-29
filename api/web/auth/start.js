import {
  GOOGLE_SCOPES,
  createOauthState,
  getCallbackUrl,
  getRequiredEnv,
  getWebSession,
  sendError,
  setAuthHeaders,
} from '../_session.js';

export default async function handler(req, res) {
  setAuthHeaders(res, 'GET, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const session = await getWebSession(req, res);
    const state = createOauthState();
    session.oauthState = state;
    await session.save();

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', getRequiredEnv('GOOGLE_CLIENT_ID'));
    authUrl.searchParams.set('redirect_uri', getCallbackUrl(req));
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', GOOGLE_SCOPES.join(' '));
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('prompt', 'consent');
    authUrl.searchParams.set('include_granted_scopes', 'true');
    authUrl.searchParams.set('state', state);

    res.writeHead(302, { Location: authUrl.toString() });
    return res.end();
  } catch (error) {
    return sendError(res, error);
  }
}
