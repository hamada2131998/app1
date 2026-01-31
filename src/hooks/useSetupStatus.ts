import { useCallback, useEffect, useMemo, useState } from 'react';
import { getSupabase } from '@/lib/supabase';
import { useCompany } from '@/contexts/CompanyContext';

export type SetupCounts = {
  branches: number;
  costCenters: number;
  employees: number;
};

const defaultCounts: SetupCounts = {
  branches: 0,
  costCenters: 0,
  employees: 0,
};

export function useSetupStatus() {
  const { company_id } = useCompany();
  const [counts, setCounts] = useState<SetupCounts>(defaultCounts);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!company_id) return;
    const { client, error: initError } = getSupabase();
    if (initError || !client) {
      setError(initError || 'Supabase client not initialized');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [branchRes, costCenterRes, employeeRes] = await Promise.all([
        client.from('branches').select('id', { count: 'exact', head: true }).eq('company_id', company_id),
        client.from('cost_centers').select('id', { count: 'exact', head: true }).eq('company_id', company_id),
        client
          .from('user_roles')
          .select('user_id', { count: 'exact', head: true })
          .eq('company_id', company_id)
          .eq('role', 'employee'),
      ]);

      if (branchRes.error) throw branchRes.error;
      if (costCenterRes.error) throw costCenterRes.error;
      if (employeeRes.error) throw employeeRes.error;

      setCounts({
        branches: branchRes.count ?? 0,
        costCenters: costCenterRes.count ?? 0,
        employees: employeeRes.count ?? 0,
      });
    } catch (err: any) {
      setError(err?.message || 'فشل تحميل حالة الإعداد');
    } finally {
      setLoading(false);
    }
  }, [company_id]);

  useEffect(() => {
    if (!company_id) return;
    refresh();
  }, [company_id, refresh]);

  const isComplete = useMemo(() => {
    return counts.branches > 0 && counts.costCenters > 0 && counts.employees > 0;
  }, [counts]);

  return {
    counts,
    isComplete,
    loading,
    error,
    refresh,
  };
}
