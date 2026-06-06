-- ============================================
-- Script para Promover Usuário a Super Admin
-- Use este script para promover um usuário específico a Super Admin
-- ============================================

-- Substitua pelo email do usuário que deseja promover
DO $$
DECLARE
  user_email TEXT := 'admin_259f7864@agree.ao'; -- ALTERE ESTE EMAIL
  user_id UUID;
BEGIN
  -- Buscar o ID do usuário
  SELECT id INTO user_id
  FROM profiles
  WHERE email = user_email;
  
  IF user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário com email % não encontrado', user_email;
  END IF;
  
  -- Promover a Super Admin
  UPDATE profiles
  SET is_super_admin = true
  WHERE id = user_id;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'USUÁRIO PROMOVIDO A SUPER ADMIN!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Email: %', user_email;
  RAISE NOTICE 'ID: %', user_id;
  RAISE NOTICE '========================================';
END $$;

-- Mostrar o Super Admin
SELECT 
  id,
  email,
  role,
  is_super_admin,
  created_at
FROM profiles
WHERE is_super_admin = true;
