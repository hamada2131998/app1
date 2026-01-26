
-- سكربت إعداد العميل الأول (Production Setup)
-- ملاحظة: يتم تشغيل هذا يدوياً من قبل مسؤول النظام

-- 1. إنشاء الشركة الحقيقية
INSERT INTO public.companies (id, name, currency, timezone)
VALUES (gen_random_uuid(), 'الشركة العربية للتجارة - المقر الرئيسي', 'SAR', 'Asia/Riyadh')
RETURNING id;

-- 2. إعداد الحسابات الأولية (بعد الحصول على الـ Company ID)
-- INSERT INTO public.branches (company_id, name) VALUES ('...', 'المركز الرئيسي');
-- INSERT INTO public.cash_accounts (company_id, name, type) VALUES ('...', 'الخزينة العامة', 'CASHBOX');
