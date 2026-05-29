import { useEffect, useMemo, useState } from 'react';
import { getSession, isApiClientError, listCalendars, logout } from '../lib/api';
import { DURATION_OPTIONS, loadSettings, REMINDER_LIMIT, saveSettings } from '../lib/settings';
import {
  DEFAULT_WEB_SETTINGS,
  REMINDER_OPTIONS,
  type CalendarSummary,
  type Reminder,
  type SessionState,
  type WebSettings,
} from '../lib/types';

interface SettingsProps {
  onSessionChange?: (session: SessionState) => void;
}

const disconnectedSession: SessionState = { connected: false };

function getAccountInitial(session: SessionState) {
  if (!session.connected) return '?';
  const source = session.user?.name || session.user?.email || '?';
  return source.slice(0, 1).toUpperCase();
}

function formatDuration(minutes: number) {
  if (minutes === 60) return '1 hour';
  if (minutes === 120) return '2 hours';
  return `${minutes} min`;
}

function getErrorMessage(error: unknown) {
  if (isApiClientError(error)) return error.message;
  return 'Calendur could not complete that request. Try again.';
}

export function Settings({ onSessionChange }: SettingsProps) {
  const [settings, setSettings] = useState<WebSettings>(() => loadSettings());
  const [session, setSession] = useState<SessionState>(disconnectedSession);
  const [calendars, setCalendars] = useState<CalendarSummary[]>([]);
  const [status, setStatus] = useState('Loading connection status...');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;

    getSession()
      .then((nextSession) => {
        if (!active) return;
        setSession(nextSession);
        onSessionChange?.(nextSession);
        setStatus(nextSession.connected ? 'Connected to Google Calendar.' : 'Connect Google Calendar to load calendars.');
        if (!nextSession.connected) setCalendars([]);
      })
      .catch((requestError) => {
        if (!active) return;
        setSession(disconnectedSession);
        onSessionChange?.(disconnectedSession);
        setCalendars([]);
        setError(getErrorMessage(requestError));
        setStatus('Connection status unavailable.');
      });

    return () => {
      active = false;
    };
  }, [onSessionChange]);

  useEffect(() => {
    if (!session.connected) return;

    let active = true;
    setStatus('Loading calendars...');
    setError(null);

    listCalendars()
      .then((result) => {
        if (!active) return;
        setCalendars(result.calendars);
        setStatus(result.calendars.length > 0 ? 'Calendar list loaded.' : 'No calendars were returned.');
      })
      .catch((requestError) => {
        if (!active) return;
        setCalendars([]);
        setError(getErrorMessage(requestError));
        setStatus('Connect Google Calendar to load calendars.');
      });

    return () => {
      active = false;
    };
  }, [session]);

  const calendarOptions = useMemo(() => {
    if (calendars.length === 0) return [{ id: DEFAULT_WEB_SETTINGS.defaultCalendarId, summary: 'Primary' }];
    return calendars;
  }, [calendars]);

  const reminderCount = settings.defaultReminders.length;
  const selectedCalendarExists = calendarOptions.some((calendar) => calendar.id === settings.defaultCalendarId);

  function updateSettings(nextSettings: WebSettings) {
    setSettings(saveSettings(nextSettings));
    setSaving(true);
    window.setTimeout(() => setSaving(false), 1200);
  }

  function updateReminder(index: number, minutes: number) {
    const nextReminders = settings.defaultReminders.map((reminder, reminderIndex) =>
      reminderIndex === index ? { method: 'popup' as const, minutes } : reminder,
    );
    updateSettings({ ...settings, defaultReminders: nextReminders });
  }

  function addReminder() {
    if (reminderCount >= REMINDER_LIMIT) return;
    updateSettings({
      ...settings,
      defaultReminders: [...settings.defaultReminders, { method: 'popup', minutes: 10 }],
    });
  }

  function removeReminder(index: number) {
    const nextReminders = settings.defaultReminders.filter((_, reminderIndex) => reminderIndex !== index);
    updateSettings({
      ...settings,
      defaultReminders: nextReminders.length > 0 ? nextReminders : [{ method: 'popup', minutes: 10 }],
    });
  }

  async function handleDisconnect() {
    setError(null);
    setStatus('Disconnecting...');
    try {
      const nextSession = await logout();
      setSession(nextSession);
      onSessionChange?.(nextSession);
      setCalendars([]);
      setStatus('Disconnected. Calendar actions require reconnecting.');
    } catch (requestError) {
      setError(getErrorMessage(requestError));
      setStatus('Disconnect failed.');
    }
  }

  return (
    <section className="settings-card" aria-labelledby="settings-title">
      <div className="section-header">
        <p className="eyebrow">Settings</p>
        <h2 id="settings-title">Calendar preferences</h2>
        <p className="section-copy">Saved on this device only. Google token material stays server-side.</p>
      </div>

      <div className="settings-section">
        <div className="field-label">Google Account</div>
        <div className="account-row">
          <div className="account-avatar" aria-hidden="true">{getAccountInitial(session)}</div>
          <div className="account-info">
            <div className="account-email">
              {session.connected ? session.user?.email || session.user?.name || 'Connected account' : 'Not connected'}
            </div>
            <div className={session.connected ? 'account-status' : 'account-status disconnected'}>
              {session.connected ? 'Connected' : 'Connect to load calendars'}
            </div>
          </div>
          {session.connected ? (
            <button className="secondary-button" type="button" onClick={handleDisconnect}>Disconnect</button>
          ) : (
            <a className="primary-button compact" href="/api/web/auth/start">Connect</a>
          )}
        </div>
      </div>

      <div className="settings-section">
        <label className="field-label" htmlFor="default-calendar">Default Calendar</label>
        <select
          id="default-calendar"
          value={selectedCalendarExists ? settings.defaultCalendarId : DEFAULT_WEB_SETTINGS.defaultCalendarId}
          disabled={!session.connected}
          onChange={(event) => updateSettings({ ...settings, defaultCalendarId: event.target.value })}
        >
          {calendarOptions.map((calendar) => (
            <option key={calendar.id} value={calendar.id}>
              {calendar.summary}{calendar.primary ? ' (Primary)' : ''}
            </option>
          ))}
        </select>
        <p className="field-hint">Events will use this calendar unless changed during preview.</p>
      </div>

      <div className="settings-section">
        <div className="field-label">Default Event Duration</div>
        <div className="chips" role="group" aria-label="Default event duration">
          {DURATION_OPTIONS.map((duration) => (
            <button
              key={duration}
              className={settings.defaultDuration === duration ? 'chip active' : 'chip'}
              type="button"
              onClick={() => updateSettings({ ...settings, defaultDuration: duration })}
            >
              {formatDuration(duration)}
            </button>
          ))}
        </div>
        <p className="field-hint">Used when no end time or duration is mentioned.</p>
      </div>

      <div className="settings-section">
        <div className="field-label">Default Reminders</div>
        <div className="reminders-list">
          {settings.defaultReminders.map((reminder: Reminder, index) => (
            <div className="reminder-row" key={`${reminder.method}-${index}`}>
              <select
                aria-label={`Reminder ${index + 1}`}
                value={reminder.minutes}
                onChange={(event) => updateReminder(index, Number(event.target.value))}
              >
                {REMINDER_OPTIONS.map((option) => (
                  <option key={option.minutes} value={option.minutes}>{option.label}</option>
                ))}
              </select>
              <button className="icon-button" type="button" aria-label="Remove reminder" onClick={() => removeReminder(index)}>
                &times;
              </button>
            </div>
          ))}
        </div>
        {reminderCount < REMINDER_LIMIT && (
          <button className="link-button" type="button" onClick={addReminder}>+ Add reminder</button>
        )}
        <p className="field-hint">Up to 5 popup reminders per event. Applied to all new events.</p>
      </div>

      <div className="settings-status" role="status" aria-live="polite">
        <span>{saving ? 'Settings saved.' : status}</span>
      </div>
      {error && <div className="settings-error" role="alert">{error}</div>}
    </section>
  );
}
