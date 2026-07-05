-- TimeTracker Supabase migration
-- Run this in the Supabase SQL Editor after creating your project.

-- Tags
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, name)
);

-- Time entries
CREATE TABLE IF NOT EXISTS time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at BIGINT NOT NULL,
  ended_at BIGINT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('manual', 'geofence')),
  geofence_id UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Time entry tags (junction)
CREATE TABLE IF NOT EXISTS time_entry_tags (
  entry_id UUID NOT NULL REFERENCES time_entries(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  PRIMARY KEY (entry_id, tag_id)
);

-- Geofences
CREATE TABLE IF NOT EXISTS geofences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  radius_meters INTEGER NOT NULL DEFAULT 150,
  enabled BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for sync queries
CREATE INDEX IF NOT EXISTS idx_tags_user_updated ON tags(user_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_time_entries_user_updated ON time_entries(user_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_geofences_user_updated ON geofences(user_id, updated_at);

-- Row Level Security
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entry_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE geofences ENABLE ROW LEVEL SECURITY;

CREATE POLICY tags_select ON tags FOR SELECT USING (user_id = auth.uid());
CREATE POLICY tags_insert ON tags FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY tags_update ON tags FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY tags_delete ON tags FOR DELETE USING (user_id = auth.uid());

CREATE POLICY time_entries_select ON time_entries FOR SELECT USING (user_id = auth.uid());
CREATE POLICY time_entries_insert ON time_entries FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY time_entries_update ON time_entries FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY time_entries_delete ON time_entries FOR DELETE USING (user_id = auth.uid());

CREATE POLICY time_entry_tags_select ON time_entry_tags FOR SELECT USING (user_id = auth.uid());
CREATE POLICY time_entry_tags_insert ON time_entry_tags FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY time_entry_tags_delete ON time_entry_tags FOR DELETE USING (user_id = auth.uid());

CREATE POLICY geofences_select ON geofences FOR SELECT USING (user_id = auth.uid());
CREATE POLICY geofences_insert ON geofences FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY geofences_update ON geofences FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY geofences_delete ON geofences FOR DELETE USING (user_id = auth.uid());
