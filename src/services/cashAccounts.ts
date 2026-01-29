import { supabase, requireCompanyId } from './supabaseUtils';
import type { CashAccountRow } from '@/types/db';

export async function listCashAccounts(params: {
  company_id: string;
  branch_id?: string | null;
  activeOnly?: boolean;
}): Promise<CashAccountRow[]> {
  const cId = requireCompanyId(params.company_id);
  let q = supabase
    .from('cash_accounts')
    .select('id, company_id, branch_id, name, type, is_active')
    .eq('company_id', cId);
  if (params.branch_id) q = q.eq('branch_id', params.branch_id);
  if (params.activeOnly) q = q.eq('is_active', true);
  const { data, error } = await q.order('name', { ascending: true });
  if (error) throw error;
  return (data || []) as CashAccountRow[];
}

export async function createCashAccount(params: {
  company_id: string;
  branch_id?: string | null;
  name: string;
}): Promise<CashAccountRow> {
  const cId = requireCompanyId(params.company_id);
  const { data, error } = await supabase
    .from('cash_accounts')
    .insert({
      company_id: cId,
      branch_id: params.branch_id ?? null,
      name: params.name,
      type: 'CASH',
      is_active: true,
    })
    .select('id, company_id, branch_id, name, type, is_active')
    .single();
  if (error) throw error;
  return data as CashAccountRow;
}

export async function toggleCashAccountActive(params: { company_id: string; id: string; is_active: boolean }) {
  const cId = requireCompanyId(params.company_id);
  const { error } = await supabase
    .from('cash_accounts')
    .update({ is_active: params.is_active })
    .eq('company_id', cId)
    .eq('id', params.id);
  if (error) throw error;
}
