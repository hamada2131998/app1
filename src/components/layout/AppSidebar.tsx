import { LayoutDashboard, Receipt, FolderKanban, Wallet, Settings, LogOut, Building2, FileBarChart, Shield, ChevronRight, Sparkles, HandCoins } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { getRoleName } from '@/data/roles';

const menuItems = [
  { title: 'لوحة التحكم', url: '/dashboard', icon: LayoutDashboard, gradient: 'from-violet-500 to-indigo-500' },
  { title: 'المصروفات', url: '/expenses', icon: Receipt, gradient: 'from-cyan-500 to-blue-500' },
  { title: 'عُهد الموظفين', url: '/custody', icon: HandCoins, gradient: 'from-teal-500 to-emerald-500' },
  { title: 'المشاريع', url: '/projects', icon: FolderKanban, gradient: 'from-emerald-500 to-teal-500' },
  { title: 'التقارير', url: '/reports', icon: FileBarChart, gradient: 'from-amber-500 to-orange-500' },
  { title: 'المحفظة', url: '/wallet', icon: Wallet, gradient: 'from-pink-500 to-rose-500' },
  { title: 'الفريق', url: '/team', icon: Building2, gradient: 'from-purple-500 to-violet-500' },
  { title: 'سجل النظام', url: '/system-logs', icon: Shield, gradient: 'from-slate-400 to-slate-500' },
  { title: 'الإعدادات', url: '/settings', icon: Settings, gradient: 'from-gray-400 to-gray-500' },
];

export function AppSidebar() {
  const { profile, signOut } = useAuth();
  const { role } = useCompany();
  const { state } = useSidebar();
  const location = useLocation();
  const isCollapsed = state === 'collapsed';

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const isActive = (url: string) => location.pathname === url;

  return (
    <Sidebar 
      collapsible="icon"
      className="border-l-0 bg-[hsl(230_30%_4%)] border-r border-white/[0.06] overflow-hidden"
    >
      {/* Header with animated logo */}
      <SidebarHeader className="p-4 border-b border-white/[0.06]">
        <motion.div 
          className="flex items-center gap-3"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div 
            className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center flex-shrink-0 shadow-glow relative overflow-hidden"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {/* Animated shine effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            />
            <Sparkles className="w-6 h-6 text-white relative z-10" />
          </motion.div>
          {!isCollapsed && (
            <motion.div 
              className="overflow-hidden"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <h1 className="font-black text-white text-lg tracking-tight">Smart<span className="text-primary">.</span></h1>
              <p className="text-[10px] text-slate-500 font-medium tracking-widest uppercase">ACCOUNTANT PRO</p>
            </motion.div>
          )}
        </motion.div>
      </SidebarHeader>

      <SidebarContent className="p-3 pt-6">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1.5">
              {menuItems.map((item, index) => (
                <SidebarMenuItem key={item.title}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.url}
                          className={`group relative flex items-center gap-3 px-4 py-3.5 rounded-xl text-slate-400 transition-all duration-300 overflow-hidden ${
                            isActive(item.url) 
                              ? 'text-white' 
                              : 'hover:text-white hover:bg-white/[0.03]'
                          }`}
                        >
                          {/* Active background with gradient border */}
                          <AnimatePresence>
                            {isActive(item.url) && (
                              <motion.div
                                layoutId="activeNav"
                                className="absolute inset-0 rounded-xl bg-white/[0.05] border border-white/[0.1]"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                              >
                                {/* Gradient accent line */}
                                <div className={`absolute right-0 top-2 bottom-2 w-1 rounded-full bg-gradient-to-b ${item.gradient}`} />
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {/* Icon with gradient background on active */}
                          <motion.div 
                            className={`relative z-10 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                              isActive(item.url) 
                                ? `bg-gradient-to-br ${item.gradient} shadow-lg` 
                                : 'bg-white/[0.05] group-hover:bg-white/[0.08]'
                            }`}
                            whileHover={{ scale: 1.05 }}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                          >
                            <item.icon className={`w-5 h-5 ${isActive(item.url) ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                          </motion.div>

                          {!isCollapsed && (
                            <motion.span 
                              className="relative z-10 font-medium flex-1"
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.3, delay: 0.1 + index * 0.03 }}
                            >
                              {item.title}
                            </motion.span>
                          )}

                          {!isCollapsed && isActive(item.url) && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="relative z-10"
                            >
                              <ChevronRight className="w-4 h-4 text-white/50" />
                            </motion.div>
                          )}
                        </NavLink>
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    {isCollapsed && (
                      <TooltipContent 
                        side="left" 
                        className="font-medium bg-[hsl(230_25%_10%)] border-white/10 text-white shadow-xl"
                      >
                        {item.title}
                      </TooltipContent>
                    )}
                  </Tooltip>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-white/[0.06]">
        {profile && (
          <motion.div 
            className={`flex items-center gap-3 mb-4 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] ${isCollapsed ? 'justify-center' : ''}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="relative">
              <Avatar className="h-10 w-10 border-2 border-primary/30 flex-shrink-0 shadow-glow">
                <AvatarImage src={profile.avatar_url} />
                <AvatarFallback className="gradient-primary text-white text-sm font-bold">
                  {getInitials(profile.full_name)}
                </AvatarFallback>
              </Avatar>
              {/* Online indicator */}
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[hsl(230_30%_4%)] shadow-glow-success" />
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0 overflow-hidden">
                <p className="text-sm font-semibold text-white truncate">
                  {profile.full_name}
                </p>
                <p className="text-[11px] text-slate-500 capitalize">
                  {role ? getRoleName(role) : 'موظف'}
                </p>
              </div>
            )}
          </motion.div>
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              onClick={signOut}
              className={`w-full text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all duration-300 ${
                isCollapsed ? 'justify-center px-2' : 'justify-start'
              }`}
            >
              <LogOut className={`w-5 h-5 ${isCollapsed ? '' : 'ml-2'}`} />
              {!isCollapsed && <span className="font-medium">تسجيل الخروج</span>}
            </Button>
          </TooltipTrigger>
          {isCollapsed && (
            <TooltipContent side="left" className="font-medium bg-[hsl(230_25%_10%)] border-white/10 text-white">
              تسجيل الخروج
            </TooltipContent>
          )}
        </Tooltip>
      </SidebarFooter>
    </Sidebar>
  );
}
