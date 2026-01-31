import { useCallback, useEffect, useState } from 'react';
import { createCustodyTransaction, getCustodies, getCustodyTransactions } from '@/adapters/custody.adapter';
import { useCompany } from '@/contexts/CompanyContext';
import { getRoleCapabilities } from '@/lib/capabilities';
import { EmptyState, ErrorState, LoadingState } from '@/ui/new/components/StateViews';
import { formatCurrency, formatDate } from '@/ui/new/utils/format';

type CustodyItem = any;

export default function CustodyListView() {
  const { role } = useCompany();
  const capabilities = getRoleCapabilities(role);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [custodies, setCustodies] = useState<CustodyItem[]>([]);
  const [selected, setSelected] = useState<CustodyItem | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [txType, setTxType] = useState<'ISSUE' | 'SPEND' | 'RETURN' | 'SETTLEMENT'>('ISSUE');
  const [txAmount, setTxAmount] = useState('');
  const [txNotes, setTxNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canManage = capabilities.canManageCustody;

  const loadCustodies = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCustodies();
      setCustodies(data || []);
      if (data?.length && !selected) {
        setSelected(data[0]);
      }
    } catch (err: any) {
      setError(err?.message || 'تعذر تحميل العهد');
    } finally {
      setLoading(false);
    }
  }, [selected]);

  const loadTransactions = useCallback(async () => {
    if (!selected) return;
    try {
      const data = await getCustodyTransactions(selected.id);
      setTransactions(data || []);
    } catch (err: any) {
      setError(err?.message || 'تعذر تحميل العمليات');
    }
  }, [selected]);

  useEffect(() => {
    if (capabilities.canViewCustody) {
      loadCustodies();
    }
  }, [capabilities.canViewCustody, loadCustodies]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const handleTransaction = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selected) return;
    const amount = Number(txAmount);
    if (!amount || amount <= 0) {
      setError('يرجى إدخال مبلغ صحيح');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await createCustodyTransaction({
        custody_id: selected.id,
        type: txType,
        amount,
        notes: txNotes || undefined,
      });
      setTxAmount('');
      setTxNotes('');
      await loadCustodies();
      await loadTransactions();
    } catch (err: any) {
      setError(err?.message || 'تعذر تنفيذ العملية');
    } finally {
      setSubmitting(false);
    }
  };

  if (!capabilities.canViewCustody) {
    return <EmptyState title="لا يوجد صلاحية" description="لا تملك صلاحية الوصول إلى العهد حالياً." />;
  }

  if (loading) {
    return <LoadingState rows={4} />;
  }

  if (error && custodies.length === 0) {
    return <ErrorState title="تعذر تحميل العهد" description={error} onRetry={loadCustodies} />;
  }

  if (custodies.length === 0) {
    return <EmptyState title="لا توجد عهد" description="لم يتم العثور على عهد نشطة حالياً." />;
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">العهدة</h1>
        <p className="text-xs text-slate-500">متابعة أرصدة العهد والمعاملات الأخيرة.</p>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2">
        {custodies.map((custody) => (
          <button
            key={custody.id}
            type="button"
            onClick={() => setSelected(custody)}
            className={`min-w-[180px] rounded-2xl border p-4 text-right shadow-sm ${
              selected?.id === custody.id ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white'
            }`}
          >
            <p className="text-sm font-semibold">{custody.employee?.full_name || custody.name}</p>
            <p className="mt-2 text-xs opacity-80">الرصيد الحالي</p>
            <p className="text-base font-semibold">{formatCurrency(custody.current_balance || 0)}</p>
          </button>
        ))}
      </div>

      {selected && (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">{selected.employee?.full_name || selected.name}</p>
              <p className="text-xs text-slate-400">الرصيد: {formatCurrency(selected.current_balance || 0)}</p>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <h3 className="text-sm font-semibold text-slate-900">آخر العمليات</h3>
            {transactions.length === 0 ? (
              <EmptyState title="لا توجد عمليات" description="لا توجد حركات لهذه العهدة." />
            ) : (
              <div className="space-y-2">
                {transactions.slice(0, 5).map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-3">
                    <div>
                      <p className="text-xs font-semibold text-slate-900">{tx.type || tx.tx_type}</p>
                      <p className="text-[11px] text-slate-400">{formatDate(tx.tx_date || tx.created_at)}</p>
                    </div>
                    <span className="text-xs font-semibold text-slate-900">{formatCurrency(tx.amount || 0)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {canManage && selected && (
        <form onSubmit={handleTransaction} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900">إضافة معاملة</h3>
          <div className="mt-4 space-y-3">
            <div className="flex flex-wrap gap-2">
              {(['ISSUE', 'SPEND', 'RETURN', 'SETTLEMENT'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setTxType(type)}
                  className={`rounded-full px-3 py-1 text-xs ${
                    txType === type ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
            <input
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm"
              type="number"
              min="0"
              step="0.01"
              placeholder="المبلغ"
              value={txAmount}
              onChange={(event) => setTxAmount(event.target.value)}
            />
            <input
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm"
              placeholder="ملاحظات"
              value={txNotes}
              onChange={(event) => setTxNotes(event.target.value)}
            />
            {error && <p className="text-xs text-rose-600">{error}</p>}
            <button
              type="submit"
              className="w-full rounded-2xl bg-slate-900 py-2 text-xs font-medium text-white disabled:opacity-50"
              disabled={submitting}
            >
              {submitting ? 'جاري الإرسال...' : 'تنفيذ العملية'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
