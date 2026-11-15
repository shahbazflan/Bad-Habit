import React from 'react';
import { useCart } from '../context/CartContext';

export const AddToCartModal: React.FC = () => {
  const {
    recentlyAddedItem,
    setRecentlyAddedItem,
    setIsBagOpen,
    setIsCheckoutOpen,
  } = useCart();

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

  if (!recentlyAddedItem || !isDesktop) return null;

  const handleContinueShopping = () => {
    setRecentlyAddedItem(null);
  };

  const handleViewBag = () => {
    setRecentlyAddedItem(null);
    setIsBagOpen(true);
  };

  const handleCheckout = () => {
    setRecentlyAddedItem(null);
    setIsBagOpen(false);
    setIsCheckoutOpen(true);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="Item added to shopping bag"
    >
      {/* Compact Glass Modal Panel */}
      <div className="relative w-full max-w-sm rounded-3xl p-6 glass-capsule bg-[#0c1e30]/85 border border-white/35 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.45)] text-white select-none">
        {/* Visible Close Button */}
        <button
          type="button"
          onClick={handleContinueShopping}
          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer outline-none"
          aria-label="Close dialog"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header: "Added to your bag" */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 rounded-full bg-cyan-300 shadow-[0_0_8px_#67e8f9]" />
          <span className="font-display text-xs font-mono uppercase tracking-[0.2em] text-cyan-300 font-semibold">
            Added to your bag
          </span>
        </div>

        {/* Product Details: Thumbnail, Name, Size, Qty, Price */}
        <div className="flex items-center gap-4 py-3 border-y border-white/15 my-2">
          <div className="w-16 h-20 shrink-0 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center p-1 overflow-hidden">
            <img
              src={recentlyAddedItem.image}
              alt={recentlyAddedItem.name}
              className="w-full h-full object-contain select-none"
            />
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <h4 className="font-display text-sm font-bold text-white tracking-tight truncate">
              {recentlyAddedItem.name}
            </h4>
            <div className="flex items-center gap-2 mt-1 text-xs text-white/75 font-mono">
              <span className="px-2 py-0.5 rounded bg-white/10 text-white font-semibold">
                Size {recentlyAddedItem.size}
              </span>
              <span>Qty: {recentlyAddedItem.quantity}</span>
            </div>
            <div className="font-display text-sm font-bold text-white mt-1.5 tracking-tight">
              {recentlyAddedItem.formattedPrice}
            </div>
          </div>
        </div>

        {/* Action Controls: Checkout, View Shopping Bag, Continue Shopping */}
        <div className="flex flex-col gap-2.5 mt-5">
          {/* Checkout Button */}
          <button
            type="button"
            onClick={handleCheckout}
            className="selected-reveal-capsule w-full py-3 px-4 text-sm font-bold tracking-wide text-white transition-all cursor-pointer outline-none shadow-[0_6px_20px_rgba(7,27,45,0.3)] active:scale-98"
          >
            Checkout
          </button>

          {/* View Shopping Bag Button */}
          <button
            type="button"
            onClick={handleViewBag}
            className="w-full py-2.5 px-4 rounded-full text-xs font-mono font-medium tracking-wider text-white/90 bg-white/10 hover:bg-white/20 border border-white/20 transition-all cursor-pointer outline-none"
          >
            View shopping bag
          </button>

          {/* Continue Shopping Button */}
          <button
            type="button"
            onClick={handleContinueShopping}
            className="w-full py-2 text-xs font-mono tracking-widest text-white/60 hover:text-white transition-colors cursor-pointer text-center outline-none mt-1"
          >
            Continue shopping
          </button>
        </div>
      </div>
    </div>
  );
};
