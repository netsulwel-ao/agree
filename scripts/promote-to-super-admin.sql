-- ============================================
-- Script para promover usuário a Super Admin
-- ============================================

-- Promover o usuário agreesup@netsulwel.tech a Super Admin
UPDATE profiles
SET 
  role = 'admin',
  plan = 'enterprise',
  is_super_admin = true,
  is_blocked = false,
  onboarding_completed = true
WHERE email = 'agreesup@netsulwel.tech';

-- Verificar o resultado
SELECT 
  id,
  email,
  role,
  plan,
  is_super_admin,
  is_blocked,
  onboarding_completed
FROM profiles
WHERE email = 'agreesup@netsulwel.tech';
