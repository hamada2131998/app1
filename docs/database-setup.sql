-- =====================================================
-- SMART ACCOUNTANT PRO - DATABASE SCHEMA
-- Run this SQL in your Supabase SQL Editor
-- =====================================================

-- 1. ENUM TYPES
-- =====================================================
CREATE TYPE public.app_role AS ENUM ('admin', 'accountant', 'employee');
CREATE TYPE public.expense_status AS ENUM ('pending', 'approved', 'rejected', 'settled');
CREATE TYPE public.project_status AS ENUM ('active', 'completed', 'on_hold');
CREATE TYPE public.transaction_type AS ENUM ('deposit', 'withdrawal', 'transfer', 'expense_settlement');

-- 2. USER ROLES TABLE (Separate from profiles for security)
-- =====================================================
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'employee',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. PROFILES TABLE
-- =====================================================
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    company_name TEXT DEFAULT 'Smart Accountant Pro',
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. PROJECTS TABLE
-- =====================================================
CREATE TABLE public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    client_name TEXT,
    location TEXT,
    budget NUMERIC(12,2) DEFAULT 0,
    spent NUMERIC(12,2) DEFAULT 0,
    status project_status DEFAULT 'active',
    start_date DATE,
    end_date DATE,
    manager_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- 5. GL ACCOUNTS (Chart of Accounts)
-- =====================================================
CREATE TABLE public.gl_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    name_ar TEXT,
    category TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.gl_accounts ENABLE ROW LEVEL SECURITY;

-- 6. COST CENTERS
-- =====================================================
CREATE TABLE public.cost_centers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    name_ar TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.cost_centers ENABLE ROW LEVEL SECURITY;

-- 7. EXPENSES TABLE
-- =====================================================
CREATE TABLE public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    net_amount NUMERIC(12,2) NOT NULL,
    vat_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    total_amount NUMERIC(12,2) NOT NULL,
    status expense_status DEFAULT 'pending',
    gl_code TEXT,
    cost_center TEXT,
    project_id UUID REFERENCES public.projects(id),
    receipt_url TEXT,
    receipt_urls TEXT[], -- Multiple receipts support
    rejection_reason TEXT,
    includes_vat BOOLEAN DEFAULT false,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMPTZ,
    settled_by UUID REFERENCES auth.users(id),
    settled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- 8. TEAM MEMBERS TABLE
-- =====================================================
CREATE TABLE public.team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    role app_role DEFAULT 'employee',
    department TEXT,
    phone TEXT,
    avatar_url TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- 9. WALLET & TRANSACTIONS
-- =====================================================
CREATE TABLE public.wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) UNIQUE,
    balance NUMERIC(12,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID REFERENCES public.wallets(id),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    type transaction_type NOT NULL,
    description TEXT,
    reference_id UUID, -- Can reference expense_id, etc.
    balance_after NUMERIC(12,2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- 10. AUDIT LOG (Immutable)
-- =====================================================
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    table_name TEXT,
    record_id UUID,
    old_data JSONB,
    new_data JSONB,
    ip_address INET,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Prevent modification of audit logs
CREATE OR REPLACE FUNCTION prevent_audit_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Audit logs cannot be modified or deleted';
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER protect_audit_logs
BEFORE UPDATE OR DELETE ON public.audit_logs
FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification();

-- =====================================================
-- SECURITY DEFINER FUNCTIONS
-- =====================================================

-- Function to get user's role (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1;
$$;

-- Function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = _user_id AND role = _role
    );
$$;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = _user_id AND role = 'admin'
    );
$$;

-- Function to check if user is admin or accountant
CREATE OR REPLACE FUNCTION public.is_finance_role(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = _user_id AND role IN ('admin', 'accountant')
    );
$$;

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- User Roles Policies
CREATE POLICY "Users can view their own roles"
    ON public.user_roles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
    ON public.user_roles FOR ALL
    USING (public.is_admin(auth.uid()));

-- Profiles Policies
CREATE POLICY "Users can view all profiles"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Projects Policies
CREATE POLICY "Authenticated users can view projects"
    ON public.projects FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins and accountants can manage projects"
    ON public.projects FOR ALL
    USING (public.is_finance_role(auth.uid()));

-- GL Accounts Policies
CREATE POLICY "All authenticated users can view GL accounts"
    ON public.gl_accounts FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins and accountants can manage GL accounts"
    ON public.gl_accounts FOR ALL
    USING (public.is_finance_role(auth.uid()));

-- Cost Centers Policies
CREATE POLICY "All authenticated users can view cost centers"
    ON public.cost_centers FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins can manage cost centers"
    ON public.cost_centers FOR ALL
    USING (public.is_admin(auth.uid()));

-- Expenses Policies
CREATE POLICY "Users can view own expenses"
    ON public.expenses FOR SELECT
    USING (auth.uid() = user_id OR public.is_finance_role(auth.uid()));

CREATE POLICY "Users can create own expenses"
    ON public.expenses FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pending expenses"
    ON public.expenses FOR UPDATE
    USING (
        (auth.uid() = user_id AND status = 'pending')
        OR public.is_finance_role(auth.uid())
    );

CREATE POLICY "Admins can delete expenses"
    ON public.expenses FOR DELETE
    USING (public.is_admin(auth.uid()));

-- Team Members Policies
CREATE POLICY "Authenticated users can view team members"
    ON public.team_members FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins can manage team members"
    ON public.team_members FOR ALL
    USING (public.is_admin(auth.uid()));

-- Wallets Policies
CREATE POLICY "Users can view own wallet"
    ON public.wallets FOR SELECT
    USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Users can update own wallet"
    ON public.wallets FOR UPDATE
    USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "System can create wallets"
    ON public.wallets FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Wallet Transactions Policies
CREATE POLICY "Users can view own transactions"
    ON public.wallet_transactions FOR SELECT
    USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Users can create own transactions"
    ON public.wallet_transactions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Audit Logs Policies (Read-only for admins)
CREATE POLICY "Admins can view audit logs"
    ON public.audit_logs FOR SELECT
    USING (public.is_admin(auth.uid()));

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_expenses_updated_at
    BEFORE UPDATE ON public.expenses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_team_members_updated_at
    BEFORE UPDATE ON public.team_members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_wallets_updated_at
    BEFORE UPDATE ON public.wallets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- AUTO CREATE PROFILE ON SIGNUP
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Create profile
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'avatar_url'
    );
    
    -- Assign default role (employee)
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'employee');
    
    -- Create wallet
    INSERT INTO public.wallets (user_id, balance)
    VALUES (NEW.id, 0);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- SEED DATA
-- =====================================================

-- Insert default GL Accounts
INSERT INTO public.gl_accounts (code, name, name_ar, category) VALUES
    ('5001', 'Travel', 'سفر وتنقل', 'Operating'),
    ('5002', 'Office Supplies', 'مستلزمات مكتبية', 'Operating'),
    ('5003', 'Meals & Entertainment', 'وجبات وضيافة', 'Operating'),
    ('5004', 'Fuel & Transport', 'وقود ومواصلات', 'Operating'),
    ('5005', 'Equipment', 'معدات', 'Capital'),
    ('5006', 'Maintenance', 'صيانة', 'Operating'),
    ('5007', 'Utilities', 'مرافق', 'Operating'),
    ('5008', 'Subscriptions', 'اشتراكات', 'Operating'),
    ('5009', 'Marketing', 'تسويق', 'Operating'),
    ('5010', 'Other', 'أخرى', 'Operating');

-- Insert default Cost Centers
INSERT INTO public.cost_centers (code, name, name_ar) VALUES
    ('CC001', 'Head Office', 'المقر الرئيسي'),
    ('CC002', 'Operations', 'العمليات'),
    ('CC003', 'Sales', 'المبيعات'),
    ('CC004', 'IT Department', 'قسم تقنية المعلومات'),
    ('CC005', 'Marketing', 'التسويق');

-- Insert sample projects
INSERT INTO public.projects (name, description, client_name, location, budget, spent, status) VALUES
    ('مشروع برج الرياض', 'برج سكني فاخر في حي الملقا', 'شركة التطوير العقاري', 'الرياض - حي الملقا', 5000000, 1250000, 'active'),
    ('مجمع جدة التجاري', 'مجمع تجاري متكامل', 'مجموعة الاستثمار', 'جدة - حي الروضة', 3500000, 2100000, 'active'),
    ('مشروع الدمام الصناعي', 'مصنع للمنتجات البتروكيماوية', 'أرامكو', 'الدمام - المنطقة الصناعية', 8000000, 4500000, 'active');

COMMENT ON TABLE public.expenses IS 'Smart Accountant Pro - Expense Management';
COMMENT ON TABLE public.projects IS 'Smart Accountant Pro - Project Management';
