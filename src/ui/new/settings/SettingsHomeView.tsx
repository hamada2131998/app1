import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { isOwnerRole } from '@/ui/new/utils/roles';

export default function SettingsHomeView() {
  const { profile, signOut } = useAuth();
  const { role } = useCompany();
  const isOwner = isOwnerRole(role);

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

      {isOwner && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-900">إعدادات الإدارة</h2>
          <div className="grid gap-3">
            {[
              'إعدادات الشركة',
              'إدارة الفروع',
              'مراكز التكلفة',
              'المستخدمون والصلاحيات',
            ].map((label) => (
              <div key={label} className="rounded-2xl border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-600">
                {label} (قريباً)
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
