import React, { useState, useEffect } from 'react';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="glass-capsule fixed bottom-5 left-1/2 -translate-x-1/2 z-[65] px-4 py-1.5 text-white text-[12px] font-grotesk font-semibold shadow-2xl pointer-events-none flex items-center gap-2 whitespace-nowrap"
    >
      <span className="w-2 h-2 rounded-full bg-amber-300 shrink-0" />
      <span>Offline · Viewing cached collection</span>
    </div>
  );
};
