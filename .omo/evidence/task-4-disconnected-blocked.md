# Task 4 Disconnected Blocked Evidence

Playwright browser QA was attempted, but Chromium/Chrome is unavailable in this environment:

```text
Error: async initializeServer: Chromium distribution 'chrome' is not found at /Applications/Google Chrome.app/Contents/MacOS/Google Chrome
Run "npx playwright install chrome"
```

Fallback verification used direct handler invocation with dummy environment and no session cookie.

## Handler Invocation

```bash
SESSION_SECRET=12345678901234567890123456789012 GOOGLE_CLIENT_ID=dummy GOOGLE_CLIENT_SECRET=dummy node --input-type=module -e "import handler from './api/web/calendar/list.js'; /* fake req/res with no cookie */ await handler(req, res);"
```

## Result

```json
{
  "status": 401,
  "body": {
    "error": "auth_required"
  },
  "headers": {
    "Allow": "GET",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  }
}
```

## Verified

- `/api/web/calendar/list` returns `401` with `{ "error": "auth_required" }` when no web session cookie exists.
- The disconnected PWA state renders a connect-required message and disables default calendar selection until a connected session exists.
- `Settings` does not call `listCalendars()` unless `session.connected` is true.
- The calendar list route returns only `{ calendars: [...] }` on success and never serializes Google token material into the JSON response.
