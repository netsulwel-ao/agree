/**
 * apply-migration.mjs
 *
 * Executa uma migração na base de dados real. O `supabase db push` não serve:
 * o IP desta máquina não está no allow_list do pooler. Passamos por uma Edge
 * Function temporária (migrate_tmp), que corre com service role e chega ao
 * Postgres sem essa restrição.
 *
 *   node scripts/apply-migration.mjs <caminho/da/migracao.sql>
 *
 * A Edge Function e os ficheiros .bak são temporários e devem ser removidos
 * depois de aplicada a migração.
 */

import { readFile } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const MIGRATION =
  process.argv[2] ?? 'supabase/migrations/20261002000000_clients_company_scope.sql';

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
console.log(`a aplicar ${MIGRATION}\n`);

const res = await fetch(`${url.replace('.supabase.co', '.functions.supabase.co')}/functions/v1/migrate_tmp`, {
  method: 'POST',
  headers: {
    apikey: fnKey,
    Authorization: `Bearer ${fnKey}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ sql }),
});

console.log(`\nHTTP ${res.status}`);
console.log(await res.text());
