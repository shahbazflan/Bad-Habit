import React, { useState, useRef, useEffect } from 'react';
import { useMember } from '../context/MemberContext';
import { useCart } from '../context/CartContext';
import { PRODUCTS, getProductSubtitle } from '../data/products';
import { SmartImage } from './SmartImage';

const SIZES = ['S', 'M', 'L', 'XL'] as const;

export const WishlistDrawer: React.FC = () => {
  const {
    member,
    wishlistItems,
    isWishlistOpen,
    setIsWishlistOpen,
    setIsMemberModalOpen,
    removeWishlistItem,
    wishlistLoadingId,
  } = useMember();
  const { addToCart, isAdding } = useCart();

  const [sizeById, setSizeById] = useState<Record<string, 'S' | 'M' | 'L' | 'XL'>>({});
  const [addedId, setAddedId] = useState<string | null>(null);
  const addedTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (addedTimerRef.current !== null) {
        window.clearTimeout(addedTimerRef.current);
      }
    };
  }, []);

  if (!isWishlistOpen) return null;

  const wishlist = wishlistItems;
  const isFirstOrderAvailable = member ? !member.firstOrderDiscountUsed && member.orderCount === 0 : false;

  const handleQuickAdd = async (productId: string) => {
    const product = PRODUCTS.find((p) => p.id === productId);
    if (!product || product.soldOut || isAdding) return;

    const chosenSize = sizeById[productId] || 'M';
    const numericPrice = parseInt(product.price.replace(/[^\d]/g, ''), 10) || 6499;
    const ok = await addToCart({
      productId: product.id,
      name: product.name,
      price: numericPrice,
      formattedPrice: product.price,
      size: chosenSize,
      image: product.image,
      quantity: 1,
    });
    if (ok) {
      setAddedId(productId);
      if (addedTimerRef.current !== null) {
        window.clearTimeout(addedTimerRef.current);
      }
      addedTimerRef.current = window.setTimeout(() => {
        addedTimerRef.current = null;
        setAddedId(null);
      }, 1800);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-sky-950/35 backdrop-blur-sm animate-in fade-in duration-200 select-none"
      role="dialog"
      aria-modal="true"
      aria-label="Member Wishlist"
    >
      <div className="absolute inset-0 cursor-pointer" onClick={() => setIsWishlistOpen(false)} />

      <div className="relative w-full max-w-md h-full bg-[#1e466e]/95 border-l border-white/25 backdrop-blur-3xl shadow-[0_20px_60px_rgba(4,24,43,0.45)] flex flex-col z-10 text-white">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-[calc(22px+env(safe-area-inset-top))] pb-4 border-b border-white/20 bg-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
            <span className="font-display text-lg font-black tracking-[0.08em] uppercase text-white">
              Wishlist
            </span>
            <span className="glass-capsule text-[13px] font-grotesk font-bold text-white px-2 py-0.5">
              {wishlist.length}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsWishlistOpen(false)}
            className="w-9 h-9 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/15 transition-colors cursor-pointer outline-none"
            aria-label="Close wishlist"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Promo Banner for Eligible Members */}
        {member && isFirstOrderAvailable && (
          <div className="mx-5 mt-4 p-3.5 rounded-[0.5rem] bg-cyan-400/20 border border-cyan-200/40 text-xs font-display flex items-center justify-between gap-2">
            <div>
              <span className="font-bold text-white block">10% Off First Order Active</span>
              <span className="text-[11px] text-cyan-100">Use member code at checkout:</span>
            </div>
            <span className="px-3 py-1 rounded-lg bg-slate-950/75 border border-white/40 font-mono text-xs font-black tracking-wider text-white">
              BH-DETECTED
            </span>
          </div>
        )}

        {/* Promo Banner for Guests */}
        {!member && (
          <div className="mx-5 mt-4 p-3.5 rounded-[0.5rem] bg-cyan-400/20 border border-cyan-200/40 text-xs font-display flex items-center justify-between gap-2.5">
            <div>
              <span className="font-bold text-white block">Flat 10% Off First Order</span>
              <span className="text-[11px] text-cyan-100">Join to sync your wishlist & unlock code</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsWishlistOpen(false);
                setIsMemberModalOpen(true);
              }}
              className="selected-reveal-capsule px-3 py-1 rounded-[0.25rem] text-white font-grotesk text-[11px] font-black uppercase tracking-wider shrink-0 transition-all cursor-pointer shadow-sm"
            >
              Join
            </button>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {wishlist.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-14 px-4">
              <p className="font-display text-base font-bold text-white mb-1">
                Your wishlist is empty
              </p>
              <p className="text-xs font-mono text-white/65 max-w-xs leading-relaxed">
                Tap the heart button on any article to save it here for quick checkout.
              </p>
            </div>
          ) : (
            wishlist.map((item) => {
              const catalogItem = PRODUCTS.find((p) => p.id === item.productId);
              const isSoldOut = Boolean(catalogItem?.soldOut);
              const activeSize = sizeById[item.productId] || 'M';
              const isRemoving = wishlistLoadingId === item.productId;

              return (
                <div
                  key={item.productId}
                  className="rounded-[0.5rem] bg-white/[0.10] border border-white/20 p-3.5 flex gap-3.5 items-center shadow-sm"
                >
                  <div className="relative w-20 h-24 shrink-0 rounded-xl bg-white/[0.08] border border-white/15 p-1.5 flex items-center justify-center overflow-hidden">
                    <SmartImage
                      src={catalogItem?.image || item.image}
                      alt={item.name}
                      className="w-full h-full object-contain"
                      sizes="80px"
                      skeletonClassName="inset-1 rounded-xl"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-200 block">
                          {item.category}
                        </span>
                        <h4 className="font-display text-sm font-bold text-white truncate">
                          {item.name}
                        </h4>
                        {(catalogItem?.subtitle || getProductSubtitle(item.productId)) && (
                          <span className="text-[11px] font-sans text-white/75 block truncate">
                            {catalogItem?.subtitle || getProductSubtitle(item.productId)}
                          </span>
                        )}
                        <span className="text-xs font-mono font-semibold text-white/90 block mt-0.5">
                          {catalogItem?.originalPrice && (
                            <span className="line-through text-white/55 mr-1.5 font-normal">
                              {catalogItem.originalPrice}
                            </span>
                          )}
                          {isSoldOut ? `${catalogItem?.price || item.price} · SOLD OUT` : catalogItem?.price || item.price}
                        </span>
                      </div>

                      <button
                        type="button"
                        disabled={isRemoving}
                        onClick={() => removeWishlistItem(item.productId)}
                        className="text-white/50 hover:text-red-300 p-1 transition-colors cursor-pointer"
                        aria-label={`Remove ${item.name} from wishlist`}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    {!isSoldOut && (
                      <div className="mt-2.5 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1">
                          {SIZES.map((sz) => (
                            <button
                              key={sz}
                              type="button"
                              onClick={() => setSizeById((prev) => ({ ...prev, [item.productId]: sz }))}
                              className={`w-6 h-6 rounded-md text-[10px] font-mono font-bold transition-all cursor-pointer ${
                                activeSize === sz
                                  ? 'bg-white text-slate-900'
                                  : 'bg-white/10 text-white/80 hover:bg-white/20'
                              }`}
                            >
                              {sz}
                            </button>
                          ))}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleQuickAdd(item.productId)}
                          className="selected-reveal-capsule px-3 py-1 rounded-[0.25rem] text-white font-grotesk text-[12px] font-bold uppercase tracking-wider transition-all cursor-pointer active:scale-95"
                        >
                          {addedId === item.productId ? 'Added ✓' : 'Add to bag'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
