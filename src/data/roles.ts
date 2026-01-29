// Role-Based Access Control (RBAC) System
// This simulates the database structure for user roles

export type Permission = 
  | 'expenses:view'
  | 'expenses:create'
  | 'expenses:approve'
  | 'expenses:reject'
  | 'expenses:settle'
  | 'expenses:delete'
  | 'projects:view'
  | 'projects:create'
  | 'projects:edit'
  | 'projects:delete'
  | 'wallet:view'
  | 'wallet:deposit'
  | 'wallet:withdraw'
  | 'wallet:transfer'
  | 'reports:view'
  | 'reports:export'
  | 'team:view'
  | 'team:manage'
  | 'settings:view'
  | 'settings:manage'
  | 'audit:view'
  | 'company:manage';

export type AppRole = 
  | 'super_admin'
  | 'company_owner'
  | 'finance_manager'
  | 'accountant'
  | 'project_manager'
  | 'employee';

export interface RoleDefinition {
  id: AppRole;
  name: string;
  nameEn: string;
  description: string;
  permissions: Permission[];
  color: string;
  icon: string;
}

// Role definitions with permissions
export const ROLE_DEFINITIONS: Record<AppRole, RoleDefinition> = {
  super_admin: {
    id: 'super_admin',
    name: 'مدير النظام',
    nameEn: 'Super Admin',
    description: 'صلاحيات كاملة على جميع الشركات والإعدادات',
    permissions: [
      'expenses:view', 'expenses:create', 'expenses:approve', 'expenses:reject', 'expenses:settle', 'expenses:delete',
      'projects:view', 'projects:create', 'projects:edit', 'projects:delete',
      'wallet:view', 'wallet:deposit', 'wallet:withdraw', 'wallet:transfer',
      'reports:view', 'reports:export',
      'team:view', 'team:manage',
      'settings:view', 'settings:manage',
      'audit:view',
      'company:manage',
    ],
    color: 'from-red-500 to-rose-600',
    icon: 'Shield',
  },
  company_owner: {
    id: 'company_owner',
    name: 'مالك الشركة',
    nameEn: 'Company Owner',
    description: 'صلاحيات كاملة على الشركة',
    permissions: [
      'expenses:view', 'expenses:create', 'expenses:approve', 'expenses:reject', 'expenses:settle', 'expenses:delete',
      'projects:view', 'projects:create', 'projects:edit', 'projects:delete',
      'wallet:view', 'wallet:deposit', 'wallet:withdraw', 'wallet:transfer',
      'reports:view', 'reports:export',
      'team:view', 'team:manage',
      'settings:view', 'settings:manage',
      'audit:view',
    ],
    color: 'from-violet-500 to-purple-600',
    icon: 'Crown',
  },
  finance_manager: {
    id: 'finance_manager',
    name: 'مدير مالي',
    nameEn: 'Finance Manager',
    description: 'إدارة العمليات المالية والموافقات',
    permissions: [
      'expenses:view', 'expenses:create', 'expenses:approve', 'expenses:reject', 'expenses:settle',
      'projects:view',
      'wallet:view', 'wallet:deposit', 'wallet:withdraw', 'wallet:transfer',
      'reports:view', 'reports:export',
      'team:view',
      'audit:view',
    ],
    color: 'from-emerald-500 to-green-600',
    icon: 'Banknote',
  },
  accountant: {
    id: 'accountant',
    name: 'محاسب',
    nameEn: 'Accountant',
    description: 'مراجعة وتسوية المصروفات',
    permissions: [
      'expenses:view', 'expenses:create', 'expenses:settle',
      'projects:view',
      'wallet:view',
      'reports:view', 'reports:export',
      'audit:view',
    ],
    color: 'from-blue-500 to-cyan-600',
    icon: 'Calculator',
  },
  project_manager: {
    id: 'project_manager',
    name: 'مدير مشروع',
    nameEn: 'Project Manager',
    description: 'إدارة المشاريع والفرق',
    permissions: [
      'expenses:view', 'expenses:create', 'expenses:approve',
      'projects:view', 'projects:create', 'projects:edit',
      'wallet:view',
      'reports:view',
      'team:view',
    ],
    color: 'from-amber-500 to-orange-600',
    icon: 'FolderKanban',
  },
  employee: {
    id: 'employee',
    name: 'موظف',
    nameEn: 'Employee',
    description: 'إنشاء طلبات الصرف فقط',
    permissions: [
      'expenses:view', 'expenses:create',
      'projects:view',
      'wallet:view',
    ],
    color: 'from-slate-500 to-gray-600',
    icon: 'User',
  },
};

// Check if a role has a specific permission
export function hasPermission(role: AppRole, permission: Permission): boolean {
  return ROLE_DEFINITIONS[role]?.permissions.includes(permission) ?? false;
}

// Check if a role has any of the specified permissions
export function hasAnyPermission(role: AppRole, permissions: Permission[]): boolean {
  return permissions.some(p => hasPermission(role, p));
}

// Check if a role has all of the specified permissions
export function hasAllPermissions(role: AppRole, permissions: Permission[]): boolean {
  return permissions.every(p => hasPermission(role, p));
}

// Get role display name
export function getRoleName(role: AppRole): string {
  return ROLE_DEFINITIONS[role]?.name ?? role;
}

// Check if user can approve expenses (finance roles)
export function canApproveExpenses(role: AppRole): boolean {
  return hasPermission(role, 'expenses:approve');
}

// Check if user can manage team
export function canManageTeam(role: AppRole): boolean {
  return hasPermission(role, 'team:manage');
}

// Check if user can view audit logs
export function canViewAuditLogs(role: AppRole): boolean {
  return hasPermission(role, 'audit:view');
}

// Mock team members with roles
export interface TeamMember {
  id: string;
  full_name: string;
  email: string;
  role: AppRole;
  department?: string;
  avatar_url?: string;
  is_active: boolean;
  joined_at: string;
}

export const MOCK_TEAM_MEMBERS: TeamMember[] = [
  {
    id: 'mock-user-001',
    full_name: 'أحمد محمد الغامدي',
    email: 'ahmed@company.com',
    role: 'company_owner',
    department: 'الإدارة العليا',
    is_active: true,
    joined_at: '2023-01-15',
  },
  {
    id: 'mock-user-002',
    full_name: 'سعد العتيبي',
    email: 'saad@company.com',
    role: 'finance_manager',
    department: 'المالية',
    is_active: true,
    joined_at: '2023-03-20',
  },
  {
    id: 'mock-user-003',
    full_name: 'خالد السبيعي',
    email: 'khaled@company.com',
    role: 'accountant',
    department: 'المحاسبة',
    is_active: true,
    joined_at: '2023-05-10',
  },
  {
    id: 'mock-user-004',
    full_name: 'محمد القحطاني',
    email: 'mohammed@company.com',
    role: 'project_manager',
    department: 'المشاريع',
    is_active: true,
    joined_at: '2023-06-01',
  },
  {
    id: 'mock-user-005',
    full_name: 'فيصل الدوسري',
    email: 'faisal@company.com',
    role: 'employee',
    department: 'العمليات',
    is_active: true,
    joined_at: '2023-08-15',
  },
  {
    id: 'mock-user-006',
    full_name: 'عبدالله الشهري',
    email: 'abdullah@company.com',
    role: 'employee',
    department: 'المشتريات',
    is_active: false,
    joined_at: '2023-04-01',
  },
];
