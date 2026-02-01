// =====================================================
// ENTERPRISE FINANCIAL PLATFORM - TYPE DEFINITIONS
// Auto-sync these with Supabase using: npx supabase gen types
// =====================================================

// =====================================================
// ENUMS
// =====================================================

export type AppRole = 
  | 'OWNER'
  | 'ACCOUNTANT'
  | 'CUSTODY_OFFICER';

export type ExpenseStatus = 
  | 'draft'
  | 'pending'
  | 'in_review'
  | 'approved'
  | 'rejected'
  | 'settled'
  | 'cancelled';

export type WalletTransactionType = 
  | 'allocation'
  | 'expense'
  | 'refund'
  | 'adjustment'
  | 'transfer'
  | 'freeze'
  | 'unfreeze';

export type AuditAction = 
  | 'create'
  | 'update'
  | 'delete'
  | 'approve'
  | 'reject'
  | 'settle'
  | 'login'
  | 'logout'
  | 'policy_change'
  | 'role_change'
  | 'wallet_transaction';

export type PolicyRuleType = 
  | 'max_amount'
  | 'daily_limit'
  | 'monthly_limit'
  | 'requires_receipt'
  | 'requires_gps'
  | 'geo_radius'
  | 'auto_approve_below'
  | 'requires_approval'
  | 'blocked';

// =====================================================
// CORE ENTITIES
// =====================================================

export interface Company {
  id: string;
  name: string;
  name_ar?: string;
  legal_name?: string;
  tax_number?: string;
  cr_number?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country: string;
  default_currency: string;
  vat_rate: number;
  fiscal_year_start: number;
  is_active: boolean;
  subscription_tier: 'free' | 'professional' | 'enterprise';
  created_at: string;
  updated_at: string;
}

export interface Branch {
  id: string;
  company_id: string;
  name: string;
  name_ar?: string;
  code?: string;
  address?: string;
  city?: string;
  country: string;
  latitude?: number;
  longitude?: number;
  is_active: boolean;
  created_at: string;
}

export interface Profile {
  id: string;
  company_id?: string;
  branch_id?: string;
  full_name: string;
  full_name_ar?: string;
  email: string;
  phone?: string;
  employee_id?: string;
  avatar_url?: string;
  locale: string;
  timezone: string;
  is_active: boolean;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  company_id: string;
  role: AppRole;
  branch_id?: string;
  granted_by?: string;
  granted_at: string;
  expires_at?: string;
}

// =====================================================
// FINANCIAL STRUCTURE
// =====================================================

export interface GLAccount {
  id: string;
  company_id: string;
  code: string;
  name: string;
  name_ar?: string;
  account_type?: string;
  parent_id?: string;
  is_active: boolean;
  created_at: string;
}

export interface CostCenter {
  id: string;
  company_id: string;
  branch_id?: string;
  code: string;
  name: string;
  name_ar?: string;
  manager_id?: string;
  budget_amount?: number;
  is_active: boolean;
  created_at: string;
}

export interface Project {
  id: string;
  company_id: string;
  branch_id?: string;
  cost_center_id?: string;
  name: string;
  name_ar?: string;
  description?: string;
  code?: string;
  budget: number;
  currency: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  geo_radius_meters: number;
  start_date?: string;
  end_date?: string;
  status: 'active' | 'on_hold' | 'completed' | 'cancelled';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// =====================================================
// EXPENSES
// =====================================================

export interface Expense {
  id: string;
  company_id: string;
  user_id: string;
  project_id?: string;
  cost_center_id?: string;
  gl_account_id?: string;
  
  // Financial
  amount: number;
  net_amount: number;
  vat_amount: number;
  vat_rate: number;
  currency: string;
  
  // Details
  description: string;
  category?: string;
  merchant_name?: string;
  merchant_tax_number?: string;
  
  // Documentation
  receipt_url?: string;
  receipt_number?: string;
  invoice_date?: string;
  
  // Geo
  submitted_latitude?: number;
  submitted_longitude?: number;
  geo_confidence_score?: number;
  geo_verified: boolean;
  
  // Workflow
  status: ExpenseStatus;
  submitted_at?: string;
  
  // Policy
  policy_id?: string;
  policy_violations?: PolicyViolationSummary[];
  risk_score?: number;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  
  // Relations (joined)
  project?: Pick<Project, 'id' | 'name' | 'name_ar'>;
  user?: Pick<Profile, 'id' | 'full_name' | 'full_name_ar' | 'avatar_url'>;
  cost_center?: Pick<CostCenter, 'id' | 'name' | 'code'>;
  gl_account?: Pick<GLAccount, 'id' | 'code' | 'name'>;
}

export interface ExpenseAttachment {
  id: string;
  expense_id: string;
  company_id: string;
  file_url: string;
  file_name?: string;
  file_type?: string;
  file_size?: number;
  is_receipt: boolean;
  ocr_data?: Record<string, unknown>;
  uploaded_by?: string;
  created_at: string;
}

// =====================================================
// APPROVAL WORKFLOW
// =====================================================

export interface ApprovalWorkflow {
  id: string;
  company_id: string;
  name: string;
  name_ar?: string;
  description?: string;
  min_amount?: number;
  max_amount?: number;
  categories?: string[];
  cost_center_ids?: string[];
  is_active: boolean;
  is_default: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
  
  // Relations
  steps?: WorkflowStep[];
}

export interface WorkflowStep {
  id: string;
  workflow_id: string;
  step_order: number;
  name: string;
  approver_role?: AppRole;
  approver_user_id?: string;
  is_required: boolean;
  auto_approve_after_hours?: number;
  created_at: string;
}

export interface ExpenseApproval {
  id: string;
  expense_id: string;
  company_id: string;
  workflow_step_id?: string;
  step_order?: number;
  action: 'approved' | 'rejected' | 'returned' | 'escalated';
  approver_id: string;
  approver_role?: AppRole;
  comment?: string;
  rejection_reason?: string;
  created_at: string;
  ip_address?: string;
  user_agent?: string;
  
  // Relations
  approver?: Pick<Profile, 'id' | 'full_name' | 'avatar_url'>;
}

// =====================================================
// POLICY ENGINE
// =====================================================

export interface CompanyPolicy {
  id: string;
  company_id: string;
  name: string;
  name_ar?: string;
  description?: string;
  applies_to_categories?: string[];
  applies_to_roles?: AppRole[];
  applies_to_cost_centers?: string[];
  version: number;
  is_active: boolean;
  effective_from: string;
  effective_to?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  
  // Relations
  rules?: PolicyRule[];
}

export interface PolicyRule {
  id: string;
  policy_id: string;
  company_id: string;
  rule_type: PolicyRuleType;
  parameters: PolicyRuleParameters;
  violation_action: 'warn' | 'block' | 'require_approval';
  violation_message?: string;
  violation_message_ar?: string;
  is_active: boolean;
  created_at: string;
}

export interface PolicyRuleParameters {
  value?: number;
  currency?: string;
  above_amount?: number;
  categories?: string[];
  meters?: number;
  from?: 'project' | 'branch';
  amount?: number;
  roles?: AppRole[];
}

export interface PolicyViolation {
  id: string;
  expense_id: string;
  policy_id: string;
  rule_id: string;
  company_id: string;
  violation_type: PolicyRuleType;
  expected_value?: Record<string, unknown>;
  actual_value?: Record<string, unknown>;
  is_overridden: boolean;
  overridden_by?: string;
  override_reason?: string;
  created_at: string;
}

export interface PolicyViolationSummary {
  rule_type: PolicyRuleType;
  message: string;
  severity: 'warn' | 'block';
}

// =====================================================
// WALLET & PETTY CASH
// =====================================================

export interface Wallet {
  id: string;
  company_id: string;
  user_id: string;
  balance: number;
  currency: string;
  daily_limit?: number;
  monthly_limit?: number;
  single_transaction_limit?: number;
  is_active: boolean;
  is_frozen: boolean;
  frozen_reason?: string;
  frozen_at?: string;
  frozen_by?: string;
  created_at: string;
  updated_at: string;
  
  // Relations
  user?: Pick<Profile, 'id' | 'full_name' | 'avatar_url' | 'employee_id'>;
}

export interface WalletTransaction {
  id: string;
  wallet_id: string;
  company_id: string;
  transaction_type: WalletTransactionType;
  amount: number;
  balance_before: number;
  balance_after: number;
  expense_id?: string;
  transfer_to_wallet_id?: string;
  description?: string;
  reference_number?: string;
  performed_by: string;
  created_at: string;
  ip_address?: string;
  
  // Relations
  expense?: Pick<Expense, 'id' | 'description'>;
  performer?: Pick<Profile, 'id' | 'full_name'>;
}

// =====================================================
// AUDIT LOGS
// =====================================================

export interface AuditLog {
  id: string;
  company_id?: string;
  user_id?: string;
  user_email?: string;
  user_role?: AppRole;
  action: AuditAction;
  entity_type: string;
  entity_id?: string;
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
  changes_summary?: string;
  ip_address?: string;
  user_agent?: string;
  location_country?: string;
  location_city?: string;
  request_id?: string;
  session_id?: string;
  created_at: string;
}

// =====================================================
// API RESPONSE TYPES
// =====================================================

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// =====================================================
// FORM TYPES
// =====================================================

export interface CreateExpenseInput {
  description: string;
  amount: number;
  includes_vat: boolean;
  category?: string;
  project_id?: string;
  cost_center_id?: string;
  gl_account_id?: string;
  merchant_name?: string;
  invoice_date?: string;
  latitude?: number;
  longitude?: number;
}

export interface ApproveExpenseInput {
  expense_id: string;
  action: 'approved' | 'rejected';
  comment?: string;
  rejection_reason?: string;
}

export interface TransferFundsInput {
  from_wallet_id: string;
  to_wallet_id: string;
  amount: number;
  description?: string;
}

export interface CreatePolicyInput {
  name: string;
  name_ar?: string;
  description?: string;
  applies_to_categories?: string[];
  applies_to_roles?: AppRole[];
  rules: CreatePolicyRuleInput[];
}

export interface CreatePolicyRuleInput {
  rule_type: PolicyRuleType;
  parameters: PolicyRuleParameters;
  violation_action: 'warn' | 'block' | 'require_approval';
  violation_message?: string;
}

// =====================================================
// DASHBOARD & ANALYTICS
// =====================================================

export interface DashboardStats {
  total_expenses: number;
  pending_count: number;
  approved_count: number;
  rejected_count: number;
  total_projects: number;
  active_employees: number;
  monthly_budget: number;
  monthly_spent: number;
  cash_inflow: number;
  cash_outflow: number;
  vat_collected: number;
}

export interface ExpenseByCategory {
  category: string;
  total: number;
  count: number;
  percentage: number;
}

export interface ExpenseByMonth {
  month: string;
  expenses: number;
  budget: number;
}

export interface RiskIndicator {
  type: string;
  level: 'low' | 'medium' | 'high';
  count: number;
  description: string;
}
