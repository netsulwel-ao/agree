-- ============================================
-- Disable RLS on storage buckets
-- ============================================

-- Make signatures bucket public
UPDATE storage.buckets SET public = true WHERE id = 'signatures';

-- Drop any existing RLS policies on storage.objects (ignore if they don't exist)
DROP POLICY IF EXISTS "Authenticated can select" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can insert" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can update" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can delete" ON storage.objects;
DROP POLICY IF EXISTS "Public can select" ON storage.objects;
