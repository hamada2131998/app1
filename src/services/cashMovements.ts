import { supabase, requireCompanyId } from './supabaseUtils';
import type { CashMovementRow, MovementStatus, MovementType } from '@/types/db';

export interface ListMovementsParams {
  company_id: string;
  branch_id?: string | null;
  status?: MovementStatus;
  type?: MovementType;
  fromDate?: string; // YYYY-MM-DD
  toDate?: string;   // YYYY-MM-DD
  limit?: number;
}

export async function listCashMovements(params: ListMovementsParams): Promise<CashMovementRow[]> {
  const cId = requireCompanyId(params.company_id);
  let q = supabase
    .from('cash_movements')
    .select(
      'id, company_id, branch_id, account_id, category_id, type, status, amount, movement_date, payment_method, notes, reference, created_by, created_at'
    )
    .eq('company_id', cId);

  if (params.branch_id) q = q.eq('branch_id', params.branch_id);
  if (params.status) q = q.eq('status', params.status);
  if (params.type) q = q.eq('type', params.type);
  if (params.fromDate) q = q.gte('movement_date', params.fromDate);
  if (params.toDate) q = q.lte('movement_date', params.toDate);
  q = q.order('movement_date', { ascending: false }).order('created_at', { ascending: false });
  if (params.limit) q = q.limit(params.limit);

  const { data, error } = await q;
  if (error) throw error;
  return (data || []) as CashMovementRow[];
}

export async function createCashMovement(params: {
  company_id: string;
  branch_id?: string | null;
  account_id: string;
  category_id: string;
  type: MovementType;
  amount: number;
  movement_date: string; // YYYY-MM-DD
  payment_method?: string;
  notes?: string | null;
  reference?: string | null;
}): Promise<CashMovementRow> {
  const cId = requireCompanyId(params.company_id);
  if (!(params.amount > 0)) throw new Error('amount must be > 0');

  const insertRow = {
    company_id: cId,
    branch_id: params.branch_id ?? null,
    account_id: params.account_id,
    category_id: params.category_id,
    type: params.type,
    status: 'DRAFT' as const,
    amount: params.amount,
    movement_date: params.movement_date,
    payment_method: params.payment_method ?? 'CASH',
    notes: params.notes ?? null,
    reference: params.reference ?? null,
    // created_by is handled by DB default (created_by=auth.uid()) per schema
  };

  const { data, error } = await supabase
    .from('cash_movements')
    .insert(insertRow)
    .select(
      'id, company_id, branch_id, account_id, category_id, type, status, amount, movement_date, payment_method, notes, reference, created_by, created_at'
    )
    .single();
  if (error) throw error;
  return data as CashMovementRow;
}

export async function updateCashMovementDraft(params: {
  company_id: string;
  id: string;
  patch: Partial<Pick<CashMovementRow, 'account_id' | 'category_id' | 'type' | 'amount' | 'movement_date' | 'payment_method' | 'notes' | 'reference'>>;
}): Promise<void> {
  const cId = requireCompanyId(params.company_id);
  const { error } = await supabase
    .from('cash_movements')
    .update(params.patch)
    .eq('company_id', cId)
    .eq('id', params.id)
    .eq('status', 'DRAFT');
  if (error) throw error;
}

async function setStatus(company_id: string, id: string, status: MovementStatus): Promise<void> {
  const cId = requireCompanyId(company_id);
  const { error } = await supabase.from('cash_movements').update({ status }).eq('company_id', cId).eq('id', id);
  if (error) throw error;
}

export async function submitMovement(company_id: string, id: string): Promise<void> {
  await setStatus(company_id, id, 'SUBMITTED');
}

export async function approveMovement(company_id: string, id: string): Promise<void> {
  await setStatus(company_id, id, 'APPROVED');
}

export async function rejectMovement(company_id: string, id: string): Promise<void> {
  await setStatus(company_id, id, 'REJECTED');
}

export async function deleteMovement(company_id: string, id: string): Promise<void> {
  const cId = requireCompanyId(company_id);
  const { error } = await supabase.from('cash_movements').delete().eq('company_id', cId).eq('id', id);
  if (error) throw error;
}
