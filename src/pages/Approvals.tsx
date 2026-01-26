
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MovementStatus, CashMovement, UserRole } from '../types';
import { listPendingMovements, processApproval } from '../services/approvals.service';
import { signOut } from '../services/auth.service';
import { useAuth } from '../hooks/useAuth';
import { normalizeError } from '../lib/errors';
import { toast } from '../lib/toast';
import Loader from '../components/Loader';
import Alert from '../components/Alert';
import { 
  CheckIcon, 
  XMarkIcon, 
  EyeIcon, 
  ArrowPathIcon,
  InboxStackIcon,
  ChatBubbleBottomCenterTextIcon
} from '@heroicons/react/24/outline';

const Approvals: React.FC = () => {
  const navigate = useNavigate();
  const { membership } = useAuth();
  
  const [items, setItems] = useState<CashMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, string>>({});

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

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-end">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">طلبات الاعتماد</h1>
        <button onClick={fetchData} className="p-4 bg-white border border-gray-200 rounded-2xl"><ArrowPathIcon className={`h-6 w-6 ${loading ? 'animate-spin' : ''}`} /></button>
      </div>

      <div className="grid grid-cols-1 gap-8" data-testid="approvals-list">
        {loading ? <Loader message="جاري التحميل..." /> : items.length > 0 ? items.map((item) => (
          <div key={item.id} data-testid="approval-item" className="bg-white rounded-[2.5rem] border border-gray-200 shadow-sm overflow-hidden flex flex-col lg:flex-row transition-all hover:shadow-xl">
            <div className="flex-1 p-8">
              <span className="text-[10px] font-black px-4 py-1.5 rounded-full bg-slate-100 uppercase mb-4 inline-block">{item.type}</span>
              <h3 className="font-black text-2xl mb-4">{item.category?.name}</h3>
              <p className="text-sm font-bold text-gray-400">بواسطة: {item.creator?.full_name}</p>
            </div>
            <div className="bg-slate-50 p-8 lg:w-[400px] flex flex-col justify-between border-r border-gray-100">
               <p className="text-4xl font-black mb-6">{item.amount.toLocaleString()} ر.س</p>
               <input data-testid={`approval-comment-${item.id}`} className="w-full py-3 bg-white border border-gray-200 rounded-xl px-4 text-xs font-bold mb-4 outline-none" placeholder="تعليق..." value={comments[item.id] || ''} onChange={e => setComments({...comments, [item.id]: e.target.value})} />
               <div className="flex gap-3">
                  <button onClick={() => handleAction(item.id, 'APPROVED')} data-testid="approval-approve-btn" className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl text-xs font-black shadow-lg">اعتماد</button>
                  <button onClick={() => navigate(`/movements/${item.id}`)} className="p-4 bg-white border border-gray-200 rounded-2xl"><EyeIcon className="h-5 w-5" /></button>
               </div>
            </div>
          </div>
        )) : <Alert type="info" message="لا توجد طلبات معلقة" />}
      </div>
    </div>
  );
};

export default Approvals;
