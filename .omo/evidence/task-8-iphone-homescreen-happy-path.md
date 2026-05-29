# Task 8: iPhone Home-Screen Happy Path Evidence

Date: 2026-05-28

## Scope

Task 8 covers deployment documentation, local build verification, and constrained manual QA evidence for the iPhone-first PWA. It does not deploy production or modify extension behavior.

## Verified Locally Now

- Read `.omo/plans/mobile-app-pwa.md` Task 8 and required notepads before editing.
- Read `README.md`, `vercel.json`, `api/parse.js`, `api/web/auth/*`, and `api/web/calendar/*`.
- Confirmed `vercel.json` only configures function duration and has no rewrite that would shadow `/api/*`.
- Confirmed PWA API client uses same-origin relative routes: `/api/parse`, `/api/web/auth/session`, `/api/web/auth/logout`, `/api/web/calendar/list`, and `/api/web/calendar/create`.
- Confirmed web OAuth callback is computed as `https://<deployment-host>/api/web/auth/callback` from request origin.
- Confirmed `SESSION_SECRET` is required and must be at least 32 characters in `api/web/_session.js`.
- Confirmed `index.html` and `public/manifest.webmanifest` include PWA/Add-to-Home-Screen metadata.
- Confirmed source search found no PWA Backend URL setting or hardcoded backend host; only extension docs/behavior retain Backend URL.

## Build Evidence

Command run from repo root:

```bash
npm run build
```

Output summary:

```text
> vite build
vite v5.4.21 building for production...
✓ 37 modules transformed.
dist/index.html                   0.96 kB │ gzip:  0.48 kB
dist/assets/index-BXevjl-V.css    9.61 kB │ gzip:  2.75 kB
dist/assets/index-Db8IH2RG.js   163.55 kB │ gzip: 51.86 kB
✓ built in 293ms
```

Vite also printed its existing CJS Node API deprecation warning. The build exited 0.

## Browser/iPhone Runtime Constraint

Playwright browser automation was attempted against local preview after loading the Playwright skill. It is blocked in this environment by missing Chrome:

```text
Error: async initializeServer: Chromium distribution 'chrome' is not found at /Applications/Google Chrome.app/Contents/MacOS/Google Chrome
Run "npx playwright install chrome"
```

No real iPhone, deployed Google OAuth credentials, authorized deployed callback URI, connected session cookie, or calendar write access were available in this environment. The full Home-Screen happy path therefore remains a deployed-device checklist, not an executed result.

## Deployment Requirements Confirmed

- Deploy the same repository root to Vercel so the root PWA and `/api/*` functions share origin.
- Configure Vercel environment variables: `ANTHROPIC_API_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `SESSION_SECRET` with at least 32 characters.
- Add this Google Cloud OAuth authorized redirect URI: `https://<your-vercel-domain>/api/web/auth/callback`.
- Do not add Vercel rewrites that catch `/api/*` before serverless functions.
- Keep the extension Backend URL setting documented as extension-only; the PWA has no Backend URL setting.

## Happy Path Checklist Requiring Deployed Credentials and Real iPhone

1. Deploy with `vercel --prod` after Vercel env vars are set.
2. Open `https://<your-vercel-domain>/` in iPhone Safari.
3. Use Share -> Add to Home Screen.
4. Launch Calendur from the Home Screen icon.
5. Tap Connect and complete Google OAuth using the deployed callback URI.
6. Confirm connected account state and calendar list load.
7. Enter `Dentist appointment tomorrow at 3pm for 45 minutes`.
8. Parse the event.
9. Edit title/time in the preview.
10. Create the event.
11. Open the returned Google event link.
12. Confirm the event exists in the selected Google Calendar.

## Result

Local build, source, route, and deployment assumptions are verified. Real Home-Screen OAuth and Google event insertion still require deployed credentials and real iPhone access.
