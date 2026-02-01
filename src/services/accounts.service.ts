import { getSupabase } from '../lib/supabase';
import { CashAccount } from '../types';

/**
 * جلب قائمة الحسابات النقدية والخزائن التابعة للشركة
 */
export async function listCashAccounts(): Promise<CashAccount[]> {
  const { client, error: initError } = getSupabase();
  if (initError || !client) throw new Error(initError || "Supabase client not initialized");

  const { data, error } = await client.rpc('list_cash_accounts', {
    p_company_id: null,
    p_branch_id: null,
    p_active_only: null,
  });

  if (error) {
    if (error.code === 'PGRST301') throw new Error("SESSION_EXPIRED");
    throw error;
  }

  return data as CashAccount[];
}
