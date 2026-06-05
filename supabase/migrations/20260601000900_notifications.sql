-- Add new notification types to existing CHECK constraint
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
  CHECK (type IN (
    'plan_expiring', 'plan_expired', 'plan_upgraded',
    'payment_approved', 'payment_rejected',
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
  user_id TEXT NOT NULL REFERENCES profiles(id) UNIQUE,
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
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

CREATE INDEX IF NOT EXISTS idx_notif_prefs_user ON notification_preferences(user_id);
