-- Per-tag analytics visibility
-- Run in Supabase SQL Editor after 003_profile_storage.sql

ALTER TABLE tags
  ADD COLUMN IF NOT EXISTS include_in_analytics BOOLEAN NOT NULL DEFAULT true;
