# TimeTracker — Mobile app

iOS and Android client built with **Expo 54**, **React Native**, and **Expo Router**. Tracks time locally in **SQLite** and syncs to **Supabase** when online.

## Quick start

```bash
cp .env.example .env   # add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY
npm install
npx expo start
```

Run migrations in [`supabase/migrations/`](supabase/migrations/) against your Supabase project before signing in (see the root [README](../README.md#supabase-setup)).

## Environment

| Variable                        | Description                |
| ------------------------------- | -------------------------- |
| `EXPO_PUBLIC_SUPABASE_URL`      | Supabase project URL       |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon (public) key |

For EAS production builds, set the same variables in the Expo **production** environment — see [`docs/PUBLISHING.md`](../docs/PUBLISHING.md).

## Scripts

| Script                    | Description                                                  |
| ------------------------- | ------------------------------------------------------------ |
| `npm start`               | Expo dev server                                              |
| `npm run ios`             | iOS simulator via `expo run:ios`                             |
| `npm run android`         | Android emulator via `expo run:android`                      |
| `npm run web`             | Expo web preview                                             |
| `npm run format`          | Prettier                                                     |
| `npm run bump:minor`      | Bump patch/minor version in `package.json` and native config |
| `npm run build:android`   | Bump + EAS Android production build                          |
| `npm run build:ios`       | Bump + EAS iOS production build                              |
| `npm run build:all`       | Bump + EAS build for both platforms                          |
| `npm run release:android` | Build + auto-submit to Play internal track                   |
| `npm run release:ios`     | Build + auto-submit to App Store Connect                     |
| `npm run publish:android` | Submit latest Android build to Play                          |
| `npm run publish:ios`     | Submit latest iOS build to App Store                         |
| `npm run publish:all`     | Submit latest builds for both platforms                      |

EAS config: [`eas.json`](eas.json). Package name: `com.time_tracker.app`.

## Screens

| Route                                                                | Purpose                                         |
| -------------------------------------------------------------------- | ----------------------------------------------- |
| `(tabs)/` Track                                                      | Manual timers, active sessions, today's entries |
| `(tabs)/tags`                                                        | Tag CRUD with hierarchy, colors, descriptions   |
| `(tabs)/map`                                                         | Saved places; geofence setup                    |
| `(tabs)/stats`                                                       | Period stats, charts, friend selector           |
| `(tabs)/goals`                                                       | Daily minute targets and progress               |
| `profile`                                                            | Account, sync, export, theme, navigation        |
| `history`                                                            | Filtered entry list; edit times, tags, details  |
| `friends`                                                            | Friend requests and list                        |
| `progress`                                                           | Goal progress history                           |
| `(auth)/login`, `(auth)/register`                                    | Sign in / sign up                               |
| `change-password`, `privacy`, `terms`, `about`, `contact`, `support` | Account and legal pages                         |

## Project layout

```
app/
  app/                  Expo Router screens
  src/
    components/         Shared UI (timer, stats, geofences, modals)
    constants/          Support email, calendar colors
    db/                 SQLite schema and client
    hooks/              Auth, tags, timer, stats, geofences, theme
    lib/                Supabase client, geocoding, stop location
    navigation/         Header options
    services/           Sync, geofence, notifications, export, calendar
    tasks/              Background geofence task
    types/              Shared TypeScript types
    utils/              Stats, goals, history filters, CSV export
  assets/               Icons, Lottie loaders, login backgrounds
  scripts/              Version bump helper
  supabase/migrations/  Database migrations (run on Supabase)
  screenshots/          Store screenshot assets
```

## Mobile-only capabilities

- **Geofencing** — Background location task auto-starts/stops sessions at saved places
- **Notifications** — Alert when geofence tracking starts
- **Offline SQLite** — Local source of truth with background sync to Supabase
- **Sync now** — Manual push/pull from Account; shows last sync time

Web and desktop clients share tags, entries, goals, and friends via Supabase but do not run geofence monitoring or local SQLite.

## Related docs

- [Root README](../README.md) — Monorepo overview
- [Features](../docs/FEATURES.md) — Full feature list and platform matrix
- [Publishing](../docs/PUBLISHING.md) — Play Store and EAS submit
- [Google Calendar](../docs/GOOGLE_CALENDAR.md) — Optional calendar sync
