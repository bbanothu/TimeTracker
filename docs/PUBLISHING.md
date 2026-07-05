# Publishing Tempo to Google Play

Package name: `com.time_tracker.app`  
EAS project: https://expo.dev/accounts/bbanothu/projects/TimeTracker

## 1. Privacy policy

- File: [`docs/privacy-policy.html`](../privacy-policy.html)
- Host on GitHub Pages:
  1. Repo → **Settings** → **Pages**
  2. Source: **Deploy from a branch**
  3. Branch: `main` → folder `/docs`
  4. Save
- Policy URL (after Pages is enabled):  
  `https://bbanothu.github.io/TimeTracker/privacy-policy.html`
- Paste that URL in Play Console → **App content** → **Privacy policy**

## 2. EAS environment variables (required — app won't sign in without these)

The production build succeeded, but **Supabase credentials were not in EAS yet**. Add them before shipping:

1. Open [Environment variables](https://expo.dev/accounts/bbanothu/projects/TimeTracker/environment-variables)
2. Environment: **production**
3. Add:

| Name | Value |
|------|--------|
| `EXPO_PUBLIC_SUPABASE_URL` | from `app/.env` |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | from `app/.env` |

4. Rebuild: `eas build --platform android --profile production`

## 3. Build the Android app bundle (.aab)

```bash
cd app
eas build --platform android --profile production
```

- Android keystore is stored on Expo (Build Credentials I1-NE6wVG8).
- Build dashboard: https://expo.dev/accounts/bbanothu/projects/TimeTracker/builds

**Latest successful build (v1.0.0, versionCode 5):**  
https://expo.dev/accounts/bbanothu/projects/TimeTracker/builds/41e051ea-7d70-4824-bac8-ded4a7823204

Download `.aab`:  
https://expo.dev/artifacts/eas/OouPTt8JO4eov0E5I7o-smpqO7jrmrFRitJsRWJSMc4.aab

Or submit directly:

```bash
eas submit --platform android --profile production
```

## 4. Play Console checklist

After creating the app with package `com.time_tracker.app`:

| Task | Where |
|------|--------|
| Store listing | Short + full description, screenshots, 512×512 icon, 1024×500 feature graphic |
| Privacy policy | App content → Privacy policy |
| Data safety | Location, email, photos, app activity |
| Background location | App content → Sensitive permissions (video + justification for geofencing) |
| Content rating | IARC questionnaire |
| Internal testing | Release → Testing → upload `.aab`, add yourself as tester |

### Suggested store copy

**Short (80 chars):**  
`Automatic time tracking by place. Find the rhythm of your days.`

**Full:**  
Tempo helps you understand how you spend your time. Tag activities, set daily goals, and let saved places auto-start tracking when you arrive. View stats, history, and progress — syncs across devices.

## 5. Background location declaration (Google)

Google will ask why you need background location. Use something like:

> Tempo uses background location only when the user enables auto-tracking for saved places. When the user enters a configured place (geofence), the app automatically starts a time-tracking session and may send a notification. Location is not used for advertising or sold to third parties.

Provide a short screen recording showing: save a place → enable auto-tracking → enter the geofence → session starts.

---

## 6. Automate Play Store uploads (EAS Submit)

After your first manual upload, set this up once so future releases are one command.

### One-time: Google Play service account

1. **Google Cloud Console** → your project → **IAM & Admin** → **Service Accounts** → **Create**
   - Name: `eas-submit` (or similar)
   - Role: none required at the GCP level
2. Open the service account → **Keys** → **Add key** → **JSON** → download the file
3. Save it as `app/google-play-service-account.json` (gitignored)
4. **Play Console** → **Users and permissions** → **Invite new users**
   - Paste the service account email (`...@...iam.gserviceaccount.com`)
   - Permissions: **Release to testing tracks** (and **Release to production** when ready)
   - App access: this app only (`com.time_tracker.app`)
5. Accept the invite (can take a few minutes to propagate)

`eas.json` already points at `./google-play-service-account.json` and submits to the **internal** track.

### Day-to-day commands (from `app/`)

| Command | What it does |
|---------|----------------|
| `npm run build:android` | Build `.aab` on EAS only |
| `npm run publish:android` | Upload **latest** EAS build to Play internal testing |
| `npm run release:android` | **Build + upload** in one step (`--auto-submit`) |

Examples:

```bash
cd app

# Build on EAS, then push to Play internal testing automatically
npm run release:android

# Or: build first, submit later
npm run build:android
npm run publish:android
```

`publish:android` uses `--latest` so it submits the most recent successful Android production build — no manual `.aab` download.

### Promote tracks later

Edit `app/eas.json` → `submit.production.android.track`:

| Track | When |
|-------|------|
| `internal` | Internal testers (current) |
| `alpha` | Closed testing |
| `beta` | Open testing |
| `production` | Public Play Store |

### Optional: CI on every push to `main`

Add `.github/workflows/release-android.yml` in the repo root to run `eas build --auto-submit` on merge. Requires an `EXPO_TOKEN` GitHub secret (`eas token:create`).
