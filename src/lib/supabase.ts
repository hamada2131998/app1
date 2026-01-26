import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

export type SupabaseInitState = { 
  client: SupabaseClient | null; 
  error: string | null 
};

let instance: SupabaseClient | null = null;
let errorMsg: string | null = null;

/**
 * جلب حالة تهيئة Supabase.
 * تحاول قراءة متغيرات البيئة ببادئة VITE_ المطلوبة لـ Vite.
 */
export function getSupabase(): SupabaseInitState {
  if (instance) return { client: instance, error: null };
  if (errorMsg) return { client: null, error: errorMsg };

  // قراءة المتغيرات من Vite
  const env = (import.meta as any).env;
  const url = env?.VITE_SUPABASE_URL;
  const key = env?.VITE_SUPABASE_ANON_KEY;

  // التحقق من صحة المتغيرات (تجنب القيم الافتراضية في .env.example)
  if (!url || !key || url === 'your_project_url' || key === 'your_anon_key') {
    errorMsg = "متغيرات البيئة الخاصة بـ Supabase (URL أو Anon Key) مفقودة أو غير صالحة في ملف .env";
    return { client: null, error: errorMsg };
  }

  try {
    instance = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
    return { client: instance, error: null };
  } catch (e: any) {
    errorMsg = e.message || "فشل في إنشاء عميل Supabase";
    return { client: null, error: errorMsg };
  }
}

// تصدير ثابت للتوافق مع الخدمات الموجودة، مع توفير كائن وهمي في حالة الخطأ
// لتجنب أخطاء "undefined" عند الاستيراد
export const supabase = (getSupabase().client || {}) as SupabaseClient;
