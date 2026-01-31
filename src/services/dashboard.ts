import { supabase, requireCompanyId } from './supabaseUtils';
import type { MovementType } from '@/types/db';

export interface DashboardStats {
  totalIn: number;
  totalOut: number;
  net: number;
  pendingCount: number; // SUBMITTED
}

async function sumByType(params: { company_id: string; branch_id?: string | null; fromDate?: string; toDate?: string; type: MovementType; created_by?: string | null }) {
  const cId = requireCompanyId(params.company_id);
  let q = supabase
    .from('cash_movements')
    .select('amount.sum()', { head: false })
    .eq('company_id', cId)
    .eq('type', params.type)
    .eq('status', 'APPROVED');
  if (params.branch_id) q = q.eq('branch_id', params.branch_id);
  if (params.created_by) q = q.eq('created_by', params.created_by);
  if (params.fromDate) q = q.gte('movement_date', params.fromDate);
  if (params.toDate) q = q.lte('movement_date', params.toDate);

  const { data, error } = await q;
  if (error) throw error;
  const sum = (data?.[0] as any)?.sum ?? (data?.[0] as any)?.amount?.sum;
  return Number(sum || 0);
}

export async function getDashboardStats(params: {
  company_id: string;
  branch_id?: string | null;
  created_by?: string | null;
  fromDate?: string;
  toDate?: string;
}): Promise<DashboardStats> {
  const [totalIn, totalOut] = await Promise.all([
    sumByType({ ...params, type: 'IN' }),
    sumByType({ ...params, type: 'OUT' }),
  ]);

  const cId = requireCompanyId(params.company_id);
  let pendingQ = supabase
    .from('cash_movements')
    .select('id', { count: 'exact', head: true })
    .eq('company_id', cId)
    .eq('status', 'SUBMITTED');
  if (params.branch_id) pendingQ = pendingQ.eq('branch_id', params.branch_id);
  if (params.created_by) pendingQ = pendingQ.eq('created_by', params.created_by);
  if (params.fromDate) pendingQ = pendingQ.gte('movement_date', params.fromDate);
  if (params.toDate) pendingQ = pendingQ.lte('movement_date', params.toDate);

  const { count, error } = await pendingQ;
  if (error) throw error;

  return {
    totalIn,
    totalOut,
    net: totalIn - totalOut,
    pendingCount: count || 0,
  };
}
