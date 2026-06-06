-- ============================================
-- Fix RLS policies for user_signatures table
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own signatures" ON user_signatures;
DROP POLICY IF EXISTS "Users can create signatures" ON user_signatures;
DROP POLICY IF EXISTS "Users can update own signatures" ON user_signatures;
DROP POLICY IF EXISTS "Users can delete own signatures" ON user_signatures;

-- Create new policies with proper checks
CREATE POLICY "Users can read own signatures"
  ON user_signatures FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create signatures"
  ON user_signatures FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own signatures"
  ON user_signatures FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own signatures"
  ON user_signatures FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
