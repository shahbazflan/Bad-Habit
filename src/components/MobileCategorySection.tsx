import React from 'react';
import { MAIN_COLLECTION, HOODIE_PRODUCTS, SHIRT_PRODUCTS, HERO_PLATE_URL, withAssetVersion } from '../data/products';
import { CleanPlatePicture } from './CleanPlatePicture';
import { SmartImage } from './SmartImage';

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
    image: HERO_PLATE_URL,
    alt: 'Make a pair — Top and Trousers Set',
    count: 'Build Pair',
    subtitle: 'Pair any Shirt or Hoodie + Trousers',
    badgeText: '15% OFF',
  },
  {
    id: 'trousers',
    name: 'TROUSERS',
    image: withAssetVersion('/assets/categories/category_trousers_hd.webp'),
    alt: 'BAD HABIT Trousers Collection',
    count: `${MAIN_COLLECTION.length} Articles`,
  },
  {
    id: 'shirts',
    name: 'SHIRTS',
    image: withAssetVersion('/assets/categories/category_shirts_v3.webp'),
    alt: 'BAD HABIT Shirts Category',
    count: `${SHIRT_PRODUCTS.length} Articles`,
  },
  {
    id: 'hoodies',
    name: 'HOODIES & SWEATSHIRTS',
    image: withAssetVersion('/assets/categories/category_hoodies_v4.webp'),
    alt: 'BAD HABIT Hoodies & Sweatshirts Category',
    count: `${HOODIE_PRODUCTS.length} Articles`,
  },
];

const POSTER_SHIRT = SHIRT_PRODUCTS.find((p) => p.id === 'BH-S05') || SHIRT_PRODUCTS[5];
const POSTER_TROUSER = MAIN_COLLECTION.find((p) => p.id === 'BH-T10') || MAIN_COLLECTION[4];

interface MobilePortraitCardConfig {
  id: Exclude<CategoryId, 'pair'>;
  label: string;
  image: string;
  alt: string;
  count: string;
  imageWrapperClass: string;
  innerWrapperClass?: string;
  imageOriginClass?: string;
  imageClass: string;
}

const MOBILE_PORTRAIT_CATEGORIES: MobilePortraitCardConfig[] = [
  {
    id: 'shirts',
    label: 'SHIRTS',
    image: withAssetVersion('/assets/categories/category_shirts_v3.webp'),
    alt: 'BAD HABIT Shirts Category',
    count: `${SHIRT_PRODUCTS.length} Articles`,
    imageWrapperClass: 'inset-x-0 top-1.5 bottom-0',
    imageClass: 'w-full h-full object-cover object-[50%_10%]',
  },
  {
    id: 'trousers',
    label: 'TROUSERS',
    image: withAssetVersion('/assets/categories/category_trousers_hd.webp'),
    alt: 'BAD HABIT Trousers Collection',
    count: `${MAIN_COLLECTION.length} Articles`,
    imageWrapperClass: 'inset-x-0 top-0 bottom-[52px]',
    imageClass: 'w-full h-full object-cover object-[66%_top]',
  },
  {
    id: 'hoodies',
    label: 'HOODIES',
    image: withAssetVersion('/assets/categories/category_hoodies_v4.webp'),
    alt: 'BAD HABIT Hoodies & Sweatshirts Category',
    count: `${HOODIE_PRODUCTS.length} Articles`,
    imageWrapperClass: 'inset-x-0 top-1.5 bottom-0',
    imageClass: 'w-full h-full object-cover object-[52%_top]',
  },
];

/**
 * MobileCategorySection (Screen 2)
 *
 * Mobile-only category layout:
 * - Top header row ("Shop by category" + stacked "SS26 / COLLECTION")
 * - Full-width featured Make a Pair (15% OFF) banner card
 * - 3-column portrait grid below (SHIRTS, TROUSERS, HOODIES)
 * - Strictly preserves the keyblue architectural sky theme & translucent glass surfaces
 */
export const MobileCategorySection: React.FC<MobileCategorySectionProps> = ({
  onSelectCategory,
  onPrefetchCategory,
}) => {
  const pairCategory = CATEGORY_ITEMS[0];

  return (
    <section
      id="shop-categories"
      className="w-full px-3.5 pt-3 pb-7 sm:px-5 sm:pt-4 sm:pb-10 select-none flex flex-col justify-center min-h-[calc(100svh-56px)]"
      aria-label="Shop by category"
    >
      {/* "Shop by category" Section Heading */}
      <div className="mb-3 px-0.5 flex items-center justify-between gap-2">
        <h2 className="font-display text-[22px] sm:text-2xl font-bold tracking-tight text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.25)]">
          Shop by category
        </h2>
        <span className="text-right text-[10px] sm:text-[11px] font-mono text-cyan-200/85 uppercase tracking-[0.18em] leading-[1.25]">
          SS26
          <br />
          Collection
        </span>
      </div>

      {/* Stacked Feature + 3-Column Portrait Grid */}
      <div className="w-full flex flex-col gap-2.5 sm:gap-3">
        {/* ROW 1: Wide Featured MAKE A PAIR (15% OFF) Card */}
        <button
          type="button"
          onClick={() => onSelectCategory('pair')}
          onPointerEnter={() => onPrefetchCategory?.('pair')}
          onTouchStart={() => onPrefetchCategory?.('pair')}
          onFocus={() => onPrefetchCategory?.('pair')}
          className="group relative w-full h-[196px] min-[390px]:h-[208px] sm:h-[228px] rounded-2xl overflow-hidden cursor-pointer outline-none transition-[transform,box-shadow] duration-200 active:scale-[0.98] border-2 border-cyan-200/60 shadow-[0_8px_24px_rgba(7,27,45,0.25)] hover:shadow-[0_12px_32px_rgba(7,27,45,0.35)]"
          aria-label={`Shop ${pairCategory.name}${pairCategory.badgeText ? ` — ${pairCategory.badgeText}` : ''}`}
        >
          {/* Unified Architectural Sky-Blue Runway Background */}
          <CleanPlatePicture
            alt=""
            ariaHidden={true}
            className="w-full h-full object-cover object-center select-none pointer-events-none transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 94vw, 600px"
            loading="lazy"
            decoding="async"
            fetchPriority="low"
          />

          {/* Right-side Magnum BOXY Shirt + Classic Brown Trousers Cutouts */}
          <div className="absolute inset-y-2 right-2 sm:right-4 w-[58%] flex items-center justify-end -space-x-4 sm:-space-x-3 pointer-events-none z-10">
            <SmartImage
              src={POSTER_SHIRT.image}
              alt={POSTER_SHIRT.name}
              className="relative z-10 h-[78%] sm:h-[82%] w-auto object-contain drop-shadow-[0_10px_18px_rgba(4,24,43,0.28)] transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 150px, 200px"
              showSkeleton={false}
              loading="lazy"
              decoding="async"
              fetchPriority="low"
            />
            <SmartImage
              src={POSTER_TROUSER.image}
              alt={POSTER_TROUSER.name}
              className="h-[84%] sm:h-[88%] w-auto object-contain drop-shadow-[0_10px_18px_rgba(4,24,43,0.28)] transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 150px, 200px"
              showSkeleton={false}
              loading="lazy"
              decoding="async"
              fetchPriority="low"
            />
          </div>

          {/* Gentle gradient overlay for high legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-black/15 to-transparent pointer-events-none z-10" />

          {/* Left Editorial 15% OFF + MAKE A PAIR Lockup */}
          <div className="absolute top-3.5 left-3.5 sm:top-4 sm:left-4 z-20 flex flex-col items-start pointer-events-none">
            <div className="font-poster-condensed not-italic text-white inline-flex items-end gap-1 leading-none whitespace-nowrap drop-shadow-[0_2px_10px_rgba(4,24,43,0.3)]">
              <span className="font-extrabold text-[clamp(76px,22vw,106px)] leading-[0.78] tracking-[-0.02em] tabular-nums">
                15%
              </span>
              <div className="flex flex-col items-stretch leading-none">
                <span className="w-full h-[1.5px] bg-white mb-[3px]" aria-hidden="true" />
                <span className="font-extrabold text-[clamp(30px,8.5vw,42px)] leading-[0.80] tracking-[0.02em] uppercase">
                  OFF
                </span>
              </div>
            </div>

            <h3 className="mt-2 font-display text-lg min-[390px]:text-xl sm:text-2xl font-black tracking-wider text-white uppercase leading-none drop-shadow-[0_2px_8px_rgba(0,0,0,0.65)]">
              {pairCategory.name}
            </h3>
          </div>

          {/* Bottom-Right Build Pair Pill */}
          <div className="glass-capsule absolute bottom-3 right-3 sm:bottom-3.5 sm:right-3.5 z-20 inline-flex items-center gap-1 px-3 py-0.5 rounded-full shadow-sm text-white text-[12px] font-grotesk font-semibold pointer-events-none">
            <span>{pairCategory.count}</span>
            <svg
              className="w-3 h-3 text-white transition-transform group-hover:translate-x-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </div>

          {/* Frosted glass hover sheen */}
          <div
            className="absolute inset-0 bg-white/0 group-hover:bg-white/[0.08] active:bg-white/[0.12] transition-colors pointer-events-none rounded-2xl z-20"
            aria-hidden="true"
          />
        </button>

        {/* ROW 2: 3-Column Vertical Portrait Cards (SHIRTS · TROUSERS · HOODIES) */}
        <div className="w-full grid grid-cols-3 gap-2 sm:gap-2.5">
          {MOBILE_PORTRAIT_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(cat.id)}
              onPointerEnter={() => onPrefetchCategory?.(cat.id)}
              onTouchStart={() => onPrefetchCategory?.(cat.id)}
              onFocus={() => onPrefetchCategory?.(cat.id)}
              className="group relative w-full h-[272px] min-[390px]:h-[304px] sm:h-[340px] rounded-2xl overflow-hidden cursor-pointer outline-none transition-[transform,box-shadow] duration-200 active:scale-[0.98] border border-white/25 shadow-[0_8px_24px_rgba(7,27,45,0.25)] hover:shadow-[0_12px_32px_rgba(7,27,45,0.35)]"
              aria-label={`Shop ${cat.label} — ${cat.count}`}
            >
              {/* Unified Architectural Sky-Blue Runway Background */}
              <CleanPlatePicture
                alt=""
                ariaHidden={true}
                className="w-full h-full object-cover object-center select-none pointer-events-none transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 640px) 32vw, 220px"
                loading="lazy"
                decoding="async"
                fetchPriority="low"
              />

              {/* Portrait Model Cutout */}
              <div className={`absolute ${cat.imageWrapperClass} overflow-hidden pointer-events-none`}>
                <div className={cat.innerWrapperClass ?? 'w-full h-full'}>
                  <SmartImage
                    src={cat.image}
                    alt={cat.alt}
                    className={`${cat.imageClass} select-none transition-transform duration-300 group-hover:scale-105 ${cat.imageOriginClass ?? 'origin-bottom'}`}
                    sizes="(max-width: 640px) 32vw, 220px"
                    skeletonClassName="inset-1 rounded-xl"
                    loading="lazy"
                    decoding="async"
                    fetchPriority="low"
                  />
                </div>
              </div>

              {/* Gentle bottom gradient overlay for high legibility */}
              <div className="absolute inset-x-0 bottom-0 h-[44%] bg-gradient-to-t from-slate-950/85 via-slate-950/35 to-transparent pointer-events-none" />

              {/* Centered Bottom Category Title & Article Count Pill */}
              <div className="absolute inset-x-0 bottom-0 px-1.5 pb-2.5 pt-2 flex flex-col items-center text-center gap-1.5 pointer-events-none z-10">
                <h3 className="font-display text-[13px] min-[390px]:text-sm sm:text-base font-black tracking-wide text-white uppercase leading-none drop-shadow-[0_2px_8px_rgba(0,0,0,0.65)] whitespace-nowrap">
                  {cat.label}
                </h3>

                <div className="glass-capsule inline-flex items-center justify-center gap-1 px-2 py-0.5 rounded-full shadow-sm text-white text-[11px] min-[390px]:text-[11.5px] font-grotesk font-semibold whitespace-nowrap">
                  <span>{cat.count}</span>
                  <svg
                    className="w-2.5 h-2.5 text-white transition-transform group-hover:translate-x-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
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
          ))}
        </div>
      </div>
    </section>
  );
};
