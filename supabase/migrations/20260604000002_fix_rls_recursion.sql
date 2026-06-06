-- ============================================
-- Fix RLS Recursion in Profiles
-- ============================================

-- Drop problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

-- Create fixed policies that don't cause recursion
CREATE POLICY "Admins can read all profiles"
  ON profiles FOR SELECT
  USING (
    -- Super admins can read all profiles
    (SELECT is_super_admin FROM profiles WHERE id = auth.uid()) = true
    OR
    -- Regular admins can read all profiles (but need to check their own role first)
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
      AND is_super_admin = false
    )
  );

CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  USING (
    -- Super admins can update all profiles
    (SELECT is_super_admin FROM profiles WHERE id = auth.uid()) = true
    OR
    -- Regular admins can update all profiles (but need to check their own role first)
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
      AND is_super_admin = false
    )
  );
