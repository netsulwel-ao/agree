-- ============================================================
-- MIGRATION: Suporte a Firebase UIDs (TEXT em vez de UUID)
-- Cola e executa no Supabase SQL Editor
-- ============================================================

-- 1. Desativar RLS em todas as tabelas
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE contracts DISABLE ROW LEVEL SECURITY;
ALTER TABLE contract_versions DISABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_notes DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;

-- 2. Apagar TODAS as políticas ANTES de alterar os tipos
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view their own contracts" ON contracts;
DROP POLICY IF EXISTS "Users can create their own contracts" ON contracts;
DROP POLICY IF EXISTS "Users can update their own contracts" ON contracts;
DROP POLICY IF EXISTS "Users can delete their own contracts" ON contracts;
DROP POLICY IF EXISTS "Users can view their own contract versions" ON contract_versions;
DROP POLICY IF EXISTS "Users can create their own contract versions" ON contract_versions;
DROP POLICY IF EXISTS "Users can view meeting notes for their contracts" ON meeting_notes;
DROP POLICY IF EXISTS "Users can create meeting notes for their contracts" ON meeting_notes;
DROP POLICY IF EXISTS "Users can insert audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Allow all for anon" ON profiles;
DROP POLICY IF EXISTS "Allow all for anon" ON contracts;
DROP POLICY IF EXISTS "Allow all for anon" ON contract_versions;
DROP POLICY IF EXISTS "Allow all for anon" ON meeting_notes;
DROP POLICY IF EXISTS "Allow all for anon" ON audit_logs;

-- 3. Remover trigger e função do Supabase Auth
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 4. Remover foreign key de profiles para auth.users
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- 5. Agora sim, alterar os tipos de UUID para TEXT
ALTER TABLE profiles ALTER COLUMN id TYPE TEXT USING id::TEXT;
ALTER TABLE contracts ALTER COLUMN owner_id TYPE TEXT USING owner_id::TEXT;
ALTER TABLE meeting_notes ALTER COLUMN author_id TYPE TEXT USING author_id::TEXT;
ALTER TABLE audit_logs ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;

-- 6. Reativar RLS com políticas permissivas
-- (segurança gerida pelo Firebase no frontend)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all" ON profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON contracts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON contract_versions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON meeting_notes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON audit_logs FOR ALL USING (true) WITH CHECK (true);
