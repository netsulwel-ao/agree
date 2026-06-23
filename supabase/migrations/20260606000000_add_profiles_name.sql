-- Add missing name column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS name TEXT;

-- Add company_id if missing
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company_id UUID;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT false;

-- Trigger: copy name from user_metadata when profile is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role, plan)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'name',
    'user',
    'free'
  );
  RETURN NEW;
EXCEPTION WHEN unique_violation THEN
  -- Profile already exists (e.g. created manually)
  UPDATE public.profiles SET
    email = COALESCE(profiles.email, NEW.email),
    name = COALESCE(profiles.name, NEW.raw_user_meta_data ->> 'name')
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;
