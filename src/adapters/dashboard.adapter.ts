import { getDashboardStats, type DashboardStats } from '@/services/dashboard';

export type DashboardDataParams = Parameters<typeof getDashboardStats>[0];

export async function getDashboardData(params: DashboardDataParams): Promise<DashboardStats> {
  return getDashboardStats(params);
}
