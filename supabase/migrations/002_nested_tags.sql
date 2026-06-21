-- Nested tags: add parent_id and sibling-unique names
-- Run in Supabase SQL Editor after 001_initial.sql

ALTER TABLE tags ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES tags(id) ON DELETE CASCADE;

ALTER TABLE tags DROP CONSTRAINT IF EXISTS tags_user_id_name_key;

CREATE UNIQUE INDEX IF NOT EXISTS idx_tags_user_parent_name
  ON tags(user_id, COALESCE(parent_id::text, ''), name);

CREATE INDEX IF NOT EXISTS idx_tags_parent ON tags(parent_id);
