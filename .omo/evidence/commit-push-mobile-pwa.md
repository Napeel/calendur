# Commit and Push Mobile PWA Evidence

## Preflight

### git fetch origin

### status --short --branch
## main...origin/main
 M .gitignore
 M README.md
 M package-lock.json
 M package.json
?? .omo/
?? api/web/
?? index.html
?? public/
?? src/
?? tsconfig.json
?? vite.config.ts

### diff --stat
 .gitignore        |    2 +
 README.md         |   41 +-
 package-lock.json | 1815 ++++++++++++++++++++++++++++++++++++++++++++++++++++-
 package.json      |   17 +-
 4 files changed, 1854 insertions(+), 21 deletions(-)

### diff excluding package-lock.json
diff --git a/.gitignore b/.gitignore
index 9f7375a..f792909 100644
--- a/.gitignore
+++ b/.gitignore
@@ -9,3 +9,5 @@ docs/
 .vercel/
 *.log
 .vercel
+dist/
+.omo/run-continuation/
diff --git a/README.md b/README.md
index dca081f..a5097ed 100644
--- a/README.md
+++ b/README.md
@@ -2,6 +2,8 @@
 
 Chrome extension that creates Google Calendar events from plain text. Type something like *"Lunch with Sarah tomorrow at noon at Blue Bottle Coffee"* and it just works.
 
+Calendur also includes an iPhone-first PWA served by the same Vercel project. The PWA uses the deployed same-origin `/api/*` routes automatically and does not have a Backend URL setting.
+
 Uses Claude AI (via a Vercel backend) to parse natural language into structured event data.
 
 ## How It Works
@@ -18,15 +20,20 @@ Supports recurring events (`"weekly standup every Monday at 10am"`) and timezone
 ```
 ├── api/
 │   ├── parse.js           # Vercel serverless function (calls Claude)
-│   └── auth/
-│       ├── token.js       # OAuth code → token exchange
-│       └── refresh.js     # Silent token refresh
+│   ├── auth/
+│   │   ├── token.js       # OAuth code → token exchange
+│   │   └── refresh.js     # Silent token refresh
+│   └── web/
+│       ├── auth/          # PWA OAuth/session routes
+│       └── calendar/      # PWA calendar proxy routes
 ├── extension/
 │   ├── manifest.json      # Chrome Manifest V3
 │   ├── popup.html/css/js  # Main popup UI
 │   ├── options.html/css/js# Settings page
 │   ├── background.js      # Service worker (OAuth + token management)
 │   └── icons/             # Extension icons
+├── src/                   # iPhone-first PWA
+├── public/                # PWA manifest and icons
 ├── package.json
 └── vercel.json
 ```
@@ -39,6 +46,7 @@ Supports recurring events (`"weekly standup every Monday at 10am"`) and timezone
 2. Enable the **Google Calendar API**
 3. Go to **Credentials** → Create **OAuth 2.0 Client ID** (type: **Web application**)
 4. Copy the client ID
+5. For the PWA, add `https://<your-vercel-domain>/api/web/auth/callback` as an **Authorized redirect URI** before testing deployed Google connect
 
 ### 2. Extension
 
@@ -50,35 +58,51 @@ Supports recurring events (`"weekly standup every Monday at 10am"`) and timezone
 6. Back in Google Cloud Console, add `https://<extension-id>.chromiumapp.org/` as an **Authorized redirect URI** on your OAuth client
 7. Add your Google account email as a **Test user** in the OAuth consent screen
 
-### 3. Backend
+### 3. Backend and PWA Deployment
 
 ```bash
 npm install
+npm run build
 ```
 
-Deploy to Vercel:
+Deploy the same root project to Vercel:
 
 ```bash
 vercel --prod
 ```
 
+Vercel serves the PWA from the root static build and keeps serverless APIs under `/api/*`. Do not add rewrites that shadow `/api/*`.
+
 Set the environment variables in Vercel dashboard:
 - `ANTHROPIC_API_KEY` — your Anthropic API key
 - `GOOGLE_CLIENT_ID` — your Google OAuth client ID (same as in manifest.json)
 - `GOOGLE_CLIENT_SECRET` — your Google OAuth client secret (from Google Cloud Console → Credentials → your OAuth client)
+- `SESSION_SECRET` — random session encryption secret, minimum 32 characters
 
-### 4. Configure
+### 4. Configure the Extension
 
 1. Click the extension icon → **Settings** (gear icon)
 2. Set **Backend URL** to your Vercel deployment URL (e.g., `https://calendur.vercel.app`)
 3. Connect your Google account
 4. Set default calendar, event duration, and reminders
 
+### 5. Configure the PWA
+
+1. Open `https://<your-vercel-domain>/` in iPhone Safari
+2. Share → **Add to Home Screen**
+3. Launch Calendur from the Home Screen icon
+4. Tap **Connect** and complete Google OAuth
+5. Set default calendar, event duration, and reminders
+
+The PWA has no Backend URL setting. It calls the deployed same-origin Vercel APIs automatically, including `/api/parse`, `/api/web/auth/*`, and `/api/web/calendar/*`.
+
+The first PWA iteration is online-only. It does not include offline drafts, offline sync, push notifications, native app store packaging, or background calendar sync.
+
 ## Settings
 
 | Setting | Description |
 |---------|-------------|
-| Backend URL | Your Vercel deployment URL |
+| Backend URL | Extension-only Vercel deployment URL |
 | Default Calendar | Which Google Calendar to add events to |
 | Default Duration | Fallback when no end time is mentioned (15m/30m/1h/2h) |
 | Default Reminders | Up to 5 reminders applied to every event |
@@ -86,6 +110,7 @@ Set the environment variables in Vercel dashboard:
 ## Tech Stack
 
 - **Extension:** Vanilla HTML/CSS/JS, Chrome Manifest V3
+- **PWA:** Vite, React, TypeScript
 - **Backend:** Vercel serverless function, Anthropic SDK
 - **AI:** Claude Haiku for text parsing
-- **Auth:** Google OAuth 2.0 (authorization code flow with refresh tokens)
+- **Auth:** Google OAuth 2.0; the PWA stores Google session material in an encrypted HttpOnly cookie
diff --git a/package.json b/package.json
index 99f7818..f6ebf1e 100644
--- a/package.json
+++ b/package.json
@@ -3,11 +3,26 @@
   "version": "0.1.0",
   "description": "Chrome extension that creates Google Calendar events from plain text using Claude AI",
   "license": "MIT",
+  "scripts": {
+    "dev": "vite",
+    "build": "vite build",
+    "preview": "vite preview"
+  },
   "repository": {
     "type": "git",
     "url": "https://github.com/Napeel/calendur.git"
   },
   "dependencies": {
-    "@anthropic-ai/sdk": "^0.39.0"
+    "@anthropic-ai/sdk": "^0.39.0",
+    "iron-session": "^8.0.4",
+    "react": "^18.3.1",
+    "react-dom": "^18.3.1"
+  },
+  "devDependencies": {
+    "@types/react": "^18.3.18",
+    "@types/react-dom": "^18.3.5",
+    "@vitejs/plugin-react": "^4.3.4",
+    "typescript": "^5.8.3",
+    "vite": "^5.4.10"
   }
 }

### diff --staged --stat

### log -10 --oneline
9b3b83f fix: harden parse API input validation and popup error handling
8a4ad1e feat: add rate limiting
9994c85 Fix interactive re-auth fallback when token refresh fails
1753421 Update README with auth endpoint structure and OAuth flow details
e7d0647 Migrate OAuth to authorization code flow with persistent refresh tokens
9058bfe Fix OAuth token management: track expiry, deduplicate refreshes, retry on 401
80a214b Auto-refresh expired OAuth tokens silently using Google session cookie
47a41d2 Auto-clear expired OAuth token on 401 response
7058ed3 Fix: reliably restore OAuth token from storage on service worker restart
601da52 Fix: send local time instead of UTC to prevent off-by-one date

### rev-list origin/main...HEAD
0	0

## Initial build validation

> calendur@0.1.0 build
> vite build

[33mThe CJS build of Vite's Node API is deprecated. See https://vite.dev/guide/troubleshooting.html#vite-cjs-node-api-deprecated for more details.[39m
vite v5.4.21 building for production...
transforming...
✓ 37 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   0.96 kB │ gzip:  0.48 kB
dist/assets/index-BaFV4_uT.css   10.43 kB │ gzip:  2.83 kB
dist/assets/index-CUWYDpW1.js   165.14 kB │ gzip: 52.27 kB
✓ built in 279ms

## Secret scan
SECRET_SCAN_PASS

## Ignored artifact check
 M .gitignore
 M README.md
 M package-lock.json
 M package.json
?? .omo/
?? api/web/
?? index.html
?? public/
?? src/
?? tsconfig.json
?? vite.config.ts
!! .omo/boulder.json
!! .omo/run-continuation/
!! dist/
!! node_modules/
## Pre-commit staged-file guard
NO_STAGED_FILES

## Commit 1 staged stat
.gitignore                  |    4 +
 index.html                  |   25 +
 package-lock.json           | 1815 ++++++++++++++++++++++++++++++++++++++++++-
 package.json                |   17 +-
 public/icon-192.svg         |    9 +
 public/icon-512.svg         |    9 +
 public/manifest.webmanifest |   31 +
 tsconfig.json               |   17 +
 vite.config.ts              |    9 +
 9 files changed, 1923 insertions(+), 13 deletions(-)

## Commit 1 SHA
67f71d9 Add Vite PWA project scaffold

## Commit 2 staged stat
src/lib/api.ts      | 174 ++++++++++++++++++++++++++++++++++++++++++++++++++++
 src/lib/settings.ts |  65 ++++++++++++++++++++
 src/lib/types.ts    | 127 ++++++++++++++++++++++++++++++++++++++
 3 files changed, 366 insertions(+)

## Commit 2 SHA
04bb059 Add PWA API contracts and settings helpers

## Commit 3 staged stat
src/App.tsx                 | 136 +++++++++
 src/components/Settings.tsx | 240 ++++++++++++++++
 src/main.tsx                |  10 +
 src/styles.css              | 661 ++++++++++++++++++++++++++++++++++++++++++++
 4 files changed, 1047 insertions(+)

## Commit 3 SHA
50816d4 Add mobile PWA shell and settings UI

## Commit 4 staged stat
src/components/EventInput.tsx   | 130 ++++++++++++++
 src/components/EventPreview.tsx | 377 ++++++++++++++++++++++++++++++++++++++++
 2 files changed, 507 insertions(+)

## Commit 4 SHA
dbabd4e Add mobile event input and preview flow

## Commit 5 staged stat
api/web/_session.js      | 176 +++++++++++++++++++++++++++++++++++++++++++++++
 api/web/auth/callback.js |  53 ++++++++++++++
 api/web/auth/logout.js   |  16 +++++
 api/web/auth/session.js  |  35 ++++++++++
 api/web/auth/start.js    |  38 ++++++++++
 5 files changed, 318 insertions(+)

## Commit 5 SHA
aa37834 Add web OAuth session routes

## Commit 6 staged stat
api/web/calendar/create.js | 153 +++++++++++++++++++++++++++++++++++++++++++++
 api/web/calendar/list.js   |  46 ++++++++++++++
 2 files changed, 199 insertions(+)

## Commit 6 SHA
d44f5df Add web calendar proxy routes

## Commit 7 staged stat
README.md | 41 +++++++++++++++++++++++++++++++++--------
 1 file changed, 33 insertions(+), 8 deletions(-)

## Commit 7 SHA
999007d Document PWA deployment and setup

## Commit 8 staged stat
.omo/evidence/commit-push-mobile-pwa.md            | 303 ++++++++
 .omo/evidence/final-wave-fixes.md                  |  23 +
 .omo/evidence/task-1-extension-preserved.txt       |   2 +
 .omo/evidence/task-1-foundation-build.txt          |  32 +
 .omo/evidence/task-2-api-client.txt                |  36 +
 .omo/evidence/task-2-network-error.txt             |  49 ++
 .omo/evidence/task-3-extension-auth-preserved.txt  |  25 +
 .omo/evidence/task-3-session-no-token-leak.txt     |  28 +
 .omo/evidence/task-4-disconnected-blocked.md       |  39 +
 .omo/evidence/task-4-settings-persist.md           |  33 +
 .omo/evidence/task-5-parse-error.md                |  38 +
 .omo/evidence/task-5-parse-preview.md              |  36 +
 .omo/evidence/task-6-create-event.md               |  15 +
 .omo/evidence/task-6-expired-session.md            |  16 +
 .omo/evidence/task-7-offline-error.md              |  54 ++
 .omo/evidence/task-7-pwa-metadata.txt              |  76 ++
 .omo/evidence/task-8-failure-matrix.md             |  31 +
 .../task-8-iphone-homescreen-happy-path.md         |  78 ++
 .omo/notepads/mobile-app-pwa/decisions.md          |   9 +
 .omo/notepads/mobile-app-pwa/issues.md             |  13 +
 .omo/notepads/mobile-app-pwa/learnings.md          |  98 +++
 .omo/notepads/mobile-app-pwa/problems.md           |  21 +
 .omo/plans/commit-push-mobile-pwa.md               | 836 +++++++++++++++++++++
 .omo/plans/mobile-app-pwa.md                       | 487 ++++++++++++
 24 files changed, 2378 insertions(+)
