import {
  getPublicSession,
  getWebSession,
  refreshGoogleAccessToken,
  sendError,
  setAuthHeaders,
} from '../_session.js';

export default async function handler(req, res) {
  setAuthHeaders(res, 'GET, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const session = await getWebSession(req, res);
    if (!session.isConnected || !session.googleRefreshToken) {
      return res.status(200).json({ connected: false });
    }

    try {
      const tokenData = await refreshGoogleAccessToken(session.googleRefreshToken);
      session.googleAccessTokenExpiresAt = Date.now() + Number(tokenData.expires_in || 0) * 1000;
      if (tokenData.scope) session.googleScopes = tokenData.scope.split(' ').filter(Boolean);
      await session.save();
    } catch {
      session.destroy();
      return res.status(401).json({ connected: false, error: 'auth_required' });
    }

    return res.status(200).json(getPublicSession(session));
  } catch (error) {
    return sendError(res, error);
  }
}
