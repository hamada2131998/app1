import { motion } from 'framer-motion';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface SummaryCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  index?: number;
}

export function SummaryCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend,
  variant = 'default',
  index = 0
}: SummaryCardProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          iconGradient: 'gradient-primary',
          iconShadow: 'shadow-glow',
          accentColor: 'hsl(245 100% 65%)',
          borderGlow: 'group-hover:border-[hsl(245_100%_65%_/_0.3)]',
        };
      case 'success':
        return {
          iconGradient: 'gradient-success',
          iconShadow: 'shadow-glow-success',
          accentColor: 'hsl(155 100% 45%)',
          borderGlow: 'group-hover:border-[hsl(155_100%_45%_/_0.3)]',
        };
      case 'warning':
        return {
          iconGradient: 'gradient-warning',
          iconShadow: 'shadow-glow-warning',
          accentColor: 'hsl(40 100% 55%)',
          borderGlow: 'group-hover:border-[hsl(40_100%_55%_/_0.3)]',
        };
      case 'danger':
        return {
          iconGradient: 'gradient-danger',
          iconShadow: 'shadow-glow-danger',
          accentColor: 'hsl(0 90% 60%)',
          borderGlow: 'group-hover:border-[hsl(0_90%_60%_/_0.3)]',
        };
      default:
        return {
          iconGradient: 'gradient-info',
          iconShadow: 'shadow-glow-info',
          accentColor: 'hsl(200 100% 55%)',
          borderGlow: 'group-hover:border-[hsl(200_100%_55%_/_0.3)]',
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay: index * 0.1, type: "spring", stiffness: 100 }}
      whileHover={{ y: -6, transition: { duration: 0.25 } }}
      className={`group relative rounded-2xl bg-[hsl(0_0%_100%_/_0.03)] backdrop-blur-xl border border-white/[0.08] p-6 overflow-hidden transition-all duration-500 ${styles.borderGlow}`}
    >
      {/* Ambient glow on hover */}
      <div 
        className="absolute -top-20 -right-20 w-40 h-40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-3xl pointer-events-none"
        style={{ background: `radial-gradient(circle, ${styles.accentColor} 0%, transparent 70%)` }}
      />
      
      {/* Top accent line */}
      <div 
        className="absolute top-0 left-6 right-6 h-[2px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: `linear-gradient(90deg, transparent, ${styles.accentColor}, transparent)` }}
      />

      <div className="relative flex items-start gap-4">
        {/* Floating Neon Icon */}
        <motion.div 
          whileHover={{ scale: 1.1, rotate: 5 }}
          className={`w-14 h-14 rounded-2xl ${styles.iconGradient} flex items-center justify-center ${styles.iconShadow} flex-shrink-0 relative`}
        >
          {/* Inner shine */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 to-transparent" />
          <Icon className="w-7 h-7 text-white relative z-10" />
        </motion.div>
        
        <div className="flex-1 space-y-1 min-w-0">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <motion.p 
            className="text-3xl font-black text-white tracking-tight"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
          >
            {value}
          </motion.p>
          {subtitle && (
            <p className="text-xs text-slate-600">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Trend indicator */}
      {trend && (
        <motion.div 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
          className="mt-4 pt-4 border-t border-white/[0.06]"
        >
          <div className={`inline-flex items-center gap-2 text-sm font-semibold ${
            trend.isPositive ? 'text-emerald-400' : 'text-rose-400'
          }`}>
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
              trend.isPositive ? 'bg-emerald-500/20' : 'bg-rose-500/20'
            }`}>
              {trend.isPositive ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
            </div>
            <span>{Math.abs(trend.value)}%</span>
            <span className="text-slate-600 font-normal">من الشهر الماضي</span>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
