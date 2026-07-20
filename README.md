# TimeTracker

Track how you spend your time with tags, stats, goals, and optional location-based auto-tracking. The repo contains two main clients that share the same Supabase backend:

| Folder | Platform | Stack |
|--------|----------|-------|
| [`app/`](app/) | iOS & Android | Expo 54, React Native, Expo Router, SQLite |
| [`web/`](web/) | Browser | Vite, React, Tailwind CSS, Leaflet |
| [`electron/`](electron/) | macOS, Windows, Linux | Electron (wraps the web client) |

For a full feature breakdown and platform comparison, see [`docs/FEATURES.md`](docs/FEATURES.md).

## Features

- **Manual tracking** — Start and stop one or more timers at once, each tagged with activities.
- **Tags** — Hierarchical tags with colors, descriptions, and an analytics on/off toggle.
- **Stats** — Daily, weekly, and monthly breakdowns by tag and saved place; multiple chart views; view a friend's stats.
- **Goals** — Daily minute targets per category with live progress and historical score snapshots.
- **Friends** — Send requests by email and view accepted friends' stats.
- **Geofencing** (mobile only) — Save places on a map; auto-start tracking when you enter, with optional notifications.
- **Map heatmap** (web & desktop) — Visualize where time was spent from stop locations over day/week/month.
- **Stop details** — Capture GPS on stop and add optional session notes; editable later in History.
- **Sync** — Mobile stores data locally in SQLite and syncs to Supabase when online; web talks to Supabase directly.
- **Export** — Download aggregated time entries as CSV from Account.
- **Google Calendar** (optional) — Connect from Account and sync completed sessions as calendar events.
- **Profile** — Name, photo, dark/light theme, History, Friends, and password management.

## Prerequisites

- [Node.js](https://nodejs.org/) 18+
- A [Supabase](https://supabase.com/) project
- For mobile: [Expo Go](https://expo.dev/go) or a dev build on a physical device (geofencing requires real location)

## Supabase setup

1. Create a Supabase project.
2. Run the SQL migrations in [`app/supabase/migrations/`](app/supabase/migrations/) in order via the Supabase SQL Editor (through `014_google_calendar.sql` if using Google Calendar).
3. Copy the project URL and anon key into each client's env file (see below).

## Mobile app (`app/`)

Expo + React Native app with five tabs (Track, Tags, Map, Stats, Goals) plus stack screens for Account, History, Friends, Goal progress, and auth. Data is stored locally in SQLite and synced to Supabase.

See [`app/README.md`](app/README.md) for folder-specific setup, scripts, and layout.

### Environment

```bash
cd app
cp .env.example .env
```

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

For production builds on EAS, add the same variables to the **production** environment in the [Expo project settings](https://expo.dev/accounts/bbanothu/projects/TimeTracker/environment-variables).

### Install and run

```bash
cd app
npm install
npx expo start
```

Then open the project in Expo Go (scan the QR code) or press `i` / `a` for the iOS or Android simulator.

| Script | Description |
|--------|-------------|
| `npm start` | Start the Expo dev server |
| `npm run ios` | Run on iOS simulator (`expo run:ios`) |
| `npm run android` | Run on Android emulator (`expo run:android`) |
| `npm run build:android` | Bump version + EAS production Android build |
| `npm run build:ios` | Bump version + EAS production iOS build |
| `npm run release:android` | Build + auto-submit to Play internal testing |
| `npm run release:ios` | Build + auto-submit to App Store Connect |

Store publishing details: [`docs/PUBLISHING.md`](docs/PUBLISHING.md).

Geofencing, background location, push notifications, and offline SQLite sync are mobile-only features.

## Web app (`web/`)

Browser companion with the same look and feel. Uses Supabase directly (no local SQLite). Geofence enter/exit auto-tracking is not available on web; you can still view and manage saved places and use the **Heatmap** view to see where time was spent.

See [`web/README.md`](web/README.md) for folder-specific setup, Docker deployment, and layout.

### Environment

```bash
cd web
cp .env.example .env
```

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Use the same Supabase project as the mobile app.

### Install and run

```bash
cd web
npm install
npm run dev
```

Open the URL shown in the terminal (typically `http://localhost:5173`).

| Script | Description |
|--------|-------------|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Production build to `web/dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run docker` | Build, containerize, and push Docker image (see `web/README.md`) |

Static support and privacy pages are served at `/support` and `/privacy` (from `web/public/`).

## Desktop app (`electron/`)

A native desktop window around the same web client and Supabase backend. No separate codebase — Electron loads the Vite app from `web/`.

### Environment

Use the same Supabase credentials as the web app:

```bash
cd web
cp .env.example .env
# add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
```

### Install and run (development)

```bash
cd electron
npm install
npm run dev
```

This starts the Vite dev server and opens a desktop window. Hot reload works like the browser app.

### Production run (local build)

```bash
cd electron
npm run start
```

Builds the web app for Electron, then opens it in a desktop window.

### Package installers

**Before building:** ensure `web/.env` has your Supabase URL and anon key. Those values are baked into the app at build time.

**Use your own icon:** replace `electron/build/icon.png` with a 1024×1024 PNG (or run `./scripts/set-icon.sh /path/to/icon.png` from `electron/`).

```bash
cd electron
npm run dist
```

On macOS this produces:

- `release/TimeTracker-1.0.0.dmg` — drag **TimeTracker** into **Applications**
- `release/mac-arm64/TimeTracker.app` — the app bundle (open directly or copy to Applications)

After installing, launch **TimeTracker** from Applications or Spotlight like any other app.

**First launch on macOS:** if macOS blocks the app ("unidentified developer"), right-click the app → **Open** → **Open** once. To avoid that long-term you'd need an Apple Developer certificate and notarization.

| Script | Description |
|--------|-------------|
| `npm run dev` | Dev: Vite + Electron window with hot reload |
| `npm run start` | Build web + run in Electron (no installer) |
| `npm run pack` | Build web + unpackaged `.app` in `release/` (quick test) |
| `npm run dist` | Build web + `.dmg` / `.zip` installer |

Geofence auto-tracking is not available on desktop (same as web); map places and heatmap work in the desktop window.

## Auth

Both clients use Supabase Auth (email/password). Create an account from the Register screen on either client; the same login works across mobile, web, and desktop.

## Google Calendar (optional)

Connect Google Calendar from **Account → Connect Google Calendar** (web and mobile). Completed sessions can sync as calendar events. Setup requires Google Cloud OAuth credentials, Supabase Edge Functions, and migration `014_google_calendar.sql` — see [`docs/GOOGLE_CALENDAR.md`](docs/GOOGLE_CALENDAR.md).

## Documentation

| Doc | Contents |
|-----|----------|
| [`docs/FEATURES.md`](docs/FEATURES.md) | Full feature list and platform comparison |
| [`docs/GOOGLE_CALENDAR.md`](docs/GOOGLE_CALENDAR.md) | Google Calendar OAuth and sync setup |
| [`docs/PUBLISHING.md`](docs/PUBLISHING.md) | Play Store and EAS submit workflow |
