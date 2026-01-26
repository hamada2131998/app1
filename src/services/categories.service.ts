import { getSupabase } from '../lib/supabase';
import { Category } from '../types';

/**
 * جلب قائمة التصنيفات المالية المتاحة للشركة
 */
export async function listCategories(): Promise<Category[]> {
  const { client, error: initError } = getSupabase();
  if (initError || !client) throw new Error(initError || "Supabase client not initialized");

  const { data, error } = await client
    .from('categories')
    .select('id, name, kind')
    .order('name', { ascending: true });

  if (error) {
    if (error.code === 'PGRST301') throw new Error("SESSION_EXPIRED");
    throw error;
  }

  return data as Category[];
}