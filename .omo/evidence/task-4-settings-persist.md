# Task 4 Settings Persistence Evidence

Playwright browser QA was attempted, but Chromium/Chrome is unavailable in this environment:

```text
Error: async initializeServer: Chromium distribution 'chrome' is not found at /Applications/Google Chrome.app/Contents/MacOS/Google Chrome
Run "npx playwright install chrome"
```

Fallback verification used build output and source inspection.

## Verified

- `src/lib/settings.ts` persists only `defaultCalendarId`, `defaultDuration`, and `defaultReminders` to `localStorage` under `calendur.web.settings`.
- `src/lib/settings.ts` does not persist Google access tokens, refresh tokens, session data, or backend URLs.
- `src/components/Settings.tsx` exposes duration choices `15`, `30`, `60`, and `120`, with default duration `30` coming from `DEFAULT_WEB_SETTINGS`.
- Reminder rows use popup reminders, default to 10 minutes, and are capped by `REMINDER_LIMIT = 5`.
- Grep across `src` for `Backend URL`, `backendUrl`, and `backend-url` returned no PWA UI matches.

## Build Evidence

```text
> vite build
vite v5.4.21 building for production...
transforming...
✓ 35 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   0.96 kB │ gzip:  0.48 kB
dist/assets/index-C0QcTOA2.css    6.06 kB │ gzip:  2.12 kB
dist/assets/index-CRjw4OUS.js   153.52 kB │ gzip: 49.31 kB
✓ built in 264ms
```
