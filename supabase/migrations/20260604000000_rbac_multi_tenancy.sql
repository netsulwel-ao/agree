-- ============================================
-- RBAC + Multi-tenancy Migration
-- Sistema de permissões granular e suporte a empresas
-- ============================================

-- 1. Tabela companies (Organizações/Empresas)
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  plan_expires_at TIMESTAMPTZ,
  max_users INTEGER DEFAULT 5,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_companies_slug ON companies(slug);
CREATE INDEX IF NOT EXISTS idx_companies_plan ON companies(plan);

-- 2. Tabela permissions (Permissões Disponíveis)
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_permissions_category ON permissions(category);
CREATE INDEX IF NOT EXISTS idx_permissions_code ON permissions(code);

-- 3. Tabela user_permissions (Permissões por Usuário)
CREATE TABLE IF NOT EXISTS user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  granted_by UUID REFERENCES profiles(id),
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  UNIQUE(user_id, permission_id)
);

CREATE INDEX IF NOT EXISTS idx_user_permissions_user ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_permission ON user_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_expires ON user_permissions(expires_at);

-- 4. Atualizar tabela profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE SET NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_profiles_company ON profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_profiles_super_admin ON profiles(is_super_admin);

-- 5. Atualizar audit_logs
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS permission_id UUID REFERENCES permissions(id);
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_permission ON audit_logs(permission_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_company ON audit_logs(company_id);

-- 6. Funções SQL de verificação

-- Verificar se usuário tem permissão específica
CREATE OR REPLACE FUNCTION has_permission(
  user_id UUID,
  permission_code TEXT
) RETURNS BOOLEAN AS $$
BEGIN
  -- Super Admin tem todas as permissões
  IF EXISTS (SELECT 1 FROM profiles WHERE id = user_id AND is_super_admin = true) THEN
    RETURN true;
  END IF;
  
  -- Verificar permissão explícita
  RETURN EXISTS (
    SELECT 1 
    FROM user_permissions up
    JOIN permissions p ON up.permission_id = p.id
    WHERE up.user_id = user_id 
    AND p.code = permission_code
    AND (up.expires_at IS NULL OR up.expires_at > NOW())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verificar se usuário pode acessar dados de uma empresa
CREATE OR REPLACE FUNCTION can_access_company(
  user_id UUID,
  company_id_param UUID
) RETURNS BOOLEAN AS $$
BEGIN
  -- Super Admin pode acessar tudo
  IF EXISTS (SELECT 1 FROM profiles WHERE id = user_id AND is_super_admin = true) THEN
    RETURN true;
  END IF;
  
  -- Usuário pode acessar sua própria empresa
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = user_id AND company_id = company_id_param
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. RLS Policies

-- Companies
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can view all companies"
  ON companies FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_super_admin = true));

CREATE POLICY "Users can view their own company"
  ON companies FOR SELECT
  USING (id = (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Super admins can insert companies"
  ON companies FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_super_admin = true));

CREATE POLICY "Super admins can update companies"
  ON companies FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_super_admin = true));

-- Permissions
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view permissions"
  ON permissions FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Super admins can manage permissions"
  ON permissions FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_super_admin = true));

-- User Permissions
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own permissions"
  ON user_permissions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can view permissions of same company"
  ON user_permissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p1
      JOIN profiles p2 ON p1.company_id = p2.company_id
      WHERE p1.id = auth.uid() AND p2.id = user_permissions.user_id
    )
  );

CREATE POLICY "Users with users.manage_permissions can grant permissions"
  ON user_permissions FOR INSERT
  WITH CHECK (
    has_permission(auth.uid(), 'users.manage_permissions')
    AND can_access_company(auth.uid(), (SELECT company_id FROM profiles WHERE id = user_id))
  );

CREATE POLICY "Users with users.manage_permissions can revoke permissions"
  ON user_permissions FOR DELETE
  USING (
    has_permission(auth.uid(), 'users.manage_permissions')
    AND can_access_company(auth.uid(), (SELECT company_id FROM profiles WHERE id = user_id))
  );

-- 8. Popular tabela permissions com permissões padrão
INSERT INTO permissions (code, name, description, category, is_system) VALUES
-- Contratos
('contracts.view', 'Ver Contratos', 'Permite visualizar contratos', 'contracts', true),
('contracts.create', 'Criar Contratos', 'Permite criar novos contratos', 'contracts', true),
('contracts.edit', 'Editar Contratos', 'Permite editar contratos existentes', 'contracts', true),
('contracts.delete', 'Eliminar Contratos', 'Permite eliminar contratos', 'contracts', true),
('contracts.export', 'Exportar Contratos', 'Permite exportar contratos', 'contracts', true),
('contracts.approve', 'Aprovar Contratos', 'Permite aprovar contratos', 'contracts', true),
('contracts.sign', 'Assinar Contratos', 'Permite assinar contratos', 'contracts', true),

-- Clientes
('clients.view', 'Ver Clientes', 'Permite visualizar clientes', 'clients', true),
('clients.create', 'Criar Clientes', 'Permite criar novos clientes', 'clients', true),
('clients.edit', 'Editar Clientes', 'Permite editar clientes existentes', 'clients', true),
('clients.delete', 'Eliminar Clientes', 'Permite eliminar clientes', 'clients', true),

-- Usuários
('users.view', 'Ver Usuários', 'Permite visualizar usuários da empresa', 'users', true),
('users.create', 'Criar Usuários', 'Permite convidar novos usuários', 'users', true),
('users.edit', 'Editar Usuários', 'Permite editar usuários existentes', 'users', true),
('users.delete', 'Eliminar Usuários', 'Permite remover usuários', 'users', true),
('users.manage_permissions', 'Gerenciar Permissões', 'Permite gerenciar permissões de usuários', 'users', true),

-- Relatórios
('reports.view', 'Ver Relatórios', 'Permite visualizar relatórios', 'reports', true),
('reports.export', 'Exportar Relatórios', 'Permite exportar relatórios', 'reports', true),
('reports.analytics', 'Ver Analytics', 'Permite visualizar analytics', 'reports', true),

-- Financeiro
('finance.view', 'Ver Faturas', 'Permite visualizar faturas', 'finance', true),
('finance.create', 'Criar Faturas', 'Permite criar faturas', 'finance', true),
('finance.edit', 'Editar Faturas', 'Permite editar faturas', 'finance', true),
('finance.delete', 'Eliminar Faturas', 'Permite eliminar faturas', 'finance', true),
('finance.approve', 'Aprovar Pagamentos', 'Permite aprovar pagamentos', 'finance', true),

-- Configurações
('settings.view', 'Ver Configurações', 'Permite visualizar configurações da empresa', 'settings', true),
('settings.edit', 'Editar Configurações', 'Permite editar configurações da empresa', 'settings', true),
('settings.manage_plans', 'Gerenciar Planos', 'Permite gerenciar planos (Super Admin)', 'settings', true),

-- Auditoria
('audit.view', 'Ver Logs de Auditoria', 'Permite visualizar logs de auditoria', 'audit', true),
('audit.export', 'Exportar Logs', 'Permite exportar logs de auditoria', 'audit', true)
ON CONFLICT (code) DO NOTHING;

-- 9. NOTA: Não marcar automaticamente todos os admins como Super Admin
-- Super Admin deve ser um papel separado, gerenciado manualmente
-- Use o script scripts/make-super-admin.sql para promover um usuário específico
