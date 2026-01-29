import { CheckCircle, Clock, XCircle, AlertCircle, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimelineStep {
  id: string;
  label: string;
  description?: string;
  status: 'completed' | 'current' | 'pending' | 'rejected';
  date?: string;
}

interface ExpenseTimelineProps {
  expenseStatus: 'pending' | 'approved' | 'rejected' | 'settled';
  createdAt: string;
  approvedAt?: string;
  settledAt?: string;
  rejectionReason?: string;
}

export function ExpenseTimeline({ 
  expenseStatus, 
  createdAt, 
  approvedAt, 
  settledAt,
  rejectionReason 
}: ExpenseTimelineProps) {
  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  const getSteps = (): TimelineStep[] => {
    const baseSteps: TimelineStep[] = [
      {
        id: 'submitted',
        label: 'تم الإرسال',
        description: 'تم تقديم طلب المصروف',
        status: 'completed',
        date: createdAt,
      },
    ];

    if (expenseStatus === 'rejected') {
      return [
        ...baseSteps,
        {
          id: 'rejected',
          label: 'مرفوض',
          description: rejectionReason || 'تم رفض الطلب من قبل المدير',
          status: 'rejected',
          date: approvedAt,
        },
      ];
    }

    if (expenseStatus === 'pending') {
      return [
        ...baseSteps,
        {
          id: 'review',
          label: 'قيد المراجعة',
          description: 'في انتظار موافقة المدير',
          status: 'current',
        },
        {
          id: 'settled',
          label: 'التسوية',
          description: 'في انتظار تسوية المحاسب',
          status: 'pending',
        },
      ];
    }

    if (expenseStatus === 'approved') {
      return [
        ...baseSteps,
        {
          id: 'approved',
          label: 'تمت الموافقة',
          description: 'وافق المدير على الطلب',
          status: 'completed',
          date: approvedAt,
        },
        {
          id: 'settled',
          label: 'التسوية',
          description: 'في انتظار تسوية المحاسب',
          status: 'current',
        },
      ];
    }

    // Settled
    return [
      ...baseSteps,
      {
        id: 'approved',
        label: 'تمت الموافقة',
        description: 'وافق المدير على الطلب',
        status: 'completed',
        date: approvedAt,
      },
      {
        id: 'settled',
        label: 'تمت التسوية',
        description: 'تم صرف المبلغ من البنك',
        status: 'completed',
        date: settledAt,
      },
    ];
  };

  const steps = getSteps();

  const getStepIcon = (status: TimelineStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5" />;
      case 'current':
        return <Clock className="w-5 h-5 animate-pulse" />;
      case 'rejected':
        return <XCircle className="w-5 h-5" />;
      default:
        return <AlertCircle className="w-5 h-5" />;
    }
  };

  const getStepStyles = (status: TimelineStep['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-success text-success-foreground border-success';
      case 'current':
        return 'bg-primary text-primary-foreground border-primary';
      case 'rejected':
        return 'bg-destructive text-destructive-foreground border-destructive';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getLineStyles = (status: TimelineStep['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-success';
      case 'current':
        return 'bg-gradient-to-b from-primary to-muted';
      case 'rejected':
        return 'bg-destructive';
      default:
        return 'bg-border';
    }
  };

  return (
    <div className="space-y-0">
      {steps.map((step, index) => (
        <div key={step.id} className="relative flex gap-4">
          {/* Line */}
          {index < steps.length - 1 && (
            <div
              className={cn(
                'absolute right-[22px] top-10 w-0.5 h-full -translate-x-1/2',
                getLineStyles(step.status)
              )}
            />
          )}

          {/* Icon */}
          <div
            className={cn(
              'relative z-10 flex items-center justify-center w-11 h-11 rounded-full border-2 transition-all duration-300',
              getStepStyles(step.status)
            )}
          >
            {getStepIcon(step.status)}
          </div>

          {/* Content */}
          <div className="flex-1 pb-8">
            <div className="flex items-center gap-2">
              <h4 className={cn(
                'font-semibold',
                step.status === 'pending' ? 'text-muted-foreground' : 'text-foreground'
              )}>
                {step.label}
              </h4>
              {step.date && (
                <span className="text-xs text-muted-foreground">
                  {formatDate(step.date)}
                </span>
              )}
            </div>
            {step.description && (
              <p className={cn(
                'text-sm mt-1',
                step.status === 'rejected' ? 'text-destructive' : 'text-muted-foreground'
              )}>
                {step.description}
              </p>
            )}
            {step.status === 'rejected' && rejectionReason && (
              <div className="mt-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-sm text-destructive font-medium">
                  سبب الرفض: {rejectionReason}
                </p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
