# Task 8: Failure Matrix Evidence

Date: 2026-05-28

## Local Verification Basis

- `npm run build` passed with Vite output in `dist/`.
- Source search for user-facing Backend URL leaks in `src`, `public`, and `index.html` found no PWA Backend URL setting or hardcoded backend host.
- Failure-state source check covered `src/lib/api.ts`, `src/App.tsx`, `src/components/EventInput.tsx`, `src/components/EventPreview.tsx`, `src/components/Settings.tsx`, `api/web/_session.js`, `api/web/auth/*`, `api/web/calendar/*`, and `api/parse.js`.
- Playwright runtime is blocked by missing local Chrome/Chromium, so browser/device rows below distinguish source/build verification from deployed iPhone execution.

## Matrix

| Failure | Verified locally now | Expected user-facing behavior | Requires deployed credentials / real iPhone |
|---|---|---|---|
| Auth cancel | Source route check: `/api/web/auth/callback` returns a 400 error when Google redirects back with `error`; route requires `code` and `state` for success. | Deployed browser should not expose tokens or secrets. User should return to app and reconnect. Current source needs real deployed OAuth cancellation to confirm exact UX. | Yes: Google OAuth consent screen and deployed callback URI. |
| Disconnected session | Source check: `getSession()` returns `{ connected: false }`; Settings shows `Not connected`, `Connect to load calendars`, and Connect link to `/api/web/auth/start`; main UI shows `Connect required`. | Calendar selection is disabled until connected; protected calendar actions require reconnecting. | iPhone confirmation requires deployed session state. |
| Offline/disconnected network | Source check: `navigator.onLine === false` maps API calls to `network_unavailable`; `OfflineBanner` displays `You're offline` and explains reconnect requirement. | PWA blocks online-only workflow with a clear offline message and recovery by reconnecting. | Real iPhone airplane-mode/Home-Screen verification. |
| Backend parse failure | Source check: `/api/parse` can return 400/429/500 JSON errors; API client maps parse route failures to `parse_failed` or server message; `EventInput` renders retryable alert. | User sees parse error with `Try again`; no blank screen or raw token material. | Live Anthropic/backend failure simulation on deployed URL. |
| Expired/revoked session | Source check: `getGoogleAccessToken()` destroys session and throws `auth_required` when refresh fails; session route returns 401 `auth_required`; create flow displays `Reconnect Google Calendar before creating this event.` | User is asked to reconnect and can recover via Google connect. | Requires deployed session cookie and revoked/expired Google refresh token. |
| No calendars | Source check: calendar list route returns sanitized `{ calendars }`; Settings displays `No calendars were returned.` when list is empty. | User gets a clear status instead of a crash; default primary fallback remains visible in preview. | Requires Google account or mocked deployed Calendar API response with no calendars. |
| Calendar permission failure | Source check: create route maps Google 403 to `Google Calendar permission missing for the selected calendar.` and the API client displays Google/server error in preview. | User sees a recoverable Google permission message with retry path; no stack trace or token output. | Requires selected calendar without write permission or insufficient OAuth grant. |
| Backend unavailable | Source check: failed `fetch` maps to `backend_unavailable`; create/parse/settings surfaces `Calendur could not reach the backend. Try again in a moment.` | User gets a backend-unavailable message and can retry after service recovery. | Can be verified against deployed URL by blocking network/API or during outage. |

## Sensitive Data Check

No evidence includes Anthropic API keys, Google client secrets, refresh tokens, access tokens, auth codes, or session secrets.

## Result

Failure handling is documented and source/build verified locally. Runtime confirmation for OAuth cancel, iPhone offline mode, revoked sessions, empty calendars, and Google permission failures remains dependent on a deployed Vercel project with real Google OAuth credentials and iPhone access.
