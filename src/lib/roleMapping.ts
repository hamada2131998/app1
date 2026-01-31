import { ROLE_DEFINITIONS, type AppRole } from '@/data/roles';

const DB_ROLE_MAP: Record<string, AppRole> = {
  OWNER: 'company_owner',
  ACCOUNTANT: 'accountant',
  EMPLOYEE: 'employee',
};

const APP_ROLE_SET = new Set<AppRole>(Object.keys(ROLE_DEFINITIONS) as AppRole[]);

export function mapDbRoleToAppRole(role?: string | null): AppRole | null {
  if (!role) return null;
  if (DB_ROLE_MAP[role]) return DB_ROLE_MAP[role];
  if (APP_ROLE_SET.has(role as AppRole)) return role as AppRole;
  return null;
}
