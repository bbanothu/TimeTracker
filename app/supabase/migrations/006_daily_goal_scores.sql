-- Daily goal progress scores (average % toward targets, one row per calendar day)
-- Run in Supabase SQL Editor after 005_tag_daily_goals.sql

CREATE TABLE IF NOT EXISTS daily_goal_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date_key TEXT NOT NULL CHECK (date_key ~ '^\d{4}-\d{2}-\d{2}$'),
  score_percent INTEGER NOT NULL CHECK (score_percent >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, date_key)
);

CREATE INDEX IF NOT EXISTS idx_daily_goal_scores_user_updated
  ON daily_goal_scores(user_id, updated_at);

ALTER TABLE daily_goal_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY daily_goal_scores_select ON daily_goal_scores
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY daily_goal_scores_insert ON daily_goal_scores
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY daily_goal_scores_update ON daily_goal_scores
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY daily_goal_scores_delete ON daily_goal_scores
  FOR DELETE USING (user_id = auth.uid());
