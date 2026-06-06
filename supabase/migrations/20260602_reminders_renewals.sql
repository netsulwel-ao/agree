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
