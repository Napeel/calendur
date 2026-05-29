# Problems: mobile-app-pwa

## 2026-05-28 Open Implementation Problems
- Need choose exact package/runtime compatibility for encrypted session helpers in Vercel Node serverless routes.
- Need avoid conflicts between Vite root `index.html` and existing Vercel `/api` functions.
- Need validate parse.js output schema before typing frontend contracts.
- Need decide whether to add `iron-session` directly to plain Vercel functions or implement equivalent sealed-cookie helper without Next.js runtime assumptions.
- Need confirm PWA scaffold does not require changing existing `vercel.json` function maxDuration coverage.

## 2026-05-28 Task 4 Verification Blocker
- Playwright browser QA is blocked in this environment because Chrome/Chromium is not installed at `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`; Task 4 evidence used source inspection, build output, and direct handler invocation fallback.

## 2026-05-28 Task 6 Verification Blocker
- Playwright/browser QA remains blocked by the missing local Chrome/Chromium browser, and live create-event QA cannot be completed without deployed Google OAuth credentials plus a connected web session. Task 6 evidence uses build output, sensitive-name searches, and direct route handler validation fallback.

## 2026-05-28 Task 8 Verification Blocker
- Playwright/browser QA remains blocked because Chrome/Chromium is missing at `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`; Task 8 evidence uses build output, source inspection, and deployment checklist fallback.
- Full iPhone Home-Screen happy path and failure-matrix runtime checks require a deployed Vercel URL, configured Google OAuth callback URI, deployed secrets, a connected session cookie, calendar write access, and a real iPhone.

## 2026-05-29 Final Wave Fix Verification Blocker
- Local build and source diagnostics passed after fixing F1/F2 blockers, but browser/Playwright QA remains blocked by the missing local Chrome/Chromium install; live OAuth cancellation and multi-day create-event QA still require deployed Google OAuth credentials and a real connected session.
