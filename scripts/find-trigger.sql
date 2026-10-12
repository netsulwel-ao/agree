-- Encontrar triggers na tabela contracts
SELECT 
  t.trigger_name,
  t.event_manipulation,
  t.action_timing,
  p.prosrc as function_body
FROM information_schema.triggers t
JOIN pg_proc p ON p.proname = substring(t.action_statement FROM 'EXECUTE FUNCTION (.+)\(\)')
WHERE t.event_object_table = 'contracts'
ORDER BY t.trigger_name;

-- Alternativa mais simples
SELECT tgname, tgtype, proname 
FROM pg_trigger 
JOIN pg_proc ON pg_proc.oid = pg_trigger.tgfoid
JOIN pg_class ON pg_class.oid = pg_trigger.tgrelid
WHERE pg_class.relname = 'contracts';
