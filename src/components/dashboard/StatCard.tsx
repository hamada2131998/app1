import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'primary' | 'success' | 'warning';
}

export function StatCard({ title, value, subtitle, icon, trend, variant = 'default' }: StatCardProps) {
  const variantStyles = {
    default: 'bg-card',
    primary: 'gradient-primary text-primary-foreground',
    success: 'gradient-success text-success-foreground',
    warning: 'bg-warning text-warning-foreground',
  };

  const iconBgStyles = {
    default: 'bg-primary/10 text-primary',
    primary: 'bg-white/20 text-white',
    success: 'bg-white/20 text-white',
    warning: 'bg-white/20 text-white',
  };

  return (
    <Card className={cn('shadow-card hover:shadow-elevated transition-shadow border-0', variantStyles[variant])}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className={cn('text-sm font-medium', variant === 'default' ? 'text-muted-foreground' : 'opacity-80')}>
              {title}
            </p>
            <p className="text-3xl font-bold">{value}</p>
            {subtitle && (
              <p className={cn('text-sm', variant === 'default' ? 'text-muted-foreground' : 'opacity-70')}>
                {subtitle}
              </p>
            )}
            {trend && (
              <div className="flex items-center gap-1">
                <span className={cn('text-sm font-medium', trend.isPositive ? 'text-success' : 'text-destructive')}>
                  {trend.isPositive ? '+' : ''}{trend.value}%
                </span>
                <span className={cn('text-xs', variant === 'default' ? 'text-muted-foreground' : 'opacity-60')}>
                  من الشهر الماضي
                </span>
              </div>
            )}
          </div>
          <div className={cn('p-3 rounded-xl', iconBgStyles[variant])}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
