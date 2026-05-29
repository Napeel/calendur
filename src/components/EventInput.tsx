import { useState, useRef } from 'react';
import { parseEvent, isApiClientError } from '../lib/api';
import { loadSettings } from '../lib/settings';
import type { ParsedEvent } from '../lib/types';

interface EventInputProps {
  onParsed: (event: ParsedEvent) => void;
}

function getErrorMessage(error: unknown): string {
  if (isApiClientError(error)) return error.message;
  if (error instanceof Error) return error.message;
  return 'Calendur could not parse that event. Try rephrasing it.';
}

export function EventInput({ onParsed }: EventInputProps) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emptyWarning, setEmptyWarning] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  async function handleParse() {
    const trimmed = text.trim();
    if (!trimmed) {
      setEmptyWarning(true);
      textareaRef.current?.focus();
      return;
    }

    setEmptyWarning(false);
    setError(null);
    setLoading(true);

    try {
      const settings = loadSettings();
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const currentDate = new Date()
        .toLocaleString('sv-SE', { timeZone: timezone })
        .replace(' ', 'T');

      const parsed = await parseEvent({
        text: trimmed,
        timezone,
        currentDate,
        defaultDuration: settings.defaultDuration,
      });

      onParsed(parsed);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleParse();
    }
  }

  function handleTextChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setText(e.target.value);
    if (emptyWarning && e.target.value.trim()) {
      setEmptyWarning(false);
    }
  }

  return (
    <section className="event-input-card" aria-labelledby="input-title">
      <div className="section-header">
        <p className="eyebrow">New Event</p>
        <h2 id="input-title">Describe your event</h2>
        <p className="section-copy">
          Type naturally — Calendur parses the details.
        </p>
      </div>

      <textarea
        ref={textareaRef}
        className={`event-textarea${emptyWarning ? ' event-textarea--invalid' : ''}`}
        value={text}
        onChange={handleTextChange}
        onKeyDown={handleKeyDown}
        placeholder="e.g. Lunch with Sarah tomorrow at noon at Blue Bottle Coffee for 90 minutes"
        rows={3}
        disabled={loading}
        aria-label="Event description"
      />

      {emptyWarning && (
        <p className="input-warning" role="alert">
          Enter an event description to parse.
        </p>
      )}

      <button
        className="primary-button parse-button"
        type="button"
        onClick={handleParse}
        disabled={loading}
      >
        {loading ? (
          <span className="parse-loading">
            <span className="spinner" aria-hidden="true" />
            Parsing...
          </span>
        ) : (
          'Parse Event'
        )}
      </button>

      {error && (
        <div className="parse-error" role="alert">
          <p className="parse-error__message">{error}</p>
          <button
            className="parse-error__retry"
            type="button"
            onClick={handleParse}
            disabled={loading}
          >
            Try again
          </button>
        </div>
      )}
    </section>
  );
}
