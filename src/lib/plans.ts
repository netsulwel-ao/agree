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
  // Novas features
  maxApiKeys: number;
  hasGoogleIntegration: boolean;
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
    hasGoogleIntegration: false,
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
    hasGoogleIntegration: true,
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
    hasGoogleIntegration: true,
    hasMultiCurrency: true,
    hasSignatureProviders: true,
    hasExternalSignatureProviders: true,
    hasCustomExchangeRates: true,
  },
};

const PLAN_ORDER: Plan[] = ['free', 'pro', 'enterprise'];

export function checkPlan(userPlan: Plan | null | undefined, minPlan: Plan, isAdmin = false): boolean {
  if (isAdmin) return true;
  if (!userPlan) return minPlan === 'free';
  return PLAN_ORDER.indexOf(userPlan) >= PLAN_ORDER.indexOf(minPlan);
}

export function getLimits(userPlan: Plan | null | undefined): PlanLimits {
  return PLANS[userPlan || 'free'];
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
