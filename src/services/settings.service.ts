
import { getSupabase } from '../lib/supabase';
import { Branch, UserRole } from '../types';

export async function listBranches(): Promise<Branch[]> {
  const { client } = getSupabase();
  if (!client) throw new Error("Supabase not initialized");
  
  const { data, error } = await client.rpc('list_branches');
    
  if (error) throw error;
  return data as Branch[];
}

export async function createBranch(name: string) {
  const { client } = getSupabase();
  if (!client) throw new Error("Supabase not initialized");
  
  const { data, error } = await client.rpc('create_branch', {
    p_name: name,
  });
    
  if (error) throw error;
  return data;
}

export async function toggleBranchStatus(id: string, active: boolean) {
  const { client } = getSupabase();
  if (!client) throw new Error("Supabase not initialized");
  
  const { error } = await client.rpc('toggle_branch_status', {
    p_branch_id: id,
    p_is_active: active,
  });
    
  if (error) throw error;
}

export async function listCompanyUsers() {
  const { client } = getSupabase();
  if (!client) throw new Error("Supabase not initialized");
  
  const { data, error } = await client.rpc('list_company_users');
    
  if (error) throw error;
  const rows = (data || []) as Array<{
    role: string;
    user_id: string;
    company_id: string;
    full_name?: string | null;
    email?: string | null;
  }>;
  return rows.map((row) => ({
    role: row.role,
    user_id: row.user_id,
    company_id: row.company_id,
    profile: row.full_name || row.email ? { id: row.user_id, full_name: row.full_name, email: row.email } : null,
  }));
}

export async function updateUserRole(userId: string, companyId: string, role: UserRole) {
  const { client } = getSupabase();
  if (!client) throw new Error("Supabase not initialized");
  
  const { error } = await client.rpc('update_user_role', {
    p_user_id: userId,
    p_company_id: companyId,
    p_role: role,
  });
    
  if (error) throw error;
}

export async function inviteNewUser(payload: { email: string, full_name: string, role: UserRole, company_id: string }) {
  const { client } = getSupabase();
  if (!client) throw new Error("Supabase not initialized");
  
  const { data, error } = await client.functions.invoke('invite_user', {
    body: payload
  });
  
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
}
