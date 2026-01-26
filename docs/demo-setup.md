
# دليل إعداد الحسابات التجريبية (Demo Setup)

لإعداد النظام وتجربته محلياً أو تشغيل الاختبارات الآلية، اتبع الخطوات التالية:

### 1. إعداد قاعدة البيانات
قم بتشغيل محتويات ملف `supabase/seed.sql` داخل محرّر SQL في لوحة تحكم Supabase.

### 2. إنشاء مستخدمين تجريبيين (Playwright Requirements)
يجب إنشاء الحسابات التالية حصراً لضمان نجاح الاختبارات الآلية بكلمة مرور موحدة `demo1234`:
1. `owner@example.com` (لصلاحيات المالك)
2. `accountant@example.com` (لصلاحيات المحاسب)
3. `employee@example.com` (لصلاحيات الموظف)

### 3. ربط المستخدمين بالأدوار (Roles)
قم بتشغيل الأوامر التالية في محرّر SQL (استبدل القيم بـ ID الحقيقي من قسم Auth):

```sql
INSERT INTO public.user_roles (user_id, company_id, role) 
VALUES ('<OWNER_UUID>', 'c1111111-1111-1111-1111-111111111111', 'OWNER');

INSERT INTO public.user_roles (user_id, company_id, role) 
VALUES ('<ACCOUNTANT_UUID>', 'c1111111-1111-1111-1111-111111111111', 'ACCOUNTANT');

INSERT INTO public.user_roles (user_id, company_id, role) 
VALUES ('<EMPLOYEE_UUID>', 'c1111111-1111-1111-1111-111111111111', 'EMPLOYEE');
```

### 4. ملاحظة هامة
تعتمد اختبارات `smoke.spec.ts` على وجود هذه الحسابات مسبقاً في البيئة التي يتم الاختبار عليها.
