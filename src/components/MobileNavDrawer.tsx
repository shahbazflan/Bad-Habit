import React, { useEffect } from 'react';
import { CategoryId } from './MobileCategorySection';
import { PolicyType } from './PolicyModal';
import { MAIN_COLLECTION, HOODIE_PRODUCTS, SHIRT_PRODUCTS } from '../data/products';
import { useMember } from '../context/MemberContext';
import { CleanPlatePicture } from './CleanPlatePicture';

interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCategory: (categoryId: CategoryId) => void;
  onOpenBag: () => void;
  onOpenPolicy: (type: PolicyType) => void;
  onGoHome?: () => void;
  cartCount: number;
}

export const MobileNavDrawer: React.FC<MobileNavDrawerProps> = ({
  isOpen,
  onClose,
  onSelectCategory,
  onOpenBag,
  onOpenPolicy,
  onGoHome,
  cartCount,
}) => {
  const { member, wishlistItems, setIsMemberModalOpen, setIsWishlistOpen } = useMember();
  const wishlistCount = wishlistItems.length;
  // Lock body scroll and attach Escape key listener when drawer is open
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex"
      role="dialog"
      aria-modal="true"
      aria-label="Mobile Navigation Menu"
    >
      {/* Light Backdrop Dim */}
      <div
        className="fixed inset-0 bg-slate-950/35 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-out Menu Panel in Sky-Blue Showroom Palette */}
      <div className="relative w-[85vw] max-w-[340px] h-full flex flex-col justify-between p-6 z-10 shadow-[0_20px_60px_rgba(4,24,43,0.4)] border-r border-white/25 overflow-y-auto text-white">
        {/* Background Atmosphere: Clean plate glass texture + sky blue frosted wash */}
        <div className="absolute inset-0 pointer-events-none opacity-40 mix-blend-screen overflow-hidden">
          <CleanPlatePicture
            alt=""
            ariaHidden={true}
            className="w-full h-full object-cover object-center"
            sizes="340px"
            loading="lazy"
            decoding="async"
          />
        </div>
        <div className="absolute inset-0 bg-[#2f5c88]/85 backdrop-blur-2xl pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-black/20 pointer-events-none" />

        {/* Content Container */}
        <div className="relative z-10 flex flex-col justify-between h-full min-h-[520px]">
          {/* Top Section */}
          <div>
            {/* Header Row with Close Button */}
            <div className="flex items-center justify-between pb-6 border-b border-white/20">
              <button
                type="button"
                onClick={() => {
                  onGoHome?.();
                  onClose();
                }}
                className="text-left cursor-pointer outline-none active:scale-95 transition-transform"
                aria-label="BAD HABIT — Return to Home Page"
              >
                <span className="font-display text-xl sm:text-2xl font-black tracking-[0.14em] uppercase text-white block">
                  BAD HABIT
                </span>
                <span className="text-[9.5px] font-medium tracking-[0.26em] text-white/85 uppercase block mt-0.5">
                  YOU KNOW YOU WANT IT
                </span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-11 h-11 rounded-full border border-white/25 bg-white/15 hover:bg-white/25 active:scale-95 backdrop-blur-md flex items-center justify-center text-white transition-all cursor-pointer outline-none"
                aria-label="Close navigation menu"
              >
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Category Navigation Links */}
            <div className="py-6 space-y-4">
              <span className="font-display text-[10px] font-bold tracking-[0.24em] text-white/75 uppercase block">
                CATEGORIES
              </span>

              <div className="flex flex-col space-y-2.5">
                {/* 1. Make a Pair Card */}
                <button
                  type="button"
                  onClick={() => {
                    onSelectCategory('pair');
                    onClose();
                  }}
                  className="group flex items-center justify-between p-3.5 rounded-2xl bg-cyan-400/[0.18] hover:bg-cyan-400/[0.26] active:scale-[0.98] border border-cyan-200/50 backdrop-blur-md transition-all text-left cursor-pointer outline-none"
                >
                  <div>
                    <span className="font-display text-base font-black tracking-wide text-white block">
                      MAKE A PAIR
                    </span>
                    <span className="text-[14px] font-grotesk text-white/95 font-semibold mt-0.5 block">
                      Get a flat 15% off · Shirts, Hoodies + Trousers
                    </span>
                  </div>
                  <div className="w-8 h-8 rounded-full border border-cyan-200/40 bg-white/15 flex items-center justify-center text-white group-hover:border-white/60 transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </div>
                </button>

                {/* 2. Trousers Card */}
                <button
                  type="button"
                  onClick={() => {
                    onSelectCategory('trousers');
                    onClose();
                  }}
                  className="group flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.12] hover:bg-white/[0.20] active:scale-[0.98] border border-white/20 backdrop-blur-md transition-all text-left cursor-pointer outline-none"
                >
                  <div>
                    <span className="font-display text-base font-bold tracking-wide text-white block">
                      TROUSERS
                    </span>
                    <span className="text-xs text-white/85 font-sans mt-0.5 block">
                      {MAIN_COLLECTION.length} Articles
                    </span>
                  </div>
                  <div className="w-8 h-8 rounded-full border border-white/20 bg-white/10 flex items-center justify-center text-white/80 group-hover:text-white group-hover:border-white/40 transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </div>
                </button>

                {/* 3. Shirts Card */}
                <button
                  type="button"
                  onClick={() => {
                    onSelectCategory('shirts');
                    onClose();
                  }}
                  className="group flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.12] hover:bg-white/[0.20] active:scale-[0.98] border border-white/20 backdrop-blur-md transition-all text-left cursor-pointer outline-none"
                >
                  <div>
                    <span className="font-display text-base font-bold tracking-wide text-white block">
                      SHIRTS
                    </span>
                    <span className="text-xs text-white/85 font-sans mt-0.5 block">
                      {SHIRT_PRODUCTS.length} Articles
                    </span>
                  </div>
                  <div className="w-8 h-8 rounded-full border border-white/20 bg-white/10 flex items-center justify-center text-white/80 group-hover:text-white group-hover:border-white/40 transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </div>
                </button>

                {/* 4. Hoodies & Sweatshirts Card */}
                <button
                  type="button"
                  onClick={() => {
                    onSelectCategory('hoodies');
                    onClose();
                  }}
                  className="group flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.12] hover:bg-white/[0.20] active:scale-[0.98] border border-white/20 backdrop-blur-md transition-all text-left cursor-pointer outline-none"
                >
                  <div>
                    <span className="font-display text-base font-bold tracking-wide text-white block">
                      HOODIES & SWEATSHIRTS
                    </span>
                    <span className="text-xs text-white/85 font-sans mt-0.5 block">
                      {HOODIE_PRODUCTS.length} Articles
                    </span>
                  </div>
                  <div className="w-8 h-8 rounded-full border border-white/20 bg-white/10 flex items-center justify-center text-white/80 group-hover:text-white group-hover:border-white/40 transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </div>
                </button>
              </div>

              {/* Member Account & 10% First-Order Code */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  setIsMemberModalOpen(true);
                }}
                className="w-full mt-4 flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-cyan-400/20 via-sky-300/20 to-cyan-400/20 hover:from-cyan-400/30 hover:to-sky-300/30 active:scale-[0.98] border border-cyan-200/45 backdrop-blur-md transition-all text-left cursor-pointer outline-none shadow-sm"
              >
                <div>
                  <span className="font-display text-sm font-black tracking-wide text-white block">
                    {member ? 'Member' : 'Become a Member · 10% Off'}
                  </span>
                  <span className="text-[11px] font-display text-cyan-100 mt-0.5 block">
                    {member
                      ? member.email
                      : 'Phone + Email signup for 10% off 1st order'}
                  </span>
                </div>
                <span className="glass-capsule px-2.5 py-0.5 font-grotesk text-white text-[11px] font-bold shrink-0">
                  {member ? 'PASS' : 'JOIN'}
                </span>
              </button>

              {/* Wishlist Quick Action */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  setIsWishlistOpen(true);
                }}
                className="w-full mt-2.5 flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.14] hover:bg-white/[0.22] active:scale-[0.98] border border-white/25 backdrop-blur-md transition-all text-left cursor-pointer outline-none shadow-sm"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center text-rose-300">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                  </div>
                  <span className="font-display text-sm font-bold tracking-wide text-white">
                    Wishlist
                  </span>
                </div>
                <span className="glass-capsule font-grotesk text-[13px] font-bold text-white px-2 py-0.5">
                  ({wishlistCount})
                </span>
              </button>

              {/* Shopping Bag Quick Action */}
              <button
                type="button"
                onClick={() => {
                  onOpenBag();
                  onClose();
                }}
                className="w-full mt-2.5 flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.18] hover:bg-white/[0.26] active:scale-[0.98] border border-white/30 backdrop-blur-md transition-all text-left cursor-pointer outline-none shadow-sm"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center text-white">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.9">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />
                    </svg>
                  </div>
                  <span className="font-display text-sm font-bold tracking-wide text-white">
                    Shopping Bag
                  </span>
                </div>
                <span className="glass-capsule font-grotesk text-[13px] font-bold text-white px-2 py-0.5">
                  ({cartCount})
                </span>
              </button>
            </div>
          </div>

          {/* Bottom Policy Links & Details */}
          <div className="pt-6 border-t border-white/20 space-y-4">
            <span className="font-display text-[10px] font-bold tracking-[0.24em] text-white/70 uppercase block">
              STUDIO POLICIES
            </span>

            <div className="grid grid-cols-2 gap-2 text-xs text-white/85 font-medium">
              <button
                type="button"
                onClick={() => {
                  onOpenPolicy('shipping');
                  onClose();
                }}
                className="text-left hover:text-white transition-colors py-1 cursor-pointer outline-none"
              >
                Shipping & Delivery
              </button>
              <button
                type="button"
                onClick={() => {
                  onOpenPolicy('returns');
                  onClose();
                }}
                className="text-left hover:text-white transition-colors py-1 cursor-pointer outline-none"
              >
                Returns Policy
              </button>
              <button
                type="button"
                onClick={() => {
                  onOpenPolicy('privacy');
                  onClose();
                }}
                className="text-left hover:text-white transition-colors py-1 cursor-pointer outline-none"
              >
                Privacy Notice
              </button>
              <button
                type="button"
                onClick={() => {
                  onOpenPolicy('terms');
                  onClose();
                }}
                className="text-left hover:text-white transition-colors py-1 cursor-pointer outline-none"
              >
                Terms of Service
              </button>
            </div>

            <div className="pt-2 text-[11px] text-white/70 font-medium border-t border-white/10">
              <span>Currency: PKR · Cash on Delivery</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
