import { useEffect, useState, useRef } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTenant } from '@/contexts/TenantContext';
import { GL_CODES, COST_CENTERS, type Expense, type ExpenseStatus } from '@/data/mockData';
import { evaluatePolicy, type PolicyEvaluationResult } from '@/data/policyEngine';
import { addAuditLog } from '@/data/auditLogs';
import { VatCalculator } from '@/components/expenses/VatCalculator';
import { PolicyViolationAlert } from '@/components/expenses/PolicyViolationAlert';
import { toast } from 'sonner';
import { 
  Plus, Receipt, Upload, CheckCircle, XCircle, Clock, 
  CreditCard, Shield, ShoppingBag, Fuel, Plane, Building
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Category icons mapping
const getCategoryIcon = (glCode: string) => {
  switch (glCode) {
    case '6001': return Plane;
    case '6002': return Fuel;
    case '6003': return Building;
    default: return ShoppingBag;
  }
};

export default function Expenses() {
  const { currentCompany, profile, projects, expenses, setExpenses, isLoading } = useTenant();
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [policyResult, setPolicyResult] = useState<PolicyEvaluationResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newExpense, setNewExpense] = useState({
    description: '',
    amount: '',
    project_id: '',
    gl_code: '',
    cost_center: '',
    notes: '',
    includes_vat: true,
  });

  const isAccountant = profile?.role === 'finance_manager' || profile?.role === 'company_owner' || profile?.role === 'accountant';

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (newExpense.amount && newExpense.gl_code) {
      const result = evaluatePolicy(
        currentCompany.id,
        newExpense.gl_code,
        parseFloat(newExpense.amount),
        !!previewUrl
      );
      setPolicyResult(result);
    } else {
      setPolicyResult(null);
    }
  }, [newExpense.amount, newExpense.gl_code, previewUrl, currentCompany.id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const calculateVat = (amount: number, includesVat: boolean) => {
    if (includesVat) {
      const net = amount / 1.15;
      return { net, vat: amount - net, gross: amount };
    }
    const vat = amount * 0.15;
    return { net: amount, vat, gross: amount + vat };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (policyResult && !policyResult.passed) {
      toast.error('لا يمكن إرسال المصروف بسبب مخالفة السياسات');
      return;
    }

    setSubmitting(true);

    setTimeout(() => {
      const selectedProject = projects.find(p => p.id === newExpense.project_id);
      const amount = parseFloat(newExpense.amount);
      const vatCalc = calculateVat(amount, newExpense.includes_vat);
      
      const initialStatus: ExpenseStatus = policyResult?.requiresApproval ? 'pending' : 'pending';
      
      const newExp: Expense = {
        id: 'exp-' + Date.now(),
        description: newExpense.description,
        amount: vatCalc.gross,
        net_amount: vatCalc.net,
        vat_amount: vatCalc.vat,
        includes_vat: newExpense.includes_vat,
        status: initialStatus,
        receipt_url: previewUrl,
        created_at: new Date().toISOString(),
        project_id: newExpense.project_id,
        user_id: profile?.id || 'mock-user',
        gl_code: newExpense.gl_code,
        cost_center: newExpense.cost_center,
        projects: { name: selectedProject?.name || 'مشروع غير محدد' },
        profiles: { full_name: profile?.full_name || 'مستخدم' },
      };

      setExpenses([newExp, ...expenses]);
      
      addAuditLog({
        company_id: currentCompany.id,
        user_id: profile?.id || '',
        user_email: profile?.email || '',
        user_name: profile?.full_name || '',
        user_role: profile?.role || 'employee',
        action: 'create',
        entity_type: 'expense',
        entity_id: newExp.id,
        entity_name: newExp.description,
        new_values: { amount: newExp.amount, status: newExp.status },
        changes_summary: `تم إنشاء مصروف جديد: ${newExp.description} (${formatCurrency(newExp.amount)})`,
        ip_address: '192.168.1.100',
        user_agent: navigator.userAgent,
      });

      if (policyResult?.requiresApproval) {
        toast.success('تم إرسال المصروف للموافقة الإدارية', {
          description: policyResult.approvalReason,
          icon: <Shield className="w-4 h-4" />,
        });
      } else {
        toast.success('تم إضافة المصروف بنجاح');
      }

      setNewExpense({ description: '', amount: '', project_id: '', gl_code: '', cost_center: '', notes: '', includes_vat: true });
      setSelectedFile(null);
      setPreviewUrl(null);
      setPolicyResult(null);
      setIsDialogOpen(false);
      setSubmitting(false);
    }, 500);
  };

  const handleApprove = async (expenseId: string) => {
    const expense = expenses.find(e => e.id === expenseId);
    setExpenses(expenses.map(e => 
      e.id === expenseId ? { ...e, status: 'approved' as ExpenseStatus, approved_at: new Date().toISOString() } : e
    ));
    
    addAuditLog({
      company_id: currentCompany.id,
      user_id: profile?.id || '',
      user_email: profile?.email || '',
      user_name: profile?.full_name || '',
      user_role: profile?.role || 'employee',
      action: 'approve',
      entity_type: 'expense',
      entity_id: expenseId,
      entity_name: expense?.description,
      old_values: { status: 'pending' },
      new_values: { status: 'approved' },
      changes_summary: `تم قبول المصروف: ${expense?.description}`,
      ip_address: '192.168.1.100',
      user_agent: navigator.userAgent,
    });

    toast.success('تم قبول المصروف');
  };

  const handleReject = async (expenseId: string) => {
    if (!rejectionReason.trim()) {
      toast.error('يرجى إدخال سبب الرفض');
      return;
    }
    const expense = expenses.find(e => e.id === expenseId);
    setExpenses(expenses.map(e => 
      e.id === expenseId ? { 
        ...e, 
        status: 'rejected' as ExpenseStatus, 
        rejection_reason: rejectionReason,
        approved_at: new Date().toISOString() 
      } : e
    ));

    addAuditLog({
      company_id: currentCompany.id,
      user_id: profile?.id || '',
      user_email: profile?.email || '',
      user_name: profile?.full_name || '',
      user_role: profile?.role || 'employee',
      action: 'reject',
      entity_type: 'expense',
      entity_id: expenseId,
      entity_name: expense?.description,
      old_values: { status: 'pending' },
      new_values: { status: 'rejected', rejection_reason: rejectionReason },
      changes_summary: `تم رفض المصروف: ${expense?.description} - السبب: ${rejectionReason}`,
      ip_address: '192.168.1.100',
      user_agent: navigator.userAgent,
    });

    setRejectionReason('');
    setIsRejectDialogOpen(false);
    toast.success('تم رفض المصروف');
  };

  const handleSettle = async (expenseId: string) => {
    setExpenses(expenses.map(e => 
      e.id === expenseId ? { ...e, status: 'settled' as ExpenseStatus, settled_at: new Date().toISOString() } : e
    ));
    toast.success('تمت تسوية المصروف');
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

  const statusConfig = {
    pending: { label: 'قيد المراجعة', icon: Clock, colorClass: 'bg-amber-500/20 text-amber-400 shadow-amber-500/30' },
    approved: { label: 'مقبول', icon: CheckCircle, colorClass: 'bg-emerald-500/20 text-emerald-400 shadow-emerald-500/30' },
    rejected: { label: 'مرفوض', icon: XCircle, colorClass: 'bg-red-500/20 text-red-400 shadow-red-500/30' },
    settled: { label: 'تمت التسوية', icon: CreditCard, colorClass: 'bg-violet-500/20 text-violet-400 shadow-violet-500/30' },
  };

  const pendingExpenses = expenses.filter((e) => e.status === 'pending');
  const approvedExpenses = expenses.filter((e) => e.status === 'approved');

  if (loading || isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 rounded-full border-4 border-violet-500 border-t-transparent animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">المصروفات</h1>
            <p className="text-slate-400">إدارة مصروفات {currentCompany.name_ar}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="gap-1 bg-violet-500/20 text-violet-400 border border-violet-500/30 rounded-lg">
              <Shield className="w-3 h-3" />
              Policy Engine Active
            </Badge>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-lg shadow-violet-500/30 rounded-xl">
                  <Plus className="w-4 h-4 ml-2" />
                  إضافة مصروف
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto bg-[#1e293b]/95 backdrop-blur-2xl border-white/[0.08] rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="text-white">إضافة مصروف جديد</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-300">المشروع *</Label>
                      <Select
                        value={newExpense.project_id}
                        onValueChange={(value) => setNewExpense({ ...newExpense, project_id: value })}
                      >
                        <SelectTrigger className="bg-white/[0.05] border-white/[0.08] text-white rounded-xl">
                          <SelectValue placeholder="اختر المشروع" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          {projects.map((project) => (
                            <SelectItem key={project.id} value={project.id} className="text-white">
                              {project.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300">كود الحساب (GL) *</Label>
                      <Select
                        value={newExpense.gl_code}
                        onValueChange={(value) => setNewExpense({ ...newExpense, gl_code: value })}
                      >
                        <SelectTrigger className="bg-white/[0.05] border-white/[0.08] text-white rounded-xl">
                          <SelectValue placeholder="اختر الكود" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          {Object.values(GL_CODES).map((gl) => (
                            <SelectItem key={gl.code} value={gl.code} className="text-white">
                              {gl.code} - {gl.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-300">مركز التكلفة</Label>
                      <Select
                        value={newExpense.cost_center}
                        onValueChange={(value) => setNewExpense({ ...newExpense, cost_center: value })}
                      >
                        <SelectTrigger className="bg-white/[0.05] border-white/[0.08] text-white rounded-xl">
                          <SelectValue placeholder="اختر المركز" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          {COST_CENTERS.map((cc) => (
                            <SelectItem key={cc.id} value={cc.id} className="text-white">
                              {cc.code} - {cc.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300">المبلغ (ريال) *</Label>
                      <Input
                        type="number"
                        value={newExpense.amount}
                        onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                        placeholder="1500"
                        required
                        className="bg-white/[0.05] border-white/[0.08] text-white rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-300">وصف المصروف *</Label>
                    <Input
                      value={newExpense.description}
                      onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                      placeholder="مثال: شراء مواد بناء"
                      required
                      className="bg-white/[0.05] border-white/[0.08] text-white rounded-xl"
                    />
                  </div>

                  <VatCalculator
                    amount={parseFloat(newExpense.amount) || 0}
                    includesVat={newExpense.includes_vat}
                    onVatToggle={(val) => setNewExpense({ ...newExpense, includes_vat: val })}
                  />

                  <AnimatePresence>
                    {policyResult && policyResult.violations.length > 0 && (
                      <PolicyViolationAlert result={policyResult} />
                    )}
                  </AnimatePresence>

                  <div className="space-y-2">
                    <Label className="text-slate-300">إيصال الدفع</Label>
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-white/[0.08] rounded-xl p-6 text-center cursor-pointer hover:border-violet-500/50 hover:bg-white/[0.02] transition-all"
                    >
                      {previewUrl ? (
                        <img src={previewUrl} alt="Preview" className="max-h-32 mx-auto rounded-lg" />
                      ) : (
                        <>
                          <Upload className="w-10 h-10 mx-auto text-slate-500 mb-2" />
                          <p className="text-sm text-slate-500">اضغط لرفع صورة الإيصال</p>
                        </>
                      )}
                    </div>
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="border-white/[0.08] text-slate-300 hover:bg-white/[0.05] rounded-xl">
                      إلغاء
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={submitting || !newExpense.project_id || !newExpense.gl_code || (policyResult && !policyResult.passed)} 
                      className="bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl"
                    >
                      {submitting ? 'جاري الإضافة...' : policyResult?.requiresApproval ? 'إرسال للموافقة' : 'إضافة المصروف'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Expense Tabs */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-4 bg-[#1e293b]/40 backdrop-blur-xl border border-white/[0.08] rounded-xl p-1">
            <TabsTrigger value="all" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-purple-600 data-[state=active]:text-white text-slate-400">
              الكل ({expenses.length})
            </TabsTrigger>
            <TabsTrigger value="pending" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-purple-600 data-[state=active]:text-white text-slate-400">
              قيد المراجعة ({pendingExpenses.length})
            </TabsTrigger>
            <TabsTrigger value="approved" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-purple-600 data-[state=active]:text-white text-slate-400">
              مقبول ({approvedExpenses.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            {expenses.length === 0 ? (
              <div className="rounded-[2rem] bg-[#1e293b]/40 backdrop-blur-2xl border border-white/[0.08] p-12 text-center">
                <Receipt className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                <p className="text-slate-400">لا توجد مصروفات لهذه الشركة</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {expenses.map((expense) => {
                  const status = statusConfig[expense.status];
                  const StatusIcon = status.icon;
                  const CategoryIcon = getCategoryIcon(expense.gl_code);
                  
                  return (
                    <motion.div
                      key={expense.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-[2rem] bg-[#1e293b]/40 backdrop-blur-2xl border border-white/[0.08] p-6 hover:-translate-y-1 transition-all duration-300 shadow-2xl shadow-indigo-500/10"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/30 flex items-center justify-center shadow-lg shadow-violet-500/20">
                          <CategoryIcon className="w-7 h-7 text-violet-400" />
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 shadow-lg ${status.colorClass}`}>
                          <StatusIcon className="w-3 h-3" />
                          {status.label}
                        </span>
                      </div>
                      
                      <h3 className="text-lg font-semibold text-white mb-1 truncate">{expense.description}</h3>
                      <p className="text-sm text-slate-500 mb-4">{expense.projects?.name}</p>
                      
                      <div className="flex items-end justify-between">
                        <div>
                          <p className="text-xs text-slate-600 mb-1">{formatDate(expense.created_at)}</p>
                          <p className="text-2xl font-bold text-white">{formatCurrency(expense.amount)}</p>
                        </div>
                        
                        {expense.status === 'pending' && isAccountant && (
                          <div className="flex gap-1">
                            <Button 
                              size="sm" 
                              onClick={() => handleApprove(expense.id)} 
                              className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-xl"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              onClick={() => { setSelectedExpense(expense); setIsRejectDialogOpen(true); }} 
                              className="bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl"
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="pending">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingExpenses.map((expense) => {
                const CategoryIcon = getCategoryIcon(expense.gl_code);
                return (
                  <motion.div
                    key={expense.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-[2rem] bg-[#1e293b]/40 backdrop-blur-2xl border border-amber-500/20 p-6 hover:-translate-y-1 transition-all duration-300"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shadow-lg shadow-amber-500/20">
                        <CategoryIcon className="w-7 h-7 text-amber-400" />
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-400 shadow-lg shadow-amber-500/30 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        قيد المراجعة
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-white mb-1">{expense.description}</h3>
                    <p className="text-sm text-slate-500 mb-4">{expense.projects?.name}</p>
                    
                    <div className="flex items-end justify-between">
                      <p className="text-2xl font-bold text-white">{formatCurrency(expense.amount)}</p>
                      {isAccountant && (
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleApprove(expense.id)} className="bg-emerald-500 hover:bg-emerald-600 rounded-xl">
                            <CheckCircle className="w-4 h-4 ml-1" /> موافقة
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => { setSelectedExpense(expense); setIsRejectDialogOpen(true); }} className="rounded-xl">
                            <XCircle className="w-4 h-4 ml-1" /> رفض
                          </Button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="approved">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {approvedExpenses.map((expense) => {
                const CategoryIcon = getCategoryIcon(expense.gl_code);
                return (
                  <motion.div
                    key={expense.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-[2rem] bg-[#1e293b]/40 backdrop-blur-2xl border border-emerald-500/20 p-6 hover:-translate-y-1 transition-all duration-300"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                        <CategoryIcon className="w-7 h-7 text-emerald-400" />
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400 shadow-lg shadow-emerald-500/30 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        مقبول
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-white mb-1">{expense.description}</h3>
                    <p className="text-sm text-slate-500 mb-4">{expense.projects?.name}</p>
                    
                    <div className="flex items-end justify-between">
                      <p className="text-2xl font-bold text-white">{formatCurrency(expense.amount)}</p>
                      {isAccountant && (
                        <Button size="sm" onClick={() => handleSettle(expense.id)} className="bg-violet-500 hover:bg-violet-600 rounded-xl">
                          <CreditCard className="w-4 h-4 ml-1" /> تسوية
                        </Button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>

        {/* Reject Dialog */}
        <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
          <DialogContent className="bg-[#1e293b]/95 backdrop-blur-2xl border-white/[0.08] rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-white">سبب الرفض</DialogTitle>
            </DialogHeader>
            <Textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="يرجى إدخال سبب رفض المصروف..."
              rows={3}
              className="bg-white/[0.05] border-white/[0.08] text-white rounded-xl"
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)} className="border-white/[0.08] text-slate-300 hover:bg-white/[0.05] rounded-xl">إلغاء</Button>
              <Button variant="destructive" onClick={() => selectedExpense && handleReject(selectedExpense.id)} className="rounded-xl">
                تأكيد الرفض
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
