-- ============================================
-- Script para deletar usuário problemático e preparar para recriação via API
-- ============================================

-- Deletar o usuário problemático
DELETE FROM profiles WHERE id = '59cef0fa-2692-496b-85bb-764b3f382f01';
DELETE FROM auth.users WHERE id = '59cef0fa-2692-496b-85bb-764b3f382f01';

-- Verificar se foi deletado
SELECT 
  'Usuário deletado com sucesso' AS status;
