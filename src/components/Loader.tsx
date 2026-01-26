
import React from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

interface LoaderProps {
  message?: string;
  fullScreen?: boolean;
}

const Loader: React.FC<LoaderProps> = ({ message = 'جاري التحميل...', fullScreen = false }) => {
  const content = (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className="relative">
        <div className="h-12 w-12 rounded-full border-4 border-slate-100 border-t-indigo-600 animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <ArrowPathIcon className="h-5 w-5 text-indigo-200 animate-pulse" />
        </div>
      </div>
      <p className="text-sm font-black text-slate-400 tracking-tight">{message}</p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-[100] flex items-center justify-center">
        {content}
      </div>
    );
  }

  return <div className="py-20 w-full">{content}</div>;
};

export default Loader;
