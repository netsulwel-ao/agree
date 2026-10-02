-- Separação ao nível do registo: um cliente pertence a um condomínio (empresa).
--
-- Contexto: o NetsulCondo gere o condomínio e o Agree gere os contratos. Um
-- mesmo gestor pode ter vários condomínios, e até agora o Agree não tinha forma
-- de dizer a que condomínio pertencia um cliente — o único agrupamento era
-- `owner_id`, ou seja, a pessoa. Com esta coluna, o condomínio entra no registo.
--
-- A empresa continua a ser escolhida no NetsulCondo, não aqui: o condomínio em
-- contexto chega no pedido (client_context) e é o `profiles.company_id` de quem
-- autorizou. Por isso não é preciso uma tabela de associação utilizador<->empresa.

-- ─── 1. A coluna ─────────────────────────────────────────────────────────────
-- NULLABLE de propósito: os clientes criados antes desta migração não têm
-- condomínio, e não vamos inventar um. Ficam visíveis ao dono como até agora.

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_clients_company ON clients(company_id);

-- ─── 2. Colocar os clientes existentes no condomínio do dono ─────────────────
-- Só quando o dono tem exactamente um condomínio. Com dois ou mais seria um
-- palpite, e inventar a empresa errada é pior do que deixar o campo vazio: o
-- cliente ficaria associado a um condomínio que não é seu.

UPDATE clients c
SET company_id = p.company_id
FROM profiles p
WHERE p.id = c.owner_id
  AND p.company_id IS NOT NULL
  AND c.company_id IS NULL
  AND (
    SELECT count(DISTINCT p2.company_id)
    FROM profiles p2
    WHERE p2.company_id IS NOT NULL
  ) = 1;

-- ─── 3. RLS de clients ───────────────────────────────────────────────────────
-- Mantém a regra por owner_id e acrescenta a visibilidade por empresa: quem tem
-- acesso ao condomínio passa a ver os clientes desse condomínio, mesmo tendo sido
-- criados por outra pessoa.

DROP POLICY IF EXISTS "Users with clients.view can view clients" ON clients;
CREATE POLICY "Users with clients.view can view clients"
  ON clients FOR SELECT
  USING (
    has_permission(auth.uid(), 'clients.view')
    AND (
      owner_id = auth.uid()
      OR can_access_company(auth.uid(), company_id)
    )
  );

-- ─── 4. RLS de contracts: o contrato herda o condomínio do cliente ────────────
-- Não duplicamos company_id em contracts de propósito: ficaria dessincronizado do
-- cliente à primeira edição. O condomínio é derivado, sempre a partir do cliente.

DROP POLICY IF EXISTS "Users can view own contracts" ON contracts;
CREATE POLICY "Users can view own contracts"
  ON contracts FOR SELECT
  USING (
    owner_id = auth.uid()
    OR auth.jwt() ->> 'role' = 'admin'
    OR can_access_company(
      auth.uid(),
      (SELECT c.company_id FROM clients c WHERE c.id = contracts.client_id)
    )
  );

DROP POLICY IF EXISTS "Users can update own contracts" ON contracts;
CREATE POLICY "Users can update own contracts"
  ON contracts FOR UPDATE
  USING (
    owner_id = auth.uid()
    OR auth.jwt() ->> 'role' = 'admin'
    OR can_access_company(
      auth.uid(),
      (SELECT c.company_id FROM clients c WHERE c.id = contracts.client_id)
    )
  );