/**
 * probe-schema.mjs
 *
 * Pergunta ao PostgREST se uma coluna existe, sem partir nada: pedir uma
 * coluna inexistente devolve PGRST204, pedir uma existente devolve 200.
 *
 *   node scripts/probe-schema.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const db = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const probes = [
  ['clients', 'company_id'],
  ['clients', 'owner_id'],
  ['clients', 'category'],
  ['contracts', 'company_id'],
  ['contracts', 'owner_id'],
  ['contracts', 'client_id'],
  ['companies', 'is_active'],
  ['profiles', 'company_id'],
];

console.log('');

for (const [table, column] of probes) {
  const { data, error } = await db.from(table).select(column).limit(1);
  const exists = !error;
  console.log(`  ${exists ? 'EXISTE ' : 'AUSENTE'}  ${table}.${column}`);
  if (error) console.log(`            -> ${error.code}: ${error.message}`);
  else void data;
}

console.log('');