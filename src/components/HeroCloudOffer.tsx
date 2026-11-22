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
            className={`font-ribbon uppercase text-white tracking-[0.14em] whitespace-nowrap leading-none drop-shadow-[0_1px_5px_rgba(3,12,24,0.52)] ${
              isMobile ? 'text-[21px] sm:text-[23px]' : 'text-[23px] md:text-[26px] lg:text-[30px]'
            }`}
          >
            FLAT 15% OFF
          </span>
          <span
            className={`text-white/65 font-light select-none ${
              isMobile ? 'mx-6 text-base' : 'mx-9 text-lg'
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
      <div className="hero-silky-ribbon bg-[#071e38] w-full py-2 sm:py-2.5 overflow-hidden">
        <div className="hero-strip-track relative z-[1]">
          {renderTrack('a')}
          {renderTrack('b')}
        </div>
      </div>
    </div>
  );
};
