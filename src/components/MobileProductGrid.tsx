import React from 'react';
import { Product } from '../data/products';
import { CategoryId } from './MobileCategorySection';
import { preloadProductDetailImages } from '../utils/preloadImages';
import { useMember } from '../context/MemberContext';

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
 * - Translucent frosted glass product cards with Wishlist heart toggle
 * - Full garment image centered with object-contain
 */
export const MobileProductGrid: React.FC<MobileProductGridProps> = ({
  categoryId,
  products,
  onSelectProduct,
  onBackToCategories,
}) => {
  const { isInWishlist, toggleWishlist } = useMember();
  const categoryTitle = CATEGORY_NAMES[categoryId] || 'COLLECTION';

  const isTrousers = categoryId === 'trousers';
  const tailoredTrousers = isTrousers
    ? products.filter((p) => p.subCollection !== 'Streetwear')
    : products;
  const streetwearTrousers = isTrousers
    ? products.filter((p) => p.subCollection === 'Streetwear')
    : [];

  const renderProductCard = (product: Product, index: number) => {
    const saved = isInWishlist(product.id);
    return (
      <div
        key={product.id}
        role="button"
        tabIndex={0}
        onClick={() => onSelectProduct(product)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelectProduct(product);
          }
        }}
        onPointerEnter={() => preloadProductDetailImages(product)}
        onTouchStart={() => preloadProductDetailImages(product)}
        onFocus={() => preloadProductDetailImages(product)}
        className="group relative w-full rounded-2xl bg-white/[0.12] hover:bg-white/[0.18] active:scale-[0.98] border border-white/20 backdrop-blur-md p-2.5 sm:p-3 flex flex-col items-center justify-between transition-[transform,background-color] duration-150 cursor-pointer outline-none text-center shadow-[0_4px_16px_rgba(4,24,43,0.15)]"
        aria-label={`${product.name} — ${product.soldOut ? 'Sold Out' : product.price}`}
      >
        {/* Wishlist Heart Toggle */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            void toggleWishlist(product);
          }}
          className={`absolute top-2.5 left-2.5 z-20 w-9 h-9 rounded-full backdrop-blur-md border flex items-center justify-center transition-all cursor-pointer active:scale-90 shadow-sm ${
            saved
              ? 'bg-white/95 border-white text-rose-500'
              : 'bg-slate-900/45 border-white/30 text-white/90 hover:bg-slate-900/65'
          }`}
          aria-label={saved ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
        >
          <svg
            className="w-4 h-4"
            fill={saved ? 'currentColor' : 'none'}
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
            />
          </svg>
        </button>

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
            product.category === 'Shirts' ? 'p-4 sm:p-5' : 'p-1'
          }`}
        >
          <img
            src={product.image}
            alt={product.name}
            className={`w-full h-full object-contain object-center select-none transition-transform duration-150 group-hover:scale-[1.02] ${
              product.soldOut ? 'opacity-85' : ''
            }`}
            loading={index < 4 ? 'eager' : 'lazy'}
            fetchPriority={index < 2 ? 'high' : 'auto'}
            decoding="async"
          />
        </div>

        {/* Product Name Directly Beneath Image */}
        <div className="w-full mt-2 px-1">
          <h3 className="font-display text-sm sm:text-[15px] font-semibold text-white tracking-tight leading-snug line-clamp-2 flex items-center justify-center drop-shadow-[0_1px_4px_rgba(4,24,43,0.45)]">
            {product.name}
          </h3>

          {/* Price Capsule & Sold Out State */}
          <div className="mt-1.5 flex items-center justify-center gap-2 flex-wrap">
            <div className="inline-flex items-center justify-center px-4 py-1 rounded-full bg-slate-900/25 border border-white/40 shadow-sm">
              <span
                className={`text-xs sm:text-[13px] font-mono font-semibold tracking-tight ${
                  product.soldOut ? 'text-white/75 line-through' : 'text-white'
                }`}
              >
                {product.price}
              </span>
            </div>
            {product.soldOut && (
              <span className="px-2.5 py-0.5 rounded-full bg-red-600/95 border border-white/40 text-[10px] font-display font-black tracking-[0.14em] uppercase text-white shadow-sm">
                SOLD OUT
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full text-white px-4 py-3 select-none pb-12">
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

          {/* End-of-list quick navigation buttons */}
          <div className="pt-3 flex items-center justify-center gap-2.5">
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-slate-900/75 hover:bg-slate-900/90 text-white border border-white/25 backdrop-blur-md text-xs font-mono font-medium tracking-tight shadow-[0_6px_18px_rgba(4,24,43,0.25)] transition-all active:scale-95 cursor-pointer outline-none"
              aria-label="Back to top"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
              </svg>
              <span>Back to top</span>
            </button>

            <button
              type="button"
              onClick={onBackToCategories}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/95 hover:bg-white text-slate-900 border border-white text-xs font-mono font-semibold tracking-tight shadow-[0_6px_18px_rgba(4,24,43,0.2)] transition-all active:scale-95 cursor-pointer outline-none"
              aria-label="Go to Categories"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
              </svg>
              <span>Categories</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
