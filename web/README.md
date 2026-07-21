# TimeTracker — Web app

Browser client built with **Vite**, **React 19**, **Tailwind CSS**, and **React Router**. Talks to **Supabase** directly (no local database). Responsive layout: sidebar on desktop, bottom nav on narrow viewports.

## Quick start

```bash
cp .env.example .env   # add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm install
npm run dev
```

Open `http://localhost:5173` (or the URL Vite prints). Run Supabase migrations from [`../app/supabase/migrations/`](../app/supabase/migrations/) first (see root [README](../README.md#supabase-setup)).

## Environment

| Variable                 | Description                |
| ------------------------ | -------------------------- |
| `VITE_SUPABASE_URL`      | Supabase project URL       |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon (public) key |

Use the same Supabase project as the mobile app so accounts and data stay in sync.

## Scripts

| Script                 | Description                                     |
| ---------------------- | ----------------------------------------------- |
| `npm run dev`          | Vite dev server with HMR                        |
| `npm run build`        | Typecheck + production build to `dist/`         |
| `npm run preview`      | Serve `dist/` locally                           |
| `npm run format`       | Prettier                                        |
| `npm run docker`       | Build app, build Docker image, push to registry |
| `npm run build:docker` | Same as `docker` (alias)                        |

## Routes

| Path                                                           | Page                                                  |
| -------------------------------------------------------------- | ----------------------------------------------------- |
| `/`                                                            | Track — timers, active sessions, today's entries      |
| `/tags`                                                        | Tag management                                        |
| `/map`                                                         | Saved places + **heatmap** (Places \| Heatmap toggle) |
| `/stats`                                                       | Period stats and charts                               |
| `/stats/progress`                                              | Goal progress history                                 |
| `/goals`                                                       | Daily targets                                         |
| `/profile`                                                     | Account, theme, export, refresh                       |
| `/profile/history`                                             | Entry history with filters                            |
| `/friends`                                                     | Friend requests                                       |
| `/login`, `/register`                                          | Auth                                                  |
| `/change-password`, `/privacy`, `/terms`, `/about`, `/contact` | Account and legal                                     |

Static HTML (no JS required) for store review:

- `/support` → `public/support.html`
- `/privacy` → `public/privacy-policy.html`

## Web-specific features

- **Map heatmap** — Duration-weighted heatmap of stop locations (day/week/month); falls back to saved-place center when stop GPS is missing
- **Leaflet maps** — Places mode with geofence circles; desktop sticky map column
- **Direct Supabase** — No offline cache; Account → refresh reloads from cloud
- **Electron** — When wrapped by [`../electron/`](../electron/), uses hash routing automatically

Geofence **auto-start/stop** is not available on web (mobile only).

## Project layout

```
web/
  public/               Static assets, support/privacy HTML
  src/
    components/
      layout/           App shell, nav, headers, legal layout
      ui/               Shared UI (maps, modals, stats, tags)
    config/             Nav tab definitions
    contexts/           Auth, tags, timer, goals, theme
    hooks/              Stats visualization, media queries
    lib/                Supabase, geocoding, heatmap helpers
    pages/              Route pages
    routes/             Protected layout, providers
    services/           Data, friends, stats, calendar, profile photo
    theme/              Color tokens
    types/              TypeScript types
    utils/              Stats, goals, CSV export, heatmap points
  Dockerfile            nginx image serving dist/
  nginx.conf            SPA fallback + /support and /privacy routes
```

## Docker deployment

Build the app and produce a container image (requires Docker Buildx):

```bash
npm run docker
```

This runs `npm run build`, then:

```bash
docker buildx build --platform linux/arm64 -t bbanothu1997/time-tracker:latest --push .
```

**Before building:** set `VITE_SUPABASE_*` in `.env` — Vite inlines them at build time.

The image uses **nginx:alpine**, serves `dist/` on port 80, and routes unknown paths to `index.html` for client-side routing.

To build without pushing, run locally:

```bash
npm run build
docker build -t timetracker-web .
docker run -p 8080:80 timetracker-web
```

## Related docs

- [Root README](../README.md) — Monorepo overview
- [Features](../docs/FEATURES.md) — Full feature list and platform matrix
- [Google Calendar](../docs/GOOGLE_CALENDAR.md) — Optional calendar sync
