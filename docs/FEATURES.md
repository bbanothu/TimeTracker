# TimeTracker — Feature Overview

TimeTracker helps you log how you spend your time using **tags**, **saved places**, **stats**, and **goals**. The project ships two main clients that share one Supabase backend:

| Client | Folder | Data storage |
|--------|--------|--------------|
| **Mobile** (iOS & Android) | `app/` | Local SQLite + cloud sync |
| **Web** (browser) | `web/` | Supabase directly |
| **Desktop** (macOS / Windows / Linux) | `electron/` | Same as web (wraps the Vite app) |

The same account works across all clients.

---

## Shared concepts

These apply everywhere unless noted in the platform matrix below.

### Authentication
- Email/password sign-up and login via Supabase Auth
- Change password from Profile
- Protected routes — unauthenticated users are redirected to login

### Tags
- Create, edit, and delete activity tags
- **Hierarchical tags** — assign a parent tag to build a tree
- **Colors** — pick from a preset palette
- **Descriptions** — optional notes on a tag
- **Analytics toggle** — exclude a tag from stats/goal rollups when disabled
- Sub-tag time rolls up to parent categories for goals and analytics

### Time entries
- Each entry has start/end timestamps, one or more tags, and a source (`manual` or `geofence`)
- **Multiple concurrent sessions** — start more than one timer at a time
- **Manual sessions** — add past sessions via a modal (start/end time + tags)
- **Stop metadata** (app + web):
  - GPS coordinates captured when you stop a session (`stop_latitude`, `stop_longitude`)
  - Optional **Details** text (notes about what you did)
  - Details modal appears right after stopping; editable later in History
- Entries linked to a saved place store `geofence_id`

### Saved places (geofences)
- Named locations on a map with a radius (meters) and linked tag
- Enable/disable per place without deleting
- **Edit saved places** — name, tag, radius, and pin location (pencil icon on list)
- Delete from the list

### Stats
- Periods: **day**, **week**, **month** with prev/next navigation
- KPIs: total time, entry count, top tag
- Breakdowns by tag and by saved place
- Chart views: **Overview**, **Bars**, **List**, **Stacked**, **Trend** (trend hidden for single-day view)
- Chart type preference is persisted per device
- **Friend stats** — view an accepted friend’s stats (read-only)

### Goals
- Set **daily minute targets** per top-level tag category
- Live progress for today (includes active session time)
- Sub-tag time counts toward the parent goal
- **Goal progress history** — daily score snapshots over day/week/month; linked from Stats

### Friends
- Send friend requests by email
- Accept, decline, or remove friendships
- Pending-request badge on Profile
- View friend stats (not their goals/progress history)

### Profile & account
- First and last name (display name)
- Profile photo upload (Supabase Storage)
- Dark / light theme toggle (transparent switch background)
- Links to History, Friends, Change password

### Export
- Download time entries as **aggregated CSV** (grouped by day/tag)
- Mobile exports from local DB; web exports from Supabase

---

## Mobile app (`app/`)

Expo + React Native with Expo Router. Five main tabs plus stack screens for Profile, History, Friends, Goal progress, and auth.

### Track
- Pick a tag and start/stop manual timers
- Live list of **active sessions** with elapsed time
- Today’s completed entries below the timer
- **Stop flow**: captures GPS on stop → opens Details modal → optional notes saved to entry
- Add manual past sessions
- Shows saved-place name when a session was started by geofence

### Tags
- Full tag CRUD with hierarchy, colors, descriptions, and analytics toggle
- Tree-style list with expand/collapse

### Map
- **Places mode only** (heatmap is web-only for now)
- Tap map to drop a pin, name the place, set radius, link a tag, save
- List of saved places with enable/disable, edit (pencil), and delete
- **Edit modal** — adjust name, tag, radius, and move pin on an embedded map
- Larger edit/delete controls sized to match other touch targets

### Geofencing (mobile-only)
- Background location task auto-starts tracking when entering an enabled saved place
- Auto-stops when leaving (with stop GPS when available)
- Push notifications on enter (“Tracking started at …”)
- Requests foreground, background location, and notification permissions
- Foreground fallback checks while the app is open
- Geofence state syncs to the OS geofencing API after local changes

### Stats
- Same periods, KPIs, and chart types as web
- Person selector for self vs. friend
- Navigate to **Goal progress** for your own stats (not for friends)

### Goals
- Category list with target minutes and today’s progress bars
- Inline save per category

### Profile (stack)
- Identity card with photo, name, email, theme toggle
- **Sync now** — push/pull local SQLite ↔ Supabase; shows last sync time
- Export CSV, clear all entries (keeps tags/places), sign out
- Navigation rows: History, Friends (with pending badge), Change password

### History (stack)
- All entries, newest first
- Filters: date range, tags, source (manual/geofence), text search
- Edit entry: times, tags, **Details** field
- Delete entries

### Sync & offline (mobile-only)
- SQLite is the source of truth on device
- Background sync scheduler pushes changes when online
- Tags, entries, geofences, goals, daily goal scores, and profile data sync to Supabase
- Stop coordinates and details included in sync (migration `012_entry_stop_details.sql`)

---

## Web app (`web/`)

Vite + React + Tailwind. Responsive layout with sidebar on desktop and bottom nav on mobile widths.

### Track
- Same core timer UX as mobile (no geofence auto-start)
- Stop → GPS attempt → Details modal → save notes
- Today’s entries and active sessions

### Tags
- Create/edit in a bottom sheet (mobile) or inline panel (desktop)
- Parent picker, color, description, analytics toggle

### Map
Two modes via **Places | Heatmap** toggle:

#### Places
- Click map to drop pin; create saved places (name, radius, tag)
- Edit, enable/disable, delete from list
- Leaflet map with geofence circles
- Desktop: sticky map column; mobile: map inline in the flow

#### Heatmap (web-only)
- Visualizes **where time was spent** from session stop locations
- **Day / week / month** filter with prev/next (Stats-style toolbar)
- Intensity weighted by **session duration** (longer = hotter)
- Location resolution:
  1. Stop GPS if captured
  2. Else saved-place center when `geofence_id` is set
- Google-style rendering: soft green → yellow → orange → red blobs, merged via grid aggregation + large blur radius
- Summary line: session count and total tracked time in period

### Stats
- Period toolbar, KPI row, chart type selector
- Friend person selector
- **Goal progress** link opens `/stats/progress` with period/date query params

### Goals
- Same daily targets and live progress as mobile

### Goal progress (`/stats/progress`)
- Daily goal score history for selected period
- Snapshots computed from entries + goals

### Profile & sub-pages
- **Profile** — name, photo, theme, refresh data from cloud, export, clear entries, sign out
- **History** (`/profile/history`) — filters, edit (including Details), delete
- **Friends** — requests and friend list
- **Change password**

### Layout & UX
- Dark/light theme with transparent toggle circle
- `BottomSheetModal` supports header action buttons (e.g. save icon on stop-details modal)
- Electron uses hash routing when running as desktop shell

---

## Desktop (`electron/`)

Not a separate feature set — it packages the **web client** in a native window.

- Same features as web
- No geofence auto-tracking
- Map places + heatmap work in the desktop window
- Installable via `.dmg` / platform installers (`npm run dist` from `electron/`)

---

## Platform comparison

| Feature | Mobile | Web | Desktop |
|---------|:------:|:---:|:-------:|
| Manual timer | ✓ | ✓ | ✓ |
| Multiple active sessions | ✓ | ✓ | ✓ |
| Stop GPS + Details | ✓ | ✓ | ✓ |
| Manual past sessions | ✓ | ✓ | ✓ |
| Tags (hierarchy, colors, descriptions) | ✓ | ✓ | ✓ |
| Saved places — create/edit/delete | ✓ | ✓ | ✓ |
| Geofence auto-start/stop | ✓ | — | — |
| Enter notifications | ✓ | — | — |
| Map heatmap | — | ✓ | ✓ |
| Stats + chart types | ✓ | ✓ | ✓ |
| View friend stats | ✓ | ✓ | ✓ |
| Daily goals + progress history | ✓ | ✓ | ✓ |
| Friends | ✓ | ✓ | ✓ |
| History edit/delete | ✓ | ✓ | ✓ |
| CSV export | ✓ | ✓ | ✓ |
| Profile photo | ✓ | ✓ | ✓ |
| Dark/light theme | ✓ | ✓ | ✓ |
| Offline + local SQLite | ✓ | — | — |
| Cloud sync | ✓ | direct | direct |

---

## Database & migrations

Supabase migrations live in `app/supabase/migrations/`. Run them in order in the Supabase SQL editor.

| Migration | Purpose |
|-----------|---------|
| `001_initial.sql` | Tags, time entries, geofences, RLS |
| `002_nested_tags.sql` | Parent tag hierarchy |
| `003_profile_storage.sql` | Profile photo bucket |
| `004_tag_analytics.sql` | `include_in_analytics` on tags |
| `005_tag_daily_goals.sql` | Daily goal targets |
| `006_daily_goal_scores.sql` | Goal score snapshots |
| `007_tag_daily_goals_zero_target.sql` | Allow zero-minute targets |
| `008_profiles.sql` | Profile records |
| `009_friendships.sql` | Friend requests |
| `010_profile_names.sql` | First/last name |
| `011_tag_descriptions.sql` | Tag description field |
| `012_entry_stop_details.sql` | Stop lat/lng + session details on entries |
| `013_active_sessions.sql` | Nullable `ended_at` for in-progress sessions synced across devices |

Mobile SQLite schema mirrors these fields (currently schema v8 in `app/src/db/schema.ts`).

---

## Recent feature work (session highlights)

Work completed across recent development cycles:

1. **Theme toggle** — transparent circle background on web and mobile
2. **Editable saved places** — edit modal on app and web; larger touch targets on mobile list
3. **Stop session enhancements** — GPS on stop, Details modal, editable in History
4. **Web map heatmap** — Places vs Heatmap toggle, period filters, duration-weighted intensity, geofence fallback coordinates, Google-style blended gradient
5. **Sync** — new stop fields flow through mobile sync and web data layer

---

## Running locally

```bash
# Mobile
cd app && npx expo start --clear

# Web
cd web && npm run dev

# Desktop (dev)
cd electron && npm run dev
```

Ensure Supabase env vars are set in `app/.env` and `web/.env`, and all migrations (through `012`) are applied.
