import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { PermissionGuard } from '@/components/permissions/PermissionGuard';
import { MOCK_TEAM_MEMBERS, ROLE_DEFINITIONS, type TeamMember, type AppRole } from '@/data/roles';
import { toast } from 'sonner';
import { 
  Users, Plus, Search, Shield, Crown, Banknote, Calculator, 
  FolderKanban, User, MoreVertical, Mail, Calendar, Building2,
  CheckCircle, XCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const roleIcons: Record<AppRole, React.ComponentType<any>> = {
  super_admin: Shield,
  company_owner: Crown,
  finance_manager: Banknote,
  accountant: Calculator,
  project_manager: FolderKanban,
  employee: User,
};

export default function Team() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(MOCK_TEAM_MEMBERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newMember, setNewMember] = useState({
    full_name: '',
    email: '',
    role: 'employee' as AppRole,
    department: '',
  });

  const filteredMembers = teamMembers.filter(member => {
    const matchesSearch = 
      member.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || member.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const activeCount = teamMembers.filter(m => m.is_active).length;
  const roleStats = Object.entries(ROLE_DEFINITIONS).map(([id, role]) => ({
    ...role,
    count: teamMembers.filter(m => m.role === id).length,
  }));

  const handleAddMember = () => {
    if (!newMember.full_name || !newMember.email) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    const member: TeamMember = {
      id: 'member-' + Date.now(),
      ...newMember,
      is_active: true,
      joined_at: new Date().toISOString().split('T')[0],
    };

    setTeamMembers([member, ...teamMembers]);
    setNewMember({ full_name: '', email: '', role: 'employee', department: '' });
    setIsAddDialogOpen(false);
    toast.success('تم إضافة العضو بنجاح');
  };

  const handleToggleStatus = (memberId: string) => {
    setTeamMembers(teamMembers.map(m => 
      m.id === memberId ? { ...m, is_active: !m.is_active } : m
    ));
    toast.success('تم تحديث حالة العضو');
  };

  const handleChangeRole = (memberId: string, newRole: AppRole) => {
    setTeamMembers(teamMembers.map(m => 
      m.id === memberId ? { ...m, role: newRole } : m
    ));
    toast.success('تم تغيير الدور بنجاح');
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">إدارة الفريق</h1>
            <p className="text-slate-400">إدارة الأعضاء والصلاحيات</p>
          </div>
          <PermissionGuard permission="team:manage">
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
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300">الاسم الكامل *</Label>
                    <Input
                      value={newMember.full_name}
                      onChange={(e) => setNewMember({ ...newMember, full_name: e.target.value })}
                      placeholder="أحمد محمد"
                      className="bg-white/[0.05] border-white/[0.08] text-white rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">البريد الإلكتروني *</Label>
                    <Input
                      type="email"
                      value={newMember.email}
                      onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                      placeholder="ahmed@company.com"
                      className="bg-white/[0.05] border-white/[0.08] text-white rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">الدور *</Label>
                    <Select
                      value={newMember.role}
                      onValueChange={(value) => setNewMember({ ...newMember, role: value as AppRole })}
                    >
                      <SelectTrigger className="bg-white/[0.05] border-white/[0.08] text-white rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        {Object.values(ROLE_DEFINITIONS).map((role) => (
                          <SelectItem key={role.id} value={role.id} className="text-white">
                            {role.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">القسم</Label>
                    <Input
                      value={newMember.department}
                      onChange={(e) => setNewMember({ ...newMember, department: e.target.value })}
                      placeholder="المالية"
                      className="bg-white/[0.05] border-white/[0.08] text-white rounded-xl"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="border-white/[0.08] text-slate-300 rounded-xl">
                    إلغاء
                  </Button>
                  <Button onClick={handleAddMember} className="bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl">
                    إضافة
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </PermissionGuard>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-[#1e293b]/40 backdrop-blur-2xl border border-white/[0.08] p-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center shadow-lg shadow-violet-500/20">
                <Users className="w-6 h-6 text-violet-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{teamMembers.length}</p>
                <p className="text-xs text-slate-500">إجمالي الأعضاء</p>
              </div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl bg-[#1e293b]/40 backdrop-blur-2xl border border-white/[0.08] p-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <CheckCircle className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{activeCount}</p>
                <p className="text-xs text-slate-500">نشط</p>
              </div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl bg-[#1e293b]/40 backdrop-blur-2xl border border-white/[0.08] p-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center shadow-lg shadow-amber-500/20">
                <Crown className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{roleStats.filter(r => r.count > 0).length}</p>
                <p className="text-xs text-slate-500">أدوار نشطة</p>
              </div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl bg-[#1e293b]/40 backdrop-blur-2xl border border-white/[0.08] p-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center shadow-lg shadow-red-500/20">
                <XCircle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{teamMembers.length - activeCount}</p>
                <p className="text-xs text-slate-500">غير نشط</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
              placeholder="البحث في الفريق..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10 bg-white/[0.05] border-white/[0.08] text-white rounded-xl"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full sm:w-[200px] bg-white/[0.05] border-white/[0.08] text-white rounded-xl">
              <SelectValue placeholder="جميع الأدوار" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="all" className="text-white">جميع الأدوار</SelectItem>
              {Object.values(ROLE_DEFINITIONS).map((role) => (
                <SelectItem key={role.id} value={role.id} className="text-white">
                  {role.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Team Members Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMembers.map((member, index) => {
            const RoleIcon = roleIcons[member.role];
            const roleInfo = ROLE_DEFINITIONS[member.role];
            
            return (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`rounded-2xl bg-[#1e293b]/40 backdrop-blur-2xl border border-white/[0.08] p-5 hover:-translate-y-1 transition-all duration-300 ${
                  !member.is_active ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 border-2 border-violet-500/30">
                      <AvatarImage src={member.avatar_url} />
                      <AvatarFallback className={`bg-gradient-to-br ${roleInfo.color} text-white font-semibold`}>
                        {getInitials(member.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-white">{member.full_name}</h3>
                      <p className="text-xs text-slate-500">{member.email}</p>
                    </div>
                  </div>
                  <PermissionGuard permission="team:manage">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-slate-800 border-slate-700" align="end">
                        <DropdownMenuItem 
                          onClick={() => handleToggleStatus(member.id)}
                          className="text-white hover:bg-white/10"
                        >
                          {member.is_active ? 'تعطيل الحساب' : 'تفعيل الحساب'}
                        </DropdownMenuItem>
                        {Object.values(ROLE_DEFINITIONS).map((role) => (
                          role.id !== member.role && (
                            <DropdownMenuItem 
                              key={role.id}
                              onClick={() => handleChangeRole(member.id, role.id)}
                              className="text-white hover:bg-white/10"
                            >
                              تغيير إلى {role.name}
                            </DropdownMenuItem>
                          )
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </PermissionGuard>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge className={`bg-gradient-to-r ${roleInfo.color} text-white border-0 shadow-lg text-xs`}>
                      <RoleIcon className="w-3 h-3 ml-1" />
                      {roleInfo.name}
                    </Badge>
                    {!member.is_active && (
                      <Badge className="bg-red-500/20 text-red-400 border border-red-500/30 text-xs">
                        غير نشط
                      </Badge>
                    )}
                  </div>
                  
                  {member.department && (
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Building2 className="w-3 h-3" />
                      <span>{member.department}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Calendar className="w-3 h-3" />
                    <span>انضم في {new Date(member.joined_at).toLocaleDateString('ar-SA')}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {filteredMembers.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 mx-auto text-slate-600 mb-4" />
            <p className="text-slate-500">لا يوجد أعضاء مطابقين للبحث</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
