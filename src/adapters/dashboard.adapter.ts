import { supabase, requireCompanyId } from '@/services/supabaseUtils';

export interface DashboardStats {
  totalIn: number;
  totalOut: number;
  net: number;
  pendingCount: number;
}

export type DashboardDataParams = {
  company_id: string;
  branch_id?: string | null;
  fromDate?: string;
  toDate?: string;
};

export async function getDashboardData(params: DashboardDataParams): Promise<DashboardStats> {
  const cId = requireCompanyId(params.company_id);
  try {
    const { data, error } = await supabase.rpc('get_dashboard_kpis', {
      p_company_id: cId,
      p_branch_id: params.branch_id ?? null,
    });

    if (error || !data) {
      return { totalIn: 0, totalOut: 0, net: 0, pendingCount: 0 };
    }

    const payload = data as {
      total_in?: number;
      total_out?: number;
      net?: number;
      pending_count?: number;
    };

    const totalIn = Number(payload.total_in ?? 0);
    const totalOut = Number(payload.total_out ?? 0);
    const pendingCount = Number(payload.pending_count ?? 0);

    return {
      totalIn,
      totalOut,
      net: Number(payload.net ?? totalIn - totalOut),
      pendingCount,
    };
  } catch {
    return { totalIn: 0, totalOut: 0, net: 0, pendingCount: 0 };
  }
}
