import { Home, Receipt, Wallet, CheckCircle2, Settings } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useCompany } from '@/contexts/CompanyContext';
import { canApprove } from '@/ui/new/utils/roles';

const navItems = [
  { to: '/app/dashboard', label: 'الرئيسية', icon: Home },
  { to: '/app/expenses', label: 'المصروفات', icon: Receipt },
  { to: '/app/custody', label: 'العهدة', icon: Wallet },
  { to: '/app/approvals', label: 'الموافقات', icon: CheckCircle2, requiresApproval: true },
  { to: '/app/settings', label: 'الإعدادات', icon: Settings },
];

export function BottomNav() {
  const { role } = useCompany();
  const canSeeApprovals = canApprove(role);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 border-t border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-2">
        {navItems.map((item) => {
          const isDisabled = item.requiresApproval && !canSeeApprovals;
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={isDisabled ? '/app/approvals' : item.to}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-1 rounded-2xl px-2 py-1 text-[11px] font-medium transition',
                  isActive ? 'text-slate-900' : 'text-slate-400',
                  isDisabled && 'opacity-50'
                )
              }
            >
              <span className={cn('rounded-2xl p-2', 'bg-slate-100')}>
                <Icon className="h-4 w-4" />
              </span>
              {item.label}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
