import React from 'react';
import { MAIN_COLLECTION, HOODIE_PRODUCTS, SHIRT_PRODUCTS } from '../data/products';

export type CategoryId = 'trousers' | 'hoodies' | 'shirts' | 'pair';

interface MobileCategorySectionProps {
  onSelectCategory: (categoryId: CategoryId) => void;
  onPrefetchCategory?: (categoryId: CategoryId) => void;
}

export interface CategoryItem {
  id: CategoryId;
  name: string;
  image: string;
  alt: string;
  count?: string;
  subtitle?: string;
  badgeText?: string;
}

export const CATEGORY_ITEMS: CategoryItem[] = [
  {
    id: 'pair',
    name: 'MAKE A PAIR',
    image: '/clean_plate.jpg',
    alt: 'Make a pair — Top and Trousers Set',
    count: 'Build Pair',
    subtitle: 'Pair any Shirt or Hoodie + Trousers',
    badgeText: '15% OFF',
  },
  {
    id: 'trousers',
    name: 'TROUSERS',
    image: '/assets/categories/category_trousers_hd.webp',
    alt: 'BAD HABIT Trousers Collection',
    count: `${MAIN_COLLECTION.length} Articles`,
  },
  {
    id: 'shirts',
    name: 'SHIRTS',
    image: '/assets/categories/category_shirts_v3.webp',
    alt: 'BAD HABIT Shirts Category',
    count: `${SHIRT_PRODUCTS.length} Articles`,
  },
  {
    id: 'hoodies',
    name: 'HOODIES & SWEATSHIRTS',
    image: '/assets/categories/category_hoodies_desktop.webp',
    alt: 'BAD HABIT Hoodies & Sweatshirts Category',
    count: `${HOODIE_PRODUCTS.length} Articles`,
  },
];

const POSTER_SHIRT = SHIRT_PRODUCTS.find((p) => p.id === 'BH-S05') || SHIRT_PRODUCTS[5];
const POSTER_TROUSER = MAIN_COLLECTION.find((p) => p.id === 'BH-T10') || MAIN_COLLECTION[4];

/**
 * MobileCategorySection (Screen 2)
 * 
 * Category section matching the keyblue sky theme:
 * - Serene sky blue atmosphere
 * - "Shop by category" crisp heading
 * - Stacked horizontal landscape tiles with unified /clean_plate.jpg background
 */
export const MobileCategorySection: React.FC<MobileCategorySectionProps> = ({
  onSelectCategory,
  onPrefetchCategory,
}) => {
  return (
    <section
      id="shop-categories"
      className="w-full px-4 pt-3 pb-8 sm:px-5 sm:pt-4 sm:pb-10 select-none flex flex-col justify-center min-h-[calc(100svh-56px)]"
      aria-label="Shop by category"
    >
      {/* "Shop by category" Section Heading */}
      <div className="mb-3 px-0.5 flex items-center justify-between">
        <h2 className="font-display text-[22px] sm:text-2xl font-bold tracking-tight text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.25)]">
          Shop by category
        </h2>
        <span className="text-[11px] font-mono text-cyan-200/80 uppercase tracking-widest">
          SS26 Collection
        </span>
      </div>

      {/* Stacked Horizontal Tiles */}
      <div className="w-full flex flex-col gap-2.5 sm:gap-3">
        {CATEGORY_ITEMS.map((cat) => {
          const isPair = cat.id === 'pair';
          const isTrousers = cat.id === 'trousers';
          const isShirts = cat.id === 'shirts';
          const isHoodies = cat.id === 'hoodies';

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(cat.id)}
              onPointerEnter={() => onPrefetchCategory?.(cat.id)}
              onTouchStart={() => onPrefetchCategory?.(cat.id)}
              onFocus={() => onPrefetchCategory?.(cat.id)}
              className={`group relative w-full aspect-[16/9] max-h-[148px] rounded-2xl overflow-hidden cursor-pointer outline-none transition-[transform,box-shadow] duration-200 active:scale-[0.98] shadow-[0_8px_24px_rgba(7,27,45,0.25)] hover:shadow-[0_12px_32px_rgba(7,27,45,0.35)] ${
                isPair ? 'border-2 border-cyan-200/60' : 'border border-white/25'
              }`}
              aria-label={`Shop ${cat.name}${cat.badgeText ? ` — ${cat.badgeText}` : ''}`}
            >
              {/* Unified Architectural Sky-Blue Runway Background across all category tiles */}
              <img
                src="/clean_plate.jpg"
                alt=""
                aria-hidden="true"
                className="w-full h-full object-cover object-center select-none pointer-events-none transition-transform duration-300 group-hover:scale-105"
                loading="eager"
                decoding="async"
              />

              {/* Trousers Model Cutout: Full vertical framing on open runway floor so both black shoes are completely visible */}
              {isTrousers && (
                <div className="absolute inset-0 flex items-end justify-center pl-10 pr-24 pb-1 pointer-events-none">
                  <img
                    src={cat.image}
                    alt={cat.alt}
                    className="h-[97%] w-auto object-contain object-bottom select-none transition-transform duration-300 group-hover:scale-105 origin-bottom"
                    loading="eager"
                    decoding="async"
                  />
                </div>
              )}

              {/* Shirts Model Cutout: Centered cleanly inside sky portal */}
              {isShirts && (
                <div className="absolute inset-0 flex items-end justify-center pointer-events-none">
                  <img
                    src={cat.image}
                    alt={cat.alt}
                    className="h-[96%] w-auto object-contain object-bottom select-none transition-transform duration-300 group-hover:scale-105 origin-bottom"
                    loading="eager"
                    decoding="async"
                  />
                </div>
              )}

              {/* Hoodies Model Cutout: Centered cleanly inside sky portal */}
              {isHoodies && (
                <div className="absolute inset-0 flex items-end justify-center pl-16 sm:pl-20 pointer-events-none">
                  <img
                    src={cat.image}
                    alt={cat.alt}
                    className="h-[96%] w-auto object-contain object-bottom select-none transition-transform duration-300 group-hover:scale-105 origin-bottom"
                    loading="eager"
                    decoding="async"
                  />
                </div>
              )}

              {/* Magnum BOXY Shirt + Classic Brown Trousers Preview inside the Make a Pair Tile */}
              {isPair && (
                <div className="absolute inset-0 flex items-center justify-end pr-2 sm:pr-5 -space-x-2 pointer-events-none">
                  <img
                    src={POSTER_SHIRT.image}
                    alt={POSTER_SHIRT.name}
                    className="h-[74%] sm:h-[80%] w-auto object-contain transition-transform duration-300 group-hover:scale-105"
                    loading="eager"
                    decoding="async"
                  />
                  <img
                    src={POSTER_TROUSER.image}
                    alt={POSTER_TROUSER.name}
                    className="h-[80%] sm:h-[86%] w-auto object-contain transition-transform duration-300 group-hover:scale-105"
                    loading="eager"
                    decoding="async"
                  />
                </div>
              )}

              {/* Clean Editorial 15% OFF Lockup extending down close to MAKE A PAIR (No Box / No Pill) */}
              {isPair && (
                <div className="absolute top-3 left-3 sm:left-4 z-20 pointer-events-none">
                  <div className="font-poster-condensed not-italic text-white inline-flex items-end gap-1 leading-none whitespace-nowrap">
                    <span className="font-extrabold text-[clamp(86px,25vw,112px)] leading-[0.78] tracking-[-0.02em] tabular-nums">
                      15%
                    </span>
                    <div className="flex flex-col items-stretch leading-none">
                      <span className="w-full h-[1.5px] bg-white mb-[3px]" aria-hidden="true" />
                      <span className="font-extrabold text-[clamp(34px,10vw,44px)] leading-[0.80] tracking-[0.02em] uppercase">
                        OFF
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Gentle gradient overlay for high legibility */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-black/20 to-transparent pointer-events-none" />

              {/* Category Title & Badge Bar */}
              <div className="absolute inset-x-0 bottom-0 p-3 sm:p-3.5 flex items-end justify-between pointer-events-none">
                <div className="text-left">
                  <h3 className="font-display text-base sm:text-lg font-black tracking-wider text-white uppercase drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
                    {cat.name}
                  </h3>
                  {cat.subtitle && (
                    <p className="text-[10px] sm:text-[11px] font-mono text-white/85 line-clamp-1 drop-shadow-sm">
                      {cat.subtitle}
                    </p>
                  )}
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/40 shadow-sm text-white text-[11px] font-mono font-medium shrink-0">
                  <span>{cat.count}</span>
                  <svg className="w-3 h-3 text-white transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </div>
              </div>

              {/* Frosted glass hover sheen */}
              <div
                className="absolute inset-0 bg-white/0 group-hover:bg-white/[0.08] active:bg-white/[0.12] transition-colors pointer-events-none rounded-2xl"
                aria-hidden="true"
              />
            </button>
          );
        })}
      </div>
    </section>
  );
};
