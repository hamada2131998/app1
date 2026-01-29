import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MOCK_EXPENSES, type Expense, type ExpenseStatus } from '@/data/mockData';
import { Receipt, Clock, CheckCircle, XCircle, CreditCard } from 'lucide-react';

export function RecentExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setExpenses(MOCK_EXPENSES.slice(0, 5));
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat('ar-SA', {
      day: 'numeric',
      month: 'short',
    }).format(new Date(date));
  };

  const statusConfig: Record<ExpenseStatus, { label: string; icon: typeof Clock; className: string }> = {
    pending: { label: 'قيد المراجعة', icon: Clock, className: 'bg-warning/10 text-warning border-warning/20' },
    approved: { label: 'مقبول', icon: CheckCircle, className: 'bg-success/10 text-success border-success/20' },
    rejected: { label: 'مرفوض', icon: XCircle, className: 'bg-destructive/10 text-destructive border-destructive/20' },
    settled: { label: 'تمت التسوية', icon: CreditCard, className: 'bg-primary/10 text-primary border-primary/20' },
  };

  return (
    <Card className="shadow-card border-0 glass-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <Receipt className="w-5 h-5 text-primary" />
          آخر المصروفات
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 shimmer rounded-lg" />
            ))}
          </div>
        ) : expenses.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Receipt className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>لا توجد مصروفات حتى الآن</p>
          </div>
        ) : (
          <div className="space-y-3">
            {expenses.map((expense) => {
              const status = statusConfig[expense.status];
              const StatusIcon = status.icon;
              return (
                <div
                  key={expense.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Receipt className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{expense.description}</p>
                      <p className="text-sm text-muted-foreground">{formatDate(expense.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className={status.className}>
                      <StatusIcon className="w-3 h-3 ml-1" />
                      {status.label}
                    </Badge>
                    <span className="font-bold text-foreground">{formatCurrency(expense.amount)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
