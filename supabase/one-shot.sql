-- Consolidated Supabase schema (idempotent)
-- Generated from migrations and app usage

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Types
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('OWNER', 'ACCOUNTANT', 'CUSTODY_OFFICER');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'movement_status') THEN
    CREATE TYPE public.movement_status AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'movement_type') THEN
    CREATE TYPE public.movement_type AS ENUM ('IN', 'OUT', 'TRANSFER');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'custody_tx_type') THEN
    CREATE TYPE public.custody_tx_type AS ENUM ('ISSUE', 'SPEND', 'RETURN', 'SETTLEMENT');
  END IF;
END $$;

-- Tables
CREATE TABLE IF NOT EXISTS public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  currency text DEFAULT 'SAR',
  timezone text DEFAULT 'Asia/Riyadh',
  setup_completed boolean DEFAULT false,
  setup_completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  email text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.branches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  branch_id uuid REFERENCES public.branches(id) ON DELETE SET NULL,
  role text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cash_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  branch_id uuid REFERENCES public.branches(id) ON DELETE SET NULL,
  name text NOT NULL,
  type text DEFAULT 'CASH',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  kind text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(company_id, kind, name)
);

CREATE TABLE IF NOT EXISTS public.cash_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  branch_id uuid REFERENCES public.branches(id) ON DELETE SET NULL,
  account_id uuid REFERENCES public.cash_accounts(id) NOT NULL,
  type text NOT NULL,
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  category_id uuid REFERENCES public.categories(id),
  payment_method text DEFAULT 'CASH',
  reference text,
  notes text,
  movement_date date NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  status text DEFAULT 'DRAFT',
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamptz,
  rejected_reason text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  comment text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.movement_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  movement_id uuid REFERENCES public.cash_movements(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  file_name text NOT NULL,
  mime_type text,
  file_size integer,
  uploaded_by uuid REFERENCES auth.users(id) DEFAULT auth.uid(),
  uploaded_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cost_centers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  branch_id uuid REFERENCES public.branches(id) ON DELETE SET NULL,
  name text NOT NULL,
  code text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.custodies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  branch_id uuid REFERENCES public.branches(id) ON DELETE SET NULL,
  name text NOT NULL,
  opening_balance numeric(12,2) DEFAULT 0,
  max_limit numeric(12,2),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.custody_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  custody_id uuid REFERENCES public.custodies(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  tx_type text NOT NULL,
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  tx_date date NOT NULL DEFAULT CURRENT_DATE,
  status text DEFAULT 'APPROVED',
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.daily_closes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  account_id uuid REFERENCES public.cash_accounts(id) ON DELETE CASCADE,
  close_date date NOT NULL,
  expected_balance numeric(12,2) NOT NULL,
  actual_balance numeric(12,2) NOT NULL,
  note text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(company_id, account_id, close_date)
);

CREATE TABLE IF NOT EXISTS public.locked_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  end_date date NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Add missing columns for legacy tables
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS setup_completed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS setup_completed_at timestamptz;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email text;

ALTER TABLE public.user_roles
  ADD COLUMN IF NOT EXISTS branch_id uuid;

ALTER TABLE public.cash_accounts
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

ALTER TABLE public.cash_movements
  ADD COLUMN IF NOT EXISTS branch_id uuid;

UPDATE public.user_roles
SET role = 'CUSTODY_OFFICER'
WHERE role = 'EMPLOYEE';

-- Constraints
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_roles_role_check'
  ) THEN
    ALTER TABLE public.user_roles
      ADD CONSTRAINT user_roles_role_check
      CHECK (role IN ('OWNER', 'ACCOUNTANT', 'CUSTODY_OFFICER'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'cash_accounts_type_check'
  ) THEN
    ALTER TABLE public.cash_accounts
      ADD CONSTRAINT cash_accounts_type_check
      CHECK (type IN ('CASH', 'CASHBOX', 'BANK', 'OTHER'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'categories_kind_check'
  ) THEN
    ALTER TABLE public.categories
      ADD CONSTRAINT categories_kind_check
      CHECK (kind IN ('IN', 'OUT', 'INCOME', 'EXPENSE'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'cash_movements_type_check'
  ) THEN
    ALTER TABLE public.cash_movements
      ADD CONSTRAINT cash_movements_type_check
      CHECK (type IN ('IN', 'OUT', 'TRANSFER'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'cash_movements_status_check'
  ) THEN
    ALTER TABLE public.cash_movements
      ADD CONSTRAINT cash_movements_status_check
      CHECK (status IN ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'custody_transactions_type_check'
  ) THEN
    ALTER TABLE public.custody_transactions
      ADD CONSTRAINT custody_transactions_type_check
      CHECK (tx_type IN ('ISSUE', 'SPEND', 'RETURN', 'SETTLEMENT'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'categories_company_kind_name_key'
  ) THEN
    ALTER TABLE public.categories
      ADD CONSTRAINT categories_company_kind_name_key
      UNIQUE (company_id, kind, name);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'daily_closes_company_account_date_key'
  ) THEN
    ALTER TABLE public.daily_closes
      ADD CONSTRAINT daily_closes_company_account_date_key
      UNIQUE (company_id, account_id, close_date);
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_movements_main ON public.cash_movements (company_id, movement_date DESC, status);
CREATE INDEX IF NOT EXISTS idx_user_roles_lookup ON public.user_roles (user_id, company_id);
CREATE INDEX IF NOT EXISTS idx_movements_company_date ON public.cash_movements (company_id, movement_date DESC);
CREATE INDEX IF NOT EXISTS idx_movements_company_status ON public.cash_movements (company_id, status);
CREATE INDEX IF NOT EXISTS idx_movements_account ON public.cash_movements (account_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_composite ON public.user_roles (user_id, company_id, role);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs (entity_id, entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_company_date ON public.audit_logs (company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_attachments_movement ON public.movement_attachments (movement_id);
CREATE INDEX IF NOT EXISTS idx_custody_tx_custody ON public.custody_transactions (custody_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_custody_tx_company_status ON public.custody_transactions (company_id, status);
CREATE INDEX IF NOT EXISTS idx_locked_periods_range ON public.locked_periods (company_id, start_date, end_date);

-- RLS
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movement_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cost_centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custodies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custody_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_closes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locked_periods ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY IF NOT EXISTS "companies_select_members"
  ON public.companies
  FOR SELECT
  USING (id IN (SELECT company_id FROM public.user_roles WHERE user_id = auth.uid()));

CREATE POLICY IF NOT EXISTS "companies_update_owners"
  ON public.companies
  FOR UPDATE
  USING (id IN (SELECT company_id FROM public.user_roles WHERE user_id = auth.uid() AND role = 'OWNER'));

CREATE POLICY IF NOT EXISTS "companies_insert_authenticated"
  ON public.companies
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY IF NOT EXISTS "profiles_select_company"
  ON public.profiles
  FOR SELECT
  USING (
    id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.user_roles ur_self
      JOIN public.user_roles ur_target ON ur_self.company_id = ur_target.company_id
      WHERE ur_self.user_id = auth.uid()
        AND ur_target.user_id = public.profiles.id
    )
  );

CREATE POLICY IF NOT EXISTS "profiles_upsert_self"
  ON public.profiles
  FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY IF NOT EXISTS "profiles_update_self"
  ON public.profiles
  FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY IF NOT EXISTS "user_roles_select_company"
  ON public.user_roles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.company_id = public.user_roles.company_id
    )
  );

CREATE POLICY IF NOT EXISTS "user_roles_insert_self"
  ON public.user_roles
  FOR INSERT
  WITH CHECK (user_id = auth.uid() AND role = 'OWNER');

CREATE POLICY IF NOT EXISTS "user_roles_update_owner"
  ON public.user_roles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.company_id = public.user_roles.company_id
        AND ur.role = 'OWNER'
    )
  );

CREATE POLICY IF NOT EXISTS "company_scoped_select"
  ON public.branches
  FOR SELECT
  USING (company_id IN (SELECT company_id FROM public.user_roles WHERE user_id = auth.uid()));

CREATE POLICY IF NOT EXISTS "company_scoped_write"
  ON public.branches
  FOR ALL
  USING (company_id IN (SELECT company_id FROM public.user_roles WHERE user_id = auth.uid()))
  WITH CHECK (company_id IN (SELECT company_id FROM public.user_roles WHERE user_id = auth.uid()));

CREATE POLICY IF NOT EXISTS "company_scoped_select_accounts"
  ON public.cash_accounts
  FOR SELECT
  USING (company_id IN (SELECT company_id FROM public.user_roles WHERE user_id = auth.uid()));

CREATE POLICY IF NOT EXISTS "company_scoped_write_accounts"
  ON public.cash_accounts
  FOR ALL
  USING (company_id IN (SELECT company_id FROM public.user_roles WHERE user_id = auth.uid()))
  WITH CHECK (company_id IN (SELECT company_id FROM public.user_roles WHERE user_id = auth.uid()));

CREATE POLICY IF NOT EXISTS "company_scoped_select_categories"
  ON public.categories
  FOR SELECT
  USING (company_id IN (SELECT company_id FROM public.user_roles WHERE user_id = auth.uid()));

CREATE POLICY IF NOT EXISTS "company_scoped_write_categories"
  ON public.categories
  FOR ALL
  USING (company_id IN (SELECT company_id FROM public.user_roles WHERE user_id = auth.uid()))
  WITH CHECK (company_id IN (SELECT company_id FROM public.user_roles WHERE user_id = auth.uid()));

CREATE POLICY IF NOT EXISTS "company_scoped_select_movements"
  ON public.cash_movements
  FOR SELECT
  USING (company_id IN (SELECT company_id FROM public.user_roles WHERE user_id = auth.uid()));

CREATE POLICY IF NOT EXISTS "company_scoped_write_movements"
  ON public.cash_movements
  FOR ALL
  USING (company_id IN (SELECT company_id FROM public.user_roles WHERE user_id = auth.uid()))
  WITH CHECK (company_id IN (SELECT company_id FROM public.user_roles WHERE user_id = auth.uid()));

CREATE POLICY IF NOT EXISTS "company_scoped_select_audit"
  ON public.audit_logs
  FOR SELECT
  USING (company_id IN (SELECT company_id FROM public.user_roles WHERE user_id = auth.uid()));

CREATE POLICY IF NOT EXISTS "company_scoped_write_audit"
  ON public.audit_logs
  FOR ALL
  USING (company_id IN (SELECT company_id FROM public.user_roles WHERE user_id = auth.uid()))
  WITH CHECK (company_id IN (SELECT company_id FROM public.user_roles WHERE user_id = auth.uid()));

CREATE POLICY IF NOT EXISTS "company_scoped_select_attachments"
  ON public.movement_attachments
  FOR SELECT
  USING (company_id IN (SELECT company_id FROM public.user_roles WHERE user_id = auth.uid()));

CREATE POLICY IF NOT EXISTS "company_scoped_write_attachments"
  ON public.movement_attachments
  FOR ALL
  USING (company_id IN (SELECT company_id FROM public.user_roles WHERE user_id = auth.uid()))
  WITH CHECK (company_id IN (SELECT company_id FROM public.user_roles WHERE user_id = auth.uid()));

CREATE POLICY IF NOT EXISTS "company_scoped_select_cost_centers"
  ON public.cost_centers
  FOR SELECT
  USING (company_id IN (SELECT company_id FROM public.user_roles WHERE user_id = auth.uid()));

CREATE POLICY IF NOT EXISTS "company_scoped_write_cost_centers"
  ON public.cost_centers
  FOR ALL
  USING (company_id IN (SELECT company_id FROM public.user_roles WHERE user_id = auth.uid()))
  WITH CHECK (company_id IN (SELECT company_id FROM public.user_roles WHERE user_id = auth.uid()));

CREATE POLICY IF NOT EXISTS "company_scoped_select_custodies"
  ON public.custodies
  FOR SELECT
  USING (company_id IN (SELECT company_id FROM public.user_roles WHERE user_id = auth.uid()));

CREATE POLICY IF NOT EXISTS "company_scoped_write_custodies"
  ON public.custodies
  FOR ALL
  USING (company_id IN (SELECT company_id FROM public.user_roles WHERE user_id = auth.uid()))
  WITH CHECK (company_id IN (SELECT company_id FROM public.user_roles WHERE user_id = auth.uid()));

CREATE POLICY IF NOT EXISTS "company_scoped_select_custody_tx"
  ON public.custody_transactions
  FOR SELECT
  USING (company_id IN (SELECT company_id FROM public.user_roles WHERE user_id = auth.uid()));

CREATE POLICY IF NOT EXISTS "company_scoped_write_custody_tx"
  ON public.custody_transactions
  FOR ALL
  USING (company_id IN (SELECT company_id FROM public.user_roles WHERE user_id = auth.uid()))
  WITH CHECK (company_id IN (SELECT company_id FROM public.user_roles WHERE user_id = auth.uid()));

CREATE POLICY IF NOT EXISTS "company_scoped_select_daily_close"
  ON public.daily_closes
  FOR SELECT
  USING (company_id IN (SELECT company_id FROM public.user_roles WHERE user_id = auth.uid()));

CREATE POLICY IF NOT EXISTS "company_scoped_write_daily_close"
  ON public.daily_closes
  FOR ALL
  USING (company_id IN (SELECT company_id FROM public.user_roles WHERE user_id = auth.uid()))
  WITH CHECK (company_id IN (SELECT company_id FROM public.user_roles WHERE user_id = auth.uid()));

CREATE POLICY IF NOT EXISTS "company_scoped_select_locked_periods"
  ON public.locked_periods
  FOR SELECT
  USING (company_id IN (SELECT company_id FROM public.user_roles WHERE user_id = auth.uid()));

CREATE POLICY IF NOT EXISTS "company_scoped_write_locked_periods"
  ON public.locked_periods
  FOR ALL
  USING (company_id IN (SELECT company_id FROM public.user_roles WHERE user_id = auth.uid()))
  WITH CHECK (company_id IN (SELECT company_id FROM public.user_roles WHERE user_id = auth.uid()));

-- RPCs
CREATE OR REPLACE FUNCTION public.create_company_with_owner(
  p_company_name text DEFAULT 'شركة جديدة'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
SET row_security = on
AS $$
DECLARE
  v_company_id uuid;
  v_full_name text;
  v_email text;
BEGIN
  SELECT company_id
  INTO v_company_id
  FROM public.user_roles
  WHERE user_id = auth.uid()
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_company_id IS NULL THEN
    INSERT INTO public.companies (name)
    VALUES (COALESCE(p_company_name, 'شركة جديدة'))
    RETURNING id INTO v_company_id;

    SELECT raw_user_meta_data->>'full_name', email
    INTO v_full_name, v_email
    FROM auth.users
    WHERE id = auth.uid();

    INSERT INTO public.profiles (id, full_name, email)
    VALUES (auth.uid(), v_full_name, v_email)
    ON CONFLICT (id) DO UPDATE
      SET full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
          email = COALESCE(EXCLUDED.email, public.profiles.email);

    INSERT INTO public.user_roles (user_id, company_id, role)
    VALUES (auth.uid(), v_company_id, 'OWNER');
  END IF;

  RETURN jsonb_build_object('company_id', v_company_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_my_membership()
RETURNS TABLE (company_id uuid, branch_id uuid, role text, company_name text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
SET row_security = on
AS $$
BEGIN
  RETURN QUERY
  SELECT ur.company_id, ur.branch_id, ur.role, c.name
  FROM public.user_roles ur
  LEFT JOIN public.companies c ON c.id = ur.company_id
  WHERE ur.user_id = auth.uid()
  ORDER BY ur.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_dashboard_kpis(
  p_company_id uuid,
  p_branch_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
SET row_security = on
AS $$
DECLARE
  role_value text;
  total_in numeric := 0;
  total_out numeric := 0;
  pending_count integer := 0;
BEGIN
  SELECT role
  INTO role_value
  FROM public.user_roles
  WHERE user_id = auth.uid()
    AND company_id = p_company_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF role_value NOT IN ('OWNER', 'ACCOUNTANT') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT COALESCE(SUM(amount), 0)
  INTO total_in
  FROM public.cash_movements
  WHERE company_id = p_company_id
    AND status = 'APPROVED'
    AND type = 'IN'
    AND (p_branch_id IS NULL OR branch_id = p_branch_id);

  SELECT COALESCE(SUM(amount), 0)
  INTO total_out
  FROM public.cash_movements
  WHERE company_id = p_company_id
    AND status = 'APPROVED'
    AND type = 'OUT'
    AND (p_branch_id IS NULL OR branch_id = p_branch_id);

  SELECT COUNT(*)
  INTO pending_count
  FROM public.cash_movements
  WHERE company_id = p_company_id
    AND status = 'SUBMITTED'
    AND (p_branch_id IS NULL OR branch_id = p_branch_id);

  RETURN jsonb_build_object(
    'total_in', COALESCE(total_in, 0),
    'total_out', COALESCE(total_out, 0),
    'net', COALESCE(total_in, 0) - COALESCE(total_out, 0),
    'pending_count', COALESCE(pending_count, 0)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_company_setup_status(p_company_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  has_access boolean;
  has_branch boolean := false;
  has_cost_center boolean := false;
  has_account boolean := false;
  has_category boolean := false;
  user_count integer := 0;
  setup_completed boolean := false;
  company_name text;
  cost_centers_supported boolean := false;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND company_id = p_company_id
  ) INTO has_access;

  IF NOT has_access THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT name, COALESCE(setup_completed, false)
  INTO company_name, setup_completed
  FROM public.companies
  WHERE id = p_company_id;

  SELECT EXISTS (
    SELECT 1
    FROM public.branches
    WHERE company_id = p_company_id
  ) INTO has_branch;

  SELECT EXISTS (
    SELECT 1
    FROM public.cash_accounts
    WHERE company_id = p_company_id
  ) INTO has_account;

  SELECT EXISTS (
    SELECT 1
    FROM public.categories
    WHERE company_id = p_company_id
      AND kind IN ('OUT', 'EXPENSE')
  ) INTO has_category;

  SELECT COUNT(*)
  INTO user_count
  FROM public.user_roles
  WHERE company_id = p_company_id;

  IF to_regclass('public.cost_centers') IS NOT NULL THEN
    cost_centers_supported := true;
    EXECUTE 'SELECT EXISTS (SELECT 1 FROM public.cost_centers WHERE company_id = $1)'
    INTO has_cost_center
    USING p_company_id;
  END IF;

  RETURN jsonb_build_object(
    'company_name', company_name,
    'setup_completed', setup_completed,
    'has_branch', COALESCE(has_branch, false),
    'has_cost_center', COALESCE(has_cost_center, false),
    'has_account', COALESCE(has_account, false),
    'has_category', COALESCE(has_category, false),
    'user_count', COALESCE(user_count, 0),
    'cost_centers_supported', cost_centers_supported
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.update_company_profile(
  p_company_id uuid,
  p_name text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_owner boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND company_id = p_company_id
      AND role = 'OWNER'
  ) INTO is_owner;

  IF NOT is_owner THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE public.companies
  SET name = COALESCE(p_name, name)
  WHERE id = p_company_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.seed_company_defaults(
  p_company_id uuid,
  p_branch_name text DEFAULT NULL,
  p_cost_center_name text DEFAULT NULL,
  p_account_name text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_owner boolean;
  branch_id uuid;
  cost_center_id uuid;
  account_id uuid;
  expense_category_id uuid;
  income_category_id uuid;
  branch_created boolean := false;
  cost_center_created boolean := false;
  account_created boolean := false;
  expense_category_created boolean := false;
  income_category_created boolean := false;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND company_id = p_company_id
      AND role = 'OWNER'
  ) INTO is_owner;

  IF NOT is_owner THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT id
  INTO branch_id
  FROM public.branches
  WHERE company_id = p_company_id
  ORDER BY created_at
  LIMIT 1;

  IF branch_id IS NULL THEN
    INSERT INTO public.branches (company_id, name, is_active)
    VALUES (p_company_id, COALESCE(p_branch_name, 'الفرع الرئيسي'), true)
    RETURNING id INTO branch_id;
    branch_created := true;
  END IF;

  IF to_regclass('public.cost_centers') IS NOT NULL THEN
    EXECUTE 'SELECT id FROM public.cost_centers WHERE company_id = $1 ORDER BY created_at LIMIT 1'
    INTO cost_center_id
    USING p_company_id;

    IF cost_center_id IS NULL THEN
      EXECUTE 'INSERT INTO public.cost_centers (company_id, branch_id, name, code, is_active) VALUES ($1, $2, $3, $4, true) RETURNING id'
      INTO cost_center_id
      USING p_company_id, branch_id, COALESCE(p_cost_center_name, 'المركز الرئيسي'), 'CC-001';
      cost_center_created := true;
    END IF;
  END IF;

  SELECT id
  INTO account_id
  FROM public.cash_accounts
  WHERE company_id = p_company_id
  ORDER BY created_at
  LIMIT 1;

  IF account_id IS NULL THEN
    INSERT INTO public.cash_accounts (company_id, branch_id, name, type, is_active)
    VALUES (p_company_id, branch_id, COALESCE(p_account_name, 'الصندوق الرئيسي'), 'CASH', true)
    RETURNING id INTO account_id;
    account_created := true;
  END IF;

  SELECT id
  INTO expense_category_id
  FROM public.categories
  WHERE company_id = p_company_id
    AND kind IN ('OUT', 'EXPENSE')
  ORDER BY created_at
  LIMIT 1;

  IF expense_category_id IS NULL THEN
    INSERT INTO public.categories (company_id, name, kind)
    VALUES (p_company_id, 'مصروفات عامة', 'OUT')
    RETURNING id INTO expense_category_id;
    expense_category_created := true;
  END IF;

  SELECT id
  INTO income_category_id
  FROM public.categories
  WHERE company_id = p_company_id
    AND kind IN ('IN', 'INCOME')
  ORDER BY created_at
  LIMIT 1;

  IF income_category_id IS NULL THEN
    INSERT INTO public.categories (company_id, name, kind)
    VALUES (p_company_id, 'إيرادات عامة', 'IN')
    RETURNING id INTO income_category_id;
    income_category_created := true;
  END IF;

  RETURN jsonb_build_object(
    'branch_id', branch_id,
    'cost_center_id', cost_center_id,
    'account_id', account_id,
    'expense_category_id', expense_category_id,
    'income_category_id', income_category_id,
    'created', jsonb_build_object(
      'branch', branch_created,
      'cost_center', cost_center_created,
      'account', account_created,
      'expense_category', expense_category_created,
      'income_category', income_category_created
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_company_setup(p_company_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_owner boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND company_id = p_company_id
      AND role = 'OWNER'
  ) INTO is_owner;

  IF NOT is_owner THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE public.companies
  SET setup_completed = true,
      setup_completed_at = now()
  WHERE id = p_company_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.list_cash_accounts(
  p_company_id uuid DEFAULT NULL,
  p_branch_id uuid DEFAULT NULL,
  p_active_only boolean DEFAULT NULL
)
RETURNS SETOF public.cash_accounts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
SET row_security = on
AS $$
DECLARE
  v_company_id uuid;
  role_value text;
BEGIN
  v_company_id := COALESCE(
    p_company_id,
    (SELECT company_id FROM public.user_roles WHERE user_id = auth.uid() ORDER BY created_at DESC LIMIT 1)
  );

  SELECT role
  INTO role_value
  FROM public.user_roles
  WHERE user_id = auth.uid()
    AND company_id = v_company_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF role_value IS NULL OR role_value NOT IN ('OWNER', 'ACCOUNTANT') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT *
  FROM public.cash_accounts
  WHERE company_id = v_company_id
    AND (p_branch_id IS NULL OR branch_id = p_branch_id)
    AND (p_active_only IS NULL OR is_active = p_active_only)
  ORDER BY name ASC;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_cash_account(
  p_company_id uuid,
  p_branch_id uuid DEFAULT NULL,
  p_name text
)
RETURNS public.cash_accounts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
SET row_security = on
AS $$
DECLARE
  role_value text;
  new_row public.cash_accounts;
BEGIN
  SELECT role
  INTO role_value
  FROM public.user_roles
  WHERE user_id = auth.uid()
    AND company_id = p_company_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF role_value IS NULL OR role_value <> 'OWNER' THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  INSERT INTO public.cash_accounts (company_id, branch_id, name, type, is_active)
  VALUES (p_company_id, p_branch_id, p_name, 'CASH', true)
  RETURNING * INTO new_row;

  RETURN new_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.toggle_cash_account_active(
  p_company_id uuid,
  p_account_id uuid,
  p_is_active boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
SET row_security = on
AS $$
DECLARE
  role_value text;
BEGIN
  SELECT role
  INTO role_value
  FROM public.user_roles
  WHERE user_id = auth.uid()
    AND company_id = p_company_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF role_value IS NULL OR role_value <> 'OWNER' THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE public.cash_accounts
  SET is_active = p_is_active
  WHERE id = p_account_id
    AND company_id = p_company_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.list_categories(
  p_company_id uuid DEFAULT NULL,
  p_kind text DEFAULT NULL
)
RETURNS SETOF public.categories
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
SET row_security = on
AS $$
DECLARE
  v_company_id uuid;
  role_value text;
BEGIN
  v_company_id := COALESCE(
    p_company_id,
    (SELECT company_id FROM public.user_roles WHERE user_id = auth.uid() ORDER BY created_at DESC LIMIT 1)
  );

  SELECT role
  INTO role_value
  FROM public.user_roles
  WHERE user_id = auth.uid()
    AND company_id = v_company_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF role_value IS NULL OR role_value NOT IN ('OWNER', 'ACCOUNTANT') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT *
  FROM public.categories
  WHERE company_id = v_company_id
    AND (
      p_kind IS NULL
      OR kind = p_kind
      OR (p_kind = 'OUT' AND kind = 'EXPENSE')
      OR (p_kind = 'EXPENSE' AND kind = 'OUT')
      OR (p_kind = 'IN' AND kind = 'INCOME')
      OR (p_kind = 'INCOME' AND kind = 'IN')
    )
  ORDER BY name ASC;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_category(
  p_company_id uuid,
  p_name text,
  p_kind text
)
RETURNS public.categories
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
SET row_security = on
AS $$
DECLARE
  role_value text;
  new_row public.categories;
  v_kind text;
BEGIN
  SELECT role
  INTO role_value
  FROM public.user_roles
  WHERE user_id = auth.uid()
    AND company_id = p_company_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF role_value IS NULL OR role_value <> 'OWNER' THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  v_kind := CASE
    WHEN p_kind = 'EXPENSE' THEN 'OUT'
    WHEN p_kind = 'INCOME' THEN 'IN'
    ELSE p_kind
  END;

  INSERT INTO public.categories (company_id, name, kind)
  VALUES (p_company_id, p_name, v_kind)
  RETURNING * INTO new_row;

  RETURN new_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_category(
  p_company_id uuid,
  p_category_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
SET row_security = on
AS $$
DECLARE
  role_value text;
BEGIN
  SELECT role
  INTO role_value
  FROM public.user_roles
  WHERE user_id = auth.uid()
    AND company_id = p_company_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF role_value IS NULL OR role_value <> 'OWNER' THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  DELETE FROM public.categories
  WHERE id = p_category_id
    AND company_id = p_company_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.list_cash_movements(
  p_company_id uuid,
  p_branch_id uuid DEFAULT NULL,
  p_status text DEFAULT NULL,
  p_type text DEFAULT NULL,
  p_from_date date DEFAULT NULL,
  p_to_date date DEFAULT NULL,
  p_limit integer DEFAULT NULL
)
RETURNS SETOF public.cash_movements
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
SET row_security = on
AS $$
DECLARE
  role_value text;
BEGIN
  SELECT role
  INTO role_value
  FROM public.user_roles
  WHERE user_id = auth.uid()
    AND company_id = p_company_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF role_value IS NULL OR role_value NOT IN ('OWNER', 'ACCOUNTANT') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT *
  FROM public.cash_movements
  WHERE company_id = p_company_id
    AND (p_branch_id IS NULL OR branch_id = p_branch_id)
    AND (p_status IS NULL OR status = p_status)
    AND (p_type IS NULL OR type = p_type)
    AND (p_from_date IS NULL OR movement_date >= p_from_date)
    AND (p_to_date IS NULL OR movement_date <= p_to_date)
  ORDER BY movement_date DESC, created_at DESC
  LIMIT COALESCE(p_limit, 1000);
END;
$$;

CREATE OR REPLACE FUNCTION public.create_cash_movement(
  p_company_id uuid,
  p_branch_id uuid DEFAULT NULL,
  p_account_id uuid,
  p_category_id uuid,
  p_type text,
  p_amount numeric,
  p_movement_date date,
  p_payment_method text DEFAULT 'CASH',
  p_notes text DEFAULT NULL,
  p_reference text DEFAULT NULL
)
RETURNS public.cash_movements
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
SET row_security = on
AS $$
DECLARE
  role_value text;
  account_company uuid;
  category_company uuid;
  new_row public.cash_movements;
BEGIN
  SELECT role
  INTO role_value
  FROM public.user_roles
  WHERE user_id = auth.uid()
    AND company_id = p_company_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF role_value IS NULL OR role_value NOT IN ('OWNER', 'ACCOUNTANT') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT company_id INTO account_company FROM public.cash_accounts WHERE id = p_account_id;
  IF account_company IS NULL OR account_company <> p_company_id THEN
    RAISE EXCEPTION 'Invalid account';
  END IF;

  SELECT company_id INTO category_company FROM public.categories WHERE id = p_category_id;
  IF category_company IS NULL OR category_company <> p_company_id THEN
    RAISE EXCEPTION 'Invalid category';
  END IF;

  INSERT INTO public.cash_movements (
    company_id,
    branch_id,
    account_id,
    category_id,
    type,
    status,
    amount,
    movement_date,
    payment_method,
    notes,
    reference,
    created_by
  )
  VALUES (
    p_company_id,
    p_branch_id,
    p_account_id,
    p_category_id,
    p_type,
    'DRAFT',
    p_amount,
    p_movement_date,
    p_payment_method,
    p_notes,
    p_reference,
    auth.uid()
  )
  RETURNING * INTO new_row;

  RETURN new_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_cash_movement_draft(
  p_company_id uuid,
  p_movement_id uuid,
  p_account_id uuid DEFAULT NULL,
  p_category_id uuid DEFAULT NULL,
  p_type text DEFAULT NULL,
  p_amount numeric DEFAULT NULL,
  p_movement_date date DEFAULT NULL,
  p_payment_method text DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_reference text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
SET row_security = on
AS $$
DECLARE
  role_value text;
BEGIN
  SELECT role
  INTO role_value
  FROM public.user_roles
  WHERE user_id = auth.uid()
    AND company_id = p_company_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF role_value IS NULL OR role_value NOT IN ('OWNER', 'ACCOUNTANT') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE public.cash_movements
  SET
    account_id = COALESCE(p_account_id, account_id),
    category_id = COALESCE(p_category_id, category_id),
    type = COALESCE(p_type, type),
    amount = COALESCE(p_amount, amount),
    movement_date = COALESCE(p_movement_date, movement_date),
    payment_method = COALESCE(p_payment_method, payment_method),
    notes = COALESCE(p_notes, notes),
    reference = COALESCE(p_reference, reference)
  WHERE id = p_movement_id
    AND company_id = p_company_id
    AND status = 'DRAFT';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Movement not editable';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_cash_movement_status(
  p_company_id uuid,
  p_movement_id uuid,
  p_status text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
SET row_security = on
AS $$
DECLARE
  role_value text;
BEGIN
  SELECT role
  INTO role_value
  FROM public.user_roles
  WHERE user_id = auth.uid()
    AND company_id = p_company_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF role_value IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF p_status IN ('SUBMITTED') AND role_value NOT IN ('OWNER', 'ACCOUNTANT') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF p_status IN ('APPROVED', 'REJECTED') AND role_value <> 'OWNER' THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE public.cash_movements
  SET status = p_status,
      approved_by = CASE WHEN p_status = 'APPROVED' THEN auth.uid() ELSE approved_by END,
      approved_at = CASE WHEN p_status = 'APPROVED' THEN now() ELSE approved_at END,
      rejected_reason = CASE WHEN p_status = 'REJECTED' THEN rejected_reason ELSE NULL END
  WHERE id = p_movement_id
    AND company_id = p_company_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Movement not found';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_cash_movement(
  p_company_id uuid,
  p_movement_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
SET row_security = on
AS $$
DECLARE
  role_value text;
BEGIN
  SELECT role
  INTO role_value
  FROM public.user_roles
  WHERE user_id = auth.uid()
    AND company_id = p_company_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF role_value IS NULL OR role_value NOT IN ('OWNER', 'ACCOUNTANT') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  DELETE FROM public.cash_movements
  WHERE id = p_movement_id
    AND company_id = p_company_id
    AND status = 'DRAFT';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Movement not deletable';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.list_pending_movements(
  p_company_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  amount numeric,
  movement_date date,
  notes text,
  created_at timestamptz,
  creator_name text,
  type text,
  category_id uuid,
  category_name text,
  category_kind text,
  account_id uuid,
  account_name text,
  account_type text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
SET row_security = on
AS $$
DECLARE
  v_company_id uuid;
  role_value text;
BEGIN
  v_company_id := COALESCE(
    p_company_id,
    (SELECT company_id FROM public.user_roles WHERE user_id = auth.uid() ORDER BY created_at DESC LIMIT 1)
  );

  SELECT role
  INTO role_value
  FROM public.user_roles
  WHERE user_id = auth.uid()
    AND company_id = v_company_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF role_value IS NULL OR role_value <> 'OWNER' THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT m.id,
         m.amount,
         m.movement_date,
         m.notes,
         m.created_at,
         p.full_name,
         m.type,
         m.category_id,
         c.name,
         c.kind,
         m.account_id,
         a.name,
         a.type
  FROM public.cash_movements m
  LEFT JOIN public.profiles p ON p.id = m.created_by
  LEFT JOIN public.categories c ON c.id = m.category_id
  LEFT JOIN public.cash_accounts a ON a.id = m.account_id
  WHERE m.company_id = v_company_id
    AND m.status = 'SUBMITTED'
  ORDER BY m.created_at ASC;
END;
$$;

CREATE OR REPLACE FUNCTION public.process_movement_action(
  p_movement_id uuid,
  p_action text,
  p_comment text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
SET row_security = on
AS $$
DECLARE
  movement_company uuid;
  role_value text;
BEGIN
  SELECT company_id
  INTO movement_company
  FROM public.cash_movements
  WHERE id = p_movement_id;

  SELECT role
  INTO role_value
  FROM public.user_roles
  WHERE user_id = auth.uid()
    AND company_id = movement_company
  ORDER BY created_at DESC
  LIMIT 1;

  IF role_value IS NULL OR role_value <> 'OWNER' THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF p_action NOT IN ('APPROVED', 'REJECTED') THEN
    RAISE EXCEPTION 'Invalid action';
  END IF;

  UPDATE public.cash_movements
  SET status = p_action,
      approved_by = CASE WHEN p_action = 'APPROVED' THEN auth.uid() ELSE approved_by END,
      approved_at = CASE WHEN p_action = 'APPROVED' THEN now() ELSE approved_at END,
      rejected_reason = CASE WHEN p_action = 'REJECTED' THEN p_comment ELSE rejected_reason END
  WHERE id = p_movement_id
    AND status = 'SUBMITTED';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Movement not pending';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.list_custodies(
  p_company_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  company_id uuid,
  user_id uuid,
  branch_id uuid,
  name text,
  opening_balance numeric,
  max_limit numeric,
  is_active boolean,
  current_balance numeric,
  employee_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
SET row_security = on
AS $$
DECLARE
  v_company_id uuid;
  role_value text;
BEGIN
  v_company_id := COALESCE(
    p_company_id,
    (SELECT company_id FROM public.user_roles WHERE user_id = auth.uid() ORDER BY created_at DESC LIMIT 1)
  );

  SELECT role
  INTO role_value
  FROM public.user_roles
  WHERE user_id = auth.uid()
    AND company_id = v_company_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF role_value IS NULL OR role_value NOT IN ('OWNER', 'ACCOUNTANT', 'CUSTODY_OFFICER') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT c.id,
         c.company_id,
         c.user_id,
         c.branch_id,
         c.name,
         c.opening_balance,
         c.max_limit,
         c.is_active,
         COALESCE(c.opening_balance, 0) + COALESCE(SUM(
           CASE
             WHEN t.tx_type IN ('ISSUE', 'RETURN') THEN t.amount
             WHEN t.tx_type IN ('SPEND', 'SETTLEMENT') THEN -t.amount
             ELSE 0
           END
         ), 0) AS current_balance,
         p.full_name
  FROM public.custodies c
  LEFT JOIN public.custody_transactions t ON t.custody_id = c.id
  LEFT JOIN public.profiles p ON p.id = c.user_id
  WHERE c.company_id = v_company_id
    AND c.is_active = true
    AND (role_value IN ('OWNER', 'ACCOUNTANT') OR c.user_id = auth.uid())
  GROUP BY c.id, p.full_name;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_custody_balance(
  p_custody_id uuid
)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
SET row_security = on
AS $$
DECLARE
  v_company_id uuid;
  role_value text;
  balance numeric;
  custody_owner uuid;
  opening_balance numeric;
BEGIN
  SELECT company_id, user_id, opening_balance
  INTO v_company_id, custody_owner, opening_balance
  FROM public.custodies
  WHERE id = p_custody_id;

  SELECT role
  INTO role_value
  FROM public.user_roles
  WHERE user_id = auth.uid()
    AND company_id = v_company_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF role_value IS NULL OR role_value NOT IN ('OWNER', 'ACCOUNTANT', 'CUSTODY_OFFICER') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF role_value = 'CUSTODY_OFFICER' AND custody_owner <> auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT COALESCE(opening_balance, 0) + COALESCE(SUM(
    CASE
      WHEN tx_type IN ('ISSUE', 'RETURN') THEN amount
      WHEN tx_type IN ('SPEND', 'SETTLEMENT') THEN -amount
      ELSE 0
    END
  ), 0)
  INTO balance
  FROM public.custody_transactions
  WHERE custody_id = p_custody_id;

  RETURN COALESCE(balance, 0);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_my_custody_balance(
  p_company_id uuid DEFAULT NULL
)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
SET row_security = on
AS $$
DECLARE
  v_company_id uuid;
  role_value text;
  total_balance numeric;
BEGIN
  v_company_id := COALESCE(
    p_company_id,
    (SELECT company_id FROM public.user_roles WHERE user_id = auth.uid() ORDER BY created_at DESC LIMIT 1)
  );

  SELECT role
  INTO role_value
  FROM public.user_roles
  WHERE user_id = auth.uid()
    AND company_id = v_company_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF role_value IS NULL OR role_value NOT IN ('OWNER', 'ACCOUNTANT', 'CUSTODY_OFFICER') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT COALESCE(SUM(balance), 0)
  INTO total_balance
  FROM (
    SELECT COALESCE(c.opening_balance, 0) + COALESCE(SUM(
      CASE
        WHEN t.tx_type IN ('ISSUE', 'RETURN') THEN t.amount
        WHEN t.tx_type IN ('SPEND', 'SETTLEMENT') THEN -t.amount
        ELSE 0
      END
    ), 0) AS balance
    FROM public.custodies c
    LEFT JOIN public.custody_transactions t ON t.custody_id = c.id
    WHERE c.company_id = v_company_id
      AND c.is_active = true
      AND (role_value IN ('OWNER', 'ACCOUNTANT') OR c.user_id = auth.uid())
    GROUP BY c.id
  ) balances;

  RETURN COALESCE(total_balance, 0);
END;
$$;

CREATE OR REPLACE FUNCTION public.list_custody_transactions(
  p_custody_id uuid
)
RETURNS SETOF public.custody_transactions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
SET row_security = on
AS $$
DECLARE
  v_company_id uuid;
  role_value text;
  custody_owner uuid;
BEGIN
  SELECT company_id, user_id
  INTO v_company_id, custody_owner
  FROM public.custodies
  WHERE id = p_custody_id;

  SELECT role
  INTO role_value
  FROM public.user_roles
  WHERE user_id = auth.uid()
    AND company_id = v_company_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF role_value IS NULL OR role_value NOT IN ('OWNER', 'ACCOUNTANT', 'CUSTODY_OFFICER') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF role_value = 'CUSTODY_OFFICER' AND custody_owner <> auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT *
  FROM public.custody_transactions
  WHERE custody_id = p_custody_id
  ORDER BY created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.process_custody_transaction(
  p_custody_id uuid,
  p_type text,
  p_amount numeric,
  p_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
SET row_security = on
AS $$
DECLARE
  v_company_id uuid;
  role_value text;
  custody_owner uuid;
  current_balance numeric;
  new_tx public.custody_transactions;
BEGIN
  SELECT company_id, user_id
  INTO v_company_id, custody_owner
  FROM public.custodies
  WHERE id = p_custody_id;

  SELECT role
  INTO role_value
  FROM public.user_roles
  WHERE user_id = auth.uid()
    AND company_id = v_company_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF role_value IS NULL OR role_value NOT IN ('OWNER', 'CUSTODY_OFFICER') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF role_value = 'CUSTODY_OFFICER' AND custody_owner <> auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  current_balance := public.get_custody_balance(p_custody_id);

  IF p_type IN ('SPEND', 'SETTLEMENT') AND current_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  INSERT INTO public.custody_transactions (
    custody_id,
    company_id,
    tx_type,
    amount,
    tx_date,
    status,
    notes,
    created_by
  )
  VALUES (
    p_custody_id,
    v_company_id,
    p_type,
    p_amount,
    CURRENT_DATE,
    'APPROVED',
    p_notes,
    auth.uid()
  )
  RETURNING * INTO new_tx;

  RETURN jsonb_build_object('transaction_id', new_tx.id);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_expected_balance(
  p_account_id uuid,
  p_close_date date
)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
SET row_security = on
AS $$
DECLARE
  v_company_id uuid;
  role_value text;
  balance numeric;
BEGIN
  SELECT company_id
  INTO v_company_id
  FROM public.cash_accounts
  WHERE id = p_account_id;

  SELECT role
  INTO role_value
  FROM public.user_roles
  WHERE user_id = auth.uid()
    AND company_id = v_company_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF role_value IS NULL OR role_value NOT IN ('OWNER', 'ACCOUNTANT') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT COALESCE(SUM(
    CASE
      WHEN type = 'IN' THEN amount
      WHEN type = 'OUT' THEN -amount
      ELSE 0
    END
  ), 0)
  INTO balance
  FROM public.cash_movements
  WHERE account_id = p_account_id
    AND status = 'APPROVED'
    AND movement_date <= p_close_date;

  RETURN COALESCE(balance, 0);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_dashboard_summary(
  p_date_from date,
  p_date_to date,
  p_account_id uuid DEFAULT NULL
)
RETURNS TABLE (
  total_in numeric,
  total_out numeric,
  net_balance numeric,
  movements_count integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
SET row_security = on
AS $$
DECLARE
  v_company_id uuid;
  role_value text;
BEGIN
  IF p_account_id IS NOT NULL THEN
    SELECT company_id
    INTO v_company_id
    FROM public.cash_accounts
    WHERE id = p_account_id;
  ELSE
    v_company_id := (SELECT company_id FROM public.user_roles WHERE user_id = auth.uid() ORDER BY created_at DESC LIMIT 1);
  END IF;

  SELECT role
  INTO role_value
  FROM public.user_roles
  WHERE user_id = auth.uid()
    AND company_id = v_company_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF role_value IS NULL OR role_value NOT IN ('OWNER', 'ACCOUNTANT') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT
    COALESCE(SUM(CASE WHEN type = 'IN' THEN amount ELSE 0 END), 0) AS total_in,
    COALESCE(SUM(CASE WHEN type = 'OUT' THEN amount ELSE 0 END), 0) AS total_out,
    COALESCE(SUM(CASE WHEN type = 'IN' THEN amount ELSE 0 END), 0) -
      COALESCE(SUM(CASE WHEN type = 'OUT' THEN amount ELSE 0 END), 0) AS net_balance,
    COUNT(*)::int AS movements_count
  FROM public.cash_movements
  WHERE company_id = v_company_id
    AND status = 'APPROVED'
    AND (p_account_id IS NULL OR account_id = p_account_id)
    AND movement_date BETWEEN p_date_from AND p_date_to;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_expense_by_category(
  p_date_from date,
  p_date_to date,
  p_account_id uuid DEFAULT NULL
)
RETURNS TABLE (
  category_id uuid,
  category_name text,
  total numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
SET row_security = on
AS $$
DECLARE
  v_company_id uuid;
  role_value text;
BEGIN
  IF p_account_id IS NOT NULL THEN
    SELECT company_id
    INTO v_company_id
    FROM public.cash_accounts
    WHERE id = p_account_id;
  ELSE
    v_company_id := (SELECT company_id FROM public.user_roles WHERE user_id = auth.uid() ORDER BY created_at DESC LIMIT 1);
  END IF;

  SELECT role
  INTO role_value
  FROM public.user_roles
  WHERE user_id = auth.uid()
    AND company_id = v_company_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF role_value IS NULL OR role_value NOT IN ('OWNER', 'ACCOUNTANT') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT
    c.id,
    c.name,
    COALESCE(SUM(m.amount), 0)
  FROM public.cash_movements m
  JOIN public.categories c ON c.id = m.category_id
  WHERE m.company_id = v_company_id
    AND m.status = 'APPROVED'
    AND m.type = 'OUT'
    AND (p_account_id IS NULL OR m.account_id = p_account_id)
    AND m.movement_date BETWEEN p_date_from AND p_date_to
  GROUP BY c.id, c.name
  ORDER BY c.name ASC;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_weekly_in_out(
  p_weeks integer DEFAULT 6,
  p_account_id uuid DEFAULT NULL
)
RETURNS TABLE (
  week_start date,
  total_in numeric,
  total_out numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
SET row_security = on
AS $$
DECLARE
  v_company_id uuid;
  role_value text;
  start_week date;
  end_week date;
BEGIN
  IF p_account_id IS NOT NULL THEN
    SELECT company_id
    INTO v_company_id
    FROM public.cash_accounts
    WHERE id = p_account_id;
  ELSE
    v_company_id := (SELECT company_id FROM public.user_roles WHERE user_id = auth.uid() ORDER BY created_at DESC LIMIT 1);
  END IF;

  SELECT role
  INTO role_value
  FROM public.user_roles
  WHERE user_id = auth.uid()
    AND company_id = v_company_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF role_value IS NULL OR role_value NOT IN ('OWNER', 'ACCOUNTANT') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  start_week := date_trunc('week', current_date)::date - (p_weeks - 1) * 7;
  end_week := date_trunc('week', current_date)::date;

  RETURN QUERY
  SELECT
    week_start::date,
    COALESCE(SUM(CASE WHEN m.type = 'IN' THEN m.amount ELSE 0 END), 0) AS total_in,
    COALESCE(SUM(CASE WHEN m.type = 'OUT' THEN m.amount ELSE 0 END), 0) AS total_out
  FROM generate_series(start_week, end_week, interval '1 week') AS week_start
  LEFT JOIN public.cash_movements m
    ON date_trunc('week', m.movement_date) = week_start
    AND m.company_id = v_company_id
    AND m.status = 'APPROVED'
    AND (p_account_id IS NULL OR m.account_id = p_account_id)
  GROUP BY week_start
  ORDER BY week_start ASC;
END;
$$;

CREATE OR REPLACE FUNCTION public.list_branches()
RETURNS SETOF public.branches
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
SET row_security = on
AS $$
DECLARE
  v_company_id uuid;
  role_value text;
BEGIN
  v_company_id := (SELECT company_id FROM public.user_roles WHERE user_id = auth.uid() ORDER BY created_at DESC LIMIT 1);

  SELECT role
  INTO role_value
  FROM public.user_roles
  WHERE user_id = auth.uid()
    AND company_id = v_company_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF role_value IS NULL OR role_value <> 'OWNER' THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT *
  FROM public.branches
  WHERE company_id = v_company_id
  ORDER BY created_at ASC;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_branch(
  p_name text
)
RETURNS public.branches
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
SET row_security = on
AS $$
DECLARE
  v_company_id uuid;
  role_value text;
  new_row public.branches;
BEGIN
  v_company_id := (SELECT company_id FROM public.user_roles WHERE user_id = auth.uid() ORDER BY created_at DESC LIMIT 1);

  SELECT role
  INTO role_value
  FROM public.user_roles
  WHERE user_id = auth.uid()
    AND company_id = v_company_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF role_value IS NULL OR role_value <> 'OWNER' THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  INSERT INTO public.branches (company_id, name, is_active)
  VALUES (v_company_id, p_name, true)
  RETURNING * INTO new_row;

  RETURN new_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.toggle_branch_status(
  p_branch_id uuid,
  p_is_active boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
SET row_security = on
AS $$
DECLARE
  v_company_id uuid;
  role_value text;
BEGIN
  SELECT company_id
  INTO v_company_id
  FROM public.branches
  WHERE id = p_branch_id;

  SELECT role
  INTO role_value
  FROM public.user_roles
  WHERE user_id = auth.uid()
    AND company_id = v_company_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF role_value IS NULL OR role_value <> 'OWNER' THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE public.branches
  SET is_active = p_is_active
  WHERE id = p_branch_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.list_company_users()
RETURNS TABLE (
  role text,
  user_id uuid,
  company_id uuid,
  full_name text,
  email text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
SET row_security = on
AS $$
DECLARE
  v_company_id uuid;
  role_value text;
BEGIN
  v_company_id := (SELECT company_id FROM public.user_roles WHERE user_id = auth.uid() ORDER BY created_at DESC LIMIT 1);

  SELECT role
  INTO role_value
  FROM public.user_roles
  WHERE user_id = auth.uid()
    AND company_id = v_company_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF role_value IS NULL OR role_value <> 'OWNER' THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT ur.role,
         ur.user_id,
         ur.company_id,
         p.full_name,
         p.email
  FROM public.user_roles ur
  LEFT JOIN public.profiles p ON p.id = ur.user_id
  WHERE ur.company_id = v_company_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_user_role(
  p_user_id uuid,
  p_company_id uuid,
  p_role text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
SET row_security = on
AS $$
DECLARE
  role_value text;
BEGIN
  SELECT role
  INTO role_value
  FROM public.user_roles
  WHERE user_id = auth.uid()
    AND company_id = p_company_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF role_value IS NULL OR role_value <> 'OWNER' THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE public.user_roles
  SET role = p_role
  WHERE user_id = p_user_id
    AND company_id = p_company_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.list_movements()
RETURNS TABLE (
  id uuid,
  company_id uuid,
  branch_id uuid,
  account_id uuid,
  category_id uuid,
  type text,
  amount numeric,
  payment_method text,
  reference text,
  notes text,
  movement_date date,
  created_by uuid,
  status text,
  approved_by uuid,
  approved_at timestamptz,
  rejected_reason text,
  created_at timestamptz,
  category_name text,
  category_kind text,
  account_name text,
  account_type text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
SET row_security = on
AS $$
DECLARE
  v_company_id uuid;
  role_value text;
BEGIN
  v_company_id := (SELECT company_id FROM public.user_roles WHERE user_id = auth.uid() ORDER BY created_at DESC LIMIT 1);

  SELECT role
  INTO role_value
  FROM public.user_roles
  WHERE user_id = auth.uid()
    AND company_id = v_company_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF role_value IS NULL OR role_value NOT IN ('OWNER', 'ACCOUNTANT') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT m.id,
         m.company_id,
         m.branch_id,
         m.account_id,
         m.category_id,
         m.type,
         m.amount,
         m.payment_method,
         m.reference,
         m.notes,
         m.movement_date,
         m.created_by,
         m.status,
         m.approved_by,
         m.approved_at,
         m.rejected_reason,
         m.created_at,
         c.name,
         c.kind,
         a.name,
         a.type
  FROM public.cash_movements m
  LEFT JOIN public.categories c ON c.id = m.category_id
  LEFT JOIN public.cash_accounts a ON a.id = m.account_id
  WHERE m.company_id = v_company_id
  ORDER BY m.movement_date DESC, m.created_at DESC
  LIMIT 100;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_movement_by_id(
  p_movement_id uuid
)
RETURNS TABLE (
  id uuid,
  company_id uuid,
  branch_id uuid,
  account_id uuid,
  category_id uuid,
  type text,
  amount numeric,
  payment_method text,
  reference text,
  notes text,
  movement_date date,
  created_by uuid,
  status text,
  approved_by uuid,
  approved_at timestamptz,
  rejected_reason text,
  created_at timestamptz,
  category_name text,
  category_kind text,
  account_name text,
  account_type text,
  account_branch_id uuid,
  branch_name text,
  creator_name text,
  approver_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
SET row_security = on
AS $$
DECLARE
  v_company_id uuid;
  role_value text;
BEGIN
  SELECT company_id
  INTO v_company_id
  FROM public.cash_movements
  WHERE id = p_movement_id;

  SELECT role
  INTO role_value
  FROM public.user_roles
  WHERE user_id = auth.uid()
    AND company_id = v_company_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF role_value IS NULL OR role_value NOT IN ('OWNER', 'ACCOUNTANT') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT m.id,
         m.company_id,
         m.branch_id,
         m.account_id,
         m.category_id,
         m.type,
         m.amount,
         m.payment_method,
         m.reference,
         m.notes,
         m.movement_date,
         m.created_by,
         m.status,
         m.approved_by,
         m.approved_at,
         m.rejected_reason,
         m.created_at,
         c.name,
         c.kind,
         a.name,
         a.type,
         a.branch_id,
         b.name,
         creator.full_name,
         approver.full_name
  FROM public.cash_movements m
  LEFT JOIN public.categories c ON c.id = m.category_id
  LEFT JOIN public.cash_accounts a ON a.id = m.account_id
  LEFT JOIN public.branches b ON b.id = m.branch_id
  LEFT JOIN public.profiles creator ON creator.id = m.created_by
  LEFT JOIN public.profiles approver ON approver.id = m.approved_by
  WHERE m.id = p_movement_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_movement_audit_logs(
  p_movement_id uuid
)
RETURNS TABLE (
  id uuid,
  company_id uuid,
  actor_id uuid,
  action text,
  entity_type text,
  entity_id uuid,
  comment text,
  metadata jsonb,
  created_at timestamptz,
  actor_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
SET row_security = on
AS $$
DECLARE
  v_company_id uuid;
  role_value text;
BEGIN
  SELECT company_id
  INTO v_company_id
  FROM public.cash_movements
  WHERE id = p_movement_id;

  SELECT role
  INTO role_value
  FROM public.user_roles
  WHERE user_id = auth.uid()
    AND company_id = v_company_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF role_value IS NULL OR role_value NOT IN ('OWNER', 'ACCOUNTANT') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT l.id,
         l.company_id,
         l.actor_id,
         l.action,
         l.entity_type,
         l.entity_id,
         l.comment,
         l.metadata,
         l.created_at,
         p.full_name
  FROM public.audit_logs l
  LEFT JOIN public.profiles p ON p.id = l.actor_id
  WHERE l.entity_id = p_movement_id
    AND l.entity_type = 'CASH_MOVEMENT'
  ORDER BY l.created_at ASC;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_movement(
  p_account_id uuid,
  p_category_id uuid,
  p_type text,
  p_amount numeric,
  p_movement_date date,
  p_notes text DEFAULT NULL,
  p_reference text DEFAULT NULL,
  p_payment_method text DEFAULT 'CASH',
  p_status text DEFAULT 'DRAFT'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
SET row_security = on
AS $$
DECLARE
  v_company_id uuid;
  role_value text;
  movement_id uuid;
BEGIN
  SELECT company_id
  INTO v_company_id
  FROM public.cash_accounts
  WHERE id = p_account_id;

  SELECT role
  INTO role_value
  FROM public.user_roles
  WHERE user_id = auth.uid()
    AND company_id = v_company_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF role_value IS NULL OR role_value NOT IN ('OWNER', 'ACCOUNTANT') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF p_status IS NOT NULL AND p_status NOT IN ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED') THEN
    RAISE EXCEPTION 'Invalid status';
  END IF;

  INSERT INTO public.cash_movements (
    company_id,
    account_id,
    category_id,
    type,
    amount,
    movement_date,
    notes,
    reference,
    payment_method,
    status,
    created_by
  )
  VALUES (
    v_company_id,
    p_account_id,
    p_category_id,
    p_type,
    p_amount,
    p_movement_date,
    p_notes,
    p_reference,
    p_payment_method,
    COALESCE(p_status, 'DRAFT'),
    auth.uid()
  )
  RETURNING id INTO movement_id;

  RETURN movement_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.list_movement_attachments(
  p_movement_id uuid
)
RETURNS TABLE (
  id uuid,
  company_id uuid,
  movement_id uuid,
  storage_path text,
  file_name text,
  mime_type text,
  file_size integer,
  uploaded_by uuid,
  uploaded_at timestamptz,
  uploader_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
SET row_security = on
AS $$
DECLARE
  v_company_id uuid;
  role_value text;
BEGIN
  SELECT company_id
  INTO v_company_id
  FROM public.cash_movements
  WHERE id = p_movement_id;

  SELECT role
  INTO role_value
  FROM public.user_roles
  WHERE user_id = auth.uid()
    AND company_id = v_company_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF role_value IS NULL OR role_value NOT IN ('OWNER', 'ACCOUNTANT') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT a.id,
         a.company_id,
         a.movement_id,
         a.storage_path,
         a.file_name,
         a.mime_type,
         a.file_size,
         a.uploaded_by,
         a.uploaded_at,
         p.full_name
  FROM public.movement_attachments a
  LEFT JOIN public.profiles p ON p.id = a.uploaded_by
  WHERE a.movement_id = p_movement_id
  ORDER BY a.uploaded_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_movement_attachment(
  p_movement_id uuid,
  p_storage_path text,
  p_file_name text,
  p_mime_type text,
  p_file_size integer
)
RETURNS public.movement_attachments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
SET row_security = on
AS $$
DECLARE
  v_company_id uuid;
  role_value text;
  new_row public.movement_attachments;
BEGIN
  SELECT company_id
  INTO v_company_id
  FROM public.cash_movements
  WHERE id = p_movement_id;

  SELECT role
  INTO role_value
  FROM public.user_roles
  WHERE user_id = auth.uid()
    AND company_id = v_company_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF role_value IS NULL OR role_value NOT IN ('OWNER', 'ACCOUNTANT') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  INSERT INTO public.movement_attachments (
    company_id,
    movement_id,
    storage_path,
    file_name,
    mime_type,
    file_size,
    uploaded_by
  )
  VALUES (
    v_company_id,
    p_movement_id,
    p_storage_path,
    p_file_name,
    p_mime_type,
    p_file_size,
    auth.uid()
  )
  RETURNING * INTO new_row;

  RETURN new_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_movement_attachment(
  p_attachment_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
SET row_security = on
AS $$
DECLARE
  v_company_id uuid;
  role_value text;
BEGIN
  SELECT company_id
  INTO v_company_id
  FROM public.movement_attachments
  WHERE id = p_attachment_id;

  SELECT role
  INTO role_value
  FROM public.user_roles
  WHERE user_id = auth.uid()
    AND company_id = v_company_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF role_value IS NULL OR role_value NOT IN ('OWNER', 'ACCOUNTANT') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  DELETE FROM public.movement_attachments
  WHERE id = p_attachment_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_daily_close(
  p_account_id uuid,
  p_close_date date,
  p_expected_balance numeric,
  p_actual_balance numeric,
  p_note text DEFAULT NULL
)
RETURNS public.daily_closes
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
SET row_security = on
AS $$
DECLARE
  v_company_id uuid;
  role_value text;
  new_row public.daily_closes;
BEGIN
  SELECT company_id
  INTO v_company_id
  FROM public.cash_accounts
  WHERE id = p_account_id;

  SELECT role
  INTO role_value
  FROM public.user_roles
  WHERE user_id = auth.uid()
    AND company_id = v_company_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF role_value IS NULL OR role_value NOT IN ('OWNER', 'ACCOUNTANT') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  INSERT INTO public.daily_closes (
    company_id,
    account_id,
    close_date,
    expected_balance,
    actual_balance,
    note
  )
  VALUES (
    v_company_id,
    p_account_id,
    p_close_date,
    p_expected_balance,
    p_actual_balance,
    p_note
  )
  RETURNING * INTO new_row;

  RETURN new_row;
END;
$$;

-- Grants
REVOKE ALL ON FUNCTION public.create_company_with_owner(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_my_membership() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_dashboard_kpis(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_company_setup_status(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_company_profile(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.seed_company_defaults(uuid, text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.complete_company_setup(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.list_cash_accounts(uuid, uuid, boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_cash_account(uuid, uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.toggle_cash_account_active(uuid, uuid, boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.list_categories(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_category(uuid, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.delete_category(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.list_cash_movements(uuid, uuid, text, text, date, date, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_cash_movement(uuid, uuid, uuid, uuid, text, numeric, date, text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_cash_movement_draft(uuid, uuid, uuid, uuid, text, numeric, date, text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_cash_movement_status(uuid, uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.delete_cash_movement(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.list_pending_movements(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.process_movement_action(uuid, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.list_custodies(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_custody_balance(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_my_custody_balance(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.list_custody_transactions(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.process_custody_transaction(uuid, text, numeric, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_expected_balance(uuid, date) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_dashboard_summary(date, date, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_expense_by_category(date, date, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_weekly_in_out(integer, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.list_branches() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_branch(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.toggle_branch_status(uuid, boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.list_company_users() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_user_role(uuid, uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.list_movements() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_movement_by_id(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_movement_audit_logs(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_movement(uuid, uuid, text, numeric, date, text, text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.list_movement_attachments(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_movement_attachment(uuid, text, text, text, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.delete_movement_attachment(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_daily_close(uuid, date, numeric, numeric, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.create_company_with_owner(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_membership() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_dashboard_kpis(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_company_setup_status(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_company_profile(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.seed_company_defaults(uuid, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_company_setup(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_cash_accounts(uuid, uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_cash_account(uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_cash_account_active(uuid, uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_categories(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_category(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_category(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_cash_movements(uuid, uuid, text, text, date, date, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_cash_movement(uuid, uuid, uuid, uuid, text, numeric, date, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_cash_movement_draft(uuid, uuid, uuid, uuid, text, numeric, date, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_cash_movement_status(uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_cash_movement(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_pending_movements(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_movement_action(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_custodies(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_custody_balance(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_custody_balance(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_custody_transactions(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_custody_transaction(uuid, text, numeric, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_expected_balance(uuid, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_dashboard_summary(date, date, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_expense_by_category(date, date, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_weekly_in_out(integer, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_branches() TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_branch(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_branch_status(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_company_users() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_role(uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_movements() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_movement_by_id(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_movement_audit_logs(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_movement(uuid, uuid, text, numeric, date, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_movement_attachments(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_movement_attachment(uuid, text, text, text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_movement_attachment(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_daily_close(uuid, date, numeric, numeric, text) TO authenticated;

-- Schema cache reload
NOTIFY pgrst, 'reload schema';
