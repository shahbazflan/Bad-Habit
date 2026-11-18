import React, { useState } from 'react';
import { useMember } from '../context/MemberContext';
import { useCart } from '../context/CartContext';
import { PRODUCTS } from '../data/products';

const SIZES = ['S', 'M', 'L', 'XL'] as const;

export const WishlistDrawer: React.FC = () => {
  const {
    member,
    isWishlistOpen,
    setIsWishlistOpen,
    setIsMemberModalOpen,
    removeWishlistItem,
    wishlistLoadingId,
  } = useMember();
  const { addToCart, isAdding } = useCart();

  const [sizeById, setSizeById] = useState<Record<string, 'S' | 'M' | 'L' | 'XL'>>({});
  const [addedId, setAddedId] = useState<string | null>(null);

  if (!isWishlistOpen) return null;

  const wishlist = member?.wishlist || [];
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
      setTimeout(() => setAddedId(null), 1800);
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
            <svg className="w-5 h-5 text-rose-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
            <span className="font-display text-lg font-black tracking-[0.08em] uppercase text-white">
              Wishlist
            </span>
            <span className="text-xs font-mono text-white bg-white/20 border border-white/30 px-2.5 py-0.5 rounded-full">
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
          <div className="mx-5 mt-4 p-3.5 rounded-2xl bg-cyan-400/20 border border-cyan-200/40 text-xs font-display flex items-center justify-between gap-2">
            <div>
              <span className="font-bold text-white block">10% Off First Order Active</span>
              <span className="text-[11px] text-cyan-100">Use member code at checkout:</span>
            </div>
            <span className="px-3 py-1 rounded-lg bg-slate-950/75 border border-white/40 font-mono text-xs font-black tracking-wider text-white">
              BH-DETECTED
            </span>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {!member ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12 px-4">
              <p className="font-display text-base font-bold text-white mb-2">
                Member Account Required
              </p>
              <p className="text-xs font-display text-white/75 leading-relaxed mb-5 max-w-xs">
                Become a member and get a flat 10% off on your first order, plus save articles to your wishlist.
              </p>
              <button
                type="button"
                onClick={() => {
                  setIsWishlistOpen(false);
                  setIsMemberModalOpen(true);
                }}
                className="px-6 py-3 rounded-full bg-white text-slate-900 font-display text-xs font-bold uppercase tracking-wider hover:bg-white/90 transition-all cursor-pointer shadow-lg"
              >
                JOIN AND GET A CODE
              </button>
            </div>
          ) : wishlist.length === 0 ? (
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
                  className="rounded-2xl bg-white/[0.10] border border-white/20 p-3.5 flex gap-3.5 items-center shadow-sm"
                >
                  <div className="w-20 h-24 shrink-0 rounded-xl bg-white/[0.08] border border-white/15 p-1.5 flex items-center justify-center overflow-hidden">
                    <img
                      src={catalogItem?.image || item.image}
                      alt={item.name}
                      className="w-full h-full object-contain"
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
                        <span className="text-xs font-mono font-semibold text-white/90 block mt-0.5">
                          {isSoldOut ? `${item.price} · SOLD OUT` : item.price}
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
                          className="px-3.5 py-1.5 rounded-full bg-white text-slate-900 font-display text-[11px] font-bold uppercase tracking-wider hover:bg-white/90 transition-all cursor-pointer active:scale-95"
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
