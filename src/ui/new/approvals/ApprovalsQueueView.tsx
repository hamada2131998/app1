import { useCallback, useEffect, useState } from 'react';
import { actOnApproval, listPendingApprovals } from '@/adapters/approvals.adapter';
import { useCompany } from '@/contexts/CompanyContext';
import { getRoleCapabilities } from '@/lib/capabilities';
import { EmptyState, ErrorState, LoadingState } from '@/ui/new/components/StateViews';
import { formatCurrency, formatDate } from '@/ui/new/utils/format';

export default function ApprovalsQueueView() {
  const { company_id, role } = useCompany();
  const capabilities = getRoleCapabilities(role);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<any[]>([]);
  const canSeeApprovals = capabilities.canViewApprovals;

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listPendingApprovals(company_id ?? undefined);
      setRows(data || []);
    } catch (err: any) {
      setError(err?.message || 'تعذر تحميل الموافقات');
    } finally {
      setLoading(false);
    }
  }, [company_id]);

  useEffect(() => {
    if (!canSeeApprovals) {
      setLoading(false);
      return;
    }
    loadData();
  }, [canSeeApprovals, loadData]);

  const handleAction = async (id: string, action: 'APPROVED' | 'REJECTED') => {
    const confirm = window.confirm(action === 'APPROVED' ? 'هل تريد اعتماد الطلب؟' : 'هل تريد رفض الطلب؟');
    if (!confirm) return;
    try {
      await actOnApproval(id, action);
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'تعذر تنفيذ الإجراء');
    }
  };

  if (!canSeeApprovals) {
    return <EmptyState title="لا يوجد صلاحية" description="لا تملك صلاحية الوصول إلى الموافقات حالياً." />;
  }

  if (loading) {
    return <LoadingState rows={4} />;
  }

  if (error) {
    return <ErrorState title="تعذر تحميل الموافقات" description={error} onRetry={loadData} />;
  }

  if (rows.length === 0) {
    return <EmptyState title="لا توجد طلبات" description="قائمة الموافقات فارغة حالياً." />;
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">الموافقات</h1>
        <p className="text-xs text-slate-500">طلبات الصرف المعلقة بانتظار الاعتماد.</p>
      </div>

      <div className="space-y-3">
        {rows.map((row) => (
          <div key={row.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">{row.notes || 'طلب صرف'}</p>
                <p className="text-xs text-slate-400">{formatDate(row.movement_date || row.created_at)}</p>
              </div>
              <span className="text-sm font-semibold text-slate-900">{formatCurrency(row.amount || 0)}</span>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => handleAction(row.id, 'APPROVED')}
                className="flex-1 rounded-full bg-emerald-600 py-2 text-xs font-medium text-white"
              >
                اعتماد
              </button>
              <button
                type="button"
                onClick={() => handleAction(row.id, 'REJECTED')}
                className="flex-1 rounded-full bg-rose-600 py-2 text-xs font-medium text-white"
              >
                رفض
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
