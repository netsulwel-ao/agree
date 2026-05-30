-- Sistema de pagamentos: checkout e aprovação admin

-- ============================================================
-- 1. payment_requests
-- ============================================================
CREATE TABLE IF NOT EXISTS payment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES profiles(id),
  plan TEXT NOT NULL CHECK (plan IN ('pro', 'enterprise')),
  amount NUMERIC NOT NULL,
  payment_method TEXT CHECK (payment_method IN ('bank_transfer', 'paypal')),
  receipt_url TEXT,
  user_paypal_email TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  approved_by TEXT REFERENCES profiles(id),
  notes TEXT
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_payment_requests_user_id ON payment_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_status ON payment_requests(status);

-- Trigger para auto-atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_payment_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_payment_requests_updated_at ON payment_requests;
CREATE TRIGGER trg_payment_requests_updated_at
  BEFORE UPDATE ON payment_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_payment_requests_updated_at();

-- RLS
ALTER TABLE payment_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert their own payment_requests" ON payment_requests;
CREATE POLICY "Users can insert their own payment_requests"
  ON payment_requests FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can view their own payment_requests" ON payment_requests;
CREATE POLICY "Users can view their own payment_requests"
  ON payment_requests FOR SELECT
  USING (auth.uid()::text = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Admins can update payment_requests" ON payment_requests;
CREATE POLICY "Admins can update payment_requests"
  ON payment_requests FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================
-- 2. payment_settings
-- ============================================================
CREATE TABLE IF NOT EXISTS payment_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_name TEXT DEFAULT '',
  bank_iban TEXT DEFAULT '',
  bank_nib TEXT DEFAULT '',
  bank_holder TEXT DEFAULT '',
  paypal_email TEXT DEFAULT '',
  updated_by TEXT REFERENCES profiles(id),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.update_payment_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_payment_settings_updated_at ON payment_settings;
CREATE TRIGGER trg_payment_settings_updated_at
  BEFORE UPDATE ON payment_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_payment_settings_updated_at();

INSERT INTO payment_settings (bank_name, bank_iban, bank_nib, bank_holder, paypal_email)
SELECT '', '', '', '', ''
WHERE NOT EXISTS (SELECT 1 FROM payment_settings);

ALTER TABLE payment_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone authenticated can view payment_settings" ON payment_settings;
CREATE POLICY "Anyone authenticated can view payment_settings"
  ON payment_settings FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins can update payment_settings" ON payment_settings;
CREATE POLICY "Admins can update payment_settings"
  ON payment_settings FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can insert payment_settings" ON payment_settings;
CREATE POLICY "Admins can insert payment_settings"
  ON payment_settings FOR INSERT
  WITH CHECK (public.is_admin());

-- ============================================================
-- 3. Storage bucket para comprovativos
-- ============================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('payment-receipts', 'payment-receipts', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Upload payment receipts" ON storage.objects;
CREATE POLICY "Upload payment receipts"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'payment-receipts' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "View payment receipts" ON storage.objects;
CREATE POLICY "View payment receipts"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'payment-receipts');
