/**
 * oauth — Supabase Edge Function
 *
 * Authorization Server OAuth 2.0 do Agree, mais a API de recursos que as
 * aplicações externas (NetsulCondo) consomem com o access token.
 *
 * Equivalente ao que o GitHub faz dentro do Vercel: login → ecrã de
 * consentimento → "Autorizar" → redireccionamento com authorization code.
 *
 * Deploy:
 *   supabase functions deploy oauth --no-verify-jwt
 *
 * Secrets (supabase secrets set):
 *   SUPABASE_URL                 — automático
 *   SUPABASE_SERVICE_ROLE_KEY    — automático
 *   OAUTH_CODE_TTL_SECONDS       — opcional, default 600
 *   OAUTH_TOKEN_TTL_SECONDS      — opcional, default 3600
 *   OAUTH_REFRESH_TTL_SECONDS    — opcional, default 2592000 (30 dias)
 *   NETSULCONDO_APP_URL          — para redireccionar o browser após autorizar
 *
 * Rotas:
 *   GET  /health         → verificação de saúde (sem auth)
 *   POST /authorize      → emite authorization code (exige JWT do utilizador)
 *   POST /token          → troca code por access token (server-to-server)
 *   POST /revoke         → revoga um token (server-to-server)
 *   GET  /userinfo       → identidade associada ao access token
 *   GET  /company        → empresa (condomínio) autorizada
 *   POST /company        → cria/actualiza a empresa a partir do slug externo
 *   GET  /contracts      → lista contratos da empresa autorizada
 *   POST /clients        → cria/actualiza um cliente (fornecedor)
 *   GET  /connections    → consentimentos activos do utilizador
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

// ─── Configuração ────────────────────────────────────────────────────────────

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const NETSULCONDO_APP_URL = Deno.env.get('NETSULCONDO_APP_URL') ?? '';

const CODE_TTL = Number(Deno.env.get('OAUTH_CODE_TTL_SECONDS') ?? 600) * 1000;
const TOKEN_TTL = Number(Deno.env.get('OAUTH_TOKEN_TTL_SECONDS') ?? 3600) * 1000;
const REFRESH_TTL =
  Number(Deno.env.get('OAUTH_REFRESH_TTL_SECONDS') ?? 2592000) * 1000;

const VALID_STATUSES = ['draft', 'pending', 'approved', 'rejected'];

const service = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ─── Helpers de resposta ─────────────────────────────────────────────────────

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function oauthError(
  error: string,
  description: string,
  status = 400,
  redirectUri?: string,
  state?: string,
) {
  if (redirectUri) {
    const target = new URL(redirectUri);
    target.searchParams.set('error', error);
    target.searchParams.set('error_description', description);
    if (state) target.searchParams.set('state', state);
    return Response.redirect(target.toString(), 302);
  }
  return json({ error, error_description: description }, status);
}

// ─── Helpers de cripto ───────────────────────────────────────────────────────

const encoder = new TextEncoder();

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function sha256(text: string): Promise<string> {
  return toHex(await crypto.subtle.digest('SHA-256', encoder.encode(text)));
}

function base64Url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Valor opaco e aleatório para tokens e códigos. */
function randomToken(bytes = 32): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return base64Url(arr.buffer);
}

/** BASE64URL(SHA256(verifier)) — o code_challenge do PKCE com método S256. */
async function pkceChallenge(verifier: string): Promise<string> {
  return base64Url(await crypto.subtle.digest('SHA-256', encoder.encode(verifier)));
}

// ─── Verificação de tokens de utilizador (Supabase Auth) ─────────────────────

/**
 * Valida o JWT de sessão do Supabase e devolve o utilizador.
 * Usado apenas por /authorize — o ponto de entrada do fluxo, onde o browser
 * ainda está a autenticar-se no Agree.
 */
async function requireSupabaseUser(req: Request): Promise<{ id: string } | null> {
  const header = req.headers.get('authorization');
  if (!header?.startsWith('Bearer ')) return null;

  const { data, error } = await service.auth.getUser(header.slice(7).trim());
  if (error || !data.user) return null;
  return { id: data.user.id };
}

// ─── Verificação do access token ─────────────────────────────────────────────

interface TokenRow {
  id: string;
  client_id: string;
  user_id: string;
  company_id: string | null;
  scopes: string[];
  expires_at: string;
  revoked_at: string | null;
}

/**
 * Valida o Bearer access token e devolve a linha correspondente.
 * Devolve o motivo da falha para que cada rota possa responder em conformidade.
 */
async function requireAccessToken(
  req: Request,
  requiredScope?: string,
): Promise<{ token: TokenRow } | { error: string; description: string; status: number }> {
  const header = req.headers.get('authorization');
  if (!header?.startsWith('Bearer ')) {
    return {
      error: 'invalid_token',
      description: 'Token de acesso ausente. Use o header Authorization: Bearer.',
      status: 401,
    };
  }

  const raw = header.slice(7).trim();
  const hash = await sha256(raw);

  const { data, error } = await service
    .from('oauth_tokens')
    .select('id, client_id, user_id, company_id, scopes, expires_at, revoked_at')
    .eq('access_token_hash', hash)
    .maybeSingle();

  if (error) {
    return { error: 'server_error', description: error.message, status: 500 };
  }
  if (!data) {
    return {
      error: 'invalid_token',
      description: 'Token de acesso inválido.',
      status: 401,
    };
  }
  if (data.revoked_at) {
    return { error: 'invalid_token', description: 'Token revogado.', status: 401 };
  }
  if (new Date(data.expires_at).getTime() < Date.now()) {
    return { error: 'invalid_token', description: 'Token expirado.', status: 401 };
  }
  if (requiredScope && !(data.scopes as string[]).includes(requiredScope)) {
    return {
      error: 'insufficient_scope',
      description: `Este token não tem o scope "${requiredScope}".`,
      status: 403,
    };
  }

  // Actualiza last_used_at sem bloquear a resposta
  service
    .from('oauth_tokens')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', data.id)
    .then(() => {});

  return { token: data as TokenRow };
}

// ─── POST /authorize ─────────────────────────────────────────────────────────

interface AuthorizeBody {
  client_id?: string;
  redirect_uri?: string;
  scopes?: string[];
  company_id?: string;
  state?: string;
  code_challenge?: string;
  code_challenge_method?: string;
  /** false = não guardar o consentimento (o ecrã volta a aparecer sempre). */
  remember?: boolean;
}

/**
 * Valida o pedido de autorização e emite um authorization code.
 * Só valida e emite — o ecrã de consentimento vive no browser
 * (src/pages/OAuthAuthorize.tsx) e chama este endpoint quando o utilizador
 * clica em "Autorizar".
 */
async function handleAuthorize(req: Request): Promise<Response> {
  const user = await requireSupabaseUser(req);
  if (!user) {
    return oauthError('access_denied', 'Sessão inválida ou expirada.', 401);
  }

  let body: AuthorizeBody;
  try {
    body = await req.json();
  } catch {
    return oauthError('invalid_request', 'Corpo JSON inválido.', 400);
  }

  const { client_id, redirect_uri, state } = body;
  if (!client_id) return oauthError('invalid_request', 'client_id em falta.', 400);
  if (!redirect_uri) {
    return oauthError('invalid_request', 'redirect_uri em falta.', 400);
  }

  // Carrega a app cliente
  const { data: client, error: clientErr } = await service
    .from('oauth_clients')
    .select('*')
    .eq('client_id', client_id)
    .maybeSingle();

  if (clientErr) return oauthError('server_error', clientErr.message, 500);

  if (!client || !client.is_active) {
    return oauthError('invalid_client', 'Aplicação desconhecida ou inactiva.', 404);
  }

  // O redirect_uri tem de estar registado — verificar ANTES de qualquer erro
  // de domínio, para não redirigir o browser para um URI não registado.
  const uris = (client.redirect_uris as string[]) ?? [];
  if (!uris.includes(redirect_uri)) {
    return oauthError(
      'invalid_request',
      'redirect_uri não registado para esta aplicação.',
      400,
    );
  }

  // Scopes pedidos ⊆ scopes permitidos para esta app
  const requested = body.scopes ?? [];
  const allowed = (client.allowed_scopes as string[]) ?? [];
  const invalid = requested.filter((s) => !allowed.includes(s));
  if (invalid.length > 0) {
    return oauthError(
      'invalid_scope',
      `Scopes não permitidos: ${invalid.join(', ')}`,
      400,
      redirect_uri,
      state,
    );
  }

  // A empresa tem de existir, estar activa, e o utilizador tem de ter
  // acesso a ela. RLS está desligada em profiles, por isso validamos à mão.
  let companyId: string | null = null;
  if (body.company_id) {
    const { data: profile } = await service
      .from('profiles')
      .select('company_id, is_super_admin')
      .eq('id', user.id)
      .maybeSingle();

    const { data: company } = await service
      .from('companies')
      .select('id, is_active')
      .eq('id', body.company_id)
      .maybeSingle();

    if (!company || !company.is_active) {
      return oauthError(
        'invalid_request',
        'Empresa inexistente ou inactiva.',
        400,
        redirect_uri,
        state,
      );
    }

    // Super admins podem autorizar em nome de qualquer empresa
    const isSuperAdmin = Boolean(profile?.is_super_admin);
    if (profile?.company_id !== body.company_id && !isSuperAdmin) {
      return oauthError(
        'access_denied',
        'Não tem acesso a esta empresa.',
        403,
        redirect_uri,
        state,
      );
    }

    companyId = body.company_id;
  }

  // Emite o código
  const code = randomToken(32);
  const expiresAt = new Date(Date.now() + CODE_TTL).toISOString();

  const { error: insertErr } = await service.from('oauth_authorization_codes').insert({
    code,
    client_id,
    user_id: user.id,
    company_id: companyId,
    scopes: requested,
    redirect_uri,
    code_challenge: body.code_challenge ?? null,
    code_challenge_method: body.code_challenge_method ?? null,
    expires_at: expiresAt,
  });

  if (insertErr) return oauthError('server_error', insertErr.message, 500);

  // Regista o consentimento para que a página de apps ligadas o mostre e
  // para que "revogar" tenha o que apagar. Com remember=false o utilizador
  // pediu para ver o ecrã de consentimento de cada vez, por isso não gravamos.
  if (body.remember !== false) {
    await service
      .from('oauth_consents')
      .delete()
      .eq('client_id', client_id)
      .eq('user_id', user.id)
      .is('revoked_at', null);

    await service.from('oauth_consents').insert({
      client_id,
      user_id: user.id,
      company_id: companyId,
      scopes: requested,
    });
  }

  const target = new URL(redirect_uri);
  target.searchParams.set('code', code);
  if (state) target.searchParams.set('state', state);

  return json({
    redirect_to: target.toString(),
    expires_in: Math.floor(CODE_TTL / 1000),
  });
}

// ─── POST /token ─────────────────────────────────────────────────────────────

/**
 * Troca um authorization code por um access token.
 * Server-to-server: exige client_secret. Suporta também refresh_token.
 */
async function handleToken(req: Request): Promise<Response> {
  let body: {
    grant_type?: string;
    client_id?: string;
    client_secret?: string;
    code?: string;
    redirect_uri?: string;
    code_verifier?: string;
    refresh_token?: string;
  };

  try {
    body = await req.json();
  } catch {
    return oauthError('invalid_request', 'Corpo JSON inválido.', 400);
  }

  const { grant_type, client_id, client_secret } = body;
  if (!grant_type) return oauthError('invalid_request', 'grant_type em falta.', 400);
  if (!client_id) return oauthError('invalid_client', 'client_id em falta.', 401);
  if (!client_secret) {
    return oauthError('invalid_client', 'client_secret em falta.', 401);
  }

  // Autentica a app cliente
  const { data: client } = await service
    .from('oauth_clients')
    .select('*')
    .eq('client_id', client_id)
    .maybeSingle();

  if (!client || !client.is_active) {
    return oauthError('invalid_client', 'Aplicação desconhecida ou inactiva.', 401);
  }

  const secretOk = (await sha256(client_secret)) === client.client_secret_hash;
  if (!secretOk) {
    return oauthError('invalid_client', 'client_secret inválido.', 401);
  }

  if (grant_type === 'authorization_code') return exchangeCode(body, client_id);
  if (grant_type === 'refresh_token') return refreshTokens(body, client_id);

  return oauthError(
    'unsupported_grant_type',
    `grant_type "${grant_type}" não suportado.`,
  );
}

async function exchangeCode(
  body: {
    code?: string;
    redirect_uri?: string;
    code_verifier?: string;
  },
  clientId: string,
): Promise<Response> {
  if (!body.code) return oauthError('invalid_request', 'code em falta.', 400);
  if (!body.redirect_uri) {
    return oauthError('invalid_request', 'redirect_uri em falta.', 400);
  }

  const { data: codeRow, error: codeErr } = await service
    .from('oauth_authorization_codes')
    .select('*')
    .eq('code', body.code)
    .maybeSingle();

  if (codeErr) return oauthError('server_error', codeErr.message, 500);

  if (!codeRow) {
    return oauthError('invalid_grant', 'Código de autorização inválido.', 400);
  }
  if (codeRow.used_at) {
    return oauthError(
      'invalid_grant',
      'Código já utilizado. Os códigos só podem ser usados uma vez.',
      400,
    );
  }
  if (new Date(codeRow.expires_at).getTime() < Date.now()) {
    return oauthError('invalid_grant', 'Código expirado.', 400);
  }
  if (codeRow.client_id !== clientId) {
    return oauthError('invalid_grant', 'Código emitido para outra aplicação.', 400);
  }
  if (codeRow.redirect_uri !== body.redirect_uri) {
    return oauthError(
      'invalid_grant',
      'redirect_uri não corresponde ao do pedido original.',
      400,
    );
  }

  // PKCE: se o código foi emitido com challenge, o verifier tem de casar
  if (codeRow.code_challenge) {
    if (!body.code_verifier) {
      return oauthError('invalid_request', 'code_verifier em falta.', 400);
    }
    const method = codeRow.code_challenge_method ?? 'plain';
    const computed =
      method === 'S256'
        ? await pkceChallenge(body.code_verifier)
        : body.code_verifier;

    if (computed !== codeRow.code_challenge) {
      return oauthError('invalid_grant', 'code_verifier inválido.', 400);
    }
  }

  // Marca como usado (um código, uma utilização)
  const { error: useErr } = await service
    .from('oauth_authorization_codes')
    .update({ used_at: new Date().toISOString() })
    .eq('id', codeRow.id)
    .is('used_at', null);

  if (useErr) {
    return oauthError(
      'invalid_grant',
      'Código já utilizado (concurso entre pedidos).',
      400,
    );
  }

  return issueTokens(
    codeRow.user_id,
    codeRow.company_id,
    codeRow.scopes as string[],
    codeRow.client_id,
  );
}

async function refreshTokens(
  body: { refresh_token?: string },
  clientId: string,
): Promise<Response> {
  if (!body.refresh_token) {
    return oauthError('invalid_request', 'refresh_token em falta.', 400);
  }

  const hash = await sha256(body.refresh_token);
  const { data: row } = await service
    .from('oauth_tokens')
    .select('*')
    .eq('refresh_token_hash', hash)
    .maybeSingle();

  if (!row || row.revoked_at) {
    return oauthError('invalid_grant', 'refresh_token inválido ou revogado.', 400);
  }
  if (row.client_id !== clientId) {
    return oauthError('invalid_grant', 'refresh_token de outra aplicação.', 400);
  }
  if (
    row.refresh_token_expires_at &&
    new Date(row.refresh_token_expires_at).getTime() < Date.now()
  ) {
    return oauthError('invalid_grant', 'refresh_token expirado.', 400);
  }

  // Roda o refresh token: revoga o antigo, emite um novo par
  await service
    .from('oauth_tokens')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', row.id);

  return issueTokens(row.user_id, row.company_id, row.scopes as string[], clientId);
}

/** Cria um par access_token + refresh_token e devolve a resposta OAuth. */
async function issueTokens(
  userId: string,
  companyId: string | null,
  scopes: string[],
  clientId: string,
): Promise<Response> {
  const accessToken = randomToken(32);
  const refreshToken = randomToken(32);
  const now = Date.now();

  const { data: profile } = await service
    .from('profiles')
    .select('email, name')
    .eq('id', userId)
    .maybeSingle();

  const { data: company } = companyId
    ? await service
        .from('companies')
        .select('id, name, slug')
        .eq('id', companyId)
        .maybeSingle()
    : { data: null };

  const { error } = await service.from('oauth_tokens').insert({
    access_token_hash: await sha256(accessToken),
    refresh_token_hash: await sha256(refreshToken),
    client_id: clientId,
    user_id: userId,
    company_id: companyId,
    scopes,
    expires_at: new Date(now + TOKEN_TTL).toISOString(),
    refresh_token_expires_at: new Date(now + REFRESH_TTL).toISOString(),
  });

  if (error) return oauthError('server_error', error.message, 500);

  return json({
    access_token: accessToken,
    token_type: 'Bearer',
    expires_in: Math.floor(TOKEN_TTL / 1000),
    refresh_token: refreshToken,
    scope: scopes.join(' '),
    // Contexto devolvido para o NetsulCondo saber com o que está ligado
    user: { id: userId, email: profile?.email ?? null, name: profile?.name ?? null },
    company: company
      ? { id: company.id, name: company.name, slug: company.slug }
      : null,
  });
}

// ─── POST /revoke ────────────────────────────────────────────────────────────

async function handleRevoke(req: Request): Promise<Response> {
  let body: { client_id?: string; client_secret?: string; token?: string };
  try {
    body = await req.json();
  } catch {
    return oauthError('invalid_request', 'Corpo JSON inválido.', 400);
  }

  const { client_id, client_secret, token } = body;
  if (!client_id) return oauthError('invalid_client', 'client_id em falta.', 401);
  if (!client_secret) return oauthError('invalid_client', 'client_secret em falta.', 401);
  if (!token) return oauthError('invalid_request', 'token em falta.', 400);

  const { data: client } = await service
    .from('oauth_clients')
    .select('*')
    .eq('client_id', client_id)
    .maybeSingle();

  if (!client) return oauthError('invalid_client', 'Aplicação desconhecida.', 401);
  if ((await sha256(client_secret)) !== client.client_secret_hash) {
    return oauthError('invalid_client', 'client_secret inválido.', 401);
  }

  const hash = await sha256(token);

  // Descobre o token — pode ser um access token ou um refresh token
  const { data: row } = await service
    .from('oauth_tokens')
    .select('id, user_id')
    .eq('client_id', client_id)
    .or(`access_token_hash.eq.${hash},refresh_token_hash.eq.${hash}`)
    .maybeSingle();

  // RFC 7009: responder 200 mesmo que o token não exista, para não
  // revelar information about which tokens are valid.
  if (row) {
    await service
      .from('oauth_tokens')
      .update({ revoked_at: new Date().toISOString() })
      .eq('id', row.id);

    // Revoga também o consentimento — a app perde acesso a partir de agora
    await service
      .from('oauth_consents')
      .update({ revoked_at: new Date().toISOString() })
      .eq('client_id', client_id)
      .eq('user_id', row.user_id)
      .is('revoked_at', null);
  }

  return json({ revoked: true });
}

// ─── GET /userinfo ───────────────────────────────────────────────────────────

async function handleUserinfo(req: Request): Promise<Response> {
  const auth = await requireAccessToken(req);
  if ('error' in auth) return json(auth, auth.status);

  const { data: profile } = await service
    .from('profiles')
    .select('email, name')
    .eq('id', auth.token.user_id)
    .maybeSingle();

  const { data: company } = auth.token.company_id
    ? await service
        .from('companies')
        .select('id, name, slug, cnpj')
        .eq('id', auth.token.company_id)
        .maybeSingle()
    : { data: null };

  return json({
    sub: auth.token.user_id,
    email: profile?.email ?? null,
    name: profile?.name ?? null,
    company: company
      ? { id: company.id, name: company.name, slug: company.slug, cnpj: company.cnpj ?? null }
      : null,
    scopes: auth.token.scopes,
  });
}

// ─── GET /company ────────────────────────────────────────────────────────────

async function handleGetCompany(req: Request): Promise<Response> {
  const auth = await requireAccessToken(req, 'company:read');
  if ('error' in auth) return json(auth, auth.status);

  if (!auth.token.company_id) {
    return json({ company: null, message: 'Nenhuma empresa autorizada.' });
  }

  const { data, error } = await service
    .from('companies')
    .select('id, name, slug, cnpj, logo_url, is_active')
    .eq('id', auth.token.company_id)
    .maybeSingle();

  if (error) return json({ error: error.message }, 502);
  return json({ company: data });
}

// ─── POST /company ───────────────────────────────────────────────────────────

/**
 * Cria a empresa a partir de um id externo do NetsulCondo (o id do
 * condomínio). O slug é derivado desse id, o que torna a operação
 * idempotente — chamar duas vezes não cria duplicados.
 */
async function handleUpsertCompany(req: Request): Promise<Response> {
  const auth = await requireAccessToken(req, 'company:write');
  if ('error' in auth) return json(auth, auth.status);

  let body: { external_id?: string; name?: string; cnpj?: string; logo_url?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Corpo JSON inválido.' }, 400);
  }

  if (!body.external_id || !body.name) {
    return json({ error: 'external_id e name são obrigatórios.' }, 400);
  }

  // O slug é sempre derivado do condomínio — determinístico, evita duplicados
  const slug = `condo-${body.external_id.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

  const { data: existing } = await service
    .from('companies')
    .select('id, slug')
    .eq('slug', slug)
    .maybeSingle();

  let companyId: string;
  let created = false;

  if (existing) {
    const { error } = await service
      .from('companies')
      .update({
        name: body.name,
        ...(body.cnpj ? { cnpj: body.cnpj } : {}),
        ...(body.logo_url ? { logo_url: body.logo_url } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);
    if (error) return json({ error: error.message }, 502);
    companyId = existing.id;
  } else {
    const { data: createdRow, error } = await service
      .from('companies')
      .insert({
        name: body.name,
        slug,
        cnpj: body.cnpj ?? null,
        logo_url: body.logo_url ?? null,
        plan: 'free',
        max_users: 10,
        is_active: true,
      })
      .select('id, slug')
      .single();
    if (error) return json({ error: error.message }, 502);
    companyId = createdRow.id;
    created = true;
  }

  return json({ company_id: companyId, slug, created });
}

// ─── GET /contracts ──────────────────────────────────────────────────────────

async function handleListContracts(req: Request): Promise<Response> {
  const auth = await requireAccessToken(req, 'contracts:read');
  if ('error' in auth) return json(auth, auth.status);

  const url = new URL(req.url);
  const status = url.searchParams.get('status');
  const page = Math.max(1, Number(url.searchParams.get('page') ?? 1));
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit') ?? 20)));
  const from = (page - 1) * limit;

  if (!auth.token.company_id) {
    return json({ data: [], total: 0, page, limit });
  }

  const companyId = auth.token.company_id;

  // Contratos pertencem a uma empresa via owner_id → profiles.company_id.
  // Não há company_id directo na tabela contracts.
  const { data: profiles } = await service
    .from('profiles')
    .select('id')
    .eq('company_id', companyId);

  const ownerIds = (profiles ?? []).map((p: { id: string }) => p.id);

  let query = service
    .from('contracts')
    .select(
      'id,created_at,updated_at,title,description,status,risk_level,value,currency,' +
        'start_date,end_date,client_id,tags,version,auto_renew,renewal_count,owner_id,' +
        'client:clients(id,name,email)',
      { count: 'exact' },
    );

  if (ownerIds.length > 0) {
    query = query.in('owner_id', ownerIds);
  } else {
    // Empresa sem utilizadores — não há contratos para mostrar
    return json({ data: [], total: 0, page, limit });
  }

  if (status && VALID_STATUSES.includes(status)) {
    query = query.eq('status', status);
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, from + limit - 1);

  if (error) return json({ error: error.message }, 502);

  return json({ data: data ?? [], total: count ?? 0, page, limit });
}

// ─── POST /clients ───────────────────────────────────────────────────────────

/**
 * Cria ou actualiza um cliente. O vínculo com o NetsulCondo é feito por
 * custom_fields, que já é a forma como o Agree guarda campos flexíveis.
 */
async function handleUpsertClient(req: Request): Promise<Response> {
  const auth = await requireAccessToken(req, 'clients:write');
  if ('error' in auth) return json(auth, auth.status);

  let body: {
    external_id?: string;
    name?: string;
    email?: string;
    phone?: string;
    category?: string;
  };

  try {
    body = await req.json();
  } catch {
    return json({ error: 'Corpo JSON inválido.' }, 400);
  }

  if (!body.external_id || !body.name) {
    return json({ error: 'external_id e name são obrigatórios.' }, 400);
  }
  if (!auth.token.company_id) {
    return json({ error: 'Nenhuma empresa autorizada neste token.' }, 403);
  }

  const ownerId = auth.token.user_id;
  const companyId = auth.token.company_id;

  const { data: existing } = await service
    .from('clients')
    .select('id')
    .eq('owner_id', ownerId)
    .contains('custom_fields', { netsulcondo_fornecedor_id: body.external_id })
    .maybeSingle();

  const payload = {
    name: body.name,
    email: body.email ?? null,
    phone: body.phone ?? null,
    category: body.category ?? null,
    status: 'active',
    custom_fields: {
      netsulcondo_fornecedor_id: body.external_id,
      netsulcondo_condominio_id: companyId,
    },
    updated_at: new Date().toISOString(),
  };

  if (existing) {
    const { error } = await service
      .from('clients')
      .update(payload)
      .eq('id', existing.id);
    if (error) return json({ error: error.message }, 502);
    return json({ client_id: existing.id, created: false });
  }

  const { data: created, error } = await service
    .from('clients')
    .insert({ ...payload, owner_id: ownerId })
    .select('id')
    .single();

  if (error) return json({ error: error.message }, 502);
  return json({ client_id: created.id, created: true }, 201);
}

// ─── GET /client-info ────────────────────────────────────────────────────────

/**
 * Descoberta pública de uma app cliente. Usada pelo ecrã de consentimento
 * para mostrar o nome, o logótipo e a descrição da app que pede acesso.
 *
 * Só devolve metadados de apresentação — nunca o client_secret nem os hashes.
 */
async function handleClientInfo(req: Request): Promise<Response> {
  const clientId = new URL(req.url).searchParams.get('client_id');
  if (!clientId) return json({ error: 'client_id em falta.' }, 400);

  const { data, error } = await service
    .from('oauth_clients')
    .select('client_id, name, description, logo_url, redirect_uris, allowed_scopes')
    .eq('client_id', clientId)
    .eq('is_active', true)
    .maybeSingle();

  if (error) return json({ error: error.message }, 502);
  if (!data) return json({ error: 'Aplicação desconhecida.' }, 404);

  return json(data);
}

// ─── GET /connections ────────────────────────────────────────────────────────

/** Lista as aplicações externas a que o utilizador deu autorização. */
async function handleConnections(req: Request): Promise<Response> {
  const user = await requireSupabaseUser(req);
  if (!user) return json({ error: 'Sessão inválida ou expirada.' }, 401);

  const { data, error } = await service
    .from('oauth_consents')
    .select(
      'id, client_id, company_id, scopes, created_at, ' +
        'client:oauth_clients(id, name, logo_url, description), ' +
        'company:companies(id, name, slug)',
    )
    .eq('user_id', user.id)
    .is('revoked_at', null);

  if (error) return json({ error: error.message }, 502);
  return json({ data: data ?? [] });
}

// ─── Router ──────────────────────────────────────────────────────────────────

serve(async (req) => {
  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/oauth/, '').replace(/\/$/, '') || '/';

  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
        'Access-Control-Allow-Headers': 'authorization,content-type',
      },
    });
  }

  if (path === '/health' && req.method === 'GET') {
    return json({
      status: 'ok',
      service: 'oauth',
      timestamp: new Date().toISOString(),
      netsulcondo_app_url_configured: Boolean(NETSULCONDO_APP_URL),
    });
  }

  try {
    if (path === '/authorize' && req.method === 'POST') return handleAuthorize(req);
    if (path === '/token' && req.method === 'POST') return handleToken(req);
    if (path === '/revoke' && req.method === 'POST') return handleRevoke(req);
    if (path === '/userinfo' && req.method === 'GET') return handleUserinfo(req);
    if (path === '/client-info' && req.method === 'GET') return handleClientInfo(req);
    if (path === '/company' && req.method === 'GET') return handleGetCompany(req);
    if (path === '/company' && req.method === 'POST') return handleUpsertCompany(req);
    if (path === '/contracts' && req.method === 'GET') return handleListContracts(req);
    if (path === '/clients' && req.method === 'POST') return handleUpsertClient(req);
    if (path === '/connections' && req.method === 'GET') return handleConnections(req);

    return json({ error: 'Rota não encontrada.' }, 404);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Erro interno.';
    console.error('[oauth] Erro não tratado:', message);
    return json({ error: 'server_error', error_description: message }, 500);
  }
});
