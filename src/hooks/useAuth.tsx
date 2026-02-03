// ============================================
// HOOK DE AUTENTICAÇÃO - PDV MÁGICO PRO
// ============================================

import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import {
  supabase,
  signIn,
  signUp,
  signOut,
  getSession,
  getProfile,
  type Profile,
} from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  companyName: string;
  document: string;
  phone: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Inicializar autenticação
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Verificar sessão existente
        const currentSession = await getSession();
        setSession(currentSession);

        if (currentSession?.user) {
          setUser(currentSession.user);
          const userProfile = await getProfile(currentSession.user.id);
          setProfile(userProfile);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Escutar mudanças de autenticação
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          const userProfile = await getProfile(newSession.user.id);
          setProfile(userProfile);
        } else {
          setProfile(null);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { user: loggedUser } = await signIn(email, password);
      if (loggedUser) {
        setUser(loggedUser);
        const userProfile = await getProfile(loggedUser.id);
        setProfile(userProfile);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    setIsLoading(true);
    try {
      await signUp(
        data.email,
        data.password,
        data.companyName,
        data.document,
        data.phone
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await signOut();
      setUser(null);
      setProfile(null);
      setSession(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      const userProfile = await getProfile(user.id);
      setProfile(userProfile);
    }
  }, [user]);

  const value: AuthContextType = {
    user,
    profile,
    session,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
