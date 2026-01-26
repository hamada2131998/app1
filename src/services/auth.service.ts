import { supabase } from '../lib/supabase';

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getMyMembership() {
  const { data, error } = await supabase.rpc('get_my_membership');
  if (error) {
    console.error('Error fetching membership:', error);
    return null;
  }
  return data && data.length > 0 ? data[0] : null;
}
