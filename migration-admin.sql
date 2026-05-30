-- Painel de Administração: roles e bloqueio de utilizadores

-- Coluna is_blocked em profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT false;

-- Função auxiliar para verificar se o utilizador é admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()::text AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remover políticas antigas de profiles que impedem admins de ver/utilizar
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- Política: qualquer utilizador vê o seu próprio perfil; admins veem todos
CREATE POLICY "Users can view their own profile"
    ON profiles FOR SELECT
    USING (auth.uid()::text = id OR public.is_admin());

-- Política: cada um edita o próprio perfil; admins editam qualquer um
CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    USING (auth.uid()::text = id OR public.is_admin())
    WITH CHECK (auth.uid()::text = id OR public.is_admin());

-- Política: admins podem eliminar perfis (apenas se não for eles próprios)
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;
CREATE POLICY "Admins can delete profiles"
    ON profiles FOR DELETE
    USING (public.is_admin() AND auth.uid()::text != id);

-- Nota: profiles.id e contracts.owner_id são TEXT, auth.uid() é UUID — por isso usamos ::text

-- Política de contratos: utilizadores bloqueados não podem ver contratos
DROP POLICY IF EXISTS "Blocked users cannot view contracts" ON contracts;
CREATE POLICY "Blocked users cannot view contracts"
    ON contracts FOR SELECT
    USING (NOT EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()::text AND is_blocked = true
    ));

-- Política: utilizadores bloqueados não podem inserir contratos
DROP POLICY IF EXISTS "Blocked users cannot insert contracts" ON contracts;
CREATE POLICY "Blocked users cannot insert contracts"
    ON contracts FOR INSERT
    WITH CHECK (NOT EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()::text AND is_blocked = true
    ));

-- Política: utilizadores bloqueados não podem atualizar contratos
DROP POLICY IF EXISTS "Blocked users cannot update contracts" ON contracts;
CREATE POLICY "Blocked users cannot update contracts"
    ON contracts FOR UPDATE
    USING (NOT EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()::text AND is_blocked = true
    ));

-- Corrigir políticas originais de contracts que comparam auth.uid() (UUID) com owner_id (TEXT)
DROP POLICY IF EXISTS "Users can view their own contracts" ON contracts;
CREATE POLICY "Users can view their own contracts"
    ON contracts FOR SELECT
    USING (auth.uid()::text = owner_id);

DROP POLICY IF EXISTS "Users can create their own contracts" ON contracts;
CREATE POLICY "Users can create their own contracts"
    ON contracts FOR INSERT
    WITH CHECK (auth.uid()::text = owner_id);

DROP POLICY IF EXISTS "Users can update their own contracts" ON contracts;
CREATE POLICY "Users can update their own contracts"
    ON contracts FOR UPDATE
    USING (auth.uid()::text = owner_id);

DROP POLICY IF EXISTS "Users can delete their own contracts" ON contracts;
CREATE POLICY "Users can delete their own contracts"
    ON contracts FOR DELETE
    USING (auth.uid()::text = owner_id);

-- Corrigir políticas de contract_versions (contract_id pode ser TEXT)
DROP POLICY IF EXISTS "Users can view their own contract versions" ON contract_versions;
CREATE POLICY "Users can view their own contract versions"
    ON contract_versions FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM contracts c WHERE c.id::text = contract_versions.contract_id::text AND c.owner_id = auth.uid()::text
    ));

DROP POLICY IF EXISTS "Users can create their own contract versions" ON contract_versions;
CREATE POLICY "Users can create their own contract versions"
    ON contract_versions FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM contracts c WHERE c.id::text = contract_versions.contract_id::text AND c.owner_id = auth.uid()::text
    ));

-- Corrigir políticas de meeting_notes
DROP POLICY IF EXISTS "Users can view meeting notes for their contracts" ON meeting_notes;
CREATE POLICY "Users can view meeting notes for their contracts"
    ON meeting_notes FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM contracts c WHERE c.id::text = meeting_notes.contract_id::text AND c.owner_id = auth.uid()::text
    ));

DROP POLICY IF EXISTS "Users can create meeting notes for their contracts" ON meeting_notes;
CREATE POLICY "Users can create meeting notes for their contracts"
    ON meeting_notes FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM contracts c WHERE c.id::text = meeting_notes.contract_id::text AND c.owner_id = auth.uid()::text
    ));
