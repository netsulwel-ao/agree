-- ============================================
-- Script para verificar usuário com problema de login
-- ============================================

-- Verificar se o usuário existe em auth.users
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users
WHERE id = '899c27a9-c509-4b8a-b711-2093ce97c226';

-- Verificar se o profile existe
SELECT 
  id,
  email,
  role,
  plan,
  is_blocked,
  is_super_admin,
  onboarding_completed,
  company_id
FROM profiles
WHERE id = '899c27a9-c509-4b8a-b711-2093ce97c226';

-- Se o profile não existir, criar um
INSERT INTO profiles (id, email, role, plan, is_blocked, onboarding_completed)
SELECT 
  au.id,
  au.email,
  'user',
  'free',
  false,
  false
FROM auth.users au
WHERE au.id = '899c27a9-c509-4b8a-b711-2093ce97c226'
AND NOT EXISTS (
  SELECT 1 FROM profiles p WHERE p.id = au.id
);

-- Verificar novamente após a correção
SELECT 
  id,
  email,
  role,
  plan,
  is_blocked,
  onboarding_completed
FROM profiles
WHERE id = '899c27a9-c509-4b8a-b711-2093ce97c226';
