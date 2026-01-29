// =====================================================
// PROJECT EXPENSE REPORT COMPONENT
// Shows budget vs actual spending per project
// =====================================================

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useApp } from '@/contexts/AppContext';
import { Download, Building2, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';
import { exportToExcel, exportGenericToPDF } from '@/utils/exportUtils';

export function ProjectExpenseReport() {
  const { projects, expenses, formatCurrency } = useApp();

  const projectStats = useMemo(() => {
    return projects.map(project => {
      const projectExpenses = expenses.filter(e => e.project_id === project.id);
      const totalExpenses = projectExpenses.reduce((sum, e) => sum + e.total_amount, 0);
      const pendingExpenses = projectExpenses.filter(e => e.status === 'pending').reduce((sum, e) => sum + e.total_amount, 0);
      const approvedExpenses = projectExpenses.filter(e => e.status === 'approved' || e.status === 'settled').reduce((sum, e) => sum + e.total_amount, 0);
      
      const budgetUsed = (totalExpenses / project.budget) * 100;
      const remainingBudget = project.budget - totalExpenses;
      const isOverBudget = remainingBudget < 0;

      return {
        ...project,
        totalExpenses,
        pendingExpenses,
        approvedExpenses,
        expenseCount: projectExpenses.length,
        budgetUsed: Math.min(budgetUsed, 100),
        remainingBudget,
        isOverBudget,
      };
    });
  }, [projects, expenses]);

  const chartData = useMemo(() => {
    return projectStats.map(p => ({
      name: p.name.length > 15 ? p.name.slice(0, 15) + '...' : p.name,
      'الميزانية': p.budget,
      'المصروف': p.totalExpenses,
    }));
  }, [projectStats]);

  const handleExport = (type: 'pdf' | 'excel') => {
    const data = projectStats.map(p => ({
      'المشروع': p.name,
      'العميل': p.client,
      'الميزانية': p.budget,
      'المصروف': p.totalExpenses,
      'المتبقي': p.remainingBudget,
      'نسبة الاستخدام': `${p.budgetUsed.toFixed(1)}%`,
      'الحالة': p.isOverBudget ? 'تجاوز الميزانية' : p.budgetUsed > 80 ? 'قريب من الحد' : 'ضمن الميزانية',
    }));

    const filename = `project-expense-report-${format(new Date(), 'yyyy-MM-dd')}`;
    
    if (type === 'pdf') {
      exportGenericToPDF(data, filename, 'تقرير مصروفات المشاريع');
    } else {
      exportToExcel(data, filename);
    }
  };

  const totalBudget = projectStats.reduce((sum, p) => sum + p.budget, 0);
  const totalSpent = projectStats.reduce((sum, p) => sum + p.totalExpenses, 0);
  const overBudgetCount = projectStats.filter(p => p.isOverBudget).length;

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border border-blue-500/30 p-5"
        >
          <p className="text-slate-400 text-sm">إجمالي الميزانيات</p>
          <p className="text-2xl font-bold text-white mt-1">{formatCurrency(totalBudget)}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl bg-gradient-to-br from-emerald-600/20 to-green-600/20 border border-emerald-500/30 p-5"
        >
          <p className="text-slate-400 text-sm">إجمالي المصروف</p>
          <p className="text-2xl font-bold text-white mt-1">{formatCurrency(totalSpent)}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-5"
        >
          <p className="text-slate-400 text-sm">المتبقي</p>
          <p className="text-2xl font-bold text-white mt-1">{formatCurrency(totalBudget - totalSpent)}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-5"
        >
          <p className="text-slate-400 text-sm">مشاريع تجاوزت الميزانية</p>
          <p className={`text-2xl font-bold mt-1 ${overBudgetCount > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
            {overBudgetCount}
          </p>
        </motion.div>
      </div>

      {/* Export Buttons */}
      <div className="flex gap-2 justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleExport('pdf')}
          className="border-white/[0.08] text-slate-300 hover:bg-white/[0.05] rounded-xl"
        >
          <Download className="w-4 h-4 ml-2" />
          PDF
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleExport('excel')}
          className="border-white/[0.08] text-slate-300 hover:bg-white/[0.05] rounded-xl"
        >
          <Download className="w-4 h-4 ml-2" />
          Excel
        </Button>
      </div>

      {/* Chart */}
      <Card className="bg-[#1e293b]/40 backdrop-blur-xl border-white/[0.08] rounded-2xl">
        <CardHeader>
          <CardTitle className="text-white text-lg">الميزانية مقابل المصروف</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={(v) => `${v/1000}k`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(30, 41, 59, 0.95)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '1rem',
                  }}
                  formatter={(value: number) => [formatCurrency(value), '']}
                />
                <Legend />
                <Bar dataKey="الميزانية" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="المصروف" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Project Cards */}
      <div className="space-y-4">
        {projectStats.map((project, index) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`rounded-2xl bg-[#1e293b]/40 backdrop-blur-xl border p-6 ${
              project.isOverBudget ? 'border-red-500/30' : 'border-white/[0.08]'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  project.isOverBudget ? 'bg-red-500/20' : 'bg-blue-500/20'
                }`}>
                  <Building2 className={`w-6 h-6 ${project.isOverBudget ? 'text-red-400' : 'text-blue-400'}`} />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{project.name}</h3>
                  <p className="text-sm text-slate-500">{project.client}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {project.isOverBudget && (
                  <Badge variant="destructive" className="bg-red-500/20 text-red-400 border-red-500/30">
                    <AlertTriangle className="w-3 h-3 ml-1" />
                    تجاوز الميزانية
                  </Badge>
                )}
                {project.budgetUsed > 80 && !project.isOverBudget && (
                  <Badge variant="outline" className="text-amber-400 border-amber-500/30">
                    <TrendingUp className="w-3 h-3 ml-1" />
                    قريب من الحد
                  </Badge>
                )}
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-xs text-slate-500">الميزانية</p>
                <p className="text-lg font-bold text-white">{formatCurrency(project.budget)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">المصروف</p>
                <p className="text-lg font-bold text-emerald-400">{formatCurrency(project.totalExpenses)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">المتبقي</p>
                <p className={`text-lg font-bold ${project.isOverBudget ? 'text-red-400' : 'text-white'}`}>
                  {formatCurrency(project.remainingBudget)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">عدد المصروفات</p>
                <p className="text-lg font-bold text-white">{project.expenseCount}</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">نسبة الاستخدام</span>
                <span className={`font-medium ${project.isOverBudget ? 'text-red-400' : 'text-white'}`}>
                  {project.budgetUsed.toFixed(1)}%
                </span>
              </div>
              <Progress 
                value={project.budgetUsed} 
                className={`h-2 ${project.isOverBudget ? 'bg-red-500/20' : ''}`}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
