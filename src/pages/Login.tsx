
import React, { useState } from 'react';
import { signIn } from '../services/auth.service';
import { useAuth } from '../hooks/useAuth';
import { normalizeError } from '../lib/errors';
import Alert from '../components/Alert';
import { WalletIcon, InformationCircleIcon, ArrowRightIcon, CommandLineIcon } from '@heroicons/react/24/solid';

const Login: React.FC = () => {
  const { envError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (envError) return;
    
    setLoading(true);
    setError(null);
    try {
      await signIn(email, password);
    } catch (err: any) {
      const normalized = normalizeError(err);
      setError(normalized.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    setEmail('owner@example.com');
    setPassword('demo1234');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-5">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600 rounded-full blur-[120px]"></div>
      </div>

      <div className="max-w-md w-full z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center h-20 w-20 rounded-[2rem] bg-indigo-600 text-white shadow-2xl shadow-indigo-200 mb-6 rotate-3">
            <WalletIcon className="h-12 w-12" />
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Cash & Custody</h1>
          <p className="text-slate-500 mt-2 font-medium">نظام إدارة الكاش والعهد الذكي للمنشآت</p>
        </div>

        <div className="bg-white rounded-[2rem] shadow-2xl shadow-slate-200 border border-slate-100 p-10">
          {envError ? (
            <div className="space-y-6">
              <Alert 
                type="warning" 
                title="إعدادات Supabase غير مكتملة" 
                message="التطبيق لا يستطيع الاتصال بقاعدة البيانات. يرجى تهيئة ملف .env ببيانات مشروعك." 
              />
              <button disabled className="w-full bg-slate-200 text-slate-400 font-black py-4 px-6 rounded-2xl cursor-not-allowed">
                تم تعطيل الدخول لغياب الإعدادات
              </button>
            </div>
          ) : (
            <>
              {error && <Alert type="error" message={error} className="mb-6" />}

              <div className="mb-8 bg-indigo-50 border border-indigo-100 p-4 rounded-2xl flex items-start gap-3">
                <InformationCircleIcon className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
                <div className="text-right">
                  <p className="text-xs font-bold text-indigo-900 mb-1">بيانات الدخول التجريبية (Demo):</p>
                  <p className="text-[11px] text-indigo-700 font-medium">الحساب: <span className="font-bold">owner@example.com</span></p>
                  <p className="text-[11px] text-indigo-700 font-medium">السر: <span className="font-bold">demo1234</span></p>
                  <button 
                    type="button"
                    onClick={handleDemoLogin}
                    className="mt-2 text-[10px] font-black bg-white text-indigo-600 px-3 py-1 rounded-full shadow-sm border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all flex items-center gap-1"
                  >
                    تعبئة تلقائية للمالك
                    <ArrowRightIcon className="h-2.5 w-2.5 rotate-180" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">البريد الإلكتروني</label>
                  <input
                    data-testid="login-email"
                    type="email"
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 focus:ring-4 focus:ring-indigo-50 focus:bg-white focus:border-indigo-600 transition-all outline-none text-slate-900"
                    placeholder="owner@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-bold text-slate-700">كلمة المرور</label>
                  </div>
                  <input
                    data-testid="login-password"
                    type="password"
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 focus:ring-4 focus:ring-indigo-50 focus:bg-white focus:border-indigo-600 transition-all outline-none text-slate-900"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <button
                  data-testid="login-submit"
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 text-white font-black py-5 px-6 rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 disabled:opacity-50 text-lg"
                >
                  {loading ? 'جاري التحقق...' : 'دخول للنظام'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
