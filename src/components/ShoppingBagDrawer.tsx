import React, { useState, useRef, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useMember } from '../context/MemberContext';
import { PRODUCTS, getProductSubtitle } from '../data/products';
import { SmartImage } from './SmartImage';

const prefetchCheckoutView = () => {
  void import('./CheckoutView').catch(() => {});
};

export const ShoppingBagDrawer: React.FC = () => {
  const {
    items,
    isBagOpen,
    setIsBagOpen,
    setIsCheckoutOpen,
    updateQuantity,
    removeFromCart,
    pairCount,
    pairDiscount,
    formattedRawSubtotal,
    formattedPairDiscount,
    formattedSubtotal,
  } = useCart();
  const { member, setIsMemberModalOpen } = useMember();
  const isFirstOrderEligible = member ? !member.firstOrderDiscountUsed && member.orderCount === 0 : false;

  const [validating, setValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const validateAbortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    if (isBagOpen && items.length > 0) {
      prefetchCheckoutView();
    }
    return () => {
      mountedRef.current = false;
      validateAbortRef.current?.abort();
    };
  }, [isBagOpen, items.length]);

  // On mobile (< 768px), shopping bag is handled as dedicated Screen 5 in MobileExperience
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window !== 'undefined') return window.innerWidth >= 768;
    return true;
  });

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  if (!isBagOpen || !isDesktop) return null;

  const handleContinueShopping = () => {
    setIsBagOpen(false);
    setValidationError(null);
  };

  const handleProceedToCheckout = () => {
    if (items.length === 0 || validating) return;
    prefetchCheckoutView();
    setValidationError(null);

    const invalidItem = items.find((item) => {
      const product = PRODUCTS.find((p) => p.id === item.productId);
      return !product || product.soldOut || !['S', 'M', 'L', 'XL'].includes(item.size) || item.quantity <= 0;
    });

    if (invalidItem) {
      setValidationError(`${invalidItem.name} is currently unavailable or sold out. Please remove it to proceed.`);
      return;
    }

    setIsBagOpen(false);
    setIsCheckoutOpen(true);
  };

  return (
    <div
      className="hidden md:flex fixed inset-0 z-50 justify-end bg-sky-950/25 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="Shopping Bag"
    >
      {/* Backdrop click to dismiss */}
      <div className="absolute inset-0 cursor-pointer" onClick={handleContinueShopping} />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-md h-full bg-[#204a74]/90 border-l border-white/25 backdrop-blur-3xl shadow-[0_20px_60px_rgba(4,24,43,0.4)] flex flex-col z-10 text-white select-none">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-[calc(24px+env(safe-area-inset-top))] pb-4 border-b border-white/20 bg-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <span className="font-display text-lg font-black tracking-[0.08em] uppercase text-white">
              Shopping Bag
            </span>
            <span className="glass-capsule text-[12.5px] font-grotesk font-bold text-white px-2 py-0.5">
              {items.reduce((s, it) => s + it.quantity, 0)} articles
            </span>
          </div>

          <button
            type="button"
            onClick={handleContinueShopping}
            className="w-9 h-9 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/15 transition-colors cursor-pointer outline-none"
            aria-label="Close bag drawer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {validationError && (
          <div className="mx-6 mt-3 p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs font-mono flex items-start gap-2">
            <svg className="w-4 h-4 text-red-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{validationError}</span>
          </div>
        )}

        {/* Bag Items List */}
        <div className="flex-1 overflow-y-auto px-6 py-4 divide-y divide-white/10">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-16 text-white/60">
              <div className="w-16 h-16 rounded-full bg-white/5 border border-white/15 flex items-center justify-center mb-4 text-white/40">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <p className="font-display text-base font-bold text-white mb-1">Your bag is empty</p>
              <p className="text-xs text-white/60 max-w-[220px] font-mono mb-6">
                Explore the architectural showroom to select your trousers.
              </p>
              <button
                type="button"
                onClick={handleContinueShopping}
                className="selected-reveal-capsule px-5 py-2 text-[13px] font-grotesk font-semibold text-white tracking-wider cursor-pointer"
              >
                Browse Collection
              </button>
            </div>
          ) : (
            items.map((item) => {
              const lineTotal = item.price * item.quantity;
              return (
                <div key={`${item.productId}-${item.size}`} className="py-4 flex gap-4 items-center">
                  {/* Thumbnail */}
                  <div className="relative w-20 h-24 shrink-0 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center p-1.5 overflow-hidden">
                    <SmartImage
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-contain select-none"
                      sizes="80px"
                      skeletonClassName="inset-1 rounded-xl"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>

                  {/* Info & Controls */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between h-full">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="font-display text-sm font-bold text-white tracking-tight truncate">
                            {item.name}
                          </h4>
                          {getProductSubtitle(item.productId) && (
                            <p className="text-[11px] font-sans text-white/70 truncate">
                              {getProductSubtitle(item.productId)}
                            </p>
                          )}
                        </div>
                        {/* Remove Option */}
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.productId, item.size)}
                          className="text-white/40 hover:text-red-400 p-1 transition-colors cursor-pointer"
                          title="Remove item"
                          aria-label={`Remove ${item.name} size ${item.size}`}
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>

                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white/10 text-white/90 font-medium">
                          Size {item.size}
                        </span>
                        <span className="text-[11px] font-mono text-white/60">
                          {item.formattedPrice}
                        </span>
                      </div>
                    </div>

                    {/* Quantity controls & Line Total */}
                    <div className="flex items-center justify-between mt-3">
                      <div className="glass-capsule flex items-center p-0.5 rounded-[0.25rem] font-grotesk">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.productId, item.size, item.quantity - 1)}
                          className="w-6 h-6 rounded-[0.25rem] flex items-center justify-center text-white hover:bg-white/15 transition-colors cursor-pointer font-grotesk text-[13.5px] font-bold"
                          aria-label="Decrease quantity"
                        >
                          -
                        </button>
                        <span className="w-7 text-center text-[13px] font-grotesk font-bold text-white">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.productId, item.size, item.quantity + 1)}
                          className="w-6 h-6 rounded-[0.25rem] flex items-center justify-center text-white hover:bg-white/15 transition-colors cursor-pointer font-grotesk text-[13.5px] font-bold"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>

                      <div className="font-display text-sm font-bold text-white">
                        PKR {lineTotal.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer with Subtotal, Pair Discount, Delivery note & Controls */}
        {items.length > 0 && (
          <div className="p-6 border-t border-white/20 bg-white/[0.08] backdrop-blur-md flex flex-col gap-3">
            {pairDiscount > 0 && (
              <>
                <div className="flex items-center justify-between text-xs font-mono text-white/75">
                  <span>Articles Total</span>
                  <span>{formattedRawSubtotal}</span>
                </div>
                <div className="flex items-center justify-between text-xs font-mono text-emerald-200 font-semibold">
                  <span>Pair Discount (15% Off · {pairCount} {pairCount === 1 ? 'pair' : 'pairs'})</span>
                  <span>-{formattedPairDiscount}</span>
                </div>
              </>
            )}

            <div className="flex items-center justify-between text-xs font-mono text-white/80">
              <span>Delivery</span>
              <span className="text-white/60 italic">Calculated at checkout</span>
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="font-display text-sm font-semibold text-white/90 uppercase tracking-wider">
                Subtotal
              </span>
              <span className="font-display text-xl font-bold text-white tracking-tight">
                {formattedSubtotal}
              </span>
            </div>

            {member ? (
              isFirstOrderEligible && (
                <div className="rounded-xl bg-cyan-400/15 border border-cyan-200/35 px-3 py-2 text-[11px] font-display text-cyan-100 flex items-center justify-between gap-2">
                  <span>1st order 10% off ready at checkout</span>
                  <span className="font-mono font-bold text-white">BH-DETECTED</span>
                </div>
              )
            ) : (
              <button
                type="button"
                onClick={() => {
                  setIsBagOpen(false);
                  setIsMemberModalOpen(true);
                }}
                className="w-full rounded-xl bg-white/10 hover:bg-white/15 border border-white/25 px-3 py-2 text-[11px] font-display text-cyan-100 flex items-center justify-between gap-2 cursor-pointer transition-colors"
              >
                <span>Become a member · 10% off first order</span>
                <span className="font-display font-bold text-white underline whitespace-nowrap">JOIN AND GET A CODE</span>
              </button>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-2.5 mt-2">
              <button
                type="button"
                onClick={handleProceedToCheckout}
                onPointerEnter={prefetchCheckoutView}
                onFocus={prefetchCheckoutView}
                disabled={validating}
                className="selected-reveal-capsule w-full py-3.5 px-5 rounded-[0.25rem] text-white font-grotesk text-[15px] font-bold tracking-wider transition-all cursor-pointer active:scale-98 disabled:opacity-50 flex items-center justify-center gap-1.5 uppercase"
              >
                <span>{validating ? 'Verifying bag…' : 'Checkout'}</span>
                {!validating && (
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                )}
              </button>

              <button
                type="button"
                onClick={handleContinueShopping}
                className="w-full py-2.5 text-xs font-mono tracking-widest text-white/70 hover:text-white transition-colors cursor-pointer text-center outline-none"
              >
                Continue shopping
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
