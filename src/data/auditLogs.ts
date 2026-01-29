// =====================================================
// AUDIT LOGS - DEMO DATA
// Simulates immutable audit trail
// =====================================================

export type AuditAction = 
  | 'create'
  | 'update'
  | 'delete'
  | 'approve'
  | 'reject'
  | 'settle'
  | 'login'
  | 'logout'
  | 'policy_change'
  | 'role_change'
  | 'permission_change'
  | 'wallet_transaction';

export interface AuditLog {
  id: string;
  company_id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  user_role: string;
  action: AuditAction;
  entity_type: string;
  entity_id: string;
  entity_name?: string;
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
  changes_summary: string;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

// =====================================================
// DEMO AUDIT LOGS
// =====================================================

export const DEMO_AUDIT_LOGS: Record<string, AuditLog[]> = {
  'company-saudi-co': [
    {
      id: 'audit-001',
      company_id: 'company-saudi-co',
      user_id: 'user-saudi-001',
      user_email: 'ahmed@saudico.com',
      user_name: 'أحمد محمد الغامدي',
      user_role: 'finance_manager',
      action: 'approve',
      entity_type: 'expense',
      entity_id: 'exp-saudi-001',
      entity_name: 'شراء مواد بناء - حديد تسليح',
      old_values: { status: 'pending' },
      new_values: { status: 'approved' },
      changes_summary: 'تم قبول المصروف: شراء مواد بناء - حديد تسليح (51,750 ر.س)',
      ip_address: '192.168.1.100',
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
      created_at: '2024-12-16T09:00:00Z',
    },
    {
      id: 'audit-002',
      company_id: 'company-saudi-co',
      user_id: 'user-saudi-001',
      user_email: 'ahmed@saudico.com',
      user_name: 'أحمد محمد الغامدي',
      user_role: 'finance_manager',
      action: 'settle',
      entity_type: 'expense',
      entity_id: 'exp-saudi-002',
      entity_name: 'أجور عمال - ديسمبر 2024',
      old_values: { status: 'approved' },
      new_values: { status: 'settled' },
      changes_summary: 'تمت تسوية المصروف: أجور عمال - ديسمبر 2024 (138,000 ر.س)',
      ip_address: '192.168.1.100',
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
      created_at: '2024-12-21T10:00:00Z',
    },
    {
      id: 'audit-003',
      company_id: 'company-saudi-co',
      user_id: 'user-saudi-001',
      user_email: 'ahmed@saudico.com',
      user_name: 'أحمد محمد الغامدي',
      user_role: 'finance_manager',
      action: 'update',
      entity_type: 'expense',
      entity_id: 'exp-test-001',
      entity_name: 'مصروف اختبار',
      old_values: { amount: 100 },
      new_values: { amount: 500 },
      changes_summary: 'تم تعديل المبلغ: 100 ر.س ← 500 ر.س',
      ip_address: '192.168.1.100',
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
      created_at: '2024-12-22T14:30:00Z',
    },
    {
      id: 'audit-004',
      company_id: 'company-saudi-co',
      user_id: 'user-admin-001',
      user_email: 'admin@saudico.com',
      user_name: 'مدير النظام',
      user_role: 'company_owner',
      action: 'role_change',
      entity_type: 'user',
      entity_id: 'user-saudi-003',
      entity_name: 'خالد السبيعي',
      old_values: { role: 'employee' },
      new_values: { role: 'accountant' },
      changes_summary: 'تم تغيير صلاحية المستخدم: موظف ← محاسب',
      ip_address: '192.168.1.50',
      user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15',
      created_at: '2024-12-20T16:00:00Z',
    },
    {
      id: 'audit-005',
      company_id: 'company-saudi-co',
      user_id: 'user-admin-001',
      user_email: 'admin@saudico.com',
      user_name: 'مدير النظام',
      user_role: 'company_owner',
      action: 'policy_change',
      entity_type: 'policy',
      entity_id: 'policy-travel-001',
      entity_name: 'سياسة مصروفات السفر',
      old_values: { max_amount: 300 },
      new_values: { max_amount: 500 },
      changes_summary: 'تم تعديل الحد الأقصى للسفر: 300 ر.س ← 500 ر.س',
      ip_address: '192.168.1.50',
      user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15',
      created_at: '2024-12-19T11:00:00Z',
    },
    {
      id: 'audit-006',
      company_id: 'company-saudi-co',
      user_id: 'user-saudi-002',
      user_email: 'saad@saudico.com',
      user_name: 'سعد العتيبي',
      user_role: 'accountant',
      action: 'wallet_transaction',
      entity_type: 'wallet',
      entity_id: 'wallet-002',
      entity_name: 'محفظة سعد العتيبي',
      old_values: { balance: 8000 },
      new_values: { balance: 5000 },
      changes_summary: 'تحويل 3,000 ر.س من المحفظة',
      ip_address: '192.168.1.120',
      user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) Safari/604.1',
      created_at: '2024-12-18T14:30:00Z',
    },
    {
      id: 'audit-007',
      company_id: 'company-saudi-co',
      user_id: 'user-saudi-001',
      user_email: 'ahmed@saudico.com',
      user_name: 'أحمد محمد الغامدي',
      user_role: 'finance_manager',
      action: 'reject',
      entity_type: 'expense',
      entity_id: 'exp-saudi-005',
      entity_name: 'استشارات هندسية - تصميم معماري',
      old_values: { status: 'pending' },
      new_values: { status: 'rejected', rejection_reason: 'المبلغ يتجاوز الميزانية المخصصة' },
      changes_summary: 'تم رفض المصروف: استشارات هندسية (40,250 ر.س) - السبب: المبلغ يتجاوز الميزانية المخصصة',
      ip_address: '192.168.1.100',
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
      created_at: '2024-12-11T10:00:00Z',
    },
    {
      id: 'audit-008',
      company_id: 'company-saudi-co',
      user_id: 'user-saudi-001',
      user_email: 'ahmed@saudico.com',
      user_name: 'أحمد محمد الغامدي',
      user_role: 'finance_manager',
      action: 'login',
      entity_type: 'session',
      entity_id: 'session-12345',
      changes_summary: 'تسجيل دخول ناجح',
      ip_address: '192.168.1.100',
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
      created_at: '2024-12-22T08:00:00Z',
    },
  ],
  'company-global-tech': [
    {
      id: 'audit-g-001',
      company_id: 'company-global-tech',
      user_id: 'user-global-001',
      user_email: 'sarah@globaltech.com',
      user_name: 'Sarah Johnson',
      user_role: 'company_owner',
      action: 'approve',
      entity_type: 'expense',
      entity_id: 'exp-global-001',
      entity_name: 'AWS Cloud Services - Monthly',
      old_values: { status: 'pending' },
      new_values: { status: 'approved' },
      changes_summary: 'Approved expense: AWS Cloud Services - Monthly (85,000 SAR)',
      ip_address: '10.0.0.50',
      user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/120.0.0.0',
      created_at: '2024-12-02T09:00:00Z',
    },
    {
      id: 'audit-g-002',
      company_id: 'company-global-tech',
      user_id: 'user-global-001',
      user_email: 'sarah@globaltech.com',
      user_name: 'Sarah Johnson',
      user_role: 'company_owner',
      action: 'settle',
      entity_type: 'expense',
      entity_id: 'exp-global-002',
      entity_name: 'Software Licenses - Annual',
      old_values: { status: 'approved' },
      new_values: { status: 'settled' },
      changes_summary: 'Settled expense: Software Licenses - Annual (125,000 SAR)',
      ip_address: '10.0.0.50',
      user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/120.0.0.0',
      created_at: '2024-11-17T12:00:00Z',
    },
    {
      id: 'audit-g-003',
      company_id: 'company-global-tech',
      user_id: 'user-global-001',
      user_email: 'sarah@globaltech.com',
      user_name: 'Sarah Johnson',
      user_role: 'company_owner',
      action: 'create',
      entity_type: 'project',
      entity_id: 'proj-global-002',
      entity_name: 'Mobile App Development',
      new_values: { budget: 1500000, location: 'Dubai Office' },
      changes_summary: 'Created new project: Mobile App Development (Budget: 1,500,000 SAR)',
      ip_address: '10.0.0.50',
      user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/120.0.0.0',
      created_at: '2024-10-15T10:00:00Z',
    },
  ],
};

// =====================================================
// AUDIT LOG UTILITY FUNCTIONS
// =====================================================

let auditLogsStore: Record<string, AuditLog[]> = { ...DEMO_AUDIT_LOGS };

export function getAuditLogs(companyId: string): AuditLog[] {
  return auditLogsStore[companyId] || [];
}

export function addAuditLog(log: Omit<AuditLog, 'id' | 'created_at'>): void {
  const newLog: AuditLog = {
    ...log,
    id: 'audit-' + Date.now(),
    created_at: new Date().toISOString(),
  };

  if (!auditLogsStore[log.company_id]) {
    auditLogsStore[log.company_id] = [];
  }

  auditLogsStore[log.company_id] = [newLog, ...auditLogsStore[log.company_id]];
}

export function resetAuditLogs(): void {
  auditLogsStore = { ...DEMO_AUDIT_LOGS };
}

// Action labels for display
export const AUDIT_ACTION_LABELS: Record<AuditAction, { en: string; ar: string; color: string }> = {
  create: { en: 'Created', ar: 'إنشاء', color: 'bg-green-100 text-green-800' },
  update: { en: 'Updated', ar: 'تعديل', color: 'bg-blue-100 text-blue-800' },
  delete: { en: 'Deleted', ar: 'حذف', color: 'bg-red-100 text-red-800' },
  approve: { en: 'Approved', ar: 'موافقة', color: 'bg-emerald-100 text-emerald-800' },
  reject: { en: 'Rejected', ar: 'رفض', color: 'bg-orange-100 text-orange-800' },
  settle: { en: 'Settled', ar: 'تسوية', color: 'bg-purple-100 text-purple-800' },
  login: { en: 'Login', ar: 'تسجيل دخول', color: 'bg-slate-100 text-slate-800' },
  logout: { en: 'Logout', ar: 'تسجيل خروج', color: 'bg-slate-100 text-slate-800' },
  policy_change: { en: 'Policy Changed', ar: 'تغيير سياسة', color: 'bg-amber-100 text-amber-800' },
  role_change: { en: 'Role Changed', ar: 'تغيير صلاحية', color: 'bg-indigo-100 text-indigo-800' },
  permission_change: { en: 'Permission Changed', ar: 'تعديل صلاحيات', color: 'bg-violet-100 text-violet-800' },
  wallet_transaction: { en: 'Wallet Transaction', ar: 'حركة محفظة', color: 'bg-cyan-100 text-cyan-800' },
};

// Entity type labels
export const ENTITY_TYPE_LABELS: Record<string, { en: string; ar: string }> = {
  expense: { en: 'Expense', ar: 'مصروف' },
  project: { en: 'Project', ar: 'مشروع' },
  user: { en: 'User', ar: 'مستخدم' },
  policy: { en: 'Policy', ar: 'سياسة' },
  wallet: { en: 'Wallet', ar: 'محفظة' },
  session: { en: 'Session', ar: 'جلسة' },
  employee_permission: { en: 'Employee Permission', ar: 'صلاحيات موظف' },
};
