-- Criar admin e mostrar credenciais
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
  
  -- Criar tabela temporária para guardar credenciais
  DROP TABLE IF EXISTS temp_new_admin;
  CREATE TEMP TABLE temp_new_admin (email TEXT, password TEXT);
  
  -- Guardar credenciais
  INSERT INTO temp_new_admin VALUES (random_email, random_password);
  
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
  
  -- Actualizar profile com role admin
  UPDATE profiles 
  SET 
    role = 'admin',
    plan = 'enterprise',
    is_blocked = false,
    onboarding_completed = true
  WHERE id = user_id;
END $$;

-- Mostrar credenciais
SELECT '========================================' AS info
UNION ALL
SELECT 'ADMIN CRIADO COM SUCESSO!'
UNION ALL
SELECT '========================================'
UNION ALL
SELECT 'Email: ' || email AS info FROM temp_new_admin
UNION ALL
SELECT 'Senha: ' || password AS info FROM temp_new_admin
UNION ALL
SELECT '========================================'
UNION ALL
SELECT 'GUARDA ESTAS CREDENCIAIS!'
UNION ALL
SELECT '========================================';
