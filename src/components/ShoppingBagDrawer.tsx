import React, { useState } from 'react';
import { useCart } from '../context/CartContext';

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

  const [validating, setValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // On mobile (< 768px), shopping bag is handled as dedicated Screen 5 in MobileExperience
  const [isDesktop, setIsDesktop] = React.useState(() => {
    if (typeof window !== 'undefined') return window.innerWidth >= 768;
    return true;
  });

  React.useEffect(() => {
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

  const handleProceedToCheckout = async () => {
    if (items.length === 0) return;
    setValidating(true);
    setValidationError(null);

    try {
      // Revalidate prices and availability with server before checkout
      const res = await fetch('/api/cart/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });

      const data = await res.json();
      if (!res.ok || !data.valid) {
        setValidationError(data.error || 'Cart validation failed. Please check your items.');
        setValidating(false);
        return;
      }

      setIsBagOpen(false);
      setIsCheckoutOpen(true);
    } catch {
      // If server unreachable, proceed gracefully
      setIsBagOpen(false);
      setIsCheckoutOpen(true);
    } finally {
      setValidating(false);
    }
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
            <span className="text-xs font-mono text-white bg-white/20 border border-white/30 px-2.5 py-0.5 rounded-full">
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
                className="selected-reveal-capsule px-6 py-2.5 text-xs font-semibold text-white tracking-wider"
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
                  <div className="w-20 h-24 shrink-0 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center p-1.5 overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-contain select-none"
                    />
                  </div>

                  {/* Info & Controls */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between h-full">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-display text-sm font-bold text-white tracking-tight truncate">
                          {item.name}
                        </h4>
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
                      <div className="flex items-center p-0.5 rounded-full bg-white/10 border border-white/15">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.productId, item.size, item.quantity - 1)}
                          className="w-7 h-7 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                          aria-label="Decrease quantity"
                        >
                          -
                        </button>
                        <span className="w-8 text-center text-xs font-mono font-bold text-white">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.productId, item.size, item.quantity + 1)}
                          className="w-7 h-7 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
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

            {/* Action Buttons */}
            <div className="flex flex-col gap-2.5 mt-2">
              <button
                type="button"
                onClick={handleProceedToCheckout}
                disabled={validating}
                className="w-full py-4 px-6 rounded-full bg-white text-slate-900 font-display text-sm font-bold tracking-wider hover:bg-white/90 transition-all cursor-pointer shadow-[0_10px_30px_rgba(4,24,43,0.25)] active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2 uppercase"
              >
                <span>{validating ? 'Verifying bag…' : 'Checkout'}</span>
                {!validating && (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
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
