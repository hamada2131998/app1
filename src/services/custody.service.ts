
import { getSupabase } from '../lib/supabase';
import { Custody, CustodyTransaction } from '../types';

/**
 * جلب قائمة العُهد مع بيانات الموظفين
 */
export async function listCustodies(params?: { company_id?: string | null }): Promise<Custody[]> {
  const { client, error: initError } = getSupabase();
  if (initError || !client) throw new Error(initError || "Supabase client not initialized");

  const { data, error } = await client.rpc('list_custodies', {
    p_company_id: params?.company_id ?? null,
  });

  if (error) {
    if (error.code === 'PGRST301') throw new Error("SESSION_EXPIRED");
    throw error;
  }

  const rows = (data || []) as Array<Custody & { employee_name?: string | null }>;
  return rows.map((row) => ({
    ...row,
    employee: row.employee_name ? { id: row.user_id, full_name: row.employee_name } : undefined,
  })) as unknown as Custody[];
}

/**
 * جلب سجل المعاملات لعهدة معينة
 */
export async function listCustodyTransactions(custodyId: string): Promise<CustodyTransaction[]> {
  const { client, error: initError } = getSupabase();
  if (initError || !client) throw new Error(initError || "Supabase client not initialized");

  const { data, error } = await client.rpc('list_custody_transactions', {
    p_custody_id: custodyId,
  });

  if (error) throw error;
  return data as CustodyTransaction[];
}

/**
 * تنفيذ معاملة عهدة (إضافة، صرف، تسوية)
 */
export async function processCustodyTx(payload: {
  custody_id: string;
  type: 'ISSUE' | 'SPEND' | 'RETURN' | 'SETTLEMENT';
  amount: number;
  notes?: string;
}) {
  const { client, error: initError } = getSupabase();
  if (initError || !client) throw new Error(initError || "Supabase client not initialized");

  const { data, error } = await client.rpc('process_custody_transaction', {
    p_custody_id: payload.custody_id,
    p_type: payload.type,
    p_amount: payload.amount,
    p_notes: payload.notes
  });

  if (error) {
    if (error.message.includes('Insufficient')) {
      throw new Error("رصيد العهدة غير كافٍ لإتمام هذه العملية");
    }
    throw new Error(error.message || "فشل تنفيذ معاملة العهدة");
  }

  return data;
}

export async function getMyCustodyBalance(params: { company_id?: string | null }): Promise<number> {
  const { client, error: initError } = getSupabase();
  if (initError || !client) throw new Error(initError || "Supabase client not initialized");

  const { data, error } = await client.rpc('get_my_custody_balance', {
    p_company_id: params.company_id ?? null,
  });

  if (error) throw error;
  return Number(data || 0);
}
