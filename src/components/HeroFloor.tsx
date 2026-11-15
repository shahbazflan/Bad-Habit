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
import { HeroCloudOffer } from './HeroCloudOffer';

interface HeroFloorProps {
  onViewCollection: () => void;
  activeFloor?: 'hero' | 'showroom';
  onNavigateToFloor?: (floor: 'hero' | 'showroom') => void;
}

export function HeroFloor({ onViewCollection, activeFloor = 'hero', onNavigateToFloor }: HeroFloorProps) {
  const { cartCount, setIsBagOpen } = useCart();
  return (
    <section
      className="relative w-full h-[100vh] h-[100dvh] overflow-hidden select-none border-b-2 border-white/90 bg-[#1f486d]"
      aria-label="BAD HABIT Hero Runway"
    >
      {/* 1. LAYER: Architecture & Sky at the back (Z-Index 1) */}
      <img
        src="/clean_plate.jpg"
        alt="Architectural space with sky and white floor"
        className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none z-[1]"
        loading="eager"
        decoding="async"
        fetchPriority="high"
      />

      {/* Header Bar (Z-Index 30) */}
      <header className="absolute top-0 left-0 w-full z-30 flex items-start justify-between px-5 sm:px-12 pt-[calc(20px+env(safe-area-inset-top))] sm:pt-[calc(40px+env(safe-area-inset-top))] pointer-events-none">
        {/* Left: Spacer (BAD HABIT removed as requested) */}
        <div className="pointer-events-auto select-none" />

        {/* Desktop Controls (Level Indicator & Bag button) with Tagline below */}
        <div className="hidden md:flex pointer-events-auto flex-col items-end gap-1.5">
          <div className="flex items-center gap-3">
            {cartCount > 0 && (
              <button
                type="button"
                onClick={() => setIsBagOpen(true)}
                className="glass-capsule px-3.5 py-1.5 rounded-full flex items-center gap-2 text-xs font-mono text-cyan-300 border border-cyan-400/30 cursor-pointer hover:bg-white/20 transition-all shadow-sm"
                aria-label={`Shopping bag containing ${cartCount} items`}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <span>BAG ({cartCount})</span>
              </button>
            )}

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-mono tracking-widest text-white/90 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>LEVEL 02</span>
              <span className="text-white/40">·</span>
              <span className="text-white/70">RUNWAY</span>
            </div>
          </div>
        </div>

        {/* Mobile Controls (Bag button & Floor Control L1 / L2) */}
        <div className="flex md:hidden items-center gap-2">
          {cartCount > 0 && (
            <button
              type="button"
              onClick={() => setIsBagOpen(true)}
              className="glass-capsule px-2.5 py-1 rounded-full flex items-center gap-1.5 text-[11px] font-mono text-cyan-300 border border-cyan-400/30 cursor-pointer shadow-sm"
              aria-label={`Shopping bag containing ${cartCount} items`}
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <span>({cartCount})</span>
            </button>
          )}

          <div className="flex items-center p-0.5 rounded-full bg-black/25 backdrop-blur-md border border-white/25 text-xs font-mono shadow-md">
            <button
              type="button"
              onClick={() => onNavigateToFloor?.('hero')}
              className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                activeFloor === 'hero'
                  ? 'bg-white text-black font-bold shadow-sm'
                  : 'text-white/70 hover:text-white'
              }`}
              aria-label="Level 1: Runway"
            >
              L1
            </button>
            <button
              type="button"
              onClick={() => onNavigateToFloor?.('showroom')}
              className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                activeFloor === 'showroom'
                  ? 'bg-white text-black font-bold shadow-sm'
                  : 'text-white/70 hover:text-white'
              }`}
              aria-label="Level 2: Showroom"
            >
              L2
            </button>
          </div>
        </div>
      </header>

      {/* Desktop Frosted Glass "View collection" Button on Left (Hidden on mobile) */}
      <div className="hidden md:inline-flex absolute left-[clamp(20px,6vw,120px)] top-[48%] -translate-y-1/2 z-25">
        <button
          onClick={onViewCollection}
          className="glass-capsule glass-capsule-hover group relative inline-flex items-center justify-center px-6 sm:px-7 py-3 sm:py-3.5 rounded-full text-white font-medium text-base sm:text-[17px] tracking-tight cursor-pointer transition-all duration-200 outline-none"
          aria-label="View collection — descend to lower showroom"
        >
          <span>View collection</span>
          <svg
            className="w-4 h-4 ml-2.5 transition-transform duration-200 group-hover:translate-y-0.5 text-white/90"
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
            src="/bad_habit_transparent.webp"
            alt="BAD HABIT"
            className="w-full h-full object-contain select-none pointer-events-none"
            loading="eager"
            decoding="async"
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
          src="/assets/aistudio/hero_mobile_model_cutout.webp"
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
          className="glass-capsule glass-capsule-hover w-full max-w-[280px] py-3.5 px-6 rounded-full text-white font-medium text-base tracking-tight flex items-center justify-center gap-2.5 shadow-[0_8px_24px_rgba(4,24,43,0.3)] active:scale-95 cursor-pointer outline-none"
          aria-label="View collection — descend to lower showroom"
        >
          <span>View collection</span>
          <svg
            className="w-4 h-4 text-white/90"
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
