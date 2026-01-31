import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AppProvider } from "@/contexts/AppContext";
import { CompanyProvider, useCompany } from "@/contexts/CompanyContext";
import { ThemeProvider } from "@/hooks/use-theme";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import ProjectsNew from "./pages/ProjectsNew";
import ExpensesNew from "./pages/ExpensesNew";
import WalletNew from "./pages/WalletNew";
import Settings from "./pages/Settings";
import Reports from "./pages/Reports";
import SystemLogs from "./pages/SystemLogs";
import TeamNew from "./pages/TeamNew";
import NotFound from "./pages/NotFound";
import { USE_NEW_MOBILE_UI } from "@/ui/new/featureFlags";
import { AppShell } from "@/ui/new/layout/AppShell";
import DashboardView from "@/ui/new/dashboard/DashboardView";
import ExpensesListView from "@/ui/new/expenses/ExpensesListView";
import ExpenseCreateView from "@/ui/new/expenses/ExpenseCreateView";
import CustodyListView from "@/ui/new/custody/CustodyListView";
import ApprovalsQueueView from "@/ui/new/approvals/ApprovalsQueueView";
import SettingsHomeView from "@/ui/new/settings/SettingsHomeView";

const queryClient = new QueryClient();

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        <span className="text-muted-foreground font-medium">جاري التحميل...</span>
      </div>
    </div>
  );
}

function AppShellFallback() {
  return (
    <div className="rounded-2xl border border-dashed border-muted-foreground/40 bg-white p-8 text-center text-slate-700 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">هذه الصفحة غير متوفرة</h2>
      <p className="mt-2 text-sm text-slate-600">يرجى اختيار صفحة من القائمة بالأسفل.</p>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { isLoading: companyLoading, error: companyError } = useCompany();
  
  // Wait for both auth and company context to load
  if (authLoading || companyLoading) {
    return <LoadingScreen />;
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Show error if company context failed (no roles assigned)
  if (companyError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-16 h-16 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="text-xl font-semibold text-foreground">خطأ في الصلاحيات</h2>
          <p className="text-muted-foreground">{companyError}</p>
          <p className="text-sm text-muted-foreground">
            يرجى التواصل مع مدير النظام لتعيين صلاحياتك
          </p>
        </div>
      </div>
    );
  }
  
  return <>{children}</>;
}

function AppRoutes() {
  const { user, loading: authLoading } = useAuth();
  const { isLoading: companyLoading } = useCompany();
  const useNewUi = USE_NEW_MOBILE_UI;

  // Show loading state while auth OR company context is loading
  if (authLoading || companyLoading) {
    return <LoadingScreen />;
  }

  return (
    <Routes>
      <Route path="/auth" element={user ? <Navigate to="/dashboard" replace /> : <Auth />} />
      {useNewUi ? (
        <>
          <Route path="/" element={<Navigate to="/app/dashboard" replace />} />
          <Route path="/dashboard" element={<Navigate to="/app/dashboard" replace />} />
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<DashboardView />} />
            <Route path="expenses" element={<ExpensesListView />} />
            <Route path="expenses/new" element={<ExpenseCreateView />} />
            <Route path="custody" element={<CustodyListView />} />
            <Route path="approvals" element={<ApprovalsQueueView />} />
            <Route path="settings" element={<SettingsHomeView />} />
            <Route path="*" element={<AppShellFallback />} />
          </Route>
        </>
      ) : (
        <>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/projects" element={<ProtectedRoute><ProjectsNew /></ProtectedRoute>} />
          <Route path="/expenses" element={<ProtectedRoute><ExpensesNew /></ProtectedRoute>} />
          <Route path="/wallet" element={<ProtectedRoute><WalletNew /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/system-logs" element={<ProtectedRoute><SystemLogs /></ProtectedRoute>} />
          <Route path="/team" element={<ProtectedRoute><TeamNew /></ProtectedRoute>} />
        </>
      )}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <ThemeProvider>
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <CompanyProvider>
                <AppRoutes />
              </CompanyProvider>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </AppProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
