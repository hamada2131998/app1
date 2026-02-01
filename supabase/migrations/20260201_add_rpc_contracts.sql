-- RPC Contracts and Role Updates for Saitara

-- Normalize roles
UPDATE public.user_roles
SET role = 'CUSTODY_OFFICER'
WHERE role = 'EMPLOYEE';

ALTER TABLE public.user_roles
  DROP CONSTRAINT IF EXISTS user_roles_role_check;

ALTER TABLE public.user_roles
  ADD CONSTRAINT user_roles_role_check
  CHECK (role IN ('OWNER', 'ACCOUNTANT', 'CUSTODY_OFFICER'));

-- Membership lookup
CREATE OR REPLACE FUNCTION public.get_my_membership()
RETURNS TABLE (company_id uuid, branch_id uuid, role text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
SET row_security = on
AS $$
BEGIN
  RETURN QUERY
  SELECT ur.company_id, ur.branch_id, ur.role
  FROM public.user_roles ur
  WHERE ur.user_id = auth.uid()
  ORDER BY ur.created_at DESC;
END;
$$;

-- Dashboard KPIs (owner/accountant only)
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
  has_access boolean;
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

  has_access := role_value IN ('OWNER', 'ACCOUNTANT');

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

-- Cash accounts
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

-- Categories
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
    AND (p_kind IS NULL OR kind = p_kind)
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

  INSERT INTO public.categories (company_id, name, kind)
  VALUES (p_company_id, p_name, p_kind)
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

-- Cash movements
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

-- Approvals
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

-- Custody
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
    tx_type,
    amount,
    tx_date,
    status,
    notes,
    created_by
  )
  VALUES (
    p_custody_id,
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

-- Daily close expected balance
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

-- Reports
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

-- Branches and users
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

-- Movements & audit logs (legacy UI support)
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

-- Attachments
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

-- Daily close
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
    account_id,
    close_date,
    expected_balance,
    actual_balance,
    note
  )
  VALUES (
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

GRANT EXECUTE ON FUNCTION public.get_my_membership() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_dashboard_kpis(uuid, uuid) TO authenticated;
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
