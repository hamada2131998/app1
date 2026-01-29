import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Building2, Percent } from 'lucide-react';
import { EmployeeExpenseReport } from '@/components/reports/EmployeeExpenseReport';
import { ProjectExpenseReport } from '@/components/reports/ProjectExpenseReport';
import { VatReport } from '@/components/reports/VatReport';

export default function Reports() {
  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-white">التقارير</h1>
          <p className="text-slate-400">عرض وتصدير التقارير المالية والإدارية</p>
        </div>

        <Tabs defaultValue="employees" className="space-y-6">
          <TabsList className="bg-white/[0.05] border border-white/[0.08] rounded-xl p-1">
            <TabsTrigger value="employees" className="rounded-lg data-[state=active]:bg-violet-600">
              <Users className="w-4 h-4 ml-2" />
              تقارير الموظفين
            </TabsTrigger>
            <TabsTrigger value="projects" className="rounded-lg data-[state=active]:bg-violet-600">
              <Building2 className="w-4 h-4 ml-2" />
              تقارير المشاريع
            </TabsTrigger>
            <TabsTrigger value="vat" className="rounded-lg data-[state=active]:bg-violet-600">
              <Percent className="w-4 h-4 ml-2" />
              تقارير الضريبة
            </TabsTrigger>
          </TabsList>

          <TabsContent value="employees">
            <EmployeeExpenseReport />
          </TabsContent>

          <TabsContent value="projects">
            <ProjectExpenseReport />
          </TabsContent>

          <TabsContent value="vat">
            <VatReport />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
