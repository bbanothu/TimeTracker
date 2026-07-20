-- Profile photo storage bucket and RLS
-- Run in Supabase SQL Editor after 002_nested_tags.sql
-- Also create a public "Profile" bucket in Storage if you prefer the dashboard UI;
-- this migration ensures bucket + policies exist.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'Profile',
  'Profile',
  false,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Profile photos: users read own" ON storage.objects;
DROP POLICY IF EXISTS "Profile photos: users insert own" ON storage.objects;
DROP POLICY IF EXISTS "Profile photos: users update own" ON storage.objects;
DROP POLICY IF EXISTS "Profile photos: users delete own" ON storage.objects;

CREATE POLICY "Profile photos: users read own"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'Profile' AND name = auth.uid()::text || '.jpg');

CREATE POLICY "Profile photos: users insert own"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'Profile' AND name = auth.uid()::text || '.jpg');

CREATE POLICY "Profile photos: users update own"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'Profile' AND name = auth.uid()::text || '.jpg')
WITH CHECK (bucket_id = 'Profile' AND name = auth.uid()::text || '.jpg');

CREATE POLICY "Profile photos: users delete own"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'Profile' AND name = auth.uid()::text || '.jpg');
