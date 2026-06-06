-- ============================================
-- Atualizar Policies RLS com Sistema RBAC
-- Aplicar as novas funções de verificação nas tabelas existentes
-- ============================================

-- Contracts
DROP POLICY IF EXISTS "Users can view own contracts" ON contracts;
CREATE POLICY "Users with contracts.view can view contracts"
  ON contracts FOR SELECT
  USING (
    has_permission(auth.uid(), 'contracts.view')
    AND (
      owner_id = auth.uid()
      OR can_access_company(auth.uid(), (SELECT company_id FROM profiles WHERE id = owner_id))
    )
  );

DROP POLICY IF EXISTS "Users can create contracts" ON contracts;
CREATE POLICY "Users with contracts.create can create contracts"
  ON contracts FOR INSERT
  WITH CHECK (
    has_permission(auth.uid(), 'contracts.create')
    AND owner_id = auth.uid()
  );

DROP POLICY IF EXISTS "Users can update own contracts" ON contracts;
CREATE POLICY "Users with contracts.edit can update contracts"
  ON contracts FOR UPDATE
  USING (
    has_permission(auth.uid(), 'contracts.edit')
    AND (
      owner_id = auth.uid()
      OR can_access_company(auth.uid(), (SELECT company_id FROM profiles WHERE id = owner_id))
    )
  );

DROP POLICY IF EXISTS "Users can delete own contracts" ON contracts;
CREATE POLICY "Users with contracts.delete can delete contracts"
  ON contracts FOR DELETE
  USING (
    has_permission(auth.uid(), 'contracts.delete')
    AND owner_id = auth.uid()
  );

-- Clients
DROP POLICY IF EXISTS "Users can view own clients" ON clients;
CREATE POLICY "Users with clients.view can view clients"
  ON clients FOR SELECT
  USING (
    has_permission(auth.uid(), 'clients.view')
    AND (
      owner_id = auth.uid()
      OR can_access_company(auth.uid(), (SELECT company_id FROM profiles WHERE id = owner_id))
    )
  );

DROP POLICY IF EXISTS "Users can create clients" ON clients;
CREATE POLICY "Users with clients.create can create clients"
  ON clients FOR INSERT
  WITH CHECK (
    has_permission(auth.uid(), 'clients.create')
    AND owner_id = auth.uid()
  );

DROP POLICY IF EXISTS "Users can update own clients" ON clients;
CREATE POLICY "Users with clients.edit can update clients"
  ON clients FOR UPDATE
  USING (
    has_permission(auth.uid(), 'clients.edit')
    AND (
      owner_id = auth.uid()
      OR can_access_company(auth.uid(), (SELECT company_id FROM profiles WHERE id = owner_id))
    )
  );

DROP POLICY IF EXISTS "Users can delete own clients" ON clients;
CREATE POLICY "Users with clients.delete can delete clients"
  ON clients FOR DELETE
  USING (
    has_permission(auth.uid(), 'clients.delete')
    AND owner_id = auth.uid()
  );

-- Invoices
DROP POLICY IF EXISTS "Users can view their own invoices" ON invoices;
CREATE POLICY "Users with finance.view can view invoices"
  ON invoices FOR SELECT
  USING (
    has_permission(auth.uid(), 'finance.view')
    AND (
      owner_id = auth.uid()
      OR can_access_company(auth.uid(), (SELECT company_id FROM profiles WHERE id = owner_id))
    )
  );

DROP POLICY IF EXISTS "Admins can view all invoices" ON invoices;
CREATE POLICY "Super admins can view all invoices"
  ON invoices FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_super_admin = true));

DROP POLICY IF EXISTS "Users can create invoices" ON invoices;
CREATE POLICY "Users with finance.create can create invoices"
  ON invoices FOR INSERT
  WITH CHECK (
    has_permission(auth.uid(), 'finance.create')
    AND owner_id = auth.uid()
  );

DROP POLICY IF EXISTS "Users can update their own invoices" ON invoices;
CREATE POLICY "Users with finance.edit can update invoices"
  ON invoices FOR UPDATE
  USING (
    has_permission(auth.uid(), 'finance.edit')
    AND (
      owner_id = auth.uid()
      OR can_access_company(auth.uid(), (SELECT company_id FROM profiles WHERE id = owner_id))
    )
  );

DROP POLICY IF EXISTS "Users can delete their own invoices" ON invoices;
CREATE POLICY "Users with finance.delete can delete invoices"
  ON invoices FOR DELETE
  USING (
    has_permission(auth.uid(), 'finance.delete')
    AND owner_id = auth.uid()
  );

-- Contract Versions
DROP POLICY IF EXISTS "Users can view contract versions" ON contract_versions;
CREATE POLICY "Users with contracts.view can view contract versions"
  ON contract_versions FOR SELECT
  USING (
    has_permission(auth.uid(), 'contracts.view')
    AND EXISTS (
      SELECT 1 FROM contracts 
      WHERE contracts.id = contract_versions.contract_id
      AND (
        contracts.owner_id = auth.uid()
        OR can_access_company(auth.uid(), (SELECT company_id FROM profiles WHERE id = contracts.owner_id))
      )
    )
  );

DROP POLICY IF EXISTS "Users can create contract versions" ON contract_versions;
CREATE POLICY "Users with contracts.edit can create contract versions"
  ON contract_versions FOR INSERT
  WITH CHECK (
    has_permission(auth.uid(), 'contracts.edit')
    AND EXISTS (
      SELECT 1 FROM contracts 
      WHERE contracts.id = contract_versions.contract_id
      AND contracts.owner_id = auth.uid()
    )
  );

-- Meeting Notes
DROP POLICY IF EXISTS "Users can view meeting notes" ON meeting_notes;
CREATE POLICY "Users with contracts.view can view meeting notes"
  ON meeting_notes FOR SELECT
  USING (
    has_permission(auth.uid(), 'contracts.view')
    AND EXISTS (
      SELECT 1 FROM contracts 
      WHERE contracts.id = meeting_notes.contract_id
      AND (
        contracts.owner_id = auth.uid()
        OR can_access_company(auth.uid(), (SELECT company_id FROM profiles WHERE id = contracts.owner_id))
      )
    )
  );

DROP POLICY IF EXISTS "Users can create meeting notes" ON meeting_notes;
CREATE POLICY "Users with contracts.edit can create meeting notes"
  ON meeting_notes FOR INSERT
  WITH CHECK (
    has_permission(auth.uid(), 'contracts.edit')
    AND EXISTS (
      SELECT 1 FROM contracts 
      WHERE contracts.id = meeting_notes.contract_id
      AND contracts.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update meeting notes" ON meeting_notes;
CREATE POLICY "Users with contracts.edit can update meeting notes"
  ON meeting_notes FOR UPDATE
  USING (
    has_permission(auth.uid(), 'contracts.edit')
    AND EXISTS (
      SELECT 1 FROM contracts 
      WHERE contracts.id = meeting_notes.contract_id
      AND contracts.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete meeting notes" ON meeting_notes;
CREATE POLICY "Users with contracts.delete can delete meeting notes"
  ON meeting_notes FOR DELETE
  USING (
    has_permission(auth.uid(), 'contracts.delete')
    AND EXISTS (
      SELECT 1 FROM contracts 
      WHERE contracts.id = meeting_notes.contract_id
      AND contracts.owner_id = auth.uid()
    )
  );
