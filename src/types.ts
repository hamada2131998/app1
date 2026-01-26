
export enum UserRole {
  OWNER = 'OWNER',
  ACCOUNTANT = 'ACCOUNTANT',
  EMPLOYEE = 'EMPLOYEE'
}

export enum MovementStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export enum MovementType {
  IN = 'IN',
  OUT = 'OUT',
  TRANSFER = 'TRANSFER'
}

export enum AccountType {
  CASHBOX = 'CASHBOX',
  BANK = 'BANK',
  OTHER = 'OTHER'
}

export enum CategoryKind {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE'
}

export enum CustodyTxType {
  ISSUE = 'ISSUE',
  SPEND = 'SPEND',
  RETURN = 'RETURN',
  SETTLEMENT = 'SETTLEMENT'
}

export interface UserProfile {
  id: string;
  full_name: string;
  email?: string;
}

export interface UserRoleRecord {
  user_id: string;
  company_id: string;
  role: UserRole;
}

export interface Company {
  id: string;
  name: string;
  currency: string;
  timezone: string;
}

export interface Branch {
  id: string;
  company_id: string;
  name: string;
}

export interface CashAccount {
  id: string;
  company_id: string;
  branch_id?: string;
  name: string;
  type: AccountType;
}

export interface Category {
  id: string;
  company_id: string;
  name: string;
  kind: CategoryKind;
}

export interface AuditLog {
  id: string;
  company_id: string;
  actor_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  comment?: string;
  metadata: any;
  created_at: string;
  // Joins
  actor?: UserProfile;
}

export interface CashMovement {
  id: string;
  company_id: string;
  branch_id?: string;
  account_id: string;
  type: MovementType;
  amount: number;
  category_id?: string;
  payment_method: string;
  reference?: string;
  notes?: string;
  movement_date: string;
  created_by: string;
  status: MovementStatus;
  approved_by?: string;
  approved_at?: string;
  rejected_reason?: string;
  created_at: string;
  // Joins
  category?: Category;
  account?: CashAccount;
  branch?: Branch;
  creator?: UserProfile;
  approver?: UserProfile;
}

export interface MovementAttachment {
  id: string;
  company_id: string;
  movement_id: string;
  storage_path: string;
  file_name: string;
  mime_type: string;
  file_size: number;
  uploaded_by: string;
  uploaded_at: string;
  // Joins
  uploader?: UserProfile;
}

export interface Custody {
  id: string;
  company_id: string;
  user_id: string;
  branch_id?: string;
  name: string;
  opening_balance: number;
  max_limit?: number;
  is_active: boolean;
  current_balance?: number; // Calculated
}

export interface CustodyTransaction {
  id: string;
  custody_id: string;
  tx_type: CustodyTxType;
  amount: number;
  tx_date: string;
  status: MovementStatus;
  notes?: string;
  created_by: string;
}
