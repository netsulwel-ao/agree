-- ============================================
-- Script para Criar Admin Aleatório
-- Gera email e senha aleatórios e cria um utilizador admin
-- ============================================

-- Gerar email aleatório
DO $$
DECLARE
  random_email TEXT;
  random_password TEXT;
  user_id UUID;
BEGIN
  -- Gerar email aleatório
  random_email := 'admin_' || substr(md5(random()::text), 1, 8) || '@agree.ao';
  
  -- Gerar senha aleatória (16 caracteres)
  random_password := substr(md5(random()::text), 1, 16);
  
  -- Criar utilizador no Supabase Auth
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_user_meta_data)
  VALUES (
    gen_random_uuid(),
    random_email,
    crypt(random_password, gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"name": "Admin Temporário"}'::jsonb
  )
  RETURNING id INTO user_id;
  
  -- Actualizar profile com role admin (trigger já criou o profile)
  UPDATE profiles 
  SET 
    role = 'admin',
    plan = 'enterprise',
    is_blocked = false,
    onboarding_completed = true
  WHERE id = user_id;
  
  -- Guardar credenciais numa tabela temporária para poder mostrar
  DROP TABLE IF EXISTS temp_admin_credentials;
  CREATE TEMP TABLE temp_admin_credentials (email TEXT, password TEXT);
  INSERT INTO temp_admin_credentials VALUES (random_email, random_password);
END $$;

-- Mostrar as credenciais
SELECT '========================================' as info;
SELECT 'ADMIN CRIADO COM SUCESSO!' as info;
SELECT '========================================' as info;
SELECT email as "EMAIL", password as "SENHA" FROM temp_admin_credentials;
SELECT '========================================' as info;
SELECT 'GUARDA ESTAS CREDENCIAIS!' as info;
SELECT '========================================' as info;

-- Mostrar o admin criado
SELECT 
  p.id,
  p.email,
  p.role,
  p.plan,
  p.created_at
FROM profiles p
WHERE p.role = 'admin'
ORDER BY p.created_at DESC
LIMIT 1;
