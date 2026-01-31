import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpLeft, Banknote, Clock, PlusCircle, Wallet } from 'lucide-react';
import { getDashboardData } from '@/adapters/dashboard.adapter';
import { listExpenses } from '@/adapters/expenses.adapter';
import { listPendingApprovals } from '@/adapters/approvals.adapter';
import { useCompany } from '@/contexts/CompanyContext';
import { getRoleCapabilities } from '@/lib/capabilities';
import { formatCurrency, formatDate } from '@/ui/new/utils/format';
import { EmptyState, ErrorState, LoadingState } from '@/ui/new/components/StateViews';
import { useSetupStatus } from '@/ui/new/hooks/useSetupStatus';

type PendingItem = {
  id: string;
  amount?: number;
  movement_date?: string;
  creator?: { full_name?: string | null };
};

export default function DashboardView() {
  const { company_id, branch_id, role } = useCompany();
  const capabilities = getRoleCapabilities(role);
  const { status: setupStatus } = useSetupStatus(company_id);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{ totalIn: number; totalOut: number; net: number; pendingCount: number } | null>(null);
  const [recentExpenses, setRecentExpenses] = useState<any[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<PendingItem[]>([]);
  const [showSetupBanner, setShowSetupBanner] = useState(false);

  const canSeeApprovals = capabilities.canViewApprovals;

  useEffect(() => {
    const flag = localStorage.getItem('saitara.setup.completed');
    if (flag) {
      setShowSetupBanner(true);
    }
  }, []);

  const loadData = useCallback(async () => {
    if (!company_id) return;
    setLoading(true);
    setError(null);
    try {
      const [statsData, expensesData, approvalsData] = await Promise.all([
        getDashboardData({ company_id, branch_id }),
        listExpenses({ company_id, branch_id, limit: 4 }),
        canSeeApprovals ? listPendingApprovals() : Promise.resolve([]),
      ]);
      setStats(statsData);
      setRecentExpenses(expensesData || []);
      setPendingApprovals((approvalsData || []) as PendingItem[]);
    } catch (err: any) {
      setError(err?.message || 'تعذر تحميل بيانات اللوحة');
    } finally {
      setLoading(false);
    }
  }, [branch_id, canSeeApprovals, company_id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const kpi = useMemo(() => {
    if (!stats) return { label: 'الرصيد الصافي', value: 0 };
    return { label: 'الرصيد الصافي', value: stats.net };
  }, [stats]);

  const isEmpty = stats && stats.totalIn === 0 && stats.totalOut === 0 && recentExpenses.length === 0 && pendingApprovals.length === 0;

  if (loading) {
    return (
      <div className="space-y-4">
        <LoadingState rows={2} />
        <LoadingState rows={3} />
      </div>
    );
  }

  if (error) {
    return <ErrorState title="تعذر تحميل البيانات" description={error} onRetry={loadData} />;
  }

  if (isEmpty) {
    const showSetupAction = capabilities.isOwner && !setupStatus?.setup_completed;
    const canCreateExpense = capabilities.canCreateExpenses;
    const actionLabel = showSetupAction
      ? 'أكمل إعداد النظام'
      : canCreateExpense
        ? 'إنشاء مصروف'
        : undefined;

    return (
      <EmptyState
        title="ابدأ أول حركة مالية"
        description="لم يتم العثور على حركات حتى الآن. أضف مصروفاً أو عهدة لبدء المتابعة."
        actionLabel={actionLabel}
        onAction={
          actionLabel
            ? () => window.location.assign(showSetupAction ? '/app/setup' : '/app/expenses/new')
            : undefined
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      {showSetupBanner && (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold">تم تجهيز النظام</p>
              <p className="text-xs text-emerald-600">أصبح بإمكانك إدارة المصروفات والعهد بسهولة.</p>
            </div>
            <button
              type="button"
              className="rounded-full border border-emerald-200 px-3 py-1 text-[11px] font-medium text-emerald-700"
              onClick={() => {
                localStorage.removeItem('saitara.setup.completed');
                setShowSetupBanner(false);
              }}
            >
              تم
            </button>
          </div>
        </div>
      )}

      <div className="rounded-3xl bg-slate-900 p-6 text-white shadow-lg">
        <p className="text-sm text-slate-300">{kpi.label}</p>
        <h1 className="mt-3 text-3xl font-semibold">{formatCurrency(kpi.value)}</h1>
        <div className="mt-4 flex gap-3 text-xs text-slate-300">
          <span className="inline-flex items-center gap-1">
            <Banknote className="h-4 w-4" /> إجمالي الداخل: {formatCurrency(stats?.totalIn ?? 0)}
          </span>
          <span className="inline-flex items-center gap-1">
            <ArrowUpLeft className="h-4 w-4" /> إجمالي الخارج: {formatCurrency(stats?.totalOut ?? 0)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-400">الحركات المعلقة</p>
          <p className="mt-2 text-xl font-semibold text-slate-900">{stats?.pendingCount ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-400">إجمالي المصروفات</p>
          <p className="mt-2 text-xl font-semibold text-slate-900">{formatCurrency(stats?.totalOut ?? 0)}</p>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">إجراءات سريعة</h2>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {capabilities.canCreateExpenses && (
            <Link className="flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-3 py-3 text-sm text-white" to="/app/expenses/new">
              <PlusCircle className="h-4 w-4" />
              إنشاء مصروف
            </Link>
          )}
          {capabilities.canViewCustody && (
            <Link className="flex items-center justify-center gap-2 rounded-2xl bg-slate-100 px-3 py-3 text-sm text-slate-700" to="/app/custody">
              <Wallet className="h-4 w-4" />
              إدارة العهدة
            </Link>
          )}
          {capabilities.canViewApprovals && (
            <Link className="flex items-center justify-center gap-2 rounded-2xl bg-slate-100 px-3 py-3 text-sm text-slate-700" to="/app/approvals">
              <Clock className="h-4 w-4" />
              قائمة الموافقات
            </Link>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-900">أحدث المصروفات</h3>
        {recentExpenses.length === 0 ? (
          <EmptyState title="لا توجد مصروفات" description="لم يتم تسجيل أي مصروف حديثاً." />
        ) : (
          <div className="space-y-3">
            {recentExpenses.map((expense) => (
              <div key={expense.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{expense.notes || 'مصروف'}</p>
                    <p className="text-xs text-slate-400">{formatDate(expense.movement_date)}</p>
                  </div>
                  <span className="text-sm font-semibold text-slate-900">{formatCurrency(expense.amount || 0)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {canSeeApprovals && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-900">بانتظار الموافقة</h3>
          {pendingApprovals.length === 0 ? (
            <EmptyState title="لا توجد طلبات" description="لا يوجد طلبات موافقة حالياً." />
          ) : (
            <div className="space-y-3">
              {pendingApprovals.slice(0, 3).map((item) => (
                <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">طلب موافقة</p>
                      <p className="text-xs text-slate-400">{item.creator?.full_name || 'موظف'}</p>
                    </div>
                    <span className="text-sm font-semibold text-slate-900">{formatCurrency(item.amount ?? 0)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
