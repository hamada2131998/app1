import type { CashAccountRow, CashMovementRow, CategoryKind, CategoryRow, MovementStatus } from '@/types/db';
import { listCashAccounts } from '@/services/cashAccounts';
import { listCategories } from '@/services/categories';
import {
  approveMovement,
  createCashMovement,
  deleteMovement,
  listCashMovements,
  rejectMovement,
  submitMovement,
  updateCashMovementDraft,
  type ListMovementsParams,
} from '@/services/cashMovements';

export type Expense = CashMovementRow;
export type ExpenseAccount = CashAccountRow;
export type ExpenseCategory = CategoryRow;

export interface ListExpensesParams extends Omit<ListMovementsParams, 'type'> {}

export async function listExpenses(params: ListExpensesParams): Promise<Expense[]> {
  return listCashMovements({ ...params, type: 'OUT' });
}

export type CreateExpenseParams = Omit<Parameters<typeof createCashMovement>[0], 'type'>;

export async function createExpense(params: CreateExpenseParams): Promise<Expense> {
  return createCashMovement({ ...params, type: 'OUT' });
}

export async function listExpenseAccounts(params: {
  company_id: string;
  branch_id?: string | null;
  activeOnly?: boolean;
}): Promise<ExpenseAccount[]> {
  return listCashAccounts(params);
}

export async function listExpenseCategories(company_id: string, kind: CategoryKind = 'OUT'): Promise<ExpenseCategory[]> {
  return listCategories(company_id, kind);
}

export async function updateExpenseDraft(params: {
  company_id: string;
  id: string;
  patch: Parameters<typeof updateCashMovementDraft>[0]['patch'];
}): Promise<void> {
  return updateCashMovementDraft(params);
}

export async function submitExpense(company_id: string, id: string): Promise<void> {
  return submitMovement(company_id, id);
}

export async function approveExpense(company_id: string, id: string): Promise<void> {
  return approveMovement(company_id, id);
}

export async function rejectExpense(company_id: string, id: string): Promise<void> {
  return rejectMovement(company_id, id);
}

export async function deleteExpense(company_id: string, id: string): Promise<void> {
  return deleteMovement(company_id, id);
}

export function isExpenseStatus(status: MovementStatus): boolean {
  return ['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED'].includes(status);
}
