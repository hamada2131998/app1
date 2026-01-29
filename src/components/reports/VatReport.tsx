// =====================================================
// VAT REPORT COMPONENT
// Shows VAT summary for tax reporting
// =====================================================

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useApp } from '@/contexts/AppContext';
import { Download, Percent, FileText, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ar } from 'date-fns/locale';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { exportToExcel, exportGenericToPDF } from '@/utils/exportUtils';

const COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#3b82f6'];

export function VatReport() {
  const { expenses, formatCurrency, formatDate } = useApp();
  const [selectedPeriod, setSelectedPeriod] = useState<'current' | 'previous' | 'quarter'>('current');

  const periodDates = useMemo(() => {
    const now = new Date();
    switch (selectedPeriod) {
      case 'current':
        return { from: startOfMonth(now), to: endOfMonth(now), label: format(now, 'MMMM yyyy', { locale: ar }) };
      case 'previous':
        const prevMonth = subMonths(now, 1);
        return { from: startOfMonth(prevMonth), to: endOfMonth(prevMonth), label: format(prevMonth, 'MMMM yyyy', { locale: ar }) };
      case 'quarter':
        return { from: subMonths(now, 3), to: now, label: 'آخر 3 أشهر' };
    }
  }, [selectedPeriod]);

  const vatStats = useMemo(() => {
    const periodExpenses = expenses.filter(exp => {
      const expDate = new Date(exp.created_at);
      return expDate >= periodDates.from && expDate <= periodDates.to;
    });

    const settledExpenses = periodExpenses.filter(e => e.status === 'settled');
    const approvedExpenses = periodExpenses.filter(e => e.status === 'approved');
    const pendingExpenses = periodExpenses.filter(e => e.status === 'pending');

    const totalNet = periodExpenses.reduce((sum, e) => sum + e.net_amount, 0);
    const totalVat = periodExpenses.reduce((sum, e) => sum + e.vat_amount, 0);
    const totalGross = periodExpenses.reduce((sum, e) => sum + e.total_amount, 0);

    const settledVat = settledExpenses.reduce((sum, e) => sum + e.vat_amount, 0);
    const pendingVat = pendingExpenses.reduce((sum, e) => sum + e.vat_amount, 0) + 
                       approvedExpenses.reduce((sum, e) => sum + e.vat_amount, 0);

    return {
      totalNet,
      totalVat,
      totalGross,
      settledVat,
      pendingVat,
      expenseCount: periodExpenses.length,
      settledCount: settledExpenses.length,
    };
  }, [expenses, periodDates]);

  const pieData = [
    { name: 'ضريبة مسددة', value: vatStats.settledVat, color: '#10b981' },
    { name: 'ضريبة معلقة', value: vatStats.pendingVat, color: '#f59e0b' },
  ].filter(d => d.value > 0);

  const handleExport = (type: 'pdf' | 'excel') => {
    const data = [{
      'الفترة': periodDates.label,
      'المبلغ الصافي': vatStats.totalNet,
      'ضريبة القيمة المضافة': vatStats.totalVat,
      'الإجمالي': vatStats.totalGross,
      'ضريبة مسددة': vatStats.settledVat,
      'ضريبة معلقة': vatStats.pendingVat,
      'عدد المصروفات': vatStats.expenseCount,
    }];

    const filename = `vat-report-${format(new Date(), 'yyyy-MM-dd')}`;
    
    if (type === 'pdf') {
      exportGenericToPDF(data, filename, 'تقرير ضريبة القيمة المضافة');
    } else {
      exportToExcel(data, filename);
    }
  };

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex gap-2">
          {[
            { key: 'current', label: 'الشهر الحالي' },
            { key: 'previous', label: 'الشهر السابق' },
            { key: 'quarter', label: 'ربع سنوي' },
          ].map(period => (
            <Button
              key={period.key}
              variant={selectedPeriod === period.key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedPeriod(period.key as any)}
              className={selectedPeriod === period.key 
                ? 'bg-violet-600 hover:bg-violet-700 rounded-xl' 
                : 'border-white/[0.08] text-slate-300 hover:bg-white/[0.05] rounded-xl'
              }
            >
              {period.label}
            </Button>
          ))}
        </div>

        <div className="mr-auto flex gap-2">
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
      </div>

      {/* Period Badge */}
      <div className="flex items-center gap-2">
        <Calendar className="w-4 h-4 text-slate-500" />
        <Badge variant="outline" className="text-violet-400 border-violet-500/30">
          {periodDates.label}
        </Badge>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-[#1e293b]/40 backdrop-blur-xl border border-white/[0.08] p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">المبلغ الصافي</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(vatStats.totalNet)}</p>
            </div>
          </div>
          <p className="text-xs text-slate-500">{vatStats.expenseCount} مصروف</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl bg-gradient-to-br from-violet-600/20 to-purple-600/20 border border-violet-500/30 p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-violet-500/30 flex items-center justify-center">
              <Percent className="w-6 h-6 text-violet-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">ضريبة القيمة المضافة (15%)</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(vatStats.totalVat)}</p>
            </div>
          </div>
          <div className="flex gap-4 text-xs">
            <span className="text-emerald-400">مسددة: {formatCurrency(vatStats.settledVat)}</span>
            <span className="text-amber-400">معلقة: {formatCurrency(vatStats.pendingVat)}</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl bg-[#1e293b]/40 backdrop-blur-xl border border-white/[0.08] p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <FileText className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">الإجمالي شامل الضريبة</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(vatStats.totalGross)}</p>
            </div>
          </div>
          <p className="text-xs text-slate-500">{vatStats.settledCount} مصروف مسوى</p>
        </motion.div>
      </div>

      {/* Chart */}
      {pieData.length > 0 && (
        <Card className="bg-[#1e293b]/40 backdrop-blur-xl border-white/[0.08] rounded-2xl">
          <CardHeader>
            <CardTitle className="text-white text-lg">توزيع ضريبة القيمة المضافة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(30, 41, 59, 0.95)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '1rem',
                    }}
                    formatter={(value: number) => [formatCurrency(value), '']}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* VAT Info Card */}
      <Card className="bg-gradient-to-br from-violet-600/10 to-purple-600/10 border-violet-500/30 rounded-2xl">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center shrink-0">
              <Percent className="w-6 h-6 text-violet-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white mb-2">معلومات ضريبة القيمة المضافة</h3>
              <ul className="text-sm text-slate-400 space-y-1">
                <li>• نسبة ضريبة القيمة المضافة في المملكة العربية السعودية: <span className="text-violet-400 font-medium">15%</span></li>
                <li>• يتم احتساب الضريبة تلقائياً عند إدخال المصروفات</li>
                <li>• يمكن اختيار إدخال المبلغ شامل أو غير شامل الضريبة</li>
                <li>• التقارير تعرض المبلغ الصافي والضريبة والإجمالي بشكل منفصل</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
