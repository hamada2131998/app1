import { getSupabase } from '../lib/supabase';
import { CashMovement } from '../types';

/**
 * جلب جميع الحركات المعلقة بانتظار الاعتماد
 */
export async function listPendingMovements(): Promise<CashMovement[]> {
  const { client, error: initError } = getSupabase();
  if (initError || !client) throw new Error(initError || "Supabase client not initialized");

  const { data, error } = await client
    .from('cash_movements')
    .select(`
      *,
      category:categories(id, name, kind),
      account:cash_accounts(id, name, type),
      creator:profiles!cash_movements_created_by_fkey(id, full_name)
    `)
    .eq('status', 'SUBMITTED')
    .order('created_at', { ascending: true });

  if (error) {
    if (error.code === 'PGRST301') throw new Error("SESSION_EXPIRED");
    throw error;
  }

  return data as unknown as CashMovement[];
}

/**
 * تنفيذ إجراء (اعتماد أو رفض) على حركة مالية
 */
export async function processApproval(movementId: string, action: 'APPROVED' | 'REJECTED', comment?: string) {
  const { client, error: initError } = getSupabase();
  if (initError || !client) throw new Error(initError || "Supabase client not initialized");

  const { data, error } = await client.rpc('process_movement_action', {
    p_movement_id: movementId,
    p_action: action,
    p_comment: comment
  });

  if (error) {
    if (error.code === 'PGRST301') throw new Error("SESSION_EXPIRED");
    throw new Error(error.message || "فشل تنفيذ الإجراء");
  }

  return data;
}