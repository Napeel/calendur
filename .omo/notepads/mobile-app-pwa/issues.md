# Issues: mobile-app-pwa

## 2026-05-28 Known Risks
- iPhone Safari/Home-Screen session persistence must be verified on real device.
- Existing extension stores backend URL in settings; PWA must intentionally omit that UI and use relative URLs.
- Existing extension directly calls Google Calendar API from extension JavaScript; PWA must proxy calendar list/create through server-side session routes.
- Real Google OAuth flow may require updating Google Cloud redirect URI for deployed `/api/web/auth/callback`.
- New web auth routes should use a separate namespace from `/api/auth/*` to avoid breaking extension consumers.
- Current API CORS only allows `Content-Type`; if frontend sends custom headers later, preflight may fail.
- Vercel route/rewrite changes can accidentally shadow `/api/*`; keep routing minimal.
- iOS PWA cookie/session behavior must be verified with top-level same-site OAuth redirect, not iframe/popup assumptions.
- Task 3 route-level checks used dummy env and did not complete a live Google OAuth callback because real OAuth credentials/redirect URI registration are required; deployed `/api/web/auth/callback` must be added as an authorized redirect URI and verified end-to-end.
- Task 6 build and route validation passed locally, but live event insertion still requires deployed Google OAuth credentials, an authorized web callback URI, a connected session cookie, and write access to the selected Google Calendar.
