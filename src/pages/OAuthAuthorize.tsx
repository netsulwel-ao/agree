/**
 * OAuthAuthorize.tsx
 *
 * Ecrã de consentimento do Agree. Equivalente ao que o GitHub mostra quando
 * o Vercel pede acesso aos repositórios: login → ecrã de consentimento →
 * "Autorizar" → redireccionamento com o authorization code.
 *
 * Rota: /oauth/authorize?response_type=code&client_id=...&redirect_uri=...&scope=...
 *
 * O ecrã mostra exactamente o que vai ser partilhado, item por item, com a
 * opção de desmarcar os que o utilizador não quer autorizar.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import LoadingScreen from '../components/LoadingScreen';
import { toast } from 'sonner';
import { AlertTriangle, Check, ShieldCheck, X, ExternalLink } from 'lucide-react';

// ─── Catálogo de scopes ──────────────────────────────────────────────────────
// A descrição é o que o utilizador lê. Escrever em português claro, porque é
// este texto que o utilizador aceita — é um contrato, não documentação.

interface ScopeDefinition {
  key: string;
  title: string;
  description: string;
  /** Agrupa as permissões no ecrã. */
  group: 'ler' | 'escrever';
  required?: boolean;
}

export const SCOPES: ScopeDefinition[] = [
  {
    key: 'company:read',
    title: 'Ver os dados do condomínio',
    description: 'Nome, CNPJ e logótipo do condomínio, para os associar aos contratos.',
    group: 'ler',
  },
  {
    key: 'contracts:read',
    title: 'Ver os contratos',
    description: 'Título, estado, valor, datas e cliente de cada contrato do condomínio.',
    group: 'ler',
  },
  {
    key: 'clients:read',
    title: 'Ver os clientes',
    description: 'A lista de fornecedores e prestadores registados no Agree.',
    group: 'ler',
  },
  {
    key: 'clients:write',
    title: 'Criar e actualizar clientes',
    description: 'Criar um cliente no Agree a partir de um fornecedor do NetsulCondo, e manter os dados sincronizados.',
    group: 'escrever',
  },
  {
    key: 'company:write',
    title: 'Criar e actualizar o condomínio',
    description: 'Criar o registo do condomínio como empresa no Agree, e manter o nome e o CNPJ actualizados.',
    group: 'escrever',
  },
];

const DEFAULT_SCOPES = SCOPES.filter((s) => s.required).map((s) => s.key);

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface OAuthParams {
  client_id: string;
  redirect_uri: string;
  scope: string;
  state?: string;
  code_challenge?: string;
  code_challenge_method?: string;
}

interface ClientInfo {
  client_id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  redirect_uris: string[];
  allowed_scopes: string[];
}

interface CompanyOption {
  id: string;
  name: string;
  slug: string;
}

const PENDING_KEY = 'oauthAuthorizeParams';
const PENDING_RETURN_KEY = 'oauthAuthorizeReturnTo';

// ─── Componente ─────────────────────────────────────────────────────────────

export default function OAuthAuthorize() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();

  const [params, setParams] = useState<OAuthParams | null>(null);
  const [paramError, setParamError] = useState<string | null>(null);

  const [client, setClient] = useState<ClientInfo | null>(null);
  const [clientLoading, setClientLoading] = useState(true);
  const [clientError, setClientError] = useState<string | null>(null);

  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>('');

  const [granted, setGranted] = useState<string[]>([]);
  const [remember, setRemember] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // ── 1. Lê e valida os parâmetros do query string ──────────────────────────

  useEffect(() => {
    const raw = searchParams.get('client_id');
    const redirectUri = searchParams.get('redirect_uri');

    if (!raw || !redirectUri) {
      // Pode ser o regresso do login: os parâmetros estavam no sessionStorage
      const stored = sessionStorage.getItem(PENDING_KEY);
      if (stored) {
        sessionStorage.removeItem(PENDING_KEY);
        const parsed = JSON.parse(stored) as OAuthParams;
        setParams(parsed);
        return;
      }
      setParamError('Pedido de autorização inválido: faltam parâmetros.');
      return;
    }

    setParams({
      client_id: raw,
      redirect_uri: redirectUri,
      scope: searchParams.get('scope') ?? '',
      state: searchParams.get('state') ?? undefined,
      code_challenge: searchParams.get('code_challenge') ?? undefined,
      code_challenge_method: searchParams.get('code_challenge_method') ?? undefined,
    });
  }, [searchParams]);

  // ── 2. Se não há sessão, manda para o login e guarda os parâmetros ────────

  useEffect(() => {
    if (authLoading || !params) return;
    if (user) return;

    // Guarda o return_to para os guardas do router saberem para onde ir
    if (searchParams.get('client_id')) {
      sessionStorage.setItem(PENDING_KEY, JSON.stringify(params));
      sessionStorage.setItem(PENDING_RETURN_KEY, window.location.pathname + window.location.search);
    }

    navigate(`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`, {
      replace: true,
    });
  }, [authLoading, user, params, navigate, searchParams]);

  // ── 3. Carrega os dados da app cliente ────────────────────────────────────
  //
  // As tabelas oauth_* têm RLS ligado e sem policies — o browser não as pode
  // ler. A identificação da app vem do endpoint público /client-info, que
  // só devolve metadados de apresentação (nome, logo, descrição, scopes
  // permitidos). Nada de segredos.

  useEffect(() => {
    if (!params || !user) return;

    let cancelled = false;

    (async () => {
      setClientLoading(true);
      setClientError(null);

      try {
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/oauth/client-info` +
            `?client_id=${encodeURIComponent(params.client_id)}`,
        );

        if (!res.ok) {
          if (!cancelled) {
            setClientError('Não foi possível identificar a aplicação que pediu acesso.');
            setClientLoading(false);
          }
          return;
        }

        const data = (await res.json()) as ClientInfo;
        if (!cancelled) {
          setClient(data);
          setClientLoading(false);
        }
      } catch {
        if (!cancelled) {
          setClientError('Não foi possível identificar a aplicação que pediu acesso.');
          setClientLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [params, user]);

  // ── 4. Carrega as empresas disponíveis e pré-selecciona ───────────────────

  useEffect(() => {
    if (!user) return;

    (async () => {
      const [{ data: profile }, { data: allCompanies }] = await Promise.all([
        supabase.from('profiles').select('company_id, is_super_admin').eq('id', user.id).maybeSingle(),
        supabase.from('companies').select('id, name, slug').eq('is_active', true),
      ]);

      const rows = allCompanies ?? [];

      // Super admin vê todas; os restantes só a sua
      const available = profile?.is_super_admin
        ? rows
        : rows.filter((c: CompanyOption) => c.id === profile?.company_id);

      setCompanies(available);
      if (available.length > 0) {
        setSelectedCompany((prev) => prev || (available[0]?.id ?? ''));
      }
    })();
  }, [user]);

  // ── 5. Inicializa os scopes marcados ──────────────────────────────────────

  useEffect(() => {
    if (!params) return;
    const requested = params.scope.split(/[\s+]+/).filter(Boolean);
    const valid = requested.filter((s) => SCOPES.some((d) => d.key === s));
    setGranted(valid.length > 0 ? valid : DEFAULT_SCOPES);
  }, [params]);

  const readScopes = useMemo(
    () => granted.filter((g) => SCOPES.find((s) => s.key === g)?.group === 'ler'),
    [granted],
  );
  const writeScopes = useMemo(
    () => granted.filter((g) => SCOPES.find((s) => s.key === g)?.group === 'escrever'),
    [granted],
  );

  const toggleScope = (key: string) => {
    setGranted((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  // ── 6. Recusa → devolve o browser com error=access_denied ─────────────────

  const cancel = () => {
    if (!params) {
      navigate('/', { replace: true });
      return;
    }
    const target = new URL(params.redirect_uri);
    target.searchParams.set('error', 'access_denied');
    target.searchParams.set(
      'error_description',
      'O utilizador cancelou a autorização.',
    );
    if (params.state) target.searchParams.set('state', params.state);
    window.location.href = target.toString();
  };

  // ── 7. Autoriza → pede o código à Edge Function e redirecciona ───────────

  const authorize = async () => {
    if (!params || !user) return;

    setSubmitting(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) {
        toast.error('Sessão expirada. Entra novamente.');
        return;
      }

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/oauth/authorize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          client_id: params.client_id,
          redirect_uri: params.redirect_uri,
          scopes: granted,
          company_id: selectedCompany || null,
          state: params.state,
          code_challenge: params.code_challenge,
          code_challenge_method: params.code_challenge_method,
          remember,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // O Edge Function pode responder com um redirect de erro quando o
        // redirect_uri é válido — nesse caso deixamos o browser seguir.
        if (data.redirect_to) {
          window.location.href = data.redirect_to;
          return;
        }
        toast.error(data.error_description ?? 'Não foi possível autorizar.');
        return;
      }

      if (!data.redirect_to) {
        toast.error('Resposta inesperada do servidor de autorização.');
        return;
      }

      window.location.href = data.redirect_to;
    } catch (err) {
      console.error('[OAuthAuthorize] Erro ao autorizar:', err);
      toast.error('Falha de rede ao autorizar. Tenta novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Estados intermédios ──────────────────────────────────────────────────

  if (authLoading || !params || clientLoading) {
    return <LoadingScreen message="A validar o pedido de acesso..." />;
  }

  if (paramError) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={{ ...styles.iconCircle, background: '#fee2e2' }}>
            <AlertTriangle size={26} color="#dc2626" />
          </div>
          <h1 style={styles.cardTitle}>Pedido inválido</h1>
          <p style={styles.cardText}>{paramError}</p>
          <button style={styles.secondaryButton} onClick={() => navigate('/', { replace: true })}>
            Voltar ao início
          </button>
        </div>
      </div>
    );
  }

  if (clientError || !client) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={{ ...styles.iconCircle, background: '#fee2e2' }}>
            <AlertTriangle size={26} color="#dc2626" />
          </div>
          <h1 style={styles.cardTitle}>Aplicação desconhecida</h1>
          <p style={styles.cardText}>
            {clientError ?? 'Esta aplicação não está registada no Agree.'}
          </p>
          <button style={styles.secondaryButton} onClick={() => navigate('/', { replace: true })}>
            Voltar ao início
          </button>
        </div>
      </div>
    );
  }

  // ── Ecrã de consentimento ─────────────────────────────────────────────────

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* Cabeçalho: a app que pede acesso */}
        <div style={styles.header}>
          <div style={styles.logo}>
            {client.logo_url ? (
              <img src={client.logo_url} alt="" style={styles.logoImg} />
            ) : (
              <span style={styles.logoFallback}>
                {client.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div style={styles.headerText}>
            <h1 style={styles.title}>
              Ligar <strong>{client.name}</strong> ao Agree
            </h1>
            {client.description && <p style={styles.subtitle}>{client.description}</p>}
          </div>
        </div>

        {/* Com quem vai ser partilhado */}
        <div style={styles.identityBox}>
          <div style={styles.identityRow}>
            <ShieldCheck size={16} color="#0d1117" />
            <span style={styles.identityLabel}>A conta que vai ser partilhada</span>
          </div>
          <p style={styles.identityValue}>{user?.email}</p>
        </div>

        {/* Selector de condomínio */}
        {companies.length > 0 && (
          <div style={styles.field}>
            <label htmlFor="oauth-company" style={styles.fieldLabel}>
              Condomínio
            </label>
            <select
              id="oauth-company"
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              style={styles.select}
            >
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <p style={styles.fieldHint}>
              Os contratos e clientes partilhados serão os deste condomínio.
            </p>
          </div>
        )}

        {/* Permissões: leitura */}
        <PermissionGroup
          title="Vai poder consultar"
          subtitle="Dados só de leitura — nada é alterado no Agree."
          scopes={SCOPES.filter((s) => s.group === 'ler')}
          granted={readScopes}
          onToggle={toggleScope}
        />

        {/* Permissões: escrita */}
        <PermissionGroup
          title="Vai poder criar e alterar"
          subtitle="Estas permissões alteram dados no Agree."
          scopes={SCOPES.filter((s) => s.group === 'escrever')}
          granted={writeScopes}
          onToggle={toggleScope}
        />

        {/* Lembrar autorização */}
        <label style={styles.rememberRow}>
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            style={styles.checkbox}
          />
          <span style={styles.rememberText}>
            Não mostrar este ecrã novamente para {client.name}
          </span>
        </label>

        {/* Acções */}
        <div style={styles.actions}>
          <button
            style={styles.cancelButton}
            onClick={cancel}
            disabled={submitting}
          >
            <X size={16} />
            Cancelar
          </button>
          <button
            style={styles.authorizeButton}
            onClick={authorize}
            disabled={submitting || granted.length === 0}
          >
            {submitting ? 'A autorizar...' : `Autorizar ${client.name}`}
          </button>
        </div>

        {granted.length === 0 && (
          <p style={styles.warning}>
            <AlertTriangle size={14} />
            Tem de autorizar pelo menos uma permissão.
          </p>
        )}

        <p style={styles.footnote}>
          Pode revogar esta ligação a qualquer momento em{' '}
          <button
            type="button"
            onClick={() => navigate('/profile')}
            style={styles.linkButton}
          >
            {user?.email}
          </button>
          {' '}ou do lado do {client.name}.
          <br />
          <a
            href="/termos"
            target="_blank"
            rel="noreferrer"
            style={styles.linkButton}
          >
            Termos de Serviço <ExternalLink size={11} />
          </a>
        </p>
      </div>
    </div>
  );
}

// ─── Grupo de permissões ─────────────────────────────────────────────────────

function PermissionGroup({
  title,
  subtitle,
  scopes,
  granted,
  onToggle,
}: {
  title: string;
  subtitle: string;
  scopes: ScopeDefinition[];
  granted: string[];
  onToggle: (key: string) => void;
}) {
  if (scopes.length === 0) return null;

  return (
    <div style={styles.group}>
      <h2 style={styles.groupTitle}>{title}</h2>
      <p style={styles.groupSubtitle}>{subtitle}</p>
      <div style={styles.groupList}>
        {scopes.map((s) => {
          const active = granted.includes(s.key);
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => onToggle(s.key)}
              style={styles.permissionRow}
              aria-pressed={active}
            >
              <span
                style={{
                  ...styles.checkboxBox,
                  ...(active ? styles.checkboxBoxOn : {}),
                }}
              >
                {active && <Check size={12} color="#fff" strokeWidth={3} />}
              </span>
              <span style={styles.permissionText}>
                <span style={styles.permissionTitle}>{s.title}</span>
                <span style={styles.permissionDesc}>{s.description}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Estilos ─────────────────────────────────────────────────────────────────
// Paleta e escala iguais ao resto do Agree (Termos.tsx, AuthenticationScreen).

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f5f7f9',
    padding: '40px 20px',
    fontFamily: "'Poppins', sans-serif",
  },
  card: {
    background: '#fff',
    borderRadius: 20,
    boxShadow: '0 50px 100px -50px rgba(0,0,0,0.45)',
    maxWidth: 560,
    width: '100%',
    padding: '40px 36px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    marginBottom: 28,
  },
  logo: {
    width: 52,
    height: 52,
    borderRadius: 12,
    border: '1px solid #e2e5e9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    overflow: 'hidden',
  },
  logoImg: { width: '100%', height: '100%', objectFit: 'contain' },
  logoFallback: {
    fontSize: 22,
    fontWeight: 800,
    color: '#0d1117',
  },
  headerText: { flex: 1 },
  title: { fontSize: 20, fontWeight: 800, color: '#0d1117', margin: 0, lineHeight: 1.3 },
  subtitle: { fontSize: 13, color: '#6b7280', margin: '4px 0 0' },

  identityBox: {
    background: '#f9fafb',
    border: '1px solid #e2e5e9',
    borderRadius: 12,
    padding: '14px 16px',
    marginBottom: 24,
  },
  identityRow: { display: 'flex', alignItems: 'center', gap: 8 },
  identityLabel: { fontSize: 12, color: '#6b7280', fontWeight: 500 },
  identityValue: {
    fontSize: 14,
    fontWeight: 600,
    color: '#0d1117',
    margin: '4px 0 0',
  },

  field: { marginBottom: 24 },
  fieldLabel: {
    display: 'block',
    fontSize: 12,
    fontWeight: 600,
    color: '#374151',
    marginBottom: 6,
  },
  select: {
    width: '100%',
    padding: '10px 12px',
    fontSize: 14,
    fontFamily: "'Poppins', sans-serif",
    color: '#0d1117',
    background: '#fff',
    border: '1px solid #e2e5e9',
    borderRadius: 10,
    cursor: 'pointer',
  },
  fieldHint: { fontSize: 12, color: '#9ca3af', margin: '6px 0 0' },

  group: { marginBottom: 24 },
  groupTitle: { fontSize: 14, fontWeight: 700, color: '#0d1117', margin: 0 },
  groupSubtitle: { fontSize: 12, color: '#9ca3af', margin: '2px 0 10px' },
  groupList: { display: 'flex', flexDirection: 'column', gap: 8 },
  permissionRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    padding: '12px 14px',
    border: '1px solid #e2e5e9',
    borderRadius: 12,
    background: '#fff',
    cursor: 'pointer',
    textAlign: 'left',
    fontFamily: "'Poppins', sans-serif",
    width: '100%',
  },
  checkboxBox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    border: '1.5px solid #d1d5db',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  checkboxBoxOn: { background: '#0d1117', borderColor: '#0d1117' },
  permissionText: { display: 'flex', flexDirection: 'column', gap: 2 },
  permissionTitle: { fontSize: 13, fontWeight: 600, color: '#0d1117' },
  permissionDesc: { fontSize: 12, color: '#6b7280', lineHeight: 1.5 },

  rememberRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '12px 0',
    marginBottom: 8,
    cursor: 'pointer',
  },
  checkbox: { width: 16, height: 16, accentColor: '#0d1117', cursor: 'pointer' },
  rememberText: { fontSize: 13, color: '#374151' },

  actions: { display: 'flex', gap: 10, marginTop: 20 },
  cancelButton: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: '12px 16px',
    fontSize: 14,
    fontWeight: 600,
    fontFamily: "'Poppins', sans-serif",
    background: '#fff',
    color: '#374151',
    border: '1px solid #e2e5e9',
    borderRadius: 12,
    cursor: 'pointer',
  },
  authorizeButton: {
    flex: 2,
    padding: '12px 16px',
    fontSize: 14,
    fontWeight: 700,
    fontFamily: "'Poppins', sans-serif",
    background: '#0d1117',
    color: '#fff',
    border: 'none',
    borderRadius: 12,
    cursor: 'pointer',
  },
  warning: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 12,
    color: '#b45309',
    margin: '12px 0 0',
  },

  footnote: {
    fontSize: 11,
    color: '#9ca3af',
    textAlign: 'center',
    margin: '24px 0 0',
    lineHeight: 1.7,
  },
  linkButton: {
    background: 'none',
    border: 'none',
    color: '#6b7280',
    fontSize: 11,
    textDecoration: 'underline',
    cursor: 'pointer',
    padding: 0,
    fontFamily: "'Poppins', sans-serif",
    display: 'inline-flex',
    alignItems: 'center',
    gap: 3,
  },

  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 20px',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 800,
    color: '#0d1117',
    textAlign: 'center',
    margin: '0 0 8px',
  },
  cardText: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 1.6,
    margin: '0 0 24px',
  },
  secondaryButton: {
    width: '100%',
    padding: '12px 16px',
    fontSize: 14,
    fontWeight: 600,
    fontFamily: "'Poppins', sans-serif",
    background: '#0d1117',
    color: '#fff',
    border: 'none',
    borderRadius: 12,
    cursor: 'pointer',
  },
};
