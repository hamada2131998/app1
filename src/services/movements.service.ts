
import { getSupabase } from '../lib/supabase';
import { CashMovement, AuditLog } from '../types';

/**
 * جلب قائمة حركات الكاش
 */
export async function listMovements(): Promise<CashMovement[]> {
  const { client, error: initError } = getSupabase();
  if (initError || !client) throw new Error(initError || "Supabase client not initialized");

  const { data, error } = await client
    .from('cash_movements')
    .select(`
      *,
      category:categories(id, name, kind),
      account:cash_accounts(id, name, type)
    `)
    .order('movement_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    if (error.code === 'PGRST301' || error.message.includes('JWT')) {
      throw new Error("SESSION_EXPIRED");
    }
    throw error;
  }

  return data as unknown as CashMovement[];
}

/**
 * جلب تفاصيل حركة مالية واحدة مع البيانات المرتبطة
 */
export async function getMovementById(id: string): Promise<CashMovement> {
  const { client, error: initError } = getSupabase();
  if (initError || !client) throw new Error(initError || "Supabase client not initialized");

  const { data, error } = await client
    .from('cash_movements')
    .select(`
      *,
      category:categories(id, name, kind),
      account:cash_accounts(id, name, type, branch_id),
      branch:branches(id, name),
      creator:profiles!cash_movements_created_by_fkey(id, full_name),
      approver:profiles!cash_movements_approved_by_fkey(id, full_name)
    `)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST301') throw new Error("SESSION_EXPIRED");
    if (error.code === 'PGRST116') throw new Error("المستند غير موجود");
    throw error;
  }

  return data as unknown as CashMovement;
}

/**
 * جلب سجل التدقيق (Audit Logs) الخاص بحركة مالية معينة
 */
export async function getMovementAuditLogs(movementId: string): Promise<AuditLog[]> {
  const { client, error: initError } = getSupabase();
  if (initError || !client) throw new Error(initError || "Supabase client not initialized");

  const { data, error } = await client
    .from('audit_logs')
    .select(`
      *,
      actor:profiles!audit_logs_actor_id_fkey(id, full_name)
    `)
    .eq('entity_id', movementId)
    .eq('entity_type', 'CASH_MOVEMENT')
    .order('created_at', { ascending: true });

  if (error) {
    if (error.code === 'PGRST301') throw new Error("SESSION_EXPIRED");
    throw error;
  }

  return data as unknown as AuditLog[];
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

  const { data, error } = await client
    .from('cash_movements')
    .insert([payload])
    .select('id')
    .single();

  if (error) {
    if (error.code === 'PGRST301') throw new Error("SESSION_EXPIRED");
    if (error.code === '42501') throw new Error("ليس لديك صلاحية لإنشاء حركة في هذه الشركة");
    throw error;
  }

  return data.id;
}
