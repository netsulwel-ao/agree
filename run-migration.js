import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Configura VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const sql = readFileSync('migration-signatures.sql', 'utf8');
const statements = sql
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--'));

async function run() {
  console.log('🚀 A executar migration-signatures.sql...\n');
  for (const stmt of statements) {
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: stmt + ';' });
      if (error) {
        if (error.message.includes('already exists')) {
          console.log(`⏭️  Já existe: ${stmt.slice(0, 60)}...`);
        } else {
          console.error(`❌ Erro:`, error.message);
          console.log(`   Comando: ${stmt.slice(0, 120)}`);
        }
      } else {
        console.log(`✅ ${stmt.slice(0, 60)}...`);
      }
    } catch (err) {
      console.warn(`⚠️  ${err.message}`);
    }
  }
  console.log('\n✅ Migration concluída!');
  console.log('💡 Se houver erros, executa diretamente no SQL Editor do Supabase.');
}

run().catch(console.error);
