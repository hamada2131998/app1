
import { getSupabase } from '../lib/supabase';
import { Branch, UserRole } from '../types';

export async function listBranches(): Promise<Branch[]> {
  const { client } = getSupabase();
  if (!client) throw new Error("Supabase not initialized");
  
  const { data, error } = await client
    .from('branches')
    .select('*')
    .order('created_at', { ascending: true });
    
  if (error) throw error;
  return data as Branch[];
}

export async function createBranch(name: string) {
  const { client } = getSupabase();
  if (!client) throw new Error("Supabase not initialized");
  
  const { data, error } = await client
    .from('branches')
    .insert([{ name }])
    .select()
    .single();
    
  if (error) throw error;
  return data;
}

export async function toggleBranchStatus(id: string, active: boolean) {
  const { client } = getSupabase();
  if (!client) throw new Error("Supabase not initialized");
  
  const { error } = await client
    .from('branches')
    .update({ is_active: active })
    .eq('id', id);
    
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
