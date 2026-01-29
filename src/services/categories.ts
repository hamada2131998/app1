import { supabase, requireCompanyId } from './supabaseUtils';
import type { CategoryKind, CategoryRow } from '@/types/db';

export async function listCategories(company_id: string, kind?: CategoryKind): Promise<CategoryRow[]> {
  const cId = requireCompanyId(company_id);
  let q = supabase.from('categories').select('id, company_id, name, kind').eq('company_id', cId);
  if (kind) q = q.eq('kind', kind);
  const { data, error } = await q.order('name', { ascending: true });
  if (error) throw error;
  return (data || []) as CategoryRow[];
}

export async function createCategory(params: {
  company_id: string;
  name: string;
  kind: CategoryKind;
}): Promise<CategoryRow> {
  const cId = requireCompanyId(params.company_id);
  const { data, error } = await supabase
    .from('categories')
    .insert({ company_id: cId, name: params.name, kind: params.kind })
    .select('id, company_id, name, kind')
    .single();
  if (error) throw error;
  return data as CategoryRow;
}

export async function deleteCategory(params: { company_id: string; id: string }): Promise<void> {
  const cId = requireCompanyId(params.company_id);
  const { error } = await supabase.from('categories').delete().eq('company_id', cId).eq('id', params.id);
  if (error) throw error;
}
