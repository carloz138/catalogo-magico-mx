import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, userData: any) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // ✅ FUNCIÓN: Limpiar estado de auth
  const clearAuthState = () => {
    console.log('🧹 Limpiando estado de autenticación...');
    setSession(null);
    setUser(null);
    
    // Limpiar storage de Supabase
    try {
      localStorage.removeItem('sb-aibdxsebwhalbnugsqel-auth-token');
      sessionStorage.clear();
    } catch (error) {
      console.warn('Error limpiando storage:', error);
    }
  };

  // ✅ FUNCIÓN: Manejar eventos de auth (CORREGIDO)
  const handleAuthEvent = (event: AuthChangeEvent, session: Session | null) => {
    console.log(`🔐 Auth event: ${event}`, session ? 'Sesión válida' : 'Sin sesión');
    
    switch (event) {
      case 'SIGNED_IN':
        console.log('✅ Usuario autenticado:', session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        break;
        
      case 'SIGNED_OUT':
        console.log('👋 Usuario cerró sesión');
        clearAuthState();
        break;
        
      case 'TOKEN_REFRESHED':
        console.log('🔄 Token renovado exitosamente');
        setSession(session);
        setUser(session?.user ?? null);
        break;
        
      case 'USER_UPDATED':
        console.log('👤 Datos de usuario actualizados');
        if (session) {
          setSession(session);
          setUser(session.user);
        }
        break;

      // ✅ CORREGIDO: Manejar eventos adicionales específicos
      case 'INITIAL_SESSION':
        console.log('🔍 Sesión inicial detectada');
        if (session) {
          setSession(session);
          setUser(session.user);
        } else {
          clearAuthState();
        }
        break;

      case 'PASSWORD_RECOVERY':
        console.log('🔐 Recuperación de contraseña');
        // No cambiar estado en recuperación
        break;

      case 'MFA_CHALLENGE_VERIFIED':
        console.log('🔐 MFA verificado');
        if (session) {
          setSession(session);
          setUser(session.user);
        }
        break;
        
      default:
        // ✅ MANEJAR CASOS NO CUBIERTOS
        console.warn(`⚠️ Evento de auth no manejado: ${event}`);
        if (session) {
          setSession(session);
          setUser(session.user);
        } else if (event !== 'SIGNED_OUT' && event !== 'PASSWORD_RECOVERY') {
          console.log('🔥 Posible token expirado, limpiando estado...');
          clearAuthState();
        }
        break;
    }
  };

  useEffect(() => {
    console.log('🚀 Inicializando AuthProvider...');
    
    // ✅ Auth state listener con manejo de errores
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        try {
          handleAuthEvent(event, session);
        } catch (error) {
          console.error('❌ Error en auth state change:', error);
          clearAuthState();
        } finally {
          setLoading(false);
        }
      }
    );

    // ✅ Verificar sesión inicial con manejo de errores
    const initializeAuth = async () => {
      try {
        console.log('🔍 Verificando sesión inicial...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Error obteniendo sesión inicial:', error);
          
          // ✅ CRÍTICO: Si es error de refresh token, limpiar todo
          if (error.message?.includes('refresh') || error.status === 400) {
            console.log('🔥 Token de refresh inválido, limpiando autenticación...');
            clearAuthState();
          }
        } else if (session) {
          console.log('✅ Sesión inicial válida:', session.user?.email);
          setSession(session);
          setUser(session.user);
        } else {
          console.log('ℹ️ No hay sesión inicial');
          clearAuthState();
        }
      } catch (error) {
        console.error('❌ Error fatal inicializando auth:', error);
        clearAuthState();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Cleanup
    return () => {
      console.log('🧹 Limpiando subscription de auth...');
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      console.log('🔐 Intentando iniciar sesión...', email);
      setLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ Error en sign in:', error);
      } else {
        console.log('✅ Sign in exitoso:', data.user?.email);
      }

      return { error };
    } catch (error) {
      console.error('❌ Error fatal en sign in:', error);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, userData: any) => {
    try {
      console.log('📝 Intentando registrar usuario...', email);
      setLoading(true);
      
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: userData
        }
      });

      // If signup successful, create user profile
      if (data.user && !error) {
        try {
          const { error: profileError } = await supabase
            .from('users')
            .insert({
              id: data.user.id,
              email: email,
              full_name: userData.full_name,
              business_name: userData.business_name,
              phone: userData.phone,
            });
          
          if (profileError) {
            console.error('❌ Error creando perfil de usuario:', profileError);
          } else {
            console.log('✅ Perfil de usuario creado exitosamente');
          }
        } catch (profileError) {
          console.error('❌ Error fatal creando perfil:', profileError);
        }
      }

      if (error) {
        console.error('❌ Error en sign up:', error);
      } else {
        console.log('✅ Sign up exitoso:', data.user?.email);
      }

      return { error };
    } catch (error) {
      console.error('❌ Error fatal en sign up:', error);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      console.log('👋 Cerrando sesión...');
      setLoading(true);
      
      await supabase.auth.signOut();
      clearAuthState();
      
      console.log('✅ Sesión cerrada exitosamente');
    } catch (error) {
      console.error('❌ Error en sign out:', error);
      // Limpiar estado aunque haya error
      clearAuthState();
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      console.log('🔐 Intentando iniciar sesión con Google...');
      setLoading(true);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          skipBrowserRedirect: false
        }
      });

      if (error) {
        console.error('❌ Error en Google sign in:', error);
      } else {
        console.log('✅ Google sign in iniciado exitosamente');
      }

      return { error };
    } catch (error) {
      console.error('❌ Error fatal en Google sign in:', error);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const refreshSession = async () => {
    try {
      console.log('🔄 Renovando sesión manualmente...');
      setLoading(true);
      
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('❌ Error renovando sesión:', error);
        clearAuthState();
      } else {
        console.log('✅ Sesión renovada exitosamente');
        setSession(data.session);
        setUser(data.session?.user ?? null);
      }
    } catch (error) {
      console.error('❌ Error fatal renovando sesión:', error);
      clearAuthState();
    } finally {
      setLoading(false);
    }
  };

  // ✅ DEBUGGING: Log estado actual
  useEffect(() => {
    console.log('📊 Auth State:', {
      user: user?.email || 'No user',
      hasSession: !!session,
      loading,
      expiresAt: session?.expires_at ? new Date(session.expires_at * 1000) : 'No expiry'
    });
  }, [user, session, loading]);

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    refreshSession,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};