-- Optional notes per tag
-- Run in Supabase SQL Editor after 010_profile_names.sql

ALTER TABLE tags
  ADD COLUMN IF NOT EXISTS description TEXT;
