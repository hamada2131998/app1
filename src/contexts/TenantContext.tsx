// =====================================================
// TENANT CONTEXT - MULTI-TENANCY SIMULATION
// Manages company switching and tenant-specific data
// =====================================================

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  DEMO_COMPANIES, 
  TENANT_PROFILES,
  TENANT_PROJECTS,
  TENANT_EXPENSES,
  TENANT_STATS,
  TENANT_MONTHLY_DATA,
  type Company,
  type TenantProfile,
  type TenantProject,
} from '@/data/multiTenantData';
import type { Expense } from '@/data/mockData';

interface TenantContextType {
  currentCompany: Company;
  companies: Company[];
  profile: TenantProfile;
  projects: TenantProject[];
  expenses: Expense[];
  stats: typeof TENANT_STATS[string];
  monthlyData: typeof TENANT_MONTHLY_DATA[string];
  switchCompany: (companyId: string) => void;
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
  isLoading: boolean;
}

const STORAGE_KEY = 'demo_current_company';

const TenantContext = createContext<TenantContextType | null>(null);

export function TenantProvider({ children }: { children: ReactNode }) {
  const [currentCompanyId, setCurrentCompanyId] = useState<string>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored || DEMO_COMPANIES[0].id;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  const currentCompany = DEMO_COMPANIES.find(c => c.id === currentCompanyId) || DEMO_COMPANIES[0];
  const profile = TENANT_PROFILES[currentCompanyId] || TENANT_PROFILES[DEMO_COMPANIES[0].id];
  const projects = TENANT_PROJECTS[currentCompanyId] || [];
  const stats = TENANT_STATS[currentCompanyId] || TENANT_STATS[DEMO_COMPANIES[0].id];
  const monthlyData = TENANT_MONTHLY_DATA[currentCompanyId] || [];

  // Load tenant-specific expenses when company changes
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setExpenses([...(TENANT_EXPENSES[currentCompanyId] || [])]);
      setIsLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [currentCompanyId]);

  const switchCompany = (companyId: string) => {
    if (companyId === currentCompanyId) return;
    
    setIsLoading(true);
    localStorage.setItem(STORAGE_KEY, companyId);
    setCurrentCompanyId(companyId);
  };

  return (
    <TenantContext.Provider
      value={{
        currentCompany,
        companies: DEMO_COMPANIES,
        profile,
        projects,
        expenses,
        stats,
        monthlyData,
        switchCompany,
        setExpenses,
        isLoading,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}
