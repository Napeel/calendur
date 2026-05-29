export type ReminderMethod = 'popup';

export type DefaultDurationMinutes = 15 | 30 | 60 | 120;

export type AppErrorCode =
  | 'network_unavailable'
  | 'backend_unavailable'
  | 'auth_required'
  | 'parse_failed'
  | 'google_failed'
  | 'validation_failed'
  | 'rate_limited'
  | 'method_not_allowed'
  | 'unknown';

export interface AppError {
  code: AppErrorCode;
  message: string;
  status?: number;
  source?: 'network' | 'backend' | 'auth' | 'parse' | 'google';
}

export interface ParsedEvent {
  title: string;
  start: string;
  end: string;
  timezone: string;
  location: string | null;
  recurrence: string[] | null;
  description: string | null;
}

export interface ParseEventRequest {
  text: string;
  timezone: string;
  currentDate: string;
  defaultDuration: number;
}

export interface SessionUser {
  email: string | null;
  name: string | null;
}

export type SessionState =
  | {
      connected: false;
      user?: null;
      scopes?: string[];
    }
  | {
      connected: true;
      user: SessionUser | null;
      scopes: string[];
    };

export interface CalendarSummary {
  id: string;
  summary: string;
  primary?: boolean;
  selected?: boolean;
  accessRole?: string;
  backgroundColor?: string;
  foregroundColor?: string;
}

export interface CalendarListResult {
  calendars: CalendarSummary[];
}

export interface Reminder {
  method: ReminderMethod;
  minutes: number;
}

export interface CalendarEventDateTime {
  dateTime: string;
  timeZone: string;
}

export interface CalendarEventReminders {
  useDefault: false;
  overrides: Reminder[];
}

export interface CreateEventPayload {
  calendarId: string;
  summary: string;
  start: CalendarEventDateTime;
  end: CalendarEventDateTime;
  reminders: CalendarEventReminders;
  location?: string;
  recurrence?: string[];
  description?: string;
}

export interface CreateEventResult {
  id: string;
  htmlLink: string;
  summary: string;
  calendarId: string;
  start?: CalendarEventDateTime;
  end?: CalendarEventDateTime;
}

export interface WebSettings {
  defaultCalendarId: string;
  defaultDuration: DefaultDurationMinutes;
  defaultReminders: Reminder[];
}

export const DEFAULT_WEB_SETTINGS: WebSettings = {
  defaultCalendarId: 'primary',
  defaultDuration: 30,
  defaultReminders: [{ method: 'popup', minutes: 10 }],
};

export const REMINDER_OPTIONS = [
  { label: '5 minutes before', minutes: 5 },
  { label: '10 minutes before', minutes: 10 },
  { label: '15 minutes before', minutes: 15 },
  { label: '30 minutes before', minutes: 30 },
  { label: '1 hour before', minutes: 60 },
  { label: '2 hours before', minutes: 120 },
  { label: '1 day before', minutes: 1440 },
  { label: '2 days before', minutes: 2880 },
] as const;
