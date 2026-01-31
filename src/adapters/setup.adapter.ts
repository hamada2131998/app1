import { supabase, requireCompanyId } from '@/services/supabaseUtils';
import { inviteNewUser, listCompanyUsers } from '@/services/settings.service';
import type { UserRole } from '@/types';

export type SetupStatus = {
  company_name: string | null;
  setup_completed: boolean;
  has_branch: boolean;
  has_cost_center: boolean;
  has_account: boolean;
  has_category: boolean;
  user_count: number;
  cost_centers_supported: boolean;
};

export async function getSetupStatus(company_id: string): Promise<SetupStatus> {
  const cId = requireCompanyId(company_id);
  const { data, error } = await supabase.rpc('get_company_setup_status', { p_company_id: cId });
  if (error || !data) {
    return {
      company_name: null,
      setup_completed: false,
      has_branch: false,
      has_cost_center: false,
      has_account: false,
      has_category: false,
      user_count: 0,
      cost_centers_supported: false,
    };
  }
  return data as SetupStatus;
}

export async function updateCompanyProfile(params: { company_id: string; name: string }): Promise<void> {
  const cId = requireCompanyId(params.company_id);
  const { error } = await supabase.rpc('update_company_profile', {
    p_company_id: cId,
    p_name: params.name,
  });
  if (error) throw error;
}

export async function seedCompanyDefaults(params: {
  company_id: string;
  branch_name?: string | null;
  cost_center_name?: string | null;
  account_name?: string | null;
}) {
  const cId = requireCompanyId(params.company_id);
  const { data, error } = await supabase.rpc('seed_company_defaults', {
    p_company_id: cId,
    p_branch_name: params.branch_name ?? null,
    p_cost_center_name: params.cost_center_name ?? null,
    p_account_name: params.account_name ?? null,
  });
  if (error) throw error;
  return data;
}

export async function completeCompanySetup(company_id: string): Promise<void> {
  const cId = requireCompanyId(company_id);
  const { error } = await supabase.rpc('complete_company_setup', { p_company_id: cId });
  if (error) throw error;
}

export async function listSetupUsers() {
  return listCompanyUsers();
}

export async function inviteSetupUser(payload: { email: string; full_name: string; role: UserRole; company_id: string }) {
  return inviteNewUser(payload);
}
