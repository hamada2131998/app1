// =====================================================
// CENTRALIZED APP CONTEXT - ZERO DEAD BUTTON POLICY
// Manages all mock data across the application
// =====================================================

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { toast } from 'sonner';

// =====================================================
// TYPES
// =====================================================

export type AppRole = 'admin' | 'manager' | 'accountant' | 'employee';
export type ExpenseStatus = 'pending' | 'approved' | 'rejected' | 'settled';
export type ProjectStatus = 'active' | 'completed' | 'on_hold';
export type TransactionType = 'deposit' | 'withdrawal' | 'transfer' | 'expense_settlement';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: AppRole;
  department: string;
  avatar_url?: string;
  status: 'active' | 'inactive';
  joined_at: string;
}

export interface ActivityLog {
  id: string;
  user_name: string;
  action: string;
  entity: string;
  timestamp: string;
  type: 'success' | 'warning' | 'info' | 'error';
}

export interface Expense {
  id: string;
  title: string;
  description?: string;
  net_amount: number;
  vat_amount: number;
  total_amount: number;
  status: ExpenseStatus;
  gl_code: string;
  gl_name: string;
  project_id?: string;
  project_name?: string;
  cost_center_id?: string;
  cost_center_name?: string;
  receipt_urls: string[];
  requester_name: string;
  requester_email: string;
  created_at: string;
  approved_at?: string;
  approved_by?: string;
  rejected_at?: string;
  rejection_reason?: string;
  settled_at?: string;
  selected?: boolean;
}

export interface Project {
  id: string;
  name: string;
  client: string;
  description?: string;
  budget: number;
  spent: number;
  progress: number;
  status: ProjectStatus;
  location?: string;
  start_date: string;
  end_date?: string;
  manager_name?: string;
}

export interface WalletTransaction {
  id: string;
  type: TransactionType;
  amount: number;
  description: string;
  balance_before: number;
  balance_after: number;
  created_at: string;
  related_expense_id?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: AppRole;
  department: string;
  avatar_url?: string;
  phone?: string;
  wallet_balance: number;
}

export interface NotificationSettings {
  email_new_expense: boolean;
  email_approvals: boolean;
  email_budget_alerts: boolean;
  push_enabled: boolean;
}

// =====================================================
// GL CODES & COST CENTERS
// =====================================================

export interface GLCode {
  code: string;
  name: string;
  nameEn: string;
  isCustom?: boolean;
  createdBy?: string;
}

export const INITIAL_GL_CODES: GLCode[] = [
  { code: '6001', name: 'مصروفات السفر والتنقل', nameEn: 'Travel Expenses' },
  { code: '6002', name: 'مصروفات الضيافة', nameEn: 'Hospitality' },
  { code: '6003', name: 'مستلزمات مكتبية', nameEn: 'Office Supplies' },
  { code: '6004', name: 'صيانة وإصلاحات', nameEn: 'Maintenance' },
  { code: '6005', name: 'اتصالات وإنترنت', nameEn: 'Communications' },
  { code: '6006', name: 'إيجارات', nameEn: 'Rent' },
  { code: '6007', name: 'تدريب وتطوير', nameEn: 'Training' },
  { code: '6008', name: 'مصروفات أخرى', nameEn: 'Other Expenses' },
];

// For backward compatibility
export let GL_CODES = [...INITIAL_GL_CODES];

export const COST_CENTERS = [
  { id: 'cc-001', code: 'CC-001', name: 'قسم تقنية المعلومات' },
  { id: 'cc-002', code: 'CC-002', name: 'قسم التسويق' },
  { id: 'cc-003', code: 'CC-003', name: 'قسم الموارد البشرية' },
  { id: 'cc-004', code: 'CC-004', name: 'قسم المالية' },
];

// =====================================================
// INITIAL MOCK DATA
// =====================================================

const INITIAL_PROFILE: UserProfile = {
  id: 'user-001',
  name: 'أحمد محمد الغامدي',
  email: 'ahmed@company.com',
  role: 'admin',
  department: 'الإدارة المالية',
  phone: '+966501234567',
  wallet_balance: 75000,
};

const INITIAL_TEAM: TeamMember[] = [
  {
    id: 'user-001',
    name: 'أحمد محمد الغامدي',
    email: 'ahmed@company.com',
    role: 'admin',
    department: 'الإدارة المالية',
    status: 'active',
    joined_at: '2023-01-15',
  },
  {
    id: 'user-002',
    name: 'سعد العتيبي',
    email: 'saad@company.com',
    role: 'manager',
    department: 'المشاريع',
    status: 'active',
    joined_at: '2023-03-20',
  },
  {
    id: 'user-003',
    name: 'خالد السبيعي',
    email: 'khaled@company.com',
    role: 'accountant',
    department: 'المحاسبة',
    status: 'active',
    joined_at: '2023-05-10',
  },
  {
    id: 'user-004',
    name: 'محمد القحطاني',
    email: 'mohammed@company.com',
    role: 'employee',
    department: 'العمليات',
    status: 'active',
    joined_at: '2023-06-01',
  },
];

const INITIAL_PROJECTS: Project[] = [
  {
    id: 'proj-001',
    name: 'برج الرياض التجاري',
    client: 'شركة الإنماء العقارية',
    description: 'مشروع بناء برج تجاري من 25 طابق',
    budget: 5000000,
    spent: 3500000,
    progress: 70,
    status: 'active',
    location: 'الرياض',
    start_date: '2024-01-15',
    end_date: '2025-06-30',
    manager_name: 'سعد العتيبي',
  },
  {
    id: 'proj-002',
    name: 'مجمع الواحة السكني',
    client: 'مؤسسة الوطن للإسكان',
    description: 'مشروع سكني يضم 120 وحدة سكنية',
    budget: 8000000,
    spent: 2400000,
    progress: 30,
    status: 'active',
    location: 'جدة',
    start_date: '2024-03-01',
    end_date: '2025-12-31',
    manager_name: 'محمد القحطاني',
  },
  {
    id: 'proj-003',
    name: 'مركز الأعمال الدولي',
    client: 'هيئة تطوير المنطقة الشرقية',
    budget: 3000000,
    spent: 2700000,
    progress: 90,
    status: 'active',
    location: 'الدمام',
    start_date: '2023-06-01',
    end_date: '2024-12-31',
    manager_name: 'أحمد الغامدي',
  },
];

const INITIAL_EXPENSES: Expense[] = [
  {
    id: 'exp-001',
    title: 'شراء أجهزة حاسب محمولة',
    description: '5 أجهزة لابتوب للفريق التقني',
    net_amount: 25000,
    vat_amount: 3750,
    total_amount: 28750,
    status: 'approved',
    gl_code: '6003',
    gl_name: 'مستلزمات مكتبية',
    project_id: 'proj-001',
    project_name: 'برج الرياض التجاري',
    cost_center_id: 'cc-001',
    cost_center_name: 'قسم تقنية المعلومات',
    receipt_urls: [],
    requester_name: 'أحمد محمد الغامدي',
    requester_email: 'ahmed@company.com',
    created_at: '2024-12-10T09:00:00Z',
    approved_at: '2024-12-11T14:30:00Z',
    approved_by: 'سعد العتيبي',
  },
  {
    id: 'exp-002',
    title: 'رحلة عمل - الرياض',
    description: 'تذاكر طيران وإقامة لمدة 3 أيام',
    net_amount: 8500,
    vat_amount: 1275,
    total_amount: 9775,
    status: 'pending',
    gl_code: '6001',
    gl_name: 'مصروفات السفر والتنقل',
    project_id: 'proj-002',
    project_name: 'مجمع الواحة السكني',
    cost_center_id: 'cc-002',
    cost_center_name: 'قسم التسويق',
    receipt_urls: [],
    requester_name: 'خالد السبيعي',
    requester_email: 'khaled@company.com',
    created_at: '2024-12-20T11:00:00Z',
  },
  {
    id: 'exp-003',
    title: 'اشتراك سنوي - برامج التصميم',
    description: 'تجديد رخصة Adobe Creative Cloud',
    net_amount: 4000,
    vat_amount: 600,
    total_amount: 4600,
    status: 'settled',
    gl_code: '6007',
    gl_name: 'تدريب وتطوير',
    project_id: 'proj-001',
    project_name: 'برج الرياض التجاري',
    cost_center_id: 'cc-001',
    cost_center_name: 'قسم تقنية المعلومات',
    receipt_urls: [],
    requester_name: 'محمد القحطاني',
    requester_email: 'mohammed@company.com',
    created_at: '2024-12-05T08:00:00Z',
    approved_at: '2024-12-06T10:00:00Z',
    approved_by: 'أحمد الغامدي',
    settled_at: '2024-12-08T16:00:00Z',
  },
  {
    id: 'exp-004',
    title: 'ضيافة اجتماع مجلس الإدارة',
    description: 'وجبات ومشروبات للاجتماع الربعي',
    net_amount: 3500,
    vat_amount: 525,
    total_amount: 4025,
    status: 'rejected',
    gl_code: '6002',
    gl_name: 'مصروفات الضيافة',
    cost_center_id: 'cc-004',
    cost_center_name: 'قسم المالية',
    receipt_urls: [],
    requester_name: 'سعد العتيبي',
    requester_email: 'saad@company.com',
    created_at: '2024-12-18T14:00:00Z',
    rejected_at: '2024-12-19T09:00:00Z',
    rejection_reason: 'يجب الحصول على موافقة مسبقة لمصاريف الضيافة فوق 3000 ريال',
  },
  {
    id: 'exp-005',
    title: 'صيانة أجهزة التكييف',
    description: 'صيانة دورية لأجهزة التكييف المركزي',
    net_amount: 6000,
    vat_amount: 900,
    total_amount: 6900,
    status: 'pending',
    gl_code: '6004',
    gl_name: 'صيانة وإصلاحات',
    project_id: 'proj-003',
    project_name: 'مركز الأعمال الدولي',
    cost_center_id: 'cc-003',
    cost_center_name: 'قسم الموارد البشرية',
    receipt_urls: [],
    requester_name: 'أحمد محمد الغامدي',
    requester_email: 'ahmed@company.com',
    created_at: '2024-12-22T10:00:00Z',
  },
];

const INITIAL_TRANSACTIONS: WalletTransaction[] = [
  {
    id: 'trans-001',
    type: 'deposit',
    amount: 100000,
    description: 'إيداع رأس مال أولي',
    balance_before: 0,
    balance_after: 100000,
    created_at: '2024-01-01T10:00:00Z',
  },
  {
    id: 'trans-002',
    type: 'expense_settlement',
    amount: 28750,
    description: 'تسوية مصروف: شراء أجهزة حاسب محمولة',
    balance_before: 100000,
    balance_after: 71250,
    created_at: '2024-12-08T16:00:00Z',
    related_expense_id: 'exp-001',
  },
  {
    id: 'trans-003',
    type: 'deposit',
    amount: 50000,
    description: 'تمويل إضافي للمشاريع',
    balance_before: 71250,
    balance_after: 121250,
    created_at: '2024-12-15T09:00:00Z',
  },
];

const INITIAL_ACTIVITIES: ActivityLog[] = [
  {
    id: 'act-001',
    user_name: 'أحمد محمد الغامدي',
    action: 'قام بإضافة مصروف جديد',
    entity: 'شراء أجهزة حاسب محمولة',
    timestamp: '2024-12-10T09:00:00Z',
    type: 'info',
  },
  {
    id: 'act-002',
    user_name: 'سعد العتيبي',
    action: 'قام بالموافقة على مصروف',
    entity: 'شراء أجهزة حاسب محمولة',
    timestamp: '2024-12-11T14:30:00Z',
    type: 'success',
  },
  {
    id: 'act-003',
    user_name: 'خالد السبيعي',
    action: 'رفض مصروف',
    entity: 'ضيافة اجتماع مجلس الإدارة',
    timestamp: '2024-12-19T09:00:00Z',
    type: 'error',
  },
];

// =====================================================
// CONTEXT TYPE
// =====================================================

interface AppContextType {
  // User & Auth
  profile: UserProfile;
  updateProfile: (updates: Partial<UserProfile>) => void;
  currentRole: AppRole;
  setCurrentRole: (role: AppRole) => void;
  
  // Team
  team: TeamMember[];
  addTeamMember: (member: Omit<TeamMember, 'id' | 'joined_at'>) => void;
  updateTeamMember: (id: string, updates: Partial<TeamMember>) => void;
  removeTeamMember: (id: string) => void;
  
  // Projects
  projects: Project[];
  addProject: (project: Omit<Project, 'id' | 'spent' | 'progress'>) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  removeProject: (id: string) => void;
  
  // Expenses
  expenses: Expense[];
  addExpense: (expense: Omit<Expense, 'id' | 'created_at' | 'selected'>) => void;
  updateExpense: (id: string, updates: Partial<Expense>) => void;
  removeExpense: (id: string) => void;
  approveExpense: (id: string) => void;
  rejectExpense: (id: string, reason: string) => void;
  settleExpense: (id: string) => void;
  bulkApprove: (ids: string[]) => void;
  bulkReject: (ids: string[], reason: string) => void;
  bulkSettle: (ids: string[]) => void;
  toggleExpenseSelection: (id: string) => void;
  clearExpenseSelection: () => void;
  selectedExpenseIds: string[];
  
  // GL Codes (Expense Categories)
  glCodes: GLCode[];
  addGLCode: (glCode: Omit<GLCode, 'isCustom' | 'createdBy'>) => void;
  removeGLCode: (code: string) => void;
  
  // Wallet
  walletBalance: number;
  transactions: WalletTransaction[];
  deposit: (amount: number, description?: string) => void;
  withdraw: (amount: number, description?: string) => void;
  transfer: (amount: number, toUserId: string, description?: string) => void;
  
  // Activity Log
  activities: ActivityLog[];
  addActivity: (activity: Omit<ActivityLog, 'id' | 'timestamp'>) => void;
  
  // Notifications
  notificationSettings: NotificationSettings;
  updateNotificationSettings: (updates: Partial<NotificationSettings>) => void;
  
  // Utility
  formatCurrency: (amount: number) => string;
  formatDate: (date: string) => string;
  calculateVat: (amount: number, includesVat: boolean) => { net: number; vat: number; total: number };
}

const AppContext = createContext<AppContextType | null>(null);

// =====================================================
// PROVIDER
// =====================================================

export function AppProvider({ children }: { children: ReactNode }) {
  // State
  const [profile, setProfile] = useState<UserProfile>(INITIAL_PROFILE);
  const [currentRole, setCurrentRole] = useState<AppRole>('admin');
  const [team, setTeam] = useState<TeamMember[]>(INITIAL_TEAM);
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [expenses, setExpenses] = useState<Expense[]>(INITIAL_EXPENSES);
  const [glCodes, setGLCodes] = useState<GLCode[]>(INITIAL_GL_CODES);
  const [walletBalance, setWalletBalance] = useState(75000);
  const [transactions, setTransactions] = useState<WalletTransaction[]>(INITIAL_TRANSACTIONS);
  const [activities, setActivities] = useState<ActivityLog[]>(INITIAL_ACTIVITIES);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    email_new_expense: true,
    email_approvals: true,
    email_budget_alerts: true,
    push_enabled: false,
  });

  // Derived state
  const selectedExpenseIds = expenses.filter(e => e.selected).map(e => e.id);

  // Utility functions
  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
    }).format(amount);
  }, []);

  const formatDate = useCallback((date: string) => {
    return new Intl.DateTimeFormat('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(date));
  }, []);

  const calculateVat = useCallback((amount: number, includesVat: boolean) => {
    if (includesVat) {
      const net = amount / 1.15;
      const vat = amount - net;
      return { net: Math.round(net * 100) / 100, vat: Math.round(vat * 100) / 100, total: amount };
    }
    const vat = amount * 0.15;
    const total = amount + vat;
    return { net: amount, vat: Math.round(vat * 100) / 100, total: Math.round(total * 100) / 100 };
  }, []);

  // Activity helper
  const addActivity = useCallback((activity: Omit<ActivityLog, 'id' | 'timestamp'>) => {
    const newActivity: ActivityLog = {
      ...activity,
      id: `act-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
    setActivities(prev => [newActivity, ...prev]);
  }, []);

  // Profile functions
  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    setProfile(prev => ({ ...prev, ...updates }));
    toast.success('تم تحديث الملف الشخصي');
    addActivity({
      user_name: profile.name,
      action: 'قام بتحديث الملف الشخصي',
      entity: 'الإعدادات',
      type: 'info',
    });
  }, [profile.name, addActivity]);

  // Team functions
  const addTeamMember = useCallback((member: Omit<TeamMember, 'id' | 'joined_at'>) => {
    const newMember: TeamMember = {
      ...member,
      id: `user-${Date.now()}`,
      joined_at: new Date().toISOString().split('T')[0],
    };
    setTeam(prev => [newMember, ...prev]);
    toast.success(`تمت إضافة ${member.name} للفريق`);
    addActivity({
      user_name: profile.name,
      action: 'قام بإضافة عضو جديد',
      entity: member.name,
      type: 'success',
    });
  }, [profile.name, addActivity]);

  const updateTeamMember = useCallback((id: string, updates: Partial<TeamMember>) => {
    setTeam(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
    toast.success('تم تحديث بيانات العضو');
  }, []);

  const removeTeamMember = useCallback((id: string) => {
    const member = team.find(m => m.id === id);
    setTeam(prev => prev.filter(m => m.id !== id));
    toast.success(`تم حذف ${member?.name || 'العضو'}`);
    addActivity({
      user_name: profile.name,
      action: 'قام بحذف عضو',
      entity: member?.name || 'عضو',
      type: 'warning',
    });
  }, [team, profile.name, addActivity]);

  // Project functions
  const addProject = useCallback((project: Omit<Project, 'id' | 'spent' | 'progress'>) => {
    const newProject: Project = {
      ...project,
      id: `proj-${Date.now()}`,
      spent: 0,
      progress: 0,
    };
    setProjects(prev => [newProject, ...prev]);
    toast.success(`تم إنشاء مشروع: ${project.name}`);
    addActivity({
      user_name: profile.name,
      action: 'قام بإنشاء مشروع جديد',
      entity: project.name,
      type: 'success',
    });
  }, [profile.name, addActivity]);

  const updateProject = useCallback((id: string, updates: Partial<Project>) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    toast.success('تم تحديث المشروع');
  }, []);

  const removeProject = useCallback((id: string) => {
    const project = projects.find(p => p.id === id);
    setProjects(prev => prev.filter(p => p.id !== id));
    toast.success(`تم حذف ${project?.name || 'المشروع'}`);
  }, [projects]);

  // Expense functions
  const addExpense = useCallback((expense: Omit<Expense, 'id' | 'created_at' | 'selected'>) => {
    const newExpense: Expense = {
      ...expense,
      id: `exp-${Date.now()}`,
      created_at: new Date().toISOString(),
      selected: false,
    };
    setExpenses(prev => [newExpense, ...prev]);
    toast.success('تم إضافة المصروف بنجاح');
    addActivity({
      user_name: profile.name,
      action: 'قام بإضافة مصروف جديد',
      entity: expense.title,
      type: 'info',
    });
  }, [profile.name, addActivity]);

  const updateExpense = useCallback((id: string, updates: Partial<Expense>) => {
    setExpenses(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
  }, []);

  const removeExpense = useCallback((id: string) => {
    const expense = expenses.find(e => e.id === id);
    setExpenses(prev => prev.filter(e => e.id !== id));
    toast.success('تم حذف المصروف');
    addActivity({
      user_name: profile.name,
      action: 'قام بحذف مصروف',
      entity: expense?.title || 'مصروف',
      type: 'warning',
    });
  }, [expenses, profile.name, addActivity]);

  const approveExpense = useCallback((id: string) => {
    const expense = expenses.find(e => e.id === id);
    setExpenses(prev => prev.map(e => 
      e.id === id 
        ? { ...e, status: 'approved' as ExpenseStatus, approved_at: new Date().toISOString(), approved_by: profile.name }
        : e
    ));
    toast.success('تمت الموافقة على المصروف');
    addActivity({
      user_name: profile.name,
      action: 'قام بالموافقة على مصروف',
      entity: expense?.title || 'مصروف',
      type: 'success',
    });
  }, [expenses, profile.name, addActivity]);

  const rejectExpense = useCallback((id: string, reason: string) => {
    const expense = expenses.find(e => e.id === id);
    setExpenses(prev => prev.map(e => 
      e.id === id 
        ? { ...e, status: 'rejected' as ExpenseStatus, rejected_at: new Date().toISOString(), rejection_reason: reason }
        : e
    ));
    // Main notification for the action
    toast.success('تم رفض المصروف');
    // Notify the employee who submitted the expense
    setTimeout(() => {
      toast.error(
        `تم رفض طلب "${expense?.title}" - السبب: ${reason}`,
        { 
          duration: 6000,
          description: `المقدم: ${expense?.requester_name}`
        }
      );
    }, 500);
    addActivity({
      user_name: profile.name,
      action: 'قام برفض مصروف',
      entity: expense?.title || 'مصروف',
      type: 'error',
    });
  }, [expenses, profile.name, addActivity]);

  const settleExpense = useCallback((id: string) => {
    const expense = expenses.find(e => e.id === id);
    if (!expense) return;

    // Create transaction
    const newTransaction: WalletTransaction = {
      id: `trans-${Date.now()}`,
      type: 'expense_settlement',
      amount: expense.total_amount,
      description: `تسوية مصروف: ${expense.title}`,
      balance_before: walletBalance,
      balance_after: walletBalance - expense.total_amount,
      created_at: new Date().toISOString(),
      related_expense_id: id,
    };
    
    setTransactions(prev => [newTransaction, ...prev]);
    setWalletBalance(prev => prev - expense.total_amount);
    setExpenses(prev => prev.map(e => 
      e.id === id 
        ? { ...e, status: 'settled' as ExpenseStatus, settled_at: new Date().toISOString() }
        : e
    ));
    toast.success('تمت تسوية المصروف بنجاح');
    addActivity({
      user_name: profile.name,
      action: 'قام بتسوية مصروف',
      entity: expense.title,
      type: 'success',
    });
  }, [expenses, walletBalance, profile.name, addActivity]);

  // Bulk actions
  const bulkApprove = useCallback((ids: string[]) => {
    setExpenses(prev => prev.map(e => 
      ids.includes(e.id) && e.status === 'pending'
        ? { ...e, status: 'approved' as ExpenseStatus, approved_at: new Date().toISOString(), approved_by: profile.name, selected: false }
        : e
    ));
    toast.success(`تمت الموافقة على ${ids.length} مصروفات`);
    addActivity({
      user_name: profile.name,
      action: `قام بالموافقة الجماعية على ${ids.length} مصروفات`,
      entity: 'موافقة جماعية',
      type: 'success',
    });
  }, [profile.name, addActivity]);

  const bulkReject = useCallback((ids: string[], reason: string) => {
    setExpenses(prev => prev.map(e => 
      ids.includes(e.id) && e.status === 'pending'
        ? { ...e, status: 'rejected' as ExpenseStatus, rejected_at: new Date().toISOString(), rejection_reason: reason, selected: false }
        : e
    ));
    toast.success(`تم رفض ${ids.length} مصروفات`);
    addActivity({
      user_name: profile.name,
      action: `قام بالرفض الجماعي لـ ${ids.length} مصروفات`,
      entity: 'رفض جماعي',
      type: 'error',
    });
  }, [profile.name, addActivity]);

  const bulkSettle = useCallback((ids: string[]) => {
    let totalAmount = 0;
    const approvedExpenses = expenses.filter(e => ids.includes(e.id) && e.status === 'approved');
    
    approvedExpenses.forEach(expense => {
      totalAmount += expense.total_amount;
    });

    // Create single transaction for bulk
    if (totalAmount > 0) {
      const newTransaction: WalletTransaction = {
        id: `trans-${Date.now()}`,
        type: 'expense_settlement',
        amount: totalAmount,
        description: `تسوية جماعية: ${approvedExpenses.length} مصروفات`,
        balance_before: walletBalance,
        balance_after: walletBalance - totalAmount,
        created_at: new Date().toISOString(),
      };
      setTransactions(prev => [newTransaction, ...prev]);
      setWalletBalance(prev => prev - totalAmount);
    }

    setExpenses(prev => prev.map(e => 
      ids.includes(e.id) && e.status === 'approved'
        ? { ...e, status: 'settled' as ExpenseStatus, settled_at: new Date().toISOString(), selected: false }
        : e
    ));
    toast.success(`تمت تسوية ${approvedExpenses.length} مصروفات`);
    addActivity({
      user_name: profile.name,
      action: `قام بالتسوية الجماعية لـ ${approvedExpenses.length} مصروفات`,
      entity: 'تسوية جماعية',
      type: 'success',
    });
  }, [expenses, walletBalance, profile.name, addActivity]);

  const toggleExpenseSelection = useCallback((id: string) => {
    setExpenses(prev => prev.map(e => 
      e.id === id ? { ...e, selected: !e.selected } : e
    ));
  }, []);

  const clearExpenseSelection = useCallback(() => {
    setExpenses(prev => prev.map(e => ({ ...e, selected: false })));
  }, []);

  // Wallet functions
  const deposit = useCallback((amount: number, description?: string) => {
    const newTransaction: WalletTransaction = {
      id: `trans-${Date.now()}`,
      type: 'deposit',
      amount,
      description: description || 'إيداع نقدي',
      balance_before: walletBalance,
      balance_after: walletBalance + amount,
      created_at: new Date().toISOString(),
    };
    setTransactions(prev => [newTransaction, ...prev]);
    setWalletBalance(prev => prev + amount);
    toast.success(`تم إيداع ${formatCurrency(amount)}`);
    addActivity({
      user_name: profile.name,
      action: 'قام بإيداع مبلغ',
      entity: formatCurrency(amount),
      type: 'success',
    });
  }, [walletBalance, formatCurrency, profile.name, addActivity]);

  const withdraw = useCallback((amount: number, description?: string) => {
    if (amount > walletBalance) {
      toast.error('رصيد غير كافي');
      return;
    }
    const newTransaction: WalletTransaction = {
      id: `trans-${Date.now()}`,
      type: 'withdrawal',
      amount,
      description: description || 'سحب نقدي',
      balance_before: walletBalance,
      balance_after: walletBalance - amount,
      created_at: new Date().toISOString(),
    };
    setTransactions(prev => [newTransaction, ...prev]);
    setWalletBalance(prev => prev - amount);
    toast.success(`تم سحب ${formatCurrency(amount)}`);
    addActivity({
      user_name: profile.name,
      action: 'قام بسحب مبلغ',
      entity: formatCurrency(amount),
      type: 'warning',
    });
  }, [walletBalance, formatCurrency, profile.name, addActivity]);

  const transferFunds = useCallback((amount: number, toUserId: string, description?: string) => {
    if (amount > walletBalance) {
      toast.error('رصيد غير كافي');
      return;
    }
    const recipient = team.find(m => m.id === toUserId);
    const newTransaction: WalletTransaction = {
      id: `trans-${Date.now()}`,
      type: 'transfer',
      amount,
      description: description || `تحويل إلى ${recipient?.name || 'مستخدم'}`,
      balance_before: walletBalance,
      balance_after: walletBalance - amount,
      created_at: new Date().toISOString(),
    };
    setTransactions(prev => [newTransaction, ...prev]);
    setWalletBalance(prev => prev - amount);
    toast.success(`تم التحويل بنجاح إلى ${recipient?.name}`);
    addActivity({
      user_name: profile.name,
      action: 'قام بتحويل مبلغ',
      entity: `${formatCurrency(amount)} إلى ${recipient?.name}`,
      type: 'info',
    });
  }, [walletBalance, team, formatCurrency, profile.name, addActivity]);

  // Notification settings
  const updateNotificationSettings = useCallback((updates: Partial<NotificationSettings>) => {
    setNotificationSettings(prev => ({ ...prev, ...updates }));
    toast.success('تم حفظ إعدادات الإشعارات');
  }, []);

  // GL Code management
  const addGLCode = useCallback((glCode: Omit<GLCode, 'isCustom' | 'createdBy'>) => {
    const newGLCode: GLCode = {
      ...glCode,
      isCustom: true,
      createdBy: profile.name,
    };
    setGLCodes(prev => [...prev, newGLCode]);
    // Update the exported GL_CODES for backward compatibility
    GL_CODES = [...glCodes, newGLCode];
    toast.success(`تم إضافة نوع مصروف: ${glCode.name}`);
    addActivity({
      user_name: profile.name,
      action: 'قام بإضافة نوع مصروف جديد',
      entity: glCode.name,
      type: 'success',
    });
  }, [profile.name, addActivity, glCodes]);

  const removeGLCode = useCallback((code: string) => {
    const glCode = glCodes.find(g => g.code === code);
    if (glCode && !glCode.isCustom) {
      toast.error('لا يمكن حذف أنواع المصاريف الأساسية');
      return;
    }
    setGLCodes(prev => prev.filter(g => g.code !== code));
    GL_CODES = glCodes.filter(g => g.code !== code);
    toast.success('تم حذف نوع المصروف');
    addActivity({
      user_name: profile.name,
      action: 'قام بحذف نوع مصروف',
      entity: glCode?.name || 'نوع مصروف',
      type: 'warning',
    });
  }, [glCodes, profile.name, addActivity]);

  return (
    <AppContext.Provider
      value={{
        profile,
        updateProfile,
        currentRole,
        setCurrentRole,
        team,
        addTeamMember,
        updateTeamMember,
        removeTeamMember,
        projects,
        addProject,
        updateProject,
        removeProject,
        expenses,
        addExpense,
        updateExpense,
        removeExpense,
        approveExpense,
        rejectExpense,
        settleExpense,
        bulkApprove,
        bulkReject,
        bulkSettle,
        toggleExpenseSelection,
        clearExpenseSelection,
        selectedExpenseIds,
        glCodes,
        addGLCode,
        removeGLCode,
        walletBalance,
        transactions,
        deposit,
        withdraw,
        transfer: transferFunds,
        activities,
        addActivity,
        notificationSettings,
        updateNotificationSettings,
        formatCurrency,
        formatDate,
        calculateVat,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

// =====================================================
// HOOK
// =====================================================

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
