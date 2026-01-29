// =====================================================
// MULTI-TENANT DEMO DATA
// Simulates complete tenant isolation
// =====================================================

import type { Expense, ExpenseStatus } from './mockData';

// =====================================================
// COMPANIES (TENANTS)
// =====================================================

export interface Company {
  id: string;
  name: string;
  name_ar: string;
  logo?: string;
  vat_rate: number;
  currency: string;
  country: string;
}

export const DEMO_COMPANIES: Company[] = [
  {
    id: 'company-saudi-co',
    name: 'Saudi Construction Co.',
    name_ar: 'شركة البناء السعودية',
    vat_rate: 15,
    currency: 'SAR',
    country: 'SA',
  },
  {
    id: 'company-global-tech',
    name: 'Global Tech Solutions',
    name_ar: 'حلول التقنية العالمية',
    vat_rate: 15,
    currency: 'SAR',
    country: 'SA',
  },
];

// =====================================================
// COMPANY-SPECIFIC PROFILES
// =====================================================

export interface TenantProfile {
  id: string;
  company_id: string;
  full_name: string;
  email: string;
  role: 'company_owner' | 'finance_manager' | 'accountant' | 'employee';
  wallet_balance: number;
}

export const TENANT_PROFILES: Record<string, TenantProfile> = {
  'company-saudi-co': {
    id: 'user-saudi-001',
    company_id: 'company-saudi-co',
    full_name: 'أحمد محمد الغامدي',
    email: 'ahmed@saudico.com',
    role: 'finance_manager',
    wallet_balance: 45000,
  },
  'company-global-tech': {
    id: 'user-global-001',
    company_id: 'company-global-tech',
    full_name: 'Sarah Johnson',
    email: 'sarah@globaltech.com',
    role: 'company_owner',
    wallet_balance: 120000,
  },
};

// =====================================================
// COMPANY-SPECIFIC PROJECTS
// =====================================================

export interface TenantProject {
  id: string;
  company_id: string;
  name: string;
  budget: number;
  spent: number;
  location: string;
}

export const TENANT_PROJECTS: Record<string, TenantProject[]> = {
  'company-saudi-co': [
    {
      id: 'proj-saudi-001',
      company_id: 'company-saudi-co',
      name: 'برج الرياض التجاري',
      budget: 5000000,
      spent: 3500000,
      location: 'الرياض',
    },
    {
      id: 'proj-saudi-002',
      company_id: 'company-saudi-co',
      name: 'مجمع الواحة السكني',
      budget: 8000000,
      spent: 2400000,
      location: 'جدة',
    },
    {
      id: 'proj-saudi-003',
      company_id: 'company-saudi-co',
      name: 'مركز الأعمال الدولي',
      budget: 3000000,
      spent: 2700000,
      location: 'الدمام',
    },
  ],
  'company-global-tech': [
    {
      id: 'proj-global-001',
      company_id: 'company-global-tech',
      name: 'Cloud Infrastructure Upgrade',
      budget: 2000000,
      spent: 850000,
      location: 'Riyadh HQ',
    },
    {
      id: 'proj-global-002',
      company_id: 'company-global-tech',
      name: 'Mobile App Development',
      budget: 1500000,
      spent: 600000,
      location: 'Dubai Office',
    },
  ],
};

// =====================================================
// COMPANY-SPECIFIC EXPENSES
// =====================================================

export const TENANT_EXPENSES: Record<string, Expense[]> = {
  'company-saudi-co': [
    {
      id: 'exp-saudi-001',
      description: 'شراء مواد بناء - حديد تسليح',
      amount: 51750,
      net_amount: 45000,
      vat_amount: 6750,
      includes_vat: true,
      status: 'approved' as ExpenseStatus,
      receipt_url: null,
      created_at: '2024-12-15T14:30:00Z',
      approved_at: '2024-12-16T09:00:00Z',
      project_id: 'proj-saudi-001',
      user_id: 'user-saudi-001',
      gl_code: '6002',
      cost_center: 'cc-002',
      projects: { name: 'برج الرياض التجاري' },
      profiles: { full_name: 'أحمد محمد الغامدي' },
    },
    {
      id: 'exp-saudi-002',
      description: 'أجور عمال - ديسمبر 2024',
      amount: 138000,
      net_amount: 120000,
      vat_amount: 18000,
      includes_vat: true,
      status: 'settled' as ExpenseStatus,
      receipt_url: null,
      created_at: '2024-12-20T10:00:00Z',
      approved_at: '2024-12-20T12:00:00Z',
      settled_at: '2024-12-21T10:00:00Z',
      project_id: 'proj-saudi-001',
      user_id: 'user-saudi-001',
      gl_code: '6003',
      cost_center: 'cc-002',
      projects: { name: 'برج الرياض التجاري' },
      profiles: { full_name: 'أحمد محمد الغامدي' },
    },
    {
      id: 'exp-saudi-003',
      description: 'معدات كهربائية - لوحات توزيع',
      amount: 32200,
      net_amount: 28000,
      vat_amount: 4200,
      includes_vat: true,
      status: 'pending' as ExpenseStatus,
      receipt_url: null,
      created_at: '2024-12-22T11:00:00Z',
      project_id: 'proj-saudi-002',
      user_id: 'user-saudi-002',
      gl_code: '6004',
      cost_center: 'cc-003',
      projects: { name: 'مجمع الواحة السكني' },
      profiles: { full_name: 'سعد العتيبي' },
    },
    {
      id: 'exp-saudi-004',
      description: 'نقل معدات ثقيلة من جدة للدمام',
      amount: 17250,
      net_amount: 15000,
      vat_amount: 2250,
      includes_vat: true,
      status: 'pending' as ExpenseStatus,
      receipt_url: null,
      created_at: '2024-12-23T09:00:00Z',
      project_id: 'proj-saudi-003',
      user_id: 'user-saudi-003',
      gl_code: '6006',
      cost_center: 'cc-004',
      projects: { name: 'مركز الأعمال الدولي' },
      profiles: { full_name: 'خالد السبيعي' },
    },
  ],
  'company-global-tech': [
    {
      id: 'exp-global-001',
      description: 'AWS Cloud Services - Monthly',
      amount: 85000,
      net_amount: 73913,
      vat_amount: 11087,
      includes_vat: true,
      status: 'approved' as ExpenseStatus,
      receipt_url: null,
      created_at: '2024-12-01T10:00:00Z',
      approved_at: '2024-12-02T09:00:00Z',
      project_id: 'proj-global-001',
      user_id: 'user-global-001',
      gl_code: '6007',
      cost_center: 'cc-001',
      projects: { name: 'Cloud Infrastructure Upgrade' },
      profiles: { full_name: 'Sarah Johnson' },
    },
    {
      id: 'exp-global-002',
      description: 'Software Licenses - Annual',
      amount: 125000,
      net_amount: 108696,
      vat_amount: 16304,
      includes_vat: true,
      status: 'settled' as ExpenseStatus,
      receipt_url: null,
      created_at: '2024-11-15T14:00:00Z',
      approved_at: '2024-11-16T10:00:00Z',
      settled_at: '2024-11-17T12:00:00Z',
      project_id: 'proj-global-001',
      user_id: 'user-global-001',
      gl_code: '6004',
      cost_center: 'cc-001',
      projects: { name: 'Cloud Infrastructure Upgrade' },
      profiles: { full_name: 'Sarah Johnson' },
    },
    {
      id: 'exp-global-003',
      description: 'UI/UX Design Consultation',
      amount: 45000,
      net_amount: 39130,
      vat_amount: 5870,
      includes_vat: true,
      status: 'pending' as ExpenseStatus,
      receipt_url: null,
      created_at: '2024-12-20T16:00:00Z',
      project_id: 'proj-global-002',
      user_id: 'user-global-002',
      gl_code: '6005',
      cost_center: 'cc-002',
      projects: { name: 'Mobile App Development' },
      profiles: { full_name: 'Mohammed Ali' },
    },
  ],
};

// =====================================================
// COMPANY-SPECIFIC STATS
// =====================================================

export const TENANT_STATS: Record<string, {
  totalProjects: number;
  totalExpenses: number;
  pendingExpenses: number;
  totalEmployees: number;
  monthlyBudget: number;
  monthlySpent: number;
  cashInflow: number;
  cashOutflow: number;
}> = {
  'company-saudi-co': {
    totalProjects: 3,
    totalExpenses: 189750,
    pendingExpenses: 2,
    totalEmployees: 45,
    monthlyBudget: 1000000,
    monthlySpent: 248825,
    cashInflow: 750000,
    cashOutflow: 248825,
  },
  'company-global-tech': {
    totalProjects: 2,
    totalExpenses: 210000,
    pendingExpenses: 1,
    totalEmployees: 28,
    monthlyBudget: 500000,
    monthlySpent: 255000,
    cashInflow: 1200000,
    cashOutflow: 255000,
  },
};

// =====================================================
// MONTHLY CHART DATA PER COMPANY
// =====================================================

export const TENANT_MONTHLY_DATA: Record<string, { month: string; expenses: number; budget: number }[]> = {
  'company-saudi-co': [
    { month: 'يناير', expenses: 145000, budget: 200000 },
    { month: 'فبراير', expenses: 178000, budget: 200000 },
    { month: 'مارس', expenses: 156000, budget: 200000 },
    { month: 'أبريل', expenses: 189000, budget: 200000 },
    { month: 'مايو', expenses: 167000, budget: 200000 },
    { month: 'يونيو', expenses: 248825, budget: 200000 },
  ],
  'company-global-tech': [
    { month: 'Jan', expenses: 85000, budget: 100000 },
    { month: 'Feb', expenses: 92000, budget: 100000 },
    { month: 'Mar', expenses: 78000, budget: 100000 },
    { month: 'Apr', expenses: 105000, budget: 100000 },
    { month: 'May', expenses: 88000, budget: 100000 },
    { month: 'Jun', expenses: 95000, budget: 100000 },
  ],
};
