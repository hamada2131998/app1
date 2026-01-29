import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { MOCK_EMPLOYEES, MOCK_TRANSFERS, MOCK_PROFILE } from '@/data/mockData';
import { toast } from 'sonner';
import { Wallet as WalletIcon, Send, ArrowDownLeft, ArrowUpRight, Plus, CreditCard, RefreshCw, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

interface Employee {
  id: string;
  full_name: string;
  wallet_balance: number;
}

interface Transfer {
  id: string;
  amount: number;
  created_at: string;
  sender_id: string;
  receiver_id: string;
  sender?: { full_name: string };
  receiver?: { full_name: string };
}

export default function Wallet() {
  const { profile } = useAuth();
  const { role } = useCompany();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [walletBalance, setWalletBalance] = useState(MOCK_PROFILE.wallet_balance);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [transferData, setTransferData] = useState({
    receiver_id: '',
    amount: '',
  });

  const isAdmin = role === 'company_owner' || role === 'finance_manager' || role === 'accountant';

  useEffect(() => {
    const timer = setTimeout(() => {
      setEmployees(MOCK_EMPLOYEES);
      setTransfers(MOCK_TRANSFERS);
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const amount = parseFloat(transferData.amount);
    if (amount <= 0) {
      toast.error('يجب أن يكون المبلغ أكبر من صفر');
      return;
    }

    if (amount > walletBalance) {
      toast.error('رصيد المحفظة غير كافي');
      return;
    }

    setSubmitting(true);

    setTimeout(() => {
      const receiver = employees.find(e => e.id === transferData.receiver_id);
      const newTransfer: Transfer = {
        id: 'trans-' + Date.now(),
        amount: amount,
        created_at: new Date().toISOString(),
        sender_id: profile?.id || MOCK_PROFILE.id,
        receiver_id: transferData.receiver_id,
        sender: { full_name: profile?.full_name || MOCK_PROFILE.full_name },
        receiver: { full_name: receiver?.full_name || 'موظف' },
      };

      setTransfers([newTransfer, ...transfers]);
      setWalletBalance(prev => prev - amount);
      toast.success('تم التحويل بنجاح');
      setTransferData({ receiver_id: '', amount: '' });
      setSubmitting(false);
    }, 500);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  // Quick Action buttons
  const quickActions = [
    { icon: Plus, label: 'إيداع', color: 'from-emerald-500 to-teal-600', shadow: 'shadow-emerald-500/30' },
    { icon: ArrowUpRight, label: 'سحب', color: 'from-amber-500 to-orange-600', shadow: 'shadow-amber-500/30' },
    { icon: RefreshCw, label: 'تحويل', color: 'from-blue-500 to-cyan-600', shadow: 'shadow-blue-500/30' },
    { icon: Lock, label: 'تجميد', color: 'from-red-500 to-rose-600', shadow: 'shadow-red-500/30' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white">المحفظة</h1>
          <p className="text-slate-400">إدارة الرصيد والتحويلات</p>
        </div>

        {/* Balance Card */}
        <div className="rounded-[2rem] bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 p-8 shadow-2xl shadow-violet-500/30">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-xl flex items-center justify-center shadow-lg">
              <WalletIcon className="w-10 h-10 text-white" />
            </div>
            <div>
              <p className="text-violet-200 text-sm mb-1">رصيدك الحالي</p>
              <p className="text-4xl font-bold text-white">{formatCurrency(walletBalance)}</p>
              <p className="text-violet-200 text-xs mt-1">متاح للتحويل والسحب</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <motion.button
              key={action.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`rounded-2xl bg-[#1e293b]/40 backdrop-blur-2xl border border-white/[0.08] p-6 hover:-translate-y-1 transition-all duration-300 group`}
            >
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-4 shadow-lg ${action.shadow} group-hover:scale-110 transition-transform`}>
                <action.icon className="w-7 h-7 text-white" />
              </div>
              <p className="text-white font-medium">{action.label}</p>
            </motion.button>
          ))}
        </div>

        {/* Transfer Form */}
        {isAdmin && (
          <div className="rounded-[2rem] bg-[#1e293b]/40 backdrop-blur-2xl border border-white/[0.08] p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Send className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">تحويل رصيد</h3>
                <p className="text-sm text-slate-500">تحويل إلى محفظة موظف آخر</p>
              </div>
            </div>
            
            <form onSubmit={handleTransfer} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">الموظف المستلم</Label>
                  <Select
                    value={transferData.receiver_id}
                    onValueChange={(value) => setTransferData({ ...transferData, receiver_id: value })}
                  >
                    <SelectTrigger className="bg-white/[0.05] border-white/[0.08] text-white rounded-xl">
                      <SelectValue placeholder="اختر الموظف" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {employees.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id} className="text-white">
                          <div className="flex justify-between items-center gap-4">
                            <span>{emp.full_name}</span>
                            <span className="text-slate-400 text-sm">{formatCurrency(emp.wallet_balance)}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">المبلغ (ريال)</Label>
                  <Input
                    type="number"
                    value={transferData.amount}
                    onChange={(e) => setTransferData({ ...transferData, amount: e.target.value })}
                    placeholder="0"
                    min="1"
                    className="bg-white/[0.05] border-white/[0.08] text-white rounded-xl"
                  />
                </div>
              </div>
              <Button
                type="submit"
                disabled={submitting || !transferData.receiver_id || !transferData.amount}
                className="w-full md:w-auto bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-lg shadow-blue-500/30 rounded-xl"
              >
                <Send className="w-4 h-4 ml-2" />
                {submitting ? 'جاري التحويل...' : 'تحويل المبلغ'}
              </Button>
            </form>
          </div>
        )}

        {/* Transfer History */}
        <div className="rounded-[2rem] bg-[#1e293b]/40 backdrop-blur-2xl border border-white/[0.08] p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-violet-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">سجل التحويلات</h3>
              <p className="text-sm text-slate-500">آخر العمليات المالية</p>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-white/[0.02] animate-pulse rounded-xl" />
              ))}
            </div>
          ) : transfers.length === 0 ? (
            <div className="text-center py-12">
              <WalletIcon className="w-16 h-16 mx-auto mb-4 text-slate-600" />
              <p className="text-slate-400">لا توجد تحويلات حتى الآن</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transfers.map((transfer, index) => {
                const isReceived = transfer.receiver_id === (profile?.id || MOCK_PROFILE.id);
                return (
                  <motion.div
                    key={transfer.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                      isReceived 
                        ? 'bg-emerald-500/5 border-emerald-500/20 hover:bg-emerald-500/10' 
                        : 'bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.05]'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        isReceived 
                          ? 'bg-emerald-500/20 shadow-lg shadow-emerald-500/20' 
                          : 'bg-violet-500/20 shadow-lg shadow-violet-500/20'
                      }`}>
                        {isReceived ? (
                          <ArrowDownLeft className="w-6 h-6 text-emerald-400" />
                        ) : (
                          <ArrowUpRight className="w-6 h-6 text-violet-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-white">
                          {isReceived ? 'استلام من' : 'تحويل إلى'}{' '}
                          {isReceived ? transfer.sender?.full_name : transfer.receiver?.full_name}
                        </p>
                        <p className="text-sm text-slate-500">{formatDate(transfer.created_at)}</p>
                      </div>
                    </div>
                    <p className={`font-bold text-xl ${isReceived ? 'text-emerald-400' : 'text-white'}`}>
                      {isReceived ? '+' : '-'}{formatCurrency(transfer.amount)}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
