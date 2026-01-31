-- Sprint 1: cost centers, custody, approvals, receipts

-- 1) Cost Centers
CREATE TABLE IF NOT EXISTS public.cost_centers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(company_id, name)
);

ALTER TABLE public.cost_centers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Company members can access cost centers" ON public.cost_centers;
CREATE POLICY "Company members can access cost centers"
ON public.cost_centers FOR ALL
USING (
  company_id IN (SELECT company_id FROM public.user_roles WHERE user_id = auth.uid())
)
WITH CHECK (
  company_id IN (SELECT company_id FROM public.user_roles WHERE user_id = auth.uid())
);

-- 2) Cash movements: add branch + cost center + defaults
ALTER TABLE public.cash_movements
  ADD COLUMN IF NOT EXISTS branch_id uuid REFERENCES public.branches(id),
  ADD COLUMN IF NOT EXISTS cost_center_id uuid REFERENCES public.cost_centers(id);

ALTER TABLE public.cash_movements
  ALTER COLUMN created_by SET DEFAULT auth.uid();

ALTER TABLE public.cash_accounts
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_cash_movements_cost_center ON public.cash_movements (company_id, cost_center_id);

-- Replace cash movements policy to respect employee visibility
DROP POLICY IF EXISTS "Users can only see their own company data" ON public.cash_movements;
CREATE POLICY "Company members can access movements"
ON public.cash_movements FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.company_id = cash_movements.company_id
      AND (
        ur.role IN ('OWNER','ACCOUNTANT')
        OR cash_movements.created_by = auth.uid()
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.company_id = cash_movements.company_id
  )
);

-- 3) Custody tables
CREATE TABLE IF NOT EXISTS public.custodies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  branch_id uuid REFERENCES public.branches(id),
  name text NOT NULL,
  opening_balance numeric(12,2) DEFAULT 0,
  max_limit numeric(12,2),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.custody_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  custody_id uuid REFERENCES public.custodies(id) ON DELETE CASCADE,
  tx_type text CHECK (tx_type IN ('ISSUE','SPEND','RETURN','SETTLEMENT')) NOT NULL,
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  tx_date date DEFAULT current_date,
  status text CHECK (status IN ('DRAFT','SUBMITTED','APPROVED','REJECTED')) DEFAULT 'APPROVED',
  notes text,
  created_by uuid REFERENCES auth.users(id) DEFAULT auth.uid(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.custodies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custody_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Company members can access custodies" ON public.custodies;
CREATE POLICY "Company members can access custodies"
ON public.custodies FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.company_id = custodies.company_id
      AND (
        ur.role IN ('OWNER','ACCOUNTANT')
        OR custodies.user_id = auth.uid()
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.company_id = custodies.company_id
  )
);

DROP POLICY IF EXISTS "Company members can access custody transactions" ON public.custody_transactions;
CREATE POLICY "Company members can access custody transactions"
ON public.custody_transactions FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.custodies c
    JOIN public.user_roles ur ON ur.company_id = c.company_id
    WHERE c.id = custody_transactions.custody_id
      AND ur.user_id = auth.uid()
      AND (
        ur.role IN ('OWNER','ACCOUNTANT')
        OR c.user_id = auth.uid()
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.custodies c
    JOIN public.user_roles ur ON ur.company_id = c.company_id
    WHERE c.id = custody_transactions.custody_id
      AND ur.user_id = auth.uid()
  )
);

-- 4) Custody balance function
CREATE OR REPLACE FUNCTION public.get_custody_balance(p_custody_id uuid)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_opening numeric := 0;
  v_balance numeric := 0;
BEGIN
  SELECT COALESCE(opening_balance, 0) INTO v_opening
  FROM public.custodies
  WHERE id = p_custody_id;

  SELECT COALESCE(SUM(
    CASE
      WHEN tx_type IN ('ISSUE','RETURN') THEN amount
      WHEN tx_type IN ('SPEND','SETTLEMENT') THEN -amount
      ELSE 0
    END
  ), 0) INTO v_balance
  FROM public.custody_transactions
  WHERE custody_id = p_custody_id;

  RETURN v_opening + v_balance;
END;
$$;

-- 5) Process custody transaction with balance validation
CREATE OR REPLACE FUNCTION public.process_custody_transaction(
  p_custody_id uuid,
  p_type text,
  p_amount numeric,
  p_notes text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance numeric;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Invalid amount';
  END IF;

  SELECT public.get_custody_balance(p_custody_id) INTO v_balance;

  IF p_type IN ('SPEND','SETTLEMENT') AND v_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  INSERT INTO public.custody_transactions (custody_id, tx_type, amount, notes)
  VALUES (p_custody_id, p_type, p_amount, p_notes);
END;
$$;

-- 6) Approval action with audit (atomic)
CREATE OR REPLACE FUNCTION public.process_movement_action(
  p_movement_id uuid,
  p_action text,
  p_comment text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status text;
  v_company_id uuid;
BEGIN
  SELECT status, company_id INTO v_status, v_company_id
  FROM public.cash_movements
  WHERE id = p_movement_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Movement not found';
  END IF;

  IF v_status <> 'SUBMITTED' THEN
    RAISE EXCEPTION 'Movement is not pending approval';
  END IF;

  IF p_action = 'APPROVED' THEN
    UPDATE public.cash_movements
    SET status = 'APPROVED',
        approved_by = auth.uid(),
        approved_at = now(),
        rejected_reason = NULL
    WHERE id = p_movement_id;
  ELSIF p_action = 'REJECTED' THEN
    UPDATE public.cash_movements
    SET status = 'REJECTED',
        approved_by = auth.uid(),
        approved_at = now(),
        rejected_reason = p_comment
    WHERE id = p_movement_id;
  ELSE
    RAISE EXCEPTION 'Unknown action';
  END IF;

  INSERT INTO public.audit_logs (company_id, actor_id, action, entity_type, entity_id, comment)
  VALUES (v_company_id, auth.uid(), lower(p_action), 'cash_movement', p_movement_id, p_comment);
END;
$$;

-- 7) Attachments RLS
ALTER TABLE public.movement_attachments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Company members can access attachments" ON public.movement_attachments;
CREATE POLICY "Company members can access attachments"
ON public.movement_attachments FOR ALL
USING (
  company_id IN (SELECT company_id FROM public.user_roles WHERE user_id = auth.uid())
)
WITH CHECK (
  company_id IN (SELECT company_id FROM public.user_roles WHERE user_id = auth.uid())
);
