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
