import React from 'react';
import { BrandLogo } from './BrandLogo';
import { useMember } from '../context/MemberContext';

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
 * - Left: Menu/Back icon + Constant clickable "BAD HABIT / YOU KNOW YOU WANT IT" logo
 * - Right: Wishlist button, Member sign-in/pass button, and Shopping Bag icon
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
  const { member, wishlistItems, setIsMemberModalOpen, setIsWishlistOpen } = useMember();
  const wishlistCount = wishlistItems.length;

  return (
    <>
      <header
        className={`${transparent ? 'sticky' : 'fixed'} top-0 left-0 right-0 z-40 w-full transition-colors duration-200 select-none ${
          transparent
            ? 'bg-gradient-to-b from-black/30 via-black/10 to-transparent'
            : 'bg-[#557c9e]/85 backdrop-blur-md border-b border-white/15'
        } px-3.5 py-2.5 pt-[calc(10px+env(safe-area-inset-top))]`}
      >
      <div className="relative w-full h-11 flex items-center justify-between gap-2">
        {/* LEFT ACTION: Menu (or Back) + Persistent Clickable BAD HABIT Logo */}
        <div className="flex items-center gap-1.5 z-10 min-w-0">
          {showBack && onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="min-w-[40px] h-[40px] flex items-center gap-1 text-white/90 hover:text-white transition-opacity active:scale-95 cursor-pointer outline-none -ml-1 px-1"
              aria-label={backLabel}
            >
              <svg className="w-5 h-5 text-white shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenMenu}
              className="w-10 h-10 flex items-center justify-center text-white/90 hover:text-white transition-opacity active:scale-95 cursor-pointer outline-none -ml-1 shrink-0"
              aria-label="Open navigation menu"
            >
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
          )}

          <BrandLogo compact onClick={onGoHome} />
        </div>

        {/* RIGHT ACTIONS: Member, Wishlist & Shopping Bag */}
        <div className="flex items-center gap-1 z-10 shrink-0">
          <button
            type="button"
            onClick={() => setIsMemberModalOpen(true)}
            className={`h-8 px-2.5 rounded-full border backdrop-blur-md text-[10px] font-display font-bold tracking-wide flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer ${
              member
                ? 'bg-white/25 border-white/45 text-white'
                : 'bg-white/15 border-white/35 text-white'
            }`}
            aria-label={member ? 'Member pass' : 'Member login'}
          >
            <svg className="w-3.5 h-3.5 text-cyan-200 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
            <span>Member</span>
          </button>

          <button
            type="button"
            onClick={() => setIsWishlistOpen(true)}
            className="relative w-10 h-10 flex items-center justify-center text-white/90 hover:text-white transition-opacity active:scale-95 cursor-pointer outline-none"
            aria-label={`Wishlist containing ${wishlistCount} items`}
          >
            <svg
              className={`w-5 h-5 ${wishlistCount > 0 ? 'text-rose-300 fill-rose-400' : 'text-white'}`}
              fill={wishlistCount > 0 ? 'currentColor' : 'none'}
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="1.9"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
              />
            </svg>
            {wishlistCount > 0 && (
              <span className="absolute top-1.5 right-1 min-w-[14px] h-[14px] px-1 rounded-full bg-rose-500 text-white text-[9px] font-mono font-bold flex items-center justify-center shadow-sm">
                {wishlistCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={onOpenBag}
            className="relative w-10 h-10 flex items-center justify-center text-white/90 hover:text-white transition-opacity active:scale-95 cursor-pointer outline-none -mr-1"
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
              <span className="absolute top-1.5 right-1 min-w-[15px] h-[15px] px-1 rounded-full bg-white text-black text-[9px] font-mono font-bold flex items-center justify-center shadow-sm">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
      </header>
      {!transparent && (
        <div
          className="w-full h-[calc(65px+env(safe-area-inset-top))] shrink-0"
          aria-hidden="true"
        />
      )}
    </>
  );
};
