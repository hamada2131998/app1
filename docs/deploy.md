
# دليل نشر نظام Cash & Custody (Deployment Guide)

اتبع هذا الدليل لنشر النظام في بيئة الإنتاج.

## 1. إعداد قاعدة البيانات (Supabase)
### أ) تطبيق الـ Migrations
يمكنك استخدام Supabase CLI أو نسخ المحتويات يدوياً:
```bash
# باستخدام CLI
supabase db push
```
أو انسخ محتويات `supabase/migrations/20260126_v1_init.sql` إلى محرّر SQL في Supabase.

### ب) تفعيل التخزين (Storage)
- أنشئ Bucket باسم `attachments`.
- اجعله **Private**.
- أضف سياسة الوصول (RLS) للسماح للمستخدمين بالوصول لملفات شركتهم فقط:
  `storage.foldername(name))[1] = (select company_id from user_roles where user_id = auth.uid() limit 1)`

## 2. نشر الدوال السحابية (Edge Functions)
قم بنشر دالة `invite_user`:
```bash
supabase functions deploy invite_user
```
تأكد من ضبط الـ Secrets في Supabase:
```bash
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_key
```

## 3. نشر الواجهة الأمامية (Vercel / Netlify)
### أ) إعدادات النشر
- **Build Command:** `npm run build`
- **Output Directory:** `dist`

### ب) متغيرات البيئة (Production ENV)
أضف المتغيرات التالية في لوحة تحكم المنصة:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### ج) معالجة الروابط (SPA Redirects)
إذا كنت تستخدم Vercel، أضف ملف `vercel.json`:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

## 4. التحقق النهائي
بعد النشر، قم بتشغيل الاختبارات للتأكد من سلامة الربط:
`PLAYWRIGHT_BASE_URL=https://your-app.vercel.app npm run test:smoke`
