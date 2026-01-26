
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CashAccount } from '../types';
import { listCashAccounts } from '../services/accounts.service';
import { getExpectedBalance, createDailyClose } from '../services/dailyClose.service';
import { signOut } from '../services/auth.service';
import { normalizeError } from '../lib/errors';
import { logger } from '../lib/logger';
import Alert from '../components/Alert';
import { 
  CalculatorIcon, 
  CheckCircleIcon, 
  ArrowPathIcon, 
  ShieldCheckIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline';

const DailyClose: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [calculating, setCalculating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [accounts, setAccounts] = useState<CashAccount[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    accountId: '',
    date: new Date().toISOString().split('T')[0],
    actualBalance: '',
    expectedBalance: 0,
    note: ''
  });

  const fetchAccounts = async () => {
    try {
      const data = await listCashAccounts();
      setAccounts(data);
    } catch (err: any) {
      const norm = normalizeError(err);
      logger.error('DailyCloseAccounts', err);
      setError(norm.message);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchBalance = async () => {
    if (!formData.accountId || !formData.date) return;
    setCalculating(true);
    setError(null);
    try {
      const balance = await getExpectedBalance(formData.accountId, formData.date);
      setFormData(prev => ({ ...prev, expectedBalance: balance }));
    } catch (err: any) {
      const norm = normalizeError(err);
      logger.error('DailyCloseBalance', err);
      setError(norm.message);
      setStep(1); // العودة للخطوة الأولى في حال فشل الحساب
    } finally {
      setCalculating(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.actualBalance) {
      setError("يرجى إدخال الرصيد الفعلي للمطابقة قبل المتابعة.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await createDailyClose({
        account_id: formData.accountId,
        close_date: formData.date,
        expected_balance: formData.expectedBalance,
        actual_balance: parseFloat(formData.actualBalance),
        note: formData.note
      });
      setStep(3);
    } catch (err: any) {
      const norm = normalizeError(err);
      logger.error('DailyCloseSubmit', err);
      setError(norm.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-32">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">عملية الإقفال اليومي</h1>
          <p className="text-sm text-gray-500 font-bold mt-1 uppercase tracking-widest">تأمين الفترات المحاسبية ومطابقة النقدية</p>
        </div>
        <div className="h-14 w-14 bg-indigo-50 rounded-[1.5rem] flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100">
           <ShieldCheckIcon className="h-8 w-8" />
        </div>
      </div>

      {error && <Alert type="error" title="حدث خطأ في العملية" message={error} className="mb-8" onRetry={step === 1 ? fetchAccounts : undefined} />}

      <div className="bg-white rounded-[3rem] shadow-xl shadow-slate-100 border border-gray-100 overflow-hidden">
        {step === 1 && (
          <div className="p-10 md:p-14 space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest">تاريخ الإقفال</label>
                <input
                  type="date"
                  className="w-full bg-slate-50 border border-gray-200 rounded-2xl px-5 py-4 outline-none font-bold text-gray-800 focus:ring-4 focus:ring-indigo-50 focus:bg-white transition-all"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest">الخزنة / الحساب</label>
                <select 
                  className="w-full bg-slate-50 border border-gray-200 rounded-2xl px-5 py-4 outline-none font-black text-gray-800 focus:ring-4 focus:ring-indigo-50 focus:bg-white transition-all cursor-pointer"
                  value={formData.accountId}
                  onChange={(e) => setFormData({...formData, accountId: e.target.value})}
                >
                  <option value="">اختر حساباً...</option>
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <button 
              onClick={() => { setStep(2); fetchBalance(); }}
              disabled={!formData.accountId || calculating}
              className="w-full bg-gray-900 text-white font-black py-5 rounded-[2rem] hover:bg-black transition-all disabled:opacity-50 shadow-xl shadow-gray-200 flex items-center justify-center gap-3"
            >
              {calculating ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <CalculatorIcon className="h-5 w-5" />}
              بدأ عملية الجرد والمطابقة
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="p-10 md:p-14 space-y-10">
             <div className="flex items-center justify-between border-b border-gray-50 pb-8">
                <div>
                   <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">الحساب المختار</p>
                   <p className="font-black text-lg text-gray-900">{accounts.find(a => a.id === formData.accountId)?.name}</p>
                </div>
                <button onClick={() => setStep(1)} className="text-xs font-black text-indigo-600 hover:bg-indigo-50 px-4 py-2 rounded-xl transition-all">تعديل الإعدادات</button>
             </div>

             <div className="bg-indigo-50 p-10 rounded-[2.5rem] border border-indigo-100 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="text-center md:text-right">
                  <p className="text-xs text-indigo-600 font-black mb-1 uppercase tracking-widest">الرصيد الدفتري المتوقع</p>
                  <p className="text-[10px] text-indigo-400 font-bold">بناءً على حركات السجل حتى {formData.date}</p>
                </div>
                {calculating ? (
                  <ArrowPathIcon className="h-10 w-10 text-indigo-300 animate-spin" />
                ) : (
                  <div className="text-center md:text-left">
                    <span className="text-5xl font-black text-indigo-700 tracking-tighter">{formData.expectedBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    <span className="text-indigo-600 mr-2 font-black uppercase text-sm">ر.س</span>
                  </div>
                )}
             </div>

             <div className="space-y-4">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-3">
                   <BanknotesIcon className="h-5 w-5 text-indigo-600" />
                   الرصيد الفعلي المتوفر في الخزنة
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="w-full bg-slate-50 border-2 border-indigo-100 rounded-[2rem] px-8 py-8 text-4xl font-black text-gray-900 outline-none focus:bg-white focus:ring-8 focus:ring-indigo-50 transition-all text-center md:text-right"
                    value={formData.actualBalance}
                    onChange={(e) => setFormData({...formData, actualBalance: e.target.value})}
                  />
                  <div className="absolute left-10 top-1/2 -translate-y-1/2 text-gray-300 font-black text-xl uppercase tracking-widest pointer-events-none">ر.س</div>
                </div>
             </div>

             <div className="flex flex-col sm:flex-row gap-4">
                <button onClick={() => setStep(1)} className="flex-1 py-5 border border-gray-200 rounded-[2rem] font-black text-sm text-gray-500 hover:bg-gray-50 transition-all">إلغاء العملية</button>
                <button 
                  disabled={submitting || calculating || !formData.actualBalance}
                  onClick={handleSubmit}
                  className="flex-[2] bg-indigo-600 text-white font-black py-5 rounded-[2rem] hover:bg-indigo-700 shadow-2xl shadow-indigo-100 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {submitting ? <ArrowPathIcon className="h-6 w-6 animate-spin" /> : <ShieldCheckIcon className="h-6 w-6" />}
                  تأكيد الجرد وقفل الفترة المحاسبية
                </button>
             </div>
          </div>
        )}

        {step === 3 && (
          <div className="text-center py-24 px-10 space-y-10 animate-in zoom-in duration-500">
            <div className="h-24 w-24 bg-emerald-50 rounded-[2.5rem] flex items-center justify-center mx-auto border border-emerald-100 shadow-xl shadow-emerald-50">
               <CheckCircleIcon className="h-14 w-14 text-emerald-600" />
            </div>
            <div className="space-y-3">
              <h2 className="text-4xl font-black text-gray-900 tracking-tight">تم الإقفال بنجاح!</h2>
              <p className="text-gray-500 font-medium max-w-sm mx-auto">لقد تم تأمين الفترة المحاسبية وتوثيق الرصيد الفعلي بنجاح.</p>
            </div>
            <button 
              onClick={() => navigate('/movements')} 
              className="px-12 py-4 bg-gray-900 text-white rounded-[2rem] font-black shadow-2xl shadow-gray-200 hover:bg-black transition-all"
            >
              العودة لسجل الحركات
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyClose;
