import { getSupabase } from '../lib/supabase';

function getClient() {
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
  const { client, error: initError } = getSupabase();
  if (initError || !client) return null;

  const { data, error } = await client.rpc('get_my_membership');
  
  if (error) {
    console.error("Error fetching membership:", error);
    return null;
  }
  
  return data && data.length > 0 ? data[0] : null;
}