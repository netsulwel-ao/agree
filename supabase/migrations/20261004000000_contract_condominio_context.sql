-- ══════════════════════════════════════════════════════════════════════
-- Contexto de condominio nos contratos + scopes para o modo condominio
--
-- O Agree e dono do contrato. O NetsulCondo guarda so uma referencia. Para
-- o Agree saber que esta a servir um condominio -- e so nesse caso -- os
-- contratos-load extra: qual condominio, qual casa/fracao, e qual parte
-- contratante (morador ou fornecedor).
--
-- Estas colunas sao NULL para quem usa o Agree como SaaS independente, que
-- e o caso normal. A UI esconde os campos quando sao NULL.
-- ══════════════════════════════════════════════════════════════════════

-- ─── Colunas de contexto no contrato ────────────────────────────────────

-- id do condominio no NetsulCondo (Firestore), nao o id da empresa aqui.
-- Sao coisas diferentes: a empresa e a ponte, o condominio e a origem.
ALTER TABLE contracts
  ADD COLUMN IF NOT EXISTS condominio_id           TEXT,
  ADD COLUMN IF NOT EXISTS condominio_name         TEXT,
  ADD COLUMN IF NOT EXISTS unit_label              TEXT,
  ADD COLUMN IF NOT EXISTS party_type              TEXT
    CHECK (party_type IS NULL OR party_type IN ('morador','fornecedor')),
  ADD COLUMN IF NOT EXISTS netsulcondo_company_id  UUID
    REFERENCES companies(id) ON DELETE SET NULL;

-- Sem isto, cada contrato de condominio se baseia num scan da tabela toda.
CREATE INDEX IF NOT EXISTS contracts_condominio_idx
  ON contracts (condominio_id);

-- Um contrato nao pode ter condominio sem dizer de que empresa ele veio.
ALTER TABLE contracts
  ADD CONSTRAINT contracts_condominio_company_parity
  CHECK (condominio_id IS NULL OR netsulcondo_company_id IS NOT NULL);

-- ─── RLS ────────────────────────────────────────────────────────────────
-- Ja existe policy de UPDATE em contracts. INSERT precisa da mesma regra,
-- senao o POST /contracts da Edge Function (service role) passa, mas um
-- utilizador autenticado a escrever directamente nao -- e as duas coisas
-- devem concordar sobre quem pode criar contrato.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'contracts' AND policyname = 'contracts_insert_own_company'
  ) THEN
    EXECUTE $POL$
      CREATE POLICY contracts_insert_own_company ON contracts
        FOR INSERT
        WITH CHECK (
          owner_id = auth.uid()
          OR owner_id IN (
            SELECT id FROM profiles WHERE company_id = (
              SELECT company_id FROM profiles WHERE id = auth.uid()
            )
          )
        )
    $POL$;
  END IF;
END
$$;

-- ─── Scopes do NetsulCondo ───────────────────────────────────────────────
-- Faltavam contracts:write e os scopes de leitura que o modo condominio
-- precisa. Sem contracts:write o NetsulCondo nao consegue criar contrato
-- nenhum, e sem signatures:read nao consegue dizer ao gerente se o
-- documento ja foi assinado.

UPDATE oauth_clients
SET allowed_scopes = ARRAY(
      SELECT unnest(ARRAY[
        'company:read',
        'company:write',
        'contracts:read',
        'contracts:write',
        'clients:read',
        'clients:write',
        'signatures:read',
        'residents:read',
        'webhooks:write'
      ])
    )
WHERE client_id LIKE 'netsulcondo%';

-- Tokens ja emitidos ficaram com os scopes antigos. Uma ligacao existente
-- ficaria sem contracts:write e o NetsulCondo receberia insufficient_scope
-- sem explicacao. Nao ha como alargar um token em sitio -- tem de se
-- reemitir. Este registo e para o NetsulCondo conseguir dizer ao utilizador
-- "volte a ligar" em vez de falhar em silencio.
--
-- Guardamos isto como view para o endpoint /connections poder avisar.
CREATE OR REPLACE VIEW connections_needing_reauth AS
SELECT
  t.company_id,
  t.client_id,
  t.user_id,
  t.created_at,
  (t.revoked_at IS NULL) AS active,
  (NOT ('contracts:write' = ANY (t.scopes))) AS needs_reauth
FROM oauth_tokens t
WHERE t.client_id LIKE 'netsulcondo%';
