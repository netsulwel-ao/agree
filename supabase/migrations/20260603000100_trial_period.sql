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
