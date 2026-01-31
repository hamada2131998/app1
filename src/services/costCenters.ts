import { getSupabase } from '@/lib/supabase';
import type { CostCenter } from '@/types/database';

type CreateCostCenterPayload = {
  company_id: string;
  name: string;
  code: string;
  branch_id?: string | null;
};

export async function listCostCenters(company_id: string): Promise<CostCenter[]> {
  const { client, error: initError } = getSupabase();
  if (initError || !client) throw new Error(initError || 'Supabase client not initialized');

  const { data, error } = await client
    .from('cost_centers')
    .select('*')
    .eq('company_id', company_id)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data || []) as CostCenter[];
}

export async function createCostCenter(payload: CreateCostCenterPayload): Promise<CostCenter> {
  const { client, error: initError } = getSupabase();
  if (initError || !client) throw new Error(initError || 'Supabase client not initialized');

  const { data, error } = await client
    .from('cost_centers')
    .insert([
      {
        company_id: payload.company_id,
        name: payload.name,
        code: payload.code,
        branch_id: payload.branch_id ?? null,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data as CostCenter;
}
