// =====================================================
// COMPANY CONTEXT - USER ROLE & COMPANY DATA
// Fetches user_roles from Supabase after login
// Blocks app rendering until company context is loaded
// =====================================================

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { AppRole } from '@/data/roles';

interface CompanyContextType {
  company_id: string | null;
  branch_id: string | null;
  role: AppRole | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const CompanyContext = createContext<CompanyContextType>({
  company_id: null,
  branch_id: null,
  role: null,
  isLoading: true,
  error: null,
  refetch: async () => {},
});

interface UserRoleRow {
  id: string;
  user_id: string;
  company_id: string;
  role: AppRole;
  branch_id: string | null;
  granted_at: string;
  expires_at: string | null;
}

export function CompanyProvider({ children }: { children: ReactNode }) {
  const [company_id, setCompanyId] = useState<string | null>(null);
  const [branch_id, setBranchId] = useState<string | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserRole = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('[CompanyContext] Session error:', sessionError);
        setError('فشل في جلب الجلسة');
        return;
      }

      if (!session?.user) {
        console.log('[CompanyContext] No authenticated user');
        // Clear all values when no user
        setCompanyId(null);
        setBranchId(null);
        setRole(null);
        return;
      }

      const userId = session.user.id;
      console.log('[CompanyContext] Fetching role for user:', userId);

      // Fetch user_roles where user_id = auth.uid()
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('id, user_id, company_id, role, branch_id, granted_at, expires_at')
        .eq('user_id', userId)
        .order('granted_at', { ascending: false });

      if (rolesError) {
        console.error('[CompanyContext] Error fetching user_roles:', rolesError);
        setError('فشل في جلب صلاحيات المستخدم');
        return;
      }

      if (!userRoles || userRoles.length === 0) {
        console.warn('[CompanyContext] No roles found for user:', userId);
        // User exists but has no roles assigned
        setCompanyId(null);
        setBranchId(null);
        setRole(null);
        setError('لم يتم تعيين صلاحيات لهذا الحساب');
        return;
      }

      // Use the most recent active role (first one after ordering by granted_at DESC)
      // Filter out expired roles
      const now = new Date().toISOString();
      const activeRoles = userRoles.filter((r: UserRoleRow) => 
        !r.expires_at || r.expires_at > now
      );

      if (activeRoles.length === 0) {
        console.warn('[CompanyContext] All roles expired for user:', userId);
        setError('انتهت صلاحية جميع الأدوار المعينة');
        return;
      }

      const primaryRole = activeRoles[0] as UserRoleRow;
      console.log('[CompanyContext] Primary role found:', primaryRole);

      setCompanyId(primaryRole.company_id);
      setBranchId(primaryRole.branch_id);
      setRole(primaryRole.role as AppRole);

    } catch (err) {
      console.error('[CompanyContext] Unexpected error:', err);
      setError('حدث خطأ غير متوقع');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch on mount
  useEffect(() => {
    fetchUserRole();
  }, [fetchUserRole]);

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[CompanyContext] Auth state changed:', event);
      
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        // Defer Supabase call to avoid deadlock
        setTimeout(() => {
          fetchUserRole();
        }, 0);
      } else if (event === 'SIGNED_OUT') {
        setCompanyId(null);
        setBranchId(null);
        setRole(null);
        setIsLoading(false);
        setError(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchUserRole]);

  return (
    <CompanyContext.Provider
      value={{
        company_id,
        branch_id,
        role,
        isLoading,
        error,
        refetch: fetchUserRole,
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany(): CompanyContextType {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
}

// Utility hook to check if company context is ready
export function useCompanyReady(): boolean {
  const { isLoading, company_id, role } = useCompany();
  return !isLoading && company_id !== null && role !== null;
}
