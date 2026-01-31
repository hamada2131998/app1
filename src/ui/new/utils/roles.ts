export function normalizeRole(role?: string | null) {
  return (role || '').trim().toLowerCase();
}

export function isOwnerRole(role?: string | null) {
  const normalized = normalizeRole(role);
  return ['owner', 'company_owner', 'super_admin'].includes(normalized);
}

export function isAccountantManagerRole(role?: string | null) {
  const normalized = normalizeRole(role);
  return ['accountant', 'finance_manager', 'accountant_manager', 'accountant-manager'].includes(normalized);
}

export function canApprove(role?: string | null) {
  return isOwnerRole(role) || isAccountantManagerRole(role);
}
