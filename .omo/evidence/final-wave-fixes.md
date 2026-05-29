# Final Wave Fixes Evidence

Date: 2026-05-29

## Fixes Applied

- `src/components/EventPreview.tsx`: Added editable Notes textarea initialized from `parsedEvent.description || ''`; create payload now sends only trimmed edited notes as `description`.
- `src/components/EventPreview.tsx`: Split event dates into `startDate` and `endDate`; create payload now submits `${startDate}T${startTime}:00` and `${endDate}T${endTime}:00`, preserving overnight and multi-day parsed events.
- `src/App.tsx`: Memoized `handleSessionChange` with `useCallback` so `Settings` does not repeatedly rerun its session-load effect because of callback identity changes.
- `api/web/auth/callback.js` and `src/App.tsx`: OAuth callback now redirects normal browser errors to the PWA root with sanitized `?auth=cancelled` or `?auth=error`; the PWA renders a dismissible user-facing message and clears the query string.
- `src/styles.css`: Added mobile-safe styling for the auth notice and preview notes textarea.

## Verification

- `npm run build`: Passed. Vite built `dist/index.html`, `dist/assets/index-BaFV4_uT.css`, and `dist/assets/index-CUWYDpW1.js` in 305ms.
- LSP diagnostics: Clean for `src/components/EventPreview.tsx`, `src/App.tsx`, and `api/web/auth/callback.js`.
- CSS diagnostics: Attempted for `src/styles.css`; blocked by missing configured `biome` server in this environment.
- OAuth cancellation redirect check: Direct handler invocation for `error=access_denied` returned `302 https://example.test/?auth=cancelled`.
- Risk search on changed files for `TODO|FIXME|HACK|xxx|as any|@ts-ignore|console.log|Backend URL|backendUrl|access_token|refresh_token|client_secret|SESSION_SECRET`: only expected server-side Google token field references remained in `api/web/auth/callback.js`; no frontend secret/backend URL exposure found.

## Residual Limitations

- Browser/Playwright QA remains unavailable locally because the environment does not have Chrome/Chromium installed; full iPhone Home-Screen OAuth and create-event QA still require deployed secrets, configured Google redirect URI, and a real connected Google session.
