# Learnings: mobile-app-pwa

## 2026-05-28 Start Work Context
- Existing project is a Chrome extension plus Vercel APIs. Preserve extension behavior while adding PWA alongside it.
- Current package has no scripts and only `@anthropic-ai/sdk` dependency.
- Direct grep confirmed extension-only assumptions: `chrome.storage`, `chrome.identity.launchWebAuthFlow`, user-configured `backendUrl`, direct frontend calls to Google Calendar API from extension context.
- PWA must use same-origin `/api/*` calls and must not expose a Backend URL setting.
- PWA auth/session work is highest risk: web OAuth session must be separate from extension auth routes.

## 2026-05-28 Research: Extension Patterns
- Popup flow is `input` → `preview` → `confirm`, controlled by `states`, `showState(name)`, `parseEvent()`, `populatePreview()`, and `createEvent()` in `extension/popup.js`.
- Parsed event schema from `api/parse.js`: `title`, `start`, `end`, `timezone`, `location`, `recurrence`, `description`.
- Calendar create payload from extension uses `summary`, `start.dateTime/timeZone`, `end.dateTime/timeZone`, `reminders.useDefault=false`, optional `location`, `recurrence`, `description`.
- Settings keys: `backendUrl`, `defaultCalendarId`, `defaultDuration`, `defaultReminders`; PWA must omit `backendUrl` while preserving other defaults.
- Existing reminder UI caps reminders at 5 and stores `{ method: 'popup', minutes }`.

## 2026-05-28 Research: Backend APIs
- Existing API handlers export `default async function handler(req, res)`.
- Existing endpoints: `/api/parse`, `/api/auth/token`, `/api/auth/refresh` support `POST` and `OPTIONS`, return JSON `{ error: string }` for failures.
- Existing CORS allows `Access-Control-Allow-Origin: *`, methods `POST, OPTIONS`, and header `Content-Type`.
- `/api/parse` request: `{ text, timezone, currentDate, defaultDuration }`; validates text string <= 2000 chars and rate-limits 10 req/min/IP in memory.
- Current Google token exchange/refresh routes POST JSON to `https://oauth2.googleapis.com/token`; verify if new web routes should use `application/x-www-form-urlencoded` per Google docs.

## 2026-05-28 Research: PWA/Vercel
- Vite build should output `dist/`; Vercel auto-detects Vite and can serve root static app plus root `/api` serverless functions.
- Avoid blanket SPA rewrites that capture `/api/*`.
- PWA manifest minimum: `name`, `short_name`, `description`, matching `theme_color`, and 192/512 icons.
- iOS metadata: `apple-touch-icon`, `apple-mobile-web-app-capable`, `apple-mobile-web-app-title`, `apple-mobile-web-app-status-bar-style`, `theme-color`.

## 2026-05-28 Research: Auth Sessions
- Recommended web auth: Google web-server authorization-code flow, exact redirect URI, offline access, refresh token server-side only.
- Recommended session: encrypted HttpOnly cookie with strong secret >=32 chars; default attributes `HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/`.
- Keep Calendar API access server-side; never send `client_secret`, auth code, access token, or refresh token to browser.

## 2026-05-28 Task 3: Web Auth Session Backend
- Added separate PWA routes under `/api/web/auth/*`; extension routes `/api/auth/token` and `/api/auth/refresh` were left unchanged.
- `iron-session` works with the repo's plain Vercel handler shape via `getIronSession(req, res, options)`.
- Web OAuth uses Google web-server flow with form-encoded token exchange, state nonce, `access_type=offline`, `prompt=consent`, calendar scope, and user email scope.
- Public session JSON is intentionally limited to `connected`, `user`, and `scopes`; token material stays in server-side code paths and the encrypted HttpOnly cookie.
- Production session cookie verification confirmed `HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/`, and `Max-Age=2592000` with dummy handler invocation.

## 2026-05-28 Task 1 Foundation
- Vite + React + TypeScript build works with root `index.html` and same-origin manifest linking; `dist/` is produced by `vite build`.
- Extension preservation check for `extension/manifest.json`, `extension/popup.js`, `extension/options.js`, and `extension/background.js` returned no diff.
- LSP diagnostics for JSON files were blocked by a missing `biome` server in this environment, so build output was used as the main validation for the new scaffold files.

## 2026-05-28 Task 7: iPhone PWA Install Polish
- iOS Safari supports SVG `apple-touch-icon` since iOS 15; for a personal PWA on modern iPhone, SVG reference is sufficient. A 180x180 PNG would improve pre-iOS-15 compatibility.
- `apple-mobile-web-app-status-bar-style: black-translucent` pairs with `viewport-fit=cover` and `env(safe-area-inset-*)` CSS to let content extend behind the notch/status bar while remaining readable via padding.
- `100dvh` (dynamic viewport height) is preferable to `100vh` for mobile PWA shells; it accounts for browser chrome hiding/showing.
- No service worker is the simplest acceptable path for an online-only PWA. Without a SW, there is zero risk of API response caching. `vite-plugin-pwa` was not added.
- `navigator.onLine` + `online`/`offline` window events provide reliable online/offline detection. The offline banner is a full-screen blocking overlay with `role="alert"` and `aria-live="assertive"`.
- Touch target minimum of 44px matches Apple HIG recommendations and is applied globally to interactive elements.
- `-webkit-tap-highlight-color: transparent` removes the default tap highlight on iOS Safari for a cleaner PWA feel.
- Manifest `categories` field and `maskable` icon purpose were added for better install appearance on Android/iOS; these are optional but improve the Add-to-Home-Screen experience.

## 2026-05-28 Task 2: Web Contracts and API Client
- Added frontend contracts under `src/lib/types.ts` for parsed events, web session state, calendar summaries, PWA settings, popup reminders, calendar create payloads/results, and normalized app errors.
- Added same-origin client functions under `src/lib/api.ts` for `/api/parse`, `/api/web/auth/session`, `/api/web/auth/logout`, `/api/web/calendar/list`, and `/api/web/calendar/create`; no Backend URL setting or absolute API URL is used.
- API client maps offline detection to `network_unavailable`, failed fetches to `backend_unavailable`, session failures to `auth_required`, parse route failures to `parse_failed`, and calendar route failures to `google_failed` while preserving server `{ error }` messages when available.

## 2026-05-28 Task 4: Settings Persistence and Calendar List
- Added `/api/web/calendar/list` as a server-side Google Calendar List proxy that uses `getGoogleAccessToken(req, res)` and returns only mapped calendar summaries.
- PWA settings persistence stores only `defaultCalendarId`, `defaultDuration`, and `defaultReminders` in `localStorage`; token/session material remains server-side in the HttpOnly session.
- PWA settings intentionally omit the extension-only `backendUrl`/Backend URL setting while preserving duration choices `15/30/60/120`, default duration `30`, popup reminder default `10`, and reminder cap `5`.
- The settings UI only attempts protected calendar loading after public session state reports `connected: true`; disconnected users see connect-required state instead.

## 2026-05-28 Task 5: Parse and Editable Preview Flow
- Extension popup flow maps cleanly to React component state machine: `input` view → `preview` view, with `App.tsx` holding the view state and parsed event.
- `parseEvent()` from `src/lib/api.ts` requires `text`, `timezone`, `currentDate`, and `defaultDuration` in the request body; the PWA gets timezone via `Intl.DateTimeFormat().resolvedOptions().timeZone` and current date via `toLocaleString('sv-SE')` (same pattern as extension).
- Parsed event `start`/`end` are ISO strings like `2026-05-29T12:00`; splitting on `T` and taking first 5 chars of the time part gives `date` and `time` input values.
- When parsed event lacks an end time (same-day events with only start), `computeEndTime(startIso, defaultDuration)` derives end from start + settings default duration.
- Settings defaults apply at parse-success time: `loadSettings()` is re-read, `defaultCalendarId` pre-selects the calendar, `defaultReminders` populate the reminder list, and `defaultDuration` fills missing end times.
- Recurrence from parse output is `string[]` of RRULE strings; the preview humanizes only the first one (matching extension behavior) and shows it as read-only.
- Timezone is displayed as read-only text since the parse output includes it and users don't typically change timezones on mobile.
- The "Create Event" button in preview is disabled with a hint message because Task 6 owns the create flow; this avoids a dead button that looks broken.
- Calendar list is loaded in `App.tsx` on session connect and passed down to `EventPreview`, avoiding a duplicate API call inside the preview component.
- Playwright QA is blocked in this environment (Chrome not installed), same as Task 4; `.md` evidence used as fallback.

## 2026-05-28 Task 6: Web Calendar Event Creation
- Added `/api/web/calendar/create` as a server-side Google Calendar Events insert proxy; it uses `getGoogleAccessToken(req, res)` so expired/revoked refresh tokens clear the encrypted web session and surface `auth_required`.
- The create route accepts the existing `CreateEventPayload` contract and forwards only Google event fields needed for parity: `summary`, timed `start`/`end` with `timeZone`, `reminders.useDefault=false`, optional `location`, `recurrence`, and `description`.
- The create route returns only sanitized confirmation fields (`id`, `htmlLink`, `summary`, `calendarId`, `start`, `end`) and does not return token or secret material.
- `EventPreview` now maps edited preview state into the typed `createEvent()` client payload, respects the selected calendar/default fallback from Task 4, shows loading/error states, and renders a success state with an open-event link when Google returns `htmlLink`.
- `src/lib/api.ts` now maps calendar route 502 responses to `google_failed` before generic backend failures so user-facing Google/API failures are distinct from network/backend unavailability.

## 2026-05-28 Task 8: Deployment and Manual QA Evidence
- `npm run build` passes locally and produces `dist/index.html`, `dist/assets/index-BXevjl-V.css`, and `dist/assets/index-Db8IH2RG.js`.
- Current `vercel.json` has no rewrites, so the root Vite build can be served alongside Vercel `/api/*` functions without shadowing APIs.
- PWA deployment requires Vercel env vars `ANTHROPIC_API_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `SESSION_SECRET`; `_session.js` enforces `SESSION_SECRET` length >= 32 characters.
- Web Google OAuth callback is same-origin and host-derived: `https://<deployment-host>/api/web/auth/callback`.
- Verification search across `src`, `public`, and `index.html` found no PWA Backend URL setting or hardcoded backend host; remaining Backend URL docs are extension-only.

## 2026-05-29 Final Wave Fixes
- Final-wave blockers were fixed by making `EventPreview` treat start and end dates separately, so overnight and multi-day parsed events submit distinct `start.dateTime` and `end.dateTime` values.
- `EventPreview` now initializes editable notes from `parsedEvent.description || ''` and sends only the trimmed edited notes as the calendar event `description`.
- `App.handleSessionChange` is memoized with `useCallback`, which keeps `Settings` from rerunning its initial session-load effect solely because the parent callback identity changed.
- Web OAuth callback cancellation/errors now redirect to the PWA root with sanitized `auth=cancelled` or `auth=error` status, and the PWA renders a dismissible recovery message without reflecting provider error text.
