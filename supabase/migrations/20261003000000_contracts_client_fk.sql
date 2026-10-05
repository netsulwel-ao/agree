-- Declara a relação entre contracts e clients.
--
-- contracts.client_id já existia como UUID solto, sem REFERENCES. O PostgREST
-- só resolve o embedding como `client:clients(...)` quando existe uma foreign
-- key real, por isso GET /contracts devolvia:
--   Could not find a relationship between 'contracts' and 'clients'
--               in the schema cache
--
-- Não há dados para reconciliar (a tabela estava vazia), mas a coluna fica
-- NOT NULL a partir de agora: um contrato sem cliente não tem titular e não
-- tem utilidade num sistema de gestão de contratos. Facetamos primeiro para
-- não falhar se já houver linhas órfãs.
--
-- ON DELETE SET NULL: apagar um cliente deixa o contrato intacto. O histórico
-- contratual não deve desaparecer por causa de um erro no cadastro do cliente.

-- 1. Validar antes de mexer
DO $$
DECLARE
  orfas INTEGER;
BEGIN
  SELECT count(*) INTO orfas
  FROM contracts
  WHERE client_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM clients c WHERE c.id = contracts.client_id);

  IF orfas > 0 THEN
    RAISE EXCEPTION
      'Contratos com client_id que nao existe em clients: %. Nao posso criar a FK sem decidir o que fazer com eles.', orfas;
  END IF;
END $$;

-- 2. A relação propriamente dita
ALTER TABLE contracts
  DROP CONSTRAINT IF EXISTS contracts_client_id_fkey;

ALTER TABLE contracts
  ADD CONSTRAINT contracts_client_id_fkey
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL;

-- 3. Índice para o PostgREST e para as consultas por cliente
CREATE INDEX IF NOT EXISTS idx_contracts_client_id ON contracts(client_id);