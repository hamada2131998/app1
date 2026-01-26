
-- Optimization Patch for Cash & Custody
-- تهدف هذه الفهارس لتسريع استعلامات التقارير والتحقق من الصلاحيات

-- 1. فهارس الحركات المالية
CREATE INDEX IF NOT EXISTS idx_movements_company_date 
    ON public.cash_movements (company_id, movement_date DESC);

CREATE INDEX IF NOT EXISTS idx_movements_company_status 
    ON public.cash_movements (company_id, status);

CREATE INDEX IF NOT EXISTS idx_movements_account 
    ON public.cash_movements (account_id);

-- 2. فهارس الصلاحيات (RLS Optimization)
CREATE INDEX IF NOT EXISTS idx_user_roles_composite 
    ON public.user_roles (user_id, company_id, role);

-- 3. فهارس سجل التدقيق والمرفقات
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity 
    ON public.audit_logs (entity_id, entity_type);

CREATE INDEX IF NOT EXISTS idx_audit_logs_company_date 
    ON public.audit_logs (company_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_attachments_movement 
    ON public.movement_attachments (movement_id);

-- 4. فهارس العهد النقدية
CREATE INDEX IF NOT EXISTS idx_custody_tx_custody 
    ON public.custody_transactions (custody_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_custody_tx_company_status 
    ON public.custody_transactions (company_id, status);

-- 5. فهارس الإقفال اليومي والفترات المقفولة
-- الفهرس الفريد يعمل كفهرس بحث تلقائي: UNIQUE(company_id, account_id, close_date)

CREATE INDEX IF NOT EXISTS idx_locked_periods_range 
    ON public.locked_periods (company_id, start_date, end_date);
