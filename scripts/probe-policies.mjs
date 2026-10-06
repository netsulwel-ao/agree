/**
 * probe-policies.mjs
 *
 * O probe-schema só confirma colunas. Para as policies de RLS é preciso
 * perguntar ao catálogo do Postgres, que o PostgREST não expõe — daí este
 * script, que usa uma função RPC se existir.
 *
 * Diagnóstico: imprime as policies de clients e contracts se houver uma forma
 * de as ler. Sem tabela de catálogo exposta, diz isso em vez de falhar.
 *
 *   node scripts/probe-policies.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const db = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

console.log('\n═══ policies de clients / contracts ═══\n');

// Tenta uma RPC que costume existir em projectos com utilitários de admin.
const rpcNames = ['exec_sql', 'execute_sql', 'run_sql', 'query'];

let gotPolicies = false;

for (const fn of rpcNames) {
  const { error } = await db.rpc(fn, { sql: 'SELECT 1' });
  if (!error) {
    console.log(`  RPC "${fn}" existe — a ler pg_policies:`);
    const { data, error: e2 } = await db.rpc(fn, {
      sql: "SELECT tablename, policyname, cmd, qual FROM pg_policies WHERE tablename IN ('clients','contracts') ORDER BY tablename, policyname;",
    });
    if (!e2 && data) {
      for (const row of data) {
        console.log(`\n  [${row.tablename}] ${row.policyname} (${row.cmd})`);
        console.log(`     ${String(row.qual).replace(/\s+/g, ' ')}`);
      }
      gotPolicies = true;
    } else {
      console.log(`     mas a query falhou: ${e2?.message}`);
    }
    break;
  }
}

if (!gotPolicies) {
  console.log('  Não há RPC de SQL genérico exposta.');
  console.log('  Para ver as policies, corre no SQL Editor do Supabase:');
  console.log('');
  console.log("    SELECT tablename, policyname, cmd FROM pg_policies");
  console.log("    WHERE tablename IN ('clients','contracts') ORDER BY tablename;");
}

console.log('');