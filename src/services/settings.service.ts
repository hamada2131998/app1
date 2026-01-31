
import { getSupabase } from '../lib/supabase';
import { Branch, UserRole } from '../types';

export async function listBranches(company_id: string): Promise<Branch[]> {
  const { client } = getSupabase();
  if (!client) throw new Error("Supabase not initialized");
  
  const { data, error } = await client
    .from('branches')
    .select('*')
    .eq('company_id', company_id)
    .order('created_at', { ascending: true });
    
  if (error) throw error;
  return data as Branch[];
}

export async function createBranch(params: { company_id: string; name: string }) {
  const { client } = getSupabase();
  if (!client) throw new Error("Supabase not initialized");
  
  const { data, error } = await client
    .from('branches')
    .insert([{ name: params.name, company_id: params.company_id }])
    .select()
    .single();
    
  if (error) throw error;
  return data;
}

export async function toggleBranchStatus(params: { company_id: string; id: string; active: boolean }) {
  const { client } = getSupabase();
  if (!client) throw new Error("Supabase not initialized");
  
  const { error } = await client
    .from('branches')
    .update({ is_active: params.active })
    .eq('company_id', params.company_id)
    .eq('id', params.id);
    
  if (error) throw error;
}

export async function updateBranchName(params: { company_id: string; id: string; name: string }) {
  const { client } = getSupabase();
  if (!client) throw new Error("Supabase not initialized");

  const { error } = await client
    .from('branches')
    .update({ name: params.name })
    .eq('company_id', params.company_id)
    .eq('id', params.id);

  if (error) throw error;
}

export async function listCompanyUsers() {
  const { client } = getSupabase();
  if (!client) throw new Error("Supabase not initialized");
  
  const { data, error } = await client
    .from('user_roles')
    .select(`
      role,
      user_id,
      company_id,
      profile:profiles!user_roles_user_id_fkey(id, full_name)
    `);
    
  if (error) throw error;
  return data;
}

export async function updateUserRole(userId: string, companyId: string, role: UserRole) {
  const { client } = getSupabase();
  if (!client) throw new Error("Supabase not initialized");
  
  const { error } = await client
    .from('user_roles')
    .update({ role })
    .eq('user_id', userId)
    .eq('company_id', companyId);
    
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
