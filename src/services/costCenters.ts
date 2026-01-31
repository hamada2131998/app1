import { supabase, requireCompanyId } from './supabaseUtils';
import type { CostCenterRow } from '@/types/db';

export async function listCostCenters(company_id: string): Promise<CostCenterRow[]> {
  const cId = requireCompanyId(company_id);
  const { data, error } = await supabase
    .from('cost_centers')
    .select('id, company_id, name, is_active, created_at')
    .eq('company_id', cId)
    .order('name', { ascending: true });
  if (error) throw error;
  return (data || []) as CostCenterRow[];
}

export async function createCostCenter(params: { company_id: string; name: string }): Promise<CostCenterRow> {
  const cId = requireCompanyId(params.company_id);
  const { data, error } = await supabase
    .from('cost_centers')
    .insert({ company_id: cId, name: params.name })
    .select('id, company_id, name, is_active, created_at')
    .single();
  if (error) throw error;
  return data as CostCenterRow;
}

export async function updateCostCenter(params: { company_id: string; id: string; name: string }): Promise<void> {
  const cId = requireCompanyId(params.company_id);
  const { error } = await supabase
    .from('cost_centers')
    .update({ name: params.name })
    .eq('company_id', cId)
    .eq('id', params.id);
  if (error) throw error;
}

export async function toggleCostCenterActive(params: { company_id: string; id: string; is_active: boolean }): Promise<void> {
  const cId = requireCompanyId(params.company_id);
  const { error } = await supabase
    .from('cost_centers')
    .update({ is_active: params.is_active })
    .eq('company_id', cId)
    .eq('id', params.id);
  if (error) throw error;
}

export async function deleteCostCenter(params: { company_id: string; id: string }): Promise<void> {
  const cId = requireCompanyId(params.company_id);
  const { error } = await supabase.from('cost_centers').delete().eq('company_id', cId).eq('id', params.id);
  if (error) throw error;
}
