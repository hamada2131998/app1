import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type SupabaseInitState = {
  client: SupabaseClient | null;
  error: string | null;
};

/**
 * Backward-compatible helper.
 * بعض الملفات القديمة بتستورد getSupabase().
 * هنا بنرجّع نفس الـ client الحالي (supabase) وخلاص.
 */
export function getSupabase(): SupabaseInitState {
  if (!supabaseUrl || !supabaseAnonKey) {
    return { client: null, error: 'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY' };
  }
  return { client: supabase, error: null };
}
