
-- 1. Companies & Profiles
CREATE TABLE IF NOT EXISTS public.companies (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    currency text DEFAULT 'SAR',
    timezone text DEFAULT 'Asia/Riyadh',
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name text,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
    role text CHECK (role IN ('OWNER','ACCOUNTANT','EMPLOYEE')),
    created_at timestamptz DEFAULT now()
);

-- 2. Infrastructure
CREATE TABLE IF NOT EXISTS public.branches (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
    name text NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cash_accounts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
    branch_id uuid REFERENCES public.branches(id),
    name text NOT NULL,
    type text CHECK (type IN ('CASHBOX','BANK','OTHER')) DEFAULT 'CASHBOX',
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
    name text NOT NULL,
    kind text CHECK (kind IN ('INCOME','EXPENSE')) NOT NULL,
    created_at timestamptz DEFAULT now(),
    UNIQUE(company_id, kind, name)
);

-- 3. Movements & Audit
CREATE TABLE IF NOT EXISTS public.cash_movements (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
    account_id uuid REFERENCES public.cash_accounts(id) NOT NULL,
    type text CHECK (type IN ('IN','OUT','TRANSFER')) NOT NULL,
    amount numeric(12,2) NOT NULL CHECK (amount > 0),
    category_id uuid REFERENCES public.categories(id),
    payment_method text DEFAULT 'CASH',
    reference text,
    notes text,
    movement_date date NOT NULL,
    created_by uuid REFERENCES auth.users(id),
    status text CHECK (status IN ('DRAFT','SUBMITTED','APPROVED','REJECTED')) DEFAULT 'DRAFT',
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

-- 4. Attachments
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

-- 5. RLS Policies
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only see their own company data" 
ON public.cash_movements FOR ALL 
USING (
  company_id IN (SELECT company_id FROM public.user_roles WHERE user_id = auth.uid())
);

-- (Repeat for other tables...)

-- 6. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_movements_main ON public.cash_movements (company_id, movement_date DESC, status);
CREATE INDEX IF NOT EXISTS idx_user_roles_lookup ON public.user_roles (user_id, company_id);
