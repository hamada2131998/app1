// =====================================================
// EXPENSE CATEGORY MANAGER
// Allows accountants/admins to manage GL codes
// =====================================================

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { useApp, type GLCode } from '@/contexts/AppContext';
import { Plus, Trash2, Tag, Lock, Unlock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export function ExpenseCategoryManager() {
  const { glCodes, addGLCode, removeGLCode, currentRole } = useApp();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    nameEn: '',
  });

  const canManage = currentRole === 'admin' || currentRole === 'accountant' || currentRole === 'manager';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.code.trim()) {
      toast.error('يرجى إدخال كود الحساب');
      return;
    }
    if (!formData.name.trim()) {
      toast.error('يرجى إدخال اسم النوع');
      return;
    }

    // Check if code already exists
    if (glCodes.find(g => g.code === formData.code)) {
      toast.error('كود الحساب موجود مسبقاً');
      return;
    }

    addGLCode({
      code: formData.code,
      name: formData.name,
      nameEn: formData.nameEn || formData.name,
    });

    setFormData({ code: '', name: '', nameEn: '' });
    setIsDialogOpen(false);
  };

  const handleDelete = (code: string, isCustom?: boolean) => {
    if (!isCustom) {
      toast.error('لا يمكن حذف أنواع المصاريف الأساسية');
      return;
    }
    removeGLCode(code);
  };

  // Generate next code suggestion
  const suggestNextCode = () => {
    const codes = glCodes.map(g => parseInt(g.code)).filter(c => !isNaN(c));
    const maxCode = Math.max(...codes, 6000);
    return String(maxCode + 1);
  };

  return (
    <Card className="bg-card/50 backdrop-blur-xl border-border/50 rounded-2xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Tag className="w-5 h-5 text-primary" />
              أنواع المصاريف (GL Codes)
            </CardTitle>
            <CardDescription>
              إدارة أنواع وتصنيفات المصاريف المستخدمة في النظام
            </CardDescription>
          </div>
          {canManage && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="bg-primary hover:bg-primary/90 rounded-xl"
                  onClick={() => setFormData({ ...formData, code: suggestNextCode() })}
                >
                  <Plus className="w-4 h-4 ml-2" />
                  إضافة نوع
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md bg-card border-border rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="text-foreground">إضافة نوع مصروف جديد</DialogTitle>
                  <DialogDescription className="text-muted-foreground">
                    أدخل بيانات نوع المصروف الجديد
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">كود الحساب (GL Code) *</Label>
                    <Input
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      placeholder="مثال: 6009"
                      className="bg-background border-border text-foreground rounded-xl"
                    />
                    <p className="text-xs text-muted-foreground">يفضل استخدام أرقام متسلسلة</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-muted-foreground">الاسم بالعربية *</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="مثال: مصروفات وقود"
                      className="bg-background border-border text-foreground rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-muted-foreground">الاسم بالإنجليزية (اختياري)</Label>
                    <Input
                      value={formData.nameEn}
                      onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                      placeholder="e.g., Fuel Expenses"
                      className="bg-background border-border text-foreground rounded-xl"
                    />
                  </div>

                  <DialogFooter className="gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                      className="border-border text-muted-foreground hover:bg-muted rounded-xl"
                    >
                      إلغاء
                    </Button>
                    <Button type="submit" className="bg-primary hover:bg-primary/90 rounded-xl">
                      إضافة النوع
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <AnimatePresence>
            {glCodes.map((gl, index) => (
              <motion.div
                key={gl.code}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.03 }}
                className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="font-mono text-xs">
                    {gl.code}
                  </Badge>
                  <div>
                    <p className="text-foreground font-medium text-sm">{gl.name}</p>
                    {gl.nameEn && gl.nameEn !== gl.name && (
                      <p className="text-xs text-muted-foreground">{gl.nameEn}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {gl.isCustom ? (
                    <>
                      <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">
                        <Unlock className="w-3 h-3 ml-1" />
                        مخصص
                      </Badge>
                      {canManage && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelete(gl.code, gl.isCustom)}
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </>
                  ) : (
                    <Badge variant="secondary" className="text-xs">
                      <Lock className="w-3 h-3 ml-1" />
                      أساسي
                    </Badge>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {!canManage && (
          <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
            <p className="text-sm text-amber-600 dark:text-amber-400">
              صلاحية إضافة أنواع المصاريف متاحة للمحاسبين والمدراء فقط
            </p>
          </div>
        )}

        <div className="mt-4 p-3 rounded-xl bg-muted/30 border border-border/50">
          <p className="text-xs text-muted-foreground">
            <strong>ملاحظة:</strong> أنواع المصاريف الأساسية لا يمكن حذفها. يمكنك إضافة أنواع مخصصة حسب احتياجاتك.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
