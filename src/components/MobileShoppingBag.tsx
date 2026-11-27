import React, { useState, useRef, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useMember } from '../context/MemberContext';
import { PRODUCTS, getProductSubtitle } from '../data/products';
import { SmartImage } from './SmartImage';

const prefetchCheckoutView = () => {
  void import('./CheckoutView').catch(() => {});
};

interface MobileShoppingBagProps {
  onContinueShopping: () => void;
  onProceedToCheckout: () => void;
}

export const MobileShoppingBag: React.FC<MobileShoppingBagProps> = ({
  onContinueShopping,
  onProceedToCheckout,
}) => {
  const {
    items,
    updateQuantity,
    removeFromCart,
    rawSubtotal,
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
    if (items.length > 0) {
      prefetchCheckoutView();
    }
    return () => {
      mountedRef.current = false;
      validateAbortRef.current?.abort();
    };
  }, [items.length]);

  const handleCheckout = () => {
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

    onProceedToCheckout();
  };

  return (
    <div className="w-full text-white px-4 py-4 select-none pb-28">
      {/* "Shopping bag" Heading matching Phone 5 */}
      <div className="mb-4">
        <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-white">
          Shopping bag
        </h1>
      </div>

      {/* Validation Error Notice if any */}
      {validationError && (
        <div className="mb-4 p-3 rounded-xl bg-red-950/70 border border-red-500/40 text-red-200 text-xs font-mono">
          {validationError}
        </div>
      )}

      {/* Main Translucent Glass Bag Panel matching Phone 5 */}
      <div className="w-full rounded-[0.5rem] bg-white/[0.12] border border-white/20 backdrop-blur-xl p-4 sm:p-5 shadow-[0_8px_32px_rgba(4,24,43,0.3)] flex flex-col">
        {items.length === 0 ? (
          /* Empty State */
          <div className="py-12 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-white/[0.10] border border-white/20 flex items-center justify-center mb-3 text-white/70">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
            </div>
            <p className="font-display text-base font-semibold text-white mb-1">
              Your bag is empty
            </p>
            <p className="text-xs font-mono text-white/60 mb-6">
              Explore our architectural luxury silhouettes.
            </p>
            <button
              type="button"
              onClick={onContinueShopping}
              className="selected-reveal-capsule px-5 py-2 rounded-[0.25rem] text-white font-grotesk font-semibold text-[13px] tracking-wider uppercase transition-all active:scale-95 cursor-pointer shadow-lg"
            >
              Explore collection
            </button>
          </div>
        ) : (
          /* Populated Cart State matching Phone 5 */
          <>
            {/* Items List */}
            <div className="flex flex-col gap-3">
              {items.map((item) => {
                const lineTotal = item.price * item.quantity;
                return (
                  <div
                    key={`${item.productId}-${item.size}`}
                    className="relative w-full rounded-[0.5rem] bg-white/[0.08] border border-white/15 p-3 flex items-center gap-3.5 transition-all"
                  >
                    {/* Thumbnail in rounded container */}
                    <div className="relative w-16 h-20 rounded-lg bg-white/[0.06] border border-white/10 flex items-center justify-center p-1 shrink-0 overflow-hidden">
                      <SmartImage
                        src={item.image}
                        alt={item.name}
                        className="max-h-full max-w-full object-contain"
                        sizes="64px"
                        skeletonClassName="inset-1 rounded-md"
                        loading="lazy"
                        decoding="async"
                      />
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0 pr-6">
                      <h3 className="font-display text-xs sm:text-sm font-bold text-white tracking-tight truncate">
                        {item.name}
                      </h3>
                      {getProductSubtitle(item.productId) && (
                        <p className="text-[10.5px] font-sans text-white/70 truncate">
                          {getProductSubtitle(item.productId)}
                        </p>
                      )}
                      <p className="text-[11px] font-mono text-white/80 mt-0.5">
                        Size: {item.size}
                      </p>

                      {/* Working Quantity Controls */}
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[11px] font-mono text-white/70">Quantity:</span>
                        <div className="flex items-center rounded-md bg-white/[0.10] border border-white/20 p-0.5">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.productId, item.size, item.quantity - 1)}
                            className="w-5 h-5 flex items-center justify-center text-white/80 hover:text-white active:scale-90 transition-transform cursor-pointer"
                            aria-label="Decrease quantity"
                          >
                            <span className="text-xs font-mono font-bold leading-none">-</span>
                          </button>
                          <span className="w-5 text-center text-xs font-mono font-bold text-white">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.productId, item.size, item.quantity + 1)}
                            className="w-5 h-5 flex items-center justify-center text-white/80 hover:text-white active:scale-90 transition-transform cursor-pointer"
                            aria-label="Increase quantity"
                          >
                            <span className="text-xs font-mono font-bold leading-none">+</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Trash / Remove Control in top right */}
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.productId, item.size)}
                      className="absolute top-3 right-3 text-white/50 hover:text-red-300 transition-colors cursor-pointer p-1"
                      aria-label={`Remove ${item.name} (${item.size}) from bag`}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>

                    {/* Price in lower right */}
                    <div className="absolute bottom-3 right-3 text-right">
                      <span className="text-xs sm:text-sm font-mono font-semibold text-white">
                        PKR {lineTotal.toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Subtotal & Delivery Summary matching Phone 5 */}
            <div className="mt-5 pt-3.5 border-t border-white/15 flex flex-col gap-2">
              {pairDiscount > 0 && (
                <>
                  <div className="flex items-center justify-between text-xs font-mono text-white/75">
                    <span>Articles Total</span>
                    <span>{formattedRawSubtotal || `PKR ${rawSubtotal.toLocaleString()}`}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono text-emerald-200 font-semibold">
                    <span>Pair Discount (15% Off · {pairCount} {pairCount === 1 ? 'pair' : 'pairs'})</span>
                    <span>-{formattedPairDiscount}</span>
                  </div>
                </>
              )}
              <div className="flex items-center justify-between text-xs sm:text-sm font-mono">
                <span className="text-white/80">Subtotal</span>
                <span className="font-bold text-white tracking-wide">{formattedSubtotal}</span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-white/60">Delivery</span>
                <span className="text-white/80">Calculated at checkout</span>
              </div>
            </div>

            {member ? (
              isFirstOrderEligible && (
                <div className="mt-3 rounded-[0.5rem] bg-cyan-400/15 border border-cyan-200/35 px-3 py-2 text-[11px] font-display text-cyan-100 flex items-center justify-between gap-2">
                  <span>1st order 10% off at checkout</span>
                  <span className="font-mono font-bold text-white">BH-DETECTED</span>
                </div>
              )
            ) : (
              <button
                type="button"
                onClick={() => setIsMemberModalOpen(true)}
                className="w-full mt-3 rounded-[0.5rem] bg-white/10 hover:bg-white/15 border border-white/25 px-3 py-2 text-[11px] font-display text-cyan-100 flex items-center justify-between gap-2 cursor-pointer transition-colors"
              >
                <span>Become a member · 10% off first order</span>
                <span className="font-display font-bold text-white underline whitespace-nowrap">JOIN AND GET A CODE</span>
              </button>
            )}

            {/* Wide Glass Checkout Button matching Phone 5 */}
            <button
              type="button"
              onClick={handleCheckout}
              onPointerEnter={prefetchCheckoutView}
              onTouchStart={prefetchCheckoutView}
              onFocus={prefetchCheckoutView}
              disabled={validating}
              className="selected-reveal-capsule w-full py-3 px-5 rounded-[0.25rem] text-white font-grotesk font-semibold text-[15px] sm:text-[16.5px] tracking-tight flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer outline-none mt-5"
              aria-label="Proceed to checkout"
            >
              <span>{validating ? 'Verifying bag...' : 'Checkout'}</span>
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </button>

            {/* Continue Shopping Link centered beneath */}
            <button
              type="button"
              onClick={onContinueShopping}
              className="text-xs font-mono text-white/70 hover:text-white underline underline-offset-4 text-center mt-3 py-1 cursor-pointer transition-colors"
            >
              Continue shopping
            </button>
          </>
        )}
      </div>
    </div>
  );
};
