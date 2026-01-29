// =====================================================
// PROJECTS PAGE - ZERO DEAD BUTTON POLICY
// Full CRUD with progress tracking
// =====================================================

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useApp, ProjectStatus } from '@/contexts/AppContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { 
  Plus, FolderKanban, MapPin, Calendar as CalendarIcon, 
  Users, TrendingUp, Trash2, Edit, MoreHorizontal
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const statusConfig: Record<ProjectStatus, { label: string; color: string; bgColor: string }> = {
  active: { label: 'نشط', color: 'text-emerald-400', bgColor: 'bg-emerald-500/20' },
  completed: { label: 'مكتمل', color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
  on_hold: { label: 'معلق', color: 'text-amber-400', bgColor: 'bg-amber-500/20' },
};

export default function ProjectsNew() {
  const { 
    projects, addProject, updateProject, removeProject, 
    formatCurrency, currentRole 
  } = useApp();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();

  const [formData, setFormData] = useState({
    name: '',
    client: '',
    description: '',
    budget: '',
    location: '',
    status: 'active' as ProjectStatus,
    manager_name: '',
  });

  const isAdmin = currentRole === 'admin' || currentRole === 'manager';

  const resetForm = () => {
    setFormData({
      name: '',
      client: '',
      description: '',
      budget: '',
      location: '',
      status: 'active',
      manager_name: '',
    });
    setStartDate(undefined);
    setEndDate(undefined);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('يرجى إدخال اسم المشروع');
      return;
    }
    if (!formData.client.trim()) {
      toast.error('يرجى إدخال اسم العميل');
      return;
    }
    if (!formData.budget || parseFloat(formData.budget) <= 0) {
      toast.error('يرجى إدخال ميزانية صحيحة');
      return;
    }
    if (!startDate) {
      toast.error('يرجى اختيار تاريخ البداية');
      return;
    }

    setSubmitting(true);

    setTimeout(() => {
      addProject({
        name: formData.name,
        client: formData.client,
        description: formData.description,
        budget: parseFloat(formData.budget),
        status: formData.status,
        location: formData.location,
        start_date: startDate.toISOString(),
        end_date: endDate?.toISOString(),
        manager_name: formData.manager_name,
      });

      resetForm();
      setIsDialogOpen(false);
      setSubmitting(false);
    }, 300);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const totalBudget = projects.reduce((sum, p) => sum + p.budget, 0);
  const totalSpent = projects.reduce((sum, p) => sum + p.spent, 0);
  const activeProjects = projects.filter(p => p.status === 'active').length;

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">المشاريع</h1>
            <p className="text-slate-400">إدارة وتتبع جميع المشاريع</p>
          </div>
          
          {isAdmin && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-lg shadow-violet-500/30 rounded-xl">
                  <Plus className="w-4 h-4 ml-2" />
                  مشروع جديد
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto bg-[#1e293b]/95 backdrop-blur-2xl border-white/[0.08] rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="text-white">إنشاء مشروع جديد</DialogTitle>
                  <DialogDescription className="text-slate-400">
                    أدخل تفاصيل المشروع الجديد
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300">اسم المشروع *</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="مثال: برج الرياض التجاري"
                      className="bg-white/[0.05] border-white/[0.08] text-white rounded-xl"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-300">اسم العميل *</Label>
                      <Input
                        value={formData.client}
                        onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                        placeholder="اسم الشركة أو العميل"
                        className="bg-white/[0.05] border-white/[0.08] text-white rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300">الميزانية (ريال) *</Label>
                      <Input
                        type="number"
                        value={formData.budget}
                        onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                        placeholder="0"
                        min="0"
                        className="bg-white/[0.05] border-white/[0.08] text-white rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-300">الوصف</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="وصف تفصيلي للمشروع..."
                      rows={2}
                      className="bg-white/[0.05] border-white/[0.08] text-white rounded-xl resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-300">الموقع</Label>
                      <Input
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        placeholder="المدينة"
                        className="bg-white/[0.05] border-white/[0.08] text-white rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300">مدير المشروع</Label>
                      <Input
                        value={formData.manager_name}
                        onChange={(e) => setFormData({ ...formData, manager_name: e.target.value })}
                        placeholder="اسم المدير"
                        className="bg-white/[0.05] border-white/[0.08] text-white rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-300">تاريخ البداية *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-right bg-white/[0.05] border-white/[0.08] text-white rounded-xl hover:bg-white/[0.08]",
                              !startDate && "text-slate-500"
                            )}
                          >
                            <CalendarIcon className="ml-2 h-4 w-4" />
                            {startDate ? format(startDate, "PPP", { locale: ar }) : "اختر التاريخ"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-slate-800 border-slate-700" align="start">
                          <Calendar
                            mode="single"
                            selected={startDate}
                            onSelect={setStartDate}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300">تاريخ النهاية</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-right bg-white/[0.05] border-white/[0.08] text-white rounded-xl hover:bg-white/[0.08]",
                              !endDate && "text-slate-500"
                            )}
                          >
                            <CalendarIcon className="ml-2 h-4 w-4" />
                            {endDate ? format(endDate, "PPP", { locale: ar }) : "اختر التاريخ"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-slate-800 border-slate-700" align="start">
                          <Calendar
                            mode="single"
                            selected={endDate}
                            onSelect={setEndDate}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-300">الحالة</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: ProjectStatus) => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger className="bg-white/[0.05] border-white/[0.08] text-white rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700 z-50">
                        {Object.entries(statusConfig).map(([status, config]) => (
                          <SelectItem key={status} value={status} className="text-white">
                            {config.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <DialogFooter className="gap-2">
                    <Button 
                      type="button"
                      variant="outline" 
                      onClick={() => { resetForm(); setIsDialogOpen(false); }}
                      className="border-white/[0.08] text-slate-300 hover:bg-white/[0.05] rounded-xl"
                    >
                      إلغاء
                    </Button>
                    <Button 
                      type="submit"
                      disabled={submitting}
                      className="bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl"
                    >
                      {submitting ? 'جاري الإنشاء...' : 'إنشاء المشروع'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
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
                <FolderKanban className="w-6 h-6 text-violet-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{projects.length}</p>
                <p className="text-sm text-slate-500">إجمالي المشاريع</p>
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
                <TrendingUp className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{activeProjects}</p>
                <p className="text-sm text-slate-500">مشاريع نشطة</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl bg-[#1e293b]/40 backdrop-blur-xl border border-white/[0.08] p-5"
          >
            <div className="flex flex-col">
              <p className="text-sm text-slate-500 mb-1">إجمالي الميزانيات</p>
              <p className="text-xl font-bold text-white">{formatCurrency(totalBudget)}</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl bg-[#1e293b]/40 backdrop-blur-xl border border-white/[0.08] p-5"
          >
            <div className="flex flex-col">
              <p className="text-sm text-slate-500 mb-1">إجمالي المصروف</p>
              <p className="text-xl font-bold text-amber-400">{formatCurrency(totalSpent)}</p>
            </div>
          </motion.div>
        </div>

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <div className="rounded-2xl bg-[#1e293b]/40 backdrop-blur-xl border border-white/[0.08] p-12 text-center">
            <FolderKanban className="w-16 h-16 mx-auto mb-4 text-slate-600" />
            <p className="text-slate-400">لا توجد مشاريع</p>
            {isAdmin && (
              <Button onClick={() => setIsDialogOpen(true)} className="mt-4 bg-violet-500/20 text-violet-400 hover:bg-violet-500/30 rounded-xl">
                <Plus className="w-4 h-4 ml-2" />
                إنشاء مشروع جديد
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {projects.map((project, index) => {
                const status = statusConfig[project.status];
                const budgetUsed = project.budget > 0 ? (project.spent / project.budget) * 100 : 0;
                
                return (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.05 }}
                    className="rounded-2xl bg-[#1e293b]/40 backdrop-blur-xl border border-white/[0.08] p-6 hover:-translate-y-1 transition-all"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/30 flex items-center justify-center">
                        <FolderKanban className="w-7 h-7 text-violet-400" />
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={`${status.bgColor} ${status.color} border-0`}>
                          {status.label}
                        </Badge>
                        {isAdmin && (
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            onClick={() => removeProject(project.id)}
                            className="h-8 w-8 text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    <h3 className="text-lg font-semibold text-white mb-1">{project.name}</h3>
                    <p className="text-sm text-slate-500 mb-4">{project.client}</p>

                    {project.location && (
                      <div className="flex items-center gap-2 text-sm text-slate-400 mb-3">
                        <MapPin className="w-4 h-4" />
                        {project.location}
                      </div>
                    )}

                    {/* Budget Progress */}
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">استهلاك الميزانية</span>
                        <span className={budgetUsed > 80 ? 'text-red-400' : 'text-slate-300'}>
                          {budgetUsed.toFixed(0)}%
                        </span>
                      </div>
                      <div className="h-2 bg-white/[0.05] rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(budgetUsed, 100)}%` }}
                          transition={{ duration: 0.5, delay: index * 0.1 }}
                          className={`h-full rounded-full ${getProgressColor(budgetUsed)}`}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>{formatCurrency(project.spent)}</span>
                        <span>{formatCurrency(project.budget)}</span>
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">نسبة الإنجاز</span>
                        <span className="text-emerald-400">{project.progress}%</span>
                      </div>
                      <Progress value={project.progress} className="h-2" />
                    </div>

                    {project.manager_name && (
                      <div className="mt-4 pt-4 border-t border-white/[0.05] flex items-center gap-2 text-sm text-slate-400">
                        <Users className="w-4 h-4" />
                        {project.manager_name}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
