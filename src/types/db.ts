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

export interface CostCenterRow {
  id: string;
  company_id: string;
  name: string;
  is_active: boolean;
  created_at?: string;
}

export interface CategoryRow {
  id: string;
  company_id: string;
  name: string;
  kind: CategoryKind;
}

export interface MovementAttachmentRow {
  id: string;
  company_id: string;
  movement_id: string;
  storage_path: string;
  file_name: string;
  mime_type: string | null;
  file_size: number | null;
}

export interface CashMovementRow {
  id: string;
  company_id: string;
  branch_id: string | null;
  account_id: string;
  category_id: string;
  cost_center_id: string | null;
  type: MovementType;
  status: MovementStatus;
  amount: number;
  movement_date: string;
  payment_method: string;
  notes: string | null;
  reference: string | null;
  created_by: string;
  created_at: string;
  cost_center?: CostCenterRow | null;
  attachments?: MovementAttachmentRow[] | null;
}
