export type Plan = 'free' | 'pro' | 'enterprise';

export interface PlanInfo {
  label: string;
  price: string;
  priceSuffix: string;
  badge?: string;
  popular?: boolean;
}

export const PLAN_INFO: Record<Plan, PlanInfo> = {
  free: { label: 'Free', price: 'Kz 0', priceSuffix: '/mês' },
  pro: { label: 'Pro', price: 'Kz 39.900', priceSuffix: '/mês', popular: true, badge: 'MAIS POPULAR' },
  enterprise: { label: 'Enterprise', price: 'Kz 99.900', priceSuffix: '/mês', badge: 'SOB CONSULTA' },
};

export interface PlanLimits {
  maxContracts: number;
  maxClients: number;
  maxCollaboratorsPerContract: number;
  hasSignatures: boolean;
  hasAnalytics: boolean;
  hasNegotiation: boolean;
  hasAiGeneration: boolean;
  maxTemplates: number;
  storageMbPerContract: number;
  maxVersions: number;
  hasPrioritySupport: boolean;
  maxApiKeys: number;
  hasMultiCurrency: boolean;
  hasSignatureProviders: boolean;
  hasExternalSignatureProviders: boolean;
  hasCustomExchangeRates: boolean;
}

export const PLANS: Record<Plan, PlanLimits> = {
  free: {
    maxContracts: 3,
    maxClients: 10,
    maxCollaboratorsPerContract: 1,
    hasSignatures: false,
    hasAnalytics: false,
    hasNegotiation: false,
    hasAiGeneration: false,
    maxTemplates: 3,
    storageMbPerContract: 5,
    maxVersions: 3,
    hasPrioritySupport: false,
    maxApiKeys: 0,
    hasMultiCurrency: true,
    hasSignatureProviders: false,
    hasExternalSignatureProviders: false,
    hasCustomExchangeRates: false,
  },
  pro: {
    maxContracts: 50,
    maxClients: Infinity,
    maxCollaboratorsPerContract: 5,
    hasSignatures: true,
    hasAnalytics: true,
    hasNegotiation: true,
    hasAiGeneration: true,
    maxTemplates: 999,
    storageMbPerContract: 50,
    maxVersions: 50,
    hasPrioritySupport: false,
    maxApiKeys: 1,
    hasMultiCurrency: true,
    hasSignatureProviders: true,
    hasExternalSignatureProviders: false,
    hasCustomExchangeRates: true,
  },
  enterprise: {
    maxContracts: Infinity,
    maxClients: Infinity,
    maxCollaboratorsPerContract: Infinity,
    hasSignatures: true,
    hasAnalytics: true,
    hasNegotiation: true,
    hasAiGeneration: true,
    maxTemplates: Infinity,
    storageMbPerContract: 500,
    maxVersions: Infinity,
    hasPrioritySupport: true,
    maxApiKeys: 10,
    hasMultiCurrency: true,
    hasSignatureProviders: true,
    hasExternalSignatureProviders: true,
    hasCustomExchangeRates: true,
  },
};

const PLAN_ORDER: Plan[] = ['free', 'pro', 'enterprise'];

// ─── Trial helpers ────────────────────────────────────

/** Devolve true se o trial ainda está activo (data futura). */
export function isTrialActive(trialEndsAt: string | null | undefined): boolean {
  if (!trialEndsAt) return false;
  return new Date(trialEndsAt) > new Date();
}

/** Dias restantes do trial (0 se expirado ou sem trial). */
export function trialDaysRemaining(trialEndsAt: string | null | undefined): number {
  if (!trialEndsAt) return 0;
  const diff = new Date(trialEndsAt).getTime() - Date.now();
  if (diff <= 0) return 0;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * Devolve o plano efectivo do utilizador.
 * Se o trial estiver activo e o plano real for 'free', trata como 'pro'.
 */
export function effectivePlan(
  userPlan: Plan | null | undefined,
  trialEndsAt: string | null | undefined,
): Plan {
  const p = userPlan || 'free';
  if (p === 'free' && isTrialActive(trialEndsAt)) return 'pro';
  return p;
}

// ─── Plan checks ──────────────────────────────────────

/**
 * Verifica se o utilizador tem acesso ao nível mínimo pedido.
 * Respeita o trial activo (equivale a Pro durante o período).
 */
export function checkPlan(
  userPlan: Plan | null | undefined,
  minPlan: Plan,
  isAdmin = false,
  trialEndsAt?: string | null,
): boolean {
  if (isAdmin) return true;
  const plan = effectivePlan(userPlan, trialEndsAt);
  return PLAN_ORDER.indexOf(plan) >= PLAN_ORDER.indexOf(minPlan);
}

export function getLimits(
  userPlan: Plan | null | undefined,
  trialEndsAt?: string | null,
): PlanLimits {
  return PLANS[effectivePlan(userPlan, trialEndsAt)];
}

export function canUpgrade(userPlan: Plan | null | undefined): boolean {
  const p = userPlan || 'free';
  return p === 'free' || p === 'pro';
}

export function getUpgradeOptions(userPlan: Plan | null | undefined): ('pro' | 'enterprise')[] {
  const p = userPlan || 'free';
  if (p === 'free') return ['pro', 'enterprise'];
  if (p === 'pro') return ['enterprise'];
  return [];
}

export function canRenew(userPlan: Plan | null | undefined): boolean {
  const p = userPlan || 'free';
  return p === 'pro' || p === 'enterprise';
}
