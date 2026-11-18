import React from 'react';

interface BrandLogoProps {
  onClick?: () => void;
  compact?: boolean;
  className?: string;
}

/**
 * Persistent top-left BAD HABIT + YOU KNOW YOU WANT IT brand lockup.
 * Clicking always returns the shopper to the home runway page.
 */
export const BrandLogo: React.FC<BrandLogoProps> = ({
  onClick,
  compact = false,
  className = '',
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group text-left flex flex-col items-start select-none cursor-pointer outline-none transition-transform duration-200 hover:opacity-90 active:scale-95 ${className}`}
      aria-label="BAD HABIT — Return to Home Page"
    >
      <span
        className={`font-display font-black uppercase text-white leading-none drop-shadow-[0_2px_10px_rgba(4,24,43,0.38)] ${
          compact
            ? 'text-[17px] sm:text-xl tracking-[0.12em]'
            : 'text-xl sm:text-2xl lg:text-[26px] tracking-[0.12em]'
        }`}
      >
        BAD HABIT
      </span>
      <span
        className={`font-display font-semibold uppercase text-white/85 leading-none drop-shadow-[0_1px_6px_rgba(4,24,43,0.35)] ${
          compact
            ? 'text-[8px] sm:text-[9px] tracking-[0.22em] mt-1'
            : 'text-[9px] sm:text-[10px] tracking-[0.26em] mt-1.5'
        }`}
      >
        YOU KNOW YOU WANT IT
      </span>
    </button>
  );
};
