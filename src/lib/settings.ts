import {
  DEFAULT_WEB_SETTINGS,
  type DefaultDurationMinutes,
  type Reminder,
  type WebSettings,
} from './types';

const SETTINGS_KEY = 'calendur.web.settings';
const DURATION_OPTIONS: DefaultDurationMinutes[] = [15, 30, 60, 120];
const REMINDER_LIMIT = 5;

function isDuration(value: unknown): value is DefaultDurationMinutes {
  return typeof value === 'number' && DURATION_OPTIONS.includes(value as DefaultDurationMinutes);
}

function sanitizeReminders(value: unknown): Reminder[] {
  if (!Array.isArray(value)) return DEFAULT_WEB_SETTINGS.defaultReminders;

  const reminders = value
    .filter((reminder): reminder is Reminder => {
      if (!reminder || typeof reminder !== 'object') return false;
      const candidate = reminder as Partial<Reminder>;
      return candidate.method === 'popup' && typeof candidate.minutes === 'number' && Number.isFinite(candidate.minutes);
    })
    .slice(0, REMINDER_LIMIT)
    .map((reminder) => ({ method: 'popup' as const, minutes: reminder.minutes }));

  return reminders.length > 0 ? reminders : DEFAULT_WEB_SETTINGS.defaultReminders;
}

export function loadSettings(): WebSettings {
  if (typeof window === 'undefined') return DEFAULT_WEB_SETTINGS;

  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_WEB_SETTINGS;

    const parsed = JSON.parse(raw) as Partial<WebSettings>;
    return {
      defaultCalendarId:
        typeof parsed.defaultCalendarId === 'string' && parsed.defaultCalendarId.trim()
          ? parsed.defaultCalendarId
          : DEFAULT_WEB_SETTINGS.defaultCalendarId,
      defaultDuration: isDuration(parsed.defaultDuration)
        ? parsed.defaultDuration
        : DEFAULT_WEB_SETTINGS.defaultDuration,
      defaultReminders: sanitizeReminders(parsed.defaultReminders),
    };
  } catch {
    return DEFAULT_WEB_SETTINGS;
  }
}

export function saveSettings(settings: WebSettings): WebSettings {
  const sanitized: WebSettings = {
    defaultCalendarId: settings.defaultCalendarId || DEFAULT_WEB_SETTINGS.defaultCalendarId,
    defaultDuration: isDuration(settings.defaultDuration) ? settings.defaultDuration : DEFAULT_WEB_SETTINGS.defaultDuration,
    defaultReminders: sanitizeReminders(settings.defaultReminders),
  };

  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(sanitized));
  return sanitized;
}

export { DURATION_OPTIONS, REMINDER_LIMIT };
