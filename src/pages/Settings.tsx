
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { UserRole, Branch } from '../types';
import { normalizeError } from '../lib/errors';
import { logger } from '../lib/logger';
import { toast } from '../lib/toast';
import { signOut } from '../services/auth.service';
import Alert from '../components/Alert';
import Loader from '../components/Loader';
import { 
  listBranches, 
  createBranch, 
  toggleBranchStatus, 
  listCompanyUsers, 
  updateUserRole, 
  inviteNewUser 
} from '../services/settings.service';
import { 
  BuildingOfficeIcon, 
  UserGroupIcon, 
  ShieldCheckIcon,
  PlusIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  EnvelopeIcon,
  UserPlusIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { membership } = useAuth();
  const [activeTab, setActiveTab] = useState('branches');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [branches, setBranches] = useState<Branch[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: '', name: '', role: UserRole.EMPLOYEE });
  const [newBranchName, setNewBranchName] = useState('');

  const isOwner = membership?.role === UserRole.OWNER;
  const isAccountant = isOwner || membership?.role === UserRole.ACCOUNTANT;

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === 'branches') {
        const data = await listBranches();
        setBranches(data);
      } else if (activeTab === 'users' && isAccountant) {
        const data = await listCompanyUsers();
        setUsers(data);
      }
    } catch (err: any) {
      const norm = normalizeError(err);
      logger.error('SettingsFetch', err);
      if (norm.isAuthExpired) {
        await signOut();
        navigate('/login');
      } else {
        setError(norm.message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const handleAddBranch = async () => {
    if (!newBranchName) return;
    setActionLoading(true);
    try {
      await createBranch(newBranchName);
      toast.success("تمت إضافة الفرع بنجاح");
      setNewBranchName('');
      await fetchData();
    } catch (err: any) { 
      const norm = normalizeError(err);
      toast.error(norm.message);
    }
    finally { setActionLoading(false); }
  };

  const handleToggleBranch = async (id: string, current: boolean) => {
    try {
      await toggleBranchStatus(id, !current);
      toast.success("تم تحديث حالة الفرع");
      await fetchData();
    } catch (err: any) { 
      toast.error(normalizeError(err).message);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!membership?.company_id) return;
    setActionLoading(true);
    try {
      await inviteNewUser({ ...inviteForm, company_id: membership.company_id });
      setShowInviteModal(false);
      setInviteForm({ email: '', name: '', role: UserRole.EMPLOYEE });
      await fetchData();
      toast.success("تم إرسال دعوة الموظف بنجاح");
    } catch (err: any) { 
      const norm = normalizeError(err);
      logger.error('UserInvite', err);
      toast.error(norm.message);
    }
    finally { setActionLoading(false); }
  };

  const handleRoleChange = async (userId: string, newRole: any) => {
    if (!isOwner || !membership?.company_id) return;
    try {
      await updateUserRole(userId, membership.company_id, newRole);
      toast.success("تم تغيير دور المستخدم بنجاح");
      await fetchData();
    } catch (err: any) { 
      toast.error(normalizeError(err).message);
    }
  };

  const tabs = [
    { id: 'branches', name: 'الفروع والخزائن', icon: BuildingOfficeIcon, show: true },
    { id: 'users', name: 'المستخدمين والأدوار', icon: UserGroupIcon, show: isAccountant },
    { id: 'security', name: 'الأمان والإقفال', icon: ShieldCheckIcon, show: isAccountant },
  ];

  return (
    <div className="space-y-10 max-w-7xl mx-auto">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">إعدادات النظام</h1>
          <p className="text-sm text-gray-500 font-bold mt-1 uppercase tracking-widest">إدارة البنية الأساسية لشركة {membership?.company_name}</p>
        </div>
      </div>

      {error && <Alert type="error" title="فشل جلب الإعدادات" message={error} className="mb-8" onRetry={fetchData} />}

      <div className="flex flex-col lg:flex-row gap-10">
        <div className="w-full lg:w-72 space-y-3">
          {tabs.filter(t => t.show).map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`w-full flex items-center px-6 py-5 rounded-[2rem] text-sm font-black transition-all border ${activeTab === tab.id ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xl shadow-indigo-100 scale-[1.02]' : 'bg-white text-gray-500 hover:bg-slate-50 border-gray-100 shadow-sm'}`}>
              <tab.icon className={`h-6 w-6 ml-4 ${activeTab === tab.id ? 'text-white' : 'text-gray-400'}`} />
              {tab.name}
            </button>
          ))}
        </div>

        <div className="flex-1 bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden min-h-[600px]">
          <div className="p-10 md:p-14">
            {loading ? <Loader message="جاري استرجاع بيانات القسم..." /> : (
              <div className="animate-in fade-in duration-500">
                {activeTab === 'branches' && (
                  <div className="space-y-12">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                      <h3 className="text-2xl font-black text-gray-900 tracking-tight">الفروع التشغيلية</h3>
                      {isAccountant && (
                        <div className="flex gap-3 w-full sm:w-auto">
                          <input type="text" placeholder="اسم الفرع الجديد..." className="flex-1 bg-slate-50 border border-gray-100 rounded-2xl px-5 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-50" value={newBranchName} onChange={(e) => setNewBranchName(e.target.value)} />
                          <button onClick={handleAddBranch} disabled={actionLoading || !newBranchName} className="bg-indigo-600 text-white px-8 py-3 rounded-2xl text-xs font-black disabled:opacity-50 shadow-xl shadow-indigo-50">إضافة</button>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {branches.length > 0 ? branches.map(branch => (
                        <div key={branch.id} className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-center justify-between group hover:bg-white hover:shadow-xl transition-all">
                          <div className="flex items-center gap-4">
                            <div className={`h-3 w-3 rounded-full ${branch.is_active ? 'bg-emerald-500' : 'bg-rose-400'}`}></div>
                            <p className="font-black text-gray-900 text-lg">{branch.name}</p>
                          </div>
                          {isAccountant && (
                            <button onClick={() => handleToggleBranch(branch.id, branch.is_active)} className={`p-3 rounded-xl transition-all ${branch.is_active ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100' : 'text-gray-400 bg-gray-100 hover:bg-gray-200'}`}>
                              {branch.is_active ? <CheckCircleIcon className="h-7 w-7" /> : <XCircleIcon className="h-7 w-7" />}
                            </button>
                          )}
                        </div>
                      )) : (
                        <div className="col-span-full py-20 text-center bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-100">
                           <p className="text-slate-400 font-bold italic">لم يتم تعريف أي فروع بعد.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {activeTab === 'users' && isAccountant && (
                  <div className="space-y-12">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                      <h3 className="text-2xl font-black text-gray-900 tracking-tight">إدارة فريق العمل</h3>
                      {isOwner && (
                        <button 
                          onClick={() => setShowInviteModal(true)} 
                          className="bg-indigo-600 text-white px-8 py-4 rounded-2xl text-xs font-black flex items-center justify-center gap-3 shadow-2xl shadow-indigo-100 hover:scale-[1.02] transition-transform"
                        >
                          <UserPlusIcon className="h-5 w-5" /> دعوة موظف جديد
                        </button>
                      )}
                    </div>
                    <div className="border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-sm">
                      <table className="w-full text-right">
                        <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                          <tr>
                            <th className="px-10 py-5">الموظف</th>
                            <th className="px-10 py-5">الدور الوظيفي</th>
                            <th className="px-10 py-5">تعديل الصلاحيات</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {users.map((u) => (
                            <tr key={u.user_id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-10 py-6 flex items-center gap-5">
                                <div className="h-12 w-12 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-700 font-black text-lg shadow-sm">
                                  {u.profile?.full_name?.charAt(0)}
                                </div>
                                <div>
                                  <p className="font-black text-gray-900">{u.profile?.full_name}</p>
                                  <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5 tracking-tight">ID: {u.user_id.slice(0, 8)}</p>
                                </div>
                              </td>
                              <td className="px-10 py-6">
                                <span className={`text-[10px] px-4 py-1.5 rounded-full font-black uppercase tracking-widest ${
                                  u.role === UserRole.OWNER ? 'bg-indigo-100 text-indigo-700' : 
                                  u.role === UserRole.ACCOUNTANT ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                                }`}>
                                  {u.role === UserRole.OWNER ? 'مالك النظام' : u.role === UserRole.ACCOUNTANT ? 'محاسب' : 'موظف'}
                                </span>
                              </td>
                              <td className="px-10 py-6">
                                {isOwner && u.user_id !== membership?.user_id ? (
                                  <select 
                                    className="bg-white border border-gray-100 rounded-xl px-4 py-2 text-xs font-black text-gray-700 outline-none focus:ring-4 focus:ring-indigo-50" 
                                    value={u.role} 
                                    onChange={(e) => handleRoleChange(u.user_id, e.target.value as any)}
                                  >
                                    <option value={UserRole.OWNER}>ترقية لمالك</option>
                                    <option value={UserRole.ACCOUNTANT}>محاسب</option>
                                    <option value={UserRole.EMPLOYEE}>موظف عادي</option>
                                  </select>
                                ) : (
                                  <span className="text-[10px] text-gray-300 font-black italic">لا يمكن التعديل</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                {activeTab === 'security' && (
                  <div className="py-20 text-center space-y-6">
                    <ShieldCheckIcon className="h-20 w-20 text-indigo-100 mx-auto" />
                    <h3 className="text-xl font-black text-gray-900">إعدادات الأمان المتقدمة</h3>
                    <p className="text-gray-500 font-medium max-w-sm mx-auto leading-relaxed">قريباً: إدارة فترات الإقفال الشهري التلقائي، سجلات الدخول التفصيلية، والتحقق بخطوتين.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {showInviteModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-300">
             <div className="p-10 border-b border-gray-50 flex justify-between items-center bg-slate-50/50">
                <h3 className="text-2xl font-black text-gray-900 tracking-tight">دعوة موظف للفريق</h3>
                <button onClick={() => setShowInviteModal(false)} className="p-3 hover:bg-white rounded-2xl transition-all shadow-sm"><XMarkIcon className="h-7 w-7 text-gray-400" /></button>
             </div>
             <form onSubmit={handleInvite} className="p-10 space-y-8">
                <div className="space-y-2">
                  <label className="block text-[10px] text-gray-400 font-black uppercase tracking-widest">الاسم الكامل</label>
                  <input required type="text" className="w-full bg-slate-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-black outline-none focus:ring-4 focus:ring-indigo-50" placeholder="اسم الموظف الثلاثي..." value={inviteForm.name} onChange={(e) => setInviteForm({...inviteForm, name: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] text-gray-400 font-black uppercase tracking-widest">البريد الإلكتروني المهني</label>
                  <input required type="email" className="w-full bg-slate-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-black text-left outline-none focus:ring-4 focus:ring-indigo-50" placeholder="email@company.com" value={inviteForm.email} onChange={(e) => setInviteForm({...inviteForm, email: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] text-gray-400 font-black uppercase tracking-widest">الدور المقترح</label>
                  <select className="w-full bg-slate-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-black outline-none focus:ring-4 focus:ring-indigo-50 cursor-pointer" value={inviteForm.role} onChange={(e) => setInviteForm({...inviteForm, role: e.target.value as any})}>
                    <option value={UserRole.EMPLOYEE}>موظف (إدخال حركات فقط)</option>
                    <option value={UserRole.ACCOUNTANT}>محاسب (مراجعة واعتماد)</option>
                    <option value={UserRole.OWNER}>مالك (صلاحيات كاملة)</option>
                  </select>
                </div>
                <button disabled={actionLoading} className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black shadow-2xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50">
                  {actionLoading ? <ArrowPathIcon className="h-6 w-6 animate-spin" /> : <EnvelopeIcon className="h-6 w-6" />}
                  إرسال دعوة الانضمام
                </button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
