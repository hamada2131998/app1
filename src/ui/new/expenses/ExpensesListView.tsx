import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { listExpenses } from '@/adapters/expenses.adapter';
import type { MovementStatus } from '@/types/db';
import { useCompany } from '@/contexts/CompanyContext';
import { getRoleCapabilities } from '@/lib/capabilities';
import { EmptyState, ErrorState, LoadingState } from '@/ui/new/components/StateViews';
import { useSetupStatus } from '@/ui/new/hooks/useSetupStatus';
import { formatCurrency, formatDate } from '@/ui/new/utils/format';

const statusOptions: Array<{ value: 'ALL' | MovementStatus; label: string }> = [
  { value: 'ALL', label: 'الكل' },
  { value: 'DRAFT', label: 'مسودة' },
  { value: 'SUBMITTED', label: 'مرسلة' },
  { value: 'APPROVED', label: 'معتمدة' },
  { value: 'REJECTED', label: 'مرفوضة' },
];

export default function ExpensesListView() {
  const { company_id, branch_id, role } = useCompany();
  const capabilities = getRoleCapabilities(role);
  const { status: setupStatus } = useSetupStatus(company_id);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<'ALL' | MovementStatus>('ALL');
  const [search, setSearch] = useState('');

  const loadData = useCallback(async () => {
    if (!company_id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await listExpenses({
        company_id,
        branch_id,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        limit: 40,
      });
      setRows(data || []);
    } catch (err: any) {
      setError(err?.message || 'تعذر تحميل المصروفات');
    } finally {
      setLoading(false);
    }
  }, [branch_id, company_id, statusFilter]);

  useEffect(() => {
    if (capabilities.canViewExpenses) {
      loadData();
    }
  }, [capabilities.canViewExpenses, loadData]);

  const filteredRows = useMemo(() => {
    const term = search.trim();
    if (!term) return rows;
    return rows.filter((row) =>
      [row.notes, row.reference, row.payment_method].some((value: string | null) => (value || '').includes(term))
    );
  }, [rows, search]);

  if (!capabilities.canViewExpenses) {
    return <EmptyState title="لا يوجد صلاحية" description="لا تملك صلاحية الاطلاع على المصروفات حالياً." />;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">المصروفات</h1>
          <p className="text-xs text-slate-500">متابعة المصروفات والحركات الأخيرة</p>
        </div>
        {capabilities.canCreateExpenses && (
          <Link className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-xs font-medium text-white" to="/app/expenses/new">
            <Plus className="h-4 w-4" />
            مصروف جديد
          </Link>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <input
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none"
          placeholder="ابحث بالوصف أو المرجع"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          {statusOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setStatusFilter(option.value)}
              className={`rounded-full px-3 py-1 text-xs ${
                statusFilter === option.value ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <LoadingState rows={4} />
      ) : error ? (
        <ErrorState title="تعذر تحميل المصروفات" description={error} onRetry={loadData} />
      ) : filteredRows.length === 0 ? (
        <EmptyState
          title="لا توجد مصروفات"
          description="لم يتم العثور على مصروفات بهذا الفلتر."
          actionLabel={
            capabilities.isOwner && (!setupStatus?.has_account || !setupStatus?.has_category)
              ? 'أكمل إعداد النظام'
              : undefined
          }
          onAction={
            capabilities.isOwner && (!setupStatus?.has_account || !setupStatus?.has_category)
              ? () => window.location.assign('/app/setup')
              : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          {filteredRows.map((row) => (
            <div key={row.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{row.notes || 'مصروف'}</p>
                  <p className="text-xs text-slate-400">{formatDate(row.movement_date)}</p>
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-slate-900">{formatCurrency(row.amount || 0)}</p>
                  <p className="text-[11px] text-slate-400">{row.status}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
