import { useState, useEffect, useCallback } from 'react';
import { Settings } from './components/Settings';
import { EventInput } from './components/EventInput';
import { EventPreview } from './components/EventPreview';
import { listCalendars } from './lib/api';
import { loadSettings } from './lib/settings';
import type { CalendarSummary, ParsedEvent, SessionState, WebSettings } from './lib/types';

type AppView = 'input' | 'preview';
type AuthNotice = 'cancelled' | 'error' | null;

function getInitialAuthNotice(): AuthNotice {
  const authStatus = new URLSearchParams(window.location.search).get('auth');
  if (authStatus !== 'cancelled' && authStatus !== 'error') return null;

  const cleanUrl = `${window.location.pathname}${window.location.hash}`;
  window.history.replaceState({}, '', cleanUrl);
  return authStatus;
}

function useOnlineStatus() {
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  return online;
}

function OfflineBanner() {
  return (
    <div className="offline-banner" role="alert" aria-live="assertive">
      <div className="offline-banner__card">
        <span className="offline-banner__icon" aria-hidden="true">&#9888;</span>
        <h2 className="offline-banner__title">You're offline</h2>
        <p className="offline-banner__body">
          Calendur requires a network connection to parse events and access your
          calendar. Reconnect to continue.
        </p>
      </div>
    </div>
  );
}

function AuthNoticeBanner({ notice, onDismiss }: { notice: AuthNotice; onDismiss: () => void }) {
  if (!notice) return null;

  const message = notice === 'cancelled'
    ? 'Google connection was cancelled. You can try again whenever you are ready.'
    : 'Google connection could not be completed. Try connecting again.';

  return (
    <div className="auth-notice" role="alert" aria-live="polite">
      <span>{message}</span>
      <button className="auth-notice__dismiss" type="button" onClick={onDismiss}>
        Dismiss
      </button>
    </div>
  );
}

export default function App() {
  const online = useOnlineStatus();
  const [session, setSession] = useState<SessionState>({ connected: false });
  const [view, setView] = useState<AppView>('input');
  const [parsedEvent, setParsedEvent] = useState<ParsedEvent | null>(null);
  const [settings, setSettings] = useState<WebSettings>(() => loadSettings());
  const [calendars, setCalendars] = useState<CalendarSummary[]>([]);
  const [authNotice, setAuthNotice] = useState<AuthNotice>(() => getInitialAuthNotice());

  function handleParsed(event: ParsedEvent) {
    setParsedEvent(event);
    setSettings(loadSettings());
    setView('preview');
  }

  function handleBack() {
    setParsedEvent(null);
    setView('input');
  }

  const handleSessionChange = useCallback((nextSession: SessionState) => {
    setSession(nextSession);
    if (nextSession.connected && 'scopes' in nextSession) {
      listCalendars()
        .then((result) => setCalendars(result.calendars))
        .catch(() => setCalendars([]));
    } else {
      setCalendars([]);
    }
  }, []);

  return (
    <>
      {!online && <OfflineBanner />}
      <main className="shell">
        {view === 'input' && (
          <>
            <section className="hero-card">
              <p className="eyebrow">Calendur</p>
              <h1>Mobile calendar setup</h1>
              <p className="lede">
                Connect Google Calendar, parse event text, review the details, and create it from your phone.
              </p>
              {!session.connected && (
                <div className="connect-required" role="status" aria-live="polite">
                  <strong>Connect required</strong>
                  <span>Protected calendar actions stay blocked until a Google session is active.</span>
                </div>
              )}
              <AuthNoticeBanner notice={authNotice} onDismiss={() => setAuthNotice(null)} />
            </section>
            <EventInput onParsed={handleParsed} />
            <Settings onSessionChange={handleSessionChange} />
          </>
        )}
        {view === 'preview' && parsedEvent && (
          <EventPreview
            parsedEvent={parsedEvent}
            settings={settings}
            calendars={calendars}
            onBack={handleBack}
          />
        )}
      </main>
    </>
  );
}
