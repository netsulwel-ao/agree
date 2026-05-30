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
  maxCollaboratorsPerContract: number;
  hasSignatures: boolean;
  hasAnalytics: boolean;
  hasNegotiation: boolean;
  hasAiGeneration: boolean;
  maxTemplates: number; // 0 = basic only
  storageMbPerContract: number;
  maxVersions: number;
  hasPrioritySupport: boolean;
}

export const PLANS: Record<Plan, PlanLimits> = {
  free: {
    maxContracts: 3,
    maxCollaboratorsPerContract: 1,
    hasSignatures: false,
    hasAnalytics: false,
    hasNegotiation: false,
    hasAiGeneration: false,
    maxTemplates: 3,
    storageMbPerContract: 5,
    maxVersions: 3,
    hasPrioritySupport: false,
  },
  pro: {
    maxContracts: 50,
    maxCollaboratorsPerContract: 5,
    hasSignatures: true,
    hasAnalytics: true,
    hasNegotiation: true,
    hasAiGeneration: true,
    maxTemplates: 999,
    storageMbPerContract: 50,
    maxVersions: 50,
    hasPrioritySupport: false,
  },
  enterprise: {
    maxContracts: Infinity,
    maxCollaboratorsPerContract: Infinity,
    hasSignatures: true,
    hasAnalytics: true,
    hasNegotiation: true,
    hasAiGeneration: true,
    maxTemplates: Infinity,
    storageMbPerContract: 500,
    maxVersions: Infinity,
    hasPrioritySupport: true,
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
