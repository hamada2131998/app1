import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

export function LoadingState({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="h-4 w-1/2 animate-pulse rounded bg-slate-200" />
          <div className="mt-3 h-3 w-3/4 animate-pulse rounded bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-6 text-center shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm text-slate-500">{description}</p>
      {actionLabel && onAction && (
        <button
          className="mt-4 inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow"
          onClick={onAction}
          type="button"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export function ErrorState({
  title,
  description,
  onRetry,
  className,
}: {
  title: string;
  description: string;
  onRetry: () => void;
  className?: string;
}) {
  return (
    <div className={cn('rounded-3xl border border-rose-200 bg-rose-50 p-6 text-center', className)}>
      <h3 className="text-lg font-semibold text-rose-700">{title}</h3>
      <p className="mt-2 text-sm text-rose-600">{description}</p>
      <button
        className="mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-rose-600 px-4 py-2 text-sm font-medium text-white shadow"
        onClick={onRetry}
        type="button"
      >
        <RefreshCw className="h-4 w-4" />
        إعادة المحاولة
      </button>
    </div>
  );
}
