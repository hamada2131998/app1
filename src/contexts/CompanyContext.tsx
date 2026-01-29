// src/contexts/CompanyContext.tsx
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "../integrations/supabase/client";

type UserRole = "OWNER" | "ACCOUNTANT" | "EMPLOYEE" | string;

type CompanyState = {
  company_id: string | null;
  branch_id: string | null; // IMPORTANT: optional for OWNER
  role: UserRole | null;
};

type CompanyContextValue = CompanyState & {
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  clearError: () => void;
};

const CompanyContext = createContext<CompanyContextValue | undefined>(undefined);

export function useCompany() {
  const ctx = useContext(CompanyContext);
  if (!ctx) throw new Error("useCompany must be used within CompanyProvider");
  return ctx;
}

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const [company, setCompany] = useState<CompanyState>({
    company_id: null,
    branch_id: null,
    role: null,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const fetchUserRole = useCallback(async () => {
    setLoading(true);
    setError(null);

    // 1) Get current session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error("[CompanyContext] Session error:", sessionError);
      setCompany({ company_id: null, branch_id: null, role: null });
      setError("فشل في قراءة جلسة الدخول");
      setLoading(false);
      return;
    }

    const session = sessionData?.session;
    const user = session?.user;

    if (!user) {
      // Not logged in
      setCompany({ company_id: null, branch_id: null, role: null });
      setLoading(false);
      return;
    }

    const userId = user.id;

    // 2) Query user_roles
    // NOTE:
    // - We do NOT require branch_id here.
    // - We pick latest row by created_at desc.
    const { data: roles, error: rolesError, status } = await supabase
      .from("user_roles")
      .select("user_id, company_id, role, branch_id, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1);

    if (rolesError) {
      console.error("[CompanyContext] user_roles query error:", { status, rolesError });

      // Typical when RLS blocks or policies misconfigured
      setCompany({ company_id: null, branch_id: null, role: null });
      setError("خطأ في الصلاحيات: فشل في جلب صلاحيات المستخدم");
      setLoading(false);
      return;
    }

    const row = roles?.[0];

    if (!row?.company_id || !row?.role) {
      console.warn("[CompanyContext] No role row found for user:", userId, roles);
      setCompany({ company_id: null, branch_id: null, role: null });
      setError("خطأ في الصلاحيات: لا توجد صلاحيات مخصصة لهذا المستخدم");
      setLoading(false);
      return;
    }

    // ✅ FIX: branch_id is OPTIONAL (especially for OWNER)
    setCompany({
      company_id: row.company_id ?? null,
      branch_id: row.branch_id ?? null,
      role: row.role ?? null,
    });

    setLoading(false);
  }, []);

  // Refresh helper
  const refresh = useCallback(async () => {
    await fetchUserRole();
  }, [fetchUserRole]);

  // Fetch once + on auth changes
  useEffect(() => {
    fetchUserRole();

    const { data: sub } = supabase.auth.onAuthStateChange((_event) => {
      // whenever auth changes, refresh roles
      fetchUserRole();
    });

    return () => {
      sub?.subscription?.unsubscribe();
    };
  }, [fetchUserRole]);

  const value = useMemo<CompanyContextValue>(
    () => ({
      company_id: company.company_id,
      branch_id: company.branch_id,
      role: company.role,
      loading,
      error,
      refresh,
      clearError,
    }),
    [company, loading, error, refresh, clearError]
  );

  return <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>;
}
