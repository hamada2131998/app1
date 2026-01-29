import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, BarChart3 } from 'lucide-react';

const monthlyData = [
  { month: 'يناير', expenses: 45000, income: 65000 },
  { month: 'فبراير', expenses: 52000, income: 72000 },
  { month: 'مارس', expenses: 48000, income: 58000 },
  { month: 'أبريل', expenses: 61000, income: 85000 },
  { month: 'مايو', expenses: 55000, income: 78000 },
  { month: 'يونيو', expenses: 67000, income: 92000 },
];

export function MonthlyExpensesChart() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="relative rounded-2xl bg-[hsl(0_0%_100%_/_0.03)] backdrop-blur-xl border border-white/[0.08] p-6 overflow-hidden h-full"
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-primary/5 to-transparent rounded-full blur-3xl" />
      
      {/* Header */}
      <div className="relative flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow"
          >
            <BarChart3 className="w-5 h-5 text-white" />
          </motion.div>
          <div>
            <h3 className="text-base font-bold text-white">اتجاه الإنفاق</h3>
            <p className="text-xs text-slate-500">آخر 6 أشهر</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full gradient-primary shadow-glow" />
            <span className="text-xs text-slate-500">المصروفات</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full gradient-success shadow-glow-success" />
            <span className="text-xs text-slate-500">الإيرادات</span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[260px] w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="expenseGradientNew" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(245 100% 65%)" stopOpacity={0.5} />
                <stop offset="50%" stopColor="hsl(245 100% 65%)" stopOpacity={0.15} />
                <stop offset="100%" stopColor="hsl(245 100% 65%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="incomeGradientNew" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(155 100% 45%)" stopOpacity={0.5} />
                <stop offset="50%" stopColor="hsl(155 100% 45%)" stopOpacity={0.15} />
                <stop offset="100%" stopColor="hsl(155 100% 45%)" stopOpacity={0} />
              </linearGradient>
              {/* Glow filters */}
              <filter id="glowExpense" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <filter id="glowIncome" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="hsl(0 0% 100% / 0.04)" 
              vertical={false} 
            />
            <XAxis 
              dataKey="month" 
              axisLine={false} 
              tickLine={false}
              tick={{ fill: 'hsl(215 20% 45%)', fontSize: 11 }}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false}
              tick={{ fill: 'hsl(215 20% 45%)', fontSize: 11 }}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(230 25% 8% / 0.95)',
                border: '1px solid hsl(0 0% 100% / 0.1)',
                borderRadius: '1rem',
                boxShadow: '0 25px 50px -12px hsl(245 100% 65% / 0.25)',
                backdropFilter: 'blur(20px)',
                padding: '12px 16px',
              }}
              labelStyle={{ color: '#fff', fontWeight: 700, marginBottom: '8px', fontSize: '14px' }}
              formatter={(value: number, name: string) => [
                new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR' }).format(value),
                name === 'expenses' ? 'المصروفات' : 'الإيرادات'
              ]}
              cursor={{ stroke: 'hsl(245 100% 65% / 0.3)', strokeWidth: 2 }}
            />
            <Area 
              type="monotone"
              dataKey="income" 
              stroke="hsl(155 100% 45%)"
              strokeWidth={3}
              fill="url(#incomeGradientNew)"
              filter="url(#glowIncome)"
            />
            <Area 
              type="monotone"
              dataKey="expenses" 
              stroke="hsl(245 100% 65%)"
              strokeWidth={3}
              fill="url(#expenseGradientNew)"
              filter="url(#glowExpense)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
