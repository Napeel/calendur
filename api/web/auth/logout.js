import { getWebSession, sendError, setAuthHeaders } from '../_session.js';

export default async function handler(req, res) {
  setAuthHeaders(res, 'POST, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const session = await getWebSession(req, res);
    session.destroy();
    return res.status(200).json({ connected: false });
  } catch (error) {
    return sendError(res, error);
  }
}
