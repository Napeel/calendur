# Decisions: mobile-app-pwa

## 2026-05-28 Locked Plan Decisions
- Target iPhone-first PWA for personal use; no native wrapper or app store in iteration one.
- Online-only; surface clear disconnected/backend/Google errors.
- Manual/browser/device QA evidence only; do not add automated test framework or CI.
- Preserve current Chrome extension files and behavior.
- Use deployed Vercel backend automatically via same-origin API paths.
- Use encrypted HttpOnly cookie session for PWA OAuth where feasible; never expose secrets or Google tokens to frontend.
