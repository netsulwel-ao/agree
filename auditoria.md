Auditoria Completa do Sistema - Agree (Gestão de Contratos)
📋 Resumo Executivo
O sistema é uma aplicação SaaS de gestão de contratos com React, Supabase, e múltiplas funcionalidades avançadas. No entanto, existem problemas críticos que causam inconsistências e impedem o funcionamento correto.

❌ PROBLEMAS CRÍTICOS (Bloqueantes)
1. Tabelas Core Ausentes no Schema
contracts - Tabela principal NÃO existe nas migrações, mas é referenciada em 14+ migrações
profiles - Referenciada em todas as policies RLS, mas não há migration de criação
contract_versions - Usada no código (ContractForm, ContractDetail), mas não existe migration
meeting_notes - Usada no código, mas não existe migration
audit_logs - Migration 20260601000500 faz ALTER TABLE, mas tabela não existe
contract_templates - Usada no código, mas não existe migration de criação
Impacto: O sistema NÃO FUNCIONA. As migrações falharão ao tentar fazer ALTER/REFERENCES em tabelas inexistentes.

2. Inconsistência de Tipos no Banco
user_id em reminders é TEXT, mas em clients é UUID
user_id em notification_preferences é TEXT, mas em profiles deveria ser UUID
Isso causa problemas de JOIN e referências
3. Segurança: Secrets Expostos no Frontend


typescript
// vite.config.ts - ERRADO
define: {
  'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY), // ❌ Exposto no bundle
  'process.env.SUPABASE_URL': JSON.stringify(env.SUPABASE_URL),
  'process.env.SUPABASE_ANON_KEY': JSON.stringify(env.SUPABASE_ANON_KEY),
}
VITE_EMAIL_API_SECRET no env.example - segredo exposto ao cliente
GEMINI_API_KEY deveria estar apenas na Edge Function (correto em supabase/functions/ai)
4. Endpoint de Email Desprotegido em Produção


javascript
// server.js
if (!EMAIL_API_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    return res.status(503).json({ error: 'Endpoint de email não configurado' });
  }
  // Em dev permite mas avisa
  console.warn('[Agree] EMAIL_API_SECRET não definido — pedido permitido apenas em modo dev');
  return next(); // ❌ Permite sem autenticação em dev
}
⚠️ PROBLEMAS SÉRIOS
5. Componentes Monolíticos
ContractForm.tsx: 1459 linhas
ContractDetail.tsx: 1736 linhas
Dashboard.tsx: 603 linhas
Dificuldade de manutenção, testes e reuso
6. Queries Ineficientes


typescript
// useContracts.ts - SELECT * desnecessário
const { data } = await supabase
  .from('contracts')
  .select('*') // ❌ Traz todos os campos
  .eq('owner_id', user.id)
7. Falta de Validação de Schema
Sem TypeScript strict mode
any usado em múltiplos lugares
Interfaces incompletas
8. Configuração de Projeto


json
// package.json
{
  "name": "react-example", // ❌ Não descritivo
  "version": "0.0.0"      // ❌ Não segue semver
}
9. Tratamento de Erros Inconsistente


typescript
// Alguns lugares:
if (error) throw new Error(error.message);
 
// Outros:
if (error) console.error('Error:', error); // ❌ Silencia erro
10. Falta de Testes
Apenas plans.test.ts existe
Sem testes de integração
Sem testes E2E
📝 O QUE ESTÁ BEM FEITO
Pontos Positivos
Edge Functions - AI proxy bem implementado (esconde API key)
RLS Policies - Estrutura de segurança bem pensada
React Query - Cache e estado global bem utilizados
TypeScript - Uso consistente (poderia ser mais strict)
Componentização UI - Componentes reutilizáveis em ui/
Audit Logging - Sistema de rastreio implementado
Multi-moeda - Suporte a exchange rates
Approval Workflows - Sistema complexo bem estruturado
Signature Processing - Algoritmos de processamento de imagem avançados
🔍 O QUE FALTA
Estrutura do Banco


sql
-- Migration ausente (CRÍTICA)
CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','pending','approved','rejected')),
  risk_level TEXT DEFAULT 'low' CHECK (risk_level IN ('low','medium','high')),
  value NUMERIC,
  currency TEXT DEFAULT 'AOA',
  start_date DATE,
  end_date DATE,
  version INTEGER DEFAULT 1,
  collaborators JSONB DEFAULT '[]'::jsonb,
  tags TEXT[] DEFAULT '{}',
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  auto_renew BOOLEAN DEFAULT false,
  renewal_period TEXT,
  renewal_count INTEGER DEFAULT 0,
  renewed_from UUID REFERENCES contracts(id),
  notification_days INTEGER DEFAULT 30
);
 
CREATE TABLE contract_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  version_number INTEGER NOT NULL,
  created_by UUID REFERENCES auth.users(id)
);
 
CREATE TABLE meeting_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  participants TEXT,
  content TEXT
);
 
CREATE TABLE profiles (
  id TEXT PRIMARY KEY REFERENCES auth.users(id),
  email TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user','admin')),
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free','pro','enterprise')),
  plan_activated_at TIMESTAMPTZ,
  plan_expires_at TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,
  is_blocked BOOLEAN DEFAULT false,
  onboarding_completed BOOLEAN DEFAULT false
);
 
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id TEXT NOT NULL,
  user_name TEXT,
  user_email TEXT,
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  resource_id UUID,
  resource_name TEXT,
  status TEXT DEFAULT 'success',
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT
);
 
CREATE TABLE contract_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  content TEXT,
  variables JSONB DEFAULT '[]'::jsonb,
  is_system BOOLEAN DEFAULT false,
  user_id UUID REFERENCES auth.users(id),
  usage_count INTEGER DEFAULT 0
);
Funcionalidades Ausentes
README.md - Documentação de setup e deployment
Docker Compose - Para desenvolvimento local
CI/CD Pipeline - GitHub Actions ou similar
API Documentation - Swagger/OpenAPI
Error Boundary Global - Já existe ErrorBoundary mas não usado em todos os lugares
Loading Skeletons - Melhor UX durante loading
Optimistic Updates - Para melhor UX
WebSocket/Real-time - Para colaboração em tempo real
Backup/Restore - Funcionalidade de backup
Export/Import - Exportar/importar contratos em massa
Melhorias de Código
Custom Hooks - Extrair lógica de componentes
Context API - Reduzir prop drilling
Error Handling - Centralizar tratamento de erros
Validation Library - Zod ou Yup para validação
State Machine - XState para workflows complexos
Performance - React.memo, useMemo, useCallback onde necessário
🎯 RECOMENDAÇÕES PRIORITÁRIAS
Imediato (Bloqueantes)
Criar migration inicial com todas as tabelas core
Remover secrets do vite.config.ts - usar apenas Edge Functions
Corrigir tipos de user_id - padronizar para UUID ou TEXT
Adicionar migration de profiles - trigger no auth.users
Curto Prazo (1-2 semanas)
Refatorar componentes grandes - extrair subcomponentes
Adicionar README.md com setup completo
Implementar testes críticos - pelo menos para contratos
Melhorar tratamento de erros - centralizar
Adicionar validação de schema - Zod
Médio Prazo (1 mês)
Docker Compose para desenvolvimento
CI/CD Pipeline
Documentação de API
Melhorar performance - otimizar queries
Adicionar loading states
Longo Prazo
Real-time collaboration - WebSocket
Mobile app - React Native
Advanced analytics - Dashboards mais detalhados
AI improvements - Mais features de IA
Multi-tenancy - Suporte a organizações
📊 ESTATÍSTICAS
Total de migrações: 14
Tabelas criadas: 8 (clients, api_keys, approval_workflows, approval_workflow_steps, approval_workflow_step_approvers, approval_requests, approval_request_approvals, invoices, reminders, renewal_history, signature_providers, signature_requests, google_integrations, exchange_rates, notification_preferences)
Tabelas ausentes: 6 (contracts, profiles, contract_versions, meeting_notes, audit_logs, contract_templates)
Componentes: 76
Edge Functions: 3 (ai, api, expire-plans)
Linhas de código: ~50,000+ (estimado)
7 / 7 tasks done
Thought for 1s
Conclusão
A auditoria revelou problemas críticos que impedem o funcionamento do sistema:

Bloqueantes Imediatos:

Tabela contracts não existe (referenciada em 14+ migrações)
Tabelas profiles, contract_versions, meeting_notes, audit_logs, contract_templates ausentes
Secrets expostos no frontend (GEMINI_API_KEY, EMAIL_API_SECRET)
Inconsistência de tipos (user_id: TEXT vs UUID)
Problemas Sérios:

Componentes monolíticos (1000+ linhas)
Queries ineficientes (SELECT *)
Falta de testes
Tratamento de erros inconsistente
O que está bem feito:

Edge Functions para AI (seguro)
Estrutura de RLS bem pensada
React Query bem utilizado
Sistema de approval workflows complexo
Queres que eu comece a corrigir os problemas críticos? Posso:

Criar a migration inicial com as tabelas core ausentes
Remover secrets do vite.config.ts
Corrigir inconsistências de tipos
Adicionar README.md com setup completo*


Feedback submitted



fiz algumas alteracoes segundo a auditoria verifique e deia sequencia

Thought for 1s
Explored2 files and searched *.sql
Analyzedc:/Users/USER/sistema-de-gestao-de-contrato
Thought for 2s
Read20260601000000_core_tables.sql and 2 other files
Thought for 4s
1 / 5 tasks done
Searchedprocess\.env\.GEMINI_API_KEY and 2 other queries
Thought for 2s
2 / 5 tasks done
Read20260602_reminders_renewals.sql and 20260601000900_notifications.sql
Thought for 3s
3 / 5 tasks done
Read
20260601000100_add_clients.sql
Thought for 4s
4 / 5 tasks done
Thought for 3s
✅ Verificação das Alterações
Alterações feitas corretamente:

Migration 20260601000000_core_tables.sql - ✓ Criada com todas as tabelas core:
profiles (com trigger auto-create)
contracts (inclui client_id)
contract_versions
meeting_notes
audit_logs
contract_templates
notifications
vite.config.ts - ✓ Secrets removidos do define
package.json - ✓ Nome "agree-gestao-contratos", versão "0.1.0"
README.md - ✓ Documentação completa criada
env.example - ✓ VITE_EMAIL_API_SECRET removido
Verificações:

✓ Código não referencia secrets removidos
✓ Tipos consistentes (user_id = TEXT em todas as tabelas)
✓ Referência circular OK (contracts.client_id já existe na core_tables)
⚠️ Problema Encontrado
A migration 20260601000100_add_clients.sql linha 19 tenta adicionar client_id à tabela contracts, mas essa coluna já existe na core_tables:



sql
-- REDUNDANTE - já existe em core_tables.sql
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE SET NULL;
Vou remover essa redundância:

20260601000100_add_clients.sql
+1
-1
Thought for 2s
Read20260601000200_add_tags.sql and 3 other files
Thought for 3s
20260601000200_add_tags.sql
+1
-3
20260601000600_currency.sql
+2
-3
20260603000100_trial_period.sql
+2
-4
20260603000200_onboarding_completed.sql
+1
-3
Thought for 2s
Read
20260602_reminders_renewals.sql
#L1-40
20260602_reminders_renewals.sql
+2
-6
5 / 6 tasks done
Verificar alterações feitas pelo usuário
Verificar se código ainda referencia secrets removidos
Verificar consistência de tipos nas migrations
Verificar se há problemas de referência circular (contracts ↔ clients)
Remover redundâncias nas migrations
Criar plano de próximos passos
Thought for 2s
6 / 6 tasks done
Thought for 2s
✅ Verificação Concluída
Alterações feitas pelo usuário (CORRETAS):

Migration 20260601000000_core_tables.sql criada com todas as tabelas core
vite.config.ts - secrets removidos do define
package.json - nome "agree-gestao-contratos", versão "0.1.0"
README.md criado com documentação completa
env.example - VITE_EMAIL_API_SECRET removido
Correções que fiz: Removi redundâncias nas migrations (colunas já criadas em core_tables.sql):

20260601000100_add_clients.sql - client_id
20260601000200_add_tags.sql - tags
20260601000600_currency.sql - currency
20260603000100_trial_period.sql - trial_ends_at
20260603000200_onboarding_completed.sql - onboarding_completed
20260602_reminders_renewals.sql - auto_renew, renewal_period, renewed_from, renewal_count, notification_days
📋 Próximos Passos Recomendados
Imediato (Testar)
Testar migrations - Aplicar migrations no Supabase para verificar se executam sem erros
Testar aplicação localmente - Verificar se tudo funciona após as correções
Curto Prazo (Melhorias de Código)
✅ Refatorar componentes monolíticos - Extrair subcomponentes de ContractForm e ContractDetail
✅ Otimizar queries - Substituir select('*') por campos específicos
✅ Adicionar validação - Implementar Zod para validação de formulários
✅ Centralizar tratamento de erros - Criar error handler unificado
✅ Adicionar loading skeletons - Criar componentes de loading
Médio Prazo (Infraestrutura)
Docker Compose - Para desenvolvimento local consistente
CI/CD Pipeline - GitHub Actions para testes e deploy automático
Testes - Adicionar testes unitários para componentes críticos
Performance - React.memo, useMemo, useCallback onde necessário

---
## ✅ CORREÇÕES REALIZADAS

### 1. Queries Otimizadas
- useContracts.ts - Seleção de campos específicos
- useClients.ts - Seleção de campos específicos
- useInvoices.ts - Seleção de campos específicos

### 2. Error Handler Unificado
- Criado src/lib/errorHandler.ts com:
  - handleSupabaseError - Tratamento de erros Supabase
  - handleNetworkError - Tratamento de erros de rede
  - handleValidationError - Tratamento de erros de validação
  - logError - Logging centralizado

### 3. Validação Zod
- Criado src/lib/validation.ts com schemas para:
  - contractSchema
  - clientSchema
  - invoiceSchema
 - profileSchema
  - templateSchema
- Instalado pacote zod

### 4. Error Boundary Global
- Já existia ErrorBoundary.tsx integrado com Sentry
- Aplicado em main.tsx envolvendo toda a aplicação

### 5. Loading Skeletons
- Criado src/components/ui/ContractSkeleton.tsx com:
  - ContractCardSkeleton
  - ContractListSkeleton
  - ContractDetailSkeleton
  - DashboardSkeleton
  - ClientCardSkeleton
  - InvoiceCardSkeleton

### 6. Refatoração ContractForm
- Criados subcomponentes em src/components/ContractForm/:
  - ContractBasicFields.tsx - Campos do formulário
  - ContractAIActions.tsx - Ações de IA
  - ContractAttachments.tsx - Gestão de anexos

### 7. Refatoração ContractDetail
- Criados subcomponentes em src/components/ContractDetail/:
  - ContractHeader.tsx - Header com ações
  - ContractStats.tsx - Estatísticas do contrato
  - ContractContent.tsx - Conteúdo do contrato