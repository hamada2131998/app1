
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { UserRole, Custody } from '../types';
import { listCustodies, processCustodyTx } from '../services/custody.service';
import { normalizeError } from '../lib/errors';
import { logger } from '../lib/logger';
import { toast } from '../lib/toast';
import { signOut } from '../services/auth.service';
import Alert from '../components/Alert';
import Loader from '../components/Loader';
import { 
  UserIcon, 
  ArrowPathIcon,
  PlusCircleIcon,
  MinusCircleIcon,
  CheckBadgeIcon,
  XMarkIcon,
  InformationCircleIcon,
  WalletIcon
} from '@heroicons/react/24/outline';

const CustodyPage: React.FC = () => {
  const navigate = useNavigate();
  const { membership } = useAuth();
  const [custodies, setCustodies] = useState<Custody[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedCustody, setSelectedCustody] = useState<Custody | null>(null);
  const [showTxModal, setShowTxModal] = useState(false);
  const [txType, setTxType] = useState<'ISSUE' | 'SPEND' | 'RETURN' | 'SETTLEMENT'>('SPEND');
  const [txAmount, setTxAmount] = useState('');
  const [txNotes, setTxNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listCustodies();
      setCustodies(data);
    } catch (err: any) {
      const norm = normalizeError(err);
      logger.error('CustodyList', err);
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
  }, []);

  const handleTxSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustody || !txAmount) return;
    setSubmitting(true);
    try {
      await processCustodyTx({
        custody_id: selectedCustody.id,
        type: txType,
        amount: parseFloat(txAmount),
        notes: txNotes
      });
      toast.success("تمت العملية بنجاح");
      setShowTxModal(false);
      setTxAmount('');
      setTxNotes('');
      await fetchData();
    } catch (err: any) {
      const norm = normalizeError(err);
      logger.error('CustodyTx', err);
      toast.error(norm.message);
    } finally {
      setSubmitting(false);
    }
  };

  const isAccountant = membership?.role === UserRole.OWNER || membership?.role === UserRole.ACCOUNTANT;

  return (
    <div className="space-y-10 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">إدارة العُهد النقدية</h1>
          <p className="text-sm text-gray-500 font-bold mt-1 uppercase tracking-widest">تتبع مصروفات الموظفين والعهد النثرية</p>
        </div>
        <button 
          onClick={fetchData} 
          disabled={loading}
          className="p-4 bg-white border border-gray-200 text-gray-400 rounded-2xl hover:text-indigo-600 transition-all shadow-sm"
        >
          <ArrowPathIcon className={`h-6 w-6 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && <Alert type="error" title="حدث خطأ في تحميل البيانات" message={error} className="mb-8" onRetry={fetchData} />}

      {loading && custodies.length === 0 ? (
        <Loader message="جاري جلب بيانات العهد والأرصدة الحالية..." />
      ) : custodies.length === 0 ? (
        <div className="bg-white rounded-[3rem] border-2 border-dashed border-gray-200 p-24 text-center">
           <WalletIcon className="h-16 w-16 text-gray-300 mx-auto mb-6" />
           <h3 className="text-xl font-black text-gray-900">لا توجد عهد نشطة</h3>
           <p className="text-gray-500 mt-2 font-medium">ابدأ بتعريف أول عهدة من خلال إعدادات الموظفين.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {custodies.map((item) => (
            <div key={item.id} className="bg-white rounded-[3rem] border border-gray-100 shadow-sm p-10 space-y-8 hover:shadow-2xl hover:shadow-indigo-50 transition-all group relative overflow-hidden">
              <div className="absolute top-0 right-0 h-1.5 w-full bg-indigo-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-right"></div>
              <div className="flex items-center justify-between">
                <div className="p-4 bg-indigo-50 rounded-2xl shadow-sm border border-indigo-100 text-indigo-600">
                  <UserIcon className="h-8 w-8" />
                </div>
                <span className={`text-[10px] px-4 py-1.5 rounded-full font-black uppercase tracking-widest ${item.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                  {item.is_active ? 'نشطة' : 'متوقفة'}
                </span>
              </div>
              <div>
                <h3 className="font-black text-gray-900 text-2xl tracking-tight">{(item as any).employee?.full_name}</h3>
                <p className="text-xs text-gray-400 font-bold mt-1 uppercase tracking-widest">{item.name}</p>
              </div>
              <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                <p className="text-[10px] text-gray-400 font-black mb-2 uppercase tracking-widest">الرصيد المتاح حالياً</p>
                <div className="flex items-baseline gap-2">
                  <span className="font-black text-4xl text-indigo-700 tracking-tighter">{(item.current_balance || 0).toLocaleString()}</span>
                  <span className="text-xs font-black text-indigo-300 uppercase">ر.س</span>
                </div>
              </div>
              {isAccountant && (
                <div className="pt-2 flex gap-3">
                  <button 
                    onClick={() => { setSelectedCustody(item); setTxType('ISSUE'); setShowTxModal(true); }} 
                    className="flex-1 py-4 bg-indigo-600 text-white text-xs font-black rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                  >
                    <PlusCircleIcon className="h-5 w-5" /> تغذية
                  </button>
                  <button 
                    onClick={() => { setSelectedCustody(item); setTxType('SPEND'); setShowTxModal(true); }} 
                    className="flex-1 py-4 bg-white border border-rose-200 text-rose-600 text-xs font-black rounded-2xl hover:bg-rose-50 transition-all flex items-center justify-center gap-2"
                  >
                    <MinusCircleIcon className="h-5 w-5" /> صرف
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showTxModal && selectedCustody && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-10 border-b border-gray-50 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-xl font-black text-gray-900">معاملة عهدة جديدة</h3>
              <button onClick={() => setShowTxModal(false)} className="p-3 hover:bg-white rounded-2xl transition-all shadow-sm"><XMarkIcon className="h-6 w-6 text-gray-400" /></button>
            </div>
            <form onSubmit={handleTxSubmit} className="p-10 space-y-8">
              <div className="flex bg-slate-100 p-1.5 rounded-2xl">
                <button type="button" onClick={() => setTxType('ISSUE')} className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${txType === 'ISSUE' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-400'}`}>تغذية العهدة (+)</button>
                <button type="button" onClick={() => setTxType('SPEND')} className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${txType === 'SPEND' ? 'bg-white text-rose-700 shadow-sm' : 'text-gray-400'}`}>صرف مصروفات (-)</button>
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] text-gray-400 font-black uppercase tracking-widest">المبلغ المطلوب</label>
                <div className="relative">
                  <input 
                    type="number" 
                    required 
                    step="0.01" 
                    placeholder="0.00"
                    className="w-full bg-slate-50 border-2 border-gray-100 rounded-2xl px-8 py-6 text-4xl font-black outline-none focus:ring-8 focus:ring-indigo-50 focus:border-indigo-200 transition-all text-center md:text-right" 
                    value={txAmount} 
                    onChange={(e) => setTxAmount(e.target.value)} 
                  />
                  <span className="absolute left-8 top-1/2 -translate-y-1/2 font-black text-gray-300 text-xl tracking-widest">ر.س</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] text-gray-400 font-black uppercase tracking-widest">ملاحظات العملية</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-50 border border-gray-200 rounded-2xl px-6 py-4 text-sm font-bold outline-none" 
                  placeholder="وصف مختصر للعملية..."
                  value={txNotes}
                  onChange={(e) => setTxNotes(e.target.value)}
                />
              </div>
              <button 
                disabled={submitting || !txAmount} 
                className={`w-full py-5 rounded-2xl font-black text-white shadow-2xl transition-all flex items-center justify-center gap-3 disabled:opacity-50 ${txType === 'ISSUE' ? 'bg-indigo-600 shadow-indigo-100' : 'bg-rose-600 shadow-rose-100'}`}
              >
                {submitting ? <ArrowPathIcon className="h-6 w-6 animate-spin" /> : <CheckBadgeIcon className="h-6 w-6" />} 
                تأكيد العملية وترحيلها
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustodyPage;
