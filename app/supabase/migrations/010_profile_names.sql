-- First and last name on profiles; keep display_name in sync for friends UI
-- Run after 009_friendships.sql

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT;

CREATE OR REPLACE FUNCTION public.sync_profile_display_name()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.display_name := NULLIF(
    trim(concat_ws(' ', NULLIF(trim(NEW.first_name), ''), NULLIF(trim(NEW.last_name), ''))),
    ''
  );
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_sync_display_name ON profiles;
CREATE TRIGGER profiles_sync_display_name
  BEFORE INSERT OR UPDATE OF first_name, last_name ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.sync_profile_display_name();

-- Backfill display_name from any existing first/last values
UPDATE profiles
SET display_name = NULLIF(
  trim(concat_ws(' ', NULLIF(trim(first_name), ''), NULLIF(trim(last_name), ''))),
  ''
)
WHERE first_name IS NOT NULL OR last_name IS NOT NULL;
