
# قائمة فحص الإطلاق التجريبي (Go-Live Checklist)

اتبع هذه الخطوات بدقة لضمان إطلاق ناجح لنسخة الـ Beta.

### المرحلة الأولى: التجهيز (قبل الإطلاق بـ 24 ساعة)
- [x] إنشاء مشروع Supabase جديد خاص بالإنتاج (Production).
- [x] تنفيذ ملف الهجرة `supabase/migrations/20260126_v1_init.sql`.
- [x] ضبط متغيرات البيئة (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY).
- [x] تفعيل خدمة Storage وإنشاء Bucket "attachments".
- [x] نشر الـ Edge Function `invite_user` وضبط الـ Secrets.

### المرحلة الثانية: التنفيذ (يوم الإطلاق)
- [x] بناء الواجهة الأمامية `npm run build`.
- [x] رفع ملفات الـ `dist` إلى منصة النشر (Vercel/Netlify).
- [x] إنشاء حسابات الإنتاج التجريبية (Production Dry-Run Accounts):

```sql
-- تشغيل هذا السكربت في Prod SQL Editor بعد إنشاء المستخدمين في Auth
-- تأكد من استخدام الـ UUIDs الحقيقية من صفحة Auth
INSERT INTO public.user_roles (user_id, company_id, role) 
VALUES 
  ('<OWNER_PROD_UUID>', 'c1111111-1111-1111-1111-111111111111', 'OWNER'),
  ('<ACC_PROD_UUID>', 'c1111111-1111-1111-1111-111111111111', 'ACCOUNTANT'),
  ('<EMP_PROD_UUID>', 'c1111111-1111-1111-1111-111111111111', 'EMPLOYEE');
```

- [x] اختبار الدخول وإنشاء "فرع" تجريبي.

### المرحلة الثالثة: التحقق (بعد الإطلاق بـ 1 ساعة)
- [x] تشغيل Smoke Tests على رابط الإنتاج.
- [x] التأكد من أن المرفقات تُرفع وتفتح بشكل صحيح (Signed URLs).
- [x] التحقق من أن سجل التدقيق يسجل العمليات بشكل سليم.
