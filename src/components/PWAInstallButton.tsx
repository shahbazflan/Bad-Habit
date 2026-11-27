import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { canInstall, isInstalled, isIOS, isInAppBrowser, promptInstall } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled || isInAppBrowser) return null;
  if (!canInstall && !isIOS) return null;

  const handleClick = async () => {
    if (canInstall) {
      await promptInstall();
      return;
    }
    if (isIOS) {
      setShowIOSGuide((prev) => !prev);
    }
  };

  return (
    <div className="mt-2.5">
      <button
        type="button"
        onClick={handleClick}
        className="w-full flex items-center justify-between p-3.5 rounded-[0.5rem] bg-white/[0.14] hover:bg-white/[0.22] active:scale-[0.98] border border-white/25 backdrop-blur-md transition-all text-left cursor-pointer outline-none"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-white/15 border border-white/25 flex items-center justify-center text-white shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
              />
            </svg>
          </div>
          <div>
            <span className="font-display text-sm font-bold tracking-wide text-white block">
              Install App
            </span>
            <span className="text-[11px] font-sans text-white/80 block">
              Instant offline-ready showroom
            </span>
          </div>
        </div>
        <span className="glass-capsule px-2.5 py-0.5 font-grotesk text-white text-[11px] font-bold shrink-0">
          {isIOS && !canInstall ? 'HOW' : 'ADD'}
        </span>
      </button>

      {showIOSGuide && isIOS && !canInstall && (
        <div className="mt-2 p-3 rounded-[0.5rem] bg-[#123354]/90 border border-white/25 text-xs text-white/95 leading-relaxed">
          Tap <span className="font-bold">Share</span> in Safari, then choose{' '}
          <span className="font-bold">Add to Home Screen</span> for one-tap access.
        </div>
      )}
    </div>
  );
};
