import { supabase, getSupabase } from '../lib/supabase';

function getClient() {
  // لو supabase معمول كـ singleton (موجود) استخدمه مباشرة
  if (supabase) return supabase;

  // fallback لو المشروع بيستخدم getSupabase()
  const { client, error } = getSupabase();
  if (error || !client) throw new Error(error || "Supabase client not initialized");
  return client;
}

export async function signIn(email: string, password: string) {
  const client = getClient();
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const client = getClient();
  const { error } = await client.auth.signOut();
  if (error) throw error;
}

export async function getMyMembership() {
  const client = getClient();

  const { data, error } = await client.rpc('get_my_membership');

  if (error) {
    console.error("Error fetching membership:", error);
    return null;
  }

  return Array.isArray(data) && data.length > 0 ? data[0] : null;
}
