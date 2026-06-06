-- ============================================
-- Script para Resetar Banco de Dados
-- ATENÇÃO: Este script apaga TODOS os dados
-- ============================================

-- Desabilitar triggers temporariamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Apagar dados de todas as tabelas (na ordem correta para respeitar FKs)
DELETE FROM renewal_history;
DELETE FROM reminders;
DELETE FROM approval_request_approvals;
DELETE FROM approval_requests;
DELETE FROM approval_workflow_step_approvers;
DELETE FROM approval_workflow_steps;
DELETE FROM approval_workflows;
DELETE FROM invoice_line_items;
DELETE FROM invoices;
DELETE FROM contract_versions;
DELETE FROM meeting_notes;
DELETE FROM audit_logs;
DELETE FROM notifications;
DELETE FROM notification_preferences;
DELETE FROM contract_templates;
DELETE FROM contracts;
DELETE FROM clients;
DELETE FROM profiles;

-- Reabilitar trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Confirmar reset
SELECT 'Banco de dados resetado com sucesso!' as status;
