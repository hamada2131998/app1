
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CashMovement, UserRole } from '../types';
import { listPendingMovements, processApproval } from '../services/approvals.service';
import { signOut } from '../services/auth.service';
import { useAuth } from '../hooks/useAuth';
import { normalizeError } from '../lib/errors';
import { toast } from '../lib/toast';
import Loader from '../components/Loader';
import { 
  EyeIcon, 
  ArrowPathIcon,
  InboxStackIcon
} from '@heroicons/react/24/outline';

const Approvals: React.FC = () => {
  const navigate = useNavigate();
  const { membership } = useAuth();
  
  const [items, setItems] = useState<CashMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, string>>({});
  const highAmountThreshold = 10000;

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listPendingMovements();
      setItems(data);
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
    if (membership && membership.role === UserRole.EMPLOYEE) {
      navigate('/');
      return;
    }
    fetchData();
  }, [membership, navigate]);

  const handleAction = async (id: string, action: 'APPROVED' | 'REJECTED') => {
    setProcessingId(id);
    try {
      await processApproval(id, action, comments[id]);
      setItems(prev => prev.filter(item => item.id !== id));
      toast.success(action === 'APPROVED' ? "تم اعتماد الحركة بنجاح" : "تم رفض الحركة");
    } catch (err: any) {
      toast.error(normalizeError(err).message);
    } finally {
      setProcessingId(null);
    }
  };

  if (membership?.role === UserRole.EMPLOYEE) return null;

  const duplicateKeyCounts = items.reduce((acc, item) => {
    const key = `${item.amount}-${item.category?.id || item.category_id}-${item.creator?.id || item.created_by}`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-end">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">طلبات الاعتماد</h1>
        <button onClick={fetchData} className="p-4 bg-white border border-gray-200 rounded-2xl"><ArrowPathIcon className={`h-6 w-6 ${loading ? 'animate-spin' : ''}`} /></button>
      </div>

      <div className="grid grid-cols-1 gap-8" data-testid="approvals-list">
        {loading ? (
          <Loader message="جاري التحميل..." />
        ) : items.length > 0 ? (
          items.map((item) => {
            const key = `${item.amount}-${item.category?.id || item.category_id}-${item.creator?.id || item.created_by}`;
            const isDuplicate = duplicateKeyCounts[key] > 1;
            const isHighAmount = item.amount >= highAmountThreshold;

            return (
              <div key={item.id} data-testid="approval-item" className="bg-white rounded-[2.5rem] border border-gray-200 shadow-sm overflow-hidden flex flex-col lg:flex-row transition-all hover:shadow-xl">
                <div className="flex-1 p-8 space-y-6">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-black px-4 py-1.5 rounded-full bg-slate-100 uppercase inline-block">{item.type}</span>
                    {isHighAmount && (
                      <span className="text-[10px] font-black px-3 py-1 rounded-full bg-rose-100 text-rose-700">مبلغ مرتفع</span>
                    )}
                    {isDuplicate && (
                      <span className="text-[10px] font-black px-3 py-1 rounded-full bg-amber-100 text-amber-700">اشتباه تكرار</span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-black text-2xl mb-2">{item.category?.name || 'بدون تصنيف'}</h3>
                    <p className="text-sm font-bold text-gray-400">بواسطة: {item.creator?.full_name || 'غير معروف'}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500 font-semibold">
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                      <p className="text-[10px] uppercase tracking-widest text-gray-400">الحساب</p>
                      <p className="text-gray-800 mt-1">{item.account?.name || 'غير محدد'}</p>
                    </div>
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                      <p className="text-[10px] uppercase tracking-widest text-gray-400">تاريخ العملية</p>
                      <p className="text-gray-800 mt-1">{new Date(item.movement_date).toLocaleDateString('ar-SA')}</p>
                    </div>
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                      <p className="text-[10px] uppercase tracking-widest text-gray-400">طريقة الدفع</p>
                      <p className="text-gray-800 mt-1">{item.payment_method || 'غير محدد'}</p>
                    </div>
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                      <p className="text-[10px] uppercase tracking-widest text-gray-400">المرجع / الملاحظات</p>
                      <p className="text-gray-800 mt-1">{item.reference || item.notes || 'لا توجد ملاحظات'}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-slate-50 p-8 lg:w-[420px] flex flex-col justify-between border-r border-gray-100">
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-gray-400">قيمة الطلب</p>
                    <p className="text-4xl font-black">{item.amount.toLocaleString()} ر.س</p>
                  </div>
                  <input data-testid={`approval-comment-${item.id}`} className="w-full py-3 bg-white border border-gray-200 rounded-xl px-4 text-xs font-bold mb-4 outline-none" placeholder="تعليق..." value={comments[item.id] || ''} onChange={e => setComments({...comments, [item.id]: e.target.value})} />
                  <div className="flex gap-3">
                    <button onClick={() => handleAction(item.id, 'APPROVED')} data-testid="approval-approve-btn" disabled={processingId === item.id} className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl text-xs font-black shadow-lg disabled:opacity-50">اعتماد</button>
                    <button onClick={() => handleAction(item.id, 'REJECTED')} disabled={processingId === item.id} className="flex-1 py-4 bg-rose-600 text-white rounded-2xl text-xs font-black shadow-lg disabled:opacity-50">رفض</button>
                    <button onClick={() => navigate(`/movements/${item.id}`)} className="p-4 bg-white border border-gray-200 rounded-2xl"><EyeIcon className="h-5 w-5" /></button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-white rounded-[2.5rem] border border-dashed border-gray-200 p-16 text-center">
            <InboxStackIcon className="h-16 w-16 text-gray-300 mx-auto mb-6" />
            <h3 className="text-xl font-black text-gray-900">لا توجد طلبات معلقة</h3>
            <p className="text-gray-500 mt-2 font-medium">ستظهر طلبات الاعتماد هنا بمجرد إرسال الموظفين لحركات جديدة.</p>
            <button onClick={fetchData} className="mt-6 px-6 py-3 rounded-2xl bg-gray-900 text-white text-xs font-black">تحديث القائمة</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Approvals;
