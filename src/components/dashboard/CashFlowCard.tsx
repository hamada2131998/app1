import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownLeft, Sparkles } from 'lucide-react';

interface CashFlowCardProps {
  inflow: number;
  outflow: number;
  netFlow: number;
}

export function CashFlowCard({ inflow, outflow, netFlow }: CashFlowCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const isPositive = netFlow >= 0;
  const percentage = Math.round((outflow / inflow) * 100);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="relative rounded-2xl bg-[hsl(0_0%_100%_/_0.03)] backdrop-blur-xl border border-white/[0.08] p-6 overflow-hidden group"
    >
      {/* Background gradient mesh */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/10 via-transparent to-transparent" />
        <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-gradient-to-tl from-cyan-500/10 via-transparent to-transparent" />
      </div>

      {/* Header */}
      <div className="relative flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center relative overflow-hidden ${
              isPositive ? 'gradient-success shadow-glow-success' : 'gradient-danger shadow-glow-danger'
            }`}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
            {isPositive ? (
              <TrendingUp className="w-6 h-6 text-white relative z-10" />
            ) : (
              <TrendingDown className="w-6 h-6 text-white relative z-10" />
            )}
          </motion.div>
          <div>
            <h3 className="text-sm font-medium text-slate-500">صافي التدفق النقدي</h3>
            <motion.p 
              key={netFlow}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl font-black text-white"
            >
              {formatCurrency(netFlow)}
            </motion.p>
          </div>
        </div>
        
        {/* Sparkle badge */}
        <motion.div 
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.05] border border-white/[0.08]"
        >
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-semibold text-slate-400">هذا الشهر</span>
        </motion.div>
      </div>

      {/* Progress bar */}
      <div className="relative mb-6">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
          <span>نسبة الإنفاق</span>
          <span className="font-semibold text-white">{percentage}%</span>
        </div>
        <div className="h-2 rounded-full bg-white/[0.05] overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
            className={`h-full rounded-full ${percentage > 80 ? 'gradient-danger' : percentage > 50 ? 'gradient-warning' : 'gradient-success'}`}
          />
        </div>
      </div>
      
      {/* Inflow / Outflow Cards */}
      <div className="grid grid-cols-2 gap-3">
        <motion.div 
          whileHover={{ scale: 1.02, y: -2 }}
          className="relative flex items-center gap-3 p-4 rounded-xl bg-emerald-500/[0.08] border border-emerald-500/[0.15] transition-all duration-300 overflow-hidden group/card"
        >
          {/* Hover glow */}
          <div className="absolute inset-0 opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-emerald-500/10 to-transparent" />
          
          <div className="w-10 h-10 rounded-xl gradient-success flex items-center justify-center shadow-glow-success relative">
            <ArrowDownLeft className="w-5 h-5 text-white" />
          </div>
          <div className="relative">
            <p className="text-[11px] text-emerald-400/70 font-medium">الوارد</p>
            <p className="text-lg font-bold text-emerald-400">{formatCurrency(inflow)}</p>
          </div>
        </motion.div>
        
        <motion.div 
          whileHover={{ scale: 1.02, y: -2 }}
          className="relative flex items-center gap-3 p-4 rounded-xl bg-rose-500/[0.08] border border-rose-500/[0.15] transition-all duration-300 overflow-hidden group/card"
        >
          {/* Hover glow */}
          <div className="absolute inset-0 opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-rose-500/10 to-transparent" />
          
          <div className="w-10 h-10 rounded-xl gradient-danger flex items-center justify-center shadow-glow-danger relative">
            <ArrowUpRight className="w-5 h-5 text-white" />
          </div>
          <div className="relative">
            <p className="text-[11px] text-rose-400/70 font-medium">الصادر</p>
            <p className="text-lg font-bold text-rose-400">{formatCurrency(outflow)}</p>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
