
import React from 'react';
import { ExclamationTriangleIcon, InformationCircleIcon, CheckCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface AlertProps {
  type: 'error' | 'warning' | 'info' | 'success';
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

const Alert: React.FC<AlertProps> = ({ type, title, message, onRetry, className = '' }) => {
  const styles = {
    error: 'bg-rose-50 border-rose-100 text-rose-800',
    warning: 'bg-amber-50 border-amber-100 text-amber-800',
    info: 'bg-indigo-50 border-indigo-100 text-indigo-800',
    success: 'bg-emerald-50 border-emerald-100 text-emerald-800'
  };

  const icons = {
    error: <ExclamationTriangleIcon className="h-5 w-5 text-rose-600" />,
    warning: <ExclamationTriangleIcon className="h-5 w-5 text-amber-600" />,
    info: <InformationCircleIcon className="h-5 w-5 text-indigo-600" />,
    success: <CheckCircleIcon className="h-5 w-5 text-emerald-600" />
  };

  return (
    <div className={`p-5 rounded-2xl border ${styles[type]} ${className} animate-in fade-in slide-in-from-top-2 duration-300`}>
      <div className="flex items-start gap-3">
        <div className="shrink-0 mt-0.5">{icons[type]}</div>
        <div className="flex-1">
          {title && <h4 className="text-sm font-black mb-1">{title}</h4>}
          <p className="text-xs font-bold leading-relaxed">{message}</p>
          {onRetry && (
            <button 
              onClick={onRetry} 
              className="mt-3 text-xs font-black flex items-center gap-1.5 hover:underline decoration-2"
            >
              <ArrowPathIcon className="h-3.5 w-3.5" />
              إعادة المحاولة
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Alert;
