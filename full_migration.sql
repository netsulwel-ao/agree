-- ============================================
-- Core Tables — Agree (Gestão de Contratos)
-- Esta migration deve ser a primeira a executar.
-- ============================================

-- 1. Profiles (sincronizado com auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  plan_activated_at TIMESTAMPTZ,
  plan_expires_at TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,
  is_blocked BOOLEAN DEFAULT false,
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_plan ON profiles(plan);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can read all profiles"
  ON profiles FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Trigger: auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, plan)
  VALUES (
    NEW.id,
    NEW.email,
    'user',
    'free'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 2. Contracts
CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'approved', 'rejected')),
  risk_level TEXT DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high')),
  value NUMERIC,
  currency TEXT DEFAULT 'AOA',
  start_date DATE,
  end_date TIMESTAMPTZ,
  version INTEGER DEFAULT 1,
  collaborators JSONB DEFAULT '[]'::jsonb,
  tags TEXT[] DEFAULT '{}',
  client_id UUID,
  auto_renew BOOLEAN DEFAULT false,
  renewal_period TEXT CHECK (renewal_period IN ('monthly', 'quarterly', 'semi_annually', 'annually')),
  renewal_count INTEGER DEFAULT 0,
  renewed_from UUID REFERENCES contracts(id),
  notification_days INTEGER DEFAULT 30,
  rejection_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_contracts_owner ON contracts(owner_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_client ON contracts(client_id);
CREATE INDEX IF NOT EXISTS idx_contracts_tags ON contracts USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_contracts_end_date ON contracts(end_date);

ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own contracts"
  ON contracts FOR SELECT
  USING (owner_id = auth.uid() OR auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Users can create contracts"
  ON contracts FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update own contracts"
  ON contracts FOR UPDATE
  USING (owner_id = auth.uid() OR auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Users can delete own contracts"
  ON contracts FOR DELETE
  USING (owner_id = auth.uid() OR auth.jwt() ->> 'role' = 'admin');

-- 3. Contract Versions
CREATE TABLE IF NOT EXISTS contract_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  version_number INTEGER NOT NULL,
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_contract_versions_contract ON contract_versions(contract_id);

ALTER TABLE contract_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view versions of own contracts"
  ON contract_versions FOR SELECT
  USING (contract_id IN (SELECT id FROM contracts WHERE owner_id = auth.uid()));

CREATE POLICY "Users can create versions"
  ON contract_versions FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- 4. Meeting Notes
CREATE TABLE IF NOT EXISTS meeting_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  participants TEXT,
  content TEXT
);

CREATE INDEX IF NOT EXISTS idx_meeting_notes_contract ON meeting_notes(contract_id);

ALTER TABLE meeting_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view meeting notes of own contracts"
  ON meeting_notes FOR SELECT
  USING (contract_id IN (SELECT id FROM contracts WHERE owner_id = auth.uid()));

CREATE POLICY "Users can create meeting notes"
  ON meeting_notes FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update meeting notes"
  ON meeting_notes FOR UPDATE
  USING (contract_id IN (SELECT id FROM contracts WHERE owner_id = auth.uid()));

CREATE POLICY "Users can delete meeting notes"
  ON meeting_notes FOR DELETE
  USING (contract_id IN (SELECT id FROM contracts WHERE owner_id = auth.uid()));

-- 5. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
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

CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_id ON audit_logs(resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_details ON audit_logs USING GIN (details);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can view all audit logs"
  ON audit_logs FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Users can view their own audit logs"
  ON audit_logs FOR SELECT
  USING (user_id = auth.uid());

-- 6. Contract Templates
CREATE TABLE IF NOT EXISTS contract_templates (
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

CREATE INDEX IF NOT EXISTS idx_templates_category ON contract_templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_user ON contract_templates(user_id);

ALTER TABLE contract_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view system templates"
  ON contract_templates FOR SELECT
  USING (is_system = true OR user_id = auth.uid());

CREATE POLICY "Users can create templates"
  ON contract_templates FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own templates"
  ON contract_templates FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own templates"
  ON contract_templates FOR DELETE
  USING (user_id = auth.uid());

-- 7. Notifications (missing from schema)
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  type TEXT NOT NULL CHECK (type IN (
    'plan_expiring', 'plan_expired', 'plan_upgraded',
    'payment_request', 'payment_approved', 'payment_rejected',
    'contract_shared', 'approval_requested', 'contract_approved',
    'contract_rejected', 'contract_expiring'
  )),
  title TEXT NOT NULL,
  message TEXT,
  read BOOLEAN DEFAULT false,
  reference_id TEXT,
  reference_type TEXT
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- === END MIGRATION: 20260601000000_core_tables.sql ===

CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  status TEXT DEFAULT 'active',
  category TEXT,
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  custom_fields JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_clients_owner ON clients(owner_id);
CREATE INDEX IF NOT EXISTS idx_clients_tags ON clients USING GIN (tags);

-- client_id já existe em contracts (core_tables.sql)
CREATE INDEX IF NOT EXISTS idx_contracts_client ON contracts(client_id);

-- === END MIGRATION: 20260601000100_add_clients.sql ===

-- tags column já existe em contracts (core_tables.sql)
-- Create an index for tag search
CREATE INDEX IF NOT EXISTS idx_contracts_tags ON contracts USING GIN (tags);

-- === END MIGRATION: 20260601000200_add_tags.sql ===

-- API keys for public API access

CREATE TABLE IF NOT EXISTS api_keys (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    key_hash TEXT NOT NULL,
    key_prefix TEXT NOT NULL,
    scopes TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    rate_limit INT DEFAULT 60
);

CREATE INDEX IF NOT EXISTS idx_api_keys_user ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_prefix ON api_keys(key_prefix);

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own keys"
    ON api_keys FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can read all keys"
    ON api_keys FOR SELECT
    USING (auth.jwt() ->> 'role' IN ('admin', 'superadmin'));

-- Rate limiting log
CREATE TABLE IF NOT EXISTS api_usage_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    api_key_id UUID REFERENCES api_keys(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL,
    status INT,
    ip_address TEXT
);

CREATE INDEX IF NOT EXISTS idx_api_usage_key ON api_usage_log(api_key_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_created ON api_usage_log(created_at);

ALTER TABLE api_usage_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own usage"
    ON api_usage_log FOR SELECT
    USING (api_key_id IN (SELECT id FROM api_keys WHERE user_id = auth.uid()));

CREATE POLICY "Admins can read all usage"
    ON api_usage_log FOR SELECT
    USING (auth.jwt() ->> 'role' IN ('admin', 'superadmin'));

-- === END MIGRATION: 20260601000300_api_keys.sql ===

-- ============================================
-- Approval Workflows — Múltiplos níveis com regras por valor/risco
-- ============================================

-- 1. Templates de workflow de aprovação
CREATE TABLE IF NOT EXISTS approval_workflows (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id)
);

-- 2. Passos de aprovação (ordenados)
CREATE TABLE IF NOT EXISTS approval_workflow_steps (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    workflow_id UUID NOT NULL REFERENCES approval_workflows(id) ON DELETE CASCADE,
    step_order INTEGER NOT NULL CHECK (step_order >= 0),
    name TEXT NOT NULL,
    min_value NUMERIC,
    max_value NUMERIC,
    min_risk_level TEXT,
    max_risk_level TEXT,
    required_approvers INTEGER DEFAULT 1 CHECK (required_approvers >= 1),
    UNIQUE (workflow_id, step_order)
);

-- 3. Aprovadores de cada passo
CREATE TABLE IF NOT EXISTS approval_workflow_step_approvers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    step_id UUID NOT NULL REFERENCES approval_workflow_steps(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    UNIQUE (step_id, user_id)
);

-- 4. Pedidos de aprovação
CREATE TABLE IF NOT EXISTS approval_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    workflow_id UUID NOT NULL REFERENCES approval_workflows(id),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','approved','rejected')),
    current_step_id UUID REFERENCES approval_workflow_steps(id),
    current_step_order INTEGER,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    completed_at TIMESTAMPTZ
);

-- 5. Aprovações/rejeições individuais
CREATE TABLE IF NOT EXISTS approval_request_approvals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    request_id UUID NOT NULL REFERENCES approval_requests(id) ON DELETE CASCADE,
    step_id UUID NOT NULL REFERENCES approval_workflow_steps(id),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    status TEXT NOT NULL CHECK (status IN ('approved','rejected')),
    comment TEXT,
    UNIQUE (request_id, step_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_approval_steps_workflow ON approval_workflow_steps(workflow_id);
CREATE INDEX IF NOT EXISTS idx_approval_approvers_step ON approval_workflow_step_approvers(step_id);
CREATE INDEX IF NOT EXISTS idx_approval_requests_contract ON approval_requests(contract_id);
CREATE INDEX IF NOT EXISTS idx_approval_requests_status ON approval_requests(status);
CREATE INDEX IF NOT EXISTS idx_approval_requests_created_by ON approval_requests(created_by);

-- RLS
ALTER TABLE approval_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_workflow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_workflow_step_approvers ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_request_approvals ENABLE ROW LEVEL SECURITY;

-- Workflows visíveis para todos os utilizadores autenticados
CREATE POLICY "Authenticated users can view workflows"
    ON approval_workflows FOR SELECT USING (auth.role() = 'authenticated');

-- Apenas admins criam/actualizam/eliminam workflows
CREATE POLICY "Admins can insert workflows"
    ON approval_workflows FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );
CREATE POLICY "Admins can update workflows"
    ON approval_workflows FOR UPDATE USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );
CREATE POLICY "Admins can delete workflows"
    ON approval_workflows FOR DELETE USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Steps: select all, insert/update/delete only admin
CREATE POLICY "Authenticated users can view steps"
    ON approval_workflow_steps FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage steps"
    ON approval_workflow_steps FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );
CREATE POLICY "Admins can update steps"
    ON approval_workflow_steps FOR UPDATE USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );
CREATE POLICY "Admins can delete steps"
    ON approval_workflow_steps FOR DELETE USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Approvers: same as steps
CREATE POLICY "Authenticated users can view approvers"
    ON approval_workflow_step_approvers FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage approvers"
    ON approval_workflow_step_approvers FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );
CREATE POLICY "Admins can update approvers"
    ON approval_workflow_step_approvers FOR UPDATE USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );
CREATE POLICY "Admins can delete approvers"
    ON approval_workflow_step_approvers FOR DELETE USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Approval requests: created by user sees own, approvers see assigned
CREATE POLICY "Users can view their own requests"
    ON approval_requests FOR SELECT USING (
        created_by = auth.uid()
        OR EXISTS (
            SELECT 1 FROM approval_request_approvals ara
            JOIN approval_workflow_step_approvers awsa ON ara.step_id = awsa.step_id
            WHERE ara.request_id = approval_requests.id AND awsa.user_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM approval_workflow_step_approvers awsa
            JOIN approval_workflow_steps aws ON awsa.step_id = aws.id
            WHERE aws.workflow_id = approval_requests.workflow_id AND awsa.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create requests"
    ON approval_requests FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own pending requests"
    ON approval_requests FOR UPDATE USING (
        created_by = auth.uid() AND status = 'pending'
    );

-- Approvals: users see their own, admins see all
CREATE POLICY "Users can view their own approvals"
    ON approval_request_approvals FOR SELECT USING (
        user_id = auth.uid()
        OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Assigned approvers can insert approvals"
    ON approval_request_approvals FOR INSERT WITH CHECK (
        user_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM approval_workflow_step_approvers awsa
            JOIN approval_requests ar ON awsa.step_id = ar.current_step_id
            WHERE ar.id = request_id AND awsa.user_id = auth.uid()
        )
    );

-- Function to check if a step is complete
CREATE OR REPLACE FUNCTION public.check_step_complete(p_request_id UUID, p_step_id UUID)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_required INTEGER;
    v_approved INTEGER;
BEGIN
    SELECT required_approvers INTO v_required
    FROM approval_workflow_steps WHERE id = p_step_id;

    SELECT COUNT(*) INTO v_approved
    FROM approval_request_approvals
    WHERE request_id = p_request_id AND step_id = p_step_id AND status = 'approved';

    RETURN v_approved >= v_required;
END;
$$;

-- Function to auto-advance to next step or complete
CREATE OR REPLACE FUNCTION public.advance_approval_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_next_order INTEGER;
    v_next_step_id UUID;
    v_max_order INTEGER;
BEGIN
    -- Check if current step is complete
    IF NOT check_step_complete(NEW.request_id, NEW.step_id) THEN
        RETURN NEW;
    END IF;

    -- Get current request
    SELECT current_step_order INTO v_max_order
    FROM approval_requests WHERE id = NEW.request_id;

    -- Find next step
    SELECT id, step_order INTO v_next_step_id, v_next_order
    FROM approval_workflow_steps
    WHERE workflow_id = (SELECT workflow_id FROM approval_requests WHERE id = NEW.request_id)
      AND step_order > v_max_order
    ORDER BY step_order ASC
    LIMIT 1;

    IF v_next_step_id IS NOT NULL THEN
        -- Advance to next step
        UPDATE approval_requests
        SET current_step_id = v_next_step_id,
            current_step_order = v_next_order,
            updated_at = NOW()
        WHERE id = NEW.request_id;
    ELSE
        -- All steps complete — approve
        UPDATE approval_requests
        SET status = 'approved',
            current_step_id = NULL,
            updated_at = NOW(),
            completed_at = NOW()
        WHERE id = NEW.request_id;

        -- Update contract status
        UPDATE contracts SET status = 'approved' WHERE id = (
            SELECT contract_id FROM approval_requests WHERE id = NEW.request_id
        );
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_advance_approval
    AFTER INSERT ON approval_request_approvals
    FOR EACH ROW
    EXECUTE FUNCTION advance_approval_request();

-- Function to reject request
CREATE OR REPLACE FUNCTION public.reject_approval_request(p_request_id UUID, p_user_id UUID, p_comment TEXT DEFAULT '')
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE approval_requests
    SET status = 'rejected',
        updated_at = NOW(),
        completed_at = NOW()
    WHERE id = p_request_id;

    UPDATE contracts SET status = 'rejected' WHERE id = (
        SELECT contract_id FROM approval_requests WHERE id = p_request_id
    );
END;
$$;

-- === END MIGRATION: 20260601000400_approval_workflows.sql ===

-- Enhance audit_logs with detailed tracking
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS resource_id UUID;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS resource_name TEXT;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS user_email TEXT;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS details JSONB DEFAULT '{}'::jsonb;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS ip_address TEXT;

CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_id ON audit_logs(resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_details ON audit_logs USING GIN (details);

-- Policy: admins can view all, regular users can view their own (already insert-all)
DROP POLICY IF EXISTS "Users can insert audit logs" ON audit_logs;
CREATE POLICY "Users can insert audit logs"
    ON audit_logs FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admins can view all audit logs" ON audit_logs;
CREATE POLICY "Admins can view all audit logs"
    ON audit_logs FOR SELECT
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Users can view their own audit logs" ON audit_logs;
CREATE POLICY "Users can view their own audit logs"
    ON audit_logs FOR SELECT
    USING (user_id = auth.uid());

-- === END MIGRATION: 20260601000500_audit_logs_enhance.sql ===

-- Currency support: exchange rates table
-- currency column já existe em contracts (core_tables.sql)

CREATE TABLE IF NOT EXISTS exchange_rates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    from_currency TEXT NOT NULL,
    to_currency TEXT NOT NULL,
    rate NUMERIC NOT NULL,
    source TEXT DEFAULT 'manual',
    UNIQUE (from_currency, to_currency)
);

CREATE INDEX IF NOT EXISTS idx_exchange_rates_from ON exchange_rates(from_currency);

ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read exchange rates"
    ON exchange_rates FOR SELECT
    USING (true);

CREATE POLICY "Admins can manage exchange rates"
    ON exchange_rates FOR ALL
    USING (auth.jwt() ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Seed some default rates
INSERT INTO exchange_rates (from_currency, to_currency, rate) VALUES
    ('AOA', 'USD', 0.0011),
    ('USD', 'AOA', 909.09),
    ('AOA', 'EUR', 0.0010),
    ('EUR', 'AOA', 1000.00),
    ('USD', 'EUR', 0.92),
    ('EUR', 'USD', 1.09)
ON CONFLICT (from_currency, to_currency) DO NOTHING;

-- === END MIGRATION: 20260601000600_currency.sql ===

-- Google integrations (Calendar + Docs)
CREATE TABLE IF NOT EXISTS google_integrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMPTZ,
    google_email TEXT,
    google_name TEXT,
    scope TEXT,
    is_connected BOOLEAN DEFAULT false,
    UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_google_integrations_user ON google_integrations(user_id);

ALTER TABLE google_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own integration"
    ON google_integrations FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- === END MIGRATION: 20260601000700_google_integration.sql ===

-- ============================================
-- Facturação Associada — ligar contratos a facturas
-- ============================================

-- Sequence for invoice numbers
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1;

-- Invoice table
CREATE TABLE IF NOT EXISTS invoices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    number TEXT NOT NULL,
    contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    owner_id UUID NOT NULL REFERENCES auth.users(id),
    title TEXT NOT NULL,
    description TEXT,
    value NUMERIC NOT NULL DEFAULT 0,
    tax_rate NUMERIC DEFAULT 0,
    tax_value NUMERIC DEFAULT 0,
    total_value NUMERIC NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','paid','overdue','cancelled')),
    issued_date DATE,
    due_date DATE,
    paid_date DATE,
    notes TEXT,
    line_items JSONB DEFAULT '[]'::jsonb,
    currency TEXT DEFAULT 'AOA',
    payment_terms TEXT,
    paid_via TEXT,
    notification_sent BOOLEAN DEFAULT false,
    UNIQUE (number)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_invoices_contract ON invoices(contract_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_owner ON invoices(owner_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);

-- Function to generate next invoice number
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    v_year TEXT := to_char(NOW(), 'YYYY');
    v_seq INTEGER;
    v_number TEXT;
BEGIN
    v_seq := nextval('invoice_number_seq');
    v_number := 'FAT-' || v_year || '-' || LPAD(v_seq::TEXT, 4, '0');
    RETURN v_number;
END;
$$;

-- RLS
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own invoices"
    ON invoices FOR SELECT
    USING (owner_id = auth.uid());

CREATE POLICY "Admins can view all invoices"
    ON invoices FOR SELECT
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Users can create invoices"
    ON invoices FOR INSERT
    WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update their own invoices"
    ON invoices FOR UPDATE
    USING (owner_id = auth.uid());

CREATE POLICY "Users can delete their own invoices"
    ON invoices FOR DELETE
    USING (owner_id = auth.uid());

-- === END MIGRATION: 20260601000800_invoices.sql ===

-- Add new notification types to existing CHECK constraint
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
  CHECK (type IN (
    'plan_expiring', 'plan_expired', 'plan_upgraded',
    'payment_request', 'payment_approved', 'payment_rejected',
    'contract_shared', 'approval_requested', 'contract_approved',
    'contract_rejected', 'contract_expiring'
  ));

-- Add reference_id and reference_type for linking notifications to entities
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS reference_id TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS reference_type TEXT;

-- Trigger: notify on contract status change
CREATE OR REPLACE FUNCTION public.notify_contract_status_change()
RETURNS TRIGGER AS $$
DECLARE
  v_owner_id TEXT;
BEGIN
  v_owner_id := NEW.owner_id::text;

  IF NEW.status = 'pending' AND OLD.status = 'draft' THEN
    INSERT INTO notifications (user_id, type, title, message, reference_id, reference_type)
    VALUES (v_owner_id, 'approval_requested',
      'Contrato submetido para aprovação',
      '"' || NEW.title || '" foi submetido para revisão.',
      NEW.id::text, 'contract');
  ELSIF NEW.status = 'approved' THEN
    INSERT INTO notifications (user_id, type, title, message, reference_id, reference_type)
    VALUES (v_owner_id, 'contract_approved',
      'Contrato aprovado',
      '"' || NEW.title || '" foi aprovado.',
      NEW.id::text, 'contract');
  ELSIF NEW.status = 'rejected' THEN
    INSERT INTO notifications (user_id, type, title, message, reference_id, reference_type)
    VALUES (v_owner_id, 'contract_rejected',
      'Contrato rejeitado',
      '"' || NEW.title || '" foi rejeitado' ||
      CASE WHEN NEW.rejection_reason IS NOT NULL THEN ': ' || NEW.rejection_reason ELSE '.' END,
      NEW.id::text, 'contract');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_contract_status ON contracts;
CREATE TRIGGER trg_notify_contract_status
  AFTER UPDATE OF status ON contracts
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.notify_contract_status_change();

-- Function: check for contracts expiring within 7 days and create notifications
CREATE OR REPLACE FUNCTION public.check_expiring_contracts()
RETURNS TABLE(contract_id UUID, owner_id UUID, title TEXT, end_date TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  UPDATE contracts c
  SET updated_at = updated_at
  WHERE c.end_date IS NOT NULL
    AND c.end_date BETWEEN now() AND now() + interval '7 days'
    AND c.status NOT IN ('rejected', 'approved')
    AND NOT EXISTS (
      SELECT 1 FROM notifications n
      WHERE n.reference_id = c.id::text
        AND n.type = 'contract_expiring'
        AND n.created_at > now() - interval '24 hours'
    )
  RETURNING c.id, c.owner_id, c.title, c.end_date;
END;
$$;

-- Function: manually check and insert expiry notifications (call from frontend)
CREATE OR REPLACE FUNCTION public.insert_expiry_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT c.id, c.owner_id::text, c.title, c.end_date
    FROM contracts c
    WHERE c.end_date IS NOT NULL
      AND c.end_date BETWEEN now() AND now() + interval '7 days'
      AND c.status NOT IN ('rejected', 'approved')
      AND NOT EXISTS (
        SELECT 1 FROM notifications n
        WHERE n.reference_id = c.id::text
          AND n.type = 'contract_expiring'
          AND n.created_at > now() - interval '24 hours'
      )
  LOOP
    INSERT INTO notifications (user_id, type, title, message, reference_id, reference_type)
    VALUES (
      r.owner_id,
      'contract_expiring',
      'Contrato a expirar',
      '"' || r.title || '" expira em ' || to_char(r.end_date, 'DD/MM/YYYY') || '.',
      r.id::text,
      'contract'
    );
  END LOOP;
END;
$$;

-- Notification preferences table (Enterprise)
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) UNIQUE,
  email_approval BOOLEAN DEFAULT true,
  email_sharing BOOLEAN DEFAULT true,
  email_expiry BOOLEAN DEFAULT true,
  email_digest BOOLEAN DEFAULT false,
  in_app_approval BOOLEAN DEFAULT true,
  in_app_sharing BOOLEAN DEFAULT true,
  in_app_expiry BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own notification preferences"
  ON notification_preferences FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_notif_prefs_user ON notification_preferences(user_id);

-- === END MIGRATION: 20260601000900_notifications.sql ===

-- External signature providers (DocuSign, HelloSign, etc.) and requests

CREATE TABLE IF NOT EXISTS signature_providers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    name TEXT NOT NULL UNIQUE,
    label TEXT NOT NULL,
    is_active BOOLEAN DEFAULT false,
    config JSONB DEFAULT '{}'::jsonb,
    sort_order INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS signature_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    provider_id UUID REFERENCES signature_providers(id) ON DELETE SET NULL,
    provider_request_id TEXT,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending','sent','viewed','signed','declined','error','voided')),
    signers JSONB DEFAULT '[]'::jsonb,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    envelope_url TEXT,
    error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_sigreq_contract ON signature_requests(contract_id);
CREATE INDEX IF NOT EXISTS idx_sigreq_provider ON signature_requests(provider_id);
CREATE INDEX IF NOT EXISTS idx_sigreq_status ON signature_requests(status);

ALTER TABLE signature_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE signature_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read providers"
    ON signature_providers FOR SELECT USING (true);

CREATE POLICY "Admins can manage providers"
    ON signature_providers FOR ALL
    USING (auth.jwt() ->> 'role' IN ('admin', 'superadmin'))
    WITH CHECK (auth.jwt() ->> 'role' IN ('admin', 'superadmin'));

CREATE POLICY "Users can read own requests"
    ON signature_requests FOR SELECT
    USING (created_by = auth.uid() OR auth.jwt() ->> 'role' IN ('admin', 'superadmin'));

CREATE POLICY "Users can create requests"
    ON signature_requests FOR INSERT
    WITH CHECK (created_by = auth.uid());

CREATE POLICY "Admins can update requests"
    ON signature_requests FOR UPDATE
    USING (auth.jwt() ->> 'role' IN ('admin', 'superadmin'))
    WITH CHECK (auth.jwt() ->> 'role' IN ('admin', 'superadmin'));

-- Seed default provider entries
INSERT INTO signature_providers (name, label, sort_order, config) VALUES
    ('docusign', 'DocuSign', 1, '{"base_url":"https://demo.docusign.net/restapi"}'),
    ('hellosign', 'HelloSign (Dropbox Sign)', 2, '{"base_url":"https://api.hellosign.com/v3"}'),
    ('signnow', 'SignNow', 3, '{"base_url":"https://api.signnow.com"}')
ON CONFLICT (name) DO NOTHING;

-- === END MIGRATION: 20260601001000_signature_providers.sql ===

-- Ensure pg_trgm extension for trigram search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add usage_count and full-text search columns
ALTER TABLE contract_templates ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_templates_name_trgm ON contract_templates USING GIN (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_templates_category ON contract_templates(category);

-- Update system templates with proper variable definitions
-- Function to increment usage count
CREATE OR REPLACE FUNCTION public.increment_template_usage(template_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE contract_templates SET usage_count = usage_count + 1 WHERE id = template_id;
END;
$$;

UPDATE contract_templates SET variables = '[
  {"name":"parte_nome","label":"Nome do Contratante","type":"text","required":true},
  {"name":"parte_nacionalidade","label":"Nacionalidade","type":"text","required":true},
  {"name":"parte_estado_civil","label":"Estado Civil","type":"text","required":true},
  {"name":"parte_profissao","label":"Profissão","type":"text","required":true},
  {"name":"parte_bi","label":"BI do Contratante","type":"text","required":true},
  {"name":"parte_bi_emissor","label":"Emissor do BI","type":"text","required":true},
  {"name":"parte_residencia","label":"Residência do Contratante","type":"text","required":true},
  {"name":"parte_representante","label":"Representante","type":"text"},
  {"name":"contraparte_nome","label":"Nome do Contratado","type":"text","required":true},
  {"name":"contraparte_nacionalidade","label":"Nacionalidade","type":"text","required":true},
  {"name":"contraparte_estado_civil","label":"Estado Civil","type":"text","required":true},
  {"name":"contraparte_profissao","label":"Profissão","type":"text","required":true},
  {"name":"contraparte_bi","label":"BI do Contratado","type":"text","required":true},
  {"name":"contraparte_bi_emissor","label":"Emissor do BI","type":"text","required":true},
  {"name":"contraparte_residencia","label":"Residência do Contratado","type":"text","required":true},
  {"name":"area_servico","label":"Área de Serviço","type":"text","required":true},
  {"name":"descricao_servico","label":"Descrição do Serviço","type":"textarea","required":true},
  {"name":"prazo_meses","label":"Prazo (meses)","type":"text","required":true},
  {"name":"data_inicio","label":"Data de Início","type":"date","required":true},
  {"name":"data_fim","label":"Data de Término","type":"date","required":true},
  {"name":"valor","label":"Valor","type":"currency","required":true},
  {"name":"valor_extenso","label":"Valor por Extenso","type":"text","required":true},
  {"name":"condicoes_pagamento","label":"Condições de Pagamento","type":"textarea","required":true},
  {"name":"prazo_resolucao","label":"Prazo de Resolução (dias)","type":"text","required":true},
  {"name":"foro","label":"Foro (Comarca)","type":"text","required":true},
  {"name":"cidade","label":"Cidade","type":"text","required":true},
  {"name":"data_assinatura","label":"Data de Assinatura","type":"date","required":true}
]'::jsonb WHERE name = 'Prestação de Serviços' AND is_system = true;

UPDATE contract_templates SET variables = '[
  {"name":"empregador_nome","label":"Nome do Empregador","type":"text","required":true},
  {"name":"empregador_nif","label":"NIF do Empregador","type":"text","required":true},
  {"name":"empregador_sede","label":"Sede do Empregador","type":"text","required":true},
  {"name":"empregador_representante","label":"Representante","type":"text","required":true},
  {"name":"empregador_cargo","label":"Cargo do Representante","type":"text","required":true},
  {"name":"trabalhador_nome","label":"Nome do Trabalhador","type":"text","required":true},
  {"name":"trabalhador_nacionalidade","label":"Nacionalidade","type":"text","required":true},
  {"name":"trabalhador_bi","label":"BI do Trabalhador","type":"text","required":true},
  {"name":"trabalhador_bi_emissor","label":"Emissor do BI","type":"text","required":true},
  {"name":"trabalhador_residencia","label":"Residência","type":"text","required":true},
  {"name":"funcao","label":"Função","type":"text","required":true},
  {"name":"departamento","label":"Departamento","type":"text","required":true},
  {"name":"local_trabalho","label":"Local de Trabalho","type":"text","required":true},
  {"name":"tipo_prazo","label":"Tipo de Prazo","type":"text","required":true},
  {"name":"duracao_meses","label":"Duração (meses)","type":"text","required":true},
  {"name":"data_inicio","label":"Data de Início","type":"date","required":true},
  {"name":"data_fim","label":"Data de Término","type":"date","required":true},
  {"name":"valor","label":"Salário Base","type":"currency","required":true},
  {"name":"valor_extenso","label":"Valor por Extenso","type":"text","required":true},
  {"name":"horario","label":"Horário Semanal (horas)","type":"text","required":true},
  {"name":"horario_inicio","label":"Início do Horário","type":"text","required":true},
  {"name":"horario_fim","label":"Fim do Horário","type":"text","required":true},
  {"name":"intervalo","label":"Intervalo","type":"text","required":true},
  {"name":"periodo_experimental","label":"Período Experimental (dias)","type":"text","required":true},
  {"name":"dias_ferias","label":"Dias de Férias","type":"text","required":true},
  {"name":"cidade","label":"Cidade","type":"text","required":true},
  {"name":"data_assinatura","label":"Data de Assinatura","type":"date","required":true}
]'::jsonb WHERE name = 'Contrato de Trabalho' AND is_system = true;

UPDATE contract_templates SET variables = '[
  {"name":"divulgador_nome","label":"Nome do Divulgador","type":"text","required":true},
  {"name":"divulgador_nif","label":"NIF do Divulgador","type":"text","required":true},
  {"name":"divulgador_sede","label":"Sede","type":"text","required":true},
  {"name":"divulgador_representante","label":"Representante","type":"text","required":true},
  {"name":"receptor_nome","label":"Nome do Receptor","type":"text","required":true},
  {"name":"receptor_nacionalidade","label":"Nacionalidade","type":"text"},
  {"name":"receptor_bi","label":"BI do Receptor","type":"text"},
  {"name":"receptor_residencia","label":"Residência","type":"text"},
  {"name":"prazo_anos","label":"Prazo (anos)","type":"text","required":true},
  {"name":"foro","label":"Foro","type":"text","required":true},
  {"name":"cidade","label":"Cidade","type":"text","required":true},
  {"name":"data_assinatura","label":"Data de Assinatura","type":"date","required":true}
]'::jsonb WHERE name = 'Acordo de Confidencialidade (NDA)' AND is_system = true;

UPDATE contract_templates SET variables = '[
  {"name":"senhorio_nome","label":"Nome do Senhorio","type":"text","required":true},
  {"name":"senhorio_nacionalidade","label":"Nacionalidade","type":"text","required":true},
  {"name":"senhorio_bi","label":"BI do Senhorio","type":"text","required":true},
  {"name":"senhorio_residencia","label":"Residência","type":"text","required":true},
  {"name":"inquilino_nome","label":"Nome do Inquilino","type":"text","required":true},
  {"name":"inquilino_nacionalidade","label":"Nacionalidade","type":"text","required":true},
  {"name":"inquilino_bi","label":"BI do Inquilino","type":"text","required":true},
  {"name":"inquilino_residencia","label":"Residência","type":"text","required":true},
  {"name":"imovel_endereco","label":"Endereço do Imóvel","type":"text","required":true},
  {"name":"imovel_descricao","label":"Descrição do Imóvel","type":"textarea","required":true},
  {"name":"imovel_area","label":"Área (m²)","type":"text","required":true},
  {"name":"destino_imovel","label":"Destino do Imóvel","type":"text","required":true},
  {"name":"prazo_meses","label":"Prazo (meses)","type":"text","required":true},
  {"name":"data_inicio","label":"Data de Início","type":"date","required":true},
  {"name":"data_fim","label":"Data de Término","type":"date","required":true},
  {"name":"valor","label":"Valor da Renda","type":"currency","required":true},
  {"name":"valor_extenso","label":"Valor por Extenso","type":"text","required":true},
  {"name":"dia_pagamento","label":"Dia de Pagamento","type":"text","required":true},
  {"name":"iban_senhorio","label":"IBAN do Senhorio","type":"text","required":true},
  {"name":"valor_caucao","label":"Valor da Caução","type":"currency","required":true},
  {"name":"dias_incumprimento","label":"Dias para Incumprimento","type":"text","required":true},
  {"name":"cidade","label":"Cidade","type":"text","required":true},
  {"name":"data_assinatura","label":"Data de Assinatura","type":"date","required":true}
]'::jsonb WHERE name = 'Contrato de Arrendamento' AND is_system = true;

UPDATE contract_templates SET variables = '[
  {"name":"vendedor_nome","label":"Nome do Vendedor","type":"text","required":true},
  {"name":"vendedor_nacionalidade","label":"Nacionalidade","type":"text"},
  {"name":"vendedor_bi","label":"BI do Vendedor","type":"text","required":true},
  {"name":"vendedor_residencia","label":"Residência","type":"text"},
  {"name":"comprador_nome","label":"Nome do Comprador","type":"text","required":true},
  {"name":"comprador_nacionalidade","label":"Nacionalidade","type":"text"},
  {"name":"comprador_bi","label":"BI do Comprador","type":"text","required":true},
  {"name":"comprador_residencia","label":"Residência","type":"text"},
  {"name":"descricao_bem","label":"Descrição do Bem","type":"textarea","required":true},
  {"name":"valor","label":"Valor","type":"currency","required":true},
  {"name":"valor_extenso","label":"Valor por Extenso","type":"text","required":true},
  {"name":"condicoes_pagamento","label":"Condições de Pagamento","type":"textarea","required":true},
  {"name":"data_entrega","label":"Data de Entrega","type":"date","required":true},
  {"name":"local_entrega","label":"Local de Entrega","type":"text","required":true},
  {"name":"foro","label":"Foro","type":"text","required":true},
  {"name":"cidade","label":"Cidade","type":"text","required":true},
  {"name":"data_assinatura","label":"Data de Assinatura","type":"date","required":true}
]'::jsonb WHERE name = 'Contrato de Compra e Venda' AND is_system = true;

UPDATE contract_templates SET variables = '[
  {"name":"parceiro1_nome","label":"Nome do Parceiro 1","type":"text","required":true},
  {"name":"parceiro1_nif","label":"NIF do Parceiro 1","type":"text","required":true},
  {"name":"parceiro1_sede","label":"Sede do Parceiro 1","type":"text","required":true},
  {"name":"parceiro1_representante","label":"Representante Parceiro 1","type":"text","required":true},
  {"name":"parceiro2_nome","label":"Nome do Parceiro 2","type":"text","required":true},
  {"name":"parceiro2_nif","label":"NIF do Parceiro 2","type":"text","required":true},
  {"name":"parceiro2_sede","label":"Sede do Parceiro 2","type":"text","required":true},
  {"name":"parceiro2_representante","label":"Representante Parceiro 2","type":"text","required":true},
  {"name":"area_parceria","label":"Área da Parceria","type":"text","required":true},
  {"name":"objectivo_parceria","label":"Objectivo da Parceria","type":"textarea","required":true},
  {"name":"obrigacoes_parceiro1","label":"Obrigações do Parceiro 1","type":"textarea","required":true},
  {"name":"obrigacoes_parceiro2","label":"Obrigações do Parceiro 2","type":"textarea","required":true},
  {"name":"partilha_receitas","label":"Partilha de Receitas","type":"textarea","required":true},
  {"name":"propriedade_intelectual","label":"Propriedade Intelectual","type":"textarea","required":true},
  {"name":"prazo_parceria","label":"Prazo da Parceria","type":"text","required":true},
  {"name":"foro","label":"Foro","type":"text","required":true},
  {"name":"cidade","label":"Cidade","type":"text","required":true},
  {"name":"data_assinatura","label":"Data de Assinatura","type":"date","required":true}
]'::jsonb WHERE name = 'Acordo de Parceria' AND is_system = true;

-- === END MIGRATION: 20260601001100_templates_enhance.sql ===

-- Reminders table for scheduled notifications
CREATE TABLE IF NOT EXISTS reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT,
  remind_at TIMESTAMPTZ NOT NULL,
  type TEXT NOT NULL DEFAULT 'custom' CHECK (type IN ('expiry', 'renewal', 'signature', 'approval', 'custom')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own reminders"
  ON reminders FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_reminders_user ON reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_contract ON reminders(contract_id);
CREATE INDEX IF NOT EXISTS idx_reminders_remind_at ON reminders(remind_at);
CREATE INDEX IF NOT EXISTS idx_reminders_status ON reminders(status);

-- Renewal fields on contracts - já existem em core_tables.sql
-- auto_renew, renewal_period, renewed_from, renewal_count, notification_days

-- Renewal history table
CREATE TABLE IF NOT EXISTS renewal_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  renewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  previous_end_date TIMESTAMPTZ NOT NULL,
  new_end_date TIMESTAMPTZ NOT NULL,
  previous_value NUMERIC,
  new_value NUMERIC,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id)
);

ALTER TABLE renewal_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own renewal history"
  ON renewal_history FOR SELECT
  USING (auth.uid() = created_by);

CREATE POLICY "Users can insert their own renewal history"
  ON renewal_history FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE INDEX IF NOT EXISTS idx_renewal_history_contract ON renewal_history(contract_id);

-- Function: insert contract expiry notification when creating a reminder of type 'expiry'
CREATE OR REPLACE FUNCTION public.check_reminders_due()
RETURNS TABLE(reminder_id UUID, user_id TEXT, contract_id UUID, title TEXT, message TEXT, type TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  UPDATE reminders r
  SET status = 'sent', updated_at = now()
  WHERE r.remind_at <= now()
    AND r.status = 'pending'
  RETURNING r.id, r.user_id, r.contract_id, r.title, r.message, r.type;
END;
$$;

-- Function: create automatic expiry reminders when a contract is created/updated with an end_date
CREATE OR REPLACE FUNCTION public.create_expiry_reminder()
RETURNS TRIGGER AS $$
DECLARE
  v_remind_at TIMESTAMPTZ;
  v_days INTEGER;
BEGIN
  IF NEW.end_date IS NOT NULL AND (OLD.end_date IS DISTINCT FROM NEW.end_date OR TG_OP = 'INSERT') THEN
    v_days := COALESCE(NEW.notification_days, 30);
    v_remind_at := NEW.end_date - (v_days || ' days')::INTERVAL;

    -- Delete old pending expiry reminders for this contract
    DELETE FROM reminders WHERE contract_id = NEW.id AND type = 'expiry' AND status = 'pending';

    -- Create new reminder if remind_at is in the future
    IF v_remind_at > now() THEN
      INSERT INTO reminders (user_id, contract_id, title, message, remind_at, type)
      VALUES (
        NEW.owner_id::text,
        NEW.id,
        'Contrato a expirar',
        'O contrato "' || NEW.title || '" expira em ' || to_char(NEW.end_date, 'DD/MM/YYYY') || '.'
          || CASE WHEN NEW.auto_renew THEN ' A renovação automática está activa.' ELSE ' Renova manualmente se necessário.' END,
        v_remind_at,
        'expiry'
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_create_expiry_reminder ON contracts;
CREATE TRIGGER trg_create_expiry_reminder
  AFTER INSERT OR UPDATE OF end_date, notification_days, auto_renew ON contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.create_expiry_reminder();

-- Function: renew a contract (extends end_date)
CREATE OR REPLACE FUNCTION public.renew_contract(
  p_contract_id UUID,
  p_new_end_date TIMESTAMPTZ,
  p_new_value NUMERIC DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_old_end_date TIMESTAMPTZ;
  v_old_value NUMERIC;
  v_title TEXT;
  v_owner_id TEXT;
BEGIN
  SELECT end_date, value, title, owner_id::text INTO v_old_end_date, v_old_value, v_title, v_owner_id
  FROM contracts WHERE id = p_contract_id;

  IF v_old_end_date IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Contract has no end date');
  END IF;

  -- Update contract
  UPDATE contracts
  SET end_date = p_new_end_date,
      value = COALESCE(p_new_value, value),
      renewal_count = COALESCE(renewal_count, 0) + 1,
      updated_at = now()
  WHERE id = p_contract_id;

  -- Record in renewal history
  INSERT INTO renewal_history (contract_id, previous_end_date, new_end_date, previous_value, new_value, notes, created_by)
  VALUES (p_contract_id, v_old_end_date, p_new_end_date, v_old_value, p_new_value, p_notes, v_owner_id);

  -- Create notification
  INSERT INTO notifications (user_id, type, title, message, reference_id, reference_type)
  VALUES (v_owner_id, 'contract_approved',
    'Contrato renovado',
    '"' || v_title || '" foi renovado até ' || to_char(p_new_end_date, 'DD/MM/YYYY') || '.',
    p_contract_id::text, 'contract');

  RETURN json_build_object('success', true, 'renewal_count', (SELECT renewal_count FROM contracts WHERE id = p_contract_id));
END;
$$;

-- === END MIGRATION: 20260602_reminders_renewals.sql ===

-- Trial period support
-- trial_ends_at já existe em profiles (core_tables.sql)
-- Função para ativar trial automaticamente no signup

-- Automatically start a 14-day trial when a new profile is created
-- (i.e., when a new user signs up and their profile row is inserted).
CREATE OR REPLACE FUNCTION start_trial_on_signup()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Only start trial if the user has no paid plan yet
  IF NEW.plan IS NULL OR NEW.plan = 'free' THEN
    NEW.trial_ends_at := now() + interval '14 days';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_start_trial ON profiles;
CREATE TRIGGER trigger_start_trial
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION start_trial_on_signup();

-- RLS: users can read their own trial_ends_at (already covered by existing profile policies)
-- No extra policy needed.

-- === END MIGRATION: 20260603000100_trial_period.sql ===

-- Persiste o estado do onboarding na base de dados
-- em vez de localStorage, para que seja consistente entre dispositivos.
-- onboarding_completed já existe em profiles (core_tables.sql)

-- === END MIGRATION: 20260603000200_onboarding_completed.sql ===

-- ============================================
-- RBAC + Multi-tenancy Migration
-- Sistema de permissões granular e suporte a empresas
-- ============================================

-- 1. Tabela companies (Organizações/Empresas)
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  plan_expires_at TIMESTAMPTZ,
  max_users INTEGER DEFAULT 5,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_companies_slug ON companies(slug);
CREATE INDEX IF NOT EXISTS idx_companies_plan ON companies(plan);

-- 2. Tabela permissions (Permissões Disponíveis)
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_permissions_category ON permissions(category);
CREATE INDEX IF NOT EXISTS idx_permissions_code ON permissions(code);

-- 3. Tabela user_permissions (Permissões por Usuário)
CREATE TABLE IF NOT EXISTS user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  granted_by UUID REFERENCES profiles(id),
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  UNIQUE(user_id, permission_id)
);

CREATE INDEX IF NOT EXISTS idx_user_permissions_user ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_permission ON user_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_expires ON user_permissions(expires_at);

-- 4. Atualizar tabela profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE SET NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_profiles_company ON profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_profiles_super_admin ON profiles(is_super_admin);

-- 5. Atualizar audit_logs
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS permission_id UUID REFERENCES permissions(id);
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_permission ON audit_logs(permission_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_company ON audit_logs(company_id);

-- 6. Funções SQL de verificação

-- Verificar se usuário tem permissão específica
CREATE OR REPLACE FUNCTION has_permission(
  user_id UUID,
  permission_code TEXT
) RETURNS BOOLEAN AS $$
BEGIN
  -- Super Admin tem todas as permissões
  IF EXISTS (SELECT 1 FROM profiles WHERE id = user_id AND is_super_admin = true) THEN
    RETURN true;
  END IF;
  
  -- Verificar permissão explícita
  RETURN EXISTS (
    SELECT 1 
    FROM user_permissions up
    JOIN permissions p ON up.permission_id = p.id
    WHERE up.user_id = user_id 
    AND p.code = permission_code
    AND (up.expires_at IS NULL OR up.expires_at > NOW())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verificar se usuário pode acessar dados de uma empresa
CREATE OR REPLACE FUNCTION can_access_company(
  user_id UUID,
  company_id_param UUID
) RETURNS BOOLEAN AS $$
BEGIN
  -- Super Admin pode acessar tudo
  IF EXISTS (SELECT 1 FROM profiles WHERE id = user_id AND is_super_admin = true) THEN
    RETURN true;
  END IF;
  
  -- Usuário pode acessar sua própria empresa
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = user_id AND company_id = company_id_param
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. RLS Policies

-- Companies
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can view all companies"
  ON companies FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_super_admin = true));

CREATE POLICY "Users can view their own company"
  ON companies FOR SELECT
  USING (id = (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Super admins can insert companies"
  ON companies FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_super_admin = true));

CREATE POLICY "Super admins can update companies"
  ON companies FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_super_admin = true));

-- Permissions
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view permissions"
  ON permissions FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Super admins can manage permissions"
  ON permissions FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_super_admin = true));

-- User Permissions
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own permissions"
  ON user_permissions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can view permissions of same company"
  ON user_permissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p1
      JOIN profiles p2 ON p1.company_id = p2.company_id
      WHERE p1.id = auth.uid() AND p2.id = user_permissions.user_id
    )
  );

CREATE POLICY "Users with users.manage_permissions can grant permissions"
  ON user_permissions FOR INSERT
  WITH CHECK (
    has_permission(auth.uid(), 'users.manage_permissions')
    AND can_access_company(auth.uid(), (SELECT company_id FROM profiles WHERE id = user_id))
  );

CREATE POLICY "Users with users.manage_permissions can revoke permissions"
  ON user_permissions FOR DELETE
  USING (
    has_permission(auth.uid(), 'users.manage_permissions')
    AND can_access_company(auth.uid(), (SELECT company_id FROM profiles WHERE id = user_id))
  );

-- 8. Popular tabela permissions com permissões padrão
INSERT INTO permissions (code, name, description, category, is_system) VALUES
-- Contratos
('contracts.view', 'Ver Contratos', 'Permite visualizar contratos', 'contracts', true),
('contracts.create', 'Criar Contratos', 'Permite criar novos contratos', 'contracts', true),
('contracts.edit', 'Editar Contratos', 'Permite editar contratos existentes', 'contracts', true),
('contracts.delete', 'Eliminar Contratos', 'Permite eliminar contratos', 'contracts', true),
('contracts.export', 'Exportar Contratos', 'Permite exportar contratos', 'contracts', true),
('contracts.approve', 'Aprovar Contratos', 'Permite aprovar contratos', 'contracts', true),
('contracts.sign', 'Assinar Contratos', 'Permite assinar contratos', 'contracts', true),

-- Clientes
('clients.view', 'Ver Clientes', 'Permite visualizar clientes', 'clients', true),
('clients.create', 'Criar Clientes', 'Permite criar novos clientes', 'clients', true),
('clients.edit', 'Editar Clientes', 'Permite editar clientes existentes', 'clients', true),
('clients.delete', 'Eliminar Clientes', 'Permite eliminar clientes', 'clients', true),

-- Usuários
('users.view', 'Ver Usuários', 'Permite visualizar usuários da empresa', 'users', true),
('users.create', 'Criar Usuários', 'Permite convidar novos usuários', 'users', true),
('users.edit', 'Editar Usuários', 'Permite editar usuários existentes', 'users', true),
('users.delete', 'Eliminar Usuários', 'Permite remover usuários', 'users', true),
('users.manage_permissions', 'Gerenciar Permissões', 'Permite gerenciar permissões de usuários', 'users', true),

-- Relatórios
('reports.view', 'Ver Relatórios', 'Permite visualizar relatórios', 'reports', true),
('reports.export', 'Exportar Relatórios', 'Permite exportar relatórios', 'reports', true),
('reports.analytics', 'Ver Analytics', 'Permite visualizar analytics', 'reports', true),

-- Financeiro
('finance.view', 'Ver Faturas', 'Permite visualizar faturas', 'finance', true),
('finance.create', 'Criar Faturas', 'Permite criar faturas', 'finance', true),
('finance.edit', 'Editar Faturas', 'Permite editar faturas', 'finance', true),
('finance.delete', 'Eliminar Faturas', 'Permite eliminar faturas', 'finance', true),
('finance.approve', 'Aprovar Pagamentos', 'Permite aprovar pagamentos', 'finance', true),

-- Configurações
('settings.view', 'Ver Configurações', 'Permite visualizar configurações da empresa', 'settings', true),
('settings.edit', 'Editar Configurações', 'Permite editar configurações da empresa', 'settings', true),
('settings.manage_plans', 'Gerenciar Planos', 'Permite gerenciar planos (Super Admin)', 'settings', true),

-- Auditoria
('audit.view', 'Ver Logs de Auditoria', 'Permite visualizar logs de auditoria', 'audit', true),
('audit.export', 'Exportar Logs', 'Permite exportar logs de auditoria', 'audit', true)
ON CONFLICT (code) DO NOTHING;

-- 9. NOTA: Não marcar automaticamente todos os admins como Super Admin
-- Super Admin deve ser um papel separado, gerenciado manualmente
-- Use o script scripts/make-super-admin.sql para promover um usuário específico

-- === END MIGRATION: 20260604000000_rbac_multi_tenancy.sql ===

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

-- === END MIGRATION: 20260604000001_update_rls_policies.sql ===

-- ============================================
-- Fix RLS Recursion in Profiles
-- ============================================

-- Drop problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

-- Create fixed policies that don't cause recursion
CREATE POLICY "Admins can read all profiles"
  ON profiles FOR SELECT
  USING (
    -- Super admins can read all profiles
    (SELECT is_super_admin FROM profiles WHERE id = auth.uid()) = true
    OR
    -- Regular admins can read all profiles (but need to check their own role first)
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
      AND is_super_admin = false
    )
  );

CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  USING (
    -- Super admins can update all profiles
    (SELECT is_super_admin FROM profiles WHERE id = auth.uid()) = true
    OR
    -- Regular admins can update all profiles (but need to check their own role first)
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
      AND is_super_admin = false
    )
  );

-- === END MIGRATION: 20260604000002_fix_rls_recursion.sql ===

-- ============================================
-- Disable RLS on profiles temporarily to fix recursion issue
-- ============================================

-- Drop all policies on profiles
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

-- Disable RLS temporarily
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- === END MIGRATION: 20260604000003_disable_rls_profiles.sql ===

-- ============================================
-- Add user_signatures table
-- ============================================

CREATE TABLE IF NOT EXISTS user_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  signature_data TEXT,
  is_default BOOLEAN DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_user_signatures_user ON user_signatures(user_id);

ALTER TABLE user_signatures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own signatures"
  ON user_signatures FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create signatures"
  ON user_signatures FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own signatures"
  ON user_signatures FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own signatures"
  ON user_signatures FOR DELETE
  USING (auth.uid() = user_id);

-- === END MIGRATION: 20260604000004_add_user_signatures.sql ===

-- ============================================
-- Create signatures storage bucket
-- ============================================

-- Insert storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('signatures', 'signatures', false)
ON CONFLICT (id) DO NOTHING;

-- Create folder for sessions
-- Note: Supabase Storage doesn't have explicit folders, but we can use paths

-- Policies for signatures bucket
CREATE POLICY "Users can upload signatures"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'signatures' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can read own signatures"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'signatures' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own signatures"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'signatures' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- === END MIGRATION: 20260604000005_create_signatures_bucket.sql ===

-- ============================================
-- Fix RLS policies for user_signatures table
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own signatures" ON user_signatures;
DROP POLICY IF EXISTS "Users can create signatures" ON user_signatures;
DROP POLICY IF EXISTS "Users can update own signatures" ON user_signatures;
DROP POLICY IF EXISTS "Users can delete own signatures" ON user_signatures;

-- Create new policies with proper checks
CREATE POLICY "Users can read own signatures"
  ON user_signatures FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create signatures"
  ON user_signatures FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own signatures"
  ON user_signatures FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own signatures"
  ON user_signatures FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- === END MIGRATION: 20260604000006_fix_signatures_rls.sql ===

-- ============================================
-- Disable RLS on user_signatures table
-- ============================================

ALTER TABLE user_signatures DISABLE ROW LEVEL SECURITY;

-- === END MIGRATION: 20260604000007_disable_rls_user_signatures.sql ===

-- ============================================
-- Disable RLS on all tables
-- ============================================

-- Disable RLS on all tables (skip if table doesn't exist)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'contracts') THEN
        ALTER TABLE contracts DISABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'clients') THEN
        ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'tags') THEN
        ALTER TABLE tags DISABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'api_keys') THEN
        ALTER TABLE api_keys DISABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'approval_workflows') THEN
        ALTER TABLE approval_workflows DISABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'audit_logs') THEN
        ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'invoices') THEN
        ALTER TABLE invoices DISABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'notifications') THEN
        ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'signature_providers') THEN
        ALTER TABLE signature_providers DISABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'templates') THEN
        ALTER TABLE templates DISABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'reminders') THEN
        ALTER TABLE reminders DISABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'renewals') THEN
        ALTER TABLE renewals DISABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
        ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_signatures') THEN
        ALTER TABLE user_signatures DISABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- === END MIGRATION: 20260604000008_disable_all_rls.sql ===

-- ============================================
-- Disable RLS on storage buckets
-- ============================================

-- Make signatures bucket public
UPDATE storage.buckets SET public = true WHERE id = 'signatures';

-- Drop any existing RLS policies on storage.objects (ignore if they don't exist)
DROP POLICY IF EXISTS "Authenticated can select" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can insert" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can update" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can delete" ON storage.objects;
DROP POLICY IF EXISTS "Public can select" ON storage.objects;

-- === END MIGRATION: 20260604000009_disable_storage_rls.sql ===

-- ============================================
-- Fix storage RLS for signatures bucket
-- ============================================

-- Ensure signatures bucket is public
UPDATE storage.buckets SET public = true WHERE id = 'signatures';

-- Drop all policies on storage.objects for signatures bucket
DROP POLICY IF EXISTS "Auth Public Signatures" ON storage.objects;
DROP POLICY IF EXISTS "Auth Signatures Select" ON storage.objects;
DROP POLICY IF EXISTS "Auth Signatures Insert" ON storage.objects;
DROP POLICY IF EXISTS "Auth Signatures Update" ON storage.objects;
DROP POLICY IF EXISTS "Auth Signatures Delete" ON storage.objects;
DROP POLICY IF EXISTS "Public Signatures Select" ON storage.objects;

-- Create a permissive policy for signatures bucket
CREATE POLICY "Public Signatures Access" ON storage.objects
  FOR ALL
  USING (bucket_id = 'signatures')
  WITH CHECK (bucket_id = 'signatures');

-- === END MIGRATION: 20260604000010_fix_storage_rls.sql ===

-- ============================================
-- Fix user_signatures table schema
-- ============================================

-- Check if user_signatures table has the correct columns
DO $$
BEGIN
    -- Add missing columns if they don't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_signatures' AND column_name = 'image_url'
    ) THEN
        ALTER TABLE user_signatures ADD COLUMN image_url TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_signatures' AND column_name = 'encrypted_data'
    ) THEN
        ALTER TABLE user_signatures ADD COLUMN encrypted_data TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_signatures' AND column_name = 'is_active'
    ) THEN
        ALTER TABLE user_signatures ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
END $$;

-- === END MIGRATION: 20260604000011_fix_storage_policies.sql ===

-- ============================================
-- Fix signatures storage policies for QR code sessions
-- ============================================

-- Drop restrictive policies
DROP POLICY IF EXISTS "Users can upload signatures" ON storage.objects;
DROP POLICY IF EXISTS "Users can read own signatures" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own signatures" ON storage.objects;

-- Create permissive policies for signatures bucket
CREATE POLICY "Allow all signatures operations" ON storage.objects
  FOR ALL
  USING (bucket_id = 'signatures')
  WITH CHECK (bucket_id = 'signatures');

-- Ensure bucket is public
UPDATE storage.buckets SET public = true WHERE id = 'signatures';

-- === END MIGRATION: 20260604000012_fix_signatures_storage_policies.sql ===

-- ============================================
-- Add missing name column to user_signatures
-- ============================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_signatures' AND column_name = 'name'
    ) THEN
        ALTER TABLE user_signatures ADD COLUMN name TEXT;
    END IF;
END $$;

-- === END MIGRATION: 20260604000013_add_name_column.sql ===

-- Payment Settings
CREATE TABLE IF NOT EXISTS payment_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  bank_name TEXT,
  bank_iban TEXT,
  bank_nib TEXT,
  bank_holder TEXT,
  paypal_email TEXT
);

ALTER TABLE payment_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage payment settings"
  ON payment_settings FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Users can view payment settings"
  ON payment_settings FOR SELECT
  USING (true);

-- Payment Requests
CREATE TABLE IF NOT EXISTS payment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL CHECK (plan IN ('pro', 'enterprise')),
  amount NUMERIC NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  payment_method TEXT CHECK (payment_method IN ('bank_transfer', 'paypal')),
  receipt_url TEXT,
  user_paypal_email TEXT,
  approved_by UUID REFERENCES auth.users(id),
  notes TEXT,
  type TEXT DEFAULT 'new' CHECK (type IN ('new', 'renewal'))
);

CREATE INDEX IF NOT EXISTS idx_payment_requests_user ON payment_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_status ON payment_requests(status);

ALTER TABLE payment_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payment requests"
  ON payment_requests FOR SELECT
  USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Users can create payment requests"
  ON payment_requests FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can update payment requests"
  ON payment_requests FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Storage bucket for payment receipts
INSERT INTO storage.buckets (id, name, public) 
VALUES ('payment-receipts', 'payment-receipts', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload payment receipts"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'payment-receipts' AND auth.uid() IS NOT NULL);

CREATE POLICY "Admins can view payment receipts"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'payment-receipts' AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- === END MIGRATION: 20260605000000_payments_storage.sql ===

