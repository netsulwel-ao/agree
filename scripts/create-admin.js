// Script para criar admin usando a API do Supabase
// Uso: node scripts/create-admin.js
// Requer: SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env

require('dotenv').config({ path: '../.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createAdmin() {
  try {
    // Gerar email e senha aleatórios
    const randomSuffix = Math.random().toString(36).substring(2, 10);
    const email = `admin_${randomSuffix}@agree.ao`;
    const password = Math.random().toString(36).substring(2, 18);

    console.log('========================================');
    console.log('A criar admin...');
    console.log('========================================');

    // Criar usuário no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name: 'Admin Temporário'
      }
    });

    if (authError) {
      console.error('Erro ao criar usuário no Supabase Auth:', authError);
      throw authError;
    }

    const userId = authData.user.id;

    // Atualizar profile com role admin
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        role: 'admin',
        plan: 'enterprise',
        is_blocked: false,
        onboarding_completed: true
      })
      .eq('id', userId);

    if (profileError) {
      console.error('Erro ao atualizar profile:', profileError);
      throw profileError;
    }

    console.log('========================================');
    console.log('ADMIN CRIADO COM SUCESSO!');
    console.log('========================================');
    console.log(`Email: ${email}`);
    console.log(`Senha: ${password}`);
    console.log('========================================');
    console.log('GUARDA ESTAS CREDENCIAIS!');
    console.log('========================================');

    // Mostrar o admin criado
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email, role, plan, created_at')
      .eq('id', userId)
      .single();

    console.log('\nDados do profile:');
    console.log(profile);

  } catch (error) {
    console.error('Erro ao criar admin:', error);
    process.exit(1);
  }
}

createAdmin();
