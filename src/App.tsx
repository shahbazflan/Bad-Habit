/**
 * BAD HABIT — Architectural Runway, Showroom & E-Commerce Flow
 *
 * Supports:
 * - Mobile (< 768px): Dedicated Opening Hero -> Categories -> 2-Column Product Grid -> Product Detail
 * - Desktop (>= 768px): Signature Architectural Elevator Experience (Hero Floor -> Showroom Floor)
 */

import { useState, useEffect, Suspense } from 'react';
import { CartProvider, useCart } from './context/CartContext';
import { MemberProvider, useMember } from './context/MemberContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { preloadGarmentImages } from './utils/preloadImages';
import { lazyWithRetry } from './utils/lazyWithRetry';
import { OfflineIndicator } from './components/OfflineIndicator';

const loadMobileExperience = () =>
  import('./components/MobileExperience').then((m) => ({ default: m.MobileExperience }));
const loadDesktopExperience = () =>
  import('./components/DesktopShowroomExperience').then((m) => ({
    default: m.DesktopShowroomExperience,
  }));

// Start downloading the active viewport experience immediately in parallel with boot
if (typeof window !== 'undefined') {
  if (window.innerWidth < 768) {
    void loadMobileExperience().catch(() => {});
  } else {
    void loadDesktopExperience().catch(() => {});
  }
}

const MobileExperience = lazyWithRetry(loadMobileExperience);
const DesktopShowroomExperience = lazyWithRetry(loadDesktopExperience);
const AddToCartModal = lazyWithRetry(() =>
  import('./components/AddToCartModal').then((m) => ({ default: m.AddToCartModal }))
);
const ShoppingBagDrawer = lazyWithRetry(() =>
  import('./components/ShoppingBagDrawer').then((m) => ({ default: m.ShoppingBagDrawer }))
);
const CheckoutView = lazyWithRetry(() =>
  import('./components/CheckoutView').then((m) => ({ default: m.CheckoutView }))
);
const OrderConfirmationView = lazyWithRetry(() =>
  import('./components/OrderConfirmationView').then((m) => ({
    default: m.OrderConfirmationView,
  }))
);
const MemberAuthModal = lazyWithRetry(() =>
  import('./components/MemberAuthModal').then((m) => ({ default: m.MemberAuthModal }))
);
const WishlistDrawer = lazyWithRetry(() =>
  import('./components/WishlistDrawer').then((m) => ({ default: m.WishlistDrawer }))
);

function MainRouter() {
  const { recentlyAddedItem, isBagOpen, isCheckoutOpen, confirmedOrder } = useCart();
  const { isMemberModalOpen, isWishlistOpen, wishlistNotice } = useMember();

  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false;
  });

  useEffect(() => {
    preloadGarmentImages();
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <Suspense fallback={null}>
      {isMobile ? (
        <ErrorBoundary sectionName="Mobile Showroom">
          <MobileExperience />
        </ErrorBoundary>
      ) : (
        <ErrorBoundary sectionName="Desktop Showroom">
          <DesktopShowroomExperience />
        </ErrorBoundary>
      )}

      {/* On-demand Cart & Checkout Overlay Chunks */}
      {!isMobile && recentlyAddedItem && (
        <ErrorBoundary compact sectionName="Added to Bag">
          <AddToCartModal />
        </ErrorBoundary>
      )}
      {!isMobile && isBagOpen && (
        <ErrorBoundary compact sectionName="Shopping Bag">
          <ShoppingBagDrawer />
        </ErrorBoundary>
      )}
      {isMemberModalOpen && (
        <ErrorBoundary compact sectionName="Member Pass">
          <MemberAuthModal />
        </ErrorBoundary>
      )}
      {isWishlistOpen && (
        <ErrorBoundary compact sectionName="Wishlist">
          <WishlistDrawer />
        </ErrorBoundary>
      )}
      {isCheckoutOpen && (
        <ErrorBoundary sectionName="Checkout">
          <CheckoutView />
        </ErrorBoundary>
      )}
      {confirmedOrder && (
        <ErrorBoundary sectionName="Order Confirmation">
          <OrderConfirmationView />
        </ErrorBoundary>
      )}

      {wishlistNotice && (
        <div
          role="status"
          className="glass-capsule fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] px-4.5 py-2 text-white text-[13px] font-grotesk font-semibold shadow-2xl pointer-events-none flex items-center gap-1.5 whitespace-nowrap"
        >
          <svg className="w-3.5 h-3.5 text-rose-400 shrink-0" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
          <span>{wishlistNotice}</span>
        </div>
      )}

      <OfflineIndicator />
    </Suspense>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <MemberProvider>
        <CartProvider>
          <MainRouter />
        </CartProvider>
      </MemberProvider>
    </ErrorBoundary>
  );
}
