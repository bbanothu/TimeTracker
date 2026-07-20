-- Daily time goals per top-level tag
-- Run in Supabase SQL Editor after 004_tag_analytics.sql

CREATE TABLE IF NOT EXISTS tag_daily_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  target_minutes INTEGER NOT NULL CHECK (target_minutes > 0 AND target_minutes <= 1440),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_tag_daily_goals_user_updated
  ON tag_daily_goals(user_id, updated_at);

ALTER TABLE tag_daily_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY tag_daily_goals_select ON tag_daily_goals
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY tag_daily_goals_insert ON tag_daily_goals
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY tag_daily_goals_update ON tag_daily_goals
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY tag_daily_goals_delete ON tag_daily_goals
  FOR DELETE USING (user_id = auth.uid());
