-- ============================================
-- Add user_signatures table
-- ============================================

CREATE TABLE IF NOT EXISTS user_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  signature_data TEXT,
  is_default BOOLEAN DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_user_signatures_user ON user_signatures(user_id);

ALTER TABLE user_signatures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own signatures"
  ON user_signatures FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create signatures"
  ON user_signatures FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own signatures"
  ON user_signatures FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own signatures"
  ON user_signatures FOR DELETE
  USING (auth.uid() = user_id);
