// =====================================================
// ROLE SWITCHER - DEV MODE COMPONENT
// Allows switching roles to test permissions
// =====================================================

import { useApp, AppRole } from '@/contexts/AppContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Shield, Users, Calculator, User } from 'lucide-react';

const roleConfig: Record<AppRole, { label: string; icon: typeof Shield; color: string }> = {
  admin: { label: 'مدير النظام', icon: Shield, color: 'from-red-500 to-rose-600' },
  manager: { label: 'مدير', icon: Users, color: 'from-violet-500 to-purple-600' },
  accountant: { label: 'محاسب', icon: Calculator, color: 'from-emerald-500 to-green-600' },
  employee: { label: 'موظف', icon: User, color: 'from-slate-500 to-gray-600' },
};

export function RoleSwitcher() {
  const { currentRole, setCurrentRole } = useApp();
  const config = roleConfig[currentRole];
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-2">
      <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-xs">
        DEV
      </Badge>
      <Select value={currentRole} onValueChange={(value: AppRole) => setCurrentRole(value)}>
        <SelectTrigger className="w-[160px] h-9 bg-white/[0.05] border-white/[0.08] text-white rounded-xl text-sm">
          <div className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-md bg-gradient-to-br ${config.color} flex items-center justify-center`}>
              <Icon className="w-3.5 h-3.5 text-white" />
            </div>
            <SelectValue />
          </div>
        </SelectTrigger>
        <SelectContent className="bg-slate-800 border-slate-700">
          {Object.entries(roleConfig).map(([role, cfg]) => {
            const RoleIcon = cfg.icon;
            return (
              <SelectItem key={role} value={role} className="text-white">
                <div className="flex items-center gap-2">
                  <div className={`w-5 h-5 rounded-md bg-gradient-to-br ${cfg.color} flex items-center justify-center`}>
                    <RoleIcon className="w-3 h-3 text-white" />
                  </div>
                  <span>{cfg.label}</span>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}
