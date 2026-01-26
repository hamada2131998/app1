
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { MovementStatus, MovementType } from '../types';
import { listMovements } from '../services/movements.service';
import { getDashboardSummary, DashboardSummary } from '../services/reports.service';
import { signOut } from '../services/auth.service';
import { normalizeError } from '../lib/errors';
import Loader from '../components/Loader';
import Alert from '../components/Alert';
import { 
  ArrowUpCircleIcon, 
  ArrowDownCircleIcon, 
  ScaleIcon, 
  ClockIcon,
  CalendarIcon,
  ArrowPathIcon
} from '@heroicons/react/24/solid';
import { useNavigate } from 'react-router-dom';

const StatCard = ({ title, amount, icon: Icon, color, loading }: any) => (
  <div className="bg-white rounded-[2rem] shadow-sm p-8 border border-gray-100 hover:shadow-xl hover:shadow-indigo-50/50 transition-all group">
    <div className="flex items-center justify-between mb-6">
      <div className={`p-4 rounded-2xl ${color} group-hover:scale-110 transition-transform shadow-lg shadow-current/20`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">موجز السندات</span>
    </div>
    <h3 className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide">{title}</h3>
    <div className="flex items-baseline gap-2">
      {loading ? (
        <div className="h-8 w-24 bg-gray-100 animate-pulse rounded-lg"></div>
      ) : (
        <>
          <p className="text-4xl font-black text-gray-900 tracking-tight">{amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          <span className="text-xs font-black text-gray-400 uppercase">ر.س</span>
        </>
      )}
    </div>
  </div>
);

const Dashboard: React.FC = () => {
  const { membership } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [recentMovements, setRecentMovements] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [sumData, movesData] = await Promise.all([
        getDashboardSummary(dateRange.from, dateRange.to),
        listMovements()
      ]);
      setSummary(sumData);
      setRecentMovements(movesData.slice(0, 5));
    } catch (err: any) {
      const norm = normalizeError(err);
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
    fetchDashboardData();
  }, [dateRange]);

  if (loading && !summary) return <Loader message="جاري إعداد التقرير المالي..." />;

  return (
    <div className="space-y-10 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">مرحباً بك، {membership?.role === 'OWNER' ? 'المدير العام' : 'المحاسب'}</h1>
          <p className="text-gray-500 font-medium mt-1">نظرة شاملة على الأداء المالي لشركة {membership?.company_name}</p>
        </div>
        
        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm">
           <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl text-xs font-bold text-slate-600">
              <CalendarIcon className="h-4 w-4 text-slate-400" />
              نطاق التقرير:
           </div>
           <input 
             type="date" 
             className="text-xs font-bold text-indigo-600 outline-none p-2 rounded-lg hover:bg-indigo-50 transition-colors"
             value={dateRange.from}
             onChange={(e) => setDateRange({...dateRange, from: e.target.value})}
           />
           <span className="text-gray-300 font-black">←</span>
           <input 
             type="date" 
             className="text-xs font-bold text-indigo-600 outline-none p-2 rounded-lg hover:bg-indigo-50 transition-colors"
             value={dateRange.to}
             onChange={(e) => setDateRange({...dateRange, to: e.target.value})}
           />
           <button onClick={fetchDashboardData} className="p-2 text-gray-400 hover:text-indigo-600">
             <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
           </button>
        </div>
      </div>

      {error && (
        <Alert 
          type="error" 
          title="فشل تحديث البيانات" 
          message={error} 
          onRetry={fetchDashboardData} 
          className="mb-8" 
        />
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <StatCard 
          title="إجمالي المقبوضات" 
          amount={summary?.total_in || 0} 
          icon={ArrowUpCircleIcon} 
          color="bg-emerald-500" 
          loading={loading}
        />
        <StatCard 
          title="إجمالي المصروفات" 
          amount={summary?.total_out || 0} 
          icon={ArrowDownCircleIcon} 
          color="bg-rose-500" 
          loading={loading}
        />
        <StatCard 
          title="صافي التدفق" 
          amount={summary?.net_balance || 0} 
          icon={ScaleIcon} 
          color="bg-indigo-600" 
          loading={loading}
        />
        <StatCard 
          title="سندات الفترة" 
          amount={summary?.movements_count || 0} 
          icon={ClockIcon} 
          color="bg-slate-800" 
          loading={loading}
        />
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-10 py-8 border-b border-gray-50 flex items-center justify-between">
            <h3 className="font-black text-gray-900 text-lg">أحدث الحركات المعتمدة</h3>
            <button 
              onClick={() => navigate('/movements')}
              className="text-xs font-black text-indigo-600 hover:underline uppercase tracking-widest"
            >
              عرض السجل الكامل
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {recentMovements.length > 0 ? recentMovements.map((move) => (
              <div key={move.id} onClick={() => navigate(`/movements/${move.id}`)} className="px-10 py-6 flex items-center hover:bg-slate-50 transition-colors cursor-pointer group">
                <div className={`p-3 rounded-2xl ml-6 transition-all ${move.type === MovementType.IN ? 'bg-emerald-50 group-hover:bg-emerald-100' : 'bg-rose-50 group-hover:bg-rose-100'}`}>
                  {move.type === MovementType.IN ? (
                    <ArrowUpCircleIcon className="h-6 w-6 text-emerald-600" />
                  ) : (
                    <ArrowDownCircleIcon className="h-6 w-6 text-rose-600" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-black text-gray-900">{move.category?.name || 'تصنيف عام'}</p>
                  <p className="text-[10px] text-gray-400 font-bold mt-1">{new Date(move.movement_date).toLocaleDateString('ar-SA', { dateStyle: 'long' })}</p>
                </div>
                <div className="text-left">
                  <p className={`text-lg font-black ${move.type === MovementType.IN ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {move.type === MovementType.IN ? '+' : '-'}{move.amount.toLocaleString()} 
                    <span className="text-[10px] mr-1">ر.س</span>
                  </p>
                </div>
              </div>
            )) : (
              <div className="p-20 text-center">
                 <p className="text-gray-400 font-medium italic">لا توجد حركات معتمدة في هذا النطاق.</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-8">
           <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-slate-200">
              <h3 className="font-black text-xl mb-4">إجراءات سريعة</h3>
              <div className="space-y-4">
                 <button onClick={() => navigate('/movements/new')} className="w-full py-4 bg-indigo-600 rounded-2xl font-black text-sm hover:bg-indigo-700 transition-all flex items-center justify-center gap-3">
                    <ArrowUpCircleIcon className="h-5 w-5 rotate-45" />
                    تسجيل سند جديد
                 </button>
                 <button onClick={() => navigate('/daily-close')} className="w-full py-4 bg-white/10 rounded-2xl font-black text-sm hover:bg-white/20 transition-all flex items-center justify-center gap-3">
                    <CalendarIcon className="h-5 w-5" />
                    إقفال اليوم
                 </button>
              </div>
           </div>

           <div className="bg-indigo-50 rounded-[2.5rem] p-10 border border-indigo-100">
              <h4 className="text-indigo-900 font-black text-lg mb-2">تلميحات ذكية</h4>
              <p className="text-sm text-indigo-700 leading-relaxed font-medium">
                 نصيحة: الإقفال اليومي المنتظم يقلل من احتمالية حدوث فروقات مالية غير مبررة بنسبة 90%.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
