import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { getSupabase } from '../lib/supabase';
import { getMyMembership } from '../services/auth.service';

interface AuthContextType {
  session: any | null;
  membership: { company_id: string; role: string; company_name: string } | null;
  loading: boolean;
  envError: string | null;
  refreshMembership: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<any | null>(null);
  const [membership, setMembership] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [envError, setEnvError] = useState<string | null>(null);

  const refreshMembership = async () => {
    try {
      const data = await getMyMembership();
      setMembership(data);
    } catch (err) {
      console.error("خطأ في جلب بيانات العضوية:", err);
      setMembership(null);
    }
  };

  useEffect(() => {
    const { client, error } = getSupabase();
    
    if (error || !client) {
      setEnvError(error);
      setLoading(false);
      return;
    }

    const initializeAuth = async () => {
      try {
        const { data, error: sessionError } = await client.auth.getSession();
        if (sessionError) throw sessionError;
        
        const currentSession = data?.session;
        setSession(currentSession);
        
        if (currentSession) {
          await refreshMembership();
        }
      } catch (err) {
        console.warn("تعذر استرجاع الجلسة الأولية:", err);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = client.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      if (newSession) {
        setLoading(true);
        await refreshMembership();
        setLoading(false);
      } else {
        setMembership(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ session, membership, loading, envError, refreshMembership }}>
      {children}
    </AuthContext.Provider>
  );
};