-- ============================================
-- Fix signatures storage policies for QR code sessions
-- ============================================

-- Drop restrictive policies
DROP POLICY IF EXISTS "Users can upload signatures" ON storage.objects;
DROP POLICY IF EXISTS "Users can read own signatures" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own signatures" ON storage.objects;

-- Create permissive policies for signatures bucket
CREATE POLICY "Allow all signatures operations" ON storage.objects
  FOR ALL
  USING (bucket_id = 'signatures')
  WITH CHECK (bucket_id = 'signatures');

-- Ensure bucket is public
UPDATE storage.buckets SET public = true WHERE id = 'signatures';
