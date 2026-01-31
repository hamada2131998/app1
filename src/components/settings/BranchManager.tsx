import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useCompany } from '@/contexts/CompanyContext';
import type { Branch } from '@/types';
import { createBranch, listBranches, toggleBranchStatus, updateBranchName } from '@/services/settings.service';

export function BranchManager() {
  const { company_id, role } = useCompany();
  const isOwner = role === 'company_owner';
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  async function refresh() {
    if (!company_id) return;
    setLoading(true);
    try {
      const data = await listBranches(company_id);
      setBranches(data);
    } catch (e: any) {
      console.error(e);
      toast.error('فشل تحميل الفروع', { description: e?.message || String(e) });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, [company_id]);

  async function addBranch() {
    if (!company_id) return;
    if (!isOwner) return toast.error('هذا الإجراء متاح للمالك فقط');
    if (!newBranchName.trim()) return toast.error('اكتب اسم الفرع');
    try {
      await createBranch({ company_id, name: newBranchName.trim() });
      toast.success('تم إضافة الفرع');
      setNewBranchName('');
      await refresh();
    } catch (e: any) {
      console.error(e);
      toast.error('فشل إضافة الفرع', { description: e?.message || String(e) });
    }
  }

  async function saveBranch(branch: Branch) {
    if (!company_id) return;
    if (!isOwner) return toast.error('هذا الإجراء متاح للمالك فقط');
    if (!editingName.trim()) return toast.error('اكتب اسم الفرع');
    try {
      await updateBranchName({ company_id, id: branch.id, name: editingName.trim() });
      toast.success('تم تحديث الفرع');
      setEditingId(null);
      setEditingName('');
      await refresh();
    } catch (e: any) {
      console.error(e);
      toast.error('فشل تحديث الفرع', { description: e?.message || String(e) });
    }
  }

  async function toggleBranch(branch: Branch) {
    if (!company_id) return;
    if (!isOwner) return toast.error('هذا الإجراء متاح للمالك فقط');
    try {
      await toggleBranchStatus({ company_id, id: branch.id, active: !branch.is_active });
      await refresh();
    } catch (e: any) {
      console.error(e);
      toast.error('فشل تحديث حالة الفرع', { description: e?.message || String(e) });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-white">إدارة الفروع</CardTitle>
        <CardDescription className="text-slate-400">
          إنشاء الفروع وتفعيلها/تعطيلها (متاح للمالك فقط)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="md:col-span-5 space-y-2">
            <Label className="text-slate-300">اسم الفرع</Label>
            <Input
              value={newBranchName}
              onChange={(e) => setNewBranchName(e.target.value)}
              className="bg-white/5 border-white/10 text-white rounded-xl"
              placeholder="مثال: فرع الرياض"
            />
          </div>
          <div className="md:col-span-1 flex items-end">
            <Button onClick={addBranch} disabled={!isOwner} className="w-full gradient-primary">
              إضافة
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          {loading ? (
            <div className="text-slate-400 text-sm">تحميل...</div>
          ) : branches.length === 0 ? (
            <div className="text-slate-500 text-sm">لا توجد فروع</div>
          ) : (
            branches.map((branch) => (
              <div key={branch.id} className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <div className="flex-1 space-y-2">
                  {editingId === branch.id ? (
                    <Input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="bg-white/5 border-white/10 text-white rounded-xl"
                    />
                  ) : (
                    <div className="text-white font-semibold">{branch.name}</div>
                  )}
                  <div className="text-slate-500 text-xs">{branch.id}</div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Badge className={branch.is_active ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25' : 'bg-slate-500/15 text-slate-300 border border-slate-500/25'}>
                    {branch.is_active ? 'نشط' : 'غير نشط'}
                  </Badge>
                  {editingId === branch.id ? (
                    <>
                      <Button variant="outline" disabled={!isOwner} onClick={() => saveBranch(branch)} className="border-white/10 hover:bg-white/5">
                        حفظ
                      </Button>
                      <Button variant="ghost" onClick={() => { setEditingId(null); setEditingName(''); }} className="text-slate-400 hover:text-slate-200">
                        إلغاء
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="outline" disabled={!isOwner} onClick={() => { setEditingId(branch.id); setEditingName(branch.name); }} className="border-white/10 hover:bg-white/5">
                        تعديل
                      </Button>
                      <Button variant="outline" disabled={!isOwner} onClick={() => toggleBranch(branch)} className="border-white/10 hover:bg-white/5">
                        {branch.is_active ? 'تعطيل' : 'تفعيل'}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
