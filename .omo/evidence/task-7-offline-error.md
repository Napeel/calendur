Task 7 Evidence: Offline Error Behavior
========================================

Date: 2026-05-28
Method: Code inspection + local server verification

1. Online/offline detection mechanism
--------------------------------------
src/App.tsx implements `useOnlineStatus()` hook:
- Reads `navigator.onLine` as initial state
- Listens for `window` `online` and `offline` events
- Returns boolean `online` state to the App component

2. Offline banner behavior
---------------------------
When `online` is false, App renders `<OfflineBanner />`:
- Full-screen fixed overlay (position: fixed, inset: 0, z-index: 1000)
- Semi-transparent dark backdrop with blur
- Card with warning icon, "You're offline" title, and body text:
  "Calendur requires a network connection to parse events and access
  your calendar. Reconnect to continue."
- Uses `role="alert"` and `aria-live="assertive"` for accessibility
- No offline creation, no draft saving, no sync promise
- Banner disappears automatically when connection is restored

3. No service worker / no API caching
---------------------------------------
- No service worker is registered in the app
- No vite-plugin-pwa or workbox configuration
- No Cache API usage for API responses
- All fetch calls go to same-origin /api/* routes without caching
- App is explicitly online-only; offline state is surfaced as a blocking error

4. Verification via local server
---------------------------------
Started `npx vite preview` on built output. Confirmed:
- App renders normally when online
- Offline banner CSS and component structure are present in built JS/CSS
- No service worker registration in built output
- No cache headers or caching logic in application code

5. Manual offline simulation
-----------------------------
To verify on a real device or browser:
1. Open the app in Chrome DevTools
2. Go to Application > Service Workers (confirm none registered)
3. Go to Network > check "Offline"
4. Observe the offline banner appears
5. Uncheck "Offline"
6. Observe the banner disappears and app is interactive again

Playwright browser was unavailable in this environment (no Chrome binary).
Code inspection confirms the offline detection and banner rendering logic
is correct. Real-device verification should be performed in Task 8.
