import { Search, Menu, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { CompanySwitcher } from '@/components/layout/CompanySwitcher';
import { RoleSwitcher } from '@/components/layout/RoleSwitcher';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { useApp } from '@/contexts/AppContext';

export function Header() {
  const { walletBalance, formatCurrency } = useApp();

  return (
    <header className="h-16 border-b border-white/[0.08] bg-[#0d1424]/80 backdrop-blur-2xl flex items-center justify-between px-4 lg:px-6 sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="text-slate-400 hover:text-white transition-colors">
          <Menu className="w-5 h-5" />
        </SidebarTrigger>
        
        {/* Role Switcher - Dev Mode */}
        <RoleSwitcher />
        
        <div className="hidden lg:flex items-center gap-2 bg-white/[0.05] rounded-xl px-4 py-2 min-w-[280px] border border-white/[0.08]">
          <Search className="w-4 h-4 text-slate-500" />
          <Input
            type="search"
            placeholder="البحث في النظام..."
            className="border-0 bg-transparent h-auto p-0 focus-visible:ring-0 placeholder:text-slate-600 text-white"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Wallet Balance */}
        <div className="hidden sm:flex items-center gap-3 px-4 py-2 rounded-xl bg-[#1e293b]/40 backdrop-blur-xl border border-white/[0.08]">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col items-end">
            <span className="text-xs text-slate-500">رصيد المحفظة</span>
            <span className="font-bold text-white text-sm">
              {formatCurrency(walletBalance)}
            </span>
          </div>
        </div>

        <ThemeToggle />
        <NotificationCenter />
        
        <div className="hidden lg:flex items-center gap-2 text-sm">
          <Badge variant="secondary" className="font-mono text-xs bg-violet-500/20 text-violet-400 border border-violet-500/30 rounded-lg">
            v2.0 Pro
          </Badge>
        </div>
      </div>
    </header>
  );
}
