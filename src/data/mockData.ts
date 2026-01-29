// Mock data for demo mode (no backend)
// Enhanced with GL codes, VAT, cost centers, and Saudi-specific data

// GL Code Categories for Chart of Accounts
export const GL_CODES = {
  '6001': { code: '6001', name: 'مصروفات السفر', nameEn: 'Travel Expenses' },
  '6002': { code: '6002', name: 'مواد البناء', nameEn: 'Construction Materials' },
  '6003': { code: '6003', name: 'الرواتب والأجور', nameEn: 'Salaries & Wages' },
  '6004': { code: '6004', name: 'المعدات والآلات', nameEn: 'Equipment & Machinery' },
  '6005': { code: '6005', name: 'الاستشارات المهنية', nameEn: 'Professional Consulting' },
  '6006': { code: '6006', name: 'النقل والشحن', nameEn: 'Transportation & Shipping' },
  '6007': { code: '6007', name: 'الكهرباء والمياه', nameEn: 'Utilities' },
  '6008': { code: '6008', name: 'الصيانة والإصلاح', nameEn: 'Maintenance & Repairs' },
};

// Cost Centers
export const COST_CENTERS = [
  { id: 'cc-001', name: 'المقر الرئيسي', code: 'HQ' },
  { id: 'cc-002', name: 'موقع الرياض', code: 'RYD' },
  { id: 'cc-003', name: 'موقع جدة', code: 'JED' },
  { id: 'cc-004', name: 'موقع الدمام', code: 'DMM' },
];

export const MOCK_USER = {
  id: 'mock-user-001',
  email: 'demo@company.com',
  user_metadata: {
    full_name: 'أحمد محمد الغامدي',
  },
};

export const MOCK_PROFILE = {
  id: 'mock-user-001',
  full_name: 'أحمد محمد الغامدي',
  role: 'admin' as const,
  company_id: 'mock-company-001',
  wallet_balance: 45000,
  avatar_url: null,
};

export const MOCK_PROJECTS = [
  {
    id: 'proj-001',
    name: 'برج الرياض التجاري',
    description: 'برج تجاري من 20 طابق في وسط الرياض',
    budget: 5000000,
    spent: 3500000,
    location: 'الرياض، المملكة العربية السعودية',
    start_date: '2024-01-15',
    created_at: '2024-01-15T10:00:00Z',
    cost_center: 'cc-002',
  },
  {
    id: 'proj-002',
    name: 'مجمع الواحة السكني',
    description: 'مجمع سكني يحتوي على 50 فيلا',
    budget: 8000000,
    spent: 2400000,
    location: 'جدة، المملكة العربية السعودية',
    start_date: '2024-03-01',
    created_at: '2024-03-01T08:00:00Z',
    cost_center: 'cc-003',
  },
  {
    id: 'proj-003',
    name: 'مركز الأعمال الدولي',
    description: 'مركز أعمال متعدد الاستخدامات',
    budget: 3000000,
    spent: 2700000,
    location: 'الدمام، المملكة العربية السعودية',
    start_date: '2023-10-01',
    created_at: '2023-10-01T12:00:00Z',
    cost_center: 'cc-004',
  },
  {
    id: 'proj-004',
    name: 'حديقة النخيل',
    description: 'تطوير حديقة عامة مع مرافق ترفيهية',
    budget: 1500000,
    spent: 450000,
    location: 'المدينة المنورة',
    start_date: '2024-06-01',
    created_at: '2024-06-01T09:00:00Z',
    cost_center: 'cc-001',
  },
];

export type ExpenseStatus = 'pending' | 'approved' | 'rejected' | 'settled';

export interface Expense {
  id: string;
  description: string;
  amount: number;
  net_amount: number;
  vat_amount: number;
  includes_vat: boolean;
  status: ExpenseStatus;
  receipt_url: string | null;
  created_at: string;
  approved_at?: string;
  settled_at?: string;
  rejection_reason?: string;
  project_id: string;
  user_id: string;
  gl_code: string;
  cost_center: string;
  projects?: { name: string };
  profiles?: { full_name: string };
}

export const MOCK_EXPENSES: Expense[] = [
  {
    id: 'exp-001',
    description: 'شراء مواد بناء - حديد تسليح',
    amount: 51750,
    net_amount: 45000,
    vat_amount: 6750,
    includes_vat: true,
    status: 'approved',
    receipt_url: null,
    created_at: '2024-12-15T14:30:00Z',
    approved_at: '2024-12-16T09:00:00Z',
    project_id: 'proj-001',
    user_id: 'mock-user-001',
    gl_code: '6002',
    cost_center: 'cc-002',
    projects: { name: 'برج الرياض التجاري' },
    profiles: { full_name: 'أحمد محمد الغامدي' },
  },
  {
    id: 'exp-002',
    description: 'أجور عمال - ديسمبر 2024',
    amount: 138000,
    net_amount: 120000,
    vat_amount: 18000,
    includes_vat: true,
    status: 'settled',
    receipt_url: null,
    created_at: '2024-12-20T10:00:00Z',
    approved_at: '2024-12-20T12:00:00Z',
    settled_at: '2024-12-21T10:00:00Z',
    project_id: 'proj-001',
    user_id: 'mock-user-001',
    gl_code: '6003',
    cost_center: 'cc-002',
    projects: { name: 'برج الرياض التجاري' },
    profiles: { full_name: 'أحمد محمد الغامدي' },
  },
  {
    id: 'exp-003',
    description: 'معدات كهربائية - لوحات توزيع',
    amount: 32200,
    net_amount: 28000,
    vat_amount: 4200,
    includes_vat: true,
    status: 'pending',
    receipt_url: null,
    created_at: '2024-12-22T11:00:00Z',
    project_id: 'proj-002',
    user_id: 'mock-user-002',
    gl_code: '6004',
    cost_center: 'cc-003',
    projects: { name: 'مجمع الواحة السكني' },
    profiles: { full_name: 'سعد العتيبي' },
  },
  {
    id: 'exp-004',
    description: 'نقل معدات ثقيلة من جدة للدمام',
    amount: 17250,
    net_amount: 15000,
    vat_amount: 2250,
    includes_vat: true,
    status: 'pending',
    receipt_url: null,
    created_at: '2024-12-23T09:00:00Z',
    project_id: 'proj-003',
    user_id: 'mock-user-003',
    gl_code: '6006',
    cost_center: 'cc-004',
    projects: { name: 'مركز الأعمال الدولي' },
    profiles: { full_name: 'خالد السبيعي' },
  },
  {
    id: 'exp-005',
    description: 'استشارات هندسية - تصميم معماري',
    amount: 40250,
    net_amount: 35000,
    vat_amount: 5250,
    includes_vat: true,
    status: 'rejected',
    rejection_reason: 'المبلغ يتجاوز الميزانية المخصصة للاستشارات. يرجى تقديم عروض أسعار بديلة.',
    receipt_url: null,
    created_at: '2024-12-10T16:00:00Z',
    approved_at: '2024-12-11T10:00:00Z',
    project_id: 'proj-002',
    user_id: 'mock-user-001',
    gl_code: '6005',
    cost_center: 'cc-003',
    projects: { name: 'مجمع الواحة السكني' },
    profiles: { full_name: 'أحمد محمد الغامدي' },
  },
  {
    id: 'exp-006',
    description: 'فاتورة كهرباء - موقع البناء',
    amount: 8625,
    net_amount: 7500,
    vat_amount: 1125,
    includes_vat: true,
    status: 'approved',
    receipt_url: null,
    created_at: '2024-12-18T08:00:00Z',
    approved_at: '2024-12-18T14:00:00Z',
    project_id: 'proj-001',
    user_id: 'mock-user-002',
    gl_code: '6007',
    cost_center: 'cc-002',
    projects: { name: 'برج الرياض التجاري' },
    profiles: { full_name: 'سعد العتيبي' },
  },
];

export const MOCK_EMPLOYEES = [
  {
    id: 'mock-user-002',
    full_name: 'سعد العتيبي',
    email: 'saad@company.com',
    role: 'employee' as const,
    wallet_balance: 5000,
  },
  {
    id: 'mock-user-003',
    full_name: 'خالد السبيعي',
    email: 'khaled@company.com',
    role: 'accountant' as const,
    wallet_balance: 3500,
  },
  {
    id: 'mock-user-004',
    full_name: 'محمد القحطاني',
    email: 'mohammed@company.com',
    role: 'employee' as const,
    wallet_balance: 7200,
  },
  {
    id: 'mock-user-005',
    full_name: 'فيصل الدوسري',
    email: 'faisal@company.com',
    role: 'employee' as const,
    wallet_balance: 2800,
  },
];

export const MOCK_TRANSFERS = [
  {
    id: 'trans-001',
    amount: 5000,
    created_at: '2024-12-20T12:00:00Z',
    sender_id: 'mock-user-001',
    receiver_id: 'mock-user-002',
    sender: { full_name: 'أحمد محمد الغامدي' },
    receiver: { full_name: 'سعد العتيبي' },
  },
  {
    id: 'trans-002',
    amount: 3000,
    created_at: '2024-12-18T14:30:00Z',
    sender_id: 'mock-user-001',
    receiver_id: 'mock-user-003',
    sender: { full_name: 'أحمد محمد الغامدي' },
    receiver: { full_name: 'خالد السبيعي' },
  },
  {
    id: 'trans-003',
    amount: 2000,
    created_at: '2024-12-15T09:00:00Z',
    sender_id: 'mock-user-004',
    receiver_id: 'mock-user-001',
    sender: { full_name: 'محمد القحطاني' },
    receiver: { full_name: 'أحمد محمد الغامدي' },
  },
];

// Monthly budget caps by GL code
export const BUDGET_CAPS: Record<string, number> = {
  '6001': 50000,  // Travel
  '6002': 500000, // Materials
  '6003': 200000, // Salaries
  '6004': 100000, // Equipment
  '6005': 75000,  // Consulting
  '6006': 30000,  // Transportation
  '6007': 25000,  // Utilities
  '6008': 40000,  // Maintenance
};

export const MOCK_STATS = {
  totalProjects: MOCK_PROJECTS.length,
  totalExpenses: MOCK_EXPENSES.filter(e => e.status === 'approved' || e.status === 'settled').reduce((sum, e) => sum + e.amount, 0),
  pendingExpenses: MOCK_EXPENSES.filter(e => e.status === 'pending').length,
  totalEmployees: MOCK_EMPLOYEES.length + 1,
  monthlyBudget: 1000000,
  monthlySpent: 248825,
  cashInflow: 750000,
  cashOutflow: 248825,
};

// Monthly expenses data for charts
export const MONTHLY_EXPENSES_DATA = [
  { month: 'يناير', expenses: 145000, budget: 200000 },
  { month: 'فبراير', expenses: 178000, budget: 200000 },
  { month: 'مارس', expenses: 156000, budget: 200000 },
  { month: 'أبريل', expenses: 189000, budget: 200000 },
  { month: 'مايو', expenses: 167000, budget: 200000 },
  { month: 'يونيو', expenses: 248825, budget: 200000 },
];
