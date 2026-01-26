
import { getSupabase } from '../lib/supabase';

export interface DashboardSummary {
  total_in: number;
  total_out: number;
  net_balance: number;
  movements_count: number;
}

export interface ExpenseByCategory {
  category_id: string;
  category_name: string;
  total: number;
}

export interface WeeklyTrend {
  week_start: string;
  total_in: number;
  total_out: number;
}

export async function getDashboardSummary(dateFrom: string, dateTo: string, accountId?: string): Promise<DashboardSummary> {
  const { client, error: initError } = getSupabase();
  if (initError || !client) throw new Error(initError || "Supabase client not initialized");

  const { data, error } = await client.rpc('get_dashboard_summary', {
    p_date_from: dateFrom,
    p_date_to: dateTo,
    p_account_id: accountId || null
  });

  if (error) throw error;
  return data[0] as DashboardSummary;
}

export async function getExpenseByCategory(dateFrom: string, dateTo: string, accountId?: string): Promise<ExpenseByCategory[]> {
  const { client, error: initError } = getSupabase();
  if (initError || !client) throw new Error(initError || "Supabase client not initialized");

  const { data, error } = await client.rpc('get_expense_by_category', {
    p_date_from: dateFrom,
    p_date_to: dateTo,
    p_account_id: accountId || null
  });

  if (error) throw error;
  return data as ExpenseByCategory[];
}

export async function getWeeklyInOut(weeks: number = 6, accountId?: string): Promise<WeeklyTrend[]> {
  const { client, error: initError } = getSupabase();
  if (initError || !client) throw new Error(initError || "Supabase client not initialized");

  const { data, error } = await client.rpc('get_weekly_in_out', {
    p_weeks: weeks,
    p_account_id: accountId || null
  });

  if (error) throw error;
  return data as WeeklyTrend[];
}
