
import { getSupabase } from '../lib/supabase';
import { CashMovement, AuditLog } from '../types';

/**
 * جلب قائمة حركات الكاش
 */
export async function listMovements(): Promise<CashMovement[]> {
  const { client, error: initError } = getSupabase();
  if (initError || !client) throw new Error(initError || "Supabase client not initialized");

  const { data, error } = await client.rpc('list_movements');

  if (error) {
    if (error.code === 'PGRST301' || error.message.includes('JWT')) {
      throw new Error("SESSION_EXPIRED");
    }
    throw error;
  }

  const rows = (data || []) as Array<CashMovement & { category_name?: string; category_kind?: string; account_name?: string; account_type?: string }>;
  return rows.map((row) => ({
    ...row,
    category: row.category_name ? { id: row.category_id, name: row.category_name, kind: row.category_kind as any } : undefined,
    account: row.account_name ? { id: row.account_id, name: row.account_name, type: row.account_type as any } : undefined,
  })) as unknown as CashMovement[];
}

/**
 * جلب تفاصيل حركة مالية واحدة مع البيانات المرتبطة
 */
export async function getMovementById(id: string): Promise<CashMovement> {
  const { client, error: initError } = getSupabase();
  if (initError || !client) throw new Error(initError || "Supabase client not initialized");

  const { data, error } = await client.rpc('get_movement_by_id', {
    p_movement_id: id,
  });

  if (error) {
    if (error.code === 'PGRST301') throw new Error("SESSION_EXPIRED");
    if (error.code === 'PGRST116') throw new Error("المستند غير موجود");
    throw error;
  }

  const row = (Array.isArray(data) ? data[0] : data) as CashMovement & {
    category_name?: string;
    category_kind?: string;
    account_name?: string;
    account_type?: string;
    account_branch_id?: string | null;
    branch_name?: string | null;
    creator_name?: string | null;
    approver_name?: string | null;
  };

  if (!row) {
    throw new Error("المستند غير موجود");
  }

  return {
    ...row,
    category: row.category_name ? { id: row.category_id, name: row.category_name, kind: row.category_kind as any } : undefined,
    account: row.account_name ? { id: row.account_id, name: row.account_name, type: row.account_type as any, branch_id: row.account_branch_id || undefined } : undefined,
    branch: row.branch_name ? { id: row.branch_id as any, name: row.branch_name } : undefined,
    creator: row.creator_name ? { id: row.created_by, full_name: row.creator_name } : undefined,
    approver: row.approver_name ? { id: row.approved_by as any, full_name: row.approver_name } : undefined,
  } as unknown as CashMovement;
}

/**
 * جلب سجل التدقيق (Audit Logs) الخاص بحركة مالية معينة
 */
export async function getMovementAuditLogs(movementId: string): Promise<AuditLog[]> {
  const { client, error: initError } = getSupabase();
  if (initError || !client) throw new Error(initError || "Supabase client not initialized");

  const { data, error } = await client.rpc('get_movement_audit_logs', {
    p_movement_id: movementId,
  });

  if (error) {
    if (error.code === 'PGRST301') throw new Error("SESSION_EXPIRED");
    throw error;
  }

  const rows = (data || []) as Array<AuditLog & { actor_name?: string | null }>;
  return rows.map((row) => ({
    ...row,
    actor: row.actor_name ? { id: row.actor_id, full_name: row.actor_name } : undefined,
  })) as unknown as AuditLog[];
}

/**
 * إنشاء حركة كاش آمنة
 */
export async function createMovement(payload: {
  account_id: string;
  category_id: string;
  type: string;
  amount: number;
  movement_date: string;
  notes?: string;
  reference?: string;
  payment_method: string;
  status: string;
}): Promise<string> {
  const { client, error: initError } = getSupabase();
  if (initError || !client) throw new Error(initError || "Supabase client not initialized");

  const { data, error } = await client.rpc('create_movement', {
    p_account_id: payload.account_id,
    p_category_id: payload.category_id,
    p_type: payload.type,
    p_amount: payload.amount,
    p_movement_date: payload.movement_date,
    p_notes: payload.notes ?? null,
    p_reference: payload.reference ?? null,
    p_payment_method: payload.payment_method,
    p_status: payload.status,
  });

  if (error) {
    if (error.code === 'PGRST301') throw new Error("SESSION_EXPIRED");
    if (error.code === '42501') throw new Error("ليس لديك صلاحية لإنشاء حركة في هذه الشركة");
    throw error;
  }

  return data as string;
}
