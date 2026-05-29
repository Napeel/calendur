# Calendur iPhone-First PWA Adaptation

## TL;DR
> **Summary**: Add a mobile-first, iPhone-optimized PWA alongside the existing Chrome extension, preserving the current natural-language-to-Google-Calendar workflow while replacing extension-only APIs with web-compatible auth, session, storage, and UI patterns.
> **Deliverables**:
> - Vite + React + TypeScript PWA frontend served by the existing Vercel project
> - Web OAuth/session flow for Google Calendar access
> - Feature-parity mobile UI for parse → edit → create
> - Web-compatible settings persistence for calendar, duration, and reminders
> - iOS Safari/Add-to-Home-Screen PWA metadata and online-only error handling
> - Manual QA evidence for iPhone-first workflows
> **Effort**: Large
> **Parallel**: YES - 5 waves
> **Critical Path**: Task 1 → Task 2 → Task 3 → Task 4 → Task 6 → Task 8

## Context
### Original Request
User wants to adapt Calendur to a mobile app; a webapp is acceptable. It must preserve the same functionality on a phone, look minimal, use an up-to-date stack/approach, and be discussed before implementation.

### Interview Summary
- Target: iPhone-first mobile web/PWA.
- Audience: personal use on user's own phone.
- Distribution: Safari/Add-to-Home-Screen, not App Store/TestFlight.
- Network: online-only; show clear disconnected/backend/Google error states.
- Backend: use deployed Vercel backend automatically; no visible Backend URL setting.
- QA: manual QA only in first iteration; no automated tests/CI setup.
- Scope: preserve feature parity with the extension but do not build native wrappers, offline sync, full calendar management, push notifications, analytics, onboarding, or theming systems.

### Metis Review (gaps addressed)
- Added explicit guardrail to preserve the existing Chrome extension unchanged.
- Chose same Vercel project/root for the PWA and `/api/*` for backend APIs.
- Treated web OAuth/session persistence as the highest-risk implementation slice.
- Added edge/error cases for OAuth cancellation, expired sessions, no calendars, ambiguous parses, API failure, and network drops.
- Added iPhone Safari/Add-to-Home-Screen manual QA as required evidence.

## Work Objectives
### Core Objective
Create a minimal, iPhone-first PWA version of Calendur that lets the user connect Google Calendar, type natural-language event text, review/edit the parsed event, and create the event in Google Calendar with the same practical feature coverage as the Chrome extension.

### Deliverables
- New web app source under `src/` with Vite + React + TypeScript.
- PWA public assets/manifest/icons and iOS metadata.
- Backend web-auth/session API routes alongside existing extension API routes.
- Backend calendar proxy routes for listing calendars and creating events using web session credentials.
- Mobile settings for default calendar, duration, and reminders.
- Manual QA evidence under `.omo/evidence/`.

### Definition of Done (verifiable conditions with commands/manual evidence)
- `npm install` completes successfully after dependency updates.
- `npm run build` creates a production web build without errors.
- `vercel --prod` can deploy the PWA + existing APIs using configured environment variables.
- On iPhone Safari, deployed app can be added to Home Screen.
- From Home Screen launch, user can connect Google, parse an event, edit fields, create it, and open the created event link.
- Existing Chrome extension files remain present and extension setup path remains intact.

### Must Have
- Preserve extension behavior unless a task explicitly adds parallel web behavior.
- Minimal mobile UI only: input, parse/loading, editable preview, settings, connect/disconnect, success/error states.
- Online-only behavior with clear failure messages.
- Server-side handling for secrets and sensitive Google token material.
- Same-origin deployed backend usage; no user-facing Backend URL setting.

### Must NOT Have (guardrails, AI slop patterns, scope boundaries)
- Do not add Expo, React Native, Capacitor, Tauri, App Store, or TestFlight work.
- Do not add offline draft queues, background sync, or push notifications.
- Do not add automated test framework/CI in this iteration.
- Do not expose Anthropic API key, Google client secret, refresh tokens, or session secrets in frontend code.
- Do not turn Calendur into a full calendar browsing/editing app.
- Do not add dashboards, analytics, onboarding, accounts beyond Google connect, or a theme system.
- Do not remove or rewrite the existing Chrome extension as part of the PWA work.

## Verification Strategy
> NO AUTOMATED TEST/CI SETUP - first iteration uses build checks plus executor-run manual/browser/device QA evidence.
- Test decision: Manual QA only for first iteration; use Vite build command plus Playwright-assisted browser checks and real iPhone manual scenarios.
- QA policy: Every task has executor-run QA scenarios; real-device steps are performed and documented by the executor, not converted into a test framework.
- Evidence: `.omo/evidence/task-{N}-{slug}.{ext}`

## Execution Strategy
### Parallel Execution Waves
> Waves are dependency-correct first; this plan intentionally uses smaller waves around auth/session risk.
> Extract shared dependencies as early tasks for max safe parallelism.

Wave 1: Task 1 frontend/PWA foundation, Task 3 web OAuth/session backend.
Wave 2: Task 2 shared contracts/API client, Task 7 iOS PWA polish.
Wave 3: Task 4 settings/calendar persistence + calendar list route.
Wave 4: Task 5 parse/edit mobile flow, Task 6 event creation/error states.
Wave 5: Task 8 deployment/manual QA hardening.

### Dependency Matrix (full, all tasks)
- Task 1 blocks Tasks 2, 4, 5, 7, 8.
- Task 2 blocks Tasks 4, 5, and 6.
- Task 3 blocks Tasks 4, 6, and 8.
- Task 4 blocks Tasks 5, 6, and 8.
- Task 5 blocks Task 8.
- Task 6 blocks Task 8.
- Task 7 blocks Task 8.
- Task 8 blocks final verification wave.

### Agent Dispatch Summary (wave → task count → categories)
- Wave 1 → 2 tasks → quick, deep
- Wave 2 → 2 tasks → unspecified-high, visual-engineering
- Wave 3 → 1 task → unspecified-high
- Wave 4 → 2 tasks → visual-engineering, deep
- Wave 5 → 1 task → unspecified-high
- Final Verification → 4 tasks → oracle, unspecified-high, deep

## TODOs
> Implementation + Test = ONE task. Never separate.
> EVERY task MUST have: Agent Profile + Parallelization + QA Scenarios.

- [x] 1. Add Vite React TypeScript PWA foundation beside the extension

  **What to do**: Add the minimum web-app scaffold required for a PWA while preserving all existing extension files. Create `src/` for the React app, `src/main.tsx`, `src/App.tsx`, `src/styles.css`, `index.html`, `vite.config.ts`, `tsconfig.json`, and `public/manifest.webmanifest`. Update `package.json` with Vite/React/TypeScript dependencies and scripts: `dev`, `build`, `preview`. Configure the app to build to Vercel-compatible static output. Do not add test/CI scripts.
  **Must NOT do**: Do not delete, rename, or rewrite `extension/`. Do not add Expo/React Native/Capacitor/Tauri. Do not expose backend URL as a setting.

  **Recommended Agent Profile**:
  - Category: `quick` - Reason: mostly project scaffolding and package scripts.
  - Skills: [] - No special skill needed.
  - Omitted: [`frontend-ui-ux`] - Visual design work happens in Task 5/7, not foundation.

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: [2, 4, 5, 7, 8] | Blocked By: []

  **References** (executor has NO interview context - be exhaustive):
  - Pattern: `package.json` - currently has no scripts and only `@anthropic-ai/sdk`; add scripts without adding test/CI tooling.
  - Pattern: `vercel.json` - existing Vercel deployment config must continue to support API functions.
  - Pattern: `extension/manifest.json` - extension must remain intact and separate from web manifest.
  - Pattern: `extension/icons/icon128.png` - can be reused or adapted for PWA icon assets if dimensions are acceptable.
  - External: `https://vite.dev/guide/` - Vite setup reference.
  - External: `https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable` - PWA installability requirements.

  **Acceptance Criteria** (agent-executable only):
  - [ ] `npm install` succeeds.
  - [ ] `npm run build` succeeds and creates a production build.
  - [ ] `extension/manifest.json`, `extension/popup.js`, `extension/options.js`, and `extension/background.js` still exist unchanged unless explicitly required by package-level tooling.
  - [ ] `public/manifest.webmanifest` exists and is linked from `index.html`.
  - [ ] No `test`, `lint`, or CI scripts are introduced.

  **QA Scenarios** (MANDATORY - task incomplete without these):
  ```
  Scenario: Desktop dev app starts
    Tool: Bash
    Steps: Run `npm install` then `npm run build` from repo root.
    Expected: Both commands exit 0; build output exists; no extension files removed.
    Evidence: .omo/evidence/task-1-foundation-build.txt

  Scenario: Extension preservation check
    Tool: Bash
    Steps: Run `git diff -- extension/manifest.json extension/popup.js extension/options.js extension/background.js`.
    Expected: Diff is empty or contains only explicitly documented non-behavioral metadata changes; existing extension remains loadable by README instructions.
    Evidence: .omo/evidence/task-1-extension-preserved.txt
  ```

  **Commit**: YES | Message: `feat(pwa): add mobile web foundation` | Files: [`package.json`, `package-lock.json`, `index.html`, `vite.config.ts`, `tsconfig.json`, `src/**`, `public/**`]

- [x] 2. Define shared web contracts and API client for parse/auth/calendar calls

  **What to do**: Add typed frontend contracts for parsed events, calendar summaries, user/session state, reminders, durations, and API errors. Create a small same-origin API client under `src/lib/api.ts` that calls `/api/parse`, future web auth/session routes, and future calendar routes. Ensure API errors normalize disconnected, backend unavailable, auth required, parse failed, and Google failed cases into UI-consumable codes.
  **Must NOT do**: Do not move Anthropic or Google secrets client-side. Do not require user-configured backend URLs.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: requires careful contract mapping from existing untyped extension code.
  - Skills: [] - No extra skill needed.
  - Omitted: [`tdd`] - User explicitly chose manual QA only.

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: [4, 5, 6] | Blocked By: [1]

  **References**:
  - Pattern: `api/parse.js` - response shape for Claude-parsed event fields.
  - Pattern: `extension/popup.js` - existing parsed event state, preview fields, calendar creation payload, confirmation link behavior.
  - Pattern: `extension/options.js` - existing settings, calendars, reminders, default duration behavior.
  - Pattern: `README.md` - feature list includes recurrence and timezone support.

  **Acceptance Criteria**:
  - [ ] `src/lib/api.ts` or equivalent exports typed functions for parse, session, calendars, create event, and logout.
  - [ ] `src/lib/types.ts` or equivalent includes typed event/calendar/settings/error contracts.
  - [ ] API client uses same-origin relative paths only, e.g. `/api/...`.
  - [ ] API client has an explicit disconnected/network error mapping for online-only behavior.
  - [ ] `npm run build` succeeds.

  **QA Scenarios**:
  ```
  Scenario: API client uses deployed backend automatically
    Tool: Bash
    Steps: Inspect `src/lib/api.ts` and run `npm run build`.
    Expected: No user-editable backend URL or hardcoded localhost production URL; all app calls use same-origin relative `/api/*` paths; build exits 0.
    Evidence: .omo/evidence/task-2-api-client.txt

  Scenario: Network error is normalized
    Tool: Bash
    Steps: Inspect API error handling branch for failed `fetch`/offline condition.
    Expected: A disconnected/backend-unavailable error code is returned/thrown for UI use; raw browser errors are not displayed directly to users.
    Evidence: .omo/evidence/task-2-network-error.txt
  ```

  **Commit**: YES | Message: `feat(pwa): add web api contracts` | Files: [`src/lib/**`]

- [x] 3. Add web Google OAuth and encrypted HttpOnly session backend without breaking extension auth

  **What to do**: Add separate web auth/session API routes for the PWA. Required route shape: `/api/web/auth/start`, `/api/web/auth/callback`, `/api/web/auth/session`, `/api/web/auth/logout`. Use Google OAuth web redirect flow. Store web session state in a stateless encrypted HttpOnly cookie using `iron-session` or an equivalent audited encrypted-cookie library. Required session contents: Google refresh token, access-token expiry metadata if needed, Google user email/name if available, and granted calendar scopes. Access tokens must be generated/refreshed server-side per request and never returned to the frontend. Required env var: `SESSION_SECRET` with at least 32 random characters. Production cookie attributes: `HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/`, `Max-Age=2592000` (30 days). Local development may disable `Secure` only when `NODE_ENV !== 'production'`. On refresh-token failure/revocation, clear the session cookie and return auth-required. Keep existing `api/auth/token.js` and `api/auth/refresh.js` behavior available for the Chrome extension. Update environment documentation in comments or README-adjacent notes only if needed by the executor, but do not create docs outside this plan unless implementing agent explicitly chooses a repo convention.
  **Must NOT do**: Do not expose Google client secret, refresh token, or Anthropic key to frontend. Do not replace extension `background.js` auth flow. Do not add a general multi-user account system.

  **Recommended Agent Profile**:
  - Category: `deep` - Reason: highest-risk security/session/OAuth slice.
  - Skills: [] - No special skill loaded; executor should use official Google OAuth docs if uncertain.
  - Omitted: [`adk`] - Not using Botpress ADK.

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: [4, 6, 8] | Blocked By: []

  **References**:
  - Pattern: `api/auth/token.js` - existing OAuth code exchange logic for extension; preserve or reuse concepts without breaking it.
  - Pattern: `api/auth/refresh.js` - existing refresh-token handling for extension.
  - Pattern: `extension/background.js` - current extension token lifecycle; do not depend on this for PWA.
  - External: `https://developers.google.com/identity/protocols/oauth2/web-server` - Google OAuth web server flow.
  - External: `https://developers.google.com/identity/protocols/oauth2/scopes#calendar` - Calendar scope reference.

  **Acceptance Criteria**:
  - [ ] Web auth routes exist separately from existing extension auth routes.
  - [ ] Login start route redirects to Google with calendar scope and correct web callback redirect URI.
  - [ ] Callback route establishes an encrypted HttpOnly cookie session using `SESSION_SECRET`.
  - [ ] Session route returns connected/disconnected state without leaking tokens.
  - [ ] Logout route clears the web session.
  - [ ] Refresh-token failure clears session and returns auth-required.
  - [ ] Production cookies use `HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/`, and 30-day max age.
  - [ ] Existing `api/auth/token.js` and `api/auth/refresh.js` still exist.
  - [ ] `npm run build` succeeds.

  **QA Scenarios**:
  ```
  Scenario: Web auth session route does not leak tokens
    Tool: Bash
    Steps: Inspect web session route response body and cookie settings.
    Expected: Response contains user/session status only; cookie is HttpOnly encrypted session; no access_token, refresh_token, client_secret, or Anthropic key in frontend-readable JSON.
    Evidence: .omo/evidence/task-3-session-no-token-leak.txt

  Scenario: Extension auth routes remain intact
    Tool: Bash
    Steps: Run `git diff -- api/auth/token.js api/auth/refresh.js extension/background.js` and inspect new route paths.
    Expected: Existing extension routes are not removed; PWA routes are namespaced separately under `/api/web/auth/*` or an equivalently separate namespace.
    Evidence: .omo/evidence/task-3-extension-auth-preserved.txt
  ```

  **Commit**: YES | Message: `feat(auth): add web google session flow` | Files: [`api/web/auth/**`, `api/auth/**` if minimal shared refactor is necessary]

- [x] 4. Implement mobile settings, calendar list route, and persistence without Backend URL setting

  **What to do**: Add settings UI/state for Google connection status, default calendar, default event duration, and default reminders. Implement `/api/web/calendar/list` in this task, using the encrypted web session from Task 3 to call Google Calendar List API server-side. Persist non-secret settings in web-compatible local storage. Remove the extension-only Backend URL concept from the PWA UI entirely.
  **Must NOT do**: Do not store Google tokens in localStorage. Do not expose backend URL setting. Do not build expanded preference pages beyond existing feature parity.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: user-visible state plus backend/session integration.
  - Skills: [] - No extra skill needed.
  - Omitted: [`frontend-ui-ux`] - Keep minimal and pattern-based; visual polish handled later.

  **Parallelization**: Can Parallel: YES | Wave 3 | Blocks: [5, 6] | Blocked By: [1, 2, 3]

  **References**:
  - Pattern: `extension/options.html` - current settings fields to preserve except Backend URL.
  - Pattern: `extension/options.js` - default calendar, duration, reminder persistence behavior.
  - Pattern: `extension/options.css` - minimal form styling reference.
  - API/Type: `src/lib/types.ts` - settings/calendar/reminder contracts from Task 2.
  - External: `https://developers.google.com/calendar/api/v3/reference/calendarList/list` - Calendar list reference.

  **Acceptance Criteria**:
  - [ ] PWA has settings surface for connect/disconnect, default calendar, duration, and reminders.
  - [ ] `/api/web/calendar/list` returns calendar summaries for connected web session without exposing tokens.
  - [ ] PWA does not show Backend URL setting.
  - [ ] Non-secret settings persist across reloads/Home-Screen launches.
  - [ ] Disconnect clears session state and blocks event creation until reconnect.
  - [ ] `npm run build` succeeds.

  **QA Scenarios**:
  ```
  Scenario: Settings persist across reload
    Tool: Playwright
    Steps: Open local preview app, set default duration to 90 minutes and add one reminder, reload page.
    Expected: Duration and reminder selection remain visible; no Backend URL setting exists anywhere in the UI.
    Evidence: .omo/evidence/task-4-settings-persist.png

  Scenario: Disconnected state blocks protected calendar actions
    Tool: Playwright
    Steps: Open app with no session and attempt to load calendars/settings that require Google connection.
    Expected: UI shows connect-required state and does not call protected calendar routes successfully.
    Evidence: .omo/evidence/task-4-disconnected-blocked.png
  ```

  **Commit**: YES | Message: `feat(pwa): add mobile settings persistence` | Files: [`src/**`, `api/web/calendar/**`]

- [x] 5. Build minimal mobile parse and editable preview flow

  **What to do**: Implement the PWA's primary flow: natural-language text input, parse button/loading state, editable parsed event preview, and reset/back behavior. The editable preview must cover practical extension parity: title, date, start/end time or duration, location, description/notes if supported by existing parse output, recurrence display/editing where current extension supports it, timezone handling/display, selected calendar, and reminders/default duration application. Keep layout thumb-friendly and minimal for iPhone Safari.
  **Must NOT do**: Do not add full calendar views, drag-and-drop scheduling, account onboarding, or non-essential animations.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` - Reason: mobile UI/UX implementation with minimal visual system.
  - Skills: [`frontend-ui-ux`] - Use for polished minimal mobile ergonomics without generic AI clutter.
  - Omitted: [`playwright`] - QA tool is specified in scenarios, not needed as loaded skill for implementation.

  **Parallelization**: Can Parallel: YES | Wave 4 | Blocks: [8] | Blocked By: [1, 2, 4]

  **References**:
  - Pattern: `extension/popup.html` - current popup screens and fields.
  - Pattern: `extension/popup.js` - current input → preview → confirm state machine.
  - Pattern: `extension/popup.css` - current minimal dark styling tokens.
  - API/Type: `src/lib/types.ts` - parsed event and settings contracts.
  - External: `https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable` - mobile install context; UI must remain browser/PWA-safe.

  **Acceptance Criteria**:
  - [ ] User can enter natural-language text and trigger parse.
  - [ ] Loading, success, parse failure, and empty-input states are visible.
  - [ ] Parsed event appears in editable controls before creation.
  - [ ] Defaults from settings apply when parsed event lacks duration/reminders/calendar.
  - [ ] UI fits iPhone viewport without horizontal scrolling.
  - [ ] `npm run build` succeeds.

  **QA Scenarios**:
  ```
  Scenario: Happy-path parse preview on mobile viewport
    Tool: Playwright
    Steps: Open app at iPhone-sized viewport, enter `Lunch with Sarah tomorrow at 12 for 90 minutes at Blue Bottle`, trigger parse using a mocked or deployed backend response if available.
    Expected: Editable preview shows title, date, time/duration, location, selected/default calendar, and reminders; no horizontal scrolling.
    Evidence: .omo/evidence/task-5-parse-preview.png

  Scenario: Parse failure shows recoverable error
    Tool: Playwright
    Steps: Force `/api/parse` to fail or disconnect network in browser context, then trigger parse.
    Expected: User sees clear backend/disconnected error and can edit input/retry; no raw stack trace is displayed.
    Evidence: .omo/evidence/task-5-parse-error.png
  ```

  **Commit**: YES | Message: `feat(pwa): add mobile parse preview flow` | Files: [`src/**`]

- [x] 6. Add web calendar backend routes and event creation flow

  **What to do**: Add backend route `/api/web/calendar/create`. This route must use server-side session credentials from Task 3 and call Google Calendar API. Wire PWA create flow to the backend route. Preserve recurrence, timezone, duration, reminders, selected calendar, location, and description fields as supported by the current extension. Return confirmation data including an open-event link when Google provides one. Use `/api/web/calendar/list` from Task 4 for calendar selection; do not reimplement list here.
  **Must NOT do**: Do not call Google Calendar API directly from frontend with exposed tokens. Do not remove extension calendar creation behavior.

  **Recommended Agent Profile**:
  - Category: `deep` - Reason: backend security plus Google Calendar payload parity.
  - Skills: [] - No extra skill needed; executor should consult Google Calendar docs if needed.
  - Omitted: [`tdd`] - Manual QA only per user decision.

  **Parallelization**: Can Parallel: YES | Wave 4 | Blocks: [8] | Blocked By: [2, 3, 4]

  **References**:
  - Pattern: `extension/popup.js` - existing Google Calendar event creation payload and success link behavior.
  - Pattern: `extension/options.js` - existing calendar list/default calendar behavior.
  - API/Type: `src/lib/api.ts` - frontend API client from Task 2.
  - External: `https://developers.google.com/calendar/api/v3/reference/events/insert` - Google Calendar event insert reference.

  **Acceptance Criteria**:
  - [ ] Event creation uses selected calendar from `/api/web/calendar/list` provided by Task 4.
  - [ ] Event create backend route creates an event in the selected Google Calendar.
  - [ ] Frontend displays success state and open-event link.
  - [ ] Auth-required, permission-missing, expired-session, Google failure, and network failure states are user-visible.
  - [ ] No Google access/refresh token is exposed in frontend responses.
  - [ ] `npm run build` succeeds.

  **QA Scenarios**:
  ```
  Scenario: Create event in selected calendar
    Tool: Playwright
    Steps: With a connected session, select a non-primary calendar if available, parse/edit `Weekly standup every Monday at 10am`, create event.
    Expected: Success state appears with open-event link; event exists in selected Google Calendar with recurrence/time data preserved.
    Evidence: .omo/evidence/task-6-create-event.png

  Scenario: Expired or revoked session blocks creation cleanly
    Tool: Playwright
    Steps: Clear/expire session cookie or use backend-auth failure, then attempt event creation.
    Expected: UI shows reconnect-required state; no duplicate event is created; no raw Google error/token is shown.
    Evidence: .omo/evidence/task-6-expired-session.png
  ```

  **Commit**: YES | Message: `feat(calendar): add web event creation` | Files: [`api/web/calendar/**`, `src/**`]

- [x] 7. Add iPhone PWA install polish and online-only behavior

  **What to do**: Complete PWA/iOS polish: manifest name/icons/theme color, Apple mobile web app metadata, safe-area-aware CSS, touch target sizing, viewport behavior, install guidance if not running standalone, and online/offline detection. Configure service worker/app caching only for safe app-shell assets if using `vite-plugin-pwa`; do not cache API responses or imply offline event creation. Surface disconnected state globally.
  **Must NOT do**: Do not implement offline drafts, background sync, or push notifications. Do not over-cache authenticated/API data.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` - Reason: mobile/iOS UX and install polish.
  - Skills: [`frontend-ui-ux`] - Minimal, phone-friendly polish.
  - Omitted: [`frontend-design:frontend-design`] - Avoid broader visual redesign; keep minimal.

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: [8] | Blocked By: [1]

  **References**:
  - Pattern: `extension/icons/icon16.png`, `extension/icons/icon48.png`, `extension/icons/icon128.png` - existing brand icon source.
  - Pattern: `extension/popup.css` - dark minimal theme reference.
  - External: `https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable` - installability.
  - External: `https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Offline_and_background_operation` - service worker/offline constraints.

  **Acceptance Criteria**:
  - [ ] App has manifest and iOS metadata suitable for Add to Home Screen.
  - [ ] iPhone viewport has no horizontal scroll and respects safe-area insets.
  - [ ] Offline/disconnected banner or blocking error appears when `navigator.onLine` is false or fetch fails.
  - [ ] API responses are not cached by service worker.
  - [ ] App does not advertise offline creation, push, or native features.
  - [ ] `npm run build` succeeds.

  **QA Scenarios**:
  ```
  Scenario: iPhone install metadata present
    Tool: Playwright
    Steps: Open built/preview app and inspect document links/meta for manifest, theme color, apple-mobile-web-app-capable, and icon links.
    Expected: Required install metadata exists; manifest includes name, short_name, start_url, display, theme/background colors, and icons.
    Evidence: .omo/evidence/task-7-pwa-metadata.txt

  Scenario: Offline state is explicit
    Tool: Playwright
    Steps: Open app, simulate offline mode, attempt parse/create flow.
    Expected: Clear online-required error appears; no false promise of saved offline draft/sync.
    Evidence: .omo/evidence/task-7-offline-error.png
  ```

  **Commit**: YES | Message: `feat(pwa): polish iphone install experience` | Files: [`src/**`, `public/**`, `vite.config.ts`, `index.html`]

- [x] 8. Configure deployment and complete iPhone-first manual QA evidence

  **What to do**: Verify production deployment configuration for same Vercel project serving the PWA and `/api/*`. Document required environment variables for deployed operation in an implementation note or README update if the repo convention supports it: `ANTHROPIC_API_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and any web session secret/cookie settings introduced by Task 3. Verify Google OAuth redirect URI is compatible with deployed callback. Run full manual QA from desktop preview and iPhone Safari/Home Screen.
  **Must NOT do**: Do not add CI, automated test frameworks, App Store tooling, or a visible Backend URL setting.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: deployment, environment, and real-device QA coordination.
  - Skills: [`playwright`] - Browser verification and screenshots.
  - Omitted: [`git-master`] - Only needed if user asks executor to commit.

  **Parallelization**: Can Parallel: NO | Wave 5 | Blocks: [Final Verification] | Blocked By: [1, 3, 4, 5, 6, 7]

  **References**:
  - Pattern: `README.md` - current setup/deploy docs and existing environment variables.
  - Pattern: `vercel.json` - function runtime config.
  - Pattern: `api/parse.js` - backend requires Anthropic configuration.
  - Pattern: `api/web/auth/**` - web auth routes from Task 3.
  - Pattern: `api/web/calendar/**` - web calendar routes from Task 6.

  **Acceptance Criteria**:
  - [ ] `npm run build` succeeds locally.
  - [ ] Deployed Vercel app serves PWA at root and APIs under `/api/*`.
  - [ ] Google OAuth callback URI is documented/confirmed for deployed URL.
  - [ ] iPhone Safari can open URL and Add to Home Screen.
  - [ ] Home-Screen launch can connect Google or show existing connected session.
  - [ ] Full event creation happy path works from iPhone.
  - [ ] Backend unavailable, auth cancel, disconnected, and parse failure states are manually verified.

  **QA Scenarios**:
  ```
  Scenario: Full iPhone Home-Screen happy path
    Tool: interactive_bash + real iPhone Safari manual QA
    Steps: Deploy or preview via reachable HTTPS URL; open on iPhone Safari; Add to Home Screen; launch from icon; connect Google; enter `Dentist appointment tomorrow at 3pm for 45 minutes`; parse; edit title/time; create event; open Google event link.
    Expected: Flow completes from Home Screen; event appears in Google Calendar; success link opens the created event.
    Evidence: .omo/evidence/task-8-iphone-homescreen-happy-path.md

  Scenario: Failure matrix verified
    Tool: Playwright + real iPhone Safari manual QA
    Steps: Verify auth cancel, no network/disconnected, backend parse failure, expired session/reconnect, and no calendars/permission failure where feasible.
    Expected: Each failure has a clear user-facing message and recovery path; no raw token, stack trace, or unhandled blank screen.
    Evidence: .omo/evidence/task-8-failure-matrix.md
  ```

  **Commit**: YES | Message: `chore(pwa): verify mobile deployment flow` | Files: [`README.md` if updated, `.omo/evidence/**` if evidence is committed by repo convention]

## Final Verification Wave (MANDATORY — after ALL implementation tasks)
> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.
> **Do NOT auto-proceed after verification. Wait for user's explicit approval before marking work complete.**
> **Never mark F1-F4 as checked before getting user's okay.** Rejection or user feedback -> fix -> re-run -> present again -> wait for okay.
- [x] F1. Plan Compliance Audit — oracle
- [x] F2. Code Quality Review — unspecified-high
- [x] F3. Real Manual QA — unspecified-high (+ playwright if UI)
- [x] F4. Scope Fidelity Check — deep

## Commit Strategy
- Commit after each completed task if the executor is asked to commit; otherwise leave changes unstaged and report file list.
- Suggested commit series:
  - `feat(pwa): add mobile web app foundation`
  - `feat(auth): add web google session flow`
  - `feat(calendar): add mobile event creation flow`
  - `feat(pwa): polish iphone install experience`
  - `chore(qa): document mobile manual verification`

## Success Criteria
- User can use Calendur from iPhone Home Screen without Chrome extension dependencies.
- The deployed PWA uses the Vercel backend automatically.
- Full current user flow is available: connect Google → type natural text → parse → edit → create event → open confirmation link.
- Existing extension remains intact.
- Online-only failures are explicit and recoverable.
- No excluded native/offline/test/analytics scope is introduced.
