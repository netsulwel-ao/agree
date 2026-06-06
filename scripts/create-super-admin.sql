-- ============================================
-- Script para Criar Super Admin
-- Cria um usuário Super Admin com email agree@netsulwel.tech
-- ============================================

DO $$
DECLARE
  super_admin_email TEXT := 'agree@netsulwel.tech';
  super_admin_password TEXT := 'Netsulwel@2024';
  user_id UUID;
BEGIN
  -- Criar utilizador no Supabase Auth
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_user_meta_data)
  VALUES (
    gen_random_uuid(),
    super_admin_email,
    crypt(super_admin_password, gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"name": "Super Admin", "is_super_admin": true}'::jsonb
  )
  RETURNING id INTO user_id;
  
  -- Actualizar profile com role admin e is_super_admin = true (trigger já criou o profile)
  UPDATE profiles 
  SET 
    role = 'admin',
    plan = 'enterprise',
    is_blocked = false,
    onboarding_completed = true,
    is_super_admin = true
  WHERE id = user_id;
  
  -- Mostrar credenciais
  RAISE NOTICE '========================================';
  RAISE NOTICE 'SUPER ADMIN CRIADO COM SUCESSO!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Email: %', super_admin_email;
  RAISE NOTICE 'Senha: %', super_admin_password;
  RAISE NOTICE '========================================';
  RAISE NOTICE 'GUARDA ESTAS CREDENCIAIS!';
  RAISE NOTICE '========================================';
END $$;

-- Mostrar o Super Admin criado
SELECT 
  p.id,
  p.email,
  p.role,
  p.plan,
  p.is_super_admin,
  p.created_at
FROM profiles p
WHERE p.email = 'agree@netsulwel.tech';
