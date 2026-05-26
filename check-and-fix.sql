-- Verificar tipos das colunas
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('profiles', 'contracts', 'audit_logs', 'meeting_notes')
AND column_name IN ('id', 'owner_id', 'user_id', 'author_id')
ORDER BY table_name, column_name;

-- Verificar políticas existentes
SELECT tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('profiles', 'contracts', 'contract_versions', 'meeting_notes', 'audit_logs');

-- Verificar se RLS está ativo
SELECT relname, relrowsecurity 
FROM pg_class 
WHERE relname IN ('profiles', 'contracts', 'contract_versions', 'meeting_notes', 'audit_logs');
