// =====================================================
// EMPLOYEE EXPENSE REPORT COMPONENT
// Shows detailed expense breakdown per employee
// =====================================================

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useApp, GL_CODES, type Expense, type TeamMember } from '@/contexts/AppContext';
import { Download, User, Calendar as CalendarIcon, Fuel, Plane, Coffee, Wrench, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import { format, isWithinInterval, parseISO, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { exportToExcel, exportToCSV, exportGenericToPDF } from '@/utils/exportUtils';

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

const categoryIcons: Record<string, typeof Fuel> = {
  '6001': Plane,
  '6002': Coffee,
  '6003': FileText,
  '6004': Wrench,
};

export function EmployeeExpenseReport() {
  const { team, expenses, formatCurrency, formatDate } = useApp();
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfMonth(subMonths(new Date(), 2)),
    to: endOfMonth(new Date()),
  });

  const filteredExpenses = useMemo(() => {
    return expenses.filter(exp => {
      const matchesEmployee = selectedEmployee === 'all' || exp.requester_email === team.find(t => t.id === selectedEmployee)?.email;
      const matchesCategory = selectedCategory === 'all' || exp.gl_code === selectedCategory;
      
      let matchesDate = true;
      if (dateRange.from && dateRange.to) {
        const expenseDate = parseISO(exp.created_at);
        matchesDate = isWithinInterval(expenseDate, { start: dateRange.from, end: dateRange.to });
      }
      
      return matchesEmployee && matchesCategory && matchesDate;
    });
  }, [expenses, selectedEmployee, selectedCategory, dateRange, team]);

  const stats = useMemo(() => {
    const total = filteredExpenses.reduce((sum, exp) => sum + exp.total_amount, 0);
    const byCategory = GL_CODES.map(gl => ({
      code: gl.code,
      name: gl.name,
      count: filteredExpenses.filter(e => e.gl_code === gl.code).length,
      amount: filteredExpenses.filter(e => e.gl_code === gl.code).reduce((sum, e) => sum + e.total_amount, 0),
    })).filter(c => c.count > 0);
    
    const byStatus = {
      pending: filteredExpenses.filter(e => e.status === 'pending').length,
      approved: filteredExpenses.filter(e => e.status === 'approved').length,
      rejected: filteredExpenses.filter(e => e.status === 'rejected').length,
      settled: filteredExpenses.filter(e => e.status === 'settled').length,
    };

    return { total, byCategory, byStatus, count: filteredExpenses.length };
  }, [filteredExpenses]);

  const handleExport = (type: 'pdf' | 'excel' | 'csv') => {
    const data = filteredExpenses.map(exp => ({
      'الوصف': exp.title,
      'الموظف': exp.requester_name,
      'الفئة': exp.gl_name,
      'مركز التكلفة': exp.cost_center_name || '-',
      'المبلغ الصافي': exp.net_amount,
      'الضريبة': exp.vat_amount,
      'الإجمالي': exp.total_amount,
      'الحالة': exp.status === 'pending' ? 'قيد الانتظار' : exp.status === 'approved' ? 'موافق عليه' : exp.status === 'rejected' ? 'مرفوض' : 'مسوى',
      'التاريخ': formatDate(exp.created_at),
    }));

    const filename = `employee-expense-report-${format(new Date(), 'yyyy-MM-dd')}`;
    
    if (type === 'pdf') {
      exportGenericToPDF(data, filename, 'تقرير مصروفات الموظفين');
    } else if (type === 'excel') {
      exportToExcel(data, filename);
    } else {
      exportToCSV(data, filename);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
          <SelectTrigger className="w-[200px] bg-white/[0.05] border-white/[0.08] text-white rounded-xl">
            <User className="w-4 h-4 ml-2 text-slate-500" />
            <SelectValue placeholder="اختر الموظف" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700 z-50">
            <SelectItem value="all" className="text-white">جميع الموظفين</SelectItem>
            {team.map(member => (
              <SelectItem key={member.id} value={member.id} className="text-white">
                {member.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[200px] bg-white/[0.05] border-white/[0.08] text-white rounded-xl">
            <SelectValue placeholder="اختر الفئة" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700 z-50">
            <SelectItem value="all" className="text-white">جميع الفئات</SelectItem>
            {GL_CODES.map(gl => (
              <SelectItem key={gl.code} value={gl.code} className="text-white">
                {gl.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[280px] justify-start text-right font-normal bg-white/[0.05] border-white/[0.08] text-white rounded-xl",
                !dateRange.from && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="ml-2 h-4 w-4" />
              {dateRange.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, "dd MMM yyyy", { locale: ar })} -{" "}
                    {format(dateRange.to, "dd MMM yyyy", { locale: ar })}
                  </>
                ) : (
                  format(dateRange.from, "dd MMM yyyy", { locale: ar })
                )
              ) : (
                <span>اختر الفترة</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-slate-800 border-slate-700 z-50" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange.from}
              selected={{ from: dateRange.from, to: dateRange.to }}
              onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
              numberOfMonths={2}
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>

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

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-gradient-to-br from-violet-600/20 to-purple-600/20 border border-violet-500/30 p-5"
        >
          <p className="text-slate-400 text-sm">إجمالي المصروفات</p>
          <p className="text-2xl font-bold text-white mt-1">{formatCurrency(stats.total)}</p>
          <p className="text-xs text-slate-500 mt-1">{stats.count} مصروف</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-5"
        >
          <p className="text-slate-400 text-sm">قيد الانتظار</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">{stats.byStatus.pending}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-5"
        >
          <p className="text-slate-400 text-sm">موافق عليه</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{stats.byStatus.approved}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-5"
        >
          <p className="text-slate-400 text-sm">مسوى</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">{stats.byStatus.settled}</p>
        </motion.div>
      </div>

      {/* Category Breakdown */}
      {stats.byCategory.length > 0 && (
        <Card className="bg-[#1e293b]/40 backdrop-blur-xl border-white/[0.08] rounded-2xl">
          <CardHeader>
            <CardTitle className="text-white text-lg">توزيع المصروفات حسب الفئة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {stats.byCategory.map((cat, index) => {
                const Icon = categoryIcons[cat.code] || FileText;
                return (
                  <motion.div
                    key={cat.code}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08]"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="w-4 h-4 text-violet-400" />
                      <span className="text-sm text-white font-medium truncate">{cat.name}</span>
                    </div>
                    <p className="text-lg font-bold text-white">{formatCurrency(cat.amount)}</p>
                    <p className="text-xs text-slate-500">{cat.count} مصروف</p>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Expenses Table */}
      <Card className="bg-[#1e293b]/40 backdrop-blur-xl border-white/[0.08] rounded-2xl">
        <CardHeader>
          <CardTitle className="text-white text-lg">تفاصيل المصروفات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-white/[0.08] overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-white/[0.08] hover:bg-transparent">
                  <TableHead className="text-slate-400 text-right">الوصف</TableHead>
                  <TableHead className="text-slate-400 text-right">الموظف</TableHead>
                  <TableHead className="text-slate-400 text-right">الفئة</TableHead>
                  <TableHead className="text-slate-400 text-right">مركز التكلفة</TableHead>
                  <TableHead className="text-slate-400 text-right">المبلغ</TableHead>
                  <TableHead className="text-slate-400 text-right">الحالة</TableHead>
                  <TableHead className="text-slate-400 text-right">التاريخ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExpenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-slate-500 py-8">
                      لا توجد مصروفات مطابقة للفلاتر المحددة
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredExpenses.slice(0, 20).map((exp, index) => (
                    <motion.tr
                      key={exp.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="border-white/[0.05] hover:bg-white/[0.02]"
                    >
                      <TableCell className="text-white font-medium">{exp.title}</TableCell>
                      <TableCell className="text-slate-300">{exp.requester_name}</TableCell>
                      <TableCell className="text-slate-300">{exp.gl_name}</TableCell>
                      <TableCell className="text-slate-300">{exp.cost_center_name || '-'}</TableCell>
                      <TableCell className="text-white font-medium">{formatCurrency(exp.total_amount)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn(
                          "text-xs",
                          exp.status === 'pending' && "text-amber-400 border-amber-500/30",
                          exp.status === 'approved' && "text-emerald-400 border-emerald-500/30",
                          exp.status === 'rejected' && "text-red-400 border-red-500/30",
                          exp.status === 'settled' && "text-blue-400 border-blue-500/30"
                        )}>
                          {exp.status === 'pending' ? 'قيد الانتظار' : exp.status === 'approved' ? 'موافق' : exp.status === 'rejected' ? 'مرفوض' : 'مسوى'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-400">{formatDate(exp.created_at)}</TableCell>
                    </motion.tr>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
