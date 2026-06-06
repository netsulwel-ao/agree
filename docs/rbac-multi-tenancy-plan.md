# Sistema RBAC + Multi-tenancy - Agree

## 📋 Visão Geral

O sistema precisa suportar:
1. **Multi-tenancy**: Empresas podem cadastrar-se e ter seus próprios usuários
2. **RBAC (Role-Based Access Control)**: Sistema granular de permissões
3. **Super Admin**: Admin global que pode gerenciar todo o sistema
4. **Admin de Empresa**: Admin que delega permissões dentro da sua empresa
5. **Auditoria**: Registrar todas as ações de usuários com permissões

---

## 🏗️ Estrutura de Banco de Dados

### 1. Tabela `companies` (Organizações/Empresas)

```sql
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL, -- URL-friendly identifier
  logo_url TEXT,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  plan_expires_at TIMESTAMPTZ,
  max_users INTEGER DEFAULT 5,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_companies_slug ON companies(slug);
CREATE INDEX idx_companies_plan ON companies(plan);
```

### 2. Tabela `permissions` (Permissões Disponíveis)

```sql
CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL, -- ex: 'contracts.create', 'users.manage'
  name TEXT NOT NULL, -- ex: 'Criar Contratos'
  description TEXT,
  category TEXT NOT NULL, -- ex: 'contracts', 'users', 'reports'
  is_system BOOLEAN DEFAULT false, -- Permissões do sistema não podem ser deletadas
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_permissions_category ON permissions(category);
CREATE INDEX idx_permissions_code ON permissions(code);
```

### 3. Tabela `user_permissions` (Permissões por Usuário)

```sql
CREATE TABLE user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  granted_by UUID REFERENCES profiles(id), -- Quem deu a permissão
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- Permissões temporárias
  UNIQUE(user_id, permission_id)
);

CREATE INDEX idx_user_permissions_user ON user_permissions(user_id);
CREATE INDEX idx_user_permissions_permission ON user_permissions(permission_id);
CREATE INDEX idx_user_permissions_expires ON user_permissions(expires_at);
```

### 4. Atualizar tabela `profiles`

```sql
ALTER TABLE profiles ADD COLUMN company_id UUID REFERENCES companies(id) ON DELETE SET NULL;
ALTER TABLE profiles ADD COLUMN is_super_admin BOOLEAN DEFAULT false;
CREATE INDEX idx_profiles_company ON profiles(company_id);
CREATE INDEX idx_profiles_super_admin ON profiles(is_super_admin);
```

---

## 🔐 Sistema de Permissões

### Categorias de Permissões

#### 1. **Contratos** (`contracts`)
- `contracts.view` - Ver contratos
- `contracts.create` - Criar contratos
- `contracts.edit` - Editar contratos
- `contracts.delete` - Eliminar contratos
- `contracts.export` - Exportar contratos
- `contracts.approve` - Aprovar contratos
- `contracts.sign` - Assinar contratos

#### 2. **Clientes** (`clients`)
- `clients.view` - Ver clientes
- `clients.create` - Criar clientes
- `clients.edit` - Editar clientes
- `clients.delete` - Eliminar clientes

#### 3. **Usuários** (`users`)
- `users.view` - Ver usuários da empresa
- `users.create` - Convidar usuários
- `users.edit` - Editar usuários
- `users.delete` - Remover usuários
- `users.manage_permissions` - Gerenciar permissões

#### 4. **Relatórios** (`reports`)
- `reports.view` - Ver relatórios
- `reports.export` - Exportar relatórios
- `reports.analytics` - Ver analytics

#### 5. **Financeiro** (`finance`)
- `finance.view` - Ver faturas
- `finance.create` - Criar faturas
- `finance.edit` - Editar faturas
- `finance.delete` - Eliminar faturas
- `finance.approve` - Aprovar pagamentos

#### 6. **Configurações** (`settings`)
- `settings.view` - Ver configurações da empresa
- `settings.edit` - Editar configurações da empresa
- `settings.manage_plans` - Gerenciar planos (Super Admin)

#### 7. **Auditoria** (`audit`)
- `audit.view` - Ver logs de auditoria
- `audit.export` - Exportar logs (Super Admin)

---

## 👥 Hierarquia de Roles

### 1. **Super Admin** (Sistema)
- `is_super_admin = true`
- Acesso total ao sistema
- Pode gerenciar empresas
- Pode gerenciar todos os usuários
- Pode ver todos os logs de auditoria

### 2. **Admin de Empresa**
- `role = 'admin'` + `company_id` definido
- Acesso total à sua empresa
- Pode gerenciar usuários da sua empresa
- Pode delegar permissões dentro da empresa
- Não pode ver dados de outras empresas

### 3. **Usuário Comum**
- `role = 'user'` + `company_id` definido
- Acesso limitado às permissões concedidas
- Só pode ver dados da sua empresa

### 4. **Usuário Sem Empresa**
- `company_id = NULL`
- Usuário individual (B2C)
- Acesso limitado às suas próprias operações

---

## 🔧 Implementação

### 1. Migration SQL

Criar migration: `supabase/migrations/20260604000000_rbac_multi_tenancy.sql`

### 2. Funções SQL de Verificação

```sql
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
  company_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
  -- Super Admin pode acessar tudo
  IF EXISTS (SELECT 1 FROM profiles WHERE id = user_id AND is_super_admin = true) THEN
    RETURN true;
  END IF;
  
  -- Usuário pode acessar sua própria empresa
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = user_id AND company_id = company_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 3. Policies RLS Atualizadas

Atualizar policies para usar as funções de verificação:

```sql
-- Exemplo para contracts
CREATE POLICY "Users with contracts.view can view contracts"
  ON contracts FOR SELECT
  USING (
    has_permission(auth.uid(), 'contracts.view')
    AND (
      owner_id = auth.uid()
      OR can_access_company(auth.uid(), (SELECT company_id FROM profiles WHERE id = owner_id))
    )
  );
```

### 4. Componentes React

#### 4.1 `PermissionGuard` (HOC)
```typescript
// src/components/PermissionGuard.tsx
interface PermissionGuardProps {
  permission: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function PermissionGuard({ permission, fallback, children }: PermissionGuardProps) {
  const { user, hasPermission } = useAuth();
  
  if (!hasPermission(permission)) {
    return <>{fallback || <AccessDenied />}</>;
  }
  
  return <>{children}</>;
}
```

#### 4.2 `PermissionsManager` (Admin)
```typescript
// src/components/admin/PermissionsManager.tsx
interface PermissionsManagerProps {
  userId: UUID;
  companyId: UUID;
}

export function PermissionsManager({ userId, companyId }: PermissionsManagerProps) {
  const { data: permissions } = usePermissions();
  const { data: userPermissions } = useUserPermissions(userId);
  
  // Renderizar checkboxes por categoria
  // Salvar mudanças
}
```

#### 4.3 `CompanyManager` (Super Admin)
```typescript
// src/components/admin/CompanyManager.tsx
export function CompanyManager() {
  // Listar empresas
  // Criar/editar empresas
  // Gerenciar planos
  // Ver estatísticas por empresa
}
```

### 5. Hooks React

```typescript
// src/hooks/usePermissions.ts
export function usePermissions() {
  const { data } = useSupabaseQuery('permissions');
  return { data, groupedByCategory };
}

// src/hooks/useUserPermissions.ts
export function useUserPermissions(userId: UUID) {
  const { data } = useSupabaseQuery('user_permissions', { 
    eq: ['user_id', userId] 
  });
  return { data };
}

// src/hooks/useHasPermission.ts
export function useHasPermission() {
  const { user } = useAuth();
  
  const hasPermission = useCallback((permissionCode: string) => {
    // Verificar no cliente (cache)
    // Opcional: verificar no servidor via RPC
  }, [user]);
  
  return { hasPermission };
}
```

---

## 📊 Auditoria

### Atualizar `audit_logs`

```sql
ALTER TABLE audit_logs ADD COLUMN permission_id UUID REFERENCES permissions(id);
ALTER TABLE audit_logs ADD COLUMN company_id UUID REFERENCES companies(id);
```

### Registrar Ações com Permissões

```typescript
// Exemplo ao criar contrato
await logAction({
  action: 'contract.created',
  resource: 'contracts',
  resource_id: contractId,
  permission_id: permissionId, // Permissão usada
  company_id: companyId, // Empresa do usuário
});
```

---

## 🎨 UI de Gestão de Permissões

### 1. Tela de Gestão de Usuários (Admin Empresa)
```
┌─────────────────────────────────────────────────┐
│  Usuários da Empresa                             │
├─────────────────────────────────────────────────┤
│  [Adicionar Usuário]  [Exportar]                │
├─────────────────────────────────────────────────┤
│  Nome       Email       Role       Ações         │
│  João       joao@...    User       [Editar]     │
│  Maria      maria@...   Admin      [Permissões]  │
└─────────────────────────────────────────────────┘
```

### 2. Modal de Permissões
```
┌─────────────────────────────────────────────────┐
│  Permissões: Maria                              │
├─────────────────────────────────────────────────┤
│  📁 Contratos                                   │
│    ☑ Ver contratos                              │
│    ☑ Criar contratos                            │
│    ☐ Editar contratos                           │
│    ☐ Eliminar contratos                         │
│                                                 │
│  👥 Clientes                                    │
│    ☑ Ver clientes                               │
│    ☑ Criar clientes                             │
│    ☐ Editar clientes                            │
│                                                 │
│  💰 Financeiro                                  │
│    ☐ Ver faturas                                │
│    ☐ Criar faturas                              │
│                                                 │
│  [Cancelar]  [Salvar]                            │
└─────────────────────────────────────────────────┘
```

### 3. Tela de Empresas (Super Admin)
```
┌─────────────────────────────────────────────────┐
│  Empresas                                        │
├─────────────────────────────────────────────────┤
│  [Adicionar Empresa]  [Exportar]                │
├─────────────────────────────────────────────────┤
│  Empresa      Plano       Usuários    Status    │
│  Acme Ltd     Pro         12          Ativo     │
│  Tech Corp    Enterprise  45          Ativo     │
│  Startup X    Free        3           Ativo     │
└─────────────────────────────────────────────────┘
```

---

## 🚀 Plano de Implementação

### Fase 1: Banco de Dados
1. ✅ Criar migration com tabelas `companies`, `permissions`, `user_permissions`
2. ✅ Atualizar `profiles` com `company_id` e `is_super_admin`
3. ✅ Criar funções SQL de verificação
4. ✅ Atualizar policies RLS
5. ✅ Popular tabela `permissions` com permissões padrão

### Fase 2: Backend
1. ✅ Criar RPC functions para verificar permissões
2. ✅ Atualizar audit_logs para registrar permissões
3. ✅ Criar endpoints para gestão de permissões

### Fase 3: Frontend
1. ✅ Criar `PermissionGuard` component
2. ✅ Criar `PermissionsManager` component
3. ✅ Criar `CompanyManager` component
4. ✅ Criar hooks `usePermissions`, `useUserPermissions`, `useHasPermission`
5. ✅ Atualizar componentes existentes para usar `PermissionGuard`

### Fase 4: UI
1. ✅ Criar tela de gestão de usuários por empresa
2. ✅ Criar modal de atribuição de permissões
3. ✅ Criar tela de gestão de empresas (Super Admin)
4. ✅ Adicionar filtros por empresa em relatórios

### Fase 5: Testes
1. ✅ Testar multi-tenancy (isolamento de dados)
2. ✅ Testar sistema de permissões
3. ✅ Testar auditoria com permissões
4. ✅ Testar Super Admin vs Admin Empresa vs Usuário

---

## 📝 Notas Importantes

1. **Isolamento de Dados**: Garantir que usuários de uma empresa não vejam dados de outra
2. **Performance**: Cache de permissões no cliente para evitar chamadas excessivas
3. **Segurança**: Sempre verificar permissões no servidor (RLS + RPC)
4. **Auditoria**: Registrar quem deu quais permissões a quem e quando
5. **Escalabilidade**: Sistema preparado para crescer com mais empresas e permissões
