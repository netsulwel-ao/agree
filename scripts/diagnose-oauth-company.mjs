/**
 * diagnose-oauth-company.mjs
 *
 * Verifica por que o selector de condominio nao aparece no ecra de
 * consentimento. O selector so e desenhado quando a lista de companies vem
 * nao vazia, e ela depende de duas consultas: profiles.company_id e
 * companies.is_active.
 *
 *   node scripts/diagnose-oauth-company.mjs [email]
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Faltam VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local');
  process.exit(1);
}

const db = createClient(SUPABASE_URL, SERVICE_KEY);

console.log('\n═══ companies ═══');
const { data: companies, error: cErr } = await db
  .from('companies')
  .select('id, name, slug, is_active')
  .order('name');

if (cErr) {
  console.error('Erro:', cErr.message);
  process.exit(1);
}

console.log(`total: ${companies.length}`);
for (const c of companies) {
  console.log(`  ${c.is_active ? 'ativa ' : 'INACTIVA'} | ${c.slug ?? '-'} | ${c.name} | ${c.id}`);
}

const active = companies.filter((c) => c.is_active);
console.log(`\nativas: ${active.length}`);

console.log('\n═══ profiles ═══');
const { data: profiles, error: pErr } = await db
  .from('profiles')
  .select('id, email, company_id, is_super_admin');

if (pErr) {
  console.error('Erro:', pErr.message);
  process.exit(1);
}

console.log(`total: ${profiles.length}`);
for (const p of profiles) {
  const match = companies.find((c) => c.id === p.company_id);
  const verdict = !p.company_id
    ? 'SEM company_id'
    : !match
      ? 'company_id NAO EXISTE em companies'
      : !match.is_active
        ? 'company INACTIVA'
        : 'ok';
  console.log(
    `  ${p.email ?? p.id} | super_admin=${p.is_super_admin} | ${verdict}`,
  );
}

console.log('\n═══ o que o ecra de consentimento ia mostrar ═══');
console.log(`companies visiveis para um utilizador normal: ${
  profiles.filter((p) => !p.is_super_admin).filter((p) =>
    active.some((c) => c.id === p.company_id),
  ).length === 0
    ? '0 -> selector NAO aparece'
    : 'pelo menos 1 -> selector aparece'
}`);
console.log('');