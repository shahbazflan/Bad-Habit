import React, { useState, useEffect, useRef, Suspense } from 'react';
import { Product, getColorVariants, getShirtDetailImageClass } from '../data/products';
import { useCart } from '../context/CartContext';
import { useMember } from '../context/MemberContext';
import { CategoryId } from './MobileCategorySection';
import { ColorSwatchRail } from './ColorSwatchRail';
import { preloadNextGalleryItem } from '../utils/preloadImages';
import { SmartImage } from './SmartImage';
import { clearLastViewContentKey, trackViewContent } from '../utils/metaPixel';
import { lazyWithRetry } from '../utils/lazyWithRetry';

const SizeGuideModal = lazyWithRetry(() =>
  import('./SizeGuideModal').then((m) => ({ default: m.SizeGuideModal }))
);

interface MobileProductDetailProps {
  product: Product;
  categoryId: CategoryId;
  onBack: () => void;
  onOpenBag: () => void;
  onSelectProduct?: (product: Product) => void;
  onPairProduct?: (product: Product) => void;
}

const SIZES = ['S', 'M', 'L', 'XL'] as const;
type SizeType = (typeof SIZES)[number];

/**
 * MobileProductDetail (Screen 4)
 * 
 * Garment-only product detail view (MODELS COMPLETELY REMOVED):
 * 1. Compact header and clear back control
 * 2. High-resolution garment display showcasing the transparent clothes cutouts
 *    with vertical colorway dot selector rail beside it
 * 3. Detail gallery switcher: Front view, Back view, and Close-Up Details
 * 4. Translucent frosted panel in normal flow with SOLD OUT support
 */
export const MobileProductDetail: React.FC<MobileProductDetailProps> = ({
  product,
  categoryId,
  onBack,
  onSelectProduct,
  onPairProduct,
}) => {
  const { addToCart, isAdding } = useCart();
  const { isInWishlist, toggleWishlist } = useMember();
  const [selectedSize, setSelectedSize] = useState<SizeType>('M');
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [addedSuccess, setAddedSuccess] = useState(false);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const savedInWishlist = isInWishlist(product.id);
  const addedSuccessTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (addedSuccessTimerRef.current !== null) {
        window.clearTimeout(addedSuccessTimerRef.current);
      }
    };
  }, []);

  const colorVariants = React.useMemo(() => getColorVariants(product), [product]);

  // Compile genuine garment images for this article:
  // 1st image: Front View (cleanly isolated front garment)
  // 2nd image: Back View / Front & Back showcase
  // 3rd+ images: High-definition detail close-ups
  const galleryImages: { label: string; src: string }[] = React.useMemo(() => {
    const list: { label: string; src: string }[] = [
      { label: 'Front', src: product.image },
    ];
    if (product.backImage) {
      list.push({ label: 'Back', src: product.backImage });
    } else if (product.frontAndBackImage) {
      list.push({ label: 'Back', src: product.frontAndBackImage });
    }
    if (product.detailImages && product.detailImages.length > 0) {
      product.detailImages.forEach((img, idx) => {
        list.push({ label: `Detail ${idx + 1}`, src: img });
      });
    }
    return list;
  }, [product]);

  // Clamp gallery index and reset state when switching products
  useEffect(() => {
    if (product.category === 'Trousers' || product.category === 'Shirts') {
      void import('./SizeGuideModal').catch(() => {});
    }
    setActiveImageIndex((prev) => {
      if (prev < galleryImages.length) return prev;
      return 0;
    });
    setSelectedSize('M');
    setAddedSuccess(false);
    setIsSizeGuideOpen(false);
  }, [product, galleryImages.length]);

  // Smart preloading: only warm the immediate next slide when on fast connections
  useEffect(() => {
    preloadNextGalleryItem(galleryImages, activeImageIndex);
  }, [galleryImages, activeImageIndex]);

  useEffect(() => {
    trackViewContent({
      id: product.id,
      name: product.name,
      category: product.category,
      price: product.price,
    });
    return () => {
      clearLastViewContentKey();
    };
  }, [product.id, product.name, product.category, product.price]);

  const currentImage = galleryImages[activeImageIndex]?.src || product.image;

  const prefetchBagAndCheckout = () => {
    void import('./MobileShoppingBag').catch(() => {});
    void import('./CheckoutView').catch(() => {});
  };

  const handleAddToCart = async () => {
    if (isAdding || product.soldOut) return;
    prefetchBagAndCheckout();

    // Parse numeric price from PKR string e.g. "PKR 6,499" -> 6499
    const numericPrice = parseInt(product.price.replace(/[^\d]/g, ''), 10) || 6499;

    const success = await addToCart({
      productId: product.id,
      name: product.name,
      price: numericPrice,
      formattedPrice: product.price,
      size: selectedSize,
      image: product.image,
      quantity: 1,
    });

    if (success) {
      setAddedSuccess(true);
      if (addedSuccessTimerRef.current !== null) {
        window.clearTimeout(addedSuccessTimerRef.current);
      }
      addedSuccessTimerRef.current = window.setTimeout(() => {
        addedSuccessTimerRef.current = null;
        setAddedSuccess(false);
      }, 2500);
    }
  };

  const categoryName = categoryId === 'hoodies' ? 'Hoodies & Sweatshirts' : categoryId.charAt(0).toUpperCase() + categoryId.slice(1);

  return (
    <div className="w-full text-white px-4 py-3 select-none pb-28">
      {/* 1. Clear Back Navigation Control */}
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 py-1 text-xs font-mono text-white/80 hover:text-white transition-opacity active:scale-95 cursor-pointer outline-none"
          aria-label={`Back to ${categoryName}`}
        >
          <svg className="w-4 h-4 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          <span>Back to {categoryName.toLowerCase()}</span>
        </button>

        {product.soldOut ? (
          <span className="px-3 py-0.5 rounded-[0.25rem] bg-red-600/95 border border-white/50 text-white text-[12px] font-grotesk font-black tracking-[0.14em] uppercase shadow-sm">
            SOLD OUT
          </span>
        ) : product.subCollection === 'Streetwear' ? (
          <span className="glass-capsule px-2.5 py-0.5 rounded-[0.25rem] text-white text-[11px] font-grotesk font-semibold tracking-wider uppercase">
            Streetwear
          </span>
        ) : null}
      </div>

      {/* 2. Centered Garment Display + Column of Color Dots Beside It */}
      <div className="relative w-full flex flex-col items-center justify-center">
        <div className="relative w-full h-[52vh] sm:h-[58vh] min-h-[340px] max-h-[540px] flex items-center justify-center pl-4 pr-12">
          <SmartImage
            src={currentImage}
            alt={`${product.name} ${galleryImages[activeImageIndex]?.label || 'garment view'}`}
            responsive={false}
            className={`${
              activeImageIndex <= 1
                ? getShirtDetailImageClass(product.id, activeImageIndex === 1, 'mobile')
                : 'w-full h-full'
            } object-contain object-center select-none`}
            skeletonClassName="inset-6 rounded-[0.5rem]"
            loading="eager"
            decoding="async"
            fetchPriority="high"
          />

          {/* Top-Right Stacked Controls: View Pill Above Size Guide (keeps top-left poster logos unobstructed) */}
          <div className="absolute top-1 right-1 z-25 flex flex-col items-end gap-1">
            <span className="glass-capsule px-2 py-[2px] rounded-[0.25rem] text-[10px] font-grotesk font-semibold text-white tracking-wide">
              {galleryImages[activeImageIndex]?.label || 'Front'}
            </span>

            {(product.category === 'Trousers' || product.category === 'Shirts') && (
              <button
                type="button"
                onClick={() => setIsSizeGuideOpen(true)}
                className="glass-capsule px-2.5 py-0.5 rounded-[0.25rem] active:scale-95 text-[11px] font-grotesk font-semibold text-white inline-flex items-center gap-1 shadow-sm transition-all cursor-pointer outline-none"
                aria-label={`Open ${product.category.toLowerCase()} size guide`}
              >
                <svg className="w-3 h-3 text-white shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8.25V15.75C3 16.9926 4.00736 18 5.25 18H18.75C19.9926 18 21 16.9926 21 15.75V8.25C21 7.00736 19.9926 6 18.75 6H5.25C4.00736 6 3 7.00736 3 8.25Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 6V10M12 6V11.5M16.5 6V10" />
                </svg>
                <span>Size guide</span>
              </button>
            )}
          </div>

          {/* Vertical Column of Exact Color Dots Beside the Garment */}
          {onSelectProduct && colorVariants.length > 1 && (
            <div className="absolute right-0.5 top-1/2 -translate-y-1/2 z-25">
              <ColorSwatchRail
                currentProduct={product}
                variants={colorVariants}
                onSelectVariant={onSelectProduct}
              />
            </div>
          )}
        </div>

        {/* Dedicated Front / Back / Details Delicate Toggle Pill (centered directly under garment box) */}
        <div className="relative z-20 mt-2 w-full pl-4 pr-12 flex items-center justify-center">
          <div className="glass-capsule p-[2px] rounded-[0.25rem] flex items-center gap-0.5 shadow-sm">
            <button
              type="button"
              onClick={() => setActiveImageIndex(0)}
              className={`px-2.5 py-[2px] rounded-[0.2rem] text-[10.5px] font-grotesk font-semibold tracking-[0.08em] uppercase transition-colors cursor-pointer ${
                activeImageIndex === 0
                  ? 'bg-white/28 border border-white/80 text-white shadow-sm'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              Front
            </button>
            <button
              type="button"
              onClick={() => setActiveImageIndex(1)}
              className={`px-2.5 py-[2px] rounded-[0.2rem] text-[10.5px] font-grotesk font-semibold tracking-[0.08em] uppercase transition-colors cursor-pointer ${
                activeImageIndex === 1
                  ? 'bg-white/28 border border-white/80 text-white shadow-sm'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              Back
            </button>
            {galleryImages.slice(2).map((detailItem, offset) => {
              const detailIdx = offset + 2;
              const detailLabel =
                galleryImages.length === 3 ? 'Details' : detailItem.label;
              return (
                <button
                  key={detailIdx}
                  type="button"
                  onClick={() => setActiveImageIndex(detailIdx)}
                  className={`px-2.5 py-[2px] rounded-[0.2rem] text-[10.5px] font-grotesk font-semibold tracking-[0.08em] uppercase transition-colors cursor-pointer ${
                    activeImageIndex === detailIdx
                      ? 'bg-white/28 border border-white/80 text-white shadow-sm'
                      : 'text-white/80 hover:text-white'
                  }`}
                >
                  {detailLabel}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Article Multi-View Thumbnails (aligned directly beneath garment center) */}
      {galleryImages.length > 1 && (
        <div className="w-full pl-4 pr-12 flex items-center justify-center gap-2 my-2 py-1 overflow-x-auto">
          {galleryImages.map((img, idx) => {
            const isSelected = activeImageIndex === idx;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveImageIndex(idx)}
                className={`relative w-14 h-14 rounded-xl overflow-hidden p-1 transition-all cursor-pointer outline-none flex items-center justify-center ${
                  isSelected
                    ? 'bg-white/30 border-2 border-white scale-105 shadow-md'
                    : 'bg-white/10 border border-white/20 hover:bg-white/20 opacity-70 hover:opacity-100'
                }`}
                aria-label={`View ${img.label}`}
              >
                <SmartImage
                  src={img.src}
                  alt={img.label}
                  className="w-full h-full object-contain"
                  sizes="56px"
                  skeletonClassName="inset-1 rounded-lg"
                  loading="lazy"
                  decoding="async"
                  fetchPriority="low"
                />
              </button>
            );
          })}
        </div>
      )}

      {/* 4. Translucent Frosted Details Card in Normal Flow */}
      <div className="w-full rounded-[0.5rem] bg-white/[0.12] border border-white/20 backdrop-blur-xl p-3.5 sm:p-4 flex flex-col items-center text-center mt-2 shadow-[0_8px_32px_rgba(4,24,43,0.3)]">
        {/* Product Name + Subtitle + Color */}
        <h2 className="font-display text-base sm:text-lg font-bold tracking-tight text-white">
          {product.name}
        </h2>
        {product.subtitle && (
          <span className="text-[11px] font-sans text-white/80 tracking-tight mt-0.5">
            {product.subtitle}
          </span>
        )}
        <span className="text-[11px] font-sans text-white/80 mt-0.5">
          {product.color}
        </span>

        {/* Highlighted Frosted Glass Price Capsule with White Text */}
        <div className="mt-2 mb-2.5 flex items-center justify-center gap-2 flex-wrap">
          <div className="selected-reveal-capsule inline-flex items-center justify-center gap-2 px-4.5 py-1 rounded-[0.25rem]">
            {product.originalPrice && (
              <span className="text-[11.5px] sm:text-[13px] font-grotesk font-medium text-white/60 line-through tracking-wider uppercase whitespace-nowrap">
                {product.originalPrice}
              </span>
            )}
            <span
              className={`text-[13.5px] sm:text-[15px] font-grotesk font-black tracking-wider uppercase whitespace-nowrap ${
                product.soldOut ? 'text-white/60 line-through' : 'text-white'
              }`}
            >
              {product.price}
            </span>
          </div>
          {product.soldOut && (
            <span className="px-3 py-1 rounded-[0.25rem] bg-red-600/95 border border-white/50 text-white font-grotesk font-black text-[12.5px] tracking-[0.14em] uppercase shadow-md">
              SOLD OUT
            </span>
          )}
        </div>

        {/* Size Controls */}
        <div className="w-full flex items-center justify-center gap-2 mb-3">
          {SIZES.map((size) => {
            const isSelected = selectedSize === size;
            return (
              <button
                key={size}
                type="button"
                disabled={product.soldOut}
                onClick={() => setSelectedSize(size)}
                className={`w-10 h-9 sm:w-11 sm:h-10 rounded-lg text-xs font-mono font-semibold transition-all outline-none flex items-center justify-center ${
                  product.soldOut
                    ? 'bg-white/[0.05] text-white/40 border border-white/15 cursor-not-allowed'
                    : isSelected
                    ? 'bg-white text-black font-bold shadow-md scale-105 cursor-pointer'
                    : 'bg-white/[0.08] text-white/90 border border-white/30 hover:border-white/60 active:scale-95 cursor-pointer'
                }`}
                aria-label={`Select size ${size}`}
              >
                {size}
              </button>
            );
          })}
        </div>

        {/* Wide Frosted Glass "Add to bag" / "SOLD OUT" Button */}
        <button
          type="button"
          onClick={handleAddToCart}
          onPointerEnter={prefetchBagAndCheckout}
          onTouchStart={prefetchBagAndCheckout}
          disabled={isAdding || product.soldOut}
          className={`w-full py-2.5 px-4.5 rounded-[0.25rem] border backdrop-blur-md font-grotesk font-semibold text-[15px] sm:text-[16.5px] tracking-tight flex items-center justify-center gap-2 shadow-[0_8px_24px_rgba(4,15,34,0.20)] transition-all outline-none ${
            product.soldOut
              ? 'bg-red-950/60 border-red-300/40 text-red-100 font-black tracking-[0.16em] uppercase cursor-not-allowed'
              : addedSuccess
              ? 'bg-emerald-600/90 border-emerald-300 text-white cursor-pointer'
              : 'selected-reveal-capsule text-white cursor-pointer active:scale-[0.98]'
          }`}
          aria-label={
            product.soldOut
              ? `${product.name} is sold out`
              : `Add ${product.name} size ${selectedSize} to shopping bag`
          }
        >
          {product.soldOut ? (
            <span>SOLD OUT</span>
          ) : addedSuccess ? (
            <>
              <svg className="w-3.5 h-3.5 text-emerald-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              <span>Added to bag ({selectedSize})</span>
            </>
          ) : (
            <span>Add to bag</span>
          )}
        </button>

        {/* Pair it with Trousers (for Shirts/Hoodies) or Pair it with A shirt (for Trousers) */}
        {onPairProduct &&
          (product.category === 'Shirts' ||
            product.category === 'Hoodies' ||
            product.category === 'Trousers') && (
            <button
              type="button"
              onClick={() => onPairProduct(product)}
              className="selected-reveal-capsule w-full mt-2 py-2 px-3.5 rounded-[0.25rem] text-white font-grotesk text-[13px] sm:text-[15px] font-bold tracking-wide flex items-center justify-between gap-2 transition-all active:scale-[0.98] cursor-pointer outline-none"
            >
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-white shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 16.875h3.375m0 0h3.375m-3.375 0V13.5m0 3.375v3.375M6 10.5h2.25a2.25 2.25 0 002.25-2.25V6a2.25 2.25 0 00-2.25-2.25H6A2.25 2.25 0 003.75 6v2.25A2.25 2.25 0 006 10.5zm0 9.75h2.25A2.25 2.25 0 0010.5 18v-2.25a2.25 2.25 0 00-2.25-2.25H6a2.25 2.25 0 00-2.25 2.25V18A2.25 2.25 0 006 20.25zm9.75-9.75H18a2.25 2.25 0 002.25-2.25V6A2.25 2.25 0 0018 3.75h-2.25A2.25 2.25 0 0013.5 6v2.25a2.25 2.25 0 002.25 2.25z" />
                </svg>
                <span>
                  {product.category === 'Shirts' || product.category === 'Hoodies'
                    ? 'Pair it with Trousers'
                    : 'Pair it with A shirt'}
                </span>
              </span>
              <span className="px-2.5 py-0.5 rounded-[0.25rem] bg-white/25 backdrop-blur-md text-white border border-white/75 font-grotesk font-black text-[12px] tracking-wider uppercase shrink-0">
                15% OFF
              </span>
            </button>
          )}

        {/* Save to Wishlist Button */}
        <button
          type="button"
          onClick={() => void toggleWishlist(product)}
          className={`glass-capsule glass-capsule-hover w-full mt-2 py-2 px-3.5 rounded-[0.25rem] font-grotesk text-[13px] sm:text-[15px] font-bold tracking-wide text-white flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] cursor-pointer outline-none ${
            savedInWishlist ? 'border-red-400/80 shadow-sm' : ''
          }`}
        >
          <svg
            className="w-3.5 h-3.5 shrink-0 text-red-500"
            fill={savedInWishlist ? 'currentColor' : 'none'}
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2.1"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
          </svg>
          <span>{savedInWishlist ? 'Saved in Wishlist' : 'Save to Wishlist'}</span>
        </button>

        {/* Fabric & Article Specifications */}
        {product.fabric && (
          <div className="w-full mt-4 pt-3 border-t border-white/10 text-left">
            <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-200/90 block mb-1">
              Fabric & Tailoring Details
            </span>
            <p className="text-[11px] font-mono text-white/80 leading-relaxed">
              {product.fabric}
            </p>
          </div>
        )}
      </div>

      {isSizeGuideOpen && (
        <Suspense fallback={null}>
          <SizeGuideModal
            isOpen={isSizeGuideOpen}
            category={product.category}
            onClose={() => setIsSizeGuideOpen(false)}
          />
        </Suspense>
      )}
    </div>
  );
};
