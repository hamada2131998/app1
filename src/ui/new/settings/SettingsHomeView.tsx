import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { getRoleCapabilities } from '@/lib/capabilities';
import { EmptyState } from '@/ui/new/components/StateViews';
import { Link } from 'react-router-dom';

export default function SettingsHomeView() {
  const { profile, signOut } = useAuth();
  const { role } = useCompany();
  const capabilities = getRoleCapabilities(role);

  if (!capabilities.canViewSettings) {
    return <EmptyState title="لا يوجد صلاحية" description="لا تملك صلاحية الوصول إلى الإعدادات حالياً." />;
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">الإعدادات</h1>
        <p className="text-xs text-slate-500">إدارة الإعدادات الشخصية والإدارية.</p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">الملف الشخصي</h2>
        <div className="mt-4 space-y-2 text-sm text-slate-600">
          <p>{profile?.full_name || 'مستخدم'}</p>
          <p>{profile?.email || '-'}</p>
        </div>
        <button
          type="button"
          onClick={signOut}
          className="mt-4 w-full rounded-2xl border border-slate-200 bg-slate-50 py-2 text-xs font-medium text-slate-700"
        >
          تسجيل الخروج
        </button>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-900">إعدادات الإدارة</h2>
        <div className="grid gap-3">
          <Link
            to="/app/setup"
            className={`rounded-2xl border border-slate-200 bg-white p-4 text-sm font-medium shadow-sm ${
              capabilities.isOwner ? 'text-slate-700' : 'pointer-events-none text-slate-400 opacity-70'
            }`}
          >
            أكمل إعداد النظام
            {!capabilities.isOwner && <span className="mt-1 block text-[11px] text-slate-400">متاح للمالك فقط</span>}
          </Link>
          {['إعدادات الشركة', 'إدارة الفروع', 'مراكز التكلفة', 'المستخدمون والصلاحيات'].map((label) => (
            <div
              key={label}
              className={`rounded-2xl border border-dashed border-slate-200 bg-white p-4 text-sm ${
                capabilities.isOwner ? 'text-slate-600' : 'text-slate-400'
              }`}
            >
              {label} (قريباً)
              {!capabilities.isOwner && <span className="mt-1 block text-[11px]">متاح للمالك فقط</span>}
            </div>
          ))}
        </div>
      </div>

      {capabilities.isOwner && (
        <div className="space-y-3">
          <p className="text-[11px] text-slate-400">يمكنك الوصول لجميع إعدادات الشركة بصلاحيات المالك.</p>
        </div>
      )}
    </div>
  );
}
