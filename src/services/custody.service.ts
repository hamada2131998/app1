
import { getSupabase } from '../lib/supabase';
import { Custody, CustodyTransaction } from '../types';
import type { AppRole } from '@/data/roles';

/**
 * جلب قائمة العُهد مع بيانات الموظفين
 */
export async function listCustodies(params: {
  company_id: string;
  user_id: string;
  role: AppRole;
}): Promise<Custody[]> {
  const { client, error: initError } = getSupabase();
  if (initError || !client) throw new Error(initError || "Supabase client not initialized");

  // نجلب العهد ونحسب الرصيد يدوياً أو عبر استدعاء RPC لكل عنصر (الأفضل RPC لإعطاء مصدر الحقيقة)
  let query = client
    .from('custodies')
    .select(`
      *,
      employee:profiles!custodies_user_id_fkey(id, full_name)
    `)
    .eq('company_id', params.company_id)
    .eq('is_active', true);

  if (params.role === 'employee') {
    query = query.eq('user_id', params.user_id);
  }

  const { data, error } = await query;

  if (error) {
    if (error.code === 'PGRST301') throw new Error("SESSION_EXPIRED");
    throw error;
  }

  // إثراء البيانات بالأرصدة الحالية
  const custodiesWithBalances = await Promise.all(data.map(async (c) => {
    const { data: balance } = await client.rpc('get_custody_balance', { p_custody_id: c.id });
    return { ...c, current_balance: balance || 0 };
  }));

  return custodiesWithBalances as unknown as Custody[];
}

/**
 * جلب سجل المعاملات لعهدة معينة
 */
export async function listCustodyTransactions(custodyId: string): Promise<CustodyTransaction[]> {
  const { client, error: initError } = getSupabase();
  if (initError || !client) throw new Error(initError || "Supabase client not initialized");

  const { data, error } = await client
    .from('custody_transactions')
    .select('*')
    .eq('custody_id', custodyId)
    .order('created_at', { ascending: false });

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
