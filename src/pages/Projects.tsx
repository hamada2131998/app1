import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { MOCK_PROJECTS } from '@/data/mockData';
import { toast } from 'sonner';
import { Plus, FolderKanban, Building, MapPin, Calendar, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface Project {
  id: string;
  name: string;
  description: string;
  budget: number;
  spent: number;
  location: string;
  start_date: string;
  created_at: string;
}

// Mock team members for visual effect
const mockTeamMembers = [
  { name: 'أحمد', color: 'from-violet-500 to-purple-600' },
  { name: 'سارة', color: 'from-emerald-500 to-teal-600' },
  { name: 'محمد', color: 'from-amber-500 to-orange-600' },
];

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    budget: '',
    location: '',
    start_date: '',
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setProjects(MOCK_PROJECTS);
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    setTimeout(() => {
      const newProj: Project = {
        id: 'proj-' + Date.now(),
        name: newProject.name,
        description: newProject.description,
        budget: parseFloat(newProject.budget),
        spent: 0,
        location: newProject.location,
        start_date: newProject.start_date,
        created_at: new Date().toISOString(),
      };

      setProjects([newProj, ...projects]);
      toast.success('تم إنشاء المشروع بنجاح');
      setNewProject({ name: '', description: '', budget: '', location: '', start_date: '' });
      setIsDialogOpen(false);
      setSubmitting(false);
    }, 500);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(date));
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'from-red-500 to-rose-600';
    if (percentage >= 70) return 'from-amber-500 to-orange-600';
    return 'from-emerald-500 to-teal-600';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">المشاريع</h1>
            <p className="text-slate-400">إدارة مشاريع البناء والميزانيات</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-lg shadow-violet-500/30 rounded-xl">
                <Plus className="w-4 h-4 ml-2" />
                مشروع جديد
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-[#1e293b]/95 backdrop-blur-2xl border-white/[0.08] rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-white">إضافة مشروع جديد</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">اسم المشروع</Label>
                  <Input
                    value={newProject.name}
                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                    placeholder="مثال: برج الرياض التجاري"
                    required
                    className="bg-white/[0.05] border-white/[0.08] text-white rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">الوصف</Label>
                  <Input
                    value={newProject.description}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                    placeholder="وصف مختصر للمشروع"
                    className="bg-white/[0.05] border-white/[0.08] text-white rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">الميزانية (ريال)</Label>
                  <Input
                    type="number"
                    value={newProject.budget}
                    onChange={(e) => setNewProject({ ...newProject, budget: e.target.value })}
                    placeholder="500000"
                    required
                    className="bg-white/[0.05] border-white/[0.08] text-white rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">الموقع</Label>
                  <Input
                    value={newProject.location}
                    onChange={(e) => setNewProject({ ...newProject, location: e.target.value })}
                    placeholder="الرياض، المملكة العربية السعودية"
                    className="bg-white/[0.05] border-white/[0.08] text-white rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">تاريخ البدء</Label>
                  <Input
                    type="date"
                    value={newProject.start_date}
                    onChange={(e) => setNewProject({ ...newProject, start_date: e.target.value })}
                    required
                    className="bg-white/[0.05] border-white/[0.08] text-white rounded-xl"
                  />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="border-white/[0.08] text-slate-300 hover:bg-white/[0.05] rounded-xl">
                    إلغاء
                  </Button>
                  <Button type="submit" disabled={submitting} className="bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl">
                    {submitting ? 'جاري الإنشاء...' : 'إنشاء المشروع'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Projects Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-[2rem] bg-[#1e293b]/40 backdrop-blur-2xl border border-white/[0.08] p-6">
                <div className="space-y-4">
                  <div className="h-6 bg-white/[0.05] animate-pulse rounded w-3/4" />
                  <div className="h-4 bg-white/[0.05] animate-pulse rounded w-1/2" />
                  <div className="h-2 bg-white/[0.05] animate-pulse rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="rounded-[2rem] bg-[#1e293b]/40 backdrop-blur-2xl border border-white/[0.08] p-12 text-center">
            <FolderKanban className="w-16 h-16 mx-auto text-slate-600 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">لا توجد مشاريع</h3>
            <p className="text-slate-400 mb-4">ابدأ بإضافة مشروعك الأول</p>
            <Button onClick={() => setIsDialogOpen(true)} className="bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl">
              <Plus className="w-4 h-4 ml-2" />
              إضافة مشروع
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project, index) => {
              const percentage = project.budget > 0 ? Math.round((project.spent / project.budget) * 100) : 0;
              const progressColor = getProgressColor(percentage);
              
              return (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="rounded-[2rem] bg-[#1e293b]/40 backdrop-blur-2xl border border-white/[0.08] p-6 hover:-translate-y-1 transition-all duration-300 shadow-2xl shadow-indigo-500/10"
                >
                  {/* Project Header */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-violet-500/30">
                      <Building className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-white truncate">{project.name}</h3>
                      {project.description && (
                        <p className="text-sm text-slate-500 truncate">{project.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Location & Date */}
                  <div className="flex items-center gap-4 text-sm text-slate-500 mb-6">
                    {project.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span className="truncate">{project.location}</span>
                      </div>
                    )}
                    {project.start_date && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(project.start_date)}</span>
                      </div>
                    )}
                  </div>

                  {/* Budget Progress */}
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">الميزانية المستخدمة</span>
                      <span className="font-bold text-white">{percentage}%</span>
                    </div>
                    <div className="relative h-3 bg-white/[0.05] rounded-full overflow-hidden">
                      <div
                        className={`absolute top-0 right-0 h-full rounded-full bg-gradient-to-l ${progressColor} transition-all shadow-lg`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">مصروف: {formatCurrency(project.spent)}</span>
                      <span className="text-slate-400">من {formatCurrency(project.budget)}</span>
                    </div>
                  </div>

                  {/* Team Avatars */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4 text-slate-500 ml-2" />
                      <div className="flex -space-x-2 rtl:space-x-reverse">
                        {mockTeamMembers.map((member, i) => (
                          <Avatar key={i} className="w-8 h-8 border-2 border-[#1e293b]">
                            <AvatarFallback className={`bg-gradient-to-br ${member.color} text-white text-xs`}>
                              {member.name[0]}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                      </div>
                    </div>
                    <span className="text-xs text-slate-600">+{Math.floor(Math.random() * 5) + 2} أعضاء</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
