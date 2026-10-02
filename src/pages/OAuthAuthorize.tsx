/**
 * OAuthAuthorize.tsx
 *
 * Ecrã de consentimento do Agree. Mostra o que a app cliente vai poder ver e
 * alterar na conta, e só depois de o utilizador autorizar é que o Agree emite
 * o authorization code.
 *
 * Rota: /oauth/authorize?response_type=code&client_id=...&redirect_uri=...&scope=...
 *
 * O layout segue o padrão de GitHub e Vercel: quem pede, em nome de quem, e
 * uma lista explícita de recursos. A lista é de leitura, não um editor de
 * permissões — o que a app pede está definido no seu registo, e mexer nisso
 * a meio do ecrã sóbaraçaria o utilizador sobre o que está a aceitar.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import LoadingScreen from '../components/LoadingScreen';
import { toast } from 'sonner';
import {
  AlertTriangle,
  Building2,
  Check,
  ExternalLink,
  FileText,
  Link2,
  ShieldCheck,
  Users,
} from 'lucide-react';

import { Button } from '../components/ui/button';
import { Checkbox } from '../components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Separator } from '../components/ui/separator';
import { Field, FieldDescription, FieldLabel } from '../components/ui/field';

// ─── Catálogo de scopes ──────────────────────────────────────────────────────
// A descrição é o que o utilizador lê. Escrever em português claro, porque é
// este texto que o utilizador aceita — é um contrato, não documentação.

interface ScopeDefinition {
  key: string;
  title: string;
  description: string;
  /** Agrupa as permissões no ecrã. */
  group: 'ler' | 'escrever';
  /** Ícone do recurso. */
  icon: React.ComponentType<{ className?: string }>;
}

export const SCOPES: ScopeDefinition[] = [
  {
    key: 'company:read',
    title: 'Condomínio',
    description:
      'Ver nome, CNPJ e logótipo. Criar o registo do condomínio como empresa no Agree e manter o nome e o CNPJ actualizados.',
    group: 'ler',
    icon: Building2,
  },
  {
    key: 'company:write',
    title: 'Condomínio',
    description:
      'Criar e actualizar o registo do condomínio como empresa no Agree, mantendo o nome e o CNPJ sincronizados com o NetsulCondo.',
    group: 'escrever',
    icon: Building2,
  },
  {
    key: 'contracts:read',
    title: 'Contratos',
    description:
      'Ver título, estado, valor, datas e cliente de cada contrato do condomínio.',
    group: 'ler',
    icon: FileText,
  },
  {
    key: 'clients:read',
    title: 'Clientes',
    description: 'Ver a lista de fornecedores e prestadores registados no Agree.',
    group: 'ler',
    icon: Users,
  },
  {
    key: 'clients:write',
    title: 'Clientes',
    description:
      'Criar um cliente no Agree a partir de um fornecedor do NetsulCondo e manter os dados sincronizados.',
    group: 'escrever',
    icon: Users,
  },
];

const DEFAULT_SCOPES = ['company:read'];

/** Logótipo oficial do Agree, servido localmente. */
const AGREE_LOGO = '/Logo.png';

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
  const [showMeaning, setShowMeaning] = useState(false);
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

  // ── 5. Fixa os scopes a autorizar ─────────────────────────────────────────
  //
  // Só entram scopes que a app está registada para pedir. Um scope pedido mas
  // não registado é ignorado em silêncio, o que deixaria o ecrã a prometer
  // mais do que o servidor vai conceder.

  useEffect(() => {
    if (!params || !client) return;

    const permitted = new Set(client.allowed_scopes);
    const known = new Set(SCOPES.filter((s) => permitted.has(s.key)).map((s) => s.key));
    const requested = params.scope.split(/[\s+]+/).filter(Boolean);
    const valid = requested.filter((s) => known.has(s));

    setGranted(valid.length > 0 ? valid : DEFAULT_SCOPES.filter((s) => known.has(s)));
  }, [params, client]);

  /** Scopes que se vão mostrar, por ordem do catálogo. */
  const visibleScopes = useMemo(() => {
    const permitted = new Set(client?.allowed_scopes ?? []);
    return SCOPES.filter((s) => granted.includes(s.key) && permitted.has(s.key));
  }, [client, granted]);

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
      <ProblemScreen
        title="Pedido inválido"
        message={paramError}
        onBack={() => navigate('/', { replace: true })}
      />
    );
  }

  if (clientError || !client) {
    return (
      <ProblemScreen
        title="Aplicação desconhecida"
        message={clientError ?? 'Esta aplicação não está registada no Agree.'}
        onBack={() => navigate('/', { replace: true })}
      />
    );
  }

  // ── Ecrã de consentimento ─────────────────────────────────────────────────

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8 pb-12">
      {/* Quem pede, e a quem pertence a conta */}
      <div className="mb-7 flex items-center justify-center" aria-hidden="true">
        <div className="flex size-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border">
          {client.logo_url ? (
            <img src={client.logo_url} alt="" className="size-full object-contain" />
          ) : (
            <span className="bg-primary text-[38px] font-extrabold leading-none text-primary-foreground">
              {client.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        <div className="flex min-w-12 max-w-[150px] flex-1 items-center">
          <Separator className="flex-1 border-t-2 border-dashed" />
          <Link2 className="mx-2.5 size-5 shrink-0 text-muted-foreground" />
          <Separator className="flex-1 border-t-2 border-dashed" />
        </div>

        <div className="flex size-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#3b5bdb]">
          <img src={AGREE_LOGO} alt="" className="size-full object-contain" />
        </div>
      </div>

      <h1 className="mb-1 text-center text-[28px] font-normal">
        <b className="font-semibold">{client.name}</b> by Netsul
      </h1>
      <p className="mb-8 text-center text-muted-foreground">
        quer aceder à sua conta Agree
      </p>

      <div className="rounded-lg border border-border bg-card px-8 py-6 max-sm:px-5">
        {/* A conta em causa */}
        <div className="mb-5 rounded-md border border-border bg-muted px-3.5 py-2.5 text-sm">
          <span className="block text-xs text-muted-foreground">
            A conta que vai ser partilhada
          </span>
          {user?.email}
        </div>

        {/* Condomínio de origem */}
        {companies.length > 0 && (
          <Field className="mb-5">
            <FieldLabel htmlFor="oauth-company">Condomínio</FieldLabel>
            <Select
              value={selectedCompany}
              // O Radix pode passar null quando o valor é limpo; o estado é
              // uma string, por isso traduzimos antes de guardar.
              onValueChange={(v) => setSelectedCompany(v ?? '')}
            >
              <SelectTrigger id="oauth-company" className="w-full">
                <SelectValue placeholder="Escolhe o condomínio" />
              </SelectTrigger>
              <SelectContent>
                {companies.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldDescription>
              Os contratos e clientes partilhados serão os deste condomínio.
            </FieldDescription>
          </Field>
        )}

        <h2 className="mb-4 text-lg font-semibold">Ao autorizar, esta app poderá</h2>
        <ul className="m-0 list-none space-y-2 p-0">
          <li className="flex items-baseline gap-3">
            <Check className="mt-0.5 size-4 shrink-0 translate-y-0.5 text-emerald-600 dark:text-emerald-500" />
            <span>Verificar a sua identidade no Agree ({user?.email})</span>
          </li>
          <li className="flex items-baseline gap-3">
            <Check className="mt-0.5 size-4 shrink-0 translate-y-0.5 text-emerald-600 dark:text-emerald-500" />
            <span>Saber a que recursos tem acesso</span>
          </li>
          <li className="flex items-baseline gap-3">
            <Check className="mt-0.5 size-4 shrink-0 translate-y-0.5 text-emerald-600 dark:text-emerald-500" />
            <span>
              Agir em seu nome{' '}
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0 align-baseline"
                onClick={() => setShowMeaning((v) => !v)}
              >
                O que significa?
              </Button>
            </span>
          </li>
        </ul>

        {showMeaning && (
          <p className="mt-3 rounded-md border border-border bg-muted p-3 text-sm text-muted-foreground">
            A app passa a poder ler e alterar os recursos indicados em seu nome,
            sem lhe pedir a password. Pode retirar esse acesso a qualquer momento.
          </p>
        )}

        <Separator className="my-5" />

        {/* Recursos concretos */}
        <div>
          <h3 className="mb-2 border-b border-border pb-2 text-base font-semibold">
            Recursos na sua conta
          </h3>

          {visibleScopes.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.key} className="flex gap-3.5 py-2.5">
                <Icon className="mt-0.5 size-7 shrink-0 text-muted-foreground" />
                <div>
                  <b className="font-semibold">{s.title}</b>{' '}
                  <span className="text-muted-foreground">
                    ({s.group === 'ler' ? 'leitura' : 'leitura e escrita'})
                  </span>
                  <p className="m-0 text-sm text-muted-foreground">{s.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        <ul className="mt-[18px] list-none space-y-1.5 text-sm text-muted-foreground">
          <li className="flex items-center gap-2.5">
            <ShieldCheck className="size-4 shrink-0" />
            <span>
              <b className="font-semibold text-foreground">{client.name}</b> não é
              propriedade nem é operado pelo Agree
            </span>
          </li>
          <li className="flex items-center gap-2.5">
            <Link2 className="size-4 shrink-0" />
            <span>Ligação nova — ainda sem histórico</span>
          </li>
        </ul>

        <label className="mt-[18px] flex cursor-pointer items-center gap-2 text-sm">
          <Checkbox
            id="oauth-remember"
            checked={remember}
            onCheckedChange={(v) => setRemember(v === true)}
          />
          <label htmlFor="oauth-remember" className="cursor-pointer">
            Não mostrar este ecrã novamente para {client.name}
          </label>
        </label>
      </div>

      <div className="mt-6 grid gap-2.5">
        <Button
          className="h-10 w-full"
          onClick={authorize}
          disabled={submitting || granted.length === 0}
        >
          {submitting ? 'A autorizar…' : `Autorizar ${client.name}`}
        </Button>
        <Button
          variant="outline"
          className="h-10 w-full"
          onClick={cancel}
          disabled={submitting}
        >
          Cancelar
        </Button>
      </div>

      {granted.length === 0 && (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-500">
          <AlertTriangle className="size-3.5 shrink-0" />
          Esta aplicação não tem permissões disponíveis para autorizar.
        </p>
      )}

      <p className="mt-5 text-center text-xs text-muted-foreground">
        A autorizar irá ser redireccionado para
        <br />
        <b className="break-all">{params.redirect_uri}</b>
        <br />
        <span>
          Pode revogar em qualquer momento em{' '}
          <Button
            variant="link"
            size="sm"
            className="h-auto p-0 align-baseline text-xs"
            onClick={() => navigate('/profile')}
          >
            Definições › Ligações
          </Button>
          .
        </span>
      </p>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        <a
          href="/termos"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline"
        >
          Termos de Serviço <ExternalLink className="size-2.5" />
        </a>
      </p>
    </main>
  );
}

// ─── Ecrã de problema ────────────────────────────────────────────────────────

function ProblemScreen({
  title,
  message,
  onBack,
}: {
  title: string;
  message: string;
  onBack: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg items-center justify-center px-4 py-10">
      <div className="w-full rounded-lg border border-border bg-card px-8 py-10 text-center">
        <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="size-6 text-destructive" />
        </div>
        <h1 className="mb-2 text-lg font-semibold">{title}</h1>
        <p className="mb-6 text-sm leading-relaxed text-muted-foreground">{message}</p>
        <Button className="h-10 w-full" onClick={onBack}>
          Voltar ao início
        </Button>
      </div>
    </main>
  );
}
