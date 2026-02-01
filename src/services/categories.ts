import { supabase, requireCompanyId } from './supabaseUtils';
import type { CategoryKind, CategoryRow } from '@/types/db';

export async function listCategories(company_id: string, kind?: CategoryKind): Promise<CategoryRow[]> {
  const cId = requireCompanyId(company_id);
  const { data, error } = await supabase.rpc('list_categories', {
    p_company_id: cId,
    p_kind: kind ?? null,
  });
  if (error) throw error;
  return (data || []) as CategoryRow[];
}

export async function createCategory(params: {
  company_id: string;
  name: string;
  kind: CategoryKind;
}): Promise<CategoryRow> {
  const cId = requireCompanyId(params.company_id);
  const { data, error } = await supabase.rpc('create_category', {
    p_company_id: cId,
    p_name: params.name,
    p_kind: params.kind,
  });
  if (error) throw error;
  return data as CategoryRow;
}

export async function deleteCategory(params: { company_id: string; id: string }): Promise<void> {
  const cId = requireCompanyId(params.company_id);
  const { error } = await supabase.rpc('delete_category', {
    p_company_id: cId,
    p_category_id: params.id,
  });
  if (error) throw error;
}
