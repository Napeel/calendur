import { randomBytes } from 'node:crypto';
import { getIronSession } from 'iron-session';

export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;
export const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/userinfo.email',
];

const SESSION_COOKIE_NAME = 'calendur_web_session';

export function setAuthHeaders(res, methods = 'GET, OPTIONS') {
  res.setHeader('Allow', methods.replace(', OPTIONS', ''));
  res.setHeader('Access-Control-Allow-Methods', methods);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export function createOauthState() {
  return randomBytes(32).toString('hex');
}

export function getRequiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    const error = new Error(`Missing required environment variable: ${name}`);
    error.statusCode = 500;
    throw error;
  }
  return value;
}

function getSessionSecret() {
  const secret = getRequiredEnv('SESSION_SECRET');
  if (secret.length < 32) {
    const error = new Error('SESSION_SECRET must be at least 32 characters');
    error.statusCode = 500;
    throw error;
  }
  return secret;
}

function getSessionOptions() {
  return {
    cookieName: SESSION_COOKIE_NAME,
    password: getSessionSecret(),
    ttl: SESSION_TTL_SECONDS,
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_TTL_SECONDS,
    },
  };
}

export async function getWebSession(req, res) {
  return getIronSession(req, res, getSessionOptions());
}

export function getRequestOrigin(req) {
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const proto = req.headers['x-forwarded-proto'] || (host?.startsWith('localhost') ? 'http' : 'https');
  return `${proto}://${host}`;
}

export function getCallbackUrl(req) {
  return `${getRequestOrigin(req)}/api/web/auth/callback`;
}

function parseScopes(scopeValue) {
  if (!scopeValue) return GOOGLE_SCOPES;
  return scopeValue.split(' ').filter(Boolean);
}

async function readGoogleJson(response, fallbackMessage) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error_description || data.error || fallbackMessage);
    error.statusCode = response.status;
    throw error;
  }
  return data;
}

export async function exchangeGoogleCode({ code, redirectUri }) {
  const body = new URLSearchParams({
    code,
    client_id: getRequiredEnv('GOOGLE_CLIENT_ID'),
    client_secret: getRequiredEnv('GOOGLE_CLIENT_SECRET'),
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  });

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  return readGoogleJson(response, 'Token exchange failed');
}

export async function refreshGoogleAccessToken(refreshToken) {
  const body = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: getRequiredEnv('GOOGLE_CLIENT_ID'),
    client_secret: getRequiredEnv('GOOGLE_CLIENT_SECRET'),
    grant_type: 'refresh_token',
  });

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  return readGoogleJson(response, 'Token refresh failed');
}

export async function fetchGoogleUser(accessToken) {
  const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  return readGoogleJson(response, 'User info request failed');
}

export function saveGoogleSession(session, tokenData, user) {
  session.isConnected = true;
  session.googleRefreshToken = tokenData.refresh_token || session.googleRefreshToken;
  session.googleAccessTokenExpiresAt = Date.now() + Number(tokenData.expires_in || 0) * 1000;
  session.googleScopes = parseScopes(tokenData.scope);
  session.user = {
    email: user.email || null,
    name: user.name || null,
  };
}

export function getPublicSession(session) {
  if (!session.isConnected || !session.googleRefreshToken) {
    return { connected: false };
  }

  return {
    connected: true,
    user: session.user || null,
    scopes: session.googleScopes || GOOGLE_SCOPES,
  };
}

export async function getGoogleAccessToken(req, res) {
  const session = await getWebSession(req, res);
  if (!session.isConnected || !session.googleRefreshToken) {
    const error = new Error('auth_required');
    error.statusCode = 401;
    throw error;
  }

  try {
    const tokenData = await refreshGoogleAccessToken(session.googleRefreshToken);
    session.googleAccessTokenExpiresAt = Date.now() + Number(tokenData.expires_in || 0) * 1000;
    if (tokenData.scope) session.googleScopes = parseScopes(tokenData.scope);
    await session.save();
    return tokenData.access_token;
  } catch (error) {
    session.destroy();
    const authError = new Error('auth_required');
    authError.statusCode = 401;
    throw authError;
  }
}

export function sendError(res, error, fallback = 'Internal server error') {
  return res.status(error.statusCode || 500).json({ error: error.message || fallback });
}
