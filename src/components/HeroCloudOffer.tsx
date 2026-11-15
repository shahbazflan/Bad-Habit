import React from 'react';

interface HeroCloudOfferProps {
  variant?: 'mobile' | 'desktop';
}

const STRIP_ITEMS = [0, 1, 2, 3, 4, 5];

/**
 * Continuous scrolling "FLAT 15% OFF" runway strip behind the hero model (z-[4]).
 * Rendered inside a high-contrast dark slate architectural ribbon so the white
 * headline remains razor-sharp and legible against bright sky/clouds.
 */
export const HeroCloudOffer: React.FC<HeroCloudOfferProps> = ({
  variant = 'desktop',
}) => {
  const isMobile = variant === 'mobile';

  const renderTrack = (keyPrefix: string) => (
    <div className="flex items-center shrink-0">
      {STRIP_ITEMS.map((item) => (
        <div
          key={`${keyPrefix}-${item}`}
          className="flex items-center shrink-0"
        >
          <span
            className={`font-condensed font-extrabold uppercase text-white tracking-[0.12em] whitespace-nowrap drop-shadow-[0_1px_4px_rgba(3,12,24,0.45)] ${
              isMobile ? 'text-lg sm:text-xl' : 'text-xl md:text-2xl lg:text-[26px]'
            }`}
          >
            FLAT 15% OFF
          </span>
          <span
            className={`text-sky-200/75 font-light select-none ${
              isMobile ? 'mx-5 text-sm' : 'mx-8 text-base'
            }`}
            aria-hidden="true"
          >
            —
          </span>
        </div>
      ))}
    </div>
  );

  return (
    <div
      className={`pointer-events-none select-none absolute inset-x-0 z-[4] overflow-hidden ${
        isMobile ? 'top-[13.5%] sm:top-[14.5%]' : 'top-[13.5vh] md:top-[12.5vh]'
      }`}
      aria-hidden="true"
    >
      <div className="w-full bg-[#092138]/72 border-y border-white/25 backdrop-blur-[3px] py-2 sm:py-2.5 shadow-[0_8px_24px_rgba(4,20,38,0.2)] overflow-hidden">
        <div className="hero-strip-track">
          {renderTrack('a')}
          {renderTrack('b')}
        </div>
      </div>
    </div>
  );
};
