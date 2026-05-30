-- ============================================================
-- RLS Enforcement, Plan History & Expiry Notifications
-- ============================================================

-- 1. PLAN HISTORY TABLE
CREATE TABLE IF NOT EXISTS plan_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES profiles(id),
  old_plan TEXT,
  new_plan TEXT NOT NULL,
  change_type TEXT NOT NULL CHECK (change_type IN ('upgrade', 'renewal', 'downgrade', 'admin_change')),
  changed_by TEXT REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE plan_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own plan history" ON plan_history;
CREATE POLICY "Users can view their own plan history"
  ON plan_history FOR SELECT
  USING (auth.uid()::text = user_id OR public.is_admin());

DROP POLICY IF EXISTS "System can insert plan history" ON plan_history;
CREATE POLICY "System can insert plan history"
  ON plan_history FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can delete plan history" ON plan_history;
CREATE POLICY "Admins can delete plan history"
  ON plan_history FOR DELETE
  USING (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_plan_history_user_id ON plan_history(user_id);
CREATE INDEX IF NOT EXISTS idx_plan_history_created_at ON plan_history(created_at);

-- 2. TRIGGER TO AUTO-LOG PLAN CHANGES ON profiles.plan
CREATE OR REPLACE FUNCTION public.log_plan_change()
RETURNS TRIGGER AS $$
DECLARE
    v_change_type TEXT;
    v_admin_id TEXT;
BEGIN
    IF OLD.plan IS NOT DISTINCT FROM NEW.plan THEN RETURN NEW; END IF;

    IF OLD.plan = 'free' AND NEW.plan IN ('pro', 'enterprise') THEN
        v_change_type := 'upgrade';
    ELSIF NEW.plan = 'free' THEN
        v_change_type := 'downgrade';
    ELSIF OLD.plan = NEW.plan THEN
        v_change_type := 'renewal';
    ELSE
        v_change_type := 'admin_change';
    END IF;

    BEGIN
        SELECT id INTO v_admin_id FROM profiles
        WHERE id = auth.uid()::text AND role = 'admin';
    EXCEPTION WHEN OTHERS THEN
        v_admin_id := NULL;
    END;

    INSERT INTO plan_history (user_id, old_plan, new_plan, change_type, changed_by)
    VALUES (NEW.id, OLD.plan, NEW.plan, v_change_type, v_admin_id);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_log_plan_change ON profiles;
CREATE TRIGGER trg_log_plan_change
  AFTER UPDATE OF plan ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.log_plan_change();

-- 3. RLS ENFORCEMENT — Contract creation limit per plan
CREATE OR REPLACE FUNCTION public.can_create_contract()
RETURNS BOOLEAN AS $$
DECLARE
    user_plan TEXT;
    max_allowed INTEGER;
    current_count INTEGER;
BEGIN
    SELECT plan INTO user_plan FROM profiles WHERE id = auth.uid()::text;
    IF user_plan IS NULL THEN RETURN false; END IF;
    IF user_plan = 'enterprise' THEN RETURN true; END IF;
    IF user_plan = 'pro' THEN max_allowed := 50; ELSE max_allowed := 3; END IF;
    SELECT COUNT(*) INTO current_count FROM contracts
    WHERE owner_id = auth.uid()::text AND status != 'rejected';
    RETURN current_count < max_allowed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP POLICY IF EXISTS "Users can create their own contracts" ON contracts;
CREATE POLICY "Users can create their own contracts"
  ON contracts FOR INSERT
  WITH CHECK (auth.uid()::text = owner_id AND public.can_create_contract());

-- 4. IN-APP NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES profiles(id),
  type TEXT NOT NULL CHECK (type IN ('plan_expiring', 'plan_expired', 'plan_upgraded', 'payment_approved', 'payment_rejected')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "System can insert notifications" ON notifications;
CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

-- 5. AUTO-CREATE NOTIFICATION WHEN PAYMENT IS APPROVED/REJECTED
CREATE OR REPLACE FUNCTION public.notify_payment_update()
RETURNS TRIGGER AS $$
DECLARE
    v_profile_name TEXT;
BEGIN
    IF NEW.status = 'approved' AND OLD.status = 'pending' THEN
        INSERT INTO notifications (user_id, type, title, message)
        VALUES (
            NEW.user_id,
            'payment_approved',
            'Pagamento aprovado',
            'O teu plano ' || NEW.plan || ' foi ativado. Já podes usar todas as funcionalidades.'
        );
    ELSIF NEW.status = 'rejected' AND OLD.status = 'pending' THEN
        INSERT INTO notifications (user_id, type, title, message)
        VALUES (
            NEW.user_id,
            'payment_rejected',
            'Pagamento rejeitado',
            'O teu pedido de ' || NEW.plan || ' foi rejeitado. Contacta o administrador para mais informações.'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_payment_update ON payment_requests;
CREATE TRIGGER trg_notify_payment_update
  AFTER UPDATE OF status ON payment_requests
  FOR EACH ROW
  WHEN (OLD.status = 'pending' AND NEW.status IN ('approved', 'rejected'))
  EXECUTE FUNCTION public.notify_payment_update();
