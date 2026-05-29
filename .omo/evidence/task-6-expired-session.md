# Task 6 Expired Session Evidence

## Expected Behavior
- `/api/web/calendar/create` uses `getGoogleAccessToken(req, res)` from `api/web/_session.js`.
- If the web session is missing, expired, or Google refresh fails, the helper throws `auth_required`; refresh failure also destroys the encrypted session cookie.
- `src/lib/api.ts` maps `401` or `{ "error": "auth_required" }` to the `auth_required` app error code.
- `EventPreview` displays `Reconnect Google Calendar before creating this event.` and keeps the create action retryable.

## Local Verification
- Direct handler fallback validated invalid/unsupported requests are cleanly handled before any token material is needed.
- Sensitive-name searches returned 0 matches in frontend source for `access_token`, `refresh_token`, `client_secret`, and `SESSION_SECRET`.
- `npm run build` exited 0.

## Browser QA Limitation
- Playwright/browser expired-session QA could not run because Chrome/Chromium is unavailable in this environment.
- End-to-end revoked-session validation requires a deployed app with real Google OAuth credentials and an established web session.
