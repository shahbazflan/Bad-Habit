/**
 * BAD HABIT — Architectural Runway, Showroom & E-Commerce Flow
 *
 * Supports:
 * - Mobile (< 768px): Dedicated Opening Hero -> Categories -> 2-Column Product Grid -> Product Detail
 * - Desktop (>= 768px): Signature Architectural Elevator Experience (Hero Floor -> Showroom Floor)
 */

import { useState, useEffect, lazy, Suspense } from 'react';
import { CartProvider, useCart } from './context/CartContext';
import { preloadGarmentImages } from './utils/preloadImages';

const MobileExperience = lazy(() =>
  import('./components/MobileExperience').then((m) => ({ default: m.MobileExperience }))
);
const DesktopShowroomExperience = lazy(() =>
  import('./components/DesktopShowroomExperience').then((m) => ({
    default: m.DesktopShowroomExperience,
  }))
);
const AddToCartModal = lazy(() =>
  import('./components/AddToCartModal').then((m) => ({ default: m.AddToCartModal }))
);
const ShoppingBagDrawer = lazy(() =>
  import('./components/ShoppingBagDrawer').then((m) => ({ default: m.ShoppingBagDrawer }))
);
const CheckoutView = lazy(() =>
  import('./components/CheckoutView').then((m) => ({ default: m.CheckoutView }))
);
const OrderConfirmationView = lazy(() =>
  import('./components/OrderConfirmationView').then((m) => ({
    default: m.OrderConfirmationView,
  }))
);

function MainRouter() {
  const { recentlyAddedItem, isBagOpen, isCheckoutOpen, confirmedOrder } = useCart();

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
      {isMobile ? <MobileExperience /> : <DesktopShowroomExperience />}

      {/* On-demand Cart & Checkout Overlay Chunks */}
      {!isMobile && recentlyAddedItem && <AddToCartModal />}
      {!isMobile && isBagOpen && <ShoppingBagDrawer />}
      {isCheckoutOpen && <CheckoutView />}
      {confirmedOrder && <OrderConfirmationView />}
    </Suspense>
  );
}

export default function App() {
  return (
    <CartProvider>
      <MainRouter />
    </CartProvider>
  );
}
