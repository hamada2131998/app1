// =====================================================
// WALLET PAGE - ZERO DEAD BUTTON POLICY
// Full deposit/withdraw/transfer with transaction history
// =====================================================

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { useApp } from '@/contexts/AppContext';
import { toast } from 'sonner';
import { 
  Wallet as WalletIcon, Plus, ArrowDownLeft, ArrowUpRight, 
  RefreshCw, Lock, Send, CreditCard, TrendingUp, TrendingDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type ActionType = 'deposit' | 'withdraw' | 'transfer' | null;

export default function WalletNew() {
  const { 
    walletBalance, transactions, team, profile,
    deposit, withdraw, transfer, formatCurrency, formatDate, currentRole 
  } = useApp();

  const [activeAction, setActiveAction] = useState<ActionType>(null);
  const [amount, setAmount] = useState('');
  const [recipientId, setRecipientId] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isAdmin = currentRole === 'admin' || currentRole === 'accountant';

  const handleAction = () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      toast.error('يرجى إدخال مبلغ صحيح');
      return;
    }

    setSubmitting(true);

    setTimeout(() => {
      switch (activeAction) {
        case 'deposit':
          deposit(numAmount, description || 'إيداع نقدي');
          break;
        case 'withdraw':
          if (numAmount > walletBalance) {
            toast.error('رصيد غير كافي');
            setSubmitting(false);
            return;
          }
          withdraw(numAmount, description || 'سحب نقدي');
          break;
        case 'transfer':
          if (!recipientId) {
            toast.error('يرجى اختيار المستلم');
            setSubmitting(false);
            return;
          }
          if (numAmount > walletBalance) {
            toast.error('رصيد غير كافي');
            setSubmitting(false);
            return;
          }
          transfer(numAmount, recipientId, description);
          break;
      }
      
      setAmount('');
      setDescription('');
      setRecipientId('');
      setActiveAction(null);
      setSubmitting(false);
    }, 300);
  };

  const quickActions = [
    { 
      type: 'deposit' as ActionType, 
      icon: Plus, 
      label: 'إيداع', 
      color: 'from-emerald-500 to-teal-600', 
      shadow: 'shadow-emerald-500/30',
      description: 'إضافة رصيد للمحفظة'
    },
    { 
      type: 'withdraw' as ActionType, 
      icon: ArrowUpRight, 
      label: 'سحب', 
      color: 'from-amber-500 to-orange-600', 
      shadow: 'shadow-amber-500/30',
      description: 'سحب رصيد من المحفظة'
    },
    { 
      type: 'transfer' as ActionType, 
      icon: RefreshCw, 
      label: 'تحويل', 
      color: 'from-blue-500 to-cyan-600', 
      shadow: 'shadow-blue-500/30',
      description: 'تحويل لموظف آخر'
    },
    { 
      type: null as ActionType, 
      icon: Lock, 
      label: 'تجميد', 
      color: 'from-red-500 to-rose-600', 
      shadow: 'shadow-red-500/30',
      description: 'قريباً...'
    },
  ];

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit': return { icon: ArrowDownLeft, color: 'bg-emerald-500/20 text-emerald-400' };
      case 'withdrawal': return { icon: ArrowUpRight, color: 'bg-amber-500/20 text-amber-400' };
      case 'transfer': return { icon: Send, color: 'bg-blue-500/20 text-blue-400' };
      case 'expense_settlement': return { icon: CreditCard, color: 'bg-violet-500/20 text-violet-400' };
      default: return { icon: CreditCard, color: 'bg-slate-500/20 text-slate-400' };
    }
  };

  const totalDeposits = transactions
    .filter(t => t.type === 'deposit')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalWithdrawals = transactions
    .filter(t => t.type !== 'deposit')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white">المحفظة</h1>
          <p className="text-slate-400">إدارة الرصيد والتحويلات</p>
        </div>

        {/* Balance Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 p-8 shadow-2xl shadow-violet-500/30"
        >
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative flex items-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-xl flex items-center justify-center shadow-lg">
              <WalletIcon className="w-10 h-10 text-white" />
            </div>
            <div>
              <p className="text-violet-200 text-sm mb-1">رصيدك الحالي</p>
              <p className="text-4xl font-bold text-white">{formatCurrency(walletBalance)}</p>
              <p className="text-violet-200 text-xs mt-1">متاح للتحويل والسحب</p>
            </div>
          </div>

          {/* Mini stats */}
          <div className="relative mt-6 grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-white/10 backdrop-blur-sm p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/30 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-300" />
              </div>
              <div>
                <p className="text-xs text-violet-200">إجمالي الإيداعات</p>
                <p className="text-lg font-bold text-white">{formatCurrency(totalDeposits)}</p>
              </div>
            </div>
            <div className="rounded-xl bg-white/10 backdrop-blur-sm p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-500/30 flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-red-300" />
              </div>
              <div>
                <p className="text-xs text-violet-200">إجمالي المسحوبات</p>
                <p className="text-lg font-bold text-white">{formatCurrency(totalWithdrawals)}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <motion.button
              key={action.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => action.type !== null ? setActiveAction(action.type) : toast.info('هذه الميزة قريباً')}
              disabled={!isAdmin && action.type !== 'deposit'}
              className={`rounded-2xl bg-[#1e293b]/40 backdrop-blur-xl border border-white/[0.08] p-6 hover:-translate-y-1 transition-all duration-300 group text-right ${
                !isAdmin && action.type !== 'deposit' ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-4 shadow-lg ${action.shadow} group-hover:scale-110 transition-transform`}>
                <action.icon className="w-7 h-7 text-white" />
              </div>
              <p className="text-white font-medium">{action.label}</p>
              <p className="text-xs text-slate-500 mt-1">{action.description}</p>
            </motion.button>
          ))}
        </div>

        {/* Transaction History */}
        <div className="rounded-3xl bg-[#1e293b]/40 backdrop-blur-xl border border-white/[0.08] p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-violet-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">سجل العمليات</h3>
              <p className="text-sm text-slate-500">آخر {transactions.length} عملية</p>
            </div>
          </div>

          {transactions.length === 0 ? (
            <div className="text-center py-12">
              <WalletIcon className="w-16 h-16 mx-auto mb-4 text-slate-600" />
              <p className="text-slate-400">لا توجد عمليات حتى الآن</p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {transactions.map((transaction, index) => {
                  const { icon: TransIcon, color } = getTransactionIcon(transaction.type);
                  const isPositive = transaction.type === 'deposit';
                  
                  return (
                    <motion.div
                      key={transaction.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.05 }}
                      className={`flex items-center justify-between p-4 rounded-xl border transition-all hover:bg-white/[0.02] ${
                        isPositive 
                          ? 'bg-emerald-500/5 border-emerald-500/20' 
                          : 'bg-white/[0.02] border-white/[0.05]'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
                          <TransIcon className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="font-medium text-white">{transaction.description}</p>
                          <p className="text-sm text-slate-500">{formatDate(transaction.created_at)}</p>
                        </div>
                      </div>
                      <div className="text-left">
                        <p className={`font-bold text-xl ${isPositive ? 'text-emerald-400' : 'text-white'}`}>
                          {isPositive ? '+' : '-'}{formatCurrency(transaction.amount)}
                        </p>
                        <p className="text-xs text-slate-500">
                          الرصيد: {formatCurrency(transaction.balance_after)}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Action Dialog */}
        <Dialog open={activeAction !== null} onOpenChange={() => setActiveAction(null)}>
          <DialogContent className="bg-[#1e293b]/95 backdrop-blur-2xl border-white/[0.08] rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-white">
                {activeAction === 'deposit' && 'إيداع رصيد'}
                {activeAction === 'withdraw' && 'سحب رصيد'}
                {activeAction === 'transfer' && 'تحويل رصيد'}
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                {activeAction === 'deposit' && 'أدخل المبلغ المراد إيداعه'}
                {activeAction === 'withdraw' && 'أدخل المبلغ المراد سحبه'}
                {activeAction === 'transfer' && 'أدخل بيانات التحويل'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Current Balance Preview */}
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">الرصيد الحالي</span>
                  <span className="text-white font-bold">{formatCurrency(walletBalance)}</span>
                </div>
                {amount && parseFloat(amount) > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="flex justify-between items-center mt-2 pt-2 border-t border-white/[0.08]"
                  >
                    <span className="text-slate-400">الرصيد بعد العملية</span>
                    <span className={`font-bold ${
                      activeAction === 'deposit' ? 'text-emerald-400' : 'text-amber-400'
                    }`}>
                      {formatCurrency(
                        activeAction === 'deposit' 
                          ? walletBalance + parseFloat(amount) 
                          : walletBalance - parseFloat(amount)
                      )}
                    </span>
                  </motion.div>
                )}
              </div>

              {/* Recipient (for transfer) */}
              {activeAction === 'transfer' && (
                <div className="space-y-2">
                  <Label className="text-slate-300">المستلم</Label>
                  <Select value={recipientId} onValueChange={setRecipientId}>
                    <SelectTrigger className="bg-white/[0.05] border-white/[0.08] text-white rounded-xl">
                      <SelectValue placeholder="اختر الموظف" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700 z-50">
                      {team.filter(m => m.id !== profile.id && m.status === 'active').map((member) => (
                        <SelectItem key={member.id} value={member.id} className="text-white">
                          {member.name} - {member.department}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Amount */}
              <div className="space-y-2">
                <Label className="text-slate-300">المبلغ (ريال)</Label>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  min="1"
                  className="bg-white/[0.05] border-white/[0.08] text-white rounded-xl text-lg"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label className="text-slate-300">الوصف (اختياري)</Label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="مثال: تمويل مشروع..."
                  className="bg-white/[0.05] border-white/[0.08] text-white rounded-xl"
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button 
                variant="outline" 
                onClick={() => { setAmount(''); setDescription(''); setRecipientId(''); setActiveAction(null); }}
                className="border-white/[0.08] text-slate-300 hover:bg-white/[0.05] rounded-xl"
              >
                إلغاء
              </Button>
              <Button
                onClick={handleAction}
                disabled={submitting || !amount}
                className={`rounded-xl ${
                  activeAction === 'deposit' 
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600' 
                    : activeAction === 'withdraw'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-600'
                    : 'bg-gradient-to-r from-blue-500 to-cyan-600'
                }`}
              >
                {submitting ? 'جاري التنفيذ...' : 'تأكيد'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
