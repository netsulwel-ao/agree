-- ============================================
-- Script para Verificar Super Admin
-- ============================================

SELECT
  p.id,
  p.email,
  p.role,
  p.plan,
  p.is_super_admin,
  p.is_blocked,
  p.onboarding_completed,
  p.created_at
FROM profiles p
WHERE p.email = 'agree@netsulwel.tech';
