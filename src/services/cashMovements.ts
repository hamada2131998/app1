import { supabase, requireCompanyId } from './supabaseUtils';
import type { CashMovementRow, MovementStatus, MovementType } from '@/types/db';

export interface ListMovementsParams {
  company_id: string;
  branch_id?: string | null;
  status?: MovementStatus;
  type?: MovementType;
  created_by?: string | null;
  fromDate?: string; // YYYY-MM-DD
  toDate?: string;   // YYYY-MM-DD
  limit?: number;
}

export async function listCashMovements(params: ListMovementsParams): Promise<CashMovementRow[]> {
  const cId = requireCompanyId(params.company_id);
  let q = supabase
    .from('cash_movements')
    .select(
      'id, company_id, branch_id, account_id, category_id, cost_center_id, type, status, amount, movement_date, payment_method, notes, reference, created_by, created_at, cost_center:cost_centers(id, name), attachments:movement_attachments(id, storage_path, file_name, mime_type, file_size)'
    )
    .eq('company_id', cId);

  if (params.branch_id) q = q.eq('branch_id', params.branch_id);
  if (params.created_by) q = q.eq('created_by', params.created_by);
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
  cost_center_id: string;
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
    cost_center_id: params.cost_center_id,
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
      'id, company_id, branch_id, account_id, category_id, cost_center_id, type, status, amount, movement_date, payment_method, notes, reference, created_by, created_at, cost_center:cost_centers(id, name), attachments:movement_attachments(id, storage_path, file_name, mime_type, file_size)'
    )
    .single();
  if (error) throw error;
  return data as CashMovementRow;
}

export async function updateCashMovementDraft(params: {
  company_id: string;
  id: string;
  patch: Partial<Pick<CashMovementRow, 'account_id' | 'category_id' | 'cost_center_id' | 'type' | 'amount' | 'movement_date' | 'payment_method' | 'notes' | 'reference'>>;
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

export async function processMovementAction(params: {
  company_id: string;
  id: string;
  action: 'APPROVED' | 'REJECTED';
  comment?: string | null;
}): Promise<void> {
  requireCompanyId(params.company_id);
  const { error } = await supabase.rpc('process_movement_action', {
    p_movement_id: params.id,
    p_action: params.action,
    p_comment: params.comment ?? null,
  });
  if (error) throw error;
}

export async function approveMovement(company_id: string, id: string, comment?: string | null): Promise<void> {
  await processMovementAction({ company_id, id, action: 'APPROVED', comment });
}

export async function rejectMovement(company_id: string, id: string, comment?: string | null): Promise<void> {
  await processMovementAction({ company_id, id, action: 'REJECTED', comment });
}

export async function deleteMovement(company_id: string, id: string): Promise<void> {
  const cId = requireCompanyId(company_id);
  const { error } = await supabase.from('cash_movements').delete().eq('company_id', cId).eq('id', id);
  if (error) throw error;
}
