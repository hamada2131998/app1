
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowTrendingUpIcon, 
  ArrowTrendingDownIcon, 
  ChartBarSquareIcon,
  DocumentArrowDownIcon,
  CalendarDaysIcon,
  FunnelIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { getExpenseByCategory, getWeeklyInOut, ExpenseByCategory, WeeklyTrend } from '../services/reports.service';
import { listCashAccounts } from '../services/accounts.service';
import { CashAccount } from '../types';
import { normalizeError } from '../lib/errors';
import { signOut } from '../services/auth.service';
import Loader from '../components/Loader';
import Alert from '../components/Alert';

const Reports: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<CashAccount[]>([]);
  const [expenses, setExpenses] = useState<ExpenseByCategory[]>([]);
  const [weeklyTrends, setWeeklyTrends] = useState<WeeklyTrend[]>([]);
  
  const [filters, setFilters] = useState({
    dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    dateTo: new Date().toISOString().split('T')[0],
    accountId: ''
  });

  const fetchReportsData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [accs, expData, trendData] = await Promise.all([
        listCashAccounts(),
        getExpenseByCategory(filters.dateFrom, filters.dateTo, filters.accountId),
        getWeeklyInOut(6, filters.accountId)
      ]);
      setAccounts(accs);
      setExpenses(expData);
      setWeeklyTrends(trendData);
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
    fetchReportsData();
  }, [filters]);

  if (loading && expenses.length === 0) return <Loader message="جاري استخراج التقارير والرسوم البيانية..." />;

  const totalExpense = expenses.reduce((sum, exp) => sum + Number(exp.total), 0);

  return (
    <div className="space-y-10 max-w-7xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">التقارير المالية والتحليلات</h1>
          <p className="text-gray-500 font-medium">مراقبة دقيقة للتدفقات النقدية وتوزيع المصروفات</p>
        </div>
        <button 
          onClick={() => window.print()}
          className="flex items-center gap-3 bg-slate-900 text-white px-8 py-3.5 rounded-2xl text-sm font-black hover:bg-black transition-all shadow-xl shadow-slate-200"
        >
          <DocumentArrowDownIcon className="h-5 w-5" />
          تصدير التقرير PDF
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex flex-wrap items-center gap-6">
        <div className="flex-1 min-w-[200px] flex items-center gap-3">
          <CalendarDaysIcon className="h-5 w-5 text-gray-400" />
          <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-gray-100">
             <input 
               type="date" 
               className="bg-transparent text-xs font-bold text-gray-700 outline-none"
               value={filters.dateFrom}
               onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
             />
             <span className="text-gray-300 font-black">-</span>
             <input 
               type="date" 
               className="bg-transparent text-xs font-bold text-gray-700 outline-none"
               value={filters.dateTo}
               onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
             />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <FunnelIcon className="h-5 w-5 text-gray-400" />
          <select 
            className="bg-slate-50 px-6 py-2.5 rounded-xl border border-gray-100 text-xs font-black text-gray-700 outline-none cursor-pointer focus:ring-4 focus:ring-indigo-50"
            value={filters.accountId}
            onChange={(e) => setFilters({...filters, accountId: e.target.value})}
          >
            <option value="">جميع الحسابات والخزائن</option>
            {accounts.map(acc => (
              <option key={acc.id} value={acc.id}>{acc.name}</option>
            ))}
          </select>
        </div>

        <button onClick={fetchReportsData} className="p-3 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all">
          <ArrowPathIcon className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <Alert 
          type="error" 
          title="فشل تحميل التقارير" 
          message={error} 
          onRetry={fetchReportsData} 
          className="mb-8" 
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-10">
            <h3 className="font-black text-gray-900 text-lg flex items-center gap-3">
              <ChartBarSquareIcon className="h-6 w-6 text-indigo-600" />
              توزيع المصروفات حسب التصنيف
            </h3>
          </div>
          
          <div className="space-y-8">
            {expenses.length > 0 ? expenses.map((exp, i) => {
              const percentage = totalExpense > 0 ? (exp.total / totalExpense) * 100 : 0;
              const colors = ['bg-indigo-600', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-slate-500'];
              return (
                <div key={exp.category_id || i}>
                  <div className="flex justify-between items-end mb-3">
                    <div>
                      <span className="text-sm font-black text-gray-900">{exp.category_name}</span>
                      <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">
                        {Number(exp.total).toLocaleString()} ر.س
                      </p>
                    </div>
                    <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">
                      {percentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-50 rounded-full h-3 border border-slate-100 overflow-hidden">
                    <div 
                      className={`${colors[i % colors.length]} h-full rounded-full transition-all duration-1000 shadow-sm`} 
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            }) : (
              <div className="py-20 text-center border-2 border-dashed border-slate-50 rounded-3xl">
                 <p className="text-slate-400 italic font-medium">لا توجد مصروفات مسجلة في هذه الفترة.</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm">
          <h3 className="font-black text-gray-900 text-lg mb-10 flex items-center gap-3">
            <ArrowTrendingUpIcon className="h-6 w-6 text-emerald-600" />
            تحليل التدفقات الأسبوعية (آخر 6 أسابيع)
          </h3>
          <div className="flex items-end justify-between h-56 gap-4 px-4 border-b border-slate-50 pb-4">
            {weeklyTrends.length > 0 ? weeklyTrends.map((trend, i) => {
              const maxVal = Math.max(...weeklyTrends.map(t => Math.max(Number(t.total_in), Number(t.total_out))), 1);
              const inHeight = (Number(trend.total_in) / maxVal) * 100;
              const outHeight = (Number(trend.total_out) / maxVal) * 100;
              
              return (
                <div key={trend.week_start} className="flex-1 flex flex-col items-center gap-3 h-full group">
                  <div className="w-full flex gap-1.5 justify-center items-end h-full">
                    <div 
                      className="w-3 bg-indigo-600 rounded-t-lg transition-all duration-1000 group-hover:bg-indigo-700 shadow-lg shadow-indigo-100" 
                      style={{ height: `${Math.max(inHeight, 2)}%` }}
                      title={`وارد: ${Number(trend.total_in).toLocaleString()}`}
                    ></div>
                    <div 
                      className="w-3 bg-rose-400 rounded-t-lg transition-all duration-1000 group-hover:bg-rose-500 shadow-lg shadow-rose-100" 
                      style={{ height: `${Math.max(outHeight, 2)}%` }}
                      title={`صادر: ${Number(trend.total_out).toLocaleString()}`}
                    ></div>
                  </div>
                  <span className="text-[9px] text-slate-400 font-black uppercase tracking-tighter whitespace-nowrap">
                    {new Date(trend.week_start).toLocaleDateString('ar-SA', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              );
            }) : (
              <div className="flex-1 flex items-center justify-center">
                 <p className="text-slate-300 italic">لا توجد بيانات كافية للرسم البياني</p>
              </div>
            )}
          </div>
          <div className="mt-8 flex justify-center gap-10">
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 bg-indigo-600 rounded-full shadow-lg shadow-indigo-200"></div>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">إجمالي الدخل</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 bg-rose-400 rounded-full shadow-lg shadow-rose-200"></div>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">إجمالي الصرف</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-10 py-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
          <h3 className="font-black text-gray-900">أداء الحسابات في الفترة المحددة</h3>
          <span className="text-[10px] bg-white px-4 py-1.5 rounded-full border border-slate-100 font-black text-indigo-600 tracking-widest uppercase">
            إجمالي الحركات: {weeklyTrends.length} أسابيع
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 border-b border-slate-100 uppercase tracking-[0.2em]">
              <tr>
                <th className="px-10 py-6">الأسبوع (بداية من)</th>
                <th className="px-10 py-6">الواردات</th>
                <th className="px-10 py-6">المصروفات</th>
                <th className="px-10 py-6 text-left">الصافي الأسبوعي</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {weeklyTrends.map((trend) => {
                const net = Number(trend.total_in) - Number(trend.total_out);
                return (
                  <tr key={trend.week_start} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-10 py-6 font-black text-slate-900">
                      {new Date(trend.week_start).toLocaleDateString('ar-SA', { dateStyle: 'long' })}
                    </td>
                    <td className="px-10 py-6 text-emerald-600 font-bold">
                      {Number(trend.total_in).toLocaleString()} ر.س
                    </td>
                    <td className="px-10 py-6 text-rose-600 font-bold">
                      {Number(trend.total_out).toLocaleString()} ر.س
                    </td>
                    <td className={`px-10 py-6 text-left font-black ${net >= 0 ? 'text-indigo-700' : 'text-rose-700'}`}>
                      {net >= 0 ? '+' : ''}{net.toLocaleString()} ر.س
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;
