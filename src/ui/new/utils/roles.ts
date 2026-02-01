export function normalizeRole(role?: string | null) {
  return (role || '').trim().toUpperCase();
}

export function isOwnerRole(role?: string | null) {
  const normalized = normalizeRole(role);
  return normalized === 'OWNER';
}

export function isAccountantManagerRole(role?: string | null) {
  const normalized = normalizeRole(role);
  return normalized === 'ACCOUNTANT';
}

export function canApprove(role?: string | null) {
  return isOwnerRole(role);
}
