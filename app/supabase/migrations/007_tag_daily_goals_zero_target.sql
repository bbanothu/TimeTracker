-- Allow zero-minute daily goals (e.g. "track no time on this category")
-- Run in Supabase SQL Editor after 005_tag_daily_goals.sql

ALTER TABLE tag_daily_goals
  DROP CONSTRAINT IF EXISTS tag_daily_goals_target_minutes_check;

ALTER TABLE tag_daily_goals
  ADD CONSTRAINT tag_daily_goals_target_minutes_check
  CHECK (target_minutes >= 0 AND target_minutes <= 1440);
