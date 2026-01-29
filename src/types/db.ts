export type MovementType = 'IN' | 'OUT';
export type MovementStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';

export type CategoryKind = 'IN' | 'OUT';
export type CashAccountType = 'CASH';

export interface CashAccountRow {
  id: string;
  company_id: string;
  branch_id: string | null;
  name: string;
  type: CashAccountType;
  is_active: boolean;
}

export interface CategoryRow {
  id: string;
  company_id: string;
  name: string;
  kind: CategoryKind;
}

export interface CashMovementRow {
  id: string;
  company_id: string;
  branch_id: string | null;
  account_id: string;
  category_id: string;
  type: MovementType;
  status: MovementStatus;
  amount: number;
  movement_date: string;
  payment_method: string;
  notes: string | null;
  reference: string | null;
  created_by: string;
  created_at: string;
}
