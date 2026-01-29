import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { type AppRole } from '@/data/roles';
import { 
  Receipt, Clock, FolderKanban, Users, CheckCircle, 
  AlertTriangle, TrendingUp, Wallet, Shield, FileBarChart
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

// Role-specific quick actions
const roleQuickActions: Record<AppRole, { label: string; icon: any; href: string; color: string }[]> = {
  super_admin: [
    { label: 'إدارة الفريق', icon: Users, href: '/team', color: 'from-violet-500 to-purple-600' },
    { label: 'سجل النظام', icon: Shield, href: '/system-logs', color: 'from-red-500 to-rose-600' },
    { label: 'التقارير', icon: FileBarChart, href: '/reports', color: 'from-emerald-500 to-green-600' },
    { label: 'الإعدادات', icon: Shield, href: '/settings', color: 'from-blue-500 to-cyan-600' },
  ],
  company_owner: [
    { label: 'إدارة الفريق', icon: Users, href: '/team', color: 'from-violet-500 to-purple-600' },
    { label: 'التقارير المالية', icon: FileBarChart, href: '/reports', color: 'from-emerald-500 to-green-600' },
    { label: 'المشاريع', icon: FolderKanban, href: '/projects', color: 'from-amber-500 to-orange-600' },
    { label: 'المحفظة', icon: Wallet, href: '/wallet', color: 'from-blue-500 to-cyan-600' },
  ],
  finance_manager: [
    { label: 'الموافقات المعلقة', icon: Clock, href: '/expenses', color: 'from-amber-500 to-orange-600' },
    { label: 'التقارير', icon: FileBarChart, href: '/reports', color: 'from-emerald-500 to-green-600' },
    { label: 'المحفظة', icon: Wallet, href: '/wallet', color: 'from-violet-500 to-purple-600' },
    { label: 'سجل النظام', icon: Shield, href: '/system-logs', color: 'from-blue-500 to-cyan-600' },
  ],
  accountant: [
    { label: 'تسوية المصروفات', icon: CheckCircle, href: '/expenses', color: 'from-emerald-500 to-green-600' },
    { label: 'التقارير', icon: FileBarChart, href: '/reports', color: 'from-violet-500 to-purple-600' },
    { label: 'سجل النظام', icon: Shield, href: '/system-logs', color: 'from-blue-500 to-cyan-600' },
    { label: 'المشاريع', icon: FolderKanban, href: '/projects', color: 'from-amber-500 to-orange-600' },
  ],
  project_manager: [
    { label: 'المشاريع', icon: FolderKanban, href: '/projects', color: 'from-amber-500 to-orange-600' },
    { label: 'طلب صرف جديد', icon: Receipt, href: '/expenses', color: 'from-violet-500 to-purple-600' },
    { label: 'الفريق', icon: Users, href: '/team', color: 'from-emerald-500 to-green-600' },
    { label: 'التقارير', icon: FileBarChart, href: '/reports', color: 'from-blue-500 to-cyan-600' },
  ],
  employee: [
    { label: 'طلب صرف جديد', icon: Receipt, href: '/expenses', color: 'from-violet-500 to-purple-600' },
    { label: 'طلباتي', icon: Clock, href: '/expenses', color: 'from-amber-500 to-orange-600' },
    { label: 'المشاريع', icon: FolderKanban, href: '/projects', color: 'from-emerald-500 to-green-600' },
    { label: 'المحفظة', icon: Wallet, href: '/wallet', color: 'from-blue-500 to-cyan-600' },
  ],
};

// Role-specific welcome messages
const roleWelcomeMessages: Record<AppRole, { title: string; subtitle: string }> = {
  super_admin: {
    title: 'لوحة تحكم المدير',
    subtitle: 'إدارة كاملة للنظام والمستخدمين',
  },
  company_owner: {
    title: 'لوحة تحكم الشركة',
    subtitle: 'نظرة شاملة على أداء الشركة',
  },
  finance_manager: {
    title: 'الإدارة المالية',
    subtitle: 'إدارة الموافقات والتقارير المالية',
  },
  accountant: {
    title: 'لوحة المحاسب',
    subtitle: 'تسوية المصروفات والتقارير',
  },
  project_manager: {
    title: 'إدارة المشاريع',
    subtitle: 'متابعة المشاريع والفريق',
  },
  employee: {
    title: 'لوحة الموظف',
    subtitle: 'إدارة طلبات الصرف الخاصة بك',
  },
};

interface QuickActionsProps {
  role: AppRole;
}

export function QuickActions({ role }: QuickActionsProps) {
  const navigate = useNavigate();
  const actions = roleQuickActions[role] || roleQuickActions.employee;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {actions.map((action, index) => (
        <motion.button
          key={action.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          onClick={() => navigate(action.href)}
          className={`
            rounded-2xl p-5 text-right transition-all duration-300
            bg-gradient-to-br ${action.color} 
            hover:shadow-lg hover:shadow-violet-500/20 hover:-translate-y-1
            border border-white/10
          `}
        >
          <action.icon className="w-8 h-8 text-white/90 mb-3" />
          <p className="text-white font-semibold">{action.label}</p>
        </motion.button>
      ))}
    </div>
  );
}

export function RoleWelcome() {
  const { profile } = useAuth();
  const { role: companyRole } = useCompany();
  const role = (companyRole || 'employee') as AppRole;
  const messages = roleWelcomeMessages[role] || roleWelcomeMessages.employee;

  return (
    <div>
      <h1 className="text-2xl font-bold text-white">{messages.title}</h1>
      <p className="text-slate-400">
        مرحباً {profile?.full_name}، {messages.subtitle}
      </p>
    </div>
  );
}

// Pending approvals widget for finance roles
export function PendingApprovalsWidget({ pendingCount }: { pendingCount: number }) {
  const navigate = useNavigate();
  
  if (pendingCount === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-2xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 p-4 flex items-center justify-between"
    >
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-amber-500/30 flex items-center justify-center">
          <AlertTriangle className="w-6 h-6 text-amber-400" />
        </div>
        <div>
          <p className="text-white font-semibold">{pendingCount} طلبات بانتظار الموافقة</p>
          <p className="text-sm text-amber-400/80">يتطلب اتخاذ إجراء</p>
        </div>
      </div>
      <Button
        onClick={() => navigate('/expenses')}
        className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl"
      >
        مراجعة الآن
      </Button>
    </motion.div>
  );
}
