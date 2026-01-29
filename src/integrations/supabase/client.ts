import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Create a client even if env is missing (so imports don't crash), but guard all usage.
export const supabase: SupabaseClient = createClient(
  supabaseUrl || 'http://localhost:54321',
  supabaseAnonKey || 'missing-anon-key'
);

export type SupabaseInitState = {
  client: SupabaseClient | null;
  error: string | null;
};

/**
 * Backward-compatible helper (some files may import getSupabase()).
 */
export function getSupabase(): SupabaseInitState {
  if (!isSupabaseConfigured) {
    return { client: null, error: 'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY' };
  }
  return { client: supabase, error: null };
}
