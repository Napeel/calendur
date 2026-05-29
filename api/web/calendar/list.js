import { getGoogleAccessToken, sendError, setAuthHeaders } from '../_session.js';

function mapCalendar(calendar) {
  const summary = {
    id: calendar.id,
    summary: calendar.summary || calendar.id,
  };

  if (calendar.primary !== undefined) summary.primary = Boolean(calendar.primary);
  if (calendar.selected !== undefined) summary.selected = Boolean(calendar.selected);
  if (calendar.accessRole !== undefined) summary.accessRole = calendar.accessRole;
  if (calendar.backgroundColor !== undefined) summary.backgroundColor = calendar.backgroundColor;
  if (calendar.foregroundColor !== undefined) summary.foregroundColor = calendar.foregroundColor;

  return summary;
}

async function readGoogleCalendarList(accessToken) {
  const response = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const error = new Error('Google Calendar list request failed');
    error.statusCode = response.status;
    throw error;
  }

  return response.json();
}

export default async function handler(req, res) {
  setAuthHeaders(res, 'GET, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const accessToken = await getGoogleAccessToken(req, res);
    const data = await readGoogleCalendarList(accessToken);
    const calendars = Array.isArray(data.items) ? data.items.map(mapCalendar) : [];
    return res.status(200).json({ calendars });
  } catch (error) {
    return sendError(res, error);
  }
}
