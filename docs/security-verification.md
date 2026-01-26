
# دليل التحقق الأمني (Security Verification)

يوثق هذا الملف آليات الحماية المطبقة في نظام Cash & Custody وكيفية التحقق منها.

### 1. سياسات عزل البيانات (Multi-tenancy RLS)
تعتمد الحماية على مستوى الصف (RLS) لضمان أن كل مستخدم يصل فقط لبيانات شركته.

**الاختبار (SQL):**
```sql
-- 1. تقمص دور موظف من الشركة A
set local role authenticated;
set local setting.uid = 'USER_A_UUID';

-- 2. محاولة جلب حركات شركة أخرى
select count(*) from public.cash_movements 
where company_id = 'COMPANY_B_UUID'; 
-- المتوقع: إرجاع 0 صفوف حتى لو كانت البيانات موجودة.
```

### 2. قيود العمليات (Business Logic Triggers)
النظام محمي ضد التلاعب بالبيانات المالية المعتمدة أو المقفولة.

**الاختبار (SQL):**
```sql
-- محاولة تعديل مبلغ حركة معتمدة
update public.cash_movements 
set amount = 99999 
where id = 'APPROVED_MOVEMENT_ID';
-- المتوقع: Raise Exception (Movement is locked after approval).

-- محاولة صرف عهدة بمبلغ أكبر من الرصيد
select public.process_custody_transaction(
    'CUSTODY_ID', 'SPEND', 1000000, 'Test'
);
-- المتوقع: Raise Exception (Insufficient custody balance).
```

### 3. أمان المرفقات (Storage Security)
المرفقات محمية بسياسات Storage تمنع الوصول المباشر.
- **القاعدة:** `(storage.foldername(name))[1] = (select company_id from user_roles where user_id = auth.uid() limit 1)`
- **التحقق:** المرفقات تُخزن في مسار `/{company_id}/{movement_id}/filename`.
