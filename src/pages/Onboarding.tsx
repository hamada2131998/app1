import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, ChevronRight, Users, Building2, Layers, RefreshCw } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useCompany } from '@/contexts/CompanyContext';
import { useSetupStatus } from '@/hooks/useSetupStatus';
import type { Branch } from '@/types';
import { createBranch, inviteNewUser, listBranches } from '@/services/settings.service';
import { createCostCenter } from '@/services/costCenters';

export default function Onboarding() {
  const { company_id, role } = useCompany();
  const { counts, isComplete, loading, error, refresh } = useSetupStatus();

  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchName, setBranchName] = useState('');
  const [costCenterName, setCostCenterName] = useState('');
  const [costCenterCode, setCostCenterCode] = useState('');
  const [costCenterBranchId, setCostCenterBranchId] = useState<string>('none');
  const [employeeName, setEmployeeName] = useState('');
  const [employeeEmail, setEmployeeEmail] = useState('');
  const [saving, setSaving] = useState(false);

  const isOwner = role === 'company_owner';

  const steps = useMemo(() => [
    {
      id: 'branches',
      title: 'إنشاء فرع واحد على الأقل',
      description: 'عرّف مواقع أو فروع شركتك لتوحيد المصروفات.',
      done: counts.branches > 0,
      icon: Building2,
    },
    {
      id: 'cost-centers',
      title: 'إنشاء مركز تكلفة واحد على الأقل',
      description: 'قسّم المصروفات حسب الأقسام أو المشاريع.',
      done: counts.costCenters > 0,
      icon: Layers,
    },
    {
      id: 'employees',
      title: 'دعوة موظف واحد على الأقل',
      description: 'أرسل دعوة للموظفين لبدء طلب المصروفات.',
      done: counts.employees > 0,
      icon: Users,
    },
  ], [counts]);

  const completedSteps = steps.filter(step => step.done).length;
  const completionRate = Math.round((completedSteps / steps.length) * 100);

  useEffect(() => {
    if (!company_id) return;
    listBranches()
      .then(setBranches)
      .catch((err) => {
        console.error(err);
        toast.error('تعذر تحميل الفروع', { description: err?.message || String(err) });
      });
  }, [company_id]);

  const handleCreateBranch = async () => {
    if (!branchName.trim()) {
      toast.error('أدخل اسم الفرع');
      return;
    }
    setSaving(true);
    try {
      await createBranch(branchName.trim());
      toast.success('تم إنشاء الفرع بنجاح');
      setBranchName('');
      await refresh();
      const updated = await listBranches();
      setBranches(updated);
    } catch (err: any) {
      console.error(err);
      toast.error('فشل إنشاء الفرع', { description: err?.message || String(err) });
    } finally {
      setSaving(false);
    }
  };

  const handleCreateCostCenter = async () => {
    if (!company_id) return;
    if (!costCenterName.trim()) {
      toast.error('أدخل اسم مركز التكلفة');
      return;
    }
    setSaving(true);
    try {
      const fallbackCode = `CC-${Date.now().toString().slice(-4)}`;
      await createCostCenter({
        company_id,
        name: costCenterName.trim(),
        code: costCenterCode.trim() || fallbackCode,
        branch_id: costCenterBranchId === 'none' ? null : costCenterBranchId,
      });
      toast.success('تم إنشاء مركز التكلفة');
      setCostCenterName('');
      setCostCenterCode('');
      await refresh();
    } catch (err: any) {
      console.error(err);
      toast.error('فشل إنشاء مركز التكلفة', { description: err?.message || String(err) });
    } finally {
      setSaving(false);
    }
  };

  const handleInviteEmployee = async () => {
    if (!company_id) return;
    if (!employeeName.trim() || !employeeEmail.trim()) {
      toast.error('أدخل الاسم والبريد الإلكتروني');
      return;
    }
    setSaving(true);
    try {
      await inviteNewUser({
        company_id,
        full_name: employeeName.trim(),
        email: employeeEmail.trim(),
        role: 'employee',
      });
      toast.success('تم إرسال الدعوة بنجاح');
      setEmployeeName('');
      setEmployeeEmail('');
      await refresh();
    } catch (err: any) {
      console.error(err);
      toast.error('فشل إرسال الدعوة', { description: err?.message || String(err) });
    } finally {
      setSaving(false);
    }
  };

  if (!isOwner) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-white">معالج الإعداد</CardTitle>
              <CardDescription className="text-slate-400">
                هذا المعالج متاح فقط لمالك الشركة. إذا كنت بحاجة لإعداد النظام، تواصل مع المالك.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="gradient-primary">
                <Link to="/dashboard">العودة للوحة التحكم</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">مرحباً بك في إعداد النظام</h1>
            <p className="text-slate-400">أكمل هذه الخطوات لبدء العمل على المصروفات والموافقات.</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge className="bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              {completedSteps} من {steps.length} مكتملة
            </Badge>
            <Button variant="outline" onClick={refresh} className="border-white/[0.08] text-slate-200 hover:bg-white/[0.05]">
              <RefreshCw className={`w-4 h-4 ml-2 ${loading ? 'animate-spin' : ''}`} />
              تحديث الحالة
            </Button>
          </div>
        </div>

        <Card className="bg-[#1e293b]/40 border-white/[0.08]">
          <CardContent className="py-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between text-sm text-slate-400">
                <span>نسبة الإكمال</span>
                <span>{completionRate}%</span>
              </div>
              <div className="w-full h-3 bg-white/[0.05] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
              {error && <p className="text-sm text-rose-300">{error}</p>}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <Card key={step.id} className="bg-[#0f172a]/60 border-white/[0.08]">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center">
                        <Icon className="w-5 h-5 text-violet-300" />
                      </div>
                      <div>
                        <CardTitle className="text-white text-base">{step.title}</CardTitle>
                        <CardDescription className="text-slate-400 text-xs">{step.description}</CardDescription>
                      </div>
                    </div>
                    {step.done && (
                      <CheckCircle className="w-5 h-5 text-emerald-400" />
                    )}
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="bg-[#1e293b]/40 border-white/[0.08]">
            <CardHeader>
              <CardTitle className="text-white">إضافة فرع</CardTitle>
              <CardDescription className="text-slate-400">عدد الفروع الحالية: {counts.branches}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-300">اسم الفرع</Label>
                <Input
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                  placeholder="مثال: فرع الرياض"
                  className="bg-white/[0.05] border-white/[0.08] text-white"
                />
              </div>
              <Button onClick={handleCreateBranch} disabled={saving} className="w-full gradient-primary">
                إنشاء الفرع
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-[#1e293b]/40 border-white/[0.08]">
            <CardHeader>
              <CardTitle className="text-white">إضافة مركز تكلفة</CardTitle>
              <CardDescription className="text-slate-400">عدد المراكز الحالية: {counts.costCenters}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-300">اسم المركز</Label>
                <Input
                  value={costCenterName}
                  onChange={(e) => setCostCenterName(e.target.value)}
                  placeholder="مثال: قسم المبيعات"
                  className="bg-white/[0.05] border-white/[0.08] text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">الرمز (اختياري)</Label>
                <Input
                  value={costCenterCode}
                  onChange={(e) => setCostCenterCode(e.target.value)}
                  placeholder="مثال: CC-001"
                  className="bg-white/[0.05] border-white/[0.08] text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">الفرع المرتبط (اختياري)</Label>
                <Select value={costCenterBranchId} onValueChange={setCostCenterBranchId}>
                  <SelectTrigger className="bg-white/[0.05] border-white/[0.08] text-white">
                    <SelectValue placeholder="اختر الفرع" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="none" className="text-white">بدون فرع</SelectItem>
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id} className="text-white">
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreateCostCenter} disabled={saving} className="w-full gradient-primary">
                إنشاء مركز تكلفة
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-[#1e293b]/40 border-white/[0.08]">
            <CardHeader>
              <CardTitle className="text-white">دعوة موظف</CardTitle>
              <CardDescription className="text-slate-400">عدد الموظفين المدعوين: {counts.employees}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-300">الاسم الكامل</Label>
                <Input
                  value={employeeName}
                  onChange={(e) => setEmployeeName(e.target.value)}
                  placeholder="مثال: خالد السبيعي"
                  className="bg-white/[0.05] border-white/[0.08] text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">البريد الإلكتروني</Label>
                <Input
                  type="email"
                  value={employeeEmail}
                  onChange={(e) => setEmployeeEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="bg-white/[0.05] border-white/[0.08] text-white"
                />
              </div>
              <Button onClick={handleInviteEmployee} disabled={saving} className="w-full gradient-primary">
                إرسال الدعوة
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-[#0f172a]/60 border-white/[0.08]">
          <CardContent className="py-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-white font-semibold">جاهز للانطلاق؟</h3>
              <p className="text-slate-400 text-sm">لن تتمكن من الوصول لبقية النظام حتى اكتمال الخطوات.</p>
            </div>
            <Button asChild className="gradient-primary" disabled={!isComplete}>
              <Link to="/dashboard">
                الانتقال للوحة التحكم
                <ChevronRight className="w-4 h-4 mr-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
