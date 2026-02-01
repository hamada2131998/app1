export type RoleCapabilities = {
  isOwner: boolean;
  isAccountant: boolean;
  isCustodyOfficer: boolean;
  canViewDashboard: boolean;
  canViewExpenses: boolean;
  canCreateExpenses: boolean;
  canViewCustody: boolean;
  canManageCustody: boolean;
  canViewApprovals: boolean;
  canManageApprovals: boolean;
  canViewSettings: boolean;
};

const normalizeRole = (role?: string | null) => (role || '').trim().toUpperCase();

const isOwnerRole = (role?: string | null) => normalizeRole(role) === 'OWNER';

const isAccountantRole = (role?: string | null) => normalizeRole(role) === 'ACCOUNTANT';

const isCustodyRole = (role?: string | null) => normalizeRole(role) === 'CUSTODY_OFFICER';

export function getRoleCapabilities(role?: string | null): RoleCapabilities {
  const owner = isOwnerRole(role);
  const accountant = isAccountantRole(role);
  const custody = isCustodyRole(role);

  return {
    isOwner: owner,
    isAccountant: accountant,
    isCustodyOfficer: custody,
    canViewDashboard: owner || accountant || custody,
    canViewExpenses: owner || accountant,
    canCreateExpenses: owner || accountant,
    canViewCustody: owner || accountant || custody,
    canManageCustody: owner || custody,
    canViewApprovals: owner,
    canManageApprovals: owner,
    canViewSettings: owner || accountant,
  };
}
