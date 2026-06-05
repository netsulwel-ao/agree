// Public API — Supabase Edge Function
// Deploy: supabase functions deploy api --no-verify-jwt

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface ApiKeyRow {
  id: string;
  user_id: string;
  key_hash: string;
  scopes: string[];
  is_active: boolean;
  rate_limit: number;
}

// ─── Rate limit in-memory store ────────────────────────
// Chave: api_key_id → { count, windowStart }
// Resetado quando a janela de 60 s expira.
const rateLimitStore = new Map<string, { count: number; windowStart: number }>();

function checkRateLimit(keyId: string, limitPerMinute: number): boolean {
  const now = Date.now();
  const WINDOW_MS = 60_000;

  const entry = rateLimitStore.get(keyId);

  if (!entry || now - entry.windowStart >= WINDOW_MS) {
    // Nova janela
    rateLimitStore.set(keyId, { count: 1, windowStart: now });
    return true;
  }

  if (entry.count >= limitPerMinute) {
    return false; // limite atingido
  }

  entry.count += 1;
  return true;
}

// ─── Auth helper ───────────────────────────────────────

async function authenticate(req: Request): Promise<{ userId: string; scopes: string[]; keyId: string; rateLimit: number } | null> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const key = authHeader.slice(7);
  const prefix = key.slice(0, 8);
  if (key.length < 16) return null;

  // Hash the key (SHA-256)
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const keyHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  const { data: row } = await supabase
    .from('api_keys')
    .select('id, user_id, key_hash, scopes, is_active, rate_limit')
    .eq('key_prefix', prefix)
    .single();

  if (!row || !row.is_active || row.key_hash !== keyHash) return null;

  // Update last_used (fire and forget — não bloqueia a resposta)
  supabase.from('api_keys').update({ last_used_at: new Date().toISOString() }).eq('id', row.id);

  return { userId: row.user_id, scopes: row.scopes, keyId: row.id, rateLimit: row.rate_limit ?? 60 };
}

// ─── Response helpers ──────────────────────────────────

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}

function error(message: string, status = 400) {
  return json({ error: message }, status);
}

// ─── Route handlers ────────────────────────────────────

async function handleListContracts(userId: string, url: URL) {
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
  const from = (page - 1) * limit;
  const { data, count } = await supabase
    .from('contracts')
    .select('*', { count: 'exact' })
    .eq('owner_id', userId)
    .order('created_at', { ascending: false })
    .range(from, from + limit - 1);
  return json({ data, total: count, page, limit });
}

async function handleGetContract(userId: string, id: string) {
  const { data } = await supabase.from('contracts').select('*').eq('id', id).eq('owner_id', userId).single();
  if (!data) return error('Contract not found', 404);
  return json({ data });
}

async function handleCreateContract(userId: string, body: any) {
  const { data, error: err } = await supabase.from('contracts').insert({
    title: body.title,
    description: body.description || '',
    content: body.content || '',
    value: body.value || 0,
    currency: body.currency || 'AOA',
    status: 'draft',
    owner_id: userId,
    start_date: body.start_date || null,
    end_date: body.end_date || null,
    tags: body.tags || [],
    client_id: body.client_id || null,
  }).select().single();
  if (err) return error(err.message);
  return json({ data }, 201);
}

async function handleListInvoices(userId: string, url: URL) {
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
  const from = (page - 1) * limit;
  const { data, count } = await supabase
    .from('invoices')
    .select('*', { count: 'exact' })
    .eq('owner_id', userId)
    .order('created_at', { ascending: false })
    .range(from, from + limit - 1);
  return json({ data, total: count, page, limit });
}

async function handleListClients(userId: string, url: URL) {
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
  const from = (page - 1) * limit;
  const { data, count } = await supabase
    .from('clients')
    .select('*', { count: 'exact' })
    .eq('owner_id', userId)
    .order('created_at', { ascending: false })
    .range(from, from + limit - 1);
  return json({ data, total: count, page, limit });
}

async function handleHealth() {
  return json({ status: 'ok', version: '1.0.0', timestamp: new Date().toISOString() });
}

// ─── Router ────────────────────────────────────────────

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE', 'Access-Control-Allow-Headers': 'authorization,content-type' } });
  }

  const url = new URL(req.url);
  const path = url.pathname.replace('/api', '');

  // Health check — no auth needed
  if (path === '/health' && req.method === 'GET') return handleHealth();

  // Authenticate
  const auth = await authenticate(req);
  if (!auth) return error('Unauthorized', 401);

  // Rate limiting — verifica o limite por minuto da API key
  if (!checkRateLimit(auth.keyId, auth.rateLimit)) {
    return new Response(JSON.stringify({ error: 'Rate limit exceeded. Tente novamente em 60 segundos.' }), {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Retry-After': '60',
      },
    });
  }

  // Check scope
  const method = req.method;

  try {
    // Contracts
    if (path === '/contracts' && method === 'GET' && auth.scopes.includes('contracts:read')) return handleListContracts(auth.userId, url);
    if (path === '/contracts' && method === 'POST' && auth.scopes.includes('contracts:write')) {
      const body = await req.json();
      return handleCreateContract(auth.userId, body);
    }
    if (path.match(/^\/contracts\/[a-f0-9-]+$/) && method === 'GET' && auth.scopes.includes('contracts:read')) {
      return handleGetContract(auth.userId, path.split('/')[2]);
    }

    // Invoices
    if (path === '/invoices' && method === 'GET' && auth.scopes.includes('invoices:read')) return handleListInvoices(auth.userId, url);

    // Clients
    if (path === '/clients' && method === 'GET' && auth.scopes.includes('clients:read')) return handleListClients(auth.userId, url);

    return error('Not found', 404);
  } catch (e: any) {
    return error(e.message || 'Internal error', 500);
  }
});
