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
  isSuperAdmin: boolean;
  companyId: string | null;
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
  isSuperAdmin: false,
  companyId: null,
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
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const { setIsLoading: setGlobalLoading } = useGlobalLoading();

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      console.log('[Auth] Fetching profile for user:', userId);
      console.log('[Auth] Starting Supabase query for profile...');
      const startTime = Date.now();

      // Check cache first for faster auth
      const cacheKey = `profile_${userId}`;
      const cachedProfile = localStorage.getItem(cacheKey);
      if (cachedProfile) {
        try {
          const { data: cachedData, timestamp } = JSON.parse(cachedProfile);
          // Use cache if less than 5 minutes old
          if (Date.now() - timestamp < 300000) {
            console.log('[Auth] Using cached profile data');
            setRole(cachedData.role || 'user');
            const p = (cachedData.plan as Plan) || 'free';
            setPlan(p === 'pro' || p === 'enterprise' ? p : 'free');
            setPlanExpiresAt(cachedData.plan_expires_at || null);
            setTrialEndsAt(cachedData.trial_ends_at || null);
            setIsBlocked(false);
            setOnboardingCompletedState(cachedData.onboarding_completed === true);
            setIsSuperAdmin(cachedData.is_super_admin === true);
            setCompanyId(cachedData.company_id || null);
            return;
          }
        } catch (e) {
          console.warn('[Auth] Cache parse error, fetching fresh data');
        }
      }

      // Reduced timeout to 5 seconds for faster auth
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Query timeout after 5s')), 5000);
      });

      // Uma única query busca todos os campos necessários — evita dois roundtrips
      const queryPromise = supabase
        .from('profiles')
        .select('role, plan, plan_activated_at, plan_expires_at, trial_ends_at, is_blocked, onboarding_completed, is_super_admin, company_id')
        .eq('id', userId)
        .maybeSingle();

      const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any;
      console.log('[Auth] Supabase query completed in', Date.now() - startTime, 'ms');
      console.log('[Auth] Query result:', { data, error });

      if (error) {
        console.error('[Auth] Error fetching profile:', error);
        // Try to use cached data even if stale
        if (cachedProfile) {
          try {
            const { data: cachedData } = JSON.parse(cachedProfile);
            setRole(cachedData.role || 'user');
            const p = (cachedData.plan as Plan) || 'free';
            setPlan(p === 'pro' || p === 'enterprise' ? p : 'free');
            setPlanExpiresAt(cachedData.plan_expires_at || null);
            setTrialEndsAt(cachedData.trial_ends_at || null);
            setIsBlocked(false);
            setOnboardingCompletedState(cachedData.onboarding_completed === true);
            setIsSuperAdmin(cachedData.is_super_admin === true);
            setCompanyId(cachedData.company_id || null);
            return;
          } catch (e) {
            console.warn('[Auth] Stale cache also failed');
          }
        }
        // Não falhar completamente - usar valores padrão
        setRole('user');
        setPlan('free');
        setPlanExpiresAt(null);
        setTrialEndsAt(null);
        setIsBlocked(false);
        setOnboardingCompletedState(false);
        setIsSuperAdmin(false);
        setCompanyId(null);
        return;
      }

      if (!data) {
        console.warn('[Auth] No profile found for user:', userId);
        // Criar perfil padrão se não existir
        setRole('user');
        setPlan('free');
        setPlanExpiresAt(null);
        setTrialEndsAt(null);
        setIsBlocked(false);
        setOnboardingCompletedState(false);
        setIsSuperAdmin(false);
        setCompanyId(null);
        return;
      }

      console.log('[Auth] Profile loaded:', data);

      // Cache the profile data
      localStorage.setItem(cacheKey, JSON.stringify({ data, timestamp: Date.now() }));

      // Utilizador bloqueado — faz logout imediatamente antes de actualizar qualquer estado
      if (data.is_blocked === true) {
        console.warn('[Auth] User is blocked, signing out');
        // Clear all cached profile data
      if (user) {
        localStorage.removeItem(profile_);
      }
      // Clear all auth-related localStorage
      localStorage.removeItem('sb-auth-token');
      localStorage.removeItem('sb-refresh-token');
      await supabase.auth.signOut();
        setUser(null);
        setSession(null);
        setRole(null);
        setPlan('free');
        setPlanExpiresAt(null);
        setTrialEndsAt(null);
        setIsBlocked(false);
        setIsSuperAdmin(false);
        setCompanyId(null);
        return;
      }

      setRole(data.role || 'user');
      const p = (data.plan as Plan) || 'free';
      setPlan(p === 'pro' || p === 'enterprise' ? p : 'free');
      setPlanExpiresAt(data.plan_expires_at || null);
      setTrialEndsAt(data.trial_ends_at || null);
      setIsBlocked(false);
      setOnboardingCompletedState(data.onboarding_completed === true);
      setIsSuperAdmin(data.is_super_admin === true);
      setCompanyId(data.company_id || null);
    } catch (error: any) {
      console.error('[Auth] Unexpected error in fetchProfile:', error);
      // Try to use cached data on error
      const cacheKey = `profile_${userId}`;
      const cachedProfile = localStorage.getItem(cacheKey);
      if (cachedProfile) {
        try {
          const { data: cachedData } = JSON.parse(cachedProfile);
          setRole(cachedData.role || 'user');
          const p = (cachedData.plan as Plan) || 'free';
          setPlan(p === 'pro' || p === 'enterprise' ? p : 'free');
          setPlanExpiresAt(cachedData.plan_expires_at || null);
          setTrialEndsAt(cachedData.trial_ends_at || null);
          setIsBlocked(false);
          setOnboardingCompletedState(cachedData.onboarding_completed === true);
          setIsSuperAdmin(cachedData.is_super_admin === true);
          setCompanyId(cachedData.company_id || null);
          return;
        } catch (e) {
          console.warn('[Auth] Cache fallback also failed');
        }
      }
      // Em caso de timeout ou erro, usar valores padrão para não bloquear a aplicação
      setRole('user');
      setPlan('free');
      setPlanExpiresAt(null);
      setTrialEndsAt(null);
      setIsBlocked(false);
      setOnboardingCompletedState(false);
      setIsSuperAdmin(false);
      setCompanyId(null);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user.id);
  }, [user, fetchProfile]);

  const handleUserChange = useCallback(async (userId: string | null, email?: string) => {
    try {
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
    } catch (error) {
      console.error('[Auth] Error in handleUserChange:', error);
      // Garantir que o estado seja limpo mesmo com erro
      setRole(null);
      setPlan('free');
      setPlanExpiresAt(null);
      setTrialEndsAt(null);
      setIsBlocked(false);
      setOnboardingCompletedState(false);
      setIsSuperAdmin(false);
      setCompanyId(null);
    }
  }, [fetchProfile]);

  useEffect(() => {
    // Security: Clear sensitive data on new tab detection
    const tabId = sessionStorage.getItem('auth_tab_id');
    if (!tabId) {
      // New tab detected - clear sensitive data
      sessionStorage.setItem('auth_tab_id', Date.now().toString());
      localStorage.removeItem('sb-auth-token');
      localStorage.removeItem('sb-refresh-token');
      // Clear all profile caches
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('profile_')) localStorage.removeItem(key);
      });
    }
    
    let cancelled = false;
    // Carrega a sessão inicial e aguarda o perfil antes de marcar isLoading=false
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (cancelled) return;
      setSession(session);
      setUser(session?.user ?? null);
      await handleUserChange(session?.user?.id ?? null, session?.user?.email);
      setIsLoading(false);
    }).catch(async () => {
      // Sess�o corrompida (ex: refresh token inv�lido) → limpa localStorage
      try { // Clear all cached profile data
      if (user) {
        localStorage.removeItem(profile_);
      }
      // Clear all auth-related localStorage
      localStorage.removeItem('sb-auth-token');
      localStorage.removeItem('sb-refresh-token');
      await supabase.auth.signOut(); } catch {}
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
    try {
      // Clear all cached profile data
      if (user) {
        localStorage.removeItem(profile_);
      }
      // Clear all auth-related localStorage
      localStorage.removeItem('sb-auth-token');
      localStorage.removeItem('sb-refresh-token');
      await supabase.auth.signOut();
    } catch {
      // ignora erros de rede/sess�o
    } finally {
      setGlobalLoading(false);
    }
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
      isInTrial, isBlocked, isAdmin, isSuperAdmin, companyId, onboardingCompleted, setOnboardingCompleted,
      signOut, refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};


