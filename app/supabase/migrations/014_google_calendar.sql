-- Google Calendar OAuth tokens and session sync tracking
-- Run after 013_active_sessions.sql

CREATE TABLE IF NOT EXISTS google_calendar_oauth_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  return_to TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_google_calendar_oauth_states_created
  ON google_calendar_oauth_states (created_at);

ALTER TABLE google_calendar_oauth_states ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS user_google_calendar (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  google_email TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  access_token TEXT,
  token_expires_at TIMESTAMPTZ,
  calendar_id TEXT NOT NULL DEFAULT 'primary',
  last_synced_at TIMESTAMPTZ,
  connected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE user_google_calendar ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS calendar_event_sync (
  entry_id UUID NOT NULL REFERENCES time_entries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'google',
  external_event_id TEXT NOT NULL,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (entry_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_calendar_event_sync_user
  ON calendar_event_sync (user_id, provider);

ALTER TABLE calendar_event_sync ENABLE ROW LEVEL SECURITY;

CREATE POLICY calendar_event_sync_select_own ON calendar_event_sync
  FOR SELECT USING (user_id = auth.uid());
