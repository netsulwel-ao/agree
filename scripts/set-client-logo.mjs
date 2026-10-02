/**
 * set-client-logo.mjs
 *
 * Preenche o logo_url de um cliente OAuth já registado. Serve para o ecrã de
 * consentimento mostrar o logótipo oficial em vez da inicial do nome.
 *
 *   node scripts/set-client-logo.mjs <client_id> <logo_url>
 *
 * Não altera o client_secret nem os redirect_uris, ao contrário do
 * register-oauth-client.mjs, que cria um cliente novo.
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error(
    'Faltam VITE_SUPABASE_URL e a chave do Supabase no .env.local.\n' +
      'A tabela oauth_clients tem RLS ligado, por isso é preciso a service role.',
  );
  process.exit(1);
}

const [clientId, logoUrl] = process.argv.slice(2);

if (!clientId || !logoUrl) {
  console.error('Uso: node scripts/set-client-logo.mjs <client_id> <logo_url>');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const { data, error } = await supabase
  .from('oauth_clients')
  .update({ logo_url: logoUrl })
  .eq('client_id', clientId)
  .select('client_id, name, logo_url')
  .single();

if (error) {
  console.error('Erro ao actualizar o logótipo:', error.message);
  process.exit(1);
}

console.log(`\n✅ Logótipo actualizado para ${data.name} (${data.client_id}).\n`);
