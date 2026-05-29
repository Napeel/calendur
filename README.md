# Calendur

Chrome extension that creates Google Calendar events from plain text. Type something like *"Lunch with Sarah tomorrow at noon at Blue Bottle Coffee"* and it just works.

Calendur also includes an iPhone-first PWA served by the same Vercel project. The PWA uses the deployed same-origin `/api/*` routes automatically and does not have a Backend URL setting.

Uses Claude AI (via a Vercel backend) to parse natural language into structured event data.

## How It Works

1. Click the extension icon, type an event description
2. Claude parses it into title, date, time, location, recurrence, etc.
3. Review/edit the parsed fields
4. One click to create the event in Google Calendar

Supports recurring events (`"weekly standup every Monday at 10am"`) and timezones (`"call at 3pm EST"`).

## Project Structure

```
├── api/
│   ├── parse.js           # Vercel serverless function (calls Claude)
│   ├── auth/
│   │   ├── token.js       # OAuth code → token exchange
│   │   └── refresh.js     # Silent token refresh
│   └── web/
│       ├── auth/          # PWA OAuth/session routes
│       └── calendar/      # PWA calendar proxy routes
├── extension/
│   ├── manifest.json      # Chrome Manifest V3
│   ├── popup.html/css/js  # Main popup UI
│   ├── options.html/css/js# Settings page
│   ├── background.js      # Service worker (OAuth + token management)
│   └── icons/             # Extension icons
├── src/                   # iPhone-first PWA
├── public/                # PWA manifest and icons
├── package.json
└── vercel.json
```

## Setup

### 1. Google Cloud

1. Create a project at [console.cloud.google.com](https://console.cloud.google.com)
2. Enable the **Google Calendar API**
3. Go to **Credentials** → Create **OAuth 2.0 Client ID** (type: **Web application**)
4. Copy the client ID
5. For the PWA, add `https://<your-vercel-domain>/api/web/auth/callback` as an **Authorized redirect URI** before testing deployed Google connect

### 2. Extension

1. Open `extension/manifest.json` and replace `YOUR_CLIENT_ID.apps.googleusercontent.com` with your client ID
2. Go to `chrome://extensions` (or `brave://extensions`)
3. Enable **Developer mode**
4. Click **Load unpacked** → select the `extension/` folder
5. Copy the extension ID from the extensions page
6. Back in Google Cloud Console, add `https://<extension-id>.chromiumapp.org/` as an **Authorized redirect URI** on your OAuth client
7. Add your Google account email as a **Test user** in the OAuth consent screen

### 3. Backend and PWA Deployment

```bash
npm install
npm run build
```

Deploy the same root project to Vercel:

```bash
vercel --prod
```

Vercel serves the PWA from the root static build and keeps serverless APIs under `/api/*`. Do not add rewrites that shadow `/api/*`.

Set the environment variables in Vercel dashboard:
- `ANTHROPIC_API_KEY` — your Anthropic API key
- `GOOGLE_CLIENT_ID` — your Google OAuth client ID (same as in manifest.json)
- `GOOGLE_CLIENT_SECRET` — your Google OAuth client secret (from Google Cloud Console → Credentials → your OAuth client)
- `SESSION_SECRET` — random session encryption secret, minimum 32 characters

### 4. Configure the Extension

1. Click the extension icon → **Settings** (gear icon)
2. Set **Backend URL** to your Vercel deployment URL (e.g., `https://calendur.vercel.app`)
3. Connect your Google account
4. Set default calendar, event duration, and reminders

### 5. Configure the PWA

1. Open `https://<your-vercel-domain>/` in iPhone Safari
2. Share → **Add to Home Screen**
3. Launch Calendur from the Home Screen icon
4. Tap **Connect** and complete Google OAuth
5. Set default calendar, event duration, and reminders

The PWA has no Backend URL setting. It calls the deployed same-origin Vercel APIs automatically, including `/api/parse`, `/api/web/auth/*`, and `/api/web/calendar/*`.

The first PWA iteration is online-only. It does not include offline drafts, offline sync, push notifications, native app store packaging, or background calendar sync.

## Settings

| Setting | Description |
|---------|-------------|
| Backend URL | Extension-only Vercel deployment URL |
| Default Calendar | Which Google Calendar to add events to |
| Default Duration | Fallback when no end time is mentioned (15m/30m/1h/2h) |
| Default Reminders | Up to 5 reminders applied to every event |

## Tech Stack

- **Extension:** Vanilla HTML/CSS/JS, Chrome Manifest V3
- **PWA:** Vite, React, TypeScript
- **Backend:** Vercel serverless function, Anthropic SDK
- **AI:** Claude Haiku for text parsing
- **Auth:** Google OAuth 2.0; the PWA stores Google session material in an encrypted HttpOnly cookie
