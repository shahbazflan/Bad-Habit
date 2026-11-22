import React from 'react';
import { MobileHeader } from './MobileHeader';
import { HeroCloudOffer } from './HeroCloudOffer';
import { CleanPlatePicture } from './CleanPlatePicture';
import { HERO_LOGO_URL, HERO_MODEL_URL, getResponsiveSrcSet } from '../data/products';

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
      className="relative w-full h-[100svh] min-h-[580px] overflow-hidden select-none flex flex-col justify-end"
      aria-label="BAD HABIT Mobile Runway Hero"
    >
      {/* 1. LAYER: Authentic Keyblue Architectural Runway Background (matching Desktop) */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <CleanPlatePicture
          alt="BAD HABIT architectural runway"
          className="w-full h-full object-cover object-center pointer-events-none"
          sizes="100vw"
          loading="eager"
          decoding="async"
          fetchPriority="high"
        />
      </div>

      {/* Subtle Keyblue ambient gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#244b70]/18 via-transparent to-[#0e273f]/20 pointer-events-none z-[1]" />

      {/* 2. LAYER: Top Header pinned strictly at top-0 (Menu, Logo, Member, Wishlist, Bag) */}
      <div className="absolute top-0 left-0 right-0 z-30 w-full">
        <MobileHeader
          onOpenMenu={onOpenMenu}
          onOpenBag={onOpenBag}
          onGoHome={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          cartCount={cartCount}
          transparent={true}
          showBrandLogo={false}
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
            src={HERO_LOGO_URL}
            srcSet={getResponsiveSrcSet(HERO_LOGO_URL)}
            sizes="(max-width: 480px) 88vw, 420px"
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
          src={HERO_MODEL_URL}
          srcSet={getResponsiveSrcSet(HERO_MODEL_URL)}
          sizes="(max-width: 480px) 210px, 240px"
          width={375}
          height={1116}
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
          className="glass-capsule glass-capsule-hover w-full sm:max-w-[288px] py-3 px-5 rounded-[0.25rem] text-white font-grotesk font-semibold text-[15px] sm:text-[16.5px] tracking-tight flex items-center justify-center gap-2 shadow-[0_8px_24px_rgba(4,24,43,0.3)] active:scale-[0.98] transition-all cursor-pointer outline-none"
          aria-label="Explore collection — scroll to categories"
        >
          <span>Explore collection</span>
          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </button>
      </div>
    </section>
  );
};
