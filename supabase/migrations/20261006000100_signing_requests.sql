-- ══════════════════════════════════════════════════════════════════════
-- Signing Requests — pedidos de assinatura sem login
--
-- Cada vez que se convida alguém a assinar um contrato, gera-se um
-- token único (UUID v4). O signatário acede a /sign/:token sem precisar
-- de conta no Agree.
-- ══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS signing_requests (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW(),

  -- Contrato associado
  contract_id  UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,

  -- Signatário
  signer_name  TEXT NOT NULL,
  signer_email TEXT NOT NULL,

  -- Token opaco de acesso único (enviado no email)
  token        TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),

  -- Estado do pedido
  status       TEXT NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending', 'viewed', 'signed', 'declined', 'expired')),

  -- Quando o signatário visualizou o contrato
  viewed_at    TIMESTAMPTZ,

  -- Quando assinou
  signed_at    TIMESTAMPTZ,

  -- URL da imagem da assinatura no Storage
  signature_url TEXT,

  -- Hash SHA-256 do conteúdo do contrato no momento da assinatura
  -- (prova de que o documento não foi alterado depois)
  content_hash TEXT,

  -- IP e user-agent do signatário (trilha de auditoria)
  signer_ip    TEXT,
  signer_agent TEXT,

  -- Expiração do link (7 dias por omissão)
  expires_at   TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '7 days'
);

CREATE INDEX IF NOT EXISTS idx_signing_requests_token       ON signing_requests(token);
CREATE INDEX IF NOT EXISTS idx_signing_requests_contract    ON signing_requests(contract_id);
CREATE INDEX IF NOT EXISTS idx_signing_requests_email       ON signing_requests(signer_email);
CREATE INDEX IF NOT EXISTS idx_signing_requests_status      ON signing_requests(status);

-- RLS desligado: acesso controlado pelo token opaco (server-side only)
-- O browser nunca lê esta tabela directamente — só via Edge Function / API
ALTER TABLE signing_requests ENABLE ROW LEVEL SECURITY;
