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
  error: string | null;
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
  const [error, setError] = useState<string | null>(null);

  // Inicializar autenticação
  useEffect(() => {
    let isMounted = true;
    
    const initAuth = async () => {
      try {
        // Verificar sessão existente
        const currentSession = await getSession();
        
        if (!isMounted) return;
        
        setSession(currentSession);

        if (currentSession?.user) {
          setUser(currentSession.user);
          try {
            const userProfile = await getProfile(currentSession.user.id);
            if (isMounted) setProfile(userProfile);
          } catch (profileError) {
            console.warn('Profile not found, using default:', profileError);
            // Criar perfil padrão se não existir
            if (isMounted) {
              setProfile({
                id: currentSession.user.id,
                company_name: 'Minha Empresa',
                document: '00000000000',
                phone: '00000000000',
                email: currentSession.user.email || '',
                plan: 'trial',
                status: 'active',
                valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                next_billing: null,
                is_trial: true,
                payment_method: 'pending',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                settings: {},
              });
            }
          }
        }
      } catch (error: any) {
        console.error('Error initializing auth:', error);
        if (isMounted) setError(error.message || 'Erro ao inicializar autenticação');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    initAuth();
    
    // Timeout de segurança para garantir que isLoading sempre termine
    const timeout = setTimeout(() => {
      if (isMounted) {
        setIsLoading(false);
      }
    }, 3000);
    
    return () => {
      isMounted = false;
      clearTimeout(timeout);
    };

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
    error,
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
