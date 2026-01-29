import { useState } from 'react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { MasterDataManager } from '@/components/settings/MasterDataManager';
import { getRoleName } from '@/data/roles';
import { toast } from 'sonner';
import { 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Building2, 
  CreditCard, 
  Globe,
  Lock,
  Mail,
  Phone,
  Save,
  CheckCircle,
  Tag
} from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export default function Settings() {
  const { profile } = useAuth();
  const { role } = useCompany();
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    expenses: true,
    transfers: true,
    approvals: true,
    reports: false,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSaving(false);
    toast.success('تم حفظ الإعدادات بنجاح');
  };

  return (
    <DashboardLayout>
      <motion.div 
        className="space-y-6 max-w-4xl"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div variants={itemVariants}>
          <h1 className="text-3xl font-bold text-white">الإعدادات</h1>
          <p className="text-slate-400 mt-1">إدارة حسابك وتفضيلاتك الشخصية</p>
        </motion.div>

        <Tabs defaultValue="profile" className="space-y-6">
          <motion.div variants={itemVariants}>
            <TabsList className="bg-white/5 backdrop-blur-xl border border-white/10 p-1 rounded-xl">
              <TabsTrigger 
                value="profile" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-purple-500 data-[state=active]:text-white rounded-lg px-6"
              >
                <User className="w-4 h-4 ml-2" />
                الملف الشخصي
              </TabsTrigger>
              <TabsTrigger 
                value="notifications"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-purple-500 data-[state=active]:text-white rounded-lg px-6"
              >
                <Bell className="w-4 h-4 ml-2" />
                الإشعارات
              </TabsTrigger>
              <TabsTrigger 
                value="security"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-purple-500 data-[state=active]:text-white rounded-lg px-6"
              >
                <Shield className="w-4 h-4 ml-2" />
                الأمان
              </TabsTrigger>
              <TabsTrigger 
                value="company"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-purple-500 data-[state=active]:text-white rounded-lg px-6"
              >
                <Building2 className="w-4 h-4 ml-2" />
                الشركة
              </TabsTrigger>
              <TabsTrigger 
                value="categories"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-purple-500 data-[state=active]:text-white rounded-lg px-6"
              >
                <Tag className="w-4 h-4 ml-2" />
                أنواع المصاريف
              </TabsTrigger>
            </TabsList>
          </motion.div>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-white">
                    <div className="neon-icon-primary">
                      <User className="w-6 h-6 text-primary" />
                    </div>
                    معلومات الحساب
                  </CardTitle>
                  <CardDescription className="text-slate-400">تحديث معلوماتك الشخصية</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Avatar Section */}
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-primary/30">
                      {profile?.full_name?.charAt(0) || 'م'}
                    </div>
                    <div>
                      <Button variant="outline" className="border-white/10 hover:bg-white/5">
                        تغيير الصورة
                      </Button>
                      <p className="text-xs text-slate-500 mt-2">JPG أو PNG. الحد الأقصى 2MB</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-slate-300">الاسم الكامل</Label>
                      <div className="relative">
                        <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <Input
                          id="name"
                          defaultValue={profile?.full_name}
                          placeholder="أحمد محمد"
                          className="pr-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-primary"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-slate-300">البريد الإلكتروني</Label>
                      <div className="relative">
                        <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <Input
                          id="email"
                          value="admin@smartaccountant.sa"
                          disabled
                          className="pr-10 bg-white/5 border-white/10 text-slate-400"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-slate-300">رقم الجوال</Label>
                      <div className="relative">
                        <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <Input
                          id="phone"
                          defaultValue="+966 50 123 4567"
                          placeholder="+966 5X XXX XXXX"
                          className="pr-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-primary"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role" className="text-slate-300">الدور</Label>
                      <div className="relative">
                        <Shield className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <Input
                          id="role"
                          value={role ? getRoleName(role) : 'موظف'}
                          disabled
                          className="pr-10 bg-white/5 border-white/10 text-slate-400"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-white/10">
                    <Button 
                      onClick={handleSave} 
                      disabled={saving}
                      className="gradient-primary text-white px-8"
                    >
                      {saving ? (
                        <>جاري الحفظ...</>
                      ) : (
                        <>
                          <Save className="w-4 h-4 ml-2" />
                          حفظ التغييرات
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-white">
                    <div className="neon-icon-warning">
                      <Bell className="w-6 h-6 text-warning" />
                    </div>
                    تفضيلات الإشعارات
                  </CardTitle>
                  <CardDescription className="text-slate-400">تحكم في الإشعارات التي تصلك</CardDescription>
                </CardHeader>
                <CardContent className="space-y-1">
                  {[
                    { key: 'email', label: 'إشعارات البريد الإلكتروني', desc: 'استلام جميع الإشعارات عبر البريد', icon: Mail },
                    { key: 'expenses', label: 'إشعارات المصروفات', desc: 'تنبيهات عند إضافة أو تحديث مصروف', icon: CreditCard },
                    { key: 'approvals', label: 'إشعارات الموافقات', desc: 'تنبيهات عند قبول أو رفض طلب', icon: CheckCircle },
                    { key: 'transfers', label: 'إشعارات التحويلات', desc: 'تنبيهات عند استلام تحويل مالي', icon: Globe },
                    { key: 'reports', label: 'التقارير الأسبوعية', desc: 'ملخص أسبوعي للنشاط المالي', icon: Palette },
                  ].map((item, index) => (
                    <div 
                      key={item.key}
                      className="flex items-center justify-between p-4 rounded-xl hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                          <item.icon className="w-5 h-5 text-slate-400" />
                        </div>
                        <div>
                          <Label className="text-white font-medium">{item.label}</Label>
                          <p className="text-sm text-slate-500">{item.desc}</p>
                        </div>
                      </div>
                      <Switch
                        checked={notifications[item.key as keyof typeof notifications]}
                        onCheckedChange={(checked) => setNotifications({ ...notifications, [item.key]: checked })}
                        className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-primary data-[state=checked]:to-purple-500"
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-white">
                    <div className="neon-icon-success">
                      <Lock className="w-6 h-6 text-success" />
                    </div>
                    تغيير كلمة المرور
                  </CardTitle>
                  <CardDescription className="text-slate-400">حافظ على أمان حسابك بتحديث كلمة المرور بانتظام</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="current-password" className="text-slate-300">كلمة المرور الحالية</Label>
                    <div className="relative">
                      <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <Input 
                        id="current-password" 
                        type="password" 
                        placeholder="••••••••" 
                        className="pr-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-primary"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="new-password" className="text-slate-300">كلمة المرور الجديدة</Label>
                      <Input 
                        id="new-password" 
                        type="password" 
                        placeholder="••••••••" 
                        className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password" className="text-slate-300">تأكيد كلمة المرور</Label>
                      <Input 
                        id="confirm-password" 
                        type="password" 
                        placeholder="••••••••" 
                        className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-primary"
                      />
                    </div>
                  </div>
                  
                  {/* Password Requirements */}
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-sm text-slate-400 mb-3">متطلبات كلمة المرور:</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {[
                        '8 أحرف على الأقل',
                        'حرف كبير واحد',
                        'حرف صغير واحد',
                        'رقم واحد على الأقل'
                      ].map((req, i) => (
                        <div key={i} className="flex items-center gap-2 text-slate-500">
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                          {req}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-white/10">
                    <Button variant="outline" className="border-white/10 hover:bg-white/5 text-white">
                      <Lock className="w-4 h-4 ml-2" />
                      تغيير كلمة المرور
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Two Factor Auth */}
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-white">
                    <div className="neon-icon-info">
                      <Shield className="w-6 h-6 text-info" />
                    </div>
                    المصادقة الثنائية
                  </CardTitle>
                  <CardDescription className="text-slate-400">أضف طبقة حماية إضافية لحسابك</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                    <div>
                      <p className="text-white font-medium">تفعيل المصادقة الثنائية</p>
                      <p className="text-sm text-slate-500">استخدم تطبيق المصادقة للحصول على رموز الدخول</p>
                    </div>
                    <Button variant="outline" className="border-primary text-primary hover:bg-primary/10">
                      تفعيل
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Company Tab */}
          <TabsContent value="company" className="space-y-6">
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-white">
                    <div className="neon-icon-primary">
                      <Building2 className="w-6 h-6 text-primary" />
                    </div>
                    معلومات الشركة
                  </CardTitle>
                  <CardDescription className="text-slate-400">بيانات الشركة والإعدادات الضريبية</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-slate-300">اسم الشركة</Label>
                      <Input
                        defaultValue="شركة المحاسب الذكي"
                        className="bg-white/5 border-white/10 text-white focus:border-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300">الرقم الضريبي</Label>
                      <Input
                        defaultValue="300123456789012"
                        className="bg-white/5 border-white/10 text-white focus:border-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300">السجل التجاري</Label>
                      <Input
                        defaultValue="1010123456"
                        className="bg-white/5 border-white/10 text-white focus:border-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300">نسبة ضريبة القيمة المضافة</Label>
                      <Input
                        defaultValue="15%"
                        disabled
                        className="bg-white/5 border-white/10 text-slate-400"
                      />
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-success/10 border border-success/20">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-success" />
                      <div>
                        <p className="text-success font-medium">الشركة موثقة</p>
                        <p className="text-sm text-slate-400">تم التحقق من بيانات الشركة بنجاح</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-white/10">
                    <Button 
                      onClick={handleSave} 
                      disabled={saving}
                      className="gradient-primary text-white px-8"
                    >
                      {saving ? 'جاري الحفظ...' : (
                        <>
                          <Save className="w-4 h-4 ml-2" />
                          حفظ التغييرات
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Expense Categories Tab */}
          <TabsContent value="categories" className="space-y-6">
            <motion.div variants={itemVariants}>
              <MasterDataManager />
            </motion.div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </DashboardLayout>
  );
}
