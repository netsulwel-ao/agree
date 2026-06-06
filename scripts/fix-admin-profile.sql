-- ============================================
-- Script para verificar e corrigir profile do admin
-- ============================================

-- Verificar se o usuário existe em auth.users mas não tem profile
SELECT 
  au.id,
  au.email,
  au.created_at,
  p.id as profile_id,
  p.role,
  p.is_blocked
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE au.email = 'admin_259f7864@agree.ao';

-- Se o profile não existir, criar
INSERT INTO profiles (id, email, role, plan, is_blocked, onboarding_completed)
SELECT 
  au.id,
  au.email,
  'admin',
  'enterprise',
  false,
  true
FROM auth.users au
WHERE au.email = 'admin_259f7864@agree.ao'
AND NOT EXISTS (
  SELECT 1 FROM profiles p WHERE p.id = au.id
);

-- Verificar novamente após a correção
SELECT 
  au.id,
  au.email,
  p.id as profile_id,
  p.role,
  p.plan,
  p.is_blocked,
  p.onboarding_completed
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE au.email = 'admin_259f7864@agree.ao';
