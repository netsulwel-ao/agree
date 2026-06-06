# Agree — Gestão de Contratos

SaaS de gestão de contratos com React, Supabase, IA e fluxos de aprovação.

## Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS 4, shadcn/ui
- **Backend:** Supabase (PostgreSQL, Auth, RLS, Edge Functions)
- **State/Cache:** TanStack React Query
- **AI:** Groq (LLaMA 3.3) via Edge Function
- **Email:** SMTP via Express server
- **Testes:** Vitest

## Requisitos

- Node.js 20+
- Conta Supabase (gratuita)
- Conta Groq (para funcionalidades de IA)

## Setup

```bash
# 1. Instalar dependências
npm install

# 2. Copiar variáveis de ambiente
cp env.example .env
# Editar .env com as tuas credenciais

# 3. Iniciar em desenvolvimento
npm run dev
```

## Variáveis de Ambiente

| Variável | Obrigatória | Descrição |
|---|---|---|
| `VITE_SUPABASE_URL` | Sim | URL do projecto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Sim | Chave anónima do Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Sim (email/auth) | Chave de serviço Supabase |
| `VITE_APP_URL` | Sim | URL da aplicação |
| `VITE_SENTRY_DSN` | Não | DSN do Sentry para monitoring |
| `VITE_PAYPAL_CLIENT_ID` | Não | PayPal Client ID |
| `GROQ_API_KEY` | Não | API key para IA (Edge Function) |
| `SMTP_HOST` | Não | Servidor SMTP para emails |

> Nota: `GROQ_API_KEY` é usada apenas na Edge Function (`supabase/functions/ai/`), nunca exposta ao frontend.

## Base de Dados

As migrações estão em `supabase/migrations/`. Para aplicar:

```bash
supabase migration up
```

### Tabelas Core

- `profiles` — sincronizada automaticamente com `auth.users` via trigger
- `contracts` — contratos com suporte multi-moeda, versões e tags
- `contract_versions` — histórico de versões dos contratos
- `meeting_notes` — atas de reuniões associadas a contratos
- `audit_logs` — rastreio de todas as acções
- `contract_templates` — modelos de contractos (sistema + utilizador)
- `notifications` — notificações na plataforma

### Migrações (ordem de execução)

1. `20260601000000_core_tables.sql` — tabelas core
2. `20260601000100_add_clients.sql` — clientes
3. `20260601000200_add_tags.sql` — tags
4. `20260601000300_api_keys.sql` — API keys
5. `20260601000400_approval_workflows.sql` — fluxos de aprovação
6. `20260601000500_audit_logs_enhance.sql` — índices audit_logs
7. `20260601000600_currency.sql` — taxas de câmbio
8. `20260601000700_google_integration.sql` — Google Calendar/Docs
9. `20260601000800_invoices.sql` — facturação
10. `20260601000900_notifications.sql` — notificações + preferências
11. `20260601001000_signature_providers.sql` — provedores de assinatura
12. `20260601001100_templates_enhance.sql` — índices + variáveis templates
13. `20260602_reminders_renewals.sql` — lembretes + renovações
14. `20260603000100_trial_period.sql` — período de teste
15. `20260603000200_onboarding_completed.sql` — onboarding

## Scripts

```bash
npm run dev          # Servidor de desenvolvimento (porta 3000)
npm run build        # Build de produção
npm run lint         # Type-check (tsc --noEmit)
npm run test         # Testes unitários
npm run test:coverage # Testes com cobertura
npm run start        # Servidor Express para produção
```

## Edge Functions

```bash
supabase functions deploy ai
supabase functions deploy api
supabase functions deploy expire-plans
```

### AI Function

Proxy para Groq API. Requer autenticação (JWT do Supabase). Actions disponíveis:
- `analyzeRisks` — análise de riscos contratuais
- `intelligentSearch` — pesquisa semântica
- `extractContract` — extração de dados de contratos
- `generateSuggestions` — geração de rascunhos
- `generateFullContract` — geração de contrato completo em HTML

## Estrutura

```
src/
├── components/       # Componentes React
│   └── ui/          # Componentes base (shadcn/ui)
├── contexts/         # Contextos (Auth, Checkout, Loading)
├── hooks/            # Custom hooks (React Query + Supabase)
├── lib/              # Utilitários (Supabase client, utils, plans)
├── services/         # Serviços (IA, email, PDF, assinaturas, OCR)
└── data/            # Dados estáticos (templates built-in)
```

## Deploy

```bash
npm run build
npm start
```

O servidor Express serve os ficheiros estáticos e o endpoint `/api/send-email`.

## CI/CD

GitHub Actions configurado em `.github/workflows/ci.yml`:
- Type-check
- Testes unitários
- Build
- Upload de artefacto

## Segurança

- **RLS (Row Level Security)** em todas as tabelas
- **API keys** para integrações externas
- **Edge Functions** mantêm segredos no servidor
- **Audit logging** para rastreio de acções
- Autenticação via Supabase JWT para endpoints internos

## Licença

Privado — Todos os direitos reservados.
