# Google Calendar integration setup

TimeTracker can export completed sessions to Google Calendar. This uses a **separate** Google OAuth connection (not your login).

## 1. Google Cloud Console

1. Open [Google Cloud Console](https://console.cloud.google.com/) and create or select a project.
2. Enable **Google Calendar API** (APIs & Services → Library).
3. Configure the **OAuth consent screen**:
   - User type: External (or Internal for Workspace-only testing)
   - App name: TimeTracker
   - Support email: your email
   - Privacy policy URL: your hosted `docs/privacy-policy.html` URL
   - Scopes: add `https://www.googleapis.com/auth/calendar.events`
4. Create an OAuth **Web application** client:
   - Authorized redirect URI: your Supabase Edge Function callback URL (see step 2)

## 2. Supabase Edge Functions

Deploy the functions under [`app/supabase/functions/`](../app/supabase/functions/).

After deploying, your OAuth redirect URI is:

```
https://<PROJECT_REF>.supabase.co/functions/v1/google-calendar-connect
```

Run migration [`014_google_calendar.sql`](../app/supabase/migrations/014_google_calendar.sql) in the Supabase SQL Editor.

Set these **secrets** in Supabase (Project Settings → Edge Functions → Secrets):

| Secret | Description |
|--------|-------------|
| `GOOGLE_CLIENT_ID` | Web OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Web OAuth client secret |
| `GOOGLE_REDIRECT_URI` | Optional — redirect URI is derived from `SUPABASE_URL` automatically |

`SUPABASE_URL` is provided automatically to Edge Functions. The redirect URI is always:

```
https://<PROJECT_REF>.supabase.co/functions/v1/google-calendar-connect
```

Register that exact URL in Google Cloud Console (Authorized redirect URIs).

Deploy:

```bash
cd app
npx supabase login
npx supabase link --project-ref <PROJECT_REF>
npx supabase functions deploy google-calendar-connect
npx supabase functions deploy google-calendar-status
npx supabase functions deploy google-calendar-sync
npx supabase functions deploy google-calendar-disconnect
```

## 3. Testing mode

While the OAuth app is in **Testing**, add your Google account under Test users on the consent screen. Public release may require Google verification for the `calendar.events` scope.

**Important:** In Testing mode, Google refresh tokens expire after ~7 days. If sync says “failed to refresh Google token” or creates 0 events after reconnecting, disconnect and connect Google Calendar again.

Also verify **Google Calendar API** is enabled for the same Cloud project as your OAuth client (APIs & Services → Library).

## 4. Mobile deep link

The app uses scheme `timetracker://` (see `app/app.json`). After Google OAuth, users are redirected to `timetracker://profile?calendar=connected`.

No extra Google OAuth client is required for mobile MVP — the web client + Edge Function callback handles the flow via in-app browser.

## 5. Client env

No Google credentials in web or mobile `.env` files. Clients only need existing Supabase URL and anon key.
