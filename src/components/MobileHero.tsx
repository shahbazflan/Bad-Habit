import React from 'react';
import { MobileHeader } from './MobileHeader';
import { HeroCloudOffer } from './HeroCloudOffer';
import { HERO_LOGO_URL, HERO_MODEL_URL } from '../data/products';

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
 * - 100svh mobile viewport fill over MobileExperience's shared sky runway plate
 * - Center model grounded on white floor with subtle perspective shadow
 * - Top header with BAD HABIT branding, bag indicator, and navigation
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
      {/* Subtle Keyblue ambient gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#244b70]/14 via-transparent to-[#0e273f]/16 pointer-events-none z-[1]" />

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
          <picture className="w-full h-full block">
            <source media="(max-width: 767px)" srcSet="/bad_habit_transparent_sm.webp?v=opt26" type="image/webp" />
            <img
              src={HERO_LOGO_URL}
              width={560}
              height={280}
              alt="BAD HABIT"
              className="w-full h-full object-contain select-none pointer-events-none"
              loading="eager"
              decoding="async"
              fetchPriority="high"
            />
          </picture>
        </div>
      </div>

      {/* 3. LAYER: Model & Grounded Contact Shadows on White Architectural Floor */}
      <div
        className="absolute left-1/2 -translate-x-1/2 bottom-[78px] sm:bottom-[86px] h-[calc(100svh-164px)] max-h-[560px] aspect-[522/1047] flex items-end justify-center pointer-events-none z-10"
      >
        {/* Precision Contact Shadow Locked Directly Under Both Shoe Soles */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none z-[1] overflow-visible"
          viewBox="0 0 522 1047"
          preserveAspectRatio="xMidYMid meet"
          aria-hidden="true"
        >
          <defs>
            <radialGradient id="hero-keyblue-left-cast" cx="50%" cy="45%" r="50%">
              <stop offset="0%" stopColor="#071b2c" stopOpacity="0.46" />
              <stop offset="50%" stopColor="#082236" stopOpacity="0.18" />
              <stop offset="82%" stopColor="#082236" stopOpacity="0.04" />
              <stop offset="100%" stopColor="#082236" stopOpacity="0" />
            </radialGradient>

            <radialGradient id="hero-keyblue-left-contact" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#03101c" stopOpacity="0.92" />
              <stop offset="48%" stopColor="#03101c" stopOpacity="0.60" />
              <stop offset="80%" stopColor="#03101c" stopOpacity="0.16" />
              <stop offset="100%" stopColor="#03101c" stopOpacity="0" />
            </radialGradient>

            <radialGradient id="hero-keyblue-right-cast" cx="50%" cy="45%" r="50%">
              <stop offset="0%" stopColor="#071b2c" stopOpacity="0.44" />
              <stop offset="50%" stopColor="#082236" stopOpacity="0.16" />
              <stop offset="82%" stopColor="#082236" stopOpacity="0.04" />
              <stop offset="100%" stopColor="#082236" stopOpacity="0" />
            </radialGradient>

            <radialGradient id="hero-keyblue-right-contact" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#03101c" stopOpacity="0.90" />
              <stop offset="48%" stopColor="#03101c" stopOpacity="0.58" />
              <stop offset="80%" stopColor="#03101c" stopOpacity="0.16" />
              <stop offset="100%" stopColor="#03101c" stopOpacity="0" />
            </radialGradient>

            <radialGradient id="hero-keyblue-bridge" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#082033" stopOpacity="0.16" />
              <stop offset="55%" stopColor="#082033" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#082033" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Stance ambient floor falloff */}
          <ellipse cx="262" cy="1002" rx="196" ry="26" fill="url(#hero-keyblue-bridge)" />

          {/* Left rear shoe: sole bottom sits at y=952, centered x=106 */}
          <ellipse cx="106" cy="954" rx="114" ry="16" fill="url(#hero-keyblue-left-cast)" />
          <ellipse cx="106" cy="952" rx="96" ry="6.5" fill="url(#hero-keyblue-left-cast)" />
          <ellipse cx="106" cy="952" rx="84" ry="4" fill="url(#hero-keyblue-left-contact)" />

          {/* Right foreground shoe: sole bottom sits at y=1046, centered x=418 */}
          <ellipse cx="418" cy="1048" rx="118" ry="17" fill="url(#hero-keyblue-right-cast)" />
          <ellipse cx="418" cy="1046" rx="98" ry="7" fill="url(#hero-keyblue-right-cast)" />
          <ellipse cx="418" cy="1046" rx="86" ry="4.2" fill="url(#hero-keyblue-right-contact)" />
        </svg>

        {/* Model Cutout Image (Foreground Hero) */}
        <img
          src={HERO_MODEL_URL}
          width={522}
          height={1047}
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
