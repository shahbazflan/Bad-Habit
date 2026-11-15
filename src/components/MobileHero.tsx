import React from 'react';
import { MobileHeader } from './MobileHeader';
import { HeroCloudOffer } from './HeroCloudOffer';

interface MobileHeroProps {
  onExplore: () => void;
  onOpenMenu: () => void;
  onOpenBag: () => void;
  cartCount: number;
}

/**
 * MobileHero (Screen 1)
 * 
 * Full-screen opening mobile hero matching desktop's keyblue theme:
 * - 100svh mobile viewport fill
 * - Website's authentic architectural sky runway background (/clean_plate.jpg)
 * - Sky blue / keyblue ambient environment with natural clouds and architectural walls
 * - Pure white reflective floor
 * - Center model grounded on white floor with subtle perspective shadow
 * - Top header with BAD HABIT branding, bag indicator, and navigation
 * - Bottom-left text composition: "YOU KNOW YOU WANT IT"
 * - Frosted glass "Explore collection ->" button
 */
export const MobileHero: React.FC<MobileHeroProps> = ({
  onExplore,
  onOpenMenu,
  onOpenBag,
  cartCount,
}) => {
  return (
    <section
      className="relative w-full h-[100svh] min-h-[580px] overflow-hidden select-none flex flex-col justify-between"
      aria-label="BAD HABIT Mobile Runway Hero"
    >
      {/* 1. LAYER: Authentic Keyblue Architectural Runway Background (matching Desktop) */}
      <img
        src="/clean_plate.jpg"
        alt="BAD HABIT architectural runway"
        className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none z-0"
        loading="eager"
        decoding="async"
        fetchPriority="high"
      />

      {/* Subtle Keyblue ambient gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#244b70]/18 via-transparent to-[#0e273f]/20 pointer-events-none z-[1]" />

      {/* 2. LAYER: Header (Menu, Bag) */}
      <div className="relative z-30 w-full">
        <MobileHeader
          onOpenMenu={onOpenMenu}
          onOpenBag={onOpenBag}
          onGoHome={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          cartCount={cartCount}
          transparent={true}
        />
      </div>

      {/* Creative Animated Cloud "FLAT 15% OFF" behind Model */}
      <HeroCloudOffer variant="mobile" />

      {/* Center Brand Graphic (positioned behind model like desktop) */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none z-[5] px-4"
        style={{ transform: 'translateY(-4vh)' }}
        aria-hidden="true"
      >
        <div className="w-[88vw] max-w-[420px] aspect-[1774/887] relative flex items-center justify-center opacity-85">
          <img
            src="/bad_habit_transparent.webp"
            alt="BAD HABIT"
            className="w-full h-full object-contain select-none pointer-events-none"
            loading="eager"
            decoding="async"
          />
        </div>
      </div>

      {/* 3. LAYER: Model & Grounded Contact Shadows on White Architectural Floor */}
      <div
        className="absolute left-1/2 -translate-x-1/2 bottom-[78px] sm:bottom-[86px] h-[calc(100svh-164px)] max-h-[560px] aspect-[375/1116] flex items-end justify-center pointer-events-none z-10"
      >
        {/* Precision Contact Shadow Locked Directly Under Both Shoe Soles */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none z-[1] overflow-visible"
          viewBox="0 0 375 1116"
          preserveAspectRatio="xMidYMid meet"
          aria-hidden="true"
        >
          <defs>
            <radialGradient id="hero-keyblue-left-cast" cx="50%" cy="45%" r="50%">
              <stop offset="0%" stopColor="#071b2c" stopOpacity="0.46" />
              <stop offset="60%" stopColor="#082236" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#082236" stopOpacity="0" />
            </radialGradient>

            <radialGradient id="hero-keyblue-left-contact" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#03101c" stopOpacity="0.92" />
              <stop offset="65%" stopColor="#03101c" stopOpacity="0.60" />
              <stop offset="100%" stopColor="#03101c" stopOpacity="0" />
            </radialGradient>

            <radialGradient id="hero-keyblue-right-cast" cx="50%" cy="45%" r="50%">
              <stop offset="0%" stopColor="#071b2c" stopOpacity="0.44" />
              <stop offset="60%" stopColor="#082236" stopOpacity="0.16" />
              <stop offset="100%" stopColor="#082236" stopOpacity="0" />
            </radialGradient>

            <radialGradient id="hero-keyblue-right-contact" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#03101c" stopOpacity="0.90" />
              <stop offset="60%" stopColor="#03101c" stopOpacity="0.58" />
              <stop offset="100%" stopColor="#03101c" stopOpacity="0" />
            </radialGradient>

            <radialGradient id="hero-keyblue-bridge" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#082033" stopOpacity="0.16" />
              <stop offset="60%" stopColor="#082033" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#082033" stopOpacity="0" />
            </radialGradient>

            <filter id="hero-keyblue-blur-tight" x="-50%" y="-100%" width="200%" height="300%">
              <feGaussianBlur stdDeviation="1.6" />
            </filter>

            <filter id="hero-keyblue-blur-soft" x="-50%" y="-100%" width="200%" height="300%">
              <feGaussianBlur stdDeviation="5.5" />
            </filter>

            <filter id="hero-keyblue-blur-diffuse" x="-50%" y="-100%" width="200%" height="300%">
              <feGaussianBlur stdDeviation="12" />
            </filter>
          </defs>

          {/* Stance ambient floor falloff */}
          <ellipse cx="195" cy="1088" rx="125" ry="20" fill="url(#hero-keyblue-bridge)" filter="url(#hero-keyblue-blur-diffuse)" />

          {/* Left foreground shoe: sole bottom sits at y=1110, centered x=114 */}
          <ellipse cx="114" cy="1112" rx="84" ry="12" fill="url(#hero-keyblue-left-cast)" filter="url(#hero-keyblue-blur-soft)" />
          <ellipse cx="114" cy="1110" rx="68" ry="4.5" fill="url(#hero-keyblue-left-cast)" filter="url(#hero-keyblue-blur-tight)" />
          <ellipse cx="114" cy="1110" rx="54" ry="2.6" fill="url(#hero-keyblue-left-contact)" filter="url(#hero-keyblue-blur-tight)" />

          {/* Right angled stance shoe: sole bottom sits at y=1062, centered x=276 */}
          <ellipse cx="276" cy="1064" rx="80" ry="11" fill="url(#hero-keyblue-right-cast)" filter="url(#hero-keyblue-blur-soft)" />
          <ellipse cx="276" cy="1062" rx="64" ry="4.2" fill="url(#hero-keyblue-right-cast)" filter="url(#hero-keyblue-blur-tight)" />
          <ellipse cx="276" cy="1062" rx="50" ry="2.4" fill="url(#hero-keyblue-right-contact)" filter="url(#hero-keyblue-blur-tight)" />
        </svg>

        {/* Model Cutout Image (Foreground Hero) */}
        <img
          src="/assets/aistudio/hero_mobile_model_cutout.webp"
          alt="BAD HABIT Model"
          className="relative z-[2] w-full h-full object-contain object-bottom select-none pointer-events-none"
          loading="eager"
          decoding="async"
          fetchPriority="high"
        />
      </div>

      {/* 4. LAYER: Bottom Frosted Glass Explore Button (Clean spacing below grounded feet) */}
      <div className="relative z-20 w-full px-5 pb-5 pt-2 flex flex-col items-center pointer-events-auto">
        <button
          type="button"
          onClick={onExplore}
          className="w-full sm:max-w-xs py-3.5 px-6 rounded-full bg-white/[0.18] hover:bg-white/[0.28] active:scale-[0.98] border border-white/50 backdrop-blur-md text-white font-medium text-sm sm:text-base tracking-tight flex items-center justify-center gap-2.5 shadow-[0_8px_24px_rgba(4,24,43,0.3)] transition-all cursor-pointer outline-none"
          aria-label="Explore collection — scroll to categories"
        >
          <span>Explore collection</span>
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </button>
      </div>
    </section>
  );
};
