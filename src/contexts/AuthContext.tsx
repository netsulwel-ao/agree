import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { User, Session } from '@supabase/supabase-js';
import { useGlobalLoading } from './GlobalLoadingContext';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  role: string | null;
  isBlocked: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  role: null,
  isBlocked: false,
  isAdmin: false,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const { setIsLoading: setGlobalLoading } = useGlobalLoading();

  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('role, is_blocked')
      .eq('id', userId)
      .maybeSingle();
    if (data) {
      setRole(data.role || 'user');
      const blocked = !!data.is_blocked;
      setIsBlocked(blocked);
      if (blocked) {
        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
        setRole(null);
        setIsBlocked(false);
      }
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user.id);
  }, [user, fetchProfile]);

  const handleUserChange = useCallback(async (userId: string | null) => {
    if (userId) {
      await fetchProfile(userId);
    } else {
      setRole(null);
      setIsBlocked(false);
    }
  }, [fetchProfile]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      handleUserChange(session?.user?.id ?? null);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      handleUserChange(session?.user?.id ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [handleUserChange]);

  const signOut = async () => {
    setGlobalLoading(true, 'A sair da conta...');
    await supabase.auth.signOut();
    setGlobalLoading(false);
  };

  const isAdmin = role === 'admin';

  return (
    <AuthContext.Provider value={{ user, session, isLoading, role, isBlocked, isAdmin, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
