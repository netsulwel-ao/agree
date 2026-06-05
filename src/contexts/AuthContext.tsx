import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { User, Session } from '@supabase/supabase-js';
import { useGlobalLoading } from './GlobalLoadingContext';
import type { Plan } from '../lib/plans';
import { isTrialActive } from '../lib/plans';
import { setSentryUser } from '../lib/sentry';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  role: string | null;
  plan: Plan;
  planExpiresAt: string | null;
  trialEndsAt: string | null;
  isInTrial: boolean;
  isBlocked: boolean;
  isAdmin: boolean;
  onboardingCompleted: boolean;
  setOnboardingCompleted: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  role: null,
  plan: 'free',
  planExpiresAt: null,
  trialEndsAt: null,
  isInTrial: false,
  isBlocked: false,
  isAdmin: false,
  onboardingCompleted: false,
  setOnboardingCompleted: async () => {},
  signOut: async () => {},
  refreshProfile: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const [plan, setPlan] = useState<Plan>('free');
  const [planExpiresAt, setPlanExpiresAt] = useState<string | null>(null);
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [onboardingCompleted, setOnboardingCompletedState] = useState(false);
  const { setIsLoading: setGlobalLoading } = useGlobalLoading();

  const fetchProfile = useCallback(async (userId: string) => {
    // Uma única query busca todos os campos necessários — evita dois roundtrips
    const { data } = await supabase
      .from('profiles')
      .select('role, plan, plan_activated_at, plan_expires_at, trial_ends_at, is_blocked, onboarding_completed')
      .eq('id', userId)
      .maybeSingle();

    if (!data) return;

    // Utilizador bloqueado — faz logout imediatamente antes de actualizar qualquer estado
    if (data.is_blocked === true) {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setRole(null);
      setPlan('free');
      setPlanExpiresAt(null);
      setTrialEndsAt(null);
      setIsBlocked(false);
      return;
    }

    setRole(data.role || 'user');
    const p = (data.plan as Plan) || 'free';
    setPlan(p === 'pro' || p === 'enterprise' ? p : 'free');
    setPlanExpiresAt(data.plan_expires_at || null);
    setTrialEndsAt(data.trial_ends_at || null);
    setIsBlocked(false);
    setOnboardingCompletedState(data.onboarding_completed === true);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user.id);
  }, [user, fetchProfile]);

  const handleUserChange = useCallback(async (userId: string | null, email?: string) => {
    if (userId) {
      await fetchProfile(userId);
      setSentryUser(userId, email);
    } else {
      setRole(null);
      setPlan('free');
      setPlanExpiresAt(null);
      setTrialEndsAt(null);
      setIsBlocked(false);
      setOnboardingCompletedState(false);
      setSentryUser(null);
    }
  }, [fetchProfile]);

  useEffect(() => {
    let cancelled = false;
    // Carrega a sessão inicial e aguarda o perfil antes de marcar isLoading=false
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (cancelled) return;
      setSession(session);
      setUser(session?.user ?? null);
      await handleUserChange(session?.user?.id ?? null, session?.user?.email);
      setIsLoading(false);
    }).catch(() => {
      if (!cancelled) setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      await handleUserChange(session?.user?.id ?? null, session?.user?.email);
      setIsLoading(false);
    });

    return () => { cancelled = true; subscription.unsubscribe(); };
  }, [handleUserChange]);

  const signOut = async () => {
    setGlobalLoading(true);
    await supabase.auth.signOut();
    setGlobalLoading(false);
  };

  const isAdmin = role === 'admin';
  const isInTrial = isTrialActive(trialEndsAt) && plan === 'free';

  // Marca o onboarding como concluído na BD e actualiza o estado local
  const setOnboardingCompleted = useCallback(async () => {
    if (!user) return;
    setOnboardingCompletedState(true);
    await supabase
      .from('profiles')
      .update({ onboarding_completed: true })
      .eq('id', user.id);
  }, [user]);

  return (
    <AuthContext.Provider value={{
      user, session, isLoading, role, plan, planExpiresAt, trialEndsAt,
      isInTrial, isBlocked, isAdmin, onboardingCompleted, setOnboardingCompleted,
      signOut, refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
