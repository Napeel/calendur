import { getGoogleAccessToken, sendError, setAuthHeaders } from '../_session.js';

const MAX_REMINDERS = 5;

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function requireString(value, fieldName) {
  if (typeof value !== 'string' || !value.trim()) {
    const error = new Error(`Missing required field: ${fieldName}`);
    error.statusCode = 400;
    throw error;
  }

  return value.trim();
}

function readDateTime(value, fieldName) {
  if (!isObject(value)) {
    const error = new Error(`Missing required field: ${fieldName}`);
    error.statusCode = 400;
    throw error;
  }

  return {
    dateTime: requireString(value.dateTime, `${fieldName}.dateTime`),
    timeZone: requireString(value.timeZone, `${fieldName}.timeZone`),
  };
}

function readReminders(value) {
  if (!isObject(value) || value.useDefault !== false || !Array.isArray(value.overrides)) {
    const error = new Error('Missing required field: reminders');
    error.statusCode = 400;
    throw error;
  }

  return {
    useDefault: false,
    overrides: value.overrides.slice(0, MAX_REMINDERS).map((reminder) => {
      if (
        !isObject(reminder) ||
        reminder.method !== 'popup' ||
        !Number.isInteger(reminder.minutes) ||
        reminder.minutes < 0 ||
        reminder.minutes > 40320
      ) {
        const error = new Error('Invalid reminder override');
        error.statusCode = 400;
        throw error;
      }

      return { method: 'popup', minutes: reminder.minutes };
    }),
  };
}

function readOptionalString(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function readRecurrence(value) {
  if (!Array.isArray(value)) return undefined;

  const recurrence = value.filter((item) => typeof item === 'string' && item.trim()).map((item) => item.trim());
  return recurrence.length > 0 ? recurrence : undefined;
}

function buildGoogleEvent(payload) {
  const event = {
    summary: requireString(payload.summary, 'summary'),
    start: readDateTime(payload.start, 'start'),
    end: readDateTime(payload.end, 'end'),
    reminders: readReminders(payload.reminders),
  };

  const location = readOptionalString(payload.location);
  if (location) event.location = location;

  const description = readOptionalString(payload.description);
  if (description) event.description = description;

  const recurrence = readRecurrence(payload.recurrence);
  if (recurrence) event.recurrence = recurrence;

  return event;
}

function googleErrorMessage(status) {
  if (status === 401) return 'auth_required';
  if (status === 403) return 'Google Calendar permission missing for the selected calendar.';
  if (status === 404) return 'Selected calendar was not found.';
  return 'Google Calendar event create request failed.';
}

async function insertGoogleEvent(accessToken, calendarId, event) {
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    },
  );

  if (!response.ok) {
    const error = new Error(googleErrorMessage(response.status));
    error.statusCode = response.status === 401 ? 401 : 502;
    throw error;
  }

  return response.json();
}

function mapCreatedEvent(created, calendarId) {
  return {
    id: created.id || '',
    htmlLink: created.htmlLink || '',
    summary: created.summary || '',
    calendarId,
    start: created.start?.dateTime
      ? { dateTime: created.start.dateTime, timeZone: created.start.timeZone || '' }
      : undefined,
    end: created.end?.dateTime
      ? { dateTime: created.end.dateTime, timeZone: created.end.timeZone || '' }
      : undefined,
  };
}

export default async function handler(req, res) {
  setAuthHeaders(res, 'POST, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    if (!isObject(req.body)) {
      return res.status(400).json({ error: 'Request body must be JSON' });
    }

    const calendarId = requireString(req.body.calendarId, 'calendarId');
    const event = buildGoogleEvent(req.body);
    const accessToken = await getGoogleAccessToken(req, res);
    const created = await insertGoogleEvent(accessToken, calendarId, event);
    return res.status(200).json(mapCreatedEvent(created, calendarId));
  } catch (error) {
    return sendError(res, error);
  }
}
