// =====================================================
// CASH MOVEMENTS (MVP)
// Real Supabase CRUD (no mock data)
// Enforces company_id on every query via CompanyContext
// =====================================================

import { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Plus, CheckCircle, XCircle, Clock, Send, Trash2, Image, AlertTriangle } from 'lucide-react';
import { useCompany } from '@/contexts/CompanyContext';
import { useAuth } from '@/contexts/AuthContext';
import type { CashAccountRow, CategoryRow, CostCenterRow, MovementAttachmentRow, MovementStatus, MovementType } from '@/types/db';
import { listCashAccounts } from '@/services/cashAccounts';
import { listCategories } from '@/services/categories';
import { listCostCenters } from '@/services/costCenters';
import { getReceiptSignedUrl, uploadMovementReceipt } from '@/services/attachments';
import {
  approveMovement,
  createCashMovement,
  deleteMovement,
  listCashMovements,
  rejectMovement,
  submitMovement,
} from '@/services/cashMovements';
import { getApprovalContext } from '@/services/approvalsContext';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency: 'SAR',
    minimumFractionDigits: 0,
  }).format(Math.abs(amount));
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

const statusLabel: Record<MovementStatus, { label: string; icon: any; badge: string }> = {
  DRAFT: { label: 'مسودة', icon: Clock, badge: 'bg-slate-500/20 text-slate-300 border border-slate-500/30' },
  SUBMITTED: { label: 'مُرسلة', icon: Send, badge: 'bg-amber-500/20 text-amber-400 border border-amber-500/30' },
  APPROVED: { label: 'معتمدة', icon: CheckCircle, badge: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' },
  REJECTED: { label: 'مرفوضة', icon: XCircle, badge: 'bg-rose-500/20 text-rose-400 border border-rose-500/30' },
};

export default function ExpensesNew() {
  const { company_id, branch_id, role } = useCompany();
  const { user } = useAuth();

  const canApprove = role === 'company_owner' || role === 'finance_manager' || role === 'accountant';

  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<CashAccountRow[]>([]);
  const [categoriesIn, setCategoriesIn] = useState<CategoryRow[]>([]);
  const [categoriesOut, setCategoriesOut] = useState<CategoryRow[]>([]);
  const [costCenters, setCostCenters] = useState<CostCenterRow[]>([]);
  const [status, setStatus] = useState<MovementStatus>('DRAFT');
  const [rows, setRows] = useState<any[]>([]);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptKey, setReceiptKey] = useState(0);
  const [attachmentOpen, setAttachmentOpen] = useState(false);
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
  const [attachmentLoading, setAttachmentLoading] = useState(false);
  const [activeAttachment, setActiveAttachment] = useState<MovementAttachmentRow | null>(null);
  const [approvalOpen, setApprovalOpen] = useState(false);
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [approvalComment, setApprovalComment] = useState('');
  const [approvalTarget, setApprovalTarget] = useState<any | null>(null);
  const [approvalContext, setApprovalContext] = useState<Awaited<ReturnType<typeof getApprovalContext>> | null>(null);

  const [form, setForm] = useState({
    type: 'OUT' as MovementType,
    account_id: '',
    category_id: '',
    cost_center_id: '',
    amount: '',
    movement_date: new Date().toISOString().slice(0, 10),
    payment_method: 'CASH',
    reference: '',
    notes: '',
  });

  const categoryMap = useMemo(() => {
    const all = [...categoriesIn, ...categoriesOut];
    return new Map(all.map(c => [c.id, c.name]));
  }, [categoriesIn, categoriesOut]);

  const accountMap = useMemo(() => new Map(accounts.map(a => [a.id, a.name])), [accounts]);
  const costCenterMap = useMemo(() => new Map(costCenters.map(c => [c.id, c.name])), [costCenters]);

  const currentCategories = form.type === 'IN' ? categoriesIn : categoriesOut;
  const activeCostCenters = useMemo(() => costCenters.filter(c => c.is_active), [costCenters]);

  async function refresh(targetStatus: MovementStatus) {
    if (!company_id) return;
    setLoading(true);
    try {
      const [accs, catsIn, catsOut, centers, movs] = await Promise.all([
        listCashAccounts({ company_id, branch_id, activeOnly: true }),
        listCategories(company_id, 'IN'),
        listCategories(company_id, 'OUT'),
        listCostCenters(company_id),
        listCashMovements({
          company_id,
          branch_id,
          status: targetStatus,
          limit: 50,
          created_by: role === 'employee' ? user?.id : undefined,
        }),
      ]);

      setAccounts(accs);
      setCategoriesIn(catsIn);
      setCategoriesOut(catsOut);
      setCostCenters(centers);
      setRows(movs);

      // Set defaults once
      if (!form.account_id && accs[0]) {
        setForm(prev => ({ ...prev, account_id: accs[0].id }));
      }
      if (!form.category_id) {
        const defaultCat = (form.type === 'IN' ? catsIn[0] : catsOut[0])?.id;
        if (defaultCat) setForm(prev => ({ ...prev, category_id: defaultCat }));
      }
      if (!form.cost_center_id) {
        const defaultCenter = centers.find(c => c.is_active)?.id;
        if (defaultCenter) setForm(prev => ({ ...prev, cost_center_id: defaultCenter }));
      }
    } catch (e: any) {
      console.error(e);
      toast.error('فشل تحميل البيانات', { description: e?.message || String(e) });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh(status);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company_id, branch_id, status, role, user]);

  useEffect(() => {
    // Reset category when switching type
    const first = currentCategories[0]?.id;
    if (first && !currentCategories.some(c => c.id === form.category_id)) {
      setForm(prev => ({ ...prev, category_id: first }));
    }
    const center = activeCostCenters[0]?.id;
    if (center && !activeCostCenters.some(c => c.id === form.cost_center_id)) {
      setForm(prev => ({ ...prev, cost_center_id: center }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.type, categoriesIn, categoriesOut, activeCostCenters]);

  async function onCreate() {
    if (!company_id) return;
    const amount = Number(form.amount);
    if (!form.account_id || !form.category_id || !form.cost_center_id) {
      toast.error('اختر الحساب والتصنيف ومركز التكلفة');
      return;
    }
    if (!amount || amount <= 0) {
      toast.error('المبلغ يجب أن يكون أكبر من صفر');
      return;
    }
    try {
      const movement = await createCashMovement({
        company_id,
        branch_id,
        account_id: form.account_id,
        category_id: form.category_id,
        cost_center_id: form.cost_center_id,
        type: form.type,
        amount,
        movement_date: form.movement_date,
        payment_method: form.payment_method || 'CASH',
        reference: form.reference || null,
        notes: form.notes || null,
      });
      if (receiptFile) {
        await uploadMovementReceipt({ company_id, movement_id: movement.id, file: receiptFile });
      }
      toast.success('تم إنشاء الحركة (مسودة)');
      setForm(prev => ({ ...prev, amount: '', reference: '', notes: '' }));
      setReceiptFile(null);
      setReceiptKey(prev => prev + 1);
      await refresh(status);
    } catch (e: any) {
      console.error(e);
      toast.error('فشل إنشاء الحركة', { description: e?.message || String(e) });
    }
  }

  async function act(id: string, action: 'submit' | 'delete') {
    if (!company_id) return;
    try {
      if (action === 'submit') await submitMovement(company_id, id);
      if (action === 'delete') await deleteMovement(company_id, id);
      toast.success('تم التحديث');
      await refresh(status);
    } catch (e: any) {
      console.error(e);
      toast.error('فشل التحديث', { description: e?.message || String(e) });
    }
  }

  async function openAttachment(attachment: MovementAttachmentRow) {
    setAttachmentOpen(true);
    setAttachmentLoading(true);
    setActiveAttachment(attachment);
    try {
      const url = await getReceiptSignedUrl(attachment.storage_path);
      setAttachmentUrl(url);
    } catch (e: any) {
      console.error(e);
      toast.error('فشل تحميل المرفق', { description: e?.message || String(e) });
      setAttachmentUrl(null);
    } finally {
      setAttachmentLoading(false);
    }
  }

  async function openApproval(movement: any) {
    if (!company_id) return;
    setApprovalTarget(movement);
    setApprovalOpen(true);
    setApprovalLoading(true);
    try {
      const ctx = await getApprovalContext({ company_id, movement_id: movement.id });
      setApprovalContext(ctx);
    } catch (e: any) {
      console.error(e);
      toast.error('فشل تحميل سياق الاعتماد', { description: e?.message || String(e) });
    } finally {
      setApprovalLoading(false);
    }
  }

  async function handleApproval(action: 'APPROVED' | 'REJECTED') {
    if (!company_id || !approvalTarget) return;
    try {
      if (action === 'APPROVED') {
        await approveMovement(company_id, approvalTarget.id, approvalComment || null);
      } else {
        await rejectMovement(company_id, approvalTarget.id, approvalComment || null);
      }
      toast.success(action === 'APPROVED' ? 'تم اعتماد الحركة' : 'تم رفض الحركة');
      setApprovalOpen(false);
      setApprovalTarget(null);
      setApprovalContext(null);
      setApprovalComment('');
      await refresh(status);
    } catch (e: any) {
      console.error(e);
      toast.error('فشل تنفيذ الإجراء', { description: e?.message || String(e) });
    }
  }

  const header = (
    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-white">الحركات النقدية</h1>
        <p className="text-slate-400">إنشاء ومراجعة واعتماد حركات IN/OUT</p>
      </div>
      <div className="flex gap-2">
        <Badge className="bg-white/[0.05] text-slate-300 border border-white/[0.08]">Company: {company_id?.slice(0, 8) || '-'}</Badge>
        {branch_id && <Badge className="bg-white/[0.05] text-slate-300 border border-white/[0.08]">Branch: {branch_id.slice(0, 8)}</Badge>}
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {header}

        {/* Create */}
        <div className="rounded-2xl bg-[#1e293b]/40 backdrop-blur-2xl border border-white/[0.08] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white font-semibold">
              <Plus className="w-5 h-5" /> إنشاء حركة (مسودة)
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-8 gap-4">
            <div className="space-y-2 md:col-span-1">
              <Label className="text-slate-300">النوع</Label>
              <Select value={form.type} onValueChange={(v) => setForm(prev => ({ ...prev, type: v as MovementType }))}>
                <SelectTrigger className="bg-white/[0.05] border-white/[0.08] text-white rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="IN" className="text-white">IN (إيراد)</SelectItem>
                  <SelectItem value="OUT" className="text-white">OUT (مصروف)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label className="text-slate-300">الحساب</Label>
              <Select value={form.account_id} onValueChange={(v) => setForm(prev => ({ ...prev, account_id: v }))}>
                <SelectTrigger className="bg-white/[0.05] border-white/[0.08] text-white rounded-xl">
                  <SelectValue placeholder={accounts.length ? 'اختر الحساب' : 'لا توجد حسابات'} />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {accounts.map(a => (
                    <SelectItem key={a.id} value={a.id} className="text-white">{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label className="text-slate-300">التصنيف</Label>
              <Select value={form.category_id} onValueChange={(v) => setForm(prev => ({ ...prev, category_id: v }))}>
                <SelectTrigger className="bg-white/[0.05] border-white/[0.08] text-white rounded-xl">
                  <SelectValue placeholder={currentCategories.length ? 'اختر التصنيف' : 'لا توجد تصنيفات'} />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {currentCategories.map(c => (
                    <SelectItem key={c.id} value={c.id} className="text-white">{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label className="text-slate-300">مركز التكلفة</Label>
              <Select value={form.cost_center_id} onValueChange={(v) => setForm(prev => ({ ...prev, cost_center_id: v }))}>
                <SelectTrigger className="bg-white/[0.05] border-white/[0.08] text-white rounded-xl">
                  <SelectValue placeholder={activeCostCenters.length ? 'اختر مركز التكلفة' : 'لا توجد مراكز تكلفة'} />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {activeCostCenters.map(center => (
                    <SelectItem key={center.id} value={center.id} className="text-white">{center.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-1">
              <Label className="text-slate-300">المبلغ</Label>
              <Input
                type="number"
                min="0"
                value={form.amount}
                onChange={(e) => setForm(prev => ({ ...prev, amount: e.target.value }))}
                className="bg-white/[0.05] border-white/[0.08] text-white rounded-xl"
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label className="text-slate-300">التاريخ</Label>
              <Input
                type="date"
                value={form.movement_date}
                onChange={(e) => setForm(prev => ({ ...prev, movement_date: e.target.value }))}
                className="bg-white/[0.05] border-white/[0.08] text-white rounded-xl"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label className="text-slate-300">طريقة الدفع</Label>
              <Input
                value={form.payment_method}
                onChange={(e) => setForm(prev => ({ ...prev, payment_method: e.target.value }))}
                className="bg-white/[0.05] border-white/[0.08] text-white rounded-xl"
                placeholder="CASH"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label className="text-slate-300">المرجع (اختياري)</Label>
              <Input
                value={form.reference}
                onChange={(e) => setForm(prev => ({ ...prev, reference: e.target.value }))}
                className="bg-white/[0.05] border-white/[0.08] text-white rounded-xl"
                placeholder="..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">ملاحظات (اختياري)</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
              className="bg-white/[0.05] border-white/[0.08] text-white rounded-xl"
              placeholder="..."
            />
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">إرفاق إيصال (صورة فقط)</Label>
            <Input
              key={receiptKey}
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                if (file && !file.type.startsWith('image/')) {
                  toast.error('يرجى اختيار صورة فقط');
                  setReceiptFile(null);
                  setReceiptKey(prev => prev + 1);
                  return;
                }
                setReceiptFile(file);
              }}
              className="bg-white/[0.05] border-white/[0.08] text-white rounded-xl file:text-slate-200 file:bg-white/10 file:border-0 file:px-3 file:py-2"
            />
            {receiptFile && (
              <div className="text-xs text-slate-400">تم اختيار: {receiptFile.name}</div>
            )}
          </div>

          <Button onClick={onCreate} className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl shadow-lg shadow-violet-500/30">
            <Plus className="w-4 h-4 ml-2" /> إنشاء
          </Button>
        </div>

        {/* List */}
        <div className="rounded-2xl bg-[#1e293b]/40 backdrop-blur-2xl border border-white/[0.08] p-6">
          <Tabs value={status} onValueChange={(v) => setStatus(v as MovementStatus)}>
            <TabsList className="bg-white/[0.04] border border-white/[0.08] rounded-xl">
              <TabsTrigger value="DRAFT">مسودات</TabsTrigger>
              <TabsTrigger value="SUBMITTED">مُرسلة</TabsTrigger>
              <TabsTrigger value="APPROVED">معتمدة</TabsTrigger>
              <TabsTrigger value="REJECTED">مرفوضة</TabsTrigger>
            </TabsList>

            {(['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED'] as MovementStatus[]).map((s) => {
              const Icon = statusLabel[s].icon;
              return (
                <TabsContent key={s} value={s} className="mt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-white font-semibold">
                      <Icon className="w-5 h-5" /> {statusLabel[s].label}
                    </div>
                    {loading && <span className="text-slate-400 text-sm">تحميل...</span>}
                  </div>

                  {rows.length === 0 && !loading ? (
                    <div className="text-center py-10 text-slate-400">لا توجد بيانات</div>
                  ) : (
                    <div className="space-y-3">
                      {rows.map((m: any) => (
                        <div key={m.id} className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                          <div className="flex items-start gap-4">
                            <div className={`px-3 py-1 rounded-lg text-xs font-semibold ${statusLabel[m.status].badge}`}>{statusLabel[m.status].label}</div>
                            <div>
                              <div className="text-white font-semibold">
                                {m.type === 'IN' ? 'IN' : 'OUT'} • {formatCurrency(m.amount)}
                              </div>
                              <div className="text-slate-400 text-sm">
                                {formatDate(m.movement_date)} • {accountMap.get(m.account_id) || m.account_id.slice(0, 8)} • {categoryMap.get(m.category_id) || m.category_id.slice(0, 8)} • {costCenterMap.get(m.cost_center_id) || m.cost_center_id?.slice(0, 8)}
                              </div>
                              {(m.reference || m.notes) && (
                                <div className="text-slate-500 text-xs mt-1">
                                  {m.reference ? `Ref: ${m.reference}` : ''}{m.reference && m.notes ? ' • ' : ''}{m.notes ? m.notes : ''}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2 justify-end">
                            {m.status === 'DRAFT' && (
                              <>
                                <Button size="sm" onClick={() => act(m.id, 'submit')} className="bg-amber-600 hover:bg-amber-700 rounded-lg">
                                  <Send className="w-4 h-4 ml-2" /> إرسال
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => act(m.id, 'delete')} className="text-rose-400 hover:text-rose-300">
                                  <Trash2 className="w-4 h-4 ml-2" /> حذف
                                </Button>
                              </>
                            )}

                            {m.status === 'SUBMITTED' && canApprove && (
                              <Button size="sm" onClick={() => openApproval(m)} className="bg-emerald-600 hover:bg-emerald-700 rounded-lg">
                                <CheckCircle className="w-4 h-4 ml-2" /> مراجعة واعتماد
                              </Button>
                            )}

                            {m.status === 'SUBMITTED' && !canApprove && (
                              <Badge className="bg-amber-500/10 text-amber-300 border border-amber-500/20">بانتظار الاعتماد</Badge>
                            )}

                            {m.attachments?.length > 0 && (
                              <Button size="sm" variant="outline" onClick={() => openAttachment(m.attachments[0])} className="border-white/10 hover:bg-white/5">
                                <Image className="w-4 h-4 ml-2" /> إيصال
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              );
            })}
          </Tabs>
        </div>

        <Dialog
          open={attachmentOpen}
          onOpenChange={(open) => {
            setAttachmentOpen(open);
            if (!open) {
              setAttachmentUrl(null);
              setActiveAttachment(null);
            }
          }}
        >
          <DialogContent className="bg-slate-900 border border-white/[0.08] text-white">
            <DialogHeader>
              <DialogTitle className="text-white">عرض الإيصال</DialogTitle>
            </DialogHeader>
            {attachmentLoading ? (
              <div className="py-10 text-center text-slate-400">جاري تحميل الصورة...</div>
            ) : attachmentUrl ? (
              <div className="space-y-3">
                <img src={attachmentUrl} alt={activeAttachment?.file_name || 'receipt'} className="w-full rounded-xl border border-white/[0.08]" />
                <div className="text-xs text-slate-400">{activeAttachment?.file_name}</div>
              </div>
            ) : (
              <div className="py-10 text-center text-slate-400">تعذر تحميل الإيصال</div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog
          open={approvalOpen}
          onOpenChange={(open) => {
            setApprovalOpen(open);
            if (!open) {
              setApprovalContext(null);
              setApprovalTarget(null);
              setApprovalComment('');
            }
          }}
        >
          <DialogContent className="bg-slate-900 border border-white/[0.08] text-white max-w-3xl">
            <DialogHeader>
              <DialogTitle className="text-white">مراجعة طلب الاعتماد</DialogTitle>
            </DialogHeader>
            {approvalLoading ? (
              <div className="py-10 text-center text-slate-400">جاري تحميل بيانات الاعتماد...</div>
            ) : approvalContext ? (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <div className="text-slate-400 text-sm">الموظف</div>
                    <div className="text-lg font-semibold text-white">{approvalContext.employeeName || 'غير معروف'}</div>
                  </div>
                  <div className="bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-3">
                    <div className="text-xs text-slate-400">رصيد العهدة الحالي</div>
                    <div className="text-lg font-semibold text-white">{formatCurrency(approvalContext.currentBalance || 0)}</div>
                  </div>
                </div>

                {approvalContext.isDuplicate && (
                  <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
                    <AlertTriangle className="w-5 h-5 text-amber-400 mt-1" />
                    <div>
                      <div className="text-amber-300 font-semibold">تنبيه: احتمال تكرار</div>
                      <div className="text-xs text-amber-200/80">تم العثور على حركة مشابهة بنفس المبلغ والتصنيف في نفس التاريخ.</div>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="text-slate-300 font-semibold">آخر 5 معاملات للموظف</div>
                  {approvalContext.recentTransactions.length === 0 ? (
                    <div className="text-slate-500 text-sm">لا توجد معاملات بعد</div>
                  ) : (
                    <div className="space-y-2">
                      {approvalContext.recentTransactions.map((tx) => (
                        <div key={tx.id} className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2">
                          <div>
                            <div className="text-sm text-white">{tx.label}</div>
                            <div className="text-xs text-slate-500">{formatDate(tx.tx_date)}</div>
                          </div>
                          <div className="text-sm font-semibold text-white">{formatCurrency(tx.amount)}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300">تعليق (اختياري)</Label>
                  <Textarea
                    value={approvalComment}
                    onChange={(e) => setApprovalComment(e.target.value)}
                    className="bg-white/[0.05] border-white/[0.08] text-white rounded-xl"
                    placeholder="اكتب ملاحظات الاعتماد أو الرفض"
                  />
                </div>
              </div>
            ) : (
              <div className="py-10 text-center text-slate-400">لا توجد بيانات</div>
            )}
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setApprovalOpen(false)} className="border-white/10 hover:bg-white/5">
                إغلاق
              </Button>
              <Button onClick={() => handleApproval('REJECTED')} className="bg-rose-600 hover:bg-rose-700" disabled={approvalLoading || !approvalContext}>
                <XCircle className="w-4 h-4 ml-2" /> رفض
              </Button>
              <Button onClick={() => handleApproval('APPROVED')} className="bg-emerald-600 hover:bg-emerald-700" disabled={approvalLoading || !approvalContext}>
                <CheckCircle className="w-4 h-4 ml-2" /> اعتماد
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
