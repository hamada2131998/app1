ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS setup_completed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS setup_completed_at timestamptz;

CREATE OR REPLACE FUNCTION public.get_dashboard_kpis(
  p_company_id uuid,
  p_branch_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  has_access boolean;
  total_in numeric := 0;
  total_out numeric := 0;
  pending_count integer := 0;
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
    AND kind = 'OUT'
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
    AND kind = 'IN'
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

GRANT EXECUTE ON FUNCTION public.get_dashboard_kpis(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_company_setup_status(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_company_profile(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.seed_company_defaults(uuid, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_company_setup(uuid) TO authenticated;
