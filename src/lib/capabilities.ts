export type RoleCapabilities = {
  isOwner: boolean;
  canViewDashboard: boolean;
  canViewExpenses: boolean;
  canCreateExpenses: boolean;
  canViewCustody: boolean;
  canManageCustody: boolean;
  canViewApprovals: boolean;
  canManageApprovals: boolean;
  canViewSettings: boolean;
};

const normalizeRole = (role?: string | null) => (role || '').trim().toLowerCase();

const isOwnerRole = (role?: string | null) => ['owner', 'company_owner', 'super_admin'].includes(normalizeRole(role));

const isAccountantManagerRole = (role?: string | null) =>
  ['accountant_manager', 'accountant-manager', 'finance_manager', 'finance-manager'].includes(normalizeRole(role));

const isAccountantRole = (role?: string | null) =>
  isAccountantManagerRole(role) || ['accountant', 'finance'].includes(normalizeRole(role));

const isCustodyRole = (role?: string | null) =>
  ['custodian', 'custody_officer', 'custody-officer', 'custody', 'employee'].includes(normalizeRole(role));

export function getRoleCapabilities(role?: string | null): RoleCapabilities {
  const owner = isOwnerRole(role);
  const accountant = isAccountantRole(role);
  const accountantManager = isAccountantManagerRole(role);
  const custody = isCustodyRole(role);

  return {
    isOwner: owner,
    canViewDashboard: owner || accountant || custody,
    canViewExpenses: owner || accountant,
    canCreateExpenses: owner || accountant,
    canViewCustody: owner || custody,
    canManageCustody: owner || custody,
    canViewApprovals: owner || accountantManager,
    canManageApprovals: owner || accountantManager,
    canViewSettings: owner || accountant,
  };
}
