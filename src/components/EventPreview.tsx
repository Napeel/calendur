import { useState } from 'react';
import { createEvent, isApiClientError } from '../lib/api';
import { DEFAULT_WEB_SETTINGS, REMINDER_OPTIONS } from '../lib/types';
import type { CalendarSummary, CreateEventPayload, CreateEventResult, ParsedEvent, Reminder, WebSettings } from '../lib/types';

interface EventPreviewProps {
  parsedEvent: ParsedEvent;
  settings: WebSettings;
  calendars: CalendarSummary[];
  onBack: () => void;
}

function isoToDate(iso: string): string {
  return iso.split('T')[0] || '';
}

function isoToTime(iso: string): string {
  const timePart = iso.split('T')[1];
  if (!timePart) return '';
  return timePart.substring(0, 5);
}

function computeEndParts(startIso: string, durationMinutes: number): { date: string; time: string } {
  try {
    const start = new Date(startIso);
    if (isNaN(start.getTime())) return { date: '', time: '' };
    const end = new Date(start.getTime() + durationMinutes * 60_000);
    const yyyy = end.getFullYear();
    const month = String(end.getMonth() + 1).padStart(2, '0');
    const day = String(end.getDate()).padStart(2, '0');
    const hh = String(end.getHours()).padStart(2, '0');
    const mm = String(end.getMinutes()).padStart(2, '0');
    return { date: `${yyyy}-${month}-${day}`, time: `${hh}:${mm}` };
  } catch {
    return { date: '', time: '' };
  }
}

function formatDateHuman(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTimeHuman(timeStr: string): string {
  const [hourValue, minuteValue] = timeStr.split(':').map(Number);
  if (!Number.isFinite(hourValue) || !Number.isFinite(minuteValue)) return timeStr;
  const period = hourValue >= 12 ? 'PM' : 'AM';
  const hour = hourValue % 12 || 12;
  return `${hour}:${String(minuteValue).padStart(2, '0')} ${period}`;
}

function getCreateErrorMessage(error: unknown): string {
  if (!isApiClientError(error)) return 'Calendur could not create the event. Try again.';

  if (error.code === 'auth_required') return 'Reconnect Google Calendar before creating this event.';
  if (error.code === 'network_unavailable') return error.message;
  if (error.code === 'backend_unavailable') return error.message;
  if (error.code === 'validation_failed') return error.message;
  if (error.code === 'google_failed') return error.message;
  return error.message;
}

function rruleToHuman(rrule: string): string {
  const parts = rrule.replace('RRULE:', '').split(';');
  const map: Record<string, string> = {};
  parts.forEach((p) => {
    const [k, v] = p.split('=');
    if (k && v) map[k] = v;
  });

  const dayNames: Record<string, string> = {
    MO: 'Monday', TU: 'Tuesday', WE: 'Wednesday',
    TH: 'Thursday', FR: 'Friday', SA: 'Saturday', SU: 'Sunday',
  };
  const freqMap: Record<string, string> = {
    DAILY: 'Daily', WEEKLY: 'Weekly', MONTHLY: 'Monthly', YEARLY: 'Yearly',
  };

  let str = freqMap[map.FREQ] || map.FREQ || 'Recurring';
  if (map.BYDAY) {
    const days = map.BYDAY.split(',').map((d) => dayNames[d] || d).join(', ');
    str += ` on ${days}`;
  }
  if (map.COUNT) str += ` (${map.COUNT} times)`;
  if (map.UNTIL) str += ` until ${map.UNTIL}`;
  return str;
}

export function EventPreview({ parsedEvent, settings, calendars, onBack }: EventPreviewProps) {
  const initialStartDate = isoToDate(parsedEvent.start);
  const initialStartTime = isoToTime(parsedEvent.start);
  const fallbackEnd = computeEndParts(parsedEvent.start, settings.defaultDuration);
  const initialEndDate = isoToDate(parsedEvent.end) || fallbackEnd.date || initialStartDate;
  const initialEndTime = isoToTime(parsedEvent.end) || fallbackEnd.time;

  const [title, setTitle] = useState(parsedEvent.title || '');
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);
  const [startTime, setStartTime] = useState(initialStartTime);
  const [endTime, setEndTime] = useState(initialEndTime);
  const [location, setLocation] = useState(parsedEvent.location || '');
  const [description, setDescription] = useState(parsedEvent.description || '');
  const [calendarId, setCalendarId] = useState(settings.defaultCalendarId);
  const [reminders, setReminders] = useState<Reminder[]>(settings.defaultReminders);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createdEvent, setCreatedEvent] = useState<CreateEventResult | null>(null);

  const calendarOptions = calendars.length > 0
    ? calendars
    : [{ id: DEFAULT_WEB_SETTINGS.defaultCalendarId, summary: 'Primary' }];

  const selectedCalendarExists = calendarOptions.some((c) => c.id === calendarId);
  const selectedCalendarId = selectedCalendarExists ? calendarId : DEFAULT_WEB_SETTINGS.defaultCalendarId;

  function updateReminder(index: number, minutes: number) {
    setReminders((prev) =>
      prev.map((r, i) => (i === index ? { method: 'popup' as const, minutes } : r)),
    );
  }

  function removeReminder(index: number) {
    setReminders((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.length > 0 ? next : [{ method: 'popup' as const, minutes: 10 }];
    });
  }

  function addReminder() {
    if (reminders.length >= 5) return;
    setReminders((prev) => [...prev, { method: 'popup' as const, minutes: 10 }]);
  }

  function buildPayload(): CreateEventPayload {
    const trimmedTitle = title.trim();
    if (!trimmedTitle || !startDate || !startTime || !endDate || !endTime) {
      throw new Error('Title, start date/time, and end date/time are required.');
    }

    const timezone = parsedEvent.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    const payload: CreateEventPayload = {
      calendarId: selectedCalendarId,
      summary: trimmedTitle,
      start: {
        dateTime: `${startDate}T${startTime}:00`,
        timeZone: timezone,
      },
      end: {
        dateTime: `${endDate}T${endTime}:00`,
        timeZone: timezone,
      },
      reminders: {
        useDefault: false,
        overrides: reminders.slice(0, 5).map((reminder) => ({ method: 'popup', minutes: reminder.minutes })),
      },
    };

    const trimmedLocation = location.trim();
    const trimmedDescription = description.trim();
    if (trimmedLocation) payload.location = trimmedLocation;
    if (parsedEvent.recurrence && parsedEvent.recurrence.length > 0) payload.recurrence = parsedEvent.recurrence;
    if (trimmedDescription) payload.description = trimmedDescription;

    return payload;
  }

  async function handleCreate() {
    setCreateError(null);
    setCreating(true);

    try {
      const result = await createEvent(buildPayload());
      setCreatedEvent(result);
    } catch (error) {
      setCreateError(error instanceof Error && !isApiClientError(error) ? error.message : getCreateErrorMessage(error));
    } finally {
      setCreating(false);
    }
  }

  if (createdEvent) {
    return (
      <section className="event-preview-card" aria-labelledby="created-title">
        <div className="event-success" role="status" aria-live="polite">
          <p className="eyebrow">Created</p>
          <h2 id="created-title">Event added</h2>
          <p className="section-copy">{createdEvent.summary || title.trim()} was added to Google Calendar.</p>
          <div className="created-summary">
            <strong>{createdEvent.summary || title.trim()}</strong>
            <span>{formatDateHuman(startDate)} · {formatTimeHuman(startTime)} - {formatDateHuman(endDate)} · {formatTimeHuman(endTime)}</span>
          </div>
          <div className="preview-actions">
            <button className="secondary-button" type="button" onClick={onBack}>
              Add another
            </button>
            {createdEvent.htmlLink ? (
              <a className="primary-button" href={createdEvent.htmlLink} target="_blank" rel="noreferrer">
                Open event
              </a>
            ) : (
              <span className="settings-status">Google did not return an event link.</span>
            )}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="event-preview-card" aria-labelledby="preview-title">
      <div className="section-header">
        <p className="eyebrow">Preview</p>
        <h2 id="preview-title">Review &amp; edit</h2>
        <p className="section-copy">Adjust any field before creating the event.</p>
      </div>

      <div className="preview-fields">
        <div className="preview-field">
          <label className="field-label" htmlFor="preview-title-input">Title</label>
          <input
            id="preview-title-input"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="preview-field">
          <label className="field-label" htmlFor="preview-start-date-input">Start Date</label>
          <input
            id="preview-start-date-input"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>

        <div className="preview-field-row">
          <div className="preview-field">
            <label className="field-label" htmlFor="preview-start-input">Start</label>
            <input
              id="preview-start-input"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>
          <div className="preview-field">
            <label className="field-label" htmlFor="preview-end-input">End</label>
            <input
              id="preview-end-input"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>
        </div>

        <div className="preview-field">
          <label className="field-label" htmlFor="preview-end-date-input">End Date</label>
          <input
            id="preview-end-date-input"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        <div className="preview-field">
          <label className="field-label" htmlFor="preview-location-input">Location</label>
          <input
            id="preview-location-input"
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Add a location"
          />
        </div>

        <div className="preview-field">
          <label className="field-label" htmlFor="preview-description-input">Notes</label>
          <textarea
            id="preview-description-input"
            className="preview-textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add notes or details"
            rows={3}
          />
        </div>

        {parsedEvent.recurrence && parsedEvent.recurrence.length > 0 && (
          <div className="preview-field">
            <div className="field-label">Recurrence</div>
            <div className="preview-recurrence">
              {rruleToHuman(parsedEvent.recurrence[0])}
            </div>
          </div>
        )}

        {parsedEvent.timezone && (
          <div className="preview-field">
            <div className="field-label">Timezone</div>
            <div className="preview-readonly">{parsedEvent.timezone}</div>
          </div>
        )}

        <div className="preview-field">
          <label className="field-label" htmlFor="preview-calendar-input">Calendar</label>
          <select
            id="preview-calendar-input"
            value={selectedCalendarId}
            onChange={(e) => setCalendarId(e.target.value)}
          >
            {calendarOptions.map((cal) => (
              <option key={cal.id} value={cal.id}>
                {cal.summary}{cal.primary ? ' (Primary)' : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="preview-field">
          <div className="field-label">Reminders</div>
          <div className="reminders-list">
            {reminders.map((reminder, index) => (
              <div className="reminder-row" key={`${reminder.method}-${index}`}>
                <select
                  aria-label={`Reminder ${index + 1}`}
                  value={reminder.minutes}
                  onChange={(e) => updateReminder(index, Number(e.target.value))}
                >
                  {REMINDER_OPTIONS.map((option) => (
                    <option key={option.minutes} value={option.minutes}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <button
                  className="icon-button"
                  type="button"
                  aria-label="Remove reminder"
                  onClick={() => removeReminder(index)}
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
          {reminders.length < 5 && (
            <button className="link-button" type="button" onClick={addReminder}>
              + Add reminder
            </button>
          )}
        </div>
      </div>

      <div className="preview-actions">
        <button className="secondary-button" type="button" onClick={onBack} disabled={creating}>
          Back
        </button>
        <button className="primary-button" type="button" onClick={handleCreate} disabled={creating}>
          {creating ? <span className="parse-loading"><span className="spinner" aria-hidden="true" /> Creating...</span> : 'Create Event'}
        </button>
      </div>
      {createError && (
        <div className="parse-error" role="alert">
          <p className="parse-error__message">{createError}</p>
          <button className="parse-error__retry" type="button" onClick={handleCreate} disabled={creating}>
            Try again
          </button>
        </div>
      )}
    </section>
  );
}
