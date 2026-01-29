import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  full_name: string;
  full_name_ar?: string;
  email: string;
  phone?: string;
  employee_id?: string;
  avatar_url?: string;
  locale?: string;
  timezone?: string;
  is_active?: boolean;
  company_id?: string;
  branch_id?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refetchProfile: () => Promise<void>;
  isConfigured: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  loading: true,
  signIn: async () => ({ error: new Error('AuthProvider not mounted') }),
  signUp: async () => ({ error: new Error('AuthProvider not mounted') }),
  signOut: async () => {},
  refetchProfile: async () => {},
  isConfigured: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      console.log('[AuthProvider] Fetching profile for:', userId);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('[AuthProvider] Profile fetch error:', error);
        return null;
      }

      if (data) {
        console.log('[AuthProvider] Profile found:', data.full_name);
        setProfile(data as Profile);
        return data as Profile;
      } else {
        console.log('[AuthProvider] No profile found for user');
        return null;
      }
    } catch (err) {
      console.error('[AuthProvider] Unexpected profile fetch error:', err);
      return null;
    }
  }, []);

  useEffect(() => {
    console.log('[AuthProvider] Initializing Supabase auth...');

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('[AuthProvider] Auth state changed:', event);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Defer profile fetch to avoid deadlock
          setTimeout(() => {
            fetchProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('[AuthProvider] Initial session:', session ? 'exists' : 'none');
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('[AuthProvider] Sign in error:', error);
        return { error: new Error(translateAuthError(error.message)) };
      }

      return { error: null };
    } catch (err) {
      console.error('[AuthProvider] Unexpected sign in error:', err);
      return { error: new Error('حدث خطأ غير متوقع') };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        console.error('[AuthProvider] Sign up error:', error);
        return { error: new Error(translateAuthError(error.message)) };
      }

      return { error: null };
    } catch (err) {
      console.error('[AuthProvider] Unexpected sign up error:', err);
      return { error: new Error('حدث خطأ غير متوقع') };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('[AuthProvider] Sign out error:', error);
      }
      setProfile(null);
    } catch (err) {
      console.error('[AuthProvider] Unexpected sign out error:', err);
    }
  };

  const refetchProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      profile,
      loading, 
      signIn, 
      signUp,
      signOut,
      refetchProfile,
      isConfigured: true 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

// Translate common Supabase auth errors to Arabic
function translateAuthError(message: string): string {
  const translations: Record<string, string> = {
    'Invalid login credentials': 'بيانات الدخول غير صحيحة',
    'Email not confirmed': 'البريد الإلكتروني غير مفعّل',
    'User already registered': 'هذا البريد مسجل مسبقاً',
    'Password should be at least 6 characters': 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
    'Signup requires a valid password': 'يرجى إدخال كلمة مرور صالحة',
    'Unable to validate email address: invalid format': 'صيغة البريد الإلكتروني غير صحيحة',
    'Email rate limit exceeded': 'تم تجاوز الحد المسموح، يرجى المحاولة لاحقاً',
  };

  return translations[message] || message;
}
