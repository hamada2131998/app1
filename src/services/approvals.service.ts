import { getSupabase } from '../lib/supabase';
import { CashMovement } from '../types';

/**
 * جلب جميع الحركات المعلقة بانتظار الاعتماد
 */
export async function listPendingMovements(companyId?: string | null): Promise<CashMovement[]> {
  const { client, error: initError } = getSupabase();
  if (initError || !client) throw new Error(initError || "Supabase client not initialized");

  const { data, error } = await client.rpc('list_pending_movements', {
    p_company_id: companyId ?? null
  });

  if (error) {
    if (error.code === 'PGRST301') throw new Error("SESSION_EXPIRED");
    throw error;
  }

  const rows = (data || []) as Array<{
    id: string;
    amount: number;
    movement_date: string;
    notes?: string | null;
    created_at: string;
    creator_name?: string | null;
    type?: string | null;
    category_id?: string | null;
    category_name?: string | null;
    category_kind?: string | null;
    account_id?: string | null;
    account_name?: string | null;
    account_type?: string | null;
  }>;

  return rows.map((row) => ({
    id: row.id,
    amount: row.amount,
    movement_date: row.movement_date,
    notes: row.notes || undefined,
    created_at: row.created_at,
    type: row.type || undefined,
    category_id: row.category_id || undefined,
    account_id: row.account_id || undefined,
    category: row.category_name ? { id: row.category_id || '', name: row.category_name, kind: row.category_kind as any } : undefined,
    account: row.account_name ? { id: row.account_id || '', name: row.account_name, type: row.account_type as any } : undefined,
    creator: row.creator_name ? { id: '', full_name: row.creator_name } : undefined,
  })) as unknown as CashMovement[];
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
