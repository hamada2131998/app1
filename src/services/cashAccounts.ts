import { supabase, requireCompanyId } from './supabaseUtils';
import type { CashAccountRow } from '@/types/db';

export async function listCashAccounts(params: {
  company_id: string;
  branch_id?: string | null;
  activeOnly?: boolean;
}): Promise<CashAccountRow[]> {
  const cId = requireCompanyId(params.company_id);
  const { data, error } = await supabase.rpc('list_cash_accounts', {
    p_company_id: cId,
    p_branch_id: params.branch_id ?? null,
    p_active_only: params.activeOnly ?? null,
  });
  if (error) throw error;
  return (data || []) as CashAccountRow[];
}

export async function createCashAccount(params: {
  company_id: string;
  branch_id?: string | null;
  name: string;
}): Promise<CashAccountRow> {
  const cId = requireCompanyId(params.company_id);
  const { data, error } = await supabase.rpc('create_cash_account', {
    p_company_id: cId,
    p_branch_id: params.branch_id ?? null,
    p_name: params.name,
  });
  if (error) throw error;
  return data as CashAccountRow;
}

export async function toggleCashAccountActive(params: { company_id: string; id: string; is_active: boolean }) {
  const cId = requireCompanyId(params.company_id);
  const { error } = await supabase.rpc('toggle_cash_account_active', {
    p_company_id: cId,
    p_account_id: params.id,
    p_is_active: params.is_active,
  });
  if (error) throw error;
}
