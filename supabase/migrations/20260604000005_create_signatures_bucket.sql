-- ============================================
-- Create signatures storage bucket
-- ============================================

-- Insert storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('signatures', 'signatures', false)
ON CONFLICT (id) DO NOTHING;

-- Create folder for sessions
-- Note: Supabase Storage doesn't have explicit folders, but we can use paths

-- Policies for signatures bucket
CREATE POLICY "Users can upload signatures"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'signatures' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can read own signatures"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'signatures' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own signatures"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'signatures' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
