import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import * as readline from 'readline';
import ws from 'ws';

dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const supabaseUrl = process.env.SUPABASE_URL;
// We need the Service Role Key to create users administratively
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error('❌ Erro: SUPABASE_URL não encontrado no arquivo .env');
  process.exit(1);
}

if (!supabaseServiceKey) {
  console.error('❌ Erro: SUPABASE_SERVICE_ROLE_KEY não encontrado no arquivo .env.');
  console.error('Para criar um usuário admin, você precisa da "Service Role Key" (que tem permissões de administrador).');
  console.error('Por favor, adicione SUPABASE_SERVICE_ROLE_KEY no seu arquivo .env e tente novamente.');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  realtime: {
    transport: ws
  }
});

async function createAdminUser() {
  console.log('--- Criação de Usuário Admin ---');
  
  rl.question('Email do admin: ', async (email) => {
    rl.question('Senha do admin (mínimo 6 caracteres): ', async (password) => {
      rl.question('Nome completo: ', async (name) => {
        
        console.log(`\nCriando usuário ${email}...`);
        
        try {
          // 1. Create the user in Supabase Auth
          const { data, error } = await supabaseAdmin.auth.admin.createUser({
            email: email,
            password: password,
            email_confirm: true, // Auto confirm email
            user_metadata: { full_name: name, role: 'admin' }
          });

          if (error) {
            console.error('❌ Erro ao criar usuário na Autenticação:', error.message);
            rl.close();
            return;
          }

          console.log('✅ Usuário criado na Autenticação com sucesso!');
          const userId = data.user.id;

          // 2. Add the user to the profiles table
          const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .upsert({
              id: userId,
              email: email,
              name: name || 'Admin',
              role: 'admin'
            });

          if (profileError) {
            console.error('⚠️ Aviso: Usuário criado, mas houve um erro ao adicionar no perfil:', profileError.message);
          } else {
            console.log('✅ Perfil de administrador configurado com sucesso!');
          }

          console.log('\n✨ Concluído! Você já pode fazer login com as credenciais fornecidas no sistema.');
          
        } catch (err) {
          console.error('❌ Erro inesperado:', err);
        } finally {
          rl.close();
        }
      });
    });
  });
}

createAdminUser();
