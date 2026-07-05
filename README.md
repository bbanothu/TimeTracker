# TimeTracker

Track how you spend your time with tags, stats, and optional location-based auto-tracking. The repo contains two clients that share the same Supabase backend:

| Folder | Platform | Stack |
|--------|----------|-------|
| [`app/`](app/) | iOS & Android | Expo, React Native, Expo Router, SQLite |
| [`web/`](web/) | Browser | Vite, React, Tailwind CSS |
| [`electron/`](electron/) | macOS, Windows, Linux | Electron (wraps the web client) |

## Features

- **Manual tracking** — Start and stop a timer with one or more activity tags.
- **Tags** — Hierarchical tags with colors; organize activities your way.
- **Stats** — Daily, weekly, and monthly breakdowns by tag and saved place.
- **Geofencing** (mobile only) — Save places on a map; auto-start tracking when you enter, with optional notifications.
- **Sync** — Mobile stores data locally in SQLite and syncs to Supabase when online.
- **Export** — Download time entries as CSV from Profile.

## Prerequisites

- [Node.js](https://nodejs.org/) 18+
- A [Supabase](https://supabase.com/) project
- For mobile: [Expo Go](https://expo.dev/go) or a dev build on a physical device (geofencing requires real location)

## Supabase setup

1. Create a Supabase project.
2. Run the SQL migrations in [`app/supabase/migrations/`](app/supabase/migrations/) via the Supabase SQL Editor.
3. Copy the project URL and anon key into each client’s env file (see below).

## Mobile app (`app/`)

### Environment

Copy the example env file and add your Supabase credentials:

```bash
cd app
cp .env.example .env
```

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

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
| `npm run ios` | Open on iOS simulator |
| `npm run android` | Open on Android emulator |

### Project layout

```
app/
  app/              Expo Router screens (auth, tabs, profile)
  src/
    components/     UI components
    contexts/       Auth, tags, timer, theme
    db/             SQLite schema and client
    hooks/          Session, stats, geofence hooks
    services/       Sync, geofence, notifications, stats
  assets/           Icons, login backgrounds
  supabase/         Database migrations
```

Geofencing, background location, and push notifications are mobile-only features.

## Web app (`web/`)

A browser companion with the same look and feel. Uses Supabase directly (no local SQLite). Geofence enter/exit tracking is not available on web; you can still view and manage saved places.

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
| `npm run preview` | Preview the production build |

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

**First launch on macOS:** if macOS blocks the app (“unidentified developer”), right-click the app → **Open** → **Open** once. To avoid that long-term you’d need an Apple Developer certificate and notarization.

| Script | Description |
|--------|-------------|
| `npm run dev` | Dev: Vite + Electron window with hot reload |
| `npm run start` | Build web + run in Electron (no installer) |
| `npm run pack` | Build web + unpackaged `.app` in `release/` (quick test) |
| `npm run dist` | Build web + `.dmg` / `.zip` installer |

Geofence auto-tracking is not available on desktop (same as web); you can still view the map and manage places.

## Auth

Both clients use Supabase Auth (email/password). Create an account from the Register screen on either client; the same login works across mobile and web.

docker buildx build --platform linux/arm64 -t bbanothu1997/time-tracker:latest --push .

nohup /data/cloudflared tunnel run brainrotslop > /tmp/cloudflared.log 2>&1 &