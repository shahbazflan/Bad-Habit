import React from 'react';
import { Product } from '../data/products';
import { CategoryId } from './MobileCategorySection';
import { preloadProductDetailImages } from '../utils/preloadImages';

interface MobileProductGridProps {
  categoryId: CategoryId;
  products: Product[];
  onSelectProduct: (product: Product) => void;
  onBackToCategories: () => void;
}

const CATEGORY_NAMES: Record<CategoryId, string> = {
  trousers: 'TROUSERS',
  hoodies: 'HOODIES & SWEATSHIRTS',
  shirts: 'SHIRTS',
  pair: 'MAKE A PAIR',
};

/**
 * MobileProductGrid (Screen 3)
 * 
 * Category product listing matching Phone 3:
 * - "< Back to categories" breadcrumb control
 * - Left-aligned uppercase category title (e.g. "TROUSERS")
 * - 2 equal-width product columns with ~10-12px gutters
 * - Translucent frosted glass product cards
 * - Full garment image centered with object-contain (no cut-off waistbands or hems)
 * - Product name directly beneath the image
 * - Compact glass price capsule immediately beneath name with pure WHITE text
 * - All 11 authoritative products preserved
 */
export const MobileProductGrid: React.FC<MobileProductGridProps> = ({
  categoryId,
  products,
  onSelectProduct,
  onBackToCategories,
}) => {
  const categoryTitle = CATEGORY_NAMES[categoryId] || 'COLLECTION';

  const isTrousers = categoryId === 'trousers';
  const tailoredTrousers = isTrousers
    ? products.filter((p) => p.subCollection !== 'Streetwear')
    : products;
  const streetwearTrousers = isTrousers
    ? products.filter((p) => p.subCollection === 'Streetwear')
    : [];

  const renderProductCard = (product: Product, index: number) => (
    <button
      key={product.id}
      type="button"
      onClick={() => onSelectProduct(product)}
      onPointerEnter={() => preloadProductDetailImages(product)}
      onTouchStart={() => preloadProductDetailImages(product)}
      onFocus={() => preloadProductDetailImages(product)}
      className="group relative w-full rounded-2xl bg-white/[0.12] hover:bg-white/[0.18] active:scale-[0.98] border border-white/20 backdrop-blur-md p-2.5 sm:p-3 flex flex-col items-center justify-between transition-[transform,background-color] duration-150 cursor-pointer outline-none text-center shadow-[0_4px_16px_rgba(4,24,43,0.15)]"
      aria-label={`${product.name} — ${product.soldOut ? 'Sold Out' : product.price}`}
    >
      {/* SOLD OUT Badge */}
      {product.soldOut && (
        <div className="absolute top-2.5 right-2.5 z-20">
          <span className="inline-block px-3 py-1 rounded-full bg-red-600/95 border border-white/50 text-white font-display font-black text-[10px] tracking-[0.16em] uppercase shadow-[0_4px_14px_rgba(220,38,38,0.45)]">
            SOLD OUT
          </span>
        </div>
      )}

      {/* Full Garment Image Centered: clean uniform fit across all articles */}
      <div
        className={`w-full h-72 sm:h-76 flex items-center justify-center relative overflow-hidden ${
          product.category === 'Shirts' ? 'p-3.5 sm:p-4' : 'p-1'
        }`}
      >
        <img
          src={product.image}
          alt={product.name}
          className={`w-full h-full object-contain object-center select-none transition-transform duration-150 group-hover:scale-[1.02] ${
            product.category === 'Shirts' ? 'scale-[0.95]' : ''
          } ${
            product.soldOut ? 'opacity-85' : ''
          }`}
          loading={index < 4 ? 'eager' : 'lazy'}
          fetchPriority={index < 2 ? 'high' : 'auto'}
          decoding="async"
        />
      </div>

      {/* Product Name Directly Beneath Image */}
      <div className="w-full mt-2 px-1">
        <h3 className="font-display text-sm sm:text-[15px] font-semibold text-white tracking-tight leading-snug line-clamp-2 flex items-center justify-center">
          {product.name}
        </h3>

        {/* Price Capsule & Sold Out State */}
        <div className="mt-1.5 flex items-center justify-center gap-2 flex-wrap">
          <div className="inline-flex items-center justify-center px-4 py-1 rounded-full bg-white/[0.18] border border-white/35 shadow-sm">
            <span
              className={`text-xs sm:text-[13px] font-mono font-semibold tracking-tight ${
                product.soldOut ? 'text-white/75 line-through' : 'text-white'
              }`}
            >
              {product.price}
            </span>
          </div>
          {product.soldOut && (
            <span className="text-[11px] font-display font-black tracking-[0.14em] uppercase text-red-200">
              SOLD OUT
            </span>
          )}
        </div>
      </div>
    </button>
  );

  return (
    <div className="w-full text-white px-4 py-3 select-none pb-24">
      {/* Back to Categories Control matching Phone 3 */}
      <div className="mb-2">
        <button
          type="button"
          onClick={onBackToCategories}
          className="inline-flex items-center gap-1.5 py-1 text-xs font-mono text-white/80 hover:text-white transition-opacity active:scale-95 cursor-pointer outline-none"
          aria-label="Back to categories"
        >
          <svg className="w-4 h-4 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          <span>Back to categories</span>
        </button>
      </div>

      {/* Left-Aligned Uppercase Category Title matching Phone 3 */}
      <div className="mb-3.5">
        <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-white uppercase">
          {categoryTitle}
        </h1>
      </div>

      {/* Empty State for In-Curation Categories */}
      {products.length === 0 ? (
        <div className="w-full py-16 px-6 rounded-2xl border border-white/20 bg-white/[0.08] backdrop-blur-md flex flex-col items-center text-center">
          <span className="text-xs font-mono tracking-widest uppercase text-white/60 mb-2">
            In Curation · SS26
          </span>
          <h2 className="font-display text-lg font-bold text-white mb-2">
            {categoryTitle} Series
          </h2>
          <p className="text-xs text-white/70 max-w-xs leading-relaxed mb-6 font-mono">
            Our architectural {categoryTitle.toLowerCase()} collection is currently in fabrication. Explore our available trousers collection.
          </p>
          <button
            type="button"
            onClick={onBackToCategories}
            className="px-6 py-2.5 rounded-full bg-white text-black font-semibold text-xs tracking-wider uppercase transition-all active:scale-95 cursor-pointer shadow-lg hover:bg-white/90"
          >
            Back to categories
          </button>
        </div>
      ) : (
        /* LARGE UNIFORM SHOWCASE PRODUCT GRID */
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
            {tailoredTrousers.map((product, idx) => renderProductCard(product, idx))}
          </div>

          {streetwearTrousers.length > 0 && (
            <div className="pt-2">
              <div className="mb-3.5 flex items-center gap-3">
                <h2 className="font-display text-lg sm:text-xl font-bold tracking-[0.14em] text-white uppercase drop-shadow-sm">
                  Streetwear
                </h2>
                <div className="flex-1 h-px bg-white/25" aria-hidden="true" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                {streetwearTrousers.map((product, idx) => renderProductCard(product, idx))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
