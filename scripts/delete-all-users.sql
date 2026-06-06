-- ============================================
-- Script para Apagar Todos os Utilizadores
-- ATENÇÃO: Este script apaga TODOS os utilizadores do auth.users
-- ============================================

-- Apagar todos os utilizadores do auth.users
-- Nota: Isto também apaga os profiles automaticamente devido ao ON DELETE CASCADE
DELETE FROM auth.users;

-- Confirmar
SELECT 'Todos os utilizadores foram apagados!' as status;
SELECT COUNT(*) as usuarios_restantes FROM auth.users;
