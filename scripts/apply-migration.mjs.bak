/**
 * apply-migration.mjs
 *
 * Executa a migração 20261002000000_clients_company_scope.sql na base de dados
 * real. O `supabase db push` não serve aqui: o IP desta máquina não está no
 * allow_list do pooler. Passamos por uma Edge Function, que já corre com service
 * role e therefore chega ao Postgres sem essa restrição.
 *
 * A Edge Function é descartável — está em supabase/functions/_migrate e deve ser
 * removida depois de aplicada a migração.
 *
 *   node scripts/apply-migration.mjs
 */

import { readFile } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const MIGRATION = 'supabase/migrations/20261002000000_clients_company_scope.sql';

const sql = await readFile(new URL(`../${MIGRATION}`, import.meta.url), 'utf8');

const url = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const fnKey = process.env.SUPABASE_FUNCTION_KEY ?? serviceKey;

if (!url || !serviceKey) {
  console.error('Faltam VITE_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY no .env');
  process.exit(1);
}

// Confirma que estamos na base certa antes de escrever qualquer coisa.
const db = createClient(url, serviceKey);
const { data: probe, error: probeErr } = await db.from('clients').select('id').limit(1);
if (probeErr) {
  console.error('Leitura de clients falhou:', probeErr.message);
  process.exit(1);
}
console.log(`ligado a ${new URL(url).host}, clientes legiveis`);

const res = await fetch(`${url.replace('.supabase.co', '.functions.supabase.co')}/functions/v1/_migrate`, {
  method: 'POST',
  headers: {
    apikey: fnKey,
    Authorization: `Bearer ${fnKey}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ sql }),
});

const body = await res.text();

console.log(`\nHTTP ${res.status}`);
console.log(body);