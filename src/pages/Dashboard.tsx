import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { SummaryCard } from '@/components/dashboard/SummaryCard';
import { CashFlowCard } from '@/components/dashboard/CashFlowCard';
import { MonthlyExpensesChart } from '@/components/dashboard/MonthlyExpensesChart';
import { RecentActivityTable } from '@/components/dashboard/RecentActivityTable';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { getDashboardStats } from '@/services/dashboard';
import { listCashMovements } from '@/services/cashMovements';
import { listCategories } from '@/services/categories';
import { Receipt, Clock, FolderKanban, Users, Sparkles, Calendar, Zap, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export default function Dashboard() {
  const { profile, user } = useAuth();
  const { company_id, branch_id, role } = useCompany();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalIn: 0, totalOut: 0, net: 0, pendingCount: 0 });
  const [recent, setRecent] = useState<{ id: string; description: string; project?: string; amount: number; status: 'completed' | 'pending'; date: string }[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        setLoading(true);
        if (!company_id) return;

        const [dash, categories, movements] = await Promise.all([
          getDashboardStats({ company_id, branch_id, created_by: role === 'employee' ? user?.id : undefined }),
          listCategories(company_id),
          listCashMovements({ company_id, branch_id, limit: 5, created_by: role === 'employee' ? user?.id : undefined }),
        ]);

        if (cancelled) return;
        setStats(dash);

        const catMap = new Map(categories.map(c => [c.id, c.name]));
        const mapped = movements.map(m => ({
          id: m.id,
          description: `${catMap.get(m.category_id) || 'حركة'} • ${m.payment_method}`,
          amount: m.type === 'IN' ? m.amount : -m.amount,
          status: m.status === 'APPROVED' ? 'completed' : 'pending',
          date: m.movement_date,
        }));
        setRecent(mapped);
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [company_id, branch_id, role, user]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getCurrentDate = () => {
    return new Date().toLocaleDateString('ar-SA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <DashboardLayout>
      <motion.div 
        className="space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Page Header - Enhanced */}
        <motion.div 
          variants={itemVariants}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div className="flex items-start gap-4">
            {/* Animated Logo */}
            <motion.div 
              className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center shadow-glow relative overflow-hidden"
              whileHover={{ scale: 1.05 }}
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 4 }}
              />
              <Sparkles className="w-7 h-7 text-white relative z-10" />
            </motion.div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-black text-white">
                مركز التحكم
              </h1>
              <p className="text-slate-500 mt-0.5">
                مرحباً <span className="text-white font-semibold">{profile?.full_name || 'المستخدم'}</span>، إليك ملخص نشاطك
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="flex items-center gap-2 text-sm text-slate-400 bg-white/[0.03] backdrop-blur-xl px-4 py-2.5 rounded-xl border border-white/[0.08]"
            >
              <Calendar className="w-4 h-4 text-primary" />
              <span>{getCurrentDate()}</span>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button 
                onClick={() => navigate('/expenses')}
                className="gradient-primary text-white shadow-glow border-0 px-6 group"
              >
                <Zap className="w-4 h-4 ml-2 group-hover:animate-pulse" />
                طلب صرف جديد
                <ArrowLeft className="w-4 h-4 mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Button>
            </motion.div>
          </div>
        </motion.div>

        {/* Summary Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard
            title="إجمالي المصروفات"
            value={loading ? '...' : formatCurrency(stats.totalOut)}
            subtitle="حركات معتمدة"
            icon={Receipt}
            variant="primary"
            index={0}
          />
          <SummaryCard
            title="حركات معلّقة"
            value={loading ? '...' : stats.pendingCount.toString()}
            subtitle="بانتظار الاعتماد"
            icon={Clock}
            variant="warning"
            index={1}
          />
          <SummaryCard
            title="إجمالي الإيرادات"
            value={loading ? '...' : formatCurrency(stats.totalIn)}
            subtitle="حركات معتمدة"
            icon={FolderKanban}
            variant="success"
            index={2}
          />
          <SummaryCard
            title="صافي الحركة"
            value={loading ? '...' : formatCurrency(stats.net)}
            subtitle="IN - OUT"
            icon={Users}
            variant="default"
            index={3}
          />
        </div>

        {/* Cash Flow & Chart Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <CashFlowCard
            inflow={stats.totalIn}
            outflow={stats.totalOut}
            netFlow={stats.net}
          />
          <div className="lg:col-span-2">
            <MonthlyExpensesChart />
          </div>
        </div>

        {/* Recent Activity Table */}
        <RecentActivityTable items={recent} />
      </motion.div>
    </DashboardLayout>
  );
}
