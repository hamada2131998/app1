import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { ArrowUpRight, ArrowDownLeft, Clock, Activity, ChevronLeft } from 'lucide-react';

export type RecentActivityItem = {
  id: string;
  description: string;
  project?: string;
  amount: number; // positive for IN, negative for OUT
  status: 'completed' | 'pending';
  date: string; // YYYY-MM-DD
};

const fallbackTransactions: RecentActivityItem[] = [
  {
    id: '1',
    description: 'مستلزمات مكتبية',
    project: 'برج الرياض',
    amount: -2500,
    status: 'completed',
    date: '2025-01-21',
  },
  {
    id: '2',
    description: 'تحويل رصيد',
    project: 'مجمع جدة السكني',
    amount: 15000,
    status: 'completed',
    date: '2025-01-20',
  },
  {
    id: '3',
    description: 'معدات بناء',
    project: 'برج الرياض',
    amount: -8750,
    status: 'pending',
    date: '2025-01-20',
  },
  {
    id: '4',
    description: 'رواتب العمال',
    project: 'مركز الدمام التجاري',
    amount: -45000,
    status: 'completed',
    date: '2025-01-19',
  },
  {
    id: '5',
    description: 'دفعة مقدمة',
    project: 'فيلا الخبر',
    amount: 25000,
    status: 'pending',
    date: '2025-01-18',
  },
];

export function RecentActivityTable({ items }: { items?: RecentActivityItem[] }) {
  const recentTransactions = items && items.length ? items : fallbackTransactions;
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
    }).format(Math.abs(amount));
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ar-SA', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="relative rounded-2xl bg-[hsl(0_0%_100%_/_0.03)] backdrop-blur-xl border border-white/[0.08] p-6 overflow-hidden"
    >
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-48 h-48 bg-gradient-to-br from-primary/5 to-transparent rounded-full blur-3xl" />
      
      {/* Header */}
      <div className="relative flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow"
          >
            <Activity className="w-5 h-5 text-white" />
          </motion.div>
          <div>
            <h3 className="text-base font-bold text-white">آخر المعاملات</h3>
            <p className="text-xs text-slate-500">أحدث 5 معاملات</p>
          </div>
        </div>
        <motion.button 
          whileHover={{ x: -4 }}
          className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors font-medium"
        >
          <span>عرض الكل</span>
          <ChevronLeft className="w-4 h-4" />
        </motion.button>
      </div>

      {/* Transactions List */}
      <div className="relative space-y-2">
        {recentTransactions.map((tx, index) => (
          <motion.div
            key={tx.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.5 + index * 0.08 }}
            whileHover={{ scale: 1.01, backgroundColor: 'hsl(0 0% 100% / 0.03)' }}
            className="group flex items-center justify-between p-4 rounded-xl border border-white/[0.04] hover:border-white/[0.08] transition-all duration-300 cursor-pointer"
          >
            <div className="flex items-center gap-4">
              {/* Transaction Icon */}
              <motion.div 
                whileHover={{ scale: 1.1 }}
                className={`w-11 h-11 rounded-xl flex items-center justify-center relative ${
                  tx.amount > 0 
                    ? 'bg-emerald-500/[0.12] border border-emerald-500/[0.2]' 
                    : 'bg-rose-500/[0.12] border border-rose-500/[0.2]'
                }`}
              >
                {tx.amount > 0 ? (
                  <ArrowDownLeft className="w-5 h-5 text-emerald-400" />
                ) : (
                  <ArrowUpRight className="w-5 h-5 text-rose-400" />
                )}
              </motion.div>
              
              {/* Details */}
              <div>
                <p className="font-semibold text-white group-hover:text-primary transition-colors">{tx.description}</p>
                <p className="text-xs text-slate-500">{tx.project}</p>
              </div>
            </div>

            <div className="flex items-center gap-5">
              {/* Amount */}
              <div className="text-left min-w-[100px]">
                <p className={`font-bold text-base ${tx.amount > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {tx.amount > 0 ? '+' : '-'}{formatCurrency(tx.amount)}
                </p>
              </div>

              {/* Status Badge */}
              <Badge 
                className={`min-w-[70px] justify-center text-xs font-semibold ${
                  tx.status === 'completed' 
                    ? 'bg-emerald-500/[0.12] text-emerald-400 border border-emerald-500/[0.2] hover:bg-emerald-500/[0.15]' 
                    : 'bg-amber-500/[0.12] text-amber-400 border border-amber-500/[0.2] hover:bg-amber-500/[0.15]'
                }`}
              >
                {tx.status === 'completed' ? 'مكتمل' : 'معلق'}
              </Badge>

              {/* Date */}
              <div className="flex items-center gap-1.5 text-slate-500 min-w-[80px]">
                <Clock className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">{formatDate(tx.date)}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
