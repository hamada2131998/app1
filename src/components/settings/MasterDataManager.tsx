import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useCompany } from '@/contexts/CompanyContext';
import type { CategoryKind, CategoryRow, CashAccountRow } from '@/types/db';
import { createCategory, deleteCategory, listCategories } from '@/services/categories';
import { createCashAccount, listCashAccounts, toggleCashAccountActive } from '@/services/cashAccounts';

export function MasterDataManager() {
  const { company_id, branch_id, role } = useCompany();
  const isAdmin = role === 'company_owner' || role === 'finance_manager' || role === 'accountant';

  const [loading, setLoading] = useState(true);
  const [catsIn, setCatsIn] = useState<CategoryRow[]>([]);
  const [catsOut, setCatsOut] = useState<CategoryRow[]>([]);
  const [accounts, setAccounts] = useState<CashAccountRow[]>([]);

  const [newCat, setNewCat] = useState({ name: '', kind: 'OUT' as CategoryKind });
  const [newAccountName, setNewAccountName] = useState('');

  const cats = useMemo(() => ({ IN: catsIn, OUT: catsOut }), [catsIn, catsOut]);

  async function refresh() {
    if (!company_id) return;
    setLoading(true);
    try {
      const [inCats, outCats, accs] = await Promise.all([
        listCategories(company_id, 'IN'),
        listCategories(company_id, 'OUT'),
        listCashAccounts({ company_id, branch_id }),
      ]);
      setCatsIn(inCats);
      setCatsOut(outCats);
      setAccounts(accs);
    } catch (e: any) {
      console.error(e);
      toast.error('فشل تحميل بيانات الإعدادات', { description: e?.message || String(e) });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company_id, branch_id]);

  async function addCategory() {
    if (!company_id) return;
    if (!isAdmin) return toast.error('ليس لديك صلاحية');
    if (!newCat.name.trim()) return toast.error('اكتب اسم التصنيف');
    try {
      await createCategory({ company_id, name: newCat.name.trim(), kind: newCat.kind });
      toast.success('تم إضافة التصنيف');
      setNewCat(prev => ({ ...prev, name: '' }));
      await refresh();
    } catch (e: any) {
      console.error(e);
      toast.error('فشل إضافة التصنيف', { description: e?.message || String(e) });
    }
  }

  async function removeCategory(id: string) {
    if (!company_id) return;
    if (!isAdmin) return toast.error('ليس لديك صلاحية');
    try {
      await deleteCategory({ company_id, id });
      toast.success('تم حذف التصنيف');
      await refresh();
    } catch (e: any) {
      console.error(e);
      toast.error('فشل حذف التصنيف', { description: e?.message || String(e) });
    }
  }

  async function addAccount() {
    if (!company_id) return;
    if (!isAdmin) return toast.error('ليس لديك صلاحية');
    if (!newAccountName.trim()) return toast.error('اكتب اسم الحساب');
    try {
      await createCashAccount({ company_id, branch_id, name: newAccountName.trim() });
      toast.success('تم إضافة الحساب');
      setNewAccountName('');
      await refresh();
    } catch (e: any) {
      console.error(e);
      toast.error('فشل إضافة الحساب', { description: e?.message || String(e) });
    }
  }

  async function toggleAccount(a: CashAccountRow) {
    if (!company_id) return;
    if (!isAdmin) return toast.error('ليس لديك صلاحية');
    try {
      await toggleCashAccountActive({ company_id, id: a.id, is_active: !a.is_active });
      await refresh();
    } catch (e: any) {
      console.error(e);
      toast.error('فشل تحديث الحساب', { description: e?.message || String(e) });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-white">بيانات أساسية</CardTitle>
        <CardDescription className="text-slate-400">
          إنشاء وإدارة التصنيفات والحسابات (تُحفظ في Supabase)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="categories" className="space-y-6">
          <TabsList className="bg-white/5 backdrop-blur-xl border border-white/10 p-1 rounded-xl">
            <TabsTrigger value="categories" className="rounded-lg px-6">التصنيفات</TabsTrigger>
            <TabsTrigger value="accounts" className="rounded-lg px-6">الحسابات</TabsTrigger>
          </TabsList>

          <TabsContent value="categories" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <div className="md:col-span-2 space-y-2">
                <Label className="text-slate-300">النوع</Label>
                <Select value={newCat.kind} onValueChange={(v) => setNewCat(prev => ({ ...prev, kind: v as CategoryKind }))}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="IN" className="text-white">IN (إيراد)</SelectItem>
                    <SelectItem value="OUT" className="text-white">OUT (مصروف)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-3 space-y-2">
                <Label className="text-slate-300">اسم التصنيف</Label>
                <Input value={newCat.name} onChange={(e) => setNewCat(prev => ({ ...prev, name: e.target.value }))} className="bg-white/5 border-white/10 text-white rounded-xl" placeholder="مثال: إيجار / صيانة ..." />
              </div>
              <div className="md:col-span-1 flex items-end">
                <Button onClick={addCategory} disabled={!isAdmin} className="w-full gradient-primary">إضافة</Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(['OUT', 'IN'] as CategoryKind[]).map((k) => (
                <div key={k} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-white font-semibold">{k === 'OUT' ? 'مصروفات (OUT)' : 'إيرادات (IN)'}</div>
                    {loading && <span className="text-slate-400 text-xs">تحميل...</span>}
                  </div>
                  <div className="space-y-2">
                    {cats[k].length === 0 ? (
                      <div className="text-slate-500 text-sm">لا توجد عناصر</div>
                    ) : (
                      cats[k].map((c) => (
                        <div key={c.id} className="flex items-center justify-between gap-3 p-2 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                          <div className="text-slate-200">{c.name}</div>
                          <Button variant="ghost" size="sm" disabled={!isAdmin} onClick={() => removeCategory(c.id)} className="text-rose-400 hover:text-rose-300">حذف</Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="accounts" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <div className="md:col-span-5 space-y-2">
                <Label className="text-slate-300">اسم الحساب</Label>
                <Input value={newAccountName} onChange={(e) => setNewAccountName(e.target.value)} className="bg-white/5 border-white/10 text-white rounded-xl" placeholder="مثال: صندوق الفرع" />
              </div>
              <div className="md:col-span-1 flex items-end">
                <Button onClick={addAccount} disabled={!isAdmin} className="w-full gradient-primary">إضافة</Button>
              </div>
            </div>

            <div className="space-y-2">
              {accounts.length === 0 ? (
                <div className="text-slate-500 text-sm">لا توجد حسابات</div>
              ) : (
                accounts.map((a) => (
                  <div key={a.id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <div>
                      <div className="text-white font-semibold">{a.name}</div>
                      <div className="text-slate-500 text-xs">{a.id}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={a.is_active ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25' : 'bg-slate-500/15 text-slate-300 border border-slate-500/25'}>
                        {a.is_active ? 'نشط' : 'غير نشط'}
                      </Badge>
                      <Button variant="outline" disabled={!isAdmin} onClick={() => toggleAccount(a)} className="border-white/10 hover:bg-white/5">
                        {a.is_active ? 'تعطيل' : 'تفعيل'}
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
