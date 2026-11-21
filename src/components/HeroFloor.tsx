/**
 * HeroFloor
 * 
 * Upper architectural runway featuring:
 * - Architecture & sky at the back (z-1)
 * - Complete BAD HABIT brand & tagline asset scaled to ~70% width, centered in the sky opening (z-5)
 * - Central model & perspective contact shadows in the foreground (z-10)
 * - Frosted glass "View collection" button (z-25)
 */

import { useCart } from '../context/CartContext';
import { useMember } from '../context/MemberContext';
import { BrandLogo } from './BrandLogo';
import { HeroCloudOffer } from './HeroCloudOffer';
import { CleanPlatePicture } from './CleanPlatePicture';
import { HERO_LOGO_URL, HERO_MODEL_URL, getResponsiveSrcSet } from '../data/products';

interface HeroFloorProps {
  onViewCollection: () => void;
  activeFloor?: 'hero' | 'showroom';
  onNavigateToFloor?: (floor: 'hero' | 'showroom') => void;
}

export function HeroFloor({ onViewCollection, onNavigateToFloor }: HeroFloorProps) {
  const { cartCount, setIsBagOpen } = useCart();
  const { member, wishlistItems, setIsMemberModalOpen, setIsWishlistOpen } = useMember();
  const wishlistCount = wishlistItems.length;

  return (
    <section
      className="relative w-full h-[100vh] h-[100dvh] overflow-clip select-none border-b-2 border-white/90 bg-[#1f486d]"
      aria-label="BAD HABIT Hero Runway"
    >
      {/* 1. LAYER: Architecture & Sky at the back (Z-Index 1) */}
      <CleanPlatePicture
        alt="Architectural space with sky and white floor"
        className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none z-[1]"
        sizes="100vw"
        loading="eager"
        decoding="async"
        fetchPriority="high"
      />

      {/* Header Bar (Z-Index 30) */}
      <header className="absolute top-0 left-0 w-full z-30 flex items-start justify-between px-5 sm:px-8 lg:px-10 pt-[calc(20px+env(safe-area-inset-top))] sm:pt-[calc(28px+env(safe-area-inset-top))] pointer-events-none">
        {/* Top-Left Constant BAD HABIT Logo */}
        <div className="pointer-events-auto select-none">
          <BrandLogo
            onClick={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
              onNavigateToFloor?.('hero');
            }}
          />
        </div>

        {/* Desktop Controls (Member, Wishlist, Bag) */}
        <div className="hidden md:flex pointer-events-auto items-center gap-2">
          <button
            type="button"
            onClick={() => setIsMemberModalOpen(true)}
            className="glass-capsule glass-capsule-hover px-3.5 py-1.5 rounded-full flex items-center gap-1.5 text-[13px] font-grotesk font-semibold text-white cursor-pointer transition-all shadow-sm"
            aria-label={member ? 'View member pass' : 'Become a member for 10% off first order'}
          >
            <svg className="w-3.5 h-3.5 text-white shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
            <span>
              {member ? 'Member' : 'Become a Member · 10% Off'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setIsWishlistOpen(true)}
            className="glass-capsule glass-capsule-hover px-3.5 py-1.5 rounded-full flex items-center gap-1.5 text-[13px] font-grotesk font-semibold text-white cursor-pointer transition-all shadow-sm"
            aria-label={`Wishlist (${wishlistCount} items)`}
          >
            <svg
              className={`w-3.5 h-3.5 ${wishlistCount > 0 ? 'text-rose-400 fill-rose-400' : 'text-white'}`}
              fill={wishlistCount > 0 ? 'currentColor' : 'none'}
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
            <span>Wishlist{wishlistCount > 0 ? ` (${wishlistCount})` : ''}</span>
          </button>

          {cartCount > 0 && (
            <button
              type="button"
              onClick={() => setIsBagOpen(true)}
              className="glass-capsule glass-capsule-hover px-3.5 py-1.5 rounded-full flex items-center gap-1.5 text-[13px] font-grotesk font-semibold text-white cursor-pointer transition-all shadow-sm"
              aria-label={`Shopping bag containing ${cartCount} items`}
            >
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <span>BAG ({cartCount})</span>
            </button>
          )}
        </div>

        {/* Mobile Controls (Member, Wishlist, Bag — L1/L2 removed) */}
        <div className="flex md:hidden pointer-events-auto items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsMemberModalOpen(true)}
            className="glass-capsule px-2.5 py-1 rounded-full flex items-center gap-1 text-[12px] font-grotesk font-semibold text-white cursor-pointer shadow-sm"
            aria-label={member ? 'Member pass' : 'Member login'}
          >
            <svg className="w-3 h-3 text-white shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
            <span>Member</span>
          </button>

          {cartCount > 0 && (
            <button
              type="button"
              onClick={() => setIsBagOpen(true)}
              className="glass-capsule px-2.5 py-1 rounded-full flex items-center gap-1 text-[12px] font-grotesk font-semibold text-white cursor-pointer shadow-sm"
              aria-label={`Shopping bag containing ${cartCount} items`}
            >
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <span>({cartCount})</span>
            </button>
          )}
        </div>
      </header>

      {/* Desktop Frosted Glass "View collection" Button on Left (Hidden on mobile) */}
      <div className="hidden md:inline-flex absolute left-[clamp(20px,6vw,120px)] top-[48%] -translate-y-1/2 z-25">
        <button
          onClick={onViewCollection}
          className="glass-capsule glass-capsule-hover group relative inline-flex items-center justify-center px-5 sm:px-6 py-2.5 sm:py-3 rounded-full text-white font-grotesk font-semibold text-[16.5px] sm:text-[17.5px] tracking-tight cursor-pointer transition-all duration-200 outline-none"
          aria-label="View collection — descend to lower showroom"
        >
          <span>View collection</span>
          <svg
            className="w-3.5 h-3.5 ml-2 transition-transform duration-200 group-hover:translate-y-0.5 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Creative Animated Cloud "FLAT 15% OFF" behind Model */}
      <HeroCloudOffer variant="desktop" />

      {/* 2. LAYER: Complete BAD HABIT Brand Asset (Z-Index 5) */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none z-[5] px-4"
        style={{ transform: 'translateY(-3vh)' }}
        aria-hidden="true"
      >
        <div className="w-[86vw] sm:w-[58vw] max-w-[840px] aspect-[1774/887] relative flex items-center justify-center -translate-y-8 md:translate-y-0">
          <img
            src={HERO_LOGO_URL}
            srcSet={getResponsiveSrcSet(HERO_LOGO_URL)}
            sizes="(max-width: 640px) 86vw, (max-width: 1450px) 58vw, 840px"
            width={1000}
            height={500}
            alt="BAD HABIT"
            className="w-full h-full object-contain select-none pointer-events-none"
            loading="eager"
            decoding="async"
            fetchPriority="high"
          />
        </div>
      </div>

      {/* 3. LAYER: Model & Contact Shadows Grounded on White Floor (Z-Index 10) */}
      <div
        className="flex character-wrapper character-wrapper-mobile absolute left-1/2 -translate-x-1/2 bottom-[76px] md:bottom-[4.5vh] h-[calc(100dvh-165px)] md:h-[78dvh] max-h-[540px] md:max-h-[860px] aspect-[375/1116] items-end justify-center pointer-events-none z-10"
      >
        {/* Precision Perspective Contact & Cast Shadow Layer matched directly to model soles */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none z-[1] overflow-visible"
          viewBox="0 0 375 1116"
          preserveAspectRatio="xMidYMid meet"
          aria-hidden="true"
        >
          <defs>
            <radialGradient id="hero-model-contact" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#0a0e17" stopOpacity="0.90" />
              <stop offset="65%" stopColor="#0f172a" stopOpacity="0.56" />
              <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
            </radialGradient>

            <radialGradient id="hero-model-cast" cx="50%" cy="45%" r="50%">
              <stop offset="0%" stopColor="#0f172a" stopOpacity="0.44" />
              <stop offset="55%" stopColor="#1e293b" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#1e293b" stopOpacity="0" />
            </radialGradient>

            <radialGradient id="hero-model-ambient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#1e293b" stopOpacity="0.16" />
              <stop offset="60%" stopColor="#334155" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#334155" stopOpacity="0" />
            </radialGradient>

            <filter id="hero-model-tight-blur" x="-50%" y="-100%" width="200%" height="300%">
              <feGaussianBlur stdDeviation="1.5" />
            </filter>

            <filter id="hero-model-soft-blur" x="-50%" y="-100%" width="200%" height="300%">
              <feGaussianBlur stdDeviation="5.0" />
            </filter>

            <filter id="hero-model-diffuse-blur" x="-50%" y="-100%" width="200%" height="300%">
              <feGaussianBlur stdDeviation="12" />
            </filter>
          </defs>

          {/* Left foreground shoe: sole bottom at y=1110, centered x=114 */}
          <ellipse cx="114" cy="1113" rx="88" ry="14" fill="url(#hero-model-ambient)" filter="url(#hero-model-diffuse-blur)" />
          <ellipse cx="114" cy="1111" rx="74" ry="6.5" fill="url(#hero-model-cast)" filter="url(#hero-model-soft-blur)" />
          <ellipse cx="114" cy="1110" rx="56" ry="2.8" fill="url(#hero-model-contact)" filter="url(#hero-model-tight-blur)" />

          {/* Right angled stance shoe: sole bottom at y=1062, centered x=276 */}
          <ellipse cx="276" cy="1065" rx="76" ry="12" fill="url(#hero-model-ambient)" filter="url(#hero-model-diffuse-blur)" />
          <ellipse cx="276" cy="1063" rx="64" ry="5.5" fill="url(#hero-model-cast)" filter="url(#hero-model-soft-blur)" />
          <ellipse cx="276" cy="1062" rx="50" ry="2.5" fill="url(#hero-model-contact)" filter="url(#hero-model-tight-blur)" />
        </svg>

        {/* Shared Model Cutout Image */}
        <img
          src={HERO_MODEL_URL}
          srcSet={getResponsiveSrcSet(HERO_MODEL_URL)}
          sizes="(max-width: 767px) 220px, 290px"
          width={375}
          height={1116}
          alt="BAD HABIT fashion model"
          className="relative z-[2] w-full h-full object-contain object-bottom select-none pointer-events-none"
          loading="eager"
          decoding="async"
          fetchPriority="high"
        />
      </div>

      {/* Mobile Dedicated Bottom Action Area: "View collection" below model with safe spacing from shoes (Hidden on desktop) */}
      <div className="flex md:hidden absolute bottom-5 left-1/2 -translate-x-1/2 z-25 pointer-events-auto w-full px-6 justify-center">
        <button
          type="button"
          onClick={onViewCollection}
          className="glass-capsule glass-capsule-hover w-full max-w-[252px] py-3 px-5 rounded-full text-white font-grotesk font-semibold text-[16.5px] tracking-tight flex items-center justify-center gap-2 shadow-[0_8px_24px_rgba(4,24,43,0.3)] active:scale-95 cursor-pointer outline-none"
          aria-label="View collection — descend to lower showroom"
        >
          <span>View collection</span>
          <svg
            className="w-3.5 h-3.5 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Desktop Bottom Elevator Descent Prompt (Hidden on mobile) */}
      <div className="hidden md:flex absolute bottom-6 left-1/2 -translate-x-1/2 z-25 flex-col items-center pointer-events-auto">
        <button
          onClick={onViewCollection}
          className="flex flex-col items-center gap-1.5 text-white/60 hover:text-white transition-colors duration-200 outline-none group cursor-pointer"
          aria-label="Scroll down to lower showroom"
        >
          <span className="text-[10px] font-mono tracking-[0.25em] uppercase">
            SCROLL TO DESCEND
          </span>
          <svg
            className="w-4 h-4 animate-bounce text-white/80 group-hover:text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </button>
      </div>
    </section>
  );
}
