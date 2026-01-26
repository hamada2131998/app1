
import React, { useState, useEffect } from 'react';
import { WifiIcon } from '@heroicons/react/24/outline';

const OfflineBanner: React.FC = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="bg-amber-500 text-white text-[10px] font-black py-2 px-4 flex items-center justify-center gap-2 sticky top-0 z-[60] shadow-md animate-in slide-in-from-top duration-300">
      <WifiIcon className="h-4 w-4" />
      <span>عذراً، تعذر الاتصال بالإنترنت. التطبيق يعمل في وضع المعاينة فقط حالياً.</span>
    </div>
  );
};

export default OfflineBanner;
