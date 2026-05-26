-- Ver o tipo atual das colunas
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('profiles', 'contracts', 'audit_logs', 'meeting_notes')
AND column_name IN ('id', 'owner_id', 'user_id', 'author_id')
ORDER BY table_name, column_name;

-- Ver políticas RLS ativas
SELECT tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('profiles', 'contracts', 'contract_versions', 'meeting_notes', 'audit_logs');
