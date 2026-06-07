-- ============================================
-- Fix storage RLS for signatures bucket
-- ============================================

-- Ensure signatures bucket is public
UPDATE storage.buckets SET public = true WHERE id = 'signatures';

-- Drop all policies on storage.objects for signatures bucket
DROP POLICY IF EXISTS "Auth Public Signatures" ON storage.objects;
DROP POLICY IF EXISTS "Auth Signatures Select" ON storage.objects;
DROP POLICY IF EXISTS "Auth Signatures Insert" ON storage.objects;
DROP POLICY IF EXISTS "Auth Signatures Update" ON storage.objects;
DROP POLICY IF EXISTS "Auth Signatures Delete" ON storage.objects;
DROP POLICY IF EXISTS "Public Signatures Select" ON storage.objects;

-- Create a permissive policy for signatures bucket
CREATE POLICY "Public Signatures Access" ON storage.objects
  FOR ALL
  USING (bucket_id = 'signatures')
  WITH CHECK (bucket_id = 'signatures');
