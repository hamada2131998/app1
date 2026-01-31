import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createExpense, listExpenseAccounts, listExpenseCategories } from '@/adapters/expenses.adapter';
import { useCompany } from '@/contexts/CompanyContext';
import { getRoleCapabilities } from '@/lib/capabilities';
import type { CashAccountRow, CategoryRow } from '@/types/db';
import { EmptyState, ErrorState, LoadingState } from '@/ui/new/components/StateViews';

export default function ExpenseCreateView() {
  const { company_id, branch_id, role } = useCompany();
  const capabilities = getRoleCapabilities(role);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<CashAccountRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    amount: '',
    notes: '',
    account_id: '',
    category_id: '',
    movement_date: new Date().toISOString().slice(0, 10),
  });

  const loadData = useCallback(async () => {
    if (!company_id) return;
    setLoading(true);
    setError(null);
    try {
      const [accountsData, categoriesData] = await Promise.all([
        listExpenseAccounts({ company_id, branch_id, activeOnly: true }),
        listExpenseCategories(company_id, 'OUT'),
      ]);
      setAccounts(accountsData || []);
      setCategories(categoriesData || []);
      setForm((prev) => ({
        ...prev,
        account_id: accountsData?.[0]?.id || prev.account_id,
        category_id: categoriesData?.[0]?.id || prev.category_id,
      }));
    } catch (err: any) {
      setError(err?.message || 'تعذر تحميل بيانات النموذج');
    } finally {
      setLoading(false);
    }
  }, [branch_id, company_id]);

  useEffect(() => {
    if (capabilities.canCreateExpenses) {
      loadData();
    }
  }, [capabilities.canCreateExpenses, loadData]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!company_id) return;
    if (!form.account_id || !form.category_id) {
      setError('يرجى اختيار الحساب والتصنيف');
      return;
    }
    const amount = Number(form.amount);
    if (!amount || amount <= 0) {
      setError('يرجى إدخال مبلغ صحيح');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await createExpense({
        company_id,
        branch_id,
        account_id: form.account_id,
        category_id: form.category_id,
        amount,
        movement_date: form.movement_date,
        payment_method: 'CASH',
        notes: form.notes || null,
        reference: null,
      });
      navigate('/app/expenses');
    } catch (err: any) {
      setError(err?.message || 'تعذر إنشاء المصروف');
    } finally {
      setSubmitting(false);
    }
  };

  if (!capabilities.canCreateExpenses) {
    return <EmptyState title="لا يوجد صلاحية" description="لا تملك صلاحية إنشاء المصروفات حالياً." />;
  }

  if (loading) {
    return <LoadingState rows={3} />;
  }

  if (error && accounts.length === 0 && categories.length === 0) {
    return <ErrorState title="تعذر تحميل النموذج" description={error} onRetry={loadData} />;
  }

  if (!accounts.length || !categories.length) {
    return (
      <EmptyState
        title="بيانات غير مكتملة"
        description={
          capabilities.isOwner
            ? 'يلزم إعداد الحسابات والتصنيفات قبل إنشاء المصروف.'
            : 'يلزم إعداد الحسابات والتصنيفات بواسطة مالك الشركة قبل إنشاء المصروف.'
        }
        actionLabel={capabilities.isOwner ? 'أكمل إعداد النظام' : undefined}
        onAction={capabilities.isOwner ? () => navigate('/app/setup') : undefined}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">مصروف جديد</h1>
        <p className="text-xs text-slate-500">أدخل تفاصيل المصروف لإرساله.</p>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-600">{error}</div>
      )}

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-500">المبلغ</label>
            <input
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-slate-400 focus:outline-none"
              type="number"
              min="0"
              step="0.01"
              value={form.amount}
              onChange={(event) => setForm((prev) => ({ ...prev, amount: event.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500">الوصف</label>
            <textarea
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-slate-400 focus:outline-none"
              rows={3}
              value={form.notes}
              onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
              placeholder="اكتب وصفاً مختصراً للمصروف"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-slate-500">الحساب</label>
              <select
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-slate-400 focus:outline-none"
                value={form.account_id}
                onChange={(event) => setForm((prev) => ({ ...prev, account_id: event.target.value }))}
              >
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500">التصنيف</label>
              <select
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-slate-400 focus:outline-none"
                value={form.category_id}
                onChange={(event) => setForm((prev) => ({ ...prev, category_id: event.target.value }))}
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500">التاريخ</label>
            <input
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-slate-400 focus:outline-none"
              type="date"
              value={form.movement_date}
              onChange={(event) => setForm((prev) => ({ ...prev, movement_date: event.target.value }))}
            />
          </div>
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-xs text-slate-400">
            رفع المرفقات غير متوفر حالياً (قادم قريباً).
          </div>
        </div>
      </div>

      <button
        className="w-full rounded-2xl bg-slate-900 py-3 text-sm font-medium text-white shadow disabled:opacity-50"
        type="submit"
        disabled={submitting}
      >
        {submitting ? 'جاري الحفظ...' : 'حفظ المصروف'}
      </button>
    </form>
  );
}
