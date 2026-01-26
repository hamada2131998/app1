
import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MovementType, MovementStatus, CashMovement } from '../types';
import { listMovements } from '../services/movements.service';
import { signOut } from '../services/auth.service';
import { normalizeError } from '../lib/errors';
import { logger } from '../lib/logger';
import Loader from '../components/Loader';
import Alert from '../components/Alert';
import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  EyeIcon, 
  ArrowPathIcon,
  InboxIcon
} from '@heroicons/react/24/outline';

const Movements: React.FC = () => {
  const navigate = useNavigate();
  const [movements, setMovements] = useState<CashMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState({ type: 'ALL', status: 'ALL' });

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listMovements();
      setMovements(data);
    } catch (err: any) {
      const normalized = normalizeError(err);
      logger.error('MovementsList', err);
      if (normalized.isAuthExpired) {
        await signOut();
        navigate('/login');
      } else {
        setError(normalized.message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredMovements = useMemo(() => {
    return movements.filter(m => {
      const matchesType = filter.type === 'ALL' || m.type === filter.type;
      const matchesStatus = filter.status === 'ALL' || m.status === filter.status;
      const matchesSearch = searchTerm === '' || 
        m.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.id.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesType && matchesStatus && matchesSearch;
    });
  }, [movements, filter, searchTerm]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">حركات الكاش</h1>
          <p className="text-sm text-gray-500 font-medium">عرض وإدارة جميع عمليات القبض والصرف والتحويل</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={fetchData}
            disabled={loading}
            className="p-3 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-all disabled:opacity-50"
            title="تحديث البيانات"
          >
            <ArrowPathIcon className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Link
            to="/movements/new"
            className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-xl font-black hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
          >
            <PlusIcon className="h-5 w-5 ml-2" />
            إضافة حركة جديدة
          </Link>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[200px] relative">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="بحث بالملاحظات، المرجع..."
            className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm outline-none font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <select 
          className="bg-gray-50 border-none text-sm rounded-xl px-4 py-2.5 font-bold text-gray-600 outline-none cursor-pointer"
          value={filter.type}
          onChange={(e) => setFilter({...filter, type: e.target.value})}
        >
          <option value="ALL">جميع الأنواع</option>
          <option value={MovementType.IN}>قبض (+)</option>
          <option value={MovementType.OUT}>صرف (-)</option>
          <option value={MovementType.TRANSFER}>تحويل ⇆</option>
        </select>

        <select 
          className="bg-gray-50 border-none text-sm rounded-xl px-4 py-2.5 font-bold text-gray-600 outline-none cursor-pointer"
          value={filter.status}
          onChange={(e) => setFilter({...filter, status: e.target.value})}
        >
          <option value="ALL">جميع الحالات</option>
          <option value={MovementStatus.DRAFT}>مسودات</option>
          <option value={MovementStatus.SUBMITTED}>بانتظار الاعتماد</option>
          <option value={MovementStatus.APPROVED}>معتمدة</option>
          <option value={MovementStatus.REJECTED}>مرفوضة</option>
        </select>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-200 overflow-hidden min-h-[400px]">
        {loading ? (
          <Loader message="جاري تحميل الحركات المالية من السيرفر..." />
        ) : error ? (
          <div className="p-20 max-w-lg mx-auto">
            <Alert 
              type="error" 
              title="تعذر تحميل البيانات" 
              message={error} 
              onRetry={fetchData} 
            />
          </div>
        ) : filteredMovements.length === 0 ? (
          <div className="py-24 flex flex-col items-center justify-center space-y-4 px-6 text-center">
            <div className="bg-gray-50 p-6 rounded-full">
              <InboxIcon className="h-12 w-12 text-gray-300" />
            </div>
            <div>
              <h3 className="text-xl font-black text-gray-900">لا توجد حركات متاحة</h3>
              <p className="text-gray-500 mt-2 font-medium max-w-xs mx-auto leading-relaxed">
                {searchTerm || filter.type !== 'ALL' || filter.status !== 'ALL' 
                  ? "لم يتم العثور على نتائج تطابق معايير البحث الحالية." 
                  : "ابدأ بإضافة أول حركة مالية لنظامك لتتبع التدفقات النقدية."}
              </p>
            </div>
            {(searchTerm || filter.type !== 'ALL' || filter.status !== 'ALL') && (
              <button 
                onClick={() => {setSearchTerm(''); setFilter({type: 'ALL', status: 'ALL'})}}
                className="text-indigo-600 font-black hover:underline"
              >
                مسح جميع الفلاتر
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-gray-50/50 border-b border-gray-100">
                <tr>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">التاريخ</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">الحساب</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">النوع</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">التصنيف</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-left">المبلغ</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">الحالة</th>
                  <th className="px-8 py-5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm">
                {filteredMovements.map((item) => (
                  <tr 
                    key={item.id} 
                    className="hover:bg-indigo-50/30 transition-colors cursor-pointer group"
                    onClick={() => navigate(`/movements/${item.id}`)}
                  >
                    <td className="px-8 py-5">
                      <p className="font-bold text-gray-900">{new Date(item.movement_date).toLocaleDateString('ar-SA')}</p>
                      <p className="text-[10px] text-gray-400 font-mono mt-0.5">#{item.id.slice(0, 8)}</p>
                    </td>
                    <td className="px-8 py-5">
                      <p className="font-bold text-gray-700">{item.account?.name || 'غير محدد'}</p>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`text-[10px] px-3 py-1 rounded-lg font-black uppercase ${
                        item.type === MovementType.IN ? 'bg-emerald-100 text-emerald-700' : 
                        item.type === MovementType.OUT ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {item.type === MovementType.IN ? 'قبض' : item.type === MovementType.OUT ? 'صرف' : 'تحويل'}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <p className="font-black text-gray-900">{item.category?.name || 'عام'}</p>
                      {item.notes && <p className="text-[10px] text-gray-400 truncate max-w-[150px] font-medium italic mt-0.5">{item.notes}</p>}
                    </td>
                    <td className={`px-8 py-5 font-black text-left ${item.type === MovementType.IN ? 'text-emerald-600' : 'text-rose-600'}`}>
                       {item.type === MovementType.IN ? '+' : '-'}{item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} ر.س
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2">
                        <div className={`h-2.5 w-2.5 rounded-full ${
                          item.status === MovementStatus.APPROVED ? 'bg-emerald-500' : 
                          item.status === MovementStatus.SUBMITTED ? 'bg-amber-500' : 
                          item.status === MovementStatus.REJECTED ? 'bg-red-500' : 'bg-gray-300'
                        }`}></div>
                        <span className="text-[10px] font-black text-gray-600">
                          {item.status === MovementStatus.APPROVED ? 'معتمد' : 
                           item.status === MovementStatus.SUBMITTED ? 'بانتظار المراجعة' : 
                           item.status === MovementStatus.REJECTED ? 'مرفوض' : 'مسودة'}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-left">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2.5 text-indigo-600 hover:bg-indigo-100 rounded-xl transition-all">
                          <EyeIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Movements;
