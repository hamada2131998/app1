// =====================================================
// TEAM PAGE - ZERO DEAD BUTTON POLICY
// Full CRUD for team members with role-based visibility
// =====================================================

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { useApp, AppRole } from '@/contexts/AppContext';
import { toast } from 'sonner';
import { 
  Plus, Users, Shield, Calculator, User, MoreHorizontal, 
  Trash2, UserCheck, UserX, Search, Filter, Settings2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { EmployeePermissionsDialog } from '@/components/team/EmployeePermissionsDialog';

const roleConfig: Record<AppRole, { label: string; icon: typeof Shield; color: string; bgColor: string }> = {
  admin: { label: 'مدير النظام', icon: Shield, color: 'text-red-400', bgColor: 'bg-red-500/20' },
  manager: { label: 'مدير', icon: Users, color: 'text-violet-400', bgColor: 'bg-violet-500/20' },
  accountant: { label: 'محاسب', icon: Calculator, color: 'text-emerald-400', bgColor: 'bg-emerald-500/20' },
  employee: { label: 'موظف', icon: User, color: 'text-slate-400', bgColor: 'bg-slate-500/20' },
};

const departments = [
  'الإدارة المالية',
  'المشاريع',
  'المحاسبة',
  'العمليات',
  'الموارد البشرية',
  'تقنية المعلومات',
];

export default function TeamNew() {
  const { team, addTeamMember, updateTeamMember, removeTeamMember, currentRole, profile } = useApp();
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<typeof team[0] | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<AppRole | 'all'>('all');
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'employee' as AppRole,
    department: '',
  });

  const isAdmin = currentRole === 'admin';
  const isManager = currentRole === 'manager' || currentRole === 'admin';

  const handleOpenPermissions = (member: typeof team[0]) => {
    setSelectedMember(member);
    setIsPermissionsDialogOpen(true);
  };

  const handleSavePermissions = (memberId: string, permissions: any) => {
    // Permissions saved and logged in the dialog
    toast.success('تم حفظ صلاحيات الموظف وتسجيلها في سجل النظام');
  };

  const filteredTeam = team.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || member.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const activeCount = team.filter(m => m.status === 'active').length;
  const inactiveCount = team.filter(m => m.status === 'inactive').length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('يرجى إدخال الاسم');
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      toast.error('يرجى إدخال بريد إلكتروني صحيح');
      return;
    }
    if (!formData.department) {
      toast.error('يرجى اختيار القسم');
      return;
    }

    setSubmitting(true);

    setTimeout(() => {
      addTeamMember({
        name: formData.name,
        email: formData.email,
        role: formData.role,
        department: formData.department,
        status: 'active',
      });

      setFormData({ name: '', email: '', role: 'employee', department: '' });
      setIsAddDialogOpen(false);
      setSubmitting(false);
    }, 300);
  };

  const handleToggleStatus = (memberId: string, currentStatus: 'active' | 'inactive') => {
    updateTeamMember(memberId, { 
      status: currentStatus === 'active' ? 'inactive' : 'active' 
    });
  };

  const handleChangeRole = (memberId: string, newRole: AppRole) => {
    updateTeamMember(memberId, { role: newRole });
    toast.success('تم تغيير الصلاحية');
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">الفريق</h1>
            <p className="text-slate-400">إدارة أعضاء الفريق والصلاحيات</p>
          </div>
          
          {/* Add Member - Only visible for Admin */}
          {isAdmin && (
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-lg shadow-violet-500/30 rounded-xl">
                  <Plus className="w-4 h-4 ml-2" />
                  إضافة عضو
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md bg-[#1e293b]/95 backdrop-blur-2xl border-white/[0.08] rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="text-white">إضافة عضو جديد</DialogTitle>
                  <DialogDescription className="text-slate-400">
                    أدخل بيانات العضو الجديد
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300">الاسم الكامل *</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="مثال: أحمد محمد"
                      className="bg-white/[0.05] border-white/[0.08] text-white rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-300">البريد الإلكتروني *</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="example@company.com"
                      className="bg-white/[0.05] border-white/[0.08] text-white rounded-xl"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-300">الصلاحية</Label>
                      <Select
                        value={formData.role}
                        onValueChange={(value: AppRole) => setFormData({ ...formData, role: value })}
                      >
                        <SelectTrigger className="bg-white/[0.05] border-white/[0.08] text-white rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700 z-50">
                          {Object.entries(roleConfig).map(([role, config]) => (
                            <SelectItem key={role} value={role} className="text-white">
                              <div className="flex items-center gap-2">
                                <config.icon className={`w-4 h-4 ${config.color}`} />
                                {config.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-slate-300">القسم *</Label>
                      <Select
                        value={formData.department}
                        onValueChange={(value) => setFormData({ ...formData, department: value })}
                      >
                        <SelectTrigger className="bg-white/[0.05] border-white/[0.08] text-white rounded-xl">
                          <SelectValue placeholder="اختر القسم" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700 z-50">
                          {departments.map((dept) => (
                            <SelectItem key={dept} value={dept} className="text-white">
                              {dept}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <DialogFooter className="gap-2">
                    <Button 
                      type="button"
                      variant="outline" 
                      onClick={() => setIsAddDialogOpen(false)}
                      className="border-white/[0.08] text-slate-300 hover:bg-white/[0.05] rounded-xl"
                    >
                      إلغاء
                    </Button>
                    <Button 
                      type="submit"
                      disabled={submitting}
                      className="bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl"
                    >
                      {submitting ? 'جاري الإضافة...' : 'إضافة العضو'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}

          {!isAdmin && (
            <Badge variant="outline" className="text-amber-400 border-amber-500/30 bg-amber-500/10">
              عرض فقط
            </Badge>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-[#1e293b]/40 backdrop-blur-xl border border-white/[0.08] p-5"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center">
                <Users className="w-6 h-6 text-violet-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{team.length}</p>
                <p className="text-sm text-slate-500">إجمالي الأعضاء</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl bg-[#1e293b]/40 backdrop-blur-xl border border-white/[0.08] p-5"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{activeCount}</p>
                <p className="text-sm text-slate-500">نشط</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl bg-[#1e293b]/40 backdrop-blur-xl border border-white/[0.08] p-5"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <UserX className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{inactiveCount}</p>
                <p className="text-sm text-slate-500">غير نشط</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl bg-[#1e293b]/40 backdrop-blur-xl border border-white/[0.08] p-5"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                <Shield className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{team.filter(m => m.role === 'admin').length}</p>
                <p className="text-sm text-slate-500">مدراء</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="البحث بالاسم أو البريد..."
              className="pr-10 bg-white/[0.05] border-white/[0.08] text-white rounded-xl"
            />
          </div>
          <Select value={roleFilter} onValueChange={(value: AppRole | 'all') => setRoleFilter(value)}>
            <SelectTrigger className="w-full md:w-[180px] bg-white/[0.05] border-white/[0.08] text-white rounded-xl">
              <Filter className="w-4 h-4 ml-2 text-slate-500" />
              <SelectValue placeholder="فلتر الصلاحية" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700 z-50">
              <SelectItem value="all" className="text-white">جميع الصلاحيات</SelectItem>
              {Object.entries(roleConfig).map(([role, config]) => (
                <SelectItem key={role} value={role} className="text-white">
                  {config.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Team Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {team.length === 0 ? (
            <div className="col-span-full rounded-2xl bg-[#1e293b]/40 backdrop-blur-xl border border-white/[0.08] p-12 text-center">
              <Users className="w-16 h-16 mx-auto mb-4 text-slate-600" />
              <h3 className="text-lg font-semibold text-white">لا يوجد أعضاء بعد</h3>
              <p className="text-slate-400 mt-2">ابدأ بدعوة أول موظف لتفعيل المصروفات والموافقات.</p>
              {isAdmin && (
                <Button onClick={() => setIsAddDialogOpen(true)} className="mt-4 gradient-primary">
                  <Plus className="w-4 h-4 ml-2" />
                  إضافة أول عضو
                </Button>
              )}
            </div>
          ) : filteredTeam.length === 0 ? (
            <div className="col-span-full rounded-2xl bg-[#1e293b]/40 backdrop-blur-xl border border-white/[0.08] p-12 text-center">
              <Users className="w-16 h-16 mx-auto mb-4 text-slate-600" />
              <p className="text-slate-400">لا يوجد أعضاء مطابقين للبحث</p>
            </div>
          ) : (
            <AnimatePresence>
              {filteredTeam.map((member, index) => {
                const config = roleConfig[member.role];
                const RoleIcon = config.icon;
                const isCurrentUser = member.id === profile.id;
                
                return (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.05 }}
                    className={`rounded-2xl bg-[#1e293b]/40 backdrop-blur-xl border p-6 transition-all hover:-translate-y-1 ${
                      member.status === 'inactive' 
                        ? 'border-white/[0.05] opacity-60' 
                        : 'border-white/[0.08]'
                    }`}
                  >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-14 h-14 rounded-xl ${config.bgColor} flex items-center justify-center text-lg font-bold ${config.color}`}>
                        {getInitials(member.name)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-white flex items-center gap-2">
                          {member.name}
                          {isCurrentUser && (
                            <Badge variant="outline" className="text-[10px] py-0 text-violet-400 border-violet-500/30">
                              أنت
                            </Badge>
                          )}
                        </h3>
                        <p className="text-sm text-slate-500">{member.email}</p>
                      </div>
                    </div>

                    {isAdmin && !isCurrentUser && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-white hover:bg-white/[0.05]">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700 z-50">
                          <DropdownMenuItem 
                            onClick={() => handleToggleStatus(member.id, member.status)}
                            className="text-white hover:bg-slate-700"
                          >
                            {member.status === 'active' ? (
                              <>
                                <UserX className="w-4 h-4 ml-2 text-amber-400" />
                                تعطيل الحساب
                              </>
                            ) : (
                              <>
                                <UserCheck className="w-4 h-4 ml-2 text-emerald-400" />
                                تفعيل الحساب
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-slate-700" />
                          {Object.entries(roleConfig).map(([role, cfg]) => (
                            <DropdownMenuItem
                              key={role}
                              onClick={() => handleChangeRole(member.id, role as AppRole)}
                              className="text-white hover:bg-slate-700"
                            >
                              <cfg.icon className={`w-4 h-4 ml-2 ${cfg.color}`} />
                              {cfg.label}
                            </DropdownMenuItem>
                          ))}
                          <DropdownMenuSeparator className="bg-slate-700" />
                          <DropdownMenuItem 
                            onClick={() => removeTeamMember(member.id)}
                            className="text-red-400 hover:bg-red-500/10"
                          >
                            <Trash2 className="w-4 h-4 ml-2" />
                            حذف العضو
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500">الصلاحية</span>
                      <Badge className={`${config.bgColor} ${config.color} border-0`}>
                        <RoleIcon className="w-3 h-3 ml-1" />
                        {config.label}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500">القسم</span>
                      <span className="text-sm text-white">{member.department}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500">الحالة</span>
                      <Badge className={member.status === 'active' 
                        ? 'bg-emerald-500/20 text-emerald-400 border-0' 
                        : 'bg-slate-500/20 text-slate-400 border-0'
                      }>
                        {member.status === 'active' ? 'نشط' : 'غير نشط'}
                      </Badge>
                    </div>
                  </div>

                  {/* Edit Permissions Button - Only for managers/admins on employees */}
                  {isManager && !isCurrentUser && member.role === 'employee' && (
                    <Button
                      onClick={() => handleOpenPermissions(member)}
                      variant="outline"
                      className="w-full mt-4 border-violet-500/30 text-violet-400 hover:bg-violet-500/10 rounded-xl"
                    >
                      <Settings2 className="w-4 h-4 ml-2" />
                      تعديل الصلاحيات
                    </Button>
                  )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Permissions Dialog */}
      {selectedMember && (
        <EmployeePermissionsDialog
          isOpen={isPermissionsDialogOpen}
          onClose={() => {
            setIsPermissionsDialogOpen(false);
            setSelectedMember(null);
          }}
          member={selectedMember}
          onSave={handleSavePermissions}
          currentUserName={profile.name}
        />
      )}
    </DashboardLayout>
  );
}
