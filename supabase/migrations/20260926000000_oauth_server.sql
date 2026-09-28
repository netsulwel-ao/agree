-- ============================================================================
-- OAuth 2.0 Authorization Server — para ligar apps externas ao Agree
-- ============================================================================
-- Modelo equivalente ao GitHub dentro do Vercel: o Agree actua como
-- authorization server, a app externa (NetsulCondo) actua como client.
--
-- Fluxo:
--   1. NetsulCondo redireciona o utilizador para /oauth/authorize
--   2. O utilizador faz login no Agree e vê o ecrã de consentimento
--   3. Clique em "Autorizar" → oAgree emite um authorization code
--   4. O servidor do NetsulCondo troca o code por um access token
--
-- O segredo do cliente (client_secret) vive apenas no servidor do NetsulCondo
-- e nos secrets do Supabase. Nunca é exposto ao browser.
-- ============================================================================

-- ─── Apps clientes registadas ────────────────────────────────────────────────
-- Uma linha por aplicação externa autorizada a usar o Agree.
CREATE TABLE IF NOT EXISTS oauth_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Identificador público da app (aparece no ecrã de consentimento)
  client_id TEXT UNIQUE NOT NULL,

  -- Segredo do cliente guardado como SHA-256 — nunca em texto simples
  client_secret_hash TEXT NOT NULL,
  -- Prefixo do segredo, para o utilizador conseguir identificar a app
  client_secret_prefix TEXT NOT NULL,

  -- Metadados mostrados no ecrã de consentimento
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,

  -- URIs de redireccionamento permitidas (comparação exacta)
  redirect_uris TEXT[] NOT NULL DEFAULT '{}',

  -- Scopes que esta app pode pedir. O pedido é limitado a este conjunto.
  allowed_scopes TEXT[] NOT NULL DEFAULT '{}',

  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_oauth_clients_client_id ON oauth_clients(client_id);

-- ─── Códigos de autorização ───────────────────────────────────────────────────
-- Temporários (10 minutos), de uso único, ligados ao PKCE code_challenge.
CREATE TABLE IF NOT EXISTS oauth_authorization_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- O código em texto simples: é o que viaja no URL de redireccionamento
  code TEXT UNIQUE NOT NULL,

  client_id TEXT NOT NULL REFERENCES oauth_clients(client_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Empresa (condomínio) que o utilizador autorizou
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,

  scopes TEXT[] NOT NULL DEFAULT '{}',
  redirect_uri TEXT NOT NULL,

  -- PKCE: hash do code_verifier que o cliente terá de apresentar
  code_challenge TEXT,
  code_challenge_method TEXT CHECK (code_challenge_method IN ('S256', 'plain')),

  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_oauth_codes_code ON oauth_authorization_codes(code);
CREATE INDEX IF NOT EXISTS idx_oauth_codes_user ON oauth_authorization_codes(user_id);

-- ─── Access tokens ────────────────────────────────────────────────────────────
-- Guardados como SHA-256 (o valor presented é opaco e precisa de ser procurável).
CREATE TABLE IF NOT EXISTS oauth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  access_token_hash TEXT UNIQUE NOT NULL,
  refresh_token_hash TEXT UNIQUE,

  client_id TEXT NOT NULL REFERENCES oauth_clients(client_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,

  scopes TEXT[] NOT NULL DEFAULT '{}',

  expires_at TIMESTAMPTZ NOT NULL,
  refresh_token_expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_oauth_tokens_hash ON oauth_tokens(access_token_hash);
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_user ON oauth_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_client ON oauth_tokens(client_id);

-- ─── Consentimentos recordados ────────────────────────────────────────────────
-- "Lembrar desta autorização" — evita mostrar o consentimento de novo.
CREATE TABLE IF NOT EXISTS oauth_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  client_id TEXT NOT NULL REFERENCES oauth_clients(client_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  scopes TEXT[] NOT NULL DEFAULT '{}',

  revoked_at TIMESTAMPTZ
);

-- Um consentimento activo por (app, utilizador, empresa)
CREATE UNIQUE INDEX IF NOT EXISTS idx_oauth_consents_unique
  ON oauth_consents(client_id, user_id, company_id)
  WHERE revoked_at IS NULL;

-- ─── Row Level Security ───────────────────────────────────────────────────────
-- Estas tabelas nunca são acedidas pelo browser com a anon key:
-- o ecrã de consentimento e a troca de token acontecem em Edge Functions
-- com service role. RLS ligado por precaução, sem policies — assim uma
-- fuga de credenciais anon não expõe nada.
ALTER TABLE oauth_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE oauth_authorization_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE oauth_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE oauth_consents ENABLE ROW LEVEL SECURITY;

-- ─── Limpeza de códigos expirados ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.cleanup_expired_oauth_codes()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM oauth_authorization_codes
  WHERE expires_at < NOW() - INTERVAL '1 day';
END;
$$;

-- ─── Correcção: colunas usadas pela integração que nunca foram criadas ────────
-- A Edge Function netsulcondo-sync escrevia em companies.cnpj, que não
-- existia em nenhuma migration.
ALTER TABLE companies ADD COLUMN IF NOT EXISTS cnpj TEXT;
