import { supabase, requireCompanyId } from './supabaseUtils';

export interface DashboardStats {
  totalIn: number;
  totalOut: number;
  net: number;
  pendingCount: number; // SUBMITTED
}

export async function getDashboardStats(params: {
  company_id: string;
  branch_id?: string | null;
  fromDate?: string;
  toDate?: string;
}): Promise<DashboardStats> {
  const cId = requireCompanyId(params.company_id);
  const { data, error } = await supabase.rpc('get_dashboard_kpis', {
    p_company_id: cId,
    p_branch_id: params.branch_id ?? null,
  });
  if (error) throw error;
  const payload = data as {
    total_in?: number;
    total_out?: number;
    net?: number;
    pending_count?: number;
  } | null;

  const totalIn = Number(payload?.total_in ?? 0);
  const totalOut = Number(payload?.total_out ?? 0);
  const pendingCount = Number(payload?.pending_count ?? 0);

  return {
    totalIn,
    totalOut,
    net: Number(payload?.net ?? totalIn - totalOut),
    pendingCount,
  };
}
