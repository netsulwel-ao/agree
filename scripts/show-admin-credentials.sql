-- Mostrar o último admin criado e gerar uma nova senha
SELECT 
  '========================================' as info
UNION ALL
SELECT 'ADMIN CRIADO COM SUCESSO!'
UNION ALL
SELECT '========================================'
UNION ALL
SELECT 'Email: ' || email
FROM profiles 
WHERE role = 'admin' 
ORDER BY created_at DESC 
LIMIT 1;
