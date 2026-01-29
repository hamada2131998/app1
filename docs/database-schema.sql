-- =====================================================
-- ENTERPRISE FINANCIAL CONTROL PLATFORM - DATABASE SCHEMA
-- Version: 1.0.0
-- Multi-Tenant, Audit-Ready, RLS-Enforced
-- =====================================================

-- =====================================================
-- PART 1: ENUMS & TYPES
-- =====================================================

-- User roles enum (stored in separate table per security best practices)
CREATE TYPE public.app_role AS ENUM (
  'super_admin',      -- Platform-level admin (Lovable staff)
  'company_owner',    -- Company owner, full access to their company
  'finance_manager',  -- Can approve expenses, manage policies
  'accountant',       -- Can view/process expenses, generate reports
  'custodian',        -- Manages petty cash, limited approval
  'employee'          -- Can submit expenses only
);

-- Expense status workflow
CREATE TYPE public.expense_status AS ENUM (
  'draft',            -- Saved but not submitted
  'pending',          -- Submitted, awaiting approval
  'in_review',        -- Under review by approver
  'approved',         -- Approved, awaiting settlement
  'rejected',         -- Rejected with reason
  'settled',          -- Paid/reimbursed
  'cancelled'         -- Cancelled by submitter
);

-- Wallet transaction types
CREATE TYPE public.wallet_transaction_type AS ENUM (
  'allocation',       -- Company allocates funds to employee
  'expense',          -- Employee spends from wallet
  'refund',           -- Refund from rejected/cancelled expense
  'adjustment',       -- Manual adjustment by admin
  'transfer',         -- Transfer between wallets
  'freeze',           -- Funds frozen pending investigation
  'unfreeze'          -- Funds unfrozen
);

-- Audit action types
CREATE TYPE public.audit_action AS ENUM (
  'create',
  'update',
  'delete',
  'approve',
  'reject',
  'settle',
  'login',
  'logout',
  'policy_change',
  'role_change',
  'wallet_transaction'
);

-- Policy rule types
CREATE TYPE public.policy_rule_type AS ENUM (
  'max_amount',           -- Maximum single expense amount
  'daily_limit',          -- Daily spending limit
  'monthly_limit',        -- Monthly spending limit
  'requires_receipt',     -- Receipt required above amount
  'requires_gps',         -- GPS location required
  'geo_radius',           -- Must be within radius of project
  'auto_approve_below',   -- Auto-approve below amount
  'requires_approval',    -- Requires specific role approval
  'blocked'               -- Category blocked entirely
);

-- =====================================================
-- PART 2: CORE TENANT & USER TABLES
-- =====================================================

-- Companies (Tenants) - The root of multi-tenancy
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Company Information
  name TEXT NOT NULL,
  name_ar TEXT,                          -- Arabic name
  legal_name TEXT,                       -- Official registered name
  tax_number TEXT,                       -- VAT/Tax registration number
  cr_number TEXT,                        -- Commercial Registration (السجل التجاري)
  
  -- Contact & Address
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  country TEXT DEFAULT 'SA',
  
  -- Financial Settings
  default_currency TEXT DEFAULT 'SAR',
  vat_rate DECIMAL(5,2) DEFAULT 15.00,   -- Saudi VAT 15%
  fiscal_year_start INTEGER DEFAULT 1,    -- Month (1=January)
  
  -- Status & Metadata
  is_active BOOLEAN DEFAULT true,
  subscription_tier TEXT DEFAULT 'free', -- free, professional, enterprise
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraints
  CONSTRAINT valid_vat_rate CHECK (vat_rate >= 0 AND vat_rate <= 100)
);

-- Branches (Optional multi-location support)
CREATE TABLE public.branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  name_ar TEXT,
  code TEXT,                             -- Short code (e.g., 'RYD', 'JED')
  
  address TEXT,
  city TEXT,
  country TEXT DEFAULT 'SA',
  
  -- Geo coordinates for location verification
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(company_id, code)
);

-- User Profiles (Extended from auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  
  -- Personal Info
  full_name TEXT NOT NULL,
  full_name_ar TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  employee_id TEXT,                      -- Company's internal employee ID
  
  -- Avatar & Preferences
  avatar_url TEXT,
  locale TEXT DEFAULT 'ar',
  timezone TEXT DEFAULT 'Asia/Riyadh',
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- User Roles (Separate table - CRITICAL for security)
-- A user can have multiple roles (e.g., accountant + custodian)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  
  -- Role scope (optional - limit role to specific branch/project)
  branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
  
  -- Metadata
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,                -- Optional role expiration
  
  -- Ensure unique role per user per company
  UNIQUE(user_id, company_id, role)
);

-- =====================================================
-- PART 3: FINANCIAL STRUCTURE TABLES
-- =====================================================

-- Chart of Accounts (GL Codes)
CREATE TABLE public.gl_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  
  code TEXT NOT NULL,                    -- e.g., '6001'
  name TEXT NOT NULL,                    -- e.g., 'Travel Expenses'
  name_ar TEXT,                          -- e.g., 'مصروفات السفر'
  
  account_type TEXT,                     -- expense, asset, liability, etc.
  parent_id UUID REFERENCES public.gl_accounts(id),
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(company_id, code)
);

-- Cost Centers
CREATE TABLE public.cost_centers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES public.branches(id),
  
  code TEXT NOT NULL,                    -- e.g., 'CC-001'
  name TEXT NOT NULL,
  name_ar TEXT,
  
  manager_id UUID REFERENCES public.profiles(id),
  budget_amount DECIMAL(15, 2),
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(company_id, code)
);

-- Projects
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES public.branches(id),
  cost_center_id UUID REFERENCES public.cost_centers(id),
  
  -- Project Info
  name TEXT NOT NULL,
  name_ar TEXT,
  description TEXT,
  code TEXT,                             -- Project code
  
  -- Financial
  budget DECIMAL(15, 2) NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'SAR',
  
  -- Location (for geo-verification)
  location TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  geo_radius_meters INTEGER DEFAULT 1000, -- Acceptable radius for expenses
  
  -- Timeline
  start_date DATE,
  end_date DATE,
  
  -- Status
  status TEXT DEFAULT 'active',          -- active, on_hold, completed, cancelled
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(company_id, code)
);

-- =====================================================
-- PART 4: EXPENSE MANAGEMENT
-- =====================================================

-- Expenses (Core transaction table)
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  
  -- Ownership & Assignment
  user_id UUID NOT NULL REFERENCES auth.users(id),
  project_id UUID REFERENCES public.projects(id),
  cost_center_id UUID REFERENCES public.cost_centers(id),
  gl_account_id UUID REFERENCES public.gl_accounts(id),
  
  -- Financial Data (Source of Truth)
  amount DECIMAL(15, 2) NOT NULL,        -- Gross amount (including VAT)
  net_amount DECIMAL(15, 2) NOT NULL,    -- Amount before VAT
  vat_amount DECIMAL(15, 2) NOT NULL,    -- VAT amount
  vat_rate DECIMAL(5, 2) NOT NULL,       -- VAT rate applied
  currency TEXT DEFAULT 'SAR',
  
  -- Expense Details
  description TEXT NOT NULL,
  category TEXT,                         -- fuel, travel, supplies, etc.
  merchant_name TEXT,
  merchant_tax_number TEXT,              -- For VAT validation
  
  -- Receipt & Documentation
  receipt_url TEXT,
  receipt_number TEXT,
  invoice_date DATE,
  
  -- Geo-Verification Data
  submitted_latitude DECIMAL(10, 8),
  submitted_longitude DECIMAL(11, 8),
  geo_confidence_score DECIMAL(3, 2),    -- 0.00 to 1.00
  geo_verified BOOLEAN DEFAULT false,
  
  -- Workflow Status
  status expense_status DEFAULT 'draft',
  submitted_at TIMESTAMPTZ,
  
  -- Policy Compliance
  policy_id UUID,                        -- Which policy was applied
  policy_violations JSONB,               -- Array of violations detected
  risk_score DECIMAL(3, 2),              -- 0.00 to 1.00 (AI-ready)
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraints
  CONSTRAINT valid_amounts CHECK (
    amount >= 0 AND 
    net_amount >= 0 AND 
    vat_amount >= 0 AND
    amount = net_amount + vat_amount
  ),
  CONSTRAINT valid_geo_score CHECK (
    geo_confidence_score IS NULL OR 
    (geo_confidence_score >= 0 AND geo_confidence_score <= 1)
  )
);

-- Expense Attachments (Multiple files per expense)
CREATE TABLE public.expense_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  
  file_url TEXT NOT NULL,
  file_name TEXT,
  file_type TEXT,                        -- image/jpeg, application/pdf, etc.
  file_size INTEGER,                     -- bytes
  
  is_receipt BOOLEAN DEFAULT false,      -- Mark primary receipt
  ocr_data JSONB,                        -- Extracted OCR data (AI-ready)
  
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- PART 5: APPROVAL WORKFLOW
-- =====================================================

-- Approval Workflow Templates
CREATE TABLE public.approval_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  name_ar TEXT,
  description TEXT,
  
  -- Conditions for this workflow to apply
  min_amount DECIMAL(15, 2),             -- Apply if expense >= this
  max_amount DECIMAL(15, 2),             -- Apply if expense <= this
  categories TEXT[],                     -- Apply to these categories
  cost_center_ids UUID[],                -- Apply to these cost centers
  
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,      -- Default workflow if no match
  priority INTEGER DEFAULT 0,            -- Higher = checked first
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Workflow Steps (Ordered approval chain)
CREATE TABLE public.workflow_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES public.approval_workflows(id) ON DELETE CASCADE,
  
  step_order INTEGER NOT NULL,           -- 1, 2, 3...
  name TEXT NOT NULL,                    -- 'Manager Approval', 'Finance Review'
  
  -- Who can approve this step
  approver_role app_role,                -- Role-based approval
  approver_user_id UUID REFERENCES auth.users(id), -- Specific user
  
  -- Step behavior
  is_required BOOLEAN DEFAULT true,
  auto_approve_after_hours INTEGER,      -- Auto-approve if no action
  
  created_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(workflow_id, step_order)
);

-- Expense Approvals (Audit trail of all approval actions)
CREATE TABLE public.expense_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  
  workflow_step_id UUID REFERENCES public.workflow_steps(id),
  step_order INTEGER,
  
  -- Action taken
  action TEXT NOT NULL,                  -- 'approved', 'rejected', 'returned', 'escalated'
  
  -- Who took action
  approver_id UUID NOT NULL REFERENCES auth.users(id),
  approver_role app_role,
  
  -- Details
  comment TEXT,
  rejection_reason TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  ip_address INET,
  user_agent TEXT
);

-- =====================================================
-- PART 6: POLICY ENGINE
-- =====================================================

-- Company Policies
CREATE TABLE public.company_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  name_ar TEXT,
  description TEXT,
  
  -- Scope
  applies_to_categories TEXT[],          -- ['fuel', 'travel'] or empty for all
  applies_to_roles app_role[],           -- Which roles this applies to
  applies_to_cost_centers UUID[],
  
  -- Status & Versioning
  version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  effective_from DATE DEFAULT CURRENT_DATE,
  effective_to DATE,
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Policy Rules (Individual rules within a policy)
CREATE TABLE public.policy_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id UUID NOT NULL REFERENCES public.company_policies(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  
  rule_type policy_rule_type NOT NULL,
  
  -- Rule parameters (flexible JSONB for different rule types)
  parameters JSONB NOT NULL,
  -- Examples:
  -- max_amount: {"value": 5000, "currency": "SAR"}
  -- daily_limit: {"value": 1000, "currency": "SAR"}
  -- requires_receipt: {"above_amount": 100}
  -- requires_gps: {"categories": ["fuel", "travel"]}
  -- geo_radius: {"meters": 500, "from": "project"}
  
  -- Violation behavior
  violation_action TEXT DEFAULT 'warn', -- 'warn', 'block', 'require_approval'
  violation_message TEXT,
  violation_message_ar TEXT,
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Policy Violations Log
CREATE TABLE public.policy_violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
  policy_id UUID NOT NULL REFERENCES public.company_policies(id),
  rule_id UUID NOT NULL REFERENCES public.policy_rules(id),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  
  -- Violation details
  violation_type policy_rule_type NOT NULL,
  expected_value JSONB,
  actual_value JSONB,
  
  -- Resolution
  is_overridden BOOLEAN DEFAULT false,
  overridden_by UUID REFERENCES auth.users(id),
  override_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- PART 7: WALLET & PETTY CASH
-- =====================================================

-- Employee Wallets
CREATE TABLE public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  
  -- Balance
  balance DECIMAL(15, 2) DEFAULT 0,
  currency TEXT DEFAULT 'SAR',
  
  -- Limits
  daily_limit DECIMAL(15, 2),
  monthly_limit DECIMAL(15, 2),
  single_transaction_limit DECIMAL(15, 2),
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_frozen BOOLEAN DEFAULT false,
  frozen_reason TEXT,
  frozen_at TIMESTAMPTZ,
  frozen_by UUID REFERENCES auth.users(id),
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(company_id, user_id),
  CONSTRAINT valid_balance CHECK (balance >= 0)
);

-- Wallet Transactions (Complete audit trail)
CREATE TABLE public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  
  transaction_type wallet_transaction_type NOT NULL,
  
  -- Amount (positive = credit, negative = debit)
  amount DECIMAL(15, 2) NOT NULL,
  balance_before DECIMAL(15, 2) NOT NULL,
  balance_after DECIMAL(15, 2) NOT NULL,
  
  -- Reference to related entity
  expense_id UUID REFERENCES public.expenses(id),
  transfer_to_wallet_id UUID REFERENCES public.wallets(id),
  
  -- Details
  description TEXT,
  reference_number TEXT,
  
  -- Metadata
  performed_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  ip_address INET,
  
  CONSTRAINT valid_transaction CHECK (
    balance_after = balance_before + amount
  )
);

-- =====================================================
-- PART 8: AUDIT LOGS (IMMUTABLE)
-- =====================================================

-- Audit Logs - Immutable record of all actions
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id), -- NULL for platform-level
  
  -- Who
  user_id UUID REFERENCES auth.users(id),
  user_email TEXT,                       -- Denormalized for historical accuracy
  user_role app_role,
  
  -- What
  action audit_action NOT NULL,
  entity_type TEXT NOT NULL,             -- 'expense', 'policy', 'wallet', etc.
  entity_id UUID,
  
  -- Changes
  old_values JSONB,
  new_values JSONB,
  changes_summary TEXT,                  -- Human-readable summary
  
  -- Context
  ip_address INET,
  user_agent TEXT,
  location_country TEXT,
  location_city TEXT,
  
  -- Request context
  request_id UUID,                       -- For tracing
  session_id TEXT,
  
  -- Timestamp (immutable)
  created_at TIMESTAMPTZ DEFAULT now()
);

-- CRITICAL: Make audit_logs immutable
CREATE OR REPLACE FUNCTION prevent_audit_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Audit logs are immutable and cannot be modified or deleted';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_logs_immutable
BEFORE UPDATE OR DELETE ON public.audit_logs
FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification();

-- =====================================================
-- PART 9: INDEXES FOR PERFORMANCE
-- =====================================================

-- Companies
CREATE INDEX idx_companies_active ON public.companies(is_active) WHERE is_active = true;

-- Profiles
CREATE INDEX idx_profiles_company ON public.profiles(company_id);
CREATE INDEX idx_profiles_email ON public.profiles(email);

-- User Roles
CREATE INDEX idx_user_roles_user ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_company ON public.user_roles(company_id);
CREATE INDEX idx_user_roles_lookup ON public.user_roles(user_id, company_id, role);

-- Expenses
CREATE INDEX idx_expenses_company ON public.expenses(company_id);
CREATE INDEX idx_expenses_user ON public.expenses(user_id);
CREATE INDEX idx_expenses_status ON public.expenses(company_id, status);
CREATE INDEX idx_expenses_date ON public.expenses(company_id, created_at DESC);
CREATE INDEX idx_expenses_project ON public.expenses(project_id);

-- Wallets
CREATE INDEX idx_wallets_user ON public.wallets(user_id);
CREATE INDEX idx_wallets_company ON public.wallets(company_id);

-- Wallet Transactions
CREATE INDEX idx_wallet_tx_wallet ON public.wallet_transactions(wallet_id);
CREATE INDEX idx_wallet_tx_date ON public.wallet_transactions(created_at DESC);

-- Audit Logs
CREATE INDEX idx_audit_company ON public.audit_logs(company_id);
CREATE INDEX idx_audit_user ON public.audit_logs(user_id);
CREATE INDEX idx_audit_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_date ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_action ON public.audit_logs(action);

-- =====================================================
-- PART 10: HELPER FUNCTIONS (SECURITY DEFINERS)
-- =====================================================

-- Get current user's company_id
CREATE OR REPLACE FUNCTION public.get_user_company_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM public.profiles WHERE id = auth.uid()
$$;

-- Check if user has a specific role in their company
CREATE OR REPLACE FUNCTION public.has_role(_role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND company_id = public.get_user_company_id()
      AND role = _role
      AND (expires_at IS NULL OR expires_at > now())
  )
$$;

-- Check if user has any of the specified roles
CREATE OR REPLACE FUNCTION public.has_any_role(_roles app_role[])
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND company_id = public.get_user_company_id()
      AND role = ANY(_roles)
      AND (expires_at IS NULL OR expires_at > now())
  )
$$;

-- Check if user is company owner or finance manager (high privilege)
CREATE OR REPLACE FUNCTION public.is_finance_privileged()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_any_role(ARRAY['company_owner', 'finance_manager']::app_role[])
$$;

-- Check if user can access a specific company
CREATE OR REPLACE FUNCTION public.can_access_company(_company_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT _company_id = public.get_user_company_id()
$$;

-- =====================================================
-- PART 11: ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gl_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cost_centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policy_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policy_violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- COMPANIES POLICIES
-- =====================================================

-- Users can only see their own company
CREATE POLICY "Users can view their company"
  ON public.companies FOR SELECT
  USING (id = public.get_user_company_id());

-- Only company owners can update company settings
CREATE POLICY "Company owners can update company"
  ON public.companies FOR UPDATE
  USING (id = public.get_user_company_id() AND public.has_role('company_owner'));

-- =====================================================
-- BRANCHES POLICIES
-- =====================================================

CREATE POLICY "Users can view company branches"
  ON public.branches FOR SELECT
  USING (company_id = public.get_user_company_id());

CREATE POLICY "Company owners can manage branches"
  ON public.branches FOR ALL
  USING (company_id = public.get_user_company_id() AND public.has_role('company_owner'));

-- =====================================================
-- PROFILES POLICIES
-- =====================================================

-- Users can see all profiles in their company
CREATE POLICY "Users can view company profiles"
  ON public.profiles FOR SELECT
  USING (company_id = public.get_user_company_id());

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid());

-- =====================================================
-- USER ROLES POLICIES
-- =====================================================

-- Users can see roles in their company (needed for UI)
CREATE POLICY "Users can view company roles"
  ON public.user_roles FOR SELECT
  USING (company_id = public.get_user_company_id());

-- Only company owners can manage roles
CREATE POLICY "Company owners can manage roles"
  ON public.user_roles FOR ALL
  USING (company_id = public.get_user_company_id() AND public.has_role('company_owner'));

-- =====================================================
-- EXPENSES POLICIES
-- =====================================================

-- Employees can see their own expenses
CREATE POLICY "Users can view own expenses"
  ON public.expenses FOR SELECT
  USING (user_id = auth.uid());

-- Finance team can see all company expenses
CREATE POLICY "Finance can view all company expenses"
  ON public.expenses FOR SELECT
  USING (
    company_id = public.get_user_company_id() 
    AND public.has_any_role(ARRAY['company_owner', 'finance_manager', 'accountant']::app_role[])
  );

-- Employees can create their own expenses
CREATE POLICY "Users can create own expenses"
  ON public.expenses FOR INSERT
  WITH CHECK (
    user_id = auth.uid() 
    AND company_id = public.get_user_company_id()
  );

-- Users can update their own draft expenses
CREATE POLICY "Users can update own draft expenses"
  ON public.expenses FOR UPDATE
  USING (
    user_id = auth.uid() 
    AND status = 'draft'
  );

-- Finance can update any company expense (for approval)
CREATE POLICY "Finance can update company expenses"
  ON public.expenses FOR UPDATE
  USING (
    company_id = public.get_user_company_id()
    AND public.has_any_role(ARRAY['company_owner', 'finance_manager', 'accountant']::app_role[])
  );

-- =====================================================
-- WALLETS POLICIES
-- =====================================================

-- Users can see their own wallet
CREATE POLICY "Users can view own wallet"
  ON public.wallets FOR SELECT
  USING (user_id = auth.uid());

-- Finance can see all company wallets
CREATE POLICY "Finance can view all wallets"
  ON public.wallets FOR SELECT
  USING (
    company_id = public.get_user_company_id()
    AND public.is_finance_privileged()
  );

-- Only finance can manage wallets
CREATE POLICY "Finance can manage wallets"
  ON public.wallets FOR ALL
  USING (
    company_id = public.get_user_company_id()
    AND public.is_finance_privileged()
  );

-- =====================================================
-- WALLET TRANSACTIONS POLICIES
-- =====================================================

-- Users can see their own transactions
CREATE POLICY "Users can view own transactions"
  ON public.wallet_transactions FOR SELECT
  USING (
    wallet_id IN (SELECT id FROM public.wallets WHERE user_id = auth.uid())
  );

-- Finance can see all company transactions
CREATE POLICY "Finance can view all transactions"
  ON public.wallet_transactions FOR SELECT
  USING (
    company_id = public.get_user_company_id()
    AND public.is_finance_privileged()
  );

-- =====================================================
-- AUDIT LOGS POLICIES (READ-ONLY)
-- =====================================================

-- Only finance managers and company owners can view audit logs
CREATE POLICY "Finance can view audit logs"
  ON public.audit_logs FOR SELECT
  USING (
    company_id = public.get_user_company_id()
    AND public.has_any_role(ARRAY['company_owner', 'finance_manager']::app_role[])
  );

-- Insert-only policy for system (via service role)
CREATE POLICY "System can insert audit logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (true);  -- Service role bypasses RLS anyway

-- =====================================================
-- PROJECTS & COST CENTERS POLICIES
-- =====================================================

CREATE POLICY "Users can view company projects"
  ON public.projects FOR SELECT
  USING (company_id = public.get_user_company_id());

CREATE POLICY "Finance can manage projects"
  ON public.projects FOR ALL
  USING (
    company_id = public.get_user_company_id()
    AND public.is_finance_privileged()
  );

CREATE POLICY "Users can view cost centers"
  ON public.cost_centers FOR SELECT
  USING (company_id = public.get_user_company_id());

CREATE POLICY "Finance can manage cost centers"
  ON public.cost_centers FOR ALL
  USING (
    company_id = public.get_user_company_id()
    AND public.is_finance_privileged()
  );

-- =====================================================
-- POLICIES & WORKFLOWS
-- =====================================================

CREATE POLICY "Users can view company policies"
  ON public.company_policies FOR SELECT
  USING (company_id = public.get_user_company_id());

CREATE POLICY "Finance can manage policies"
  ON public.company_policies FOR ALL
  USING (
    company_id = public.get_user_company_id()
    AND public.is_finance_privileged()
  );

CREATE POLICY "Users can view policy rules"
  ON public.policy_rules FOR SELECT
  USING (company_id = public.get_user_company_id());

CREATE POLICY "Users can view workflows"
  ON public.approval_workflows FOR SELECT
  USING (company_id = public.get_user_company_id());

CREATE POLICY "Finance can manage workflows"
  ON public.approval_workflows FOR ALL
  USING (
    company_id = public.get_user_company_id()
    AND public.is_finance_privileged()
  );

-- =====================================================
-- PART 12: AUDIT LOGGING TRIGGERS
-- =====================================================

-- Generic audit function
CREATE OR REPLACE FUNCTION log_audit_event()
RETURNS TRIGGER AS $$
DECLARE
  _old_values JSONB;
  _new_values JSONB;
  _action audit_action;
  _company_id UUID;
BEGIN
  -- Determine action type
  IF TG_OP = 'INSERT' THEN
    _action := 'create';
    _new_values := to_jsonb(NEW);
    _old_values := NULL;
    _company_id := NEW.company_id;
  ELSIF TG_OP = 'UPDATE' THEN
    _action := 'update';
    _old_values := to_jsonb(OLD);
    _new_values := to_jsonb(NEW);
    _company_id := NEW.company_id;
  ELSIF TG_OP = 'DELETE' THEN
    _action := 'delete';
    _old_values := to_jsonb(OLD);
    _new_values := NULL;
    _company_id := OLD.company_id;
  END IF;

  -- Insert audit log
  INSERT INTO public.audit_logs (
    company_id,
    user_id,
    action,
    entity_type,
    entity_id,
    old_values,
    new_values
  ) VALUES (
    _company_id,
    auth.uid(),
    _action,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    _old_values,
    _new_values
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit triggers to financial tables
CREATE TRIGGER audit_expenses
AFTER INSERT OR UPDATE OR DELETE ON public.expenses
FOR EACH ROW EXECUTE FUNCTION log_audit_event();

CREATE TRIGGER audit_wallets
AFTER INSERT OR UPDATE OR DELETE ON public.wallets
FOR EACH ROW EXECUTE FUNCTION log_audit_event();

CREATE TRIGGER audit_wallet_transactions
AFTER INSERT ON public.wallet_transactions
FOR EACH ROW EXECUTE FUNCTION log_audit_event();

CREATE TRIGGER audit_company_policies
AFTER INSERT OR UPDATE OR DELETE ON public.company_policies
FOR EACH ROW EXECUTE FUNCTION log_audit_event();

CREATE TRIGGER audit_user_roles
AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION log_audit_event();

-- =====================================================
-- PART 13: UPDATED_AT TRIGGER
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_companies
BEFORE UPDATE ON public.companies
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_profiles
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_projects
BEFORE UPDATE ON public.projects
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_expenses
BEFORE UPDATE ON public.expenses
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_wallets
BEFORE UPDATE ON public.wallets
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_policies
BEFORE UPDATE ON public.company_policies
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_workflows
BEFORE UPDATE ON public.approval_workflows
FOR EACH ROW EXECUTE FUNCTION update_updated_at();
