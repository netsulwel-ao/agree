-- Sala de negociação: colaboradores + mensagens

ALTER TABLE contracts ADD COLUMN IF NOT EXISTS collaborators JSONB DEFAULT '[]'::jsonb;
CREATE INDEX IF NOT EXISTS idx_contracts_collaborators ON contracts USING GIN (collaborators);

-- Colaboradores também podem ver contratos (via text match no JSONB)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'contracts' AND policyname = 'Collaborators can view contracts') THEN
    CREATE POLICY "Collaborators can view contracts"
        ON contracts FOR SELECT
        USING (
            collaborators IS NOT NULL AND
            collaborators::text LIKE '%"' || auth.uid()::text || '"%'
        );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS negotiation_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    user_name TEXT NOT NULL,
    message TEXT NOT NULL
);

ALTER TABLE negotiation_messages ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'negotiation_messages' AND policyname = 'Contract participants can view messages') THEN
    CREATE POLICY "Contract participants can view messages"
        ON negotiation_messages FOR SELECT
        USING (
            EXISTS (
                SELECT 1 FROM contracts
                WHERE id = contract_id
                AND (
                    owner_id = auth.uid()::text
                    OR
                    collaborators::text LIKE '%"' || auth.uid()::text || '"%'
                )
            )
        );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'negotiation_messages' AND policyname = 'Contract participants can insert messages') THEN
    CREATE POLICY "Contract participants can insert messages"
        ON negotiation_messages FOR INSERT
        WITH CHECK (
            EXISTS (
                SELECT 1 FROM contracts
                WHERE id = contract_id
                AND (
                    owner_id = auth.uid()::text
                    OR
                    collaborators::text LIKE '%"' || auth.uid()::text || '"%'
                )
            )
        );
  END IF;
END $$;
