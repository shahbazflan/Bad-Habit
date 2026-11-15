import React from 'react';
import { Product } from '../data/products';

interface ColorSwatchRailProps {
  currentProduct: Product;
  variants: Product[];
  onSelectVariant: (product: Product) => void;
  className?: string;
}

/**
 * Vertical column of exact-color garment dots placed beside an article.
 * Allows direct one-tap switching between colorways of the same line.
 */
export const ColorSwatchRail: React.FC<ColorSwatchRailProps> = ({
  currentProduct,
  variants,
  onSelectVariant,
  className = '',
}) => {
  if (!variants || variants.length <= 1) return null;

  return (
    <div
      className={`flex flex-col items-center gap-2 p-1.5 rounded-full bg-slate-950/25 border border-white/25 backdrop-blur-md shadow-[0_6px_20px_rgba(4,24,43,0.22)] ${className}`}
      role="group"
      aria-label="Available colorways"
    >
      {variants.map((variant) => {
        const isActive = variant.id === currentProduct.id;
        return (
          <button
            key={variant.id}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (!isActive) onSelectVariant(variant);
            }}
            title={variant.soldOut ? `${variant.color} — SOLD OUT` : variant.color}
            aria-label={
              variant.soldOut
                ? `View ${variant.name} (${variant.color}, Sold Out)`
                : `Switch to ${variant.name} (${variant.color})`
            }
            aria-pressed={isActive}
            className={`group relative w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all duration-150 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-white active:scale-95 ${
              isActive ? 'scale-105' : 'hover:scale-110'
            }`}
          >
            <span
              className={`relative block w-5 h-5 sm:w-[22px] sm:h-[22px] rounded-full transition-all shadow-inner overflow-hidden ${
                isActive
                  ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900/40 border border-white/80'
                  : 'border border-white/60 opacity-90 group-hover:opacity-100'
              }`}
              style={{ backgroundColor: variant.colorHex }}
            >
              {variant.soldOut && (
                <span
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  aria-hidden="true"
                >
                  <span className="w-[1.5px] h-6 bg-white/90 rotate-45 shadow-[0_0_2px_rgba(0,0,0,0.8)]" />
                </span>
              )}
            </span>

            {/* Desktop hover color label */}
            <span className="hidden md:block pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute right-full mr-2.5 px-2.5 py-1 rounded-full bg-slate-950/85 border border-white/20 text-[11px] font-sans font-medium text-white whitespace-nowrap shadow-md">
              {variant.color}
              {variant.soldOut ? ' · SOLD OUT' : ''}
            </span>
          </button>
        );
      })}
    </div>
  );
};
