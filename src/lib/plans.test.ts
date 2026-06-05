import { describe, it, expect } from 'vitest';
import {
  checkPlan,
  getLimits,
  canUpgrade,
  canRenew,
  getUpgradeOptions,
  effectivePlan,
  isTrialActive,
  trialDaysRemaining,
  PLANS,
} from './plans';

// ─── Helpers ─────────────────────────────────────────

function futureDate(days: number): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

function pastDate(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

// ─── isTrialActive ────────────────────────────────────

describe('isTrialActive', () => {
  it('devolve false para null', () => {
    expect(isTrialActive(null)).toBe(false);
  });

  it('devolve false para undefined', () => {
    expect(isTrialActive(undefined)).toBe(false);
  });

  it('devolve true quando a data é futura', () => {
    expect(isTrialActive(futureDate(7))).toBe(true);
  });

  it('devolve false quando a data já passou', () => {
    expect(isTrialActive(pastDate(1))).toBe(false);
  });
});

// ─── trialDaysRemaining ───────────────────────────────

describe('trialDaysRemaining', () => {
  it('devolve 0 para null', () => {
    expect(trialDaysRemaining(null)).toBe(0);
  });

  it('devolve 0 para trial expirado', () => {
    expect(trialDaysRemaining(pastDate(2))).toBe(0);
  });

  it('devolve ~14 para trial de 14 dias', () => {
    const days = trialDaysRemaining(futureDate(14));
    expect(days).toBeGreaterThanOrEqual(13);
    expect(days).toBeLessThanOrEqual(14);
  });

  it('arredonda para cima (ceil)', () => {
    // 0.5 dia restante → devolve 1
    const halfDay = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString();
    expect(trialDaysRemaining(halfDay)).toBe(1);
  });
});

// ─── effectivePlan ────────────────────────────────────

describe('effectivePlan', () => {
  it('free sem trial → free', () => {
    expect(effectivePlan('free', null)).toBe('free');
  });

  it('free com trial activo → pro', () => {
    expect(effectivePlan('free', futureDate(7))).toBe('pro');
  });

  it('free com trial expirado → free', () => {
    expect(effectivePlan('free', pastDate(1))).toBe('free');
  });

  it('pro com trial activo → pro (trial não eleva além do plano real)', () => {
    expect(effectivePlan('pro', futureDate(7))).toBe('pro');
  });

  it('enterprise mantém-se independentemente do trial', () => {
    expect(effectivePlan('enterprise', futureDate(7))).toBe('enterprise');
  });

  it('null/undefined → free', () => {
    expect(effectivePlan(null, null)).toBe('free');
    expect(effectivePlan(undefined, null)).toBe('free');
  });
});

// ─── checkPlan ────────────────────────────────────────

describe('checkPlan', () => {
  it('free acede a free', () => {
    expect(checkPlan('free', 'free')).toBe(true);
  });

  it('free não acede a pro', () => {
    expect(checkPlan('free', 'pro')).toBe(false);
  });

  it('pro acede a pro', () => {
    expect(checkPlan('pro', 'pro')).toBe(true);
  });

  it('pro acede a free', () => {
    expect(checkPlan('pro', 'free')).toBe(true);
  });

  it('pro não acede a enterprise', () => {
    expect(checkPlan('pro', 'enterprise')).toBe(false);
  });

  it('enterprise acede a tudo', () => {
    expect(checkPlan('enterprise', 'pro')).toBe(true);
    expect(checkPlan('enterprise', 'enterprise')).toBe(true);
    expect(checkPlan('enterprise', 'free')).toBe(true);
  });

  it('admin acede a tudo independentemente do plano', () => {
    expect(checkPlan('free', 'enterprise', true)).toBe(true);
    expect(checkPlan(null, 'enterprise', true)).toBe(true);
  });

  it('free com trial activo acede a pro', () => {
    expect(checkPlan('free', 'pro', false, futureDate(7))).toBe(true);
  });

  it('free com trial activo não acede a enterprise', () => {
    expect(checkPlan('free', 'enterprise', false, futureDate(7))).toBe(false);
  });

  it('free com trial expirado não acede a pro', () => {
    expect(checkPlan('free', 'pro', false, pastDate(1))).toBe(false);
  });

  it('null/undefined → trata como free', () => {
    expect(checkPlan(null, 'free')).toBe(true);
    expect(checkPlan(undefined, 'pro')).toBe(false);
  });
});

// ─── getLimits ────────────────────────────────────────

describe('getLimits', () => {
  it('free devolve limites do free', () => {
    const limits = getLimits('free');
    expect(limits.maxContracts).toBe(3);
    expect(limits.hasSignatures).toBe(false);
  });

  it('pro devolve limites do pro', () => {
    const limits = getLimits('pro');
    expect(limits.maxContracts).toBe(50);
    expect(limits.hasSignatures).toBe(true);
    expect(limits.hasAnalytics).toBe(true);
  });

  it('enterprise devolve limites do enterprise', () => {
    const limits = getLimits('enterprise');
    expect(limits.maxContracts).toBe(Infinity);
    expect(limits.hasPrioritySupport).toBe(true);
  });

  it('free com trial activo devolve limites do pro', () => {
    const limits = getLimits('free', futureDate(7));
    expect(limits.maxContracts).toBe(PLANS.pro.maxContracts);
    expect(limits.hasSignatures).toBe(true);
  });

  it('free com trial expirado devolve limites do free', () => {
    const limits = getLimits('free', pastDate(1));
    expect(limits.maxContracts).toBe(3);
    expect(limits.hasSignatures).toBe(false);
  });

  it('null → limites do free', () => {
    expect(getLimits(null).maxContracts).toBe(3);
  });
});

// ─── canUpgrade ───────────────────────────────────────

describe('canUpgrade', () => {
  it('free pode fazer upgrade', () => expect(canUpgrade('free')).toBe(true));
  it('pro pode fazer upgrade', () => expect(canUpgrade('pro')).toBe(true));
  it('enterprise não pode fazer upgrade', () => expect(canUpgrade('enterprise')).toBe(false));
  it('null → trata como free', () => expect(canUpgrade(null)).toBe(true));
});

// ─── canRenew ─────────────────────────────────────────

describe('canRenew', () => {
  it('pro pode renovar', () => expect(canRenew('pro')).toBe(true));
  it('enterprise pode renovar', () => expect(canRenew('enterprise')).toBe(true));
  it('free não pode renovar', () => expect(canRenew('free')).toBe(false));
  it('null → trata como free', () => expect(canRenew(null)).toBe(false));
});

// ─── getUpgradeOptions ────────────────────────────────

describe('getUpgradeOptions', () => {
  it('free → [pro, enterprise]', () => {
    expect(getUpgradeOptions('free')).toEqual(['pro', 'enterprise']);
  });

  it('pro → [enterprise]', () => {
    expect(getUpgradeOptions('pro')).toEqual(['enterprise']);
  });

  it('enterprise → []', () => {
    expect(getUpgradeOptions('enterprise')).toEqual([]);
  });

  it('null → [pro, enterprise]', () => {
    expect(getUpgradeOptions(null)).toEqual(['pro', 'enterprise']);
  });
});

// ─── Limites: invariantes de negócio ─────────────────

describe('PLANS: invariantes de negócio', () => {
  it('enterprise tem mais contratos que pro', () => {
    expect(PLANS.enterprise.maxContracts).toBeGreaterThan(PLANS.pro.maxContracts);
  });

  it('pro tem mais contratos que free', () => {
    expect(PLANS.pro.maxContracts).toBeGreaterThan(PLANS.free.maxContracts);
  });

  it('enterprise tem mais armazenamento que pro', () => {
    expect(PLANS.enterprise.storageMbPerContract).toBeGreaterThan(PLANS.pro.storageMbPerContract);
  });

  it('free não tem assinaturas digitais', () => {
    expect(PLANS.free.hasSignatures).toBe(false);
  });

  it('pro e enterprise têm assinaturas digitais', () => {
    expect(PLANS.pro.hasSignatures).toBe(true);
    expect(PLANS.enterprise.hasSignatures).toBe(true);
  });

  it('enterprise tem API keys, pro tem 1, free tem 0', () => {
    expect(PLANS.free.maxApiKeys).toBe(0);
    expect(PLANS.pro.maxApiKeys).toBeGreaterThan(0);
    expect(PLANS.enterprise.maxApiKeys).toBeGreaterThan(PLANS.pro.maxApiKeys);
  });
});
