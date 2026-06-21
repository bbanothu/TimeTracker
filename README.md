# TimeTracker

Track how you spend your time with tags, stats, and optional location-based auto-tracking. The repo contains two clients that share the same Supabase backend:

| Folder | Platform | Stack |
|--------|----------|-------|
| [`app/`](app/) | iOS & Android | Expo, React Native, Expo Router, SQLite |
| [`web/`](web/) | Browser | Vite, React, Tailwind CSS |

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

## Auth

Both clients use Supabase Auth (email/password). Create an account from the Register screen on either client; the same login works across mobile and web.
