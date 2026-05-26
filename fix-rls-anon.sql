-- Apagar políticas existentes e recriar para anon + authenticated
DROP POLICY IF EXISTS "Allow all" ON profiles;
DROP POLICY IF EXISTS "Allow all" ON contracts;
DROP POLICY IF EXISTS "Allow all" ON contract_versions;
DROP POLICY IF EXISTS "Allow all" ON meeting_notes;
DROP POLICY IF EXISTS "Allow all" ON audit_logs;

-- Recriar políticas que permitem acesso à anon key E authenticated
CREATE POLICY "Allow all anon" ON profiles FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all anon" ON contracts FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all anon" ON contract_versions FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all anon" ON meeting_notes FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all anon" ON audit_logs FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
