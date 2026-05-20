import React, { createContext, useState, useEffect } from 'react';
import { supabase } from '../../data/datasources/supabase/client';
import { Session, User } from '@supabase/supabase-js';

export const AuthContext = createContext<{
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}>({ session: null, user: null, isLoading: true, signOut: async () => {} });

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkRoleAndSetSession = async (currentSession: Session | null) => {
      if (!currentSession) {
        setSession(null);
        setUser(null);
        setIsLoading(false);
        return;
      }
      
      // Valida se a sessão, de fato, pertence a um Admin checando o DB.
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', currentSession.user.id)
        .single();
        
      if (data?.role === 'admin') {
        setSession(currentSession);
        setUser(currentSession.user);
      } else {
        // Se cliente tentar logar no app admin, encerra a sessão.
        await supabase.auth.signOut();
        alert(`Acesso Negado: Apenas administradores podem entrar neste aplicativo.\nSeu Role atual: ${data?.role}\nErro DB: ${error?.message}`);
        setSession(null);
        setUser(null);
      }
      setIsLoading(false);
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      checkRoleAndSetSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if(_event === 'SIGNED_IN') {
        checkRoleAndSetSession(session);
      } else if (_event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user, isLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
