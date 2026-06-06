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
