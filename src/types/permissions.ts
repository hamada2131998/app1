// =====================================================
// PERMISSION & APPROVAL LIMITS SYSTEM
// Defines spending limits and approval thresholds
// =====================================================

import { AppRole } from '@/contexts/AppContext';

export interface SpendingLimit {
  category: string;
  categoryAr: string;
  maxAmount: number;
  requiresReceipt: boolean;
}

export interface EmployeePermissions {
  userId: string;
  spendingLimits: SpendingLimit[];
  dailyLimit: number;
  monthlyLimit: number;
  requiresPreApproval: boolean;
  canSubmitWithoutReceipt: boolean;
  allowedCategories: string[];
  notes?: string;
}

export interface ApprovalThreshold {
  id: string;
  name: string;
  nameAr: string;
  minAmount: number;
  maxAmount: number | null;
  requiredRole: AppRole;
  requiredRoleAr: string;
}

// Default approval thresholds
export const DEFAULT_APPROVAL_THRESHOLDS: ApprovalThreshold[] = [
  {
    id: 'tier-1',
    name: 'Auto-approve',
    nameAr: 'موافقة تلقائية',
    minAmount: 0,
    maxAmount: 500,
    requiredRole: 'accountant',
    requiredRoleAr: 'محاسب',
  },
  {
    id: 'tier-2',
    name: 'Accountant Approval',
    nameAr: 'موافقة المحاسب',
    minAmount: 500,
    maxAmount: 5000,
    requiredRole: 'accountant',
    requiredRoleAr: 'محاسب',
  },
  {
    id: 'tier-3',
    name: 'Manager Approval',
    nameAr: 'موافقة المدير',
    minAmount: 5000,
    maxAmount: 20000,
    requiredRole: 'manager',
    requiredRoleAr: 'مدير',
  },
  {
    id: 'tier-4',
    name: 'Owner Approval',
    nameAr: 'موافقة المالك',
    minAmount: 20000,
    maxAmount: null,
    requiredRole: 'admin',
    requiredRoleAr: 'المالك/المدير العام',
  },
];

// Default spending limits per category
export const DEFAULT_CATEGORY_LIMITS: SpendingLimit[] = [
  { category: '6001', categoryAr: 'مصروفات السفر والتنقل', maxAmount: 5000, requiresReceipt: true },
  { category: '6002', categoryAr: 'مصروفات الضيافة', maxAmount: 3000, requiresReceipt: true },
  { category: '6003', categoryAr: 'مستلزمات مكتبية', maxAmount: 2000, requiresReceipt: false },
  { category: '6004', categoryAr: 'صيانة وإصلاحات', maxAmount: 10000, requiresReceipt: true },
  { category: '6005', categoryAr: 'اتصالات وإنترنت', maxAmount: 1000, requiresReceipt: true },
  { category: '6006', categoryAr: 'إيجارات', maxAmount: 50000, requiresReceipt: true },
  { category: '6007', categoryAr: 'تدريب وتطوير', maxAmount: 10000, requiresReceipt: true },
  { category: '6008', categoryAr: 'مصروفات أخرى', maxAmount: 1000, requiresReceipt: true },
];

// Helper functions
export function getRequiredApprover(amount: number, thresholds: ApprovalThreshold[] = DEFAULT_APPROVAL_THRESHOLDS): ApprovalThreshold {
  const sorted = [...thresholds].sort((a, b) => b.minAmount - a.minAmount);
  return sorted.find(t => amount >= t.minAmount) || thresholds[0];
}

export function canApproveAmount(role: AppRole, amount: number, thresholds: ApprovalThreshold[] = DEFAULT_APPROVAL_THRESHOLDS): boolean {
  const roleHierarchy: Record<AppRole, number> = {
    admin: 4,
    manager: 3,
    accountant: 2,
    employee: 1,
  };

  const required = getRequiredApprover(amount, thresholds);
  return roleHierarchy[role] >= roleHierarchy[required.requiredRole];
}

export function formatApprovalRequirement(amount: number, thresholds: ApprovalThreshold[] = DEFAULT_APPROVAL_THRESHOLDS): string {
  const required = getRequiredApprover(amount, thresholds);
  return required.requiredRoleAr;
}
