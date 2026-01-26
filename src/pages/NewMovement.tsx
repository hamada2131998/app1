
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MovementType, MovementStatus, CashAccount, Category, CategoryKind } from '../types';
import { listCategories } from '../services/categories.service';
import { listCashAccounts } from '../services/accounts.service';
import { createMovement } from '../services/movements.service';
import { signOut } from '../services/auth.service';
import { useAuth } from '../hooks/useAuth';
import { normalizeError } from '../lib/errors';
import { toast } from '../lib/toast';
import Loader from '../components/Loader';
import Alert from '../components/Alert';
import { 
  ArrowRightIcon, 
  CheckCircleIcon,
  ArrowPathIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

const NewMovement: React.FC = () => {
  const navigate = useNavigate();
  const { membership, session } = useAuth();
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<CashAccount[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    type: MovementType.OUT,
    accountId: '',
    categoryId: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    reference: '',
    paymentMethod: 'CASH'
  });

  const fetchData = async () => {
    setLoadingData(true);
    setError(null);
    try {
      const [cats, accs] = await Promise.all([
        listCategories(),
        listCashAccounts()
      ]);
      setCategories(cats);
      setAccounts(accs);
    } catch (err: any) {
      const norm = normalizeError(err);
      if (norm.isAuthExpired) {
        await signOut();
        navigate('/login');
      } else {
        setError(norm.message);
      }
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [navigate]);

  const filteredCategories = categories.filter(c => 
    formData.type === MovementType.IN ? c.kind === CategoryKind.INCOME : c.kind === CategoryKind.EXPENSE
  );

  const handleSubmit = async (e: React.FormEvent, status: MovementStatus) => {
    e.preventDefault();
    if (!membership || !session) return;

    if (!formData.accountId || !formData.categoryId || !formData.amount || !formData.date) {
      setError("يرجى إكمال جميع الحقول المطلوبة");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        account_id: formData.accountId,
        category_id: formData.categoryId,
        type: formData.type,
        amount: parseFloat(formData.amount),
        movement_date: formData.date,
        notes: formData.notes,
        reference: formData.reference,
        payment_method: formData.paymentMethod,
        status: status
      };

      const newId = await createMovement(payload);
      toast.success(status === MovementStatus.SUBMITTED ? "تم إرسال الحركة للاعتماد بنجاح" : "تم حفظ المسودة بنجاح");
      navigate(`/movements/${newId}`);
    } catch (err: any) {
      const norm = normalizeError(err);
      if (norm.isAuthExpired) {
        await signOut();
        navigate('/login');
      } else {
        setError(norm.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingData) return <Loader message="جاري تجهيز النماذج..." />;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
          <ArrowRightIcon className="h-5 w-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">إضافة حركة كاش جديدة</h1>
        </div>
      </div>

      <form className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-8 space-y-8">
          <div className="flex bg-gray-100 p-1.5 rounded-2xl">
            <button type="button" onClick={() => setFormData({...formData, type: MovementType.OUT})} className={`flex-1 py-3 text-sm font-black rounded-xl transition-all ${formData.type === MovementType.OUT ? 'bg-white text-rose-600 shadow-sm' : 'text-gray-500'}`}>صرف (-)</button>
            <button type="button" onClick={() => setFormData({...formData, type: MovementType.IN})} className={`flex-1 py-3 text-sm font-black rounded-xl transition-all ${formData.type === MovementType.IN ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500'}`}>قبض (+)</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">الحساب</label>
              <select className="w-full bg-slate-50 border border-gray-200 rounded-2xl px-5 py-4 outline-none font-bold" value={formData.accountId} onChange={(e) => setFormData({...formData, accountId: e.target.value})}>
                <option value="">اختر حساباً...</option>
                {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">التصنيف</label>
              <select className="w-full bg-slate-50 border border-gray-200 rounded-2xl px-5 py-4 outline-none font-bold" value={formData.categoryId} onChange={(e) => setFormData({...formData, categoryId: e.target.value})}>
                <option value="">اختر تصنيفاً...</option>
                {filteredCategories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">المبلغ</label>
              <input type="number" step="0.01" className="w-full bg-slate-50 border border-gray-200 rounded-2xl px-5 py-4 font-black text-3xl" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">التاريخ</label>
              <input type="date" className="w-full bg-slate-50 border border-gray-200 rounded-2xl px-5 py-4 font-bold" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} />
            </div>
          </div>
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">ملاحظات</label>
            <textarea rows={3} className="w-full bg-slate-50 border border-gray-200 rounded-3xl px-6 py-4 font-medium italic outline-none" value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} />
          </div>
        </div>

        <div className="px-8 py-8 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row justify-end gap-4 items-center">
          <div className="hidden sm:flex items-center gap-2 text-indigo-600 font-bold text-[10px] ml-auto">
             <InformationCircleIcon className="h-4 w-4" />
             سيتم إرسال الحركة للمحاسب للاعتماد فور الضغط على الزر الأزرق
          </div>
          <button type="button" data-testid="movement-draft-btn" disabled={submitting} onClick={(e) => handleSubmit(e, MovementStatus.DRAFT)} className="w-full sm:w-auto px-8 py-4 bg-white border border-gray-200 text-gray-900 rounded-2xl text-sm font-black hover:shadow-lg transition-all">حفظ كمسودة</button>
          <button type="button" data-testid="movement-submit-btn" disabled={submitting} onClick={(e) => handleSubmit(e, MovementStatus.SUBMITTED)} className="w-full sm:w-auto px-10 py-4 bg-indigo-600 text-white rounded-2xl text-sm font-black hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all flex items-center justify-center gap-3">
            {submitting ? <ArrowPathIcon className="h-6 w-6 animate-spin" /> : <CheckCircleIcon className="h-6 w-6" />}
            إرسال للاعتماد
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewMovement;
