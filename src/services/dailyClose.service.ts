
import { getSupabase } from '../lib/supabase';

/**
 * جلب الرصيد المتوقع لحساب معين في تاريخ محدد
 */
export async function getExpectedBalance(accountId: string, closeDate: string): Promise<number> {
  const { client, error: initError } = getSupabase();
  if (initError || !client) throw new Error(initError || "Supabase client not initialized");

  const { data, error } = await client.rpc('get_expected_balance', {
    p_account_id: accountId,
    p_close_date: closeDate
  });

  if (error) {
    if (error.code === 'PGRST301') throw new Error("SESSION_EXPIRED");
    throw new Error(error.message || "فشل حساب الرصيد المتوقع");
  }

  return data as number;
}

/**
 * حفظ سجل إقفال جديد
 */
export async function createDailyClose(payload: {
  account_id: string;
  close_date: string;
  expected_balance: number;
  actual_balance: number;
  note?: string;
}) {
  const { client, error: initError } = getSupabase();
  if (initError || !client) throw new Error(initError || "Supabase client not initialized");

  const { data, error } = await client.rpc('create_daily_close', {
    p_account_id: payload.account_id,
    p_close_date: payload.close_date,
    p_expected_balance: payload.expected_balance,
    p_actual_balance: payload.actual_balance,
    p_note: payload.note ?? null,
  });

  if (error) {
    if (error.code === 'PGRST301') throw new Error("SESSION_EXPIRED");
    if (error.code === '23505') throw new Error("يوجد إقفال مسجل بالفعل لهذا الحساب في هذا التاريخ");
    throw new Error(error.message || "فشل تسجيل الإقفال");
  }

  return data;
}
