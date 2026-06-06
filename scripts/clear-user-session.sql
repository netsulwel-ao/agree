-- ============================================
-- Script para limpar sessão do usuário
-- Isso força o logout do usuário no frontend
-- ============================================

-- Limpar todas as sessões do usuário
DELETE FROM auth.sessions
WHERE user_id = '899c27a9-c509-4b8a-b711-2093ce97c226';

-- Verificar se foi limpo
SELECT 
  'Sessões limpas para o usuário 899c27a9-c509-4b8a-b711-2093ce97c226' AS status;
