/**
 * register-oauth-client.mjs
 *
 * Regista o NetsulCondo como aplicação cliente do Agree e imprime as
 * credenciais para colar no .env.local do NetsulCondo.
 *
 *   node scripts/register-oauth-client.mjs
 *
 * O client_secret é gerado aqui e guardado apenas como SHA-256. Se o perder,
 * tem de voltar a correr este script — não há como recuperá-lo.
 *
 * Variáveis de ambiente necessárias (define-as antes de correr):
 *   VITE_SUPABASE_URL
 *   VITE_SUPABASE_ANON_KEY   (ou SUPABASE_SERVICE_ROLE_KEY)
 */

import { createClient } from '@supabase/supabase-js';
import { createHash, randomBytes } from 'node:crypto';
import { config } from 'dotenv';

config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error(
    'Faltam VITE_SUPABASE_URL e a chave do Supabase.\n' +
      'Exemplo (PowerShell):\n' +
      '  $env:VITE_SUPABASE_URL="https://xxx.supabase.co"\n' +
      '  $env:VITE_SUPABASE_ANON_KEY="eyJ..."\n' +
      '  node scripts/register-oauth-client.mjs'
  );
  process.exit(1);
}

// ─── Credenciais ─────────────────────────────────────────────────────────────

const clientId = `netsulcondo_${randomBytes(8).toString('hex')}`;
const clientSecret = randomBytes(32).toString('base64url');
const clientSecretHash = createHash('sha256').update(clientSecret).digest('hex');
const clientSecretPrefix = clientSecret.slice(0, 8);

// Comparação EXACTA no Agree (oauth/index.ts): o redirect_uri que o cliente
// enviar tem de ser byte-a-byte igual a um destes. Por isso sem barra final.
// O domínio de produção tem de bater com NEXT_PUBLIC_APP_URL no NetsulCondo.
const APP_URLS = [
  'http://localhost:3001',        // desenvolvimento local
  'https://condo2.vercel.app',    // produção (deploy Vercel)
];

const redirectUris = APP_URLS.map((base) => `${base.replace(/\/+$/, '')}/api/agree/callback`);

const allowedScopes = [
  'company:read',
  'company:write',
  'contracts:read',
  'clients:read',
  'clients:write',
];

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ─── Registo ─────────────────────────────────────────────────────────────────

const { data, error } = await supabase
  .from('oauth_clients')
  .insert({
    client_id: clientId,
    client_secret_hash: clientSecretHash,
    client_secret_prefix: clientSecretPrefix,
    name: 'NetsulCondo',
    description:
      'Gestão de condomínios. Sincroniza contratos e fornecedores com o Agree.',
    // Logótipo oficial do NetsulCondo, servido pelo próprio site. É este que
    // aparece no ecrã de consentimento do Agree.
    logo_url: 'https://condo2.vercel.app/simbolo2.svg',
    redirect_uris: redirectUris,
    allowed_scopes: allowedScopes,
    is_active: true,
  })
  .select('client_id, name, created_at')
  .single();

if (error) {
  console.error('Erro ao registar a aplicação cliente:', error.message);
  process.exit(1);
}

// ─── Output ──────────────────────────────────────────────────────────────────

console.log('\n✅ NetsulCondo registado como aplicação cliente do Agree.\n');
console.log('   client_id     :', data.client_id);
console.log('   criado em     :', data.created_at);
console.log('   redirect_uris :', redirectUris.join(', '));
console.log('   scopes        :', allowedScopes.join(', '));
console.log('\n─── Cola isto no .env.local do NetsulCondo ───\n');
console.log(`AGREE_CLIENT_ID=${clientId}`);
console.log(`AGREE_CLIENT_SECRET=${clientSecret}`);
console.log('\n⚠️  O client_secret só aparece agora. Guarde-o — não é recuperável.\n');
