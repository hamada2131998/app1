
import React, { useState, useEffect } from 'react';
import { ToastEventDetail, ToastType } from '../lib/toast';
import { CheckCircleIcon, XCircleIcon, InformationCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';

const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<(ToastEventDetail & { id: number })[]>([]);

  useEffect(() => {
    const handleToast = (e: any) => {
      const detail = (e as CustomEvent<ToastEventDetail>).detail;
      const id = Date.now();
      setToasts(prev => [...prev, { ...detail, id }]);

      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, detail.duration || 4000);
    };

    window.addEventListener('app-toast' as any, handleToast);
    return () => window.removeEventListener('app-toast' as any, handleToast);
  }, []);

  const icons: Record<ToastType, any> = {
    success: <CheckCircleIcon className="h-5 w-5 text-emerald-500" />,
    error: <XCircleIcon className="h-5 w-5 text-rose-500" />,
    info: <InformationCircleIcon className="h-5 w-5 text-indigo-500" />,
    warning: <ExclamationTriangleIcon className="h-5 w-5 text-amber-500" />
  };

  const bgStyles: Record<ToastType, string> = {
    success: 'bg-emerald-50 border-emerald-100',
    error: 'bg-rose-50 border-rose-100',
    info: 'bg-indigo-50 border-indigo-100',
    warning: 'bg-amber-50 border-amber-100'
  };

  return (
    <div className="fixed bottom-6 right-6 left-6 md:left-auto md:w-96 z-[100] space-y-3 pointer-events-none">
      {toasts.map(t => (
        <div 
          key={t.id} 
          className={`pointer-events-auto flex items-center gap-3 p-4 rounded-2xl shadow-xl border ${bgStyles[t.type]} animate-in slide-in-from-bottom-5 fade-in duration-300`}
        >
          <div className="shrink-0">{icons[t.type]}</div>
          <p className="text-sm font-black text-gray-800 leading-tight">{t.message}</p>
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;
