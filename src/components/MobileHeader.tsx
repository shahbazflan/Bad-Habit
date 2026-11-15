import React from 'react';

interface MobileHeaderProps {
  onOpenMenu: () => void;
  onOpenBag: () => void;
  onGoHome: () => void;
  cartCount: number;
  showBack?: boolean;
  onBack?: () => void;
  backLabel?: string;
  transparent?: boolean;
}

/**
 * MobileHeader
 * 
 * Precision-matched mobile header:
 * - Left: Menu icon (3 thin lines) or Back arrow if showBack is enabled
 * - Center: Genuinely centered "BAD HABIT" wordmark (independent of side buttons)
 * - Right: Minimalist shopping-bag icon with unobtrusive item count badge
 * - Accessible touch targets (>= 44x44px)
 * - Safe area inset compliance
 */
export const MobileHeader: React.FC<MobileHeaderProps> = ({
  onOpenMenu,
  onOpenBag,
  onGoHome,
  cartCount,
  showBack = false,
  onBack,
  backLabel = 'Back',
  transparent = false,
}) => {
  return (
    <header
      className={`sticky top-0 left-0 right-0 z-40 w-full transition-colors duration-200 select-none ${
        transparent
          ? 'bg-gradient-to-b from-black/30 via-black/10 to-transparent'
          : 'bg-[#557c9e]/80 backdrop-blur-md border-b border-white/15'
      } px-4 py-2.5 pt-[calc(10px+env(safe-area-inset-top))]`}
    >
      <div className="relative w-full h-11 flex items-center justify-between">
        {/* LEFT ACTION: Menu (or Back) */}
        <div className="flex items-center z-10">
          {showBack && onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="min-w-[44px] h-[44px] flex items-center gap-1.5 text-white/90 hover:text-white transition-opacity active:scale-95 cursor-pointer outline-none -ml-2 px-2"
              aria-label={backLabel}
            >
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
              <span className="text-xs font-mono text-white/80 hidden xs:inline">{backLabel}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenMenu}
              className="w-11 h-11 flex items-center justify-center text-white/90 hover:text-white transition-opacity active:scale-95 cursor-pointer outline-none -ml-2"
              aria-label="Open navigation menu"
            >
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
          )}
        </div>

        {/* CENTER: Wordmark removed as requested */}
        <div className="flex-1" />

        {/* RIGHT ACTION: Shopping Bag Icon + Tagline below */}
        <div className="flex flex-col items-end justify-center z-10">
          <button
            type="button"
            onClick={onOpenBag}
            className="relative w-11 h-11 flex items-center justify-center text-white/90 hover:text-white transition-opacity active:scale-95 cursor-pointer outline-none -mr-2"
            aria-label={`Shopping bag containing ${cartCount} items`}
          >
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="1.9"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
              />
            </svg>
            {cartCount > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-[15px] h-[15px] px-1 rounded-full bg-white text-black text-[9px] font-mono font-bold flex items-center justify-center shadow-sm">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
