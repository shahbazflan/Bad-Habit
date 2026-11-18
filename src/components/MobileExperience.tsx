import React, { useState, useRef, useEffect, useCallback, lazy, Suspense } from 'react';
import { PRODUCTS, Product } from '../data/products';
import { useCart } from '../context/CartContext';
import { MobileHero } from './MobileHero';
import { MobileCategorySection, CategoryId } from './MobileCategorySection';
import { MobileHeader } from './MobileHeader';
import type { PolicyType } from './PolicyModal';
import { preloadCategoryImages, preloadProductDetailImages } from '../utils/preloadImages';

const MobileProductGrid = lazy(() =>
  import('./MobileProductGrid').then((m) => ({ default: m.MobileProductGrid }))
);
const MobileProductDetail = lazy(() =>
  import('./MobileProductDetail').then((m) => ({ default: m.MobileProductDetail }))
);
const MobileShoppingBag = lazy(() =>
  import('./MobileShoppingBag').then((m) => ({ default: m.MobileShoppingBag }))
);
const MobileNavDrawer = lazy(() =>
  import('./MobileNavDrawer').then((m) => ({ default: m.MobileNavDrawer }))
);
const PolicyModal = lazy(() =>
  import('./PolicyModal').then((m) => ({ default: m.PolicyModal }))
);
const PairStudio = lazy(() =>
  import('./PairStudio').then((m) => ({ default: m.PairStudio }))
);

export type MobileActiveView = 'home' | 'category' | 'product' | 'bag' | 'pair';

/**
 * MobileExperience
 * 
 * Mobile Architecture:
 * 1. Opening hero (100svh, supplied model cutout, "YOU KNOW YOU WANT IT", "Explore collection ->")
 * 2. Shop by category (Stacked horizontal tiles: Make a pair, Trousers, Shirts, Hoodies & Sweatshirts)
 * 3. Category product grid (translucent glass cards, full garments, white prices)
 * 4. Product details (large centered garment, name, white-text price capsule, size buttons, Add to bag, Pair button)
 * 5. Make a Pair studio (live Shirt + Trousers dual view, 15% flat off)
 * 6. Shopping bag (translucent panel, line totals, 15% pair discount, checkout)
 */
export const MobileExperience: React.FC = () => {
  const { cartCount, setIsCheckoutOpen } = useCart();

  const [activeView, setActiveView] = useState<MobileActiveView>('home');
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>('trousers');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [pairSeedShirt, setPairSeedShirt] = useState<Product | null>(null);
  const [pairSeedTrouser, setPairSeedTrouser] = useState<Product | null>(null);
  const [pairInitialMode, setPairInitialMode] = useState<'summer' | 'winter'>('summer');
  const [isNavDrawerOpen, setIsNavDrawerOpen] = useState(false);
  const [activePolicy, setActivePolicy] = useState<PolicyType | null>(null);

  // Store previous view before opening bag or pair studio
  const previousViewRef = useRef<MobileActiveView>('home');
  const pairReturnViewRef = useRef<'home' | 'product'>('home');

  // Store grid scroll position so returning from product detail restores it
  const gridScrollPosition = useRef<number>(0);

  // Pre-warm grid & detail chunks gently after initial hero mount so navigation is zero-wait
  useEffect(() => {
    const warmChunks = () => {
      void import('./MobileProductGrid');
      void import('./MobileProductDetail');
    };
    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(warmChunks, { timeout: 600 });
      return () => window.cancelIdleCallback(id);
    }
    const timer = globalThis.setTimeout(warmChunks, 250);
    return () => globalThis.clearTimeout(timer);
  }, []);

  // Filter products by category
  const categoryProducts = React.useMemo(() => {
    if (selectedCategory === 'trousers') {
      return PRODUCTS.filter((p) => p.category === 'Trousers');
    }
    if (selectedCategory === 'hoodies') {
      return PRODUCTS.filter((p) => p.category === 'Hoodies');
    }
    if (selectedCategory === 'shirts') {
      return PRODUCTS.filter((p) => p.category === 'Shirts');
    }
    return [];
  }, [selectedCategory]);

  // Handle smooth scroll from "Explore collection" button to categories section
  const handleScrollToCategories = useCallback(() => {
    const el = document.getElementById('shop-categories');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  const handlePrefetchCategory = useCallback((catId: CategoryId) => {
    preloadCategoryImages(catId);
    if (catId === 'pair') {
      void import('./PairStudio');
    } else {
      void import('./MobileProductGrid');
      void import('./MobileProductDetail');
    }
  }, []);

  // Open Category view (Screen 3) or Make a Pair Studio
  const handleSelectCategory = useCallback((catId: CategoryId) => {
    preloadCategoryImages(catId);
    if (catId === 'pair') {
      void import('./PairStudio');
      setPairSeedShirt(null);
      setPairSeedTrouser(null);
      setPairInitialMode('summer');
      pairReturnViewRef.current = 'home';
      setActiveView('pair');
      window.scrollTo({ top: 0, behavior: 'auto' });
      return;
    }
    void import('./MobileProductGrid');
    void import('./MobileProductDetail');
    setSelectedCategory(catId);
    setSelectedProduct(null);
    setActiveView('category');
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  // Back to categories (returns to home view, scrolled to #shop-categories)
  const handleBackToCategories = useCallback(() => {
    setActiveView('home');
    setSelectedProduct(null);
    setTimeout(() => {
      handleScrollToCategories();
    }, 40);
  }, [handleScrollToCategories]);

  // Select Product (opens Screen 4: Product detail view)
  const handleSelectProduct = useCallback((product: Product) => {
    preloadProductDetailImages(product);
    gridScrollPosition.current = window.scrollY;
    setSelectedProduct(product);
    setActiveView('product');
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  // Switch colorway inside Product detail view without resetting category grid scroll position
  const handleSwitchProductColor = useCallback((product: Product) => {
    setSelectedProduct(product);
  }, []);

  // Open Make a Pair studio pre-seeded with Shirt, Hoodie, or Trouser from Product Detail
  const handlePairFromProduct = useCallback((product: Product) => {
    if (product.category === 'Shirts') {
      setPairSeedShirt(product);
      setPairSeedTrouser(null);
      setPairInitialMode('summer');
    } else if (product.category === 'Hoodies') {
      setPairSeedShirt(product);
      setPairSeedTrouser(null);
      setPairInitialMode('winter');
    } else if (product.category === 'Trousers') {
      setPairSeedShirt(null);
      setPairSeedTrouser(product);
      setPairInitialMode('summer');
    }
    pairReturnViewRef.current = 'product';
    setActiveView('pair');
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  // Back from Pair Studio
  const handleBackFromPair = useCallback(() => {
    if (pairReturnViewRef.current === 'product' && selectedProduct) {
      setActiveView('product');
      window.scrollTo({ top: 0, behavior: 'auto' });
    } else {
      handleBackToCategories();
    }
  }, [selectedProduct, handleBackToCategories]);

  // Back to Category from Product detail
  const handleBackToCategory = useCallback(() => {
    setActiveView('category');
    setSelectedProduct(null);
    setTimeout(() => {
      window.scrollTo({ top: gridScrollPosition.current, behavior: 'auto' });
    }, 40);
  }, []);

  // Open Shopping Bag (Screen 5)
  const handleOpenBag = useCallback(() => {
    if (activeView !== 'bag') {
      previousViewRef.current = activeView;
    }
    setActiveView('bag');
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [activeView]);

  // Close Shopping Bag / Continue Shopping
  const handleCloseBag = useCallback(() => {
    setActiveView(previousViewRef.current || 'home');
    if (previousViewRef.current === 'category') {
      setTimeout(() => {
        window.scrollTo({ top: gridScrollPosition.current, behavior: 'auto' });
      }, 40);
    }
  }, []);

  // Return to home
  const handleGoHome = useCallback(() => {
    setActiveView('home');
    setSelectedProduct(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Synchronize browser history for natural back-button support on mobile
  useEffect(() => {
    const handlePopState = () => {
      if (activeView === 'bag') {
        handleCloseBag();
      } else if (activeView === 'pair') {
        handleBackFromPair();
      } else if (activeView === 'product') {
        handleBackToCategory();
      } else if (activeView === 'category') {
        handleBackToCategories();
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [activeView, handleCloseBag, handleBackFromPair, handleBackToCategory, handleBackToCategories]);

  return (
    <div className={`relative w-full text-white min-h-[100dvh] overflow-x-clip selection:bg-white/20 transition-colors duration-300 ${
      activeView === 'home' ? 'bg-[#244b70]' : 'bg-[#1a3a5a]'
    }`}>
      {/* GLOBAL BACKGROUND: Keyblue architectural sky runway matching desktop exactly */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
        <img
          src="/clean_plate.jpg"
          alt="Architectural sky runway"
          className="w-full h-full object-cover object-center"
          decoding="async"
          fetchPriority="high"
        />
        {/* Skyblue theme wash: ONLY active for landing page (home view). Collections retain exact original theme */}
        {activeView === 'home' ? (
          <div className="absolute inset-0 bg-gradient-to-b from-[#1b3d5f]/25 via-[#22486c]/50 to-[#193a58]/95" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-b from-[#1b3d5f]/15 via-transparent to-[#0a1e30]/15" />
        )}
      </div>

      {/* CONTENT LAYER */}
      <div className="relative z-10 w-full min-h-[100dvh] flex flex-col">
        {/* 1. HOME VIEW: SCREEN 1 (HERO) + SCREEN 2 (CATEGORIES) IN NORMAL DOCUMENT FLOW */}
        {activeView === 'home' && (
          <div className="w-full flex flex-col">
            {/* SCREEN 1: Full-screen opening hero */}
            <MobileHero
              onExplore={handleScrollToCategories}
              onOpenMenu={() => setIsNavDrawerOpen(true)}
              onOpenBag={handleOpenBag}
              cartCount={cartCount}
            />

            {/* SCREEN 2: Shop by category (4 stacked horizontal tiles) */}
            <MobileCategorySection
              onSelectCategory={handleSelectCategory}
              onPrefetchCategory={handlePrefetchCategory}
            />
          </div>
        )}

        <Suspense fallback={null}>
          {/* 2. CATEGORY VIEW: SCREEN 3 (2-COLUMN PRODUCT GRID) */}
          {activeView === 'category' && (
            <div className="w-full flex flex-col min-h-[100dvh]">
              <MobileHeader
                onOpenMenu={() => setIsNavDrawerOpen(true)}
                onOpenBag={handleOpenBag}
                onGoHome={handleGoHome}
                cartCount={cartCount}
              />

              <MobileProductGrid
                categoryId={selectedCategory}
                products={categoryProducts}
                onSelectProduct={handleSelectProduct}
                onBackToCategories={handleBackToCategories}
              />
            </div>
          )}

          {/* 3. PRODUCT DETAIL VIEW: SCREEN 4 (MODEL FIRST DETAIL) */}
          {activeView === 'product' && selectedProduct && (
            <div className="w-full flex flex-col min-h-[100dvh]">
              <MobileHeader
                onOpenMenu={() => setIsNavDrawerOpen(true)}
                onOpenBag={handleOpenBag}
                onGoHome={handleGoHome}
                cartCount={cartCount}
              />

              <MobileProductDetail
                product={selectedProduct}
                categoryId={selectedCategory}
                onBack={handleBackToCategory}
                onOpenBag={handleOpenBag}
                onSelectProduct={handleSwitchProductColor}
                onPairProduct={handlePairFromProduct}
              />
            </div>
          )}

          {/* 4. MAKE A PAIR STUDIO */}
          {activeView === 'pair' && (
            <div className="w-full flex flex-col min-h-[100dvh]">
              <MobileHeader
                onOpenMenu={() => setIsNavDrawerOpen(true)}
                onOpenBag={handleOpenBag}
                onGoHome={handleGoHome}
                cartCount={cartCount}
              />

              <PairStudio
                initialTop={pairSeedShirt}
                initialTrouser={pairSeedTrouser}
                initialMode={pairInitialMode}
                onBack={handleBackFromPair}
                onOpenBag={handleOpenBag}
                backLabel={pairReturnViewRef.current === 'product' ? 'Back to article' : 'Back to categories'}
              />
            </div>
          )}

          {/* 5. SHOPPING BAG VIEW: SCREEN 5 (TRANSLUCENT GLASS BAG PANEL) */}
          {activeView === 'bag' && (
            <div className="w-full flex flex-col min-h-[100dvh]">
              <MobileHeader
                onOpenMenu={() => setIsNavDrawerOpen(true)}
                onOpenBag={handleOpenBag}
                onGoHome={handleGoHome}
                cartCount={cartCount}
              />

              <MobileShoppingBag
                onContinueShopping={handleCloseBag}
                onProceedToCheckout={() => setIsCheckoutOpen(true)}
              />
            </div>
          )}
        </Suspense>
      </div>

      {/* Slideout Mobile Navigation Drawer */}
      <Suspense fallback={null}>
        {isNavDrawerOpen && (
          <MobileNavDrawer
            isOpen={isNavDrawerOpen}
            onClose={() => setIsNavDrawerOpen(false)}
            onSelectCategory={handleSelectCategory}
            onOpenBag={handleOpenBag}
            onOpenPolicy={(type) => setActivePolicy(type)}
            onGoHome={handleGoHome}
            cartCount={cartCount}
          />
        )}

        {/* Policy Modal Overlay */}
        {activePolicy && (
          <PolicyModal type={activePolicy} onClose={() => setActivePolicy(null)} />
        )}
      </Suspense>
    </div>
  );
};
