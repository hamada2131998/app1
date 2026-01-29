// =====================================================
// EMPLOYEE PERMISSIONS DIALOG
// Allows managers to set spending limits per employee
// =====================================================

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings2, Shield, CreditCard, AlertTriangle, Check, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { GL_CODES, type TeamMember, type AppRole } from '@/contexts/AppContext';
import { DEFAULT_CATEGORY_LIMITS, DEFAULT_APPROVAL_THRESHOLDS, type SpendingLimit, type ApprovalThreshold } from '@/types/permissions';
import { addAuditLog } from '@/data/auditLogs';

interface EmployeePermissionsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  member: TeamMember;
  onSave: (memberId: string, permissions: EmployeePermissionsData) => void;
  currentUserName?: string;
}

interface EmployeePermissionsData {
  dailyLimit: number;
  monthlyLimit: number;
  categoryLimits: SpendingLimit[];
  requiresPreApproval: boolean;
  canSubmitWithoutReceipt: boolean;
}

export function EmployeePermissionsDialog({ isOpen, onClose, member, onSave, currentUserName = 'مدير النظام' }: EmployeePermissionsDialogProps) {
  const [dailyLimit, setDailyLimit] = useState(5000);
  const [monthlyLimit, setMonthlyLimit] = useState(50000);
  const [requiresPreApproval, setRequiresPreApproval] = useState(false);
  const [canSubmitWithoutReceipt, setCanSubmitWithoutReceipt] = useState(false);
  const [categoryLimits, setCategoryLimits] = useState<SpendingLimit[]>(DEFAULT_CATEGORY_LIMITS);
  const [saving, setSaving] = useState(false);

  const handleCategoryLimitChange = (category: string, maxAmount: number) => {
    setCategoryLimits(prev => 
      prev.map(cl => cl.category === category ? { ...cl, maxAmount } : cl)
    );
  };

  const handleCategoryReceiptToggle = (category: string, requiresReceipt: boolean) => {
    setCategoryLimits(prev => 
      prev.map(cl => cl.category === category ? { ...cl, requiresReceipt } : cl)
    );
  };

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      const permissions = {
        dailyLimit,
        monthlyLimit,
        categoryLimits,
        requiresPreApproval,
        canSubmitWithoutReceipt,
      };
      
      onSave(member.id, permissions);
      
      // Add audit log for permission change
      addAuditLog({
        company_id: 'company-saudi-co',
        user_id: 'user-001',
        user_email: 'admin@company.com',
        user_name: currentUserName,
        user_role: 'admin',
        action: 'permission_change',
        entity_type: 'employee_permission',
        entity_id: member.id,
        entity_name: member.name,
        old_values: { dailyLimit: 'السابق', monthlyLimit: 'السابق' },
        new_values: { 
          dailyLimit, 
          monthlyLimit, 
          requiresPreApproval,
          canSubmitWithoutReceipt
        },
        changes_summary: `تم تعديل صلاحيات الموظف: ${member.name} - الحد اليومي: ${dailyLimit} ر.س، الحد الشهري: ${monthlyLimit} ر.س`,
        ip_address: '192.168.1.1',
        user_agent: navigator.userAgent,
      });
      
      setSaving(false);
      toast.success(`تم حفظ صلاحيات ${member.name}`);
      onClose();
    }, 500);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl bg-[#1e293b]/95 backdrop-blur-2xl border-white/[0.08] rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center">
              <Settings2 className="w-6 h-6 text-violet-400" />
            </div>
            <div>
              <DialogTitle className="text-white text-xl">صلاحيات الموظف</DialogTitle>
              <DialogDescription className="text-slate-400">
                تحديد حدود الصرف والموافقات لـ {member.name}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="limits" className="mt-4">
          <TabsList className="bg-white/[0.05] border border-white/[0.08] rounded-xl p-1">
            <TabsTrigger value="limits" className="rounded-lg data-[state=active]:bg-violet-600">
              <CreditCard className="w-4 h-4 ml-2" />
              حدود الصرف
            </TabsTrigger>
            <TabsTrigger value="categories" className="rounded-lg data-[state=active]:bg-violet-600">
              <DollarSign className="w-4 h-4 ml-2" />
              الفئات
            </TabsTrigger>
            <TabsTrigger value="rules" className="rounded-lg data-[state=active]:bg-violet-600">
              <Shield className="w-4 h-4 ml-2" />
              القواعد
            </TabsTrigger>
          </TabsList>

          <TabsContent value="limits" className="space-y-4 mt-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-2 gap-4"
            >
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                <Label className="text-slate-300 text-sm">الحد اليومي</Label>
                <div className="mt-2 flex items-center gap-2">
                  <Input
                    type="number"
                    value={dailyLimit}
                    onChange={(e) => setDailyLimit(Number(e.target.value))}
                    className="bg-white/[0.05] border-white/[0.08] text-white rounded-lg"
                  />
                  <span className="text-slate-500 text-sm">ر.س</span>
                </div>
                <p className="text-xs text-slate-500 mt-2">الحد الأقصى للصرف في اليوم الواحد</p>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                <Label className="text-slate-300 text-sm">الحد الشهري</Label>
                <div className="mt-2 flex items-center gap-2">
                  <Input
                    type="number"
                    value={monthlyLimit}
                    onChange={(e) => setMonthlyLimit(Number(e.target.value))}
                    className="bg-white/[0.05] border-white/[0.08] text-white rounded-lg"
                  />
                  <span className="text-slate-500 text-sm">ر.س</span>
                </div>
                <p className="text-xs text-slate-500 mt-2">الحد الأقصى للصرف في الشهر</p>
              </div>
            </motion.div>

            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-amber-200 font-medium text-sm">تنبيه حدود الموافقة</p>
                  <div className="mt-2 space-y-1">
                    {DEFAULT_APPROVAL_THRESHOLDS.map((threshold) => (
                      <p key={threshold.id} className="text-xs text-amber-300/80">
                        • {threshold.maxAmount ? `${formatCurrency(threshold.minAmount)} - ${formatCurrency(threshold.maxAmount)}` : `أكثر من ${formatCurrency(threshold.minAmount)}`}: يتطلب موافقة {threshold.requiredRoleAr}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="categories" className="space-y-3 mt-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2"
            >
              {categoryLimits.map((cl, index) => (
                <motion.div
                  key={cl.category}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-between gap-4"
                >
                  <div className="flex-1">
                    <p className="text-white font-medium text-sm">{cl.categoryAr}</p>
                    <p className="text-xs text-slate-500">كود: {cl.category}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={cl.maxAmount}
                        onChange={(e) => handleCategoryLimitChange(cl.category, Number(e.target.value))}
                        className="w-28 h-8 text-sm bg-white/[0.05] border-white/[0.08] text-white rounded-lg"
                      />
                      <span className="text-slate-500 text-xs">ر.س</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={cl.requiresReceipt}
                        onCheckedChange={(checked) => handleCategoryReceiptToggle(cl.category, checked)}
                      />
                      <span className="text-xs text-slate-400">إيصال</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </TabsContent>

          <TabsContent value="rules" className="space-y-4 mt-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">يتطلب موافقة مسبقة</p>
                  <p className="text-xs text-slate-500 mt-1">يجب الحصول على موافقة قبل الصرف</p>
                </div>
                <Switch
                  checked={requiresPreApproval}
                  onCheckedChange={setRequiresPreApproval}
                />
              </div>

              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">الإرسال بدون إيصال</p>
                  <p className="text-xs text-slate-500 mt-1">السماح بإرسال طلبات بدون مرفقات</p>
                </div>
                <Switch
                  checked={canSubmitWithoutReceipt}
                  onCheckedChange={setCanSubmitWithoutReceipt}
                />
              </div>

              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-emerald-400" />
                  <p className="text-emerald-200 font-medium text-sm">
                    الصلاحية الحالية: {member.role === 'admin' ? 'مدير النظام' : member.role === 'manager' ? 'مدير' : member.role === 'accountant' ? 'محاسب' : 'موظف'}
                  </p>
                </div>
              </div>
            </motion.div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-2 mt-6">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-white/[0.08] text-slate-300 hover:bg-white/[0.05] rounded-xl"
          >
            إلغاء
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl"
          >
            {saving ? 'جاري الحفظ...' : 'حفظ الصلاحيات'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
