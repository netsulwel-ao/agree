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
-- NULLABLE de propósito: nem toda a gente tem condomínio em contexto. Quem tem
-- recebe o seu na secção 2; quem não tem, fica a NULL e continua visível só
-- para o próprio dono. É melhor do que inventar uma empresa qualquer.

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_clients_company ON clients(company_id);

-- ─── 2. Colocar os clientes existentes no condomínio do dono ─────────────────
-- profiles.company_id é uma coluna única: cada dono tem no máximo um
-- condomínio em contexto, logo não há ambiguidade aqui. Sem esta linha o
-- cliente ficaria órfão e invisível assim que o dono filtrasse por condomínio.
--
-- UPDATE idempotente: só toca em quem ainda tem company_id NULL, por isso
-- pode correr mais do que uma vez sem estragar nada.

UPDATE clients c
SET company_id = p.company_id
FROM profiles p
WHERE p.id = c.owner_id
  AND p.company_id IS NOT NULL
  AND c.company_id IS NULL;

-- ─── 3. RLS de clients ───────────────────────────────────────────────────────
-- Duas regras: o dono continua a ver os seus clientes SEMPRE, e quem tem acesso
-- ao condomínio passa a ver os clientes desse condomínio, mesmo criados por
-- outra pessoa.
--
-- A distinção entre "cliente sem condomínio" e "não tenho acesso a este
-- condomínio" importa. Um cliente com company_id NULL pertence a ninguém, e por
-- isso só o dono o vê. Também não queremos revelar o condomínio de um cliente
-- quando a empresa não é a nossa.

DROP POLICY IF EXISTS "Users with clients.view can view clients" ON clients;
CREATE POLICY "Users with clients.view can view clients"
  ON clients FOR SELECT
  USING (
    has_permission(auth.uid(), 'clients.view')
    AND (
      owner_id = auth.uid()
      OR (
        company_id IS NOT NULL
        AND can_access_company(auth.uid(), company_id)
      )
    )
  );

-- ─── 4. RLS de contracts: o contrato herda o condomínio do cliente ────────────
-- Não duplicamos company_id em contracts de propósito: ficaria dessincronizado do
-- cliente à primeira edição. O condomínio é derivado, sempre a partir do cliente.
--
-- A subquery pode devolver NULL (cliente sem condomínio, ou contrato sem
-- cliente). A comparação IS NOT NULL é necessária: sem ela, can_access_company
-- devolve false e o OR inteiro fica false — o que é o mesmo, mas por acidente
-- em vez de por escolha. Mantém-mo explícito para não depender desse detalhe
-- quando alguém alterar a função mais tarde.

DROP POLICY IF EXISTS "Users can view own contracts" ON contracts;
CREATE POLICY "Users can view own contracts"
  ON contracts FOR SELECT
  USING (
    owner_id = auth.uid()
    OR auth.jwt() ->> 'role' = 'admin'
    OR (
      EXISTS (SELECT 1 FROM clients c WHERE c.id = contracts.client_id)
      AND can_access_company(
        auth.uid(),
        (SELECT c.company_id FROM clients c WHERE c.id = contracts.client_id)
      )
    )
  );

DROP POLICY IF EXISTS "Users can update own contracts" ON contracts;
CREATE POLICY "Users can update own contracts"
  ON contracts FOR UPDATE
  USING (
    owner_id = auth.uid()
    OR auth.jwt() ->> 'role' = 'admin'
    OR (
      EXISTS (SELECT 1 FROM clients c WHERE c.id = contracts.client_id)
      AND can_access_company(
        auth.uid(),
        (SELECT c.company_id FROM clients c WHERE c.id = contracts.client_id)
      )
    )
  );