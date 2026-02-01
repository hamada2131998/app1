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
  const { data, error } = await supabase.rpc('list_cash_movements', {
    p_company_id: cId,
    p_branch_id: params.branch_id ?? null,
    p_status: params.status ?? null,
    p_type: params.type ?? null,
    p_from_date: params.fromDate ?? null,
    p_to_date: params.toDate ?? null,
    p_limit: params.limit ?? null,
  });
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
    amount: params.amount,
    movement_date: params.movement_date,
    payment_method: params.payment_method ?? 'CASH',
    notes: params.notes ?? null,
    reference: params.reference ?? null,
  };

  const { data, error } = await supabase.rpc('create_cash_movement', {
    p_company_id: insertRow.company_id,
    p_branch_id: insertRow.branch_id,
    p_account_id: insertRow.account_id,
    p_category_id: insertRow.category_id,
    p_type: insertRow.type,
    p_amount: insertRow.amount,
    p_movement_date: insertRow.movement_date,
    p_payment_method: insertRow.payment_method,
    p_notes: insertRow.notes,
    p_reference: insertRow.reference,
  });
  if (error) throw error;
  return data as CashMovementRow;
}

export async function updateCashMovementDraft(params: {
  company_id: string;
  id: string;
  patch: Partial<Pick<CashMovementRow, 'account_id' | 'category_id' | 'type' | 'amount' | 'movement_date' | 'payment_method' | 'notes' | 'reference'>>;
}): Promise<void> {
  const cId = requireCompanyId(params.company_id);
  const { error } = await supabase.rpc('update_cash_movement_draft', {
    p_company_id: cId,
    p_movement_id: params.id,
    p_account_id: params.patch.account_id ?? null,
    p_category_id: params.patch.category_id ?? null,
    p_type: params.patch.type ?? null,
    p_amount: params.patch.amount ?? null,
    p_movement_date: params.patch.movement_date ?? null,
    p_payment_method: params.patch.payment_method ?? null,
    p_notes: params.patch.notes ?? null,
    p_reference: params.patch.reference ?? null,
  });
  if (error) throw error;
}

async function setStatus(company_id: string, id: string, status: MovementStatus): Promise<void> {
  const cId = requireCompanyId(company_id);
  const { error } = await supabase.rpc('set_cash_movement_status', {
    p_company_id: cId,
    p_movement_id: id,
    p_status: status,
  });
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
  const { error } = await supabase.rpc('delete_cash_movement', {
    p_company_id: cId,
    p_movement_id: id,
  });
  if (error) throw error;
}
