import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  completeCompanySetup,
  inviteSetupUser,
  listSetupUsers,
  seedCompanyDefaults,
  updateCompanyProfile,
} from '@/adapters/setup.adapter';
import { useCompany } from '@/contexts/CompanyContext';
import { getRoleCapabilities } from '@/lib/capabilities';
import { EmptyState, ErrorState, LoadingState } from '@/ui/new/components/StateViews';
import { useSetupStatus } from '@/ui/new/hooks/useSetupStatus';
import type { UserRole } from '@/types';

type InviteForm = {
  full_name: string;
  email: string;
  role: UserRole;
};

export default function SetupWizardView() {
  const { company_id, role } = useCompany();
  const navigate = useNavigate();
  const capabilities = getRoleCapabilities(role);
  const { status, loading, error, refresh } = useSetupStatus(company_id);
  const [activeStep, setActiveStep] = useState(0);
  const [companyName, setCompanyName] = useState('');
  const [branchName, setBranchName] = useState('الفرع الرئيسي');
  const [costCenterName, setCostCenterName] = useState('المركز الرئيسي');
  const [accountName, setAccountName] = useState('الصندوق الرئيسي');
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [inviteForm, setInviteForm] = useState<InviteForm>({
    full_name: '',
    email: '',
    role: 'ACCOUNTANT',
  });
  const [localError, setLocalError] = useState<string | null>(null);

  const costCentersSupported = status?.cost_centers_supported ?? true;
  const costCenterReady = costCentersSupported ? status?.has_cost_center : true;

  useEffect(() => {
    if (status?.company_name && !companyName) {
      setCompanyName(status.company_name);
    }
  }, [companyName, status?.company_name]);

  const loadUsers = useCallback(async () => {
    try {
      const data = await listSetupUsers();
      setUsers(data || []);
    } catch (err: any) {
      setLocalError(err?.message || 'تعذر تحميل المستخدمين');
    }
  }, []);

  useEffect(() => {
    if (capabilities.isOwner) {
      loadUsers();
    }
  }, [capabilities.isOwner, loadUsers]);

  const steps = useMemo(
    () => [
      {
        title: 'بيانات الشركة',
        description: 'أدخل اسم الشركة لتخصيص الحساب.',
        complete: Boolean(status?.company_name?.trim()),
      },
      {
        title: 'إنشاء الفرع',
        description: 'أضف فرعاً واحداً على الأقل لإدارة العمليات.',
        complete: Boolean(status?.has_branch),
      },
      {
        title: 'مركز تكلفة',
        description: costCentersSupported ? 'أضف مركز تكلفة لتصنيف المصروفات.' : 'مراكز التكلفة غير مفعلة حالياً.',
        complete: Boolean(costCenterReady),
      },
      {
        title: 'الحسابات والتصنيفات',
        description: 'أنشئ حساباً وتصنيفاً أساسياً للمصروفات.',
        complete: Boolean(status?.has_account && status?.has_category),
      },
      {
        title: 'المستخدمون والأدوار',
        description: 'دعوة المحاسب ومسؤول العهدة.',
        complete: Boolean((status?.user_count ?? 0) >= 3),
      },
    ],
    [costCenterReady, costCentersSupported, status?.company_name, status?.has_account, status?.has_branch, status?.has_category, status?.user_count]
  );

  const canComplete =
    Boolean(status?.company_name?.trim()) &&
    Boolean(status?.has_branch) &&
    Boolean(costCenterReady) &&
    Boolean(status?.has_account) &&
    Boolean(status?.has_category) &&
    (status?.user_count ?? 0) >= 3;

  const handleUpdateCompany = async () => {
    if (!company_id) return;
    if (!companyName.trim()) {
      setLocalError('يرجى إدخال اسم الشركة');
      return;
    }
    setSaving(true);
    setLocalError(null);
    try {
      await updateCompanyProfile({ company_id, name: companyName.trim() });
      await refresh();
    } catch (err: any) {
      setLocalError(err?.message || 'تعذر حفظ بيانات الشركة');
    } finally {
      setSaving(false);
    }
  };

  const handleSeedDefaults = async (payload: { branch?: boolean; costCenter?: boolean; accounts?: boolean }) => {
    if (!company_id) return;
    setSaving(true);
    setLocalError(null);
    try {
      await seedCompanyDefaults({
        company_id,
        branch_name: payload.branch ? branchName : null,
        cost_center_name: payload.costCenter ? costCenterName : null,
        account_name: payload.accounts ? accountName : null,
      });
      await refresh();
    } catch (err: any) {
      setLocalError(err?.message || 'تعذر إنشاء البيانات الافتراضية');
    } finally {
      setSaving(false);
    }
  };

  const handleInvite = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!company_id) return;
    if (!inviteForm.full_name.trim() || !inviteForm.email.trim()) {
      setLocalError('يرجى إدخال الاسم والبريد الإلكتروني');
      return;
    }
    setSaving(true);
    setLocalError(null);
    try {
      await inviteSetupUser({
        company_id,
        full_name: inviteForm.full_name.trim(),
        email: inviteForm.email.trim(),
        role: inviteForm.role,
      });
      setInviteForm({ full_name: '', email: '', role: inviteForm.role });
      await loadUsers();
      await refresh();
    } catch (err: any) {
      setLocalError(err?.message || 'تعذر إرسال الدعوة');
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async () => {
    if (!company_id) return;
    setSaving(true);
    setLocalError(null);
    try {
      await completeCompanySetup(company_id);
      localStorage.setItem('saitara.setup.completed', 'true');
      navigate('/app/dashboard');
    } catch (err: any) {
      setLocalError(err?.message || 'تعذر إكمال الإعداد');
    } finally {
      setSaving(false);
    }
  };

  if (!capabilities.isOwner) {
    return <EmptyState title="لا يوجد صلاحية" description="فقط مالك الشركة يمكنه إكمال الإعداد." />;
  }

  if (loading) {
    return <LoadingState rows={4} />;
  }

  if (error) {
    return <ErrorState title="تعذر تحميل الإعداد" description={error} onRetry={refresh} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">معالج إعداد النظام</h1>
        <p className="text-xs text-slate-500">أكمل الخطوات التالية لتجهيز الحساب خلال دقائق.</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {steps.map((step, index) => (
          <button
            key={step.title}
            type="button"
            onClick={() => setActiveStep(index)}
            className={`min-w-[160px] rounded-2xl border px-4 py-3 text-right text-xs font-medium ${
              activeStep === index ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-700'
            }`}
          >
            <p>{step.title}</p>
            <p className="mt-2 text-[11px] opacity-80">{step.complete ? 'مكتملة' : 'غير مكتملة'}</p>
          </button>
        ))}
      </div>

      {localError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{localError}</div>
      )}

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">{steps[activeStep]?.title}</h2>
        <p className="mt-2 text-xs text-slate-500">{steps[activeStep]?.description}</p>

        {activeStep === 0 && (
          <div className="mt-4 space-y-3">
            <input
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm"
              placeholder="اسم الشركة"
              value={companyName}
              onChange={(event) => setCompanyName(event.target.value)}
            />
            <button
              type="button"
              onClick={handleUpdateCompany}
              className="w-full rounded-2xl bg-slate-900 py-2 text-xs font-medium text-white disabled:opacity-50"
              disabled={saving}
            >
              {saving ? 'جاري الحفظ...' : 'حفظ بيانات الشركة'}
            </button>
          </div>
        )}

        {activeStep === 1 && (
          <div className="mt-4 space-y-3">
            <input
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm"
              placeholder="اسم الفرع"
              value={branchName}
              onChange={(event) => setBranchName(event.target.value)}
            />
            <button
              type="button"
              onClick={() => handleSeedDefaults({ branch: true })}
              className="w-full rounded-2xl bg-slate-900 py-2 text-xs font-medium text-white disabled:opacity-50"
              disabled={saving}
            >
              {saving ? 'جاري الإنشاء...' : 'إنشاء الفرع الافتراضي'}
            </button>
          </div>
        )}

        {activeStep === 2 && (
          <div className="mt-4 space-y-3">
            {costCentersSupported ? (
              <>
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm"
                  placeholder="اسم مركز التكلفة"
                  value={costCenterName}
                  onChange={(event) => setCostCenterName(event.target.value)}
                />
                <button
                  type="button"
                  onClick={() => handleSeedDefaults({ costCenter: true })}
                  className="w-full rounded-2xl bg-slate-900 py-2 text-xs font-medium text-white disabled:opacity-50"
                  disabled={saving}
                >
                  {saving ? 'جاري الإنشاء...' : 'إنشاء مركز تكلفة افتراضي'}
                </button>
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
                لا توجد وحدة مراكز تكلفة في هذا الإصدار. يمكنك المتابعة للخطوة التالية.
              </div>
            )}
          </div>
        )}

        {activeStep === 3 && (
          <div className="mt-4 space-y-3">
            <input
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm"
              placeholder="اسم الحساب النقدي"
              value={accountName}
              onChange={(event) => setAccountName(event.target.value)}
            />
            <button
              type="button"
              onClick={() => handleSeedDefaults({ accounts: true })}
              className="w-full rounded-2xl bg-slate-900 py-2 text-xs font-medium text-white disabled:opacity-50"
              disabled={saving}
            >
              {saving ? 'جاري الإنشاء...' : 'إنشاء الحسابات والتصنيفات الأساسية'}
            </button>
          </div>
        )}

        {activeStep === 4 && (
          <div className="mt-4 space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
              تمت دعوة {status?.user_count ?? 0} مستخدمين. يفضل وجود 3 أدوار: المالك، المحاسب، ومسؤول العهدة.
            </div>

            {users.length > 0 && (
              <div className="space-y-2">
                {users.map((user) => (
                  <div key={user.user_id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs">
                    <div>
                      <p className="font-semibold text-slate-900">{user.profile?.full_name || 'مستخدم'}</p>
                      <p className="text-[11px] text-slate-400">{user.role}</p>
                    </div>
                    <span className="text-[11px] text-slate-500">{user.profile?.email || '-'}</span>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleInvite} className="space-y-2">
              <input
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm"
                placeholder="الاسم الكامل"
                value={inviteForm.full_name}
                onChange={(event) => setInviteForm((prev) => ({ ...prev, full_name: event.target.value }))}
              />
              <input
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm"
                placeholder="البريد الإلكتروني"
                type="email"
                value={inviteForm.email}
                onChange={(event) => setInviteForm((prev) => ({ ...prev, email: event.target.value }))}
              />
              <select
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm"
                value={inviteForm.role}
                onChange={(event) => setInviteForm((prev) => ({ ...prev, role: event.target.value as UserRole }))}
              >
                <option value="ACCOUNTANT">محاسب</option>
                <option value="EMPLOYEE">مسؤول عهدة</option>
                <option value="OWNER">مالك (إن لزم)</option>
              </select>
              <button
                type="submit"
                className="w-full rounded-2xl bg-slate-900 py-2 text-xs font-medium text-white disabled:opacity-50"
                disabled={saving}
              >
                {saving ? 'جاري الإرسال...' : 'إرسال الدعوة'}
              </button>
            </form>
          </div>
        )}
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900">إنهاء الإعداد</h3>
        <p className="mt-2 text-xs text-slate-500">
          تأكد من اكتمال الخطوات قبل إنهاء الإعداد. يمكنك الرجوع لاحقاً عبر الإعدادات.
        </p>
        <button
          type="button"
          onClick={handleComplete}
          className="mt-4 w-full rounded-2xl bg-emerald-600 py-2 text-xs font-medium text-white disabled:opacity-50"
          disabled={!canComplete || saving}
        >
          {saving ? 'جاري الإنهاء...' : 'إكمال إعداد النظام'}
        </button>
      </div>
    </div>
  );
}
