/**
 * BAD HABIT — Lower Architectural Showroom
 * 
 * Supports:
 * - Desktop (>= 768px):
 *   • Categories View matching mobile ("Shop by category" with new widescreen covers from Wistia link)
 *   • Trousers Collection with discrete pagination & filter pills
 *   • Article Reveal: 100% garment-only (ALL models removed), featuring transparent clothes cutouts
 *     and interactive multi-angle detail gallery (Front, Back, Waistband/Pocket close-ups, Grid)
 * - Mobile (< 768px):
 *   • Clean keyblue theme matching desktop
 *   • Garment-only display with zero models
 *   • Smooth touch swipe & responsive layout
 */

import React, { useState, useEffect, useRef, Suspense } from 'react';
import {
  PRODUCTS,
  MAIN_COLLECTION,
  HOODIE_PRODUCTS,
  SHIRT_PRODUCTS,
  getColorVariants,
  getGarmentCardFrame,
  getShirtDetailImageClass,
  withAssetVersion,
  Product,
} from '../data/products';
import { CATEGORY_ITEMS, CategoryItem } from './MobileCategorySection';
import { ColorSwatchRail } from './ColorSwatchRail';
import { useCart } from '../context/CartContext';
import { useMember } from '../context/MemberContext';
import { BrandLogo } from './BrandLogo';
import { CleanPlatePicture } from './CleanPlatePicture';
import { SmartImage } from './SmartImage';
import { PrecisionZoomStage } from './PrecisionZoomStage';
import { ErrorBoundary } from './ErrorBoundary';
import {
  preloadCategoryImages,
  preloadProductDetailImages,
  preloadNextCarouselPage,
  preloadNextGalleryItem,
} from '../utils/preloadImages';
import { clearLastViewContentKey, trackPageView, trackViewContent } from '../utils/metaPixel';
import {
  findProductByPath,
  getShowroomSectionForProduct,
  pushHomeUrl,
  pushProductUrl,
  replaceProductUrl,
} from '../utils/productRouting';

import { lazyWithRetry } from '../utils/lazyWithRetry';

const PairStudio = lazyWithRetry(() =>
  import('./PairStudio').then((m) => ({ default: m.PairStudio }))
);
const SizeGuideModal = lazyWithRetry(() =>
  import('./SizeGuideModal').then((m) => ({ default: m.SizeGuideModal }))
);

interface ShowroomFloorProps {
  onReturnToHero: () => void;
  isFullyInView: boolean;
  activeFloor?: 'hero' | 'showroom';
  onNavigateToFloor?: (floor: 'hero' | 'showroom') => void;
}

export function ShowroomFloor({
  onReturnToHero,
  isFullyInView,
  activeFloor = 'hero',
}: ShowroomFloorProps) {
  const { cartCount, addToCart, isAdding, setIsBagOpen, isCheckoutOpen, confirmedOrder } = useCart();
  const {
    member,
    wishlistItems,
    isInWishlist,
    toggleWishlist,
    setIsMemberModalOpen,
    setIsWishlistOpen,
  } = useMember();
  const wishlistCount = wishlistItems.length;

  const initialUrlProduct = React.useMemo(
    () => (typeof window !== 'undefined' ? findProductByPath(window.location.pathname) : null),
    []
  );

  // Navigation state within showroom floor: 'categories' | 'trousers' | 'hoodies' | 'shirts' | 'pair'
  const [activeSection, setActiveSection] = useState<'categories' | 'trousers' | 'hoodies' | 'shirts' | 'pair'>(() =>
    initialUrlProduct ? getShowroomSectionForProduct(initialUrlProduct) : 'categories'
  );
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(() => initialUrlProduct);
  const [pairSeedShirt, setPairSeedShirt] = useState<Product | null>(null);
  const [pairSeedTrouser, setPairSeedTrouser] = useState<Product | null>(null);
  const [pairInitialMode, setPairInitialMode] = useState<'summer' | 'winter'>('summer');
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [selectedSize, setSelectedSize] = useState<string>('M');
  const [addedToCart, setAddedToCart] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(4);
  const [mobileIndex, setMobileIndex] = useState(0);
  const [curationModalCategory, setCurationModalCategory] = useState<CategoryItem | null>(null);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [isDetailZooming, setIsDetailZooming] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const prevColorGroupRef = useRef<string | null>(null);
  const pairReturnProductRef = useRef<Product | null>(null);
  const addedTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (addedTimerRef.current !== null) {
        window.clearTimeout(addedTimerRef.current);
      }
    };
  }, []);

  const activeProducts =
    activeSection === 'hoodies'
      ? HOODIE_PRODUCTS
      : activeSection === 'shirts'
      ? SHIRT_PRODUCTS
      : MAIN_COLLECTION;

  const selectedColorVariants = React.useMemo(
    () => (selectedProduct ? getColorVariants(selectedProduct) : []),
    [selectedProduct]
  );

  // Compile gallery of garment-only images for selected article:
  // 1st image: Front View (cleanly isolated front garment)
  // 2nd image: Back View / Front & Back showcase
  // 3rd+ images: High-definition detail close-ups
  const activeGallery: { label: string; src: string }[] = React.useMemo(() => {
    if (!selectedProduct) return [];
    const list: { label: string; src: string }[] = [
      { label: 'Front', src: selectedProduct.image },
    ];
    if (selectedProduct.backImage) {
      list.push({ label: 'Back', src: selectedProduct.backImage });
    } else if (selectedProduct.frontAndBackImage) {
      list.push({ label: 'Back', src: selectedProduct.frontAndBackImage });
    }
    if (selectedProduct.detailImages && selectedProduct.detailImages.length > 0) {
      selectedProduct.detailImages.forEach((img, idx) => {
        list.push({ label: `Details ${idx + 1}`, src: img });
      });
    }
    return list;
  }, [selectedProduct]);

  // Reset or preserve Front/Back angle when switching colorways vs opening a new article
  useEffect(() => {
    if (!selectedProduct) {
      prevColorGroupRef.current = null;
      setSelectedImageIndex(0);
      return;
    }
    if (selectedProduct.category === 'Trousers' || selectedProduct.category === 'Shirts') {
      void import('./SizeGuideModal').catch(() => {});
    }
    const sameGroup = prevColorGroupRef.current === selectedProduct.colorGroup;
    prevColorGroupRef.current = selectedProduct.colorGroup;
    if (!sameGroup) {
      setSelectedImageIndex(0);
    } else {
      setSelectedImageIndex((prev) => (prev < activeGallery.length ? prev : 0));
    }
    setSelectedSize('M');
    setAddedToCart(false);
    setIsSizeGuideOpen(false);
  }, [selectedProduct, activeGallery.length]);

  useEffect(() => {
    if (initialUrlProduct) {
      replaceProductUrl(initialUrlProduct);
    }
  }, [initialUrlProduct]);

  useEffect(() => {
    const handlePopState = () => {
      const nextProduct = findProductByPath(window.location.pathname);
      if (nextProduct) {
        setActiveSection(getShowroomSectionForProduct(nextProduct));
        setSelectedProduct(nextProduct);
      } else {
        setSelectedProduct(null);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (selectedProduct) {
      document.title = `${selectedProduct.name} — BAD HABIT`;
      trackViewContent({
        id: selectedProduct.id,
        name: selectedProduct.name,
        category: selectedProduct.category,
        price: selectedProduct.price,
      });
    } else {
      document.title = 'BAD HABIT';
      clearLastViewContentKey();
    }
  }, [selectedProduct]);

  useEffect(() => {
    if (activeFloor !== 'showroom' || isCheckoutOpen || confirmedOrder) return;
    if (selectedProduct) {
      trackPageView(`desktop:product:${selectedProduct.id}`);
    } else {
      trackPageView(`desktop:${activeSection}`);
    }
  }, [activeFloor, activeSection, selectedProduct, isCheckoutOpen, confirmedOrder]);

  // Smart preloading: only preload immediate next gallery item when detail reveal is open
  useEffect(() => {
    if (selectedProduct && activeGallery.length > 1) {
      preloadNextGalleryItem(activeGallery, selectedImageIndex);
    }
  }, [selectedProduct, activeGallery, selectedImageIndex]);

  // Smart preloading: only preload the immediate next carousel page when Showroom is in view
  useEffect(() => {
    if (
      isFullyInView &&
      !selectedProduct &&
      (activeSection === 'trousers' || activeSection === 'hoodies' || activeSection === 'shirts')
    ) {
      preloadNextCarouselPage(activeProducts, currentPage, itemsPerPage);
    }
  }, [isFullyInView, selectedProduct, activeSection, activeProducts, currentPage, itemsPerPage]);

  // Sync mobile index when selectedProduct changes
  useEffect(() => {
    if (selectedProduct) {
      if (selectedProduct.category === 'Hoodies' && activeSection !== 'hoodies') {
        setActiveSection('hoodies');
      } else if (selectedProduct.category === 'Shirts' && activeSection !== 'shirts') {
        setActiveSection('shirts');
      } else if (selectedProduct.category === 'Trousers' && activeSection !== 'trousers') {
        setActiveSection('trousers');
      }
      const list =
        selectedProduct.category === 'Hoodies'
          ? HOODIE_PRODUCTS
          : selectedProduct.category === 'Shirts'
          ? SHIRT_PRODUCTS
          : MAIN_COLLECTION;
      const idx = list.findIndex((p) => p.id === selectedProduct.id);
      if (idx !== -1) setMobileIndex(idx);
    }
  }, [selectedProduct, activeSection]);

  // Responsive items-per-page calculation matching original 4-across desktop showroom
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setItemsPerPage(1);
      } else if (window.innerWidth < 1024) {
        setItemsPerPage(2);
      } else {
        setItemsPerPage(4);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const totalPages = Math.max(1, Math.ceil(activeProducts.length / itemsPerPage));

  // Clamp current page if itemsPerPage or activeProducts changes
  useEffect(() => {
    if (currentPage >= totalPages) {
      setCurrentPage(Math.max(0, totalPages - 1));
    }
  }, [itemsPerPage, totalPages, currentPage]);

  const openProductRoute = (product: Product) => {
    preloadProductDetailImages(product);
    setSelectedProduct(product);
    pushProductUrl(product);
  };

  const closeProductRoute = () => {
    setSelectedProduct(null);
    pushHomeUrl();
  };

  const handleSelectCategory = (cat: 'categories' | 'trousers' | 'hoodies' | 'shirts' | 'pair') => {
    if (cat !== 'categories') {
      preloadCategoryImages(cat, PRODUCTS);
    }
    if (cat === 'pair') {
      setPairSeedShirt(null);
      setPairSeedTrouser(null);
      setPairInitialMode('summer');
      pairReturnProductRef.current = null;
    }
    setActiveSection(cat);
    closeProductRoute();
    setCurrentPage(0);
    setMobileIndex(0);
  };

  const handleOpenPairWithProduct = (product: Product) => {
    preloadCategoryImages('pair', PRODUCTS);
    pairReturnProductRef.current = product;
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
    closeProductRoute();
    setActiveSection('pair');
  };

  const handlePrefetchSection = (cat: 'categories' | 'trousers' | 'hoodies' | 'shirts' | 'pair') => {
    if (cat === 'categories') return;
    preloadCategoryImages(cat, PRODUCTS);
    if (cat === 'pair') {
      void import('./PairStudio').catch(() => {});
    }
  };

  const handleCategoryTileClick = (cat: CategoryItem) => {
    preloadCategoryImages(cat.id, PRODUCTS);
    if (cat.id === 'trousers') {
      setActiveSection('trousers');
      closeProductRoute();
    } else if (cat.id === 'hoodies') {
      setActiveSection('hoodies');
      closeProductRoute();
    } else if (cat.id === 'shirts') {
      setActiveSection('shirts');
      closeProductRoute();
    } else if (cat.id === 'pair') {
      handleSelectCategory('pair');
    } else {
      setCurationModalCategory(cat);
    }
  };

  // Discrete Page navigation (Desktop)
  const handlePrevDesktop = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (selectedProduct) return;
    setCurrentPage((prev) => (prev > 0 ? prev - 1 : totalPages - 1));
  };

  const handleNextDesktop = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (selectedProduct) return;
    setCurrentPage((prev) => (prev < totalPages - 1 ? prev + 1 : 0));
  };

  // Mobile Single Article Navigation
  const handlePrevMobile = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setMobileIndex((prev) => (prev > 0 ? prev - 1 : activeProducts.length - 1));
  };

  const handleNextMobile = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setMobileIndex((prev) => (prev < activeProducts.length - 1 ? prev + 1 : 0));
  };

  // Touch Swipe for Mobile Browsing
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - (touchStartY.current || 0);

    if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY) * 1.4) {
      if (deltaX < 0) {
        handleNextMobile();
      } else {
        handlePrevMobile();
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isFullyInView) return;
      if (selectedProduct) {
        if (e.key === 'Escape') closeProductRoute();
        return;
      }
      if (e.key === 'ArrowLeft') {
        handlePrevDesktop();
        handlePrevMobile();
      }
      if (e.key === 'ArrowRight') {
        handleNextDesktop();
        handleNextMobile();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullyInView, selectedProduct, totalPages, activeSection]);

  const handleAddToCart = async () => {
    if (!selectedProduct || selectedProduct.soldOut) return;
    if (!selectedSize) return;

    const numericPrice = parseInt(selectedProduct.price.replace(/[^\d]/g, ''), 10) || 6499;
    const formattedPrice = selectedProduct.price;

    setAddedToCart(true);
    await addToCart({
      productId: selectedProduct.id,
      name: selectedProduct.name,
      price: numericPrice,
      formattedPrice,
      size: selectedSize as 'S' | 'M' | 'L' | 'XL',
      image: selectedProduct.image,
    });
    if (addedTimerRef.current !== null) {
      window.clearTimeout(addedTimerRef.current);
    }
    addedTimerRef.current = window.setTimeout(() => {
      addedTimerRef.current = null;
      setAddedToCart(false);
    }, 2400);
  };

  const isRevealed = Boolean(selectedProduct);
  const currentGarmentImage = activeGallery[selectedImageIndex]?.src || selectedProduct?.image;

  // Split active products into discrete pages for desktop
  const pages: Product[][] = [];
  for (let i = 0; i < activeProducts.length; i += itemsPerPage) {
    pages.push(activeProducts.slice(i, i + itemsPerPage));
  }

  const currentMobileProduct = activeProducts[mobileIndex] || activeProducts[0];

  return (
    <section
      className="relative w-full h-[100vh] h-[100dvh] overflow-clip select-none"
      aria-label="BAD HABIT Lower Architectural Showroom"
    >
      {/* 1. ARCHITECTURAL SHOWROOM BACKGROUND (Keyblue Runway Sky & White Floor) */}
      <CleanPlatePicture
        alt="Architectural Showroom with sky and white floor"
        className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none z-[1]"
        sizes="100vw"
        loading={isFullyInView ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={isFullyInView ? 'high' : 'low'}
      />

      {/* Daylight Atmosphere matching keyblue theme */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#1b3d5f]/15 via-transparent to-[#0a1e30]/15 pointer-events-none z-[2]" />

      {/* Ceiling ambient architectural shadow */}
      <div className="absolute top-0 left-0 w-full h-[52px] bg-gradient-to-b from-black/20 via-sky-950/10 to-transparent pointer-events-none z-10" />

      {/* ======================================================== */}
      {/* HEADER BAR (Constant Top-Left Logo + Extreme-Left Nav)   */}
      {/* ======================================================== */}
      <header className="absolute top-0 left-0 w-full z-40 flex flex-col pointer-events-none">
        {/* Top Header Row */}
        <div className="w-full flex items-start justify-between px-5 sm:px-8 lg:px-10 pt-[calc(18px+env(safe-area-inset-top))] sm:pt-[calc(26px+env(safe-area-inset-top))]">
          {/* Top-Left Constant BAD HABIT Logo -> Always Returns Home */}
          <div className="pointer-events-auto select-none">
            <BrandLogo
              onClick={() => {
                closeProductRoute();
                setActiveSection('categories');
                onReturnToHero();
              }}
            />
          </div>

          {/* Top-Right Desktop Actions: Member, Wishlist, Bag (Runway L1/L2 Removed) */}
          <div className="hidden md:flex pointer-events-auto items-center gap-2">
            <button
              type="button"
              onClick={() => setIsMemberModalOpen(true)}
              className="glass-capsule glass-capsule-hover px-3.5 py-1.5 rounded-[0.25rem] flex items-center gap-1.5 text-[13px] font-grotesk font-semibold text-white cursor-pointer transition-all shadow-sm"
              aria-label={member ? 'View member pass' : 'Become a member for 10% off first order'}
            >
              <svg className="w-3.5 h-3.5 text-white shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
              <span>
                {member ? 'Member' : 'Become a Member · 10% Off'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setIsWishlistOpen(true)}
              className="glass-capsule glass-capsule-hover px-3.5 py-1.5 rounded-[0.25rem] flex items-center gap-1.5 text-[13px] font-grotesk font-semibold text-white cursor-pointer transition-all shadow-sm"
              aria-label={`Wishlist (${wishlistCount} items)`}
            >
              <svg
                className="w-3.5 h-3.5 text-red-500 fill-red-500"
                fill="currentColor"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
              <span>Wishlist{wishlistCount > 0 ? ` (${wishlistCount})` : ''}</span>
            </button>

            {cartCount > 0 && (
              <button
                type="button"
                onClick={() => setIsBagOpen(true)}
                className="glass-capsule glass-capsule-hover px-3.5 py-1.5 rounded-[0.25rem] flex items-center gap-1.5 text-[13px] font-grotesk font-semibold text-white animate-in fade-in cursor-pointer transition-all shadow-sm"
                aria-label={`Open shopping bag (${cartCount} items)`}
              >
                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <span>BAG ({cartCount})</span>
              </button>
            )}
          </div>

          {/* Right: Mobile Controls (Member, Wishlist, Bag — L1/L2 Removed) */}
          <div className="flex md:hidden pointer-events-auto items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsMemberModalOpen(true)}
              className="glass-capsule px-2.5 py-1 rounded-[0.25rem] flex items-center gap-1 text-[12px] font-grotesk font-semibold text-white cursor-pointer shadow-sm"
              aria-label={member ? 'Member pass' : 'Member login'}
            >
              <svg className="w-3 h-3 text-white shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
              <span>Member</span>
            </button>

            <button
              type="button"
              onClick={() => setIsWishlistOpen(true)}
              className="glass-capsule px-2.5 py-1 rounded-[0.25rem] flex items-center gap-1 text-[12px] font-grotesk font-semibold text-white cursor-pointer shadow-sm"
              aria-label="Wishlist"
            >
              <svg
                className="w-3 h-3 text-red-500 fill-red-500"
                fill="currentColor"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
              <span>{wishlistCount}</span>
            </button>

            {cartCount > 0 && (
              <button
                type="button"
                onClick={() => setIsBagOpen(true)}
                className="glass-capsule px-2.5 py-1 rounded-[0.25rem] flex items-center gap-1 text-[12px] font-grotesk font-semibold text-white cursor-pointer shadow-sm"
                aria-label={`Open shopping bag (${cartCount} items)`}
              >
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <span>({cartCount})</span>
              </button>
            )}
          </div>
        </div>

        {/* Extreme-Left Enlarged Category Navigation Bar (Desktop Only) */}
        {!isRevealed && (
          <div className="hidden md:flex w-full justify-start px-5 sm:px-8 lg:px-10 mt-3 pointer-events-none">
            <nav
              aria-label="Showroom categories"
              className="pointer-events-auto glass-capsule p-1 rounded-[0.25rem] flex items-center gap-1 select-none shadow-[0_12px_34px_rgba(4,24,43,0.22)]"
            >
              <button
                type="button"
                onClick={() => handleSelectCategory('categories')}
                className={`px-3 lg:px-4 py-1.5 lg:py-2 rounded-[0.25rem] font-grotesk text-[13px] lg:text-[15px] font-semibold tracking-tight whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeSection === 'categories'
                    ? 'bg-white/28 border border-white/80 text-white font-bold shadow-sm'
                    : 'text-white/80 hover:text-white hover:bg-white/15'
                }`}
              >
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.1">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                </svg>
                <span>Categories</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectCategory('pair')}
                onPointerEnter={() => handlePrefetchSection('pair')}
                onFocus={() => handlePrefetchSection('pair')}
                className={`px-3 lg:px-4 py-1.5 lg:py-2 rounded-[0.25rem] font-grotesk text-[13px] lg:text-[15px] font-semibold tracking-tight whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeSection === 'pair'
                    ? 'bg-white/28 border border-white/80 text-white font-bold shadow-sm'
                    : 'text-white/80 hover:text-white hover:bg-white/15'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${activeSection === 'pair' ? 'bg-white' : 'bg-white/60'}`} />
                <span>Make a pair</span>
                <span className="text-[12px] lg:text-[14px] font-grotesk font-extrabold px-2.5 lg:px-3 py-0.5 rounded-[0.25rem] bg-white/25 text-white border border-white/75">
                  15% OFF
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectCategory('trousers')}
                onPointerEnter={() => handlePrefetchSection('trousers')}
                onFocus={() => handlePrefetchSection('trousers')}
                className={`px-3 lg:px-4 py-1.5 lg:py-2 rounded-[0.25rem] font-grotesk text-[13px] lg:text-[15px] font-semibold tracking-tight whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeSection === 'trousers'
                    ? 'bg-white/28 border border-white/80 text-white font-bold shadow-sm'
                    : 'text-white/80 hover:text-white hover:bg-white/15'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${activeSection === 'trousers' ? 'bg-white' : 'bg-cyan-300'}`} />
                <span>Trousers</span>
                <span className="text-[12.5px] font-grotesk opacity-85">({MAIN_COLLECTION.length})</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectCategory('shirts')}
                onPointerEnter={() => handlePrefetchSection('shirts')}
                onFocus={() => handlePrefetchSection('shirts')}
                className={`px-3 lg:px-4 py-1.5 lg:py-2 rounded-[0.25rem] font-grotesk text-[13px] lg:text-[15px] font-semibold tracking-tight whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeSection === 'shirts'
                    ? 'bg-white/28 border border-white/80 text-white font-bold shadow-sm'
                    : 'text-white/80 hover:text-white hover:bg-white/15'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${activeSection === 'shirts' ? 'bg-white' : 'bg-emerald-300'}`} />
                <span>Shirts</span>
                <span className="text-[12.5px] font-grotesk opacity-85">({SHIRT_PRODUCTS.length})</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectCategory('hoodies')}
                onPointerEnter={() => handlePrefetchSection('hoodies')}
                onFocus={() => handlePrefetchSection('hoodies')}
                className={`px-3 lg:px-4 py-1.5 lg:py-2 rounded-[0.25rem] font-grotesk text-[13px] lg:text-[15px] font-semibold tracking-tight whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeSection === 'hoodies'
                    ? 'bg-white/28 border border-white/80 text-white font-bold shadow-sm'
                    : 'text-white/80 hover:text-white hover:bg-white/15'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${activeSection === 'hoodies' ? 'bg-white' : 'bg-indigo-300'}`} />
                <span>Hoodies & Sweatshirts</span>
                <span className="text-[12.5px] font-grotesk opacity-85">({HOODIE_PRODUCTS.length})</span>
              </button>
            </nav>
          </div>
        )}
      </header>

      {/* ======================================================== */}
      {/* 2. DESKTOP VIEW CONTAINER (Screens >= 768px)             */}
      {/* ======================================================== */}
      <div className="hidden md:block">

        {/* 2A. DESKTOP CATEGORIES VIEW (When activeSection === 'categories') */}
        {activeSection === 'categories' && !isRevealed && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-start pt-[144px] lg:pt-[152px] pb-5 px-4 sm:px-8 w-full max-w-[1720px] mx-auto select-none pointer-events-auto">
            {/* Header: Tightened directly below top bar */}
            <div className="text-center mb-2.5 lg:mb-3.5">
              <h2 className="font-display text-2xl sm:text-3xl lg:text-[32px] font-black tracking-tight text-white uppercase drop-shadow-[0_2px_12px_rgba(0,0,0,0.35)] leading-tight">
                SHOP BY CATEGORY
              </h2>
            </div>

            {/* Continuous 4-Panel Split Strip (Make a pair, Trousers, Shirts, Hoodies & Sweatshirts) */}
            <div className="w-[94%] max-w-[1640px] h-[min(calc(100vh-238px),37vw)] min-h-[370px] max-h-[600px] rounded-[0.5rem] overflow-hidden border border-white/25 shadow-[0_20px_60px_rgba(4,24,43,0.35)] grid grid-cols-4 divide-x divide-white/20 bg-gradient-to-b from-[#6ea8dc]/75 via-[#a6d2f3]/60 to-[#e6f1fa]/80 backdrop-blur-[3px]">
              {/* PANEL 1: MAKE A PAIR (15% OFF) */}
              <button
                type="button"
                onClick={() => handleCategoryTileClick(CATEGORY_ITEMS[0])}
                onPointerEnter={() => handlePrefetchSection('pair')}
                onFocus={() => handlePrefetchSection('pair')}
                className="group relative w-full h-full overflow-hidden cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-inset text-left bg-gradient-to-b from-[#5594cc]/35 via-transparent to-black/15"
                aria-label="Make a pair — 15% off"
              >
                {/* Clean Editorial 15% OFF Lockup in Upper-Left Corner */}
                <div className="absolute top-4 left-4 lg:top-5 lg:left-5 z-20 pointer-events-none">
                  <div className="font-poster-condensed not-italic text-white inline-flex items-end gap-1.5 leading-none whitespace-nowrap drop-shadow-[0_2px_12px_rgba(10,35,60,0.28)]">
                    <span className="font-extrabold text-[clamp(72px,6.4vw,116px)] leading-[0.78] tracking-[-0.02em] tabular-nums">
                      15%
                    </span>
                    <div className="flex flex-col items-stretch leading-none">
                      <span className="w-full h-[2px] bg-white mb-[4px]" aria-hidden="true" />
                      <span className="font-extrabold text-[clamp(28px,2.6vw,48px)] leading-[0.80] tracking-[0.02em] uppercase">
                        OFF
                      </span>
                    </div>
                  </div>
                </div>

                {/* Live Magnum Shirt + Classic Brown Trousers Showcase */}
                <div className="absolute inset-x-1 top-[86px] lg:top-[104px] bottom-[66px] flex items-center justify-center -space-x-3 pointer-events-none">
                  <SmartImage
                    src={(SHIRT_PRODUCTS.find((p) => p.id === 'BH-S05') || SHIRT_PRODUCTS[5]).image}
                    alt="Magnum Shirt pairing"
                    className="relative z-10 h-[86%] w-auto max-w-[54%] object-contain transition-transform duration-350 group-hover:scale-105"
                    sizes="(max-width: 1024px) 180px, 240px"
                    showSkeleton={false}
                    loading={isFullyInView ? 'eager' : 'lazy'}
                    decoding="async"
                    fetchPriority={isFullyInView ? 'auto' : 'low'}
                  />
                  <SmartImage
                    src={(MAIN_COLLECTION.find((p) => p.id === 'BH-T10') || MAIN_COLLECTION[4]).image}
                    alt="Classic Brown Trousers pairing"
                    className="h-[92%] w-auto max-w-[54%] object-contain transition-transform duration-350 group-hover:scale-105"
                    sizes="(max-width: 1024px) 180px, 240px"
                    showSkeleton={false}
                    loading={isFullyInView ? 'eager' : 'lazy'}
                    decoding="async"
                    fetchPriority={isFullyInView ? 'auto' : 'low'}
                  />
                </div>

                <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black/85 via-black/35 to-transparent pointer-events-none" />

                <div className="absolute inset-x-0 bottom-0 p-5 lg:p-6 flex items-end justify-between pointer-events-none z-10 gap-2">
                  <div>
                    <span className="font-display text-xl lg:text-2xl font-black tracking-wider text-white uppercase drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)] block leading-tight">
                      MAKE A PAIR
                    </span>
                    <span className="text-[13px] font-grotesk font-medium text-white flex items-baseline gap-1 mt-0.5">
                      <span>Get a flat</span>
                      <span className="text-[18.5px] font-grotesk font-black text-white leading-none">15%</span>
                      <span>off</span>
                    </span>
                  </div>
                  <div className="w-9 h-9 lg:w-10 lg:h-10 shrink-0 rounded-full border border-white/30 bg-white/10 backdrop-blur-md flex items-center justify-center text-white shadow-sm transition-all duration-300 group-hover:border-white/60 group-hover:bg-white/20">
                    <svg className="w-4 h-4 text-white transition-transform duration-300 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </div>
                </div>
              </button>

              {/* PANEL 2: TROUSERS (Ultra-HD Full-height Cutout) */}
              <button
                type="button"
                onClick={() => handleCategoryTileClick(CATEGORY_ITEMS[1])}
                onPointerEnter={() => handlePrefetchSection('trousers')}
                onFocus={() => handlePrefetchSection('trousers')}
                className="group relative w-full h-full overflow-hidden cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-inset text-left"
                aria-label="Shop Trousers Category"
              >
                <div className="absolute inset-0 pointer-events-none">
                  <SmartImage
                    src={withAssetVersion('/assets/categories/category_trousers_hd.webp')}
                    alt="BAD HABIT Trousers"
                    className="w-full h-full object-cover object-[center_top] select-none transition-transform duration-350 ease-out group-hover:scale-[1.03] origin-bottom motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                    sizes="(max-width: 1024px) 24vw, 410px"
                    skeletonClassName="inset-2 rounded-xl"
                    loading={isFullyInView ? 'eager' : 'lazy'}
                    decoding="async"
                    fetchPriority={isFullyInView ? 'auto' : 'low'}
                  />
                </div>
                <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black/80 via-black/35 to-transparent pointer-events-none" />

                {/* Bottom Baseline: Bold White Label & Glass Arrow Button */}
                <div className="absolute inset-x-0 bottom-0 p-5 lg:p-6 flex items-end justify-between pointer-events-none z-10 gap-2">
                  <span className="font-display text-xl lg:text-2xl font-black tracking-wider text-white uppercase drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
                    TROUSERS
                  </span>
                  <div className="w-9 h-9 lg:w-10 lg:h-10 shrink-0 rounded-full border border-white/30 bg-white/10 backdrop-blur-md flex items-center justify-center text-white shadow-sm transition-all duration-300 group-hover:border-white/60 group-hover:bg-white/20">
                    <svg className="w-4 h-4 text-white transition-transform duration-300 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </div>
                </div>
              </button>

              {/* PANEL 3: SHIRTS (Ultra-HD Full-height Model Cutout) */}
              <button
                type="button"
                onClick={() => handleCategoryTileClick(CATEGORY_ITEMS[2])}
                onPointerEnter={() => handlePrefetchSection('shirts')}
                onFocus={() => handlePrefetchSection('shirts')}
                className="group relative w-full h-full overflow-hidden cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-inset text-left"
                aria-label="Shop Shirts Category"
              >
                <div className="absolute inset-0 pt-3 px-1 flex items-end justify-center pointer-events-none">
                  <SmartImage
                    src={withAssetVersion('/assets/categories/category_shirts_v3.webp')}
                    alt="BAD HABIT Shirts"
                    className="h-full w-full object-contain object-bottom select-none transition-transform duration-350 ease-out group-hover:scale-[1.03] origin-bottom motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                    sizes="(max-width: 1024px) 24vw, 410px"
                    skeletonClassName="inset-2 rounded-xl"
                    loading={isFullyInView ? 'eager' : 'lazy'}
                    decoding="async"
                    fetchPriority={isFullyInView ? 'auto' : 'low'}
                  />
                </div>
                <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black/80 via-black/35 to-transparent pointer-events-none" />

                <div className="absolute inset-x-0 bottom-0 p-5 lg:p-6 flex items-end justify-between pointer-events-none z-10 gap-2">
                  <span className="font-display text-xl lg:text-2xl font-black tracking-wider text-white uppercase drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
                    SHIRTS
                  </span>
                  <div className="w-9 h-9 lg:w-10 lg:h-10 shrink-0 rounded-full border border-white/30 bg-white/10 backdrop-blur-md flex items-center justify-center text-white shadow-sm transition-all duration-300 group-hover:border-white/60 group-hover:bg-white/20">
                    <svg className="w-4 h-4 text-white transition-transform duration-300 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </div>
                </div>
              </button>

              {/* PANEL 4: HOODIES & SWEATSHIRTS (Isolated Standing Duo Cutout over Sky Theme) */}
              <button
                type="button"
                onClick={() => handleCategoryTileClick(CATEGORY_ITEMS[3])}
                onPointerEnter={() => handlePrefetchSection('hoodies')}
                onFocus={() => handlePrefetchSection('hoodies')}
                className="group relative w-full h-full overflow-hidden cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-inset text-left"
                aria-label="Shop Hoodies & Sweatshirts Category"
              >
                <div className="absolute inset-x-0 top-3 bottom-0 overflow-hidden pointer-events-none">
                  <div className="relative w-full h-full scale-[1.07] origin-[46%_0%] transition-transform duration-350 ease-out group-hover:scale-[1.10] motion-reduce:transition-none motion-reduce:group-hover:scale-[1.07]">
                    <SmartImage
                      src={withAssetVersion('/assets/categories/category_hoodies_v4.webp')}
                      alt="BAD HABIT Hoodies & Sweatshirts"
                      className="w-full h-full object-cover object-[46%_top] select-none"
                      sizes="(max-width: 1024px) 24vw, 410px"
                      skeletonClassName="inset-2 rounded-xl"
                      loading={isFullyInView ? 'eager' : 'lazy'}
                      decoding="async"
                      fetchPriority={isFullyInView ? 'auto' : 'low'}
                    />
                  </div>
                </div>
                <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black/80 via-black/35 to-transparent pointer-events-none" />

                <div className="absolute inset-x-0 bottom-0 p-5 lg:p-6 flex items-end justify-between pointer-events-none z-10 gap-2">
                  <span className="font-display text-lg lg:text-xl xl:text-2xl font-black tracking-wider text-white uppercase drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)] leading-tight">
                    HOODIES & SWEATSHIRTS
                  </span>
                  <div className="w-9 h-9 lg:w-10 lg:h-10 shrink-0 rounded-full border border-white/30 bg-white/10 backdrop-blur-md flex items-center justify-center text-white shadow-sm transition-all duration-300 group-hover:border-white/60 group-hover:bg-white/20">
                    <svg className="w-4 h-4 text-white transition-transform duration-300 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* DESKTOP MAKE A PAIR STUDIO */}
        {activeSection === 'pair' && !isRevealed && (
          <div className="absolute inset-0 z-25 pointer-events-auto">
            <ErrorBoundary compact sectionName="Make a Pair Studio">
              <Suspense fallback={null}>
                <PairStudio
                  initialTop={pairSeedShirt}
                  initialTrouser={pairSeedTrouser}
                  initialMode={pairInitialMode}
                  isDesktopShowroom={true}
                  backLabel={pairReturnProductRef.current ? 'Back to Article' : 'Back to Categories'}
                  onBack={() => {
                    if (pairReturnProductRef.current) {
                      const p = pairReturnProductRef.current;
                      pairReturnProductRef.current = null;
                      openProductRoute(p);
                      setActiveSection(
                        p.category === 'Shirts'
                          ? 'shirts'
                          : p.category === 'Hoodies'
                          ? 'hoodies'
                          : 'trousers'
                      );
                    } else {
                      setActiveSection('categories');
                    }
                  }}
                />
              </Suspense>
            </ErrorBoundary>
          </div>
        )}

        {/* 2B. DESKTOP COLLECTION CAROUSEL VIEW (Original horizontal floating row across Trousers, Shirts & Hoodies) */}
        {(activeSection === 'trousers' || activeSection === 'hoodies' || activeSection === 'shirts') && (
          <div
            className="absolute inset-0 z-20 flex flex-col items-center justify-center pt-[118px] lg:pt-[126px] pb-8 transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-[transform,opacity]"
            style={{
              transform: isRevealed
                ? 'translate3d(-34vw, -24vh, -280px) scale(0.28)'
                : 'translate3d(0, 0, 0) scale(1)',
              transformOrigin: 'top left',
              pointerEvents: isRevealed ? 'none' : 'auto',
              opacity: isRevealed ? 0.88 : 1,
            }}
          >
            <div
              ref={containerRef}
              className="relative w-full h-full max-h-[680px] flex items-center overflow-clip"
            >
              <div
                className="flex transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] w-full h-full"
                style={{
                  transform: `translateX(-${currentPage * 100}%)`,
                }}
              >
                {pages.map((pageProducts, pageIdx) => {
                  const isCurrentPage = pageIdx === currentPage;
                  return (
                    <div
                      key={pageIdx}
                      className="w-full shrink-0 h-full flex items-center justify-center px-16 md:px-20 lg:px-24"
                    >
                      <div className="w-full max-w-[1380px] mx-auto flex items-center justify-center gap-[clamp(12px,2.8vw,48px)] flex-nowrap">
                        {pageProducts.map((product) => {
                          const saved = isInWishlist(product.id);
                          return (
                            <div
                              key={product.id}
                              className="w-[215px] lg:w-[clamp(176px,18.4vw,275px)] shrink-0 flex flex-col items-center justify-start group cursor-pointer transition-transform duration-300 ease-out hover:-translate-y-2 relative"
                              onClick={() => openProductRoute(product)}
                              onPointerEnter={() => preloadProductDetailImages(product)}
                            >
                              {/* Wishlist Heart Toggle */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  void toggleWishlist(product);
                                }}
                                onPointerDown={(e) => e.stopPropagation()}
                                onMouseDown={(e) => e.stopPropagation()}
                                onTouchStart={(e) => e.stopPropagation()}
                                className={`absolute top-1 left-2 z-30 pointer-events-auto w-10 h-10 rounded-full border flex items-center justify-center transition-transform cursor-pointer active:scale-90 shadow-md ${
                                  saved
                                    ? 'bg-white border-white text-red-500'
                                    : 'bg-white/90 border-white text-red-500 hover:bg-white'
                                }`}
                                aria-label={
                                  saved
                                    ? `Remove ${product.name} from wishlist`
                                    : `Add ${product.name} to wishlist`
                                }
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill={saved ? 'currentColor' : 'none'}
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth="2.1"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                                  />
                                </svg>
                              </button>

                              {product.soldOut && (
                                <div className="absolute top-1 right-2 z-30">
                                  <span className="px-3 py-1 rounded-[0.25rem] bg-red-600/95 border border-white/50 text-white font-grotesk font-black text-[12px] tracking-[0.14em] uppercase shadow-[0_4px_16px_rgba(220,38,38,0.45)]">
                                    SOLD OUT
                                  </span>
                                </div>
                              )}

                              {/* Transparent Garment-Only Cutout floating in skyline runway with subtle cursor-tracked zoom */}
                              <div
                                className={`relative w-full h-[36vh] sm:h-[40vh] md:h-[44vh] min-h-[220px] max-h-[340px] flex items-center justify-center ${
                                  product.category === 'Shirts' ? 'p-0' : 'p-1'
                                }`}
                              >
                                <PrecisionZoomStage
                                  zoomScale={1.15}
                                  clipOverflow={false}
                                  resetKey={product.id}
                                >
                                  <SmartImage
                                    src={product.image}
                                    alt={product.name}
                                    className={`${getGarmentCardFrame(product.id).desktopCardImgClass} h-full object-contain select-none ${
                                      product.soldOut ? 'opacity-85' : ''
                                    }`}
                                    sizes="(max-width: 1024px) 220px, 275px"
                                    skeletonClassName="inset-4 rounded-2xl"
                                    loading={isCurrentPage && isFullyInView ? 'eager' : 'lazy'}
                                    decoding="async"
                                    fetchPriority={isCurrentPage && isFullyInView ? 'high' : 'low'}
                                  />
                                </PrecisionZoomStage>
                              </div>

                            <div
                              className={`mt-2.5 flex flex-col items-center text-center transition-opacity duration-300 ${
                                isRevealed ? 'opacity-0 pointer-events-none' : 'opacity-100'
                              }`}
                            >
                              <span className="font-display text-xs sm:text-[13px] font-semibold text-slate-800 tracking-tight text-center max-w-[220px] leading-tight px-1 drop-shadow-[0_1px_2px_rgba(255,255,255,0.35)]">
                                {product.name}
                              </span>
                              {product.subtitle && (
                                <span className="text-[10.5px] font-sans font-medium text-slate-700/85 tracking-tight text-center leading-tight mt-0.5 px-1">
                                  {product.subtitle}
                                </span>
                              )}

                              <div className="flex items-center justify-center gap-1.5 mt-1.5">
                                <div className="showroom-glass-capsule min-w-[154px] sm:min-w-[172px] h-[40px] px-3.5 cursor-pointer shadow-[0_6px_20px_rgba(4,15,34,0.16)]">
                                  <span className="absolute inset-x-2 top-[2px] h-[40%] rounded-[0.25rem] bg-gradient-to-b from-white/55 via-white/20 to-transparent pointer-events-none" />
                                  <span className="absolute inset-x-3.5 bottom-[2px] h-[25%] rounded-[0.25rem] bg-gradient-to-t from-blue-200/30 to-transparent pointer-events-none opacity-60" />
                                  <span className="relative z-10 inline-flex items-baseline gap-1.5 font-grotesk tracking-tight whitespace-nowrap">
                                    {product.originalPrice && (
                                      <span className="text-[11.5px] sm:text-[12.5px] font-medium text-white/60 line-through">
                                        {product.originalPrice}
                                      </span>
                                    )}
                                    <span
                                      className={`text-[15px] sm:text-[16.5px] font-bold text-white ${
                                        product.soldOut ? 'line-through opacity-60' : ''
                                      }`}
                                    >
                                      {product.price}
                                    </span>
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* CAROUSEL ARROWS & PAGINATION (All Desktop Collections: Trousers, Hoodies & Shirts) */}
        {(activeSection === 'trousers' || activeSection === 'hoodies' || activeSection === 'shirts') && (
          <div
            className={`transition-opacity duration-300 ${
              isRevealed ? 'opacity-0 pointer-events-none' : 'opacity-100'
            }`}
          >
            {totalPages > 1 && (
              <>
                <div className="absolute left-3 sm:left-6 md:left-8 top-1/2 -translate-y-1/2 z-30 pointer-events-auto">
                  <button
                    type="button"
                    onClick={handlePrevDesktop}
                    className="glass-capsule glass-capsule-hover w-10 h-10 sm:w-12 sm:h-12 rounded-[0.25rem] flex items-center justify-center text-white transition-all cursor-pointer outline-none shadow-[0_8px_24px_rgba(4,24,43,0.18)] active:scale-95"
                    aria-label="Previous page"
                  >
                    <svg className="w-4.5 h-4.5 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                </div>

                <div className="absolute right-3 sm:right-6 md:right-8 top-1/2 -translate-y-1/2 z-30 pointer-events-auto">
                  <button
                    type="button"
                    onClick={handleNextDesktop}
                    className="glass-capsule glass-capsule-hover w-10 h-10 sm:w-12 sm:h-12 rounded-[0.25rem] flex items-center justify-center text-white transition-all cursor-pointer outline-none shadow-[0_8px_24px_rgba(4,24,43,0.18)] active:scale-95"
                    aria-label="Next page"
                  >
                    <svg className="w-4.5 h-4.5 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>

                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-25 flex items-center gap-2 select-none pointer-events-auto">
                  {Array.from({ length: totalPages }).map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCurrentPage(idx)}
                      className={`h-1.5 rounded-full transition-all duration-300 outline-none cursor-pointer ${
                        currentPage === idx
                          ? 'w-7 bg-white shadow-[0_0_8px_rgba(255,255,255,0.85)]'
                          : 'w-2 bg-white/30 hover:bg-white/60'
                      }`}
                      aria-label={`Go to page ${idx + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* 2C. DESKTOP SELECTED ARTICLE REVEAL (Garment-only, NO models) */}
        {selectedProduct && (
          <div
            className={`absolute inset-0 z-30 pointer-events-none transition-opacity duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              isRevealed ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {/* Left: Product Information & Multi-View Angle Selector */}
            <div className="absolute left-6 sm:left-12 md:left-16 lg:left-24 top-[48%] -translate-y-1/2 z-35 flex flex-col items-start gap-4 select-none pointer-events-auto max-w-[300px] sm:max-w-[340px]">
              {selectedProduct.soldOut ? (
                <span className="px-4 py-1 rounded-[0.25rem] bg-red-600/95 border border-white/50 text-white text-[14.5px] font-grotesk font-black tracking-[0.16em] uppercase shadow-md">
                  SOLD OUT
                </span>
              ) : selectedProduct.subCollection === 'Streetwear' ? (
                <span className="glass-capsule px-3 py-0.5 rounded-[0.25rem] text-white text-[13px] font-grotesk font-semibold tracking-wider uppercase">
                  Streetwear
                </span>
              ) : null}

              <div>
                <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight leading-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.35)]">
                  {selectedProduct.name}
                </h2>
                {selectedProduct.subtitle && (
                  <span className="text-xs font-sans text-cyan-100/95 mt-0.5 block drop-shadow-[0_1px_4px_rgba(4,24,43,0.55)]">
                    {selectedProduct.subtitle}
                  </span>
                )}
                <span className="text-xs font-display text-white/95 mt-1 block drop-shadow-[0_1px_4px_rgba(4,24,43,0.55)]">
                  {selectedProduct.color}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-white/95 font-display font-normal leading-relaxed drop-shadow-[0_1px_6px_rgba(4,24,43,0.55)]">
                {selectedProduct.fabric}
              </p>

              <div className="flex items-center gap-3 flex-wrap">
                <div className="selected-reveal-capsule min-w-[180px] sm:min-w-[198px] px-5 py-2.5 gap-2">
                  {selectedProduct.originalPrice && (
                    <span className="font-grotesk text-[13.5px] sm:text-[15px] font-medium text-white/60 line-through whitespace-nowrap">
                      {selectedProduct.originalPrice}
                    </span>
                  )}
                  <span
                    className={`font-grotesk text-[18.5px] sm:text-[20px] font-black tracking-wider whitespace-nowrap ${
                      selectedProduct.soldOut ? 'text-white/60 line-through' : 'text-white'
                    }`}
                  >
                    {selectedProduct.price}
                  </span>
                </div>
                {selectedProduct.soldOut && (
                  <span className="px-3.5 py-1.5 rounded-[0.25rem] bg-red-600/95 border border-white/50 text-white font-grotesk font-black text-[13px] tracking-[0.16em] uppercase shadow-lg">
                    SOLD OUT
                  </span>
                )}
              </div>

              {/* Angle / Detail Selection Tabs */}
              {activeGallery.length > 1 && (
                <div className="flex flex-col gap-1.5 w-full mt-1">
                  <span className="text-[10px] font-mono tracking-widest uppercase text-white/95 drop-shadow-[0_1px_4px_rgba(4,24,43,0.65)] font-semibold">
                    Garment Views & Construction
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {activeGallery.map((img, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedImageIndex(idx)}
                        className={`px-2.5 py-[2px] rounded-[0.25rem] text-[10.5px] sm:text-[11px] font-grotesk font-semibold tracking-[0.06em] uppercase transition-all cursor-pointer ${
                          selectedImageIndex === idx
                            ? 'bg-white/28 backdrop-blur-md border border-white/80 text-white font-bold shadow-sm'
                            : 'glass-capsule glass-capsule-hover text-white/85 shadow-sm'
                        }`}
                      >
                        {img.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => closeProductRoute()}
                className="selected-reveal-capsule min-w-[180px] sm:min-w-[198px] px-5 py-2 text-[13px] sm:text-[15px] font-grotesk font-semibold tracking-wide text-white transition-all cursor-pointer outline-none shadow-[0_6px_20px_rgba(4,15,34,0.18)] active:scale-95 mt-2"
                aria-label="Return to list"
              >
                Back to Collection
              </button>
            </div>

            {/* Center: Hero Garment Cutout Display + Color Dots Column Beside It */}
            <div className="absolute left-1/2 -translate-x-1/2 bottom-[4vh] sm:bottom-[5vh] z-30 flex flex-col items-center pointer-events-auto select-none">
              <div className="relative flex flex-col items-center justify-center w-[42vw] max-w-[540px] h-[58vh] sm:h-[62vh] md:h-[66vh] max-h-[620px]">
                {/* Small Size Guide Button on Top Right of Trousers & Shirts Articles */}
                {(selectedProduct.category === 'Trousers' || selectedProduct.category === 'Shirts') && (
                  <button
                    type="button"
                    onClick={() => setIsSizeGuideOpen(true)}
                    className="glass-capsule glass-capsule-hover absolute top-2 right-2 z-35 px-3 py-0.5 rounded-[0.25rem] text-[12px] font-grotesk font-semibold text-white inline-flex items-center gap-1 shadow-md transition-all cursor-pointer outline-none"
                    aria-label={`Open ${selectedProduct.category.toLowerCase()} size guide`}
                  >
                    <svg className="w-3 h-3 text-white shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8.25V15.75C3 16.9926 4.00736 18 5.25 18H18.75C19.9926 18 21 16.9926 21 15.75V8.25C21 7.00736 19.9926 6 18.75 6H5.25C4.00736 6 3 7.00736 3 8.25Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 6V10M12 6V11.5M16.5 6V10" />
                    </svg>
                    <span>Size guide</span>
                  </button>
                )}

                <PrecisionZoomStage
                  zoomScale={2.35}
                  allowClickToggle={true}
                  clipOverflow={true}
                  resetKey={`${selectedProduct.id}-${selectedImageIndex}`}
                  onZoomStateChange={setIsDetailZooming}
                  className="z-10 rounded-xl"
                >
                  <SmartImage
                    src={currentGarmentImage || selectedProduct.image}
                    alt={`${selectedProduct.name} ${activeGallery[selectedImageIndex]?.label || 'garment view'}`}
                    className={`${
                      selectedImageIndex <= 1
                        ? getShirtDetailImageClass(selectedProduct.id, selectedImageIndex === 1, 'desktop')
                        : 'w-full h-full'
                    } object-contain select-none`}
                    responsive={false}
                    skeletonClassName="inset-6 rounded-2xl"
                    loading="eager"
                    decoding="async"
                    fetchPriority="high"
                  />
                </PrecisionZoomStage>

                {/* Vertical Column of Exact Color Dots Beside the Garment */}
                {selectedColorVariants.length > 1 && (
                  <div className="absolute -right-10 sm:-right-12 top-1/2 -translate-y-1/2 z-35">
                    <ColorSwatchRail
                      currentProduct={selectedProduct}
                      variants={selectedColorVariants}
                      onSelectVariant={(variant) => openProductRoute(variant)}
                    />
                  </div>
                )}
              </div>

              {/* Front / Back / Details Garment Delicate View Switcher Pill */}
              <div className="mt-2.5 flex items-center gap-2">
                <div className="glass-capsule p-[2px] rounded-[0.25rem] flex items-center gap-0.5 shadow-sm">
                  <button
                    type="button"
                    onClick={() => setSelectedImageIndex(0)}
                    className={`px-2.5 py-[2px] rounded-[0.2rem] text-[10.5px] sm:text-[11px] font-grotesk font-semibold tracking-[0.08em] uppercase transition-colors cursor-pointer ${
                      selectedImageIndex === 0
                        ? 'bg-white/28 border border-white/80 text-white shadow-sm'
                        : 'text-white/80 hover:text-white hover:bg-white/15'
                    }`}
                  >
                    Front
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedImageIndex(1)}
                    className={`px-2.5 py-[2px] rounded-[0.2rem] text-[10.5px] sm:text-[11px] font-grotesk font-semibold tracking-[0.08em] uppercase transition-colors cursor-pointer ${
                      selectedImageIndex === 1
                        ? 'bg-white/28 border border-white/80 text-white shadow-sm'
                        : 'text-white/80 hover:text-white hover:bg-white/15'
                    }`}
                  >
                    Back
                  </button>
                  {activeGallery.slice(2).map((detailItem, offset) => {
                    const detailIdx = offset + 2;
                    const detailLabel =
                      activeGallery.length === 3 ? 'Details' : detailItem.label;
                    return (
                      <button
                        key={detailIdx}
                        type="button"
                        onClick={() => setSelectedImageIndex(detailIdx)}
                        className={`px-2.5 py-[2px] rounded-[0.2rem] text-[10.5px] sm:text-[11px] font-grotesk font-semibold tracking-[0.08em] uppercase transition-colors cursor-pointer ${
                          selectedImageIndex === detailIdx
                            ? 'bg-white/28 border border-white/80 text-white shadow-sm'
                            : 'text-white/80 hover:text-white hover:bg-white/15'
                        }`}
                      >
                        {detailLabel}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* View Label */}
              <div className="mt-1.5 text-center">
                <span className="text-[11px] font-mono tracking-widest text-slate-700 uppercase drop-shadow-[0_1px_2px_rgba(255,255,255,0.6)] font-medium">
                  {isDetailZooming
                    ? `${activeGallery[selectedImageIndex]?.label || 'Garment'} · 2.35× Fabric Zoom`
                    : activeGallery[selectedImageIndex]?.label || 'Garment Display'}
                </span>
              </div>
            </div>

            {/* Right: Size Selection & Add to Cart / SOLD OUT */}
            <div className="absolute right-6 sm:right-12 md:right-16 lg:right-24 top-[48%] -translate-y-1/2 z-35 flex flex-col items-center gap-4 select-none pointer-events-auto">
              <div className="flex flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={isAdding || !selectedSize || selectedProduct.soldOut}
                  className={`min-w-[184px] sm:min-w-[202px] px-7 py-3 text-[15px] sm:text-[16.5px] font-grotesk font-semibold tracking-wide transition-all outline-none shadow-[0_8px_24px_rgba(4,15,34,0.22)] ${
                    selectedProduct.soldOut
                      ? 'rounded-[0.25rem] border backdrop-blur-md bg-red-950/65 border-red-300/45 text-red-100 font-black tracking-[0.18em] uppercase cursor-not-allowed'
                      : 'selected-reveal-capsule text-white cursor-pointer active:scale-95 disabled:opacity-50'
                  }`}
                  aria-label={
                    selectedProduct.soldOut
                      ? `${selectedProduct.name} is sold out`
                      : `Add ${selectedProduct.name} to bag`
                  }
                >
                  {selectedProduct.soldOut
                    ? 'SOLD OUT'
                    : isAdding
                    ? 'Adding…'
                    : addedToCart
                    ? 'Added to Bag ✓'
                    : 'Add to cart'}
                </button>

                <div className="glass-capsule flex items-center gap-1 p-0.5 rounded-[0.25rem] shadow-sm">
                  {(['S', 'M', 'L', 'XL'] as const).map((size) => (
                    <button
                      key={size}
                      type="button"
                      disabled={selectedProduct.soldOut}
                      onClick={() => setSelectedSize(size)}
                      className={`w-8 h-8 rounded-[0.25rem] text-[13px] font-grotesk font-semibold transition-all ${
                        selectedProduct.soldOut
                          ? 'text-white/35 cursor-not-allowed'
                          : selectedSize === size
                          ? 'bg-white/28 backdrop-blur-md border border-white/80 text-white font-bold shadow-sm cursor-pointer'
                          : 'text-white/80 hover:text-white hover:bg-white/15 cursor-pointer'
                      }`}
                      aria-label={`Select size ${size}`}
                    >
                      {size}
                    </button>
                  ))}
                </div>

                {/* Pair it with Trousers (Shirts/Hoodies) or Pair it with A shirt (Trousers) */}
                {(selectedProduct.category === 'Shirts' ||
                  selectedProduct.category === 'Hoodies' ||
                  selectedProduct.category === 'Trousers') && (
                  <button
                    type="button"
                    onClick={() => handleOpenPairWithProduct(selectedProduct)}
                    className="selected-reveal-capsule min-w-[184px] sm:min-w-[202px] mt-1 px-4.5 py-2 text-white font-grotesk text-[13px] font-bold tracking-wide flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer outline-none"
                  >
                    <span>
                      {selectedProduct.category === 'Shirts' || selectedProduct.category === 'Hoodies'
                        ? 'Pair it with Trousers'
                        : 'Pair it with A shirt'}
                    </span>
                    <span className="px-2 py-0.5 rounded-[0.25rem] bg-white/25 backdrop-blur-md text-white border border-white/75 font-grotesk font-black text-[11.5px] tracking-wider uppercase">
                      15% OFF
                    </span>
                  </button>
                )}

                {/* Wishlist Save Button */}
                <button
                  type="button"
                  onClick={() => void toggleWishlist(selectedProduct)}
                  className={`glass-capsule glass-capsule-hover min-w-[184px] sm:min-w-[202px] mt-1 px-4.5 py-2 rounded-[0.25rem] font-grotesk text-[13px] font-bold tracking-wide text-white flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer outline-none ${
                    isInWishlist(selectedProduct.id) ? 'border-red-400/80' : ''
                  }`}
                >
                  <svg
                    className="w-3.5 h-3.5 shrink-0 text-red-500"
                    fill={isInWishlist(selectedProduct.id) ? 'currentColor' : 'none'}
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2.1"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                  </svg>
                  <span>
                    {isInWishlist(selectedProduct.id) ? 'Saved in Wishlist' : 'Save to Wishlist'}
                  </span>
                </button>
              </div>

              {/* Thumbnail Previews for quick clicking */}
              {activeGallery.length > 1 && (
                <div className="flex items-center gap-2 p-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-sm mt-2">
                  {activeGallery.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`relative w-12 h-12 rounded-xl p-0.5 overflow-hidden transition-all cursor-pointer ${
                        selectedImageIndex === idx
                          ? 'bg-white/40 border border-white scale-105'
                          : 'opacity-60 hover:opacity-100 hover:bg-white/20'
                      }`}
                      title={img.label}
                    >
                      <SmartImage
                        src={img.src}
                        alt={img.label}
                        className="w-full h-full object-contain"
                        sizes="48px"
                        skeletonClassName="inset-1 rounded-lg"
                        loading="lazy"
                        decoding="async"
                        fetchPriority="low"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 3. MOBILE COLLECTION BROWSING (< 768px, When !isRevealed)*/}
      {/* ======================================================== */}
      {!isRevealed && (
        <div
          className="md:hidden absolute inset-0 z-20 flex flex-col items-center justify-between pt-[calc(78px+env(safe-area-inset-top))] pb-[calc(22px+env(safe-area-inset-bottom))] px-4"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Category Switcher */}
          <div className="shrink-0 mb-1 z-25 flex items-center gap-1.5">
            <div className="glass-capsule p-0.5 rounded-[0.25rem] flex items-center gap-0.5 shadow-sm">
              <button
                type="button"
                onClick={() => handleSelectCategory('trousers')}
                className={`px-2.5 py-0.5 rounded-[0.25rem] font-grotesk text-[12.5px] font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                  activeSection === 'trousers' || activeSection === 'categories'
                    ? 'bg-white/28 backdrop-blur-md border border-white/80 text-white font-bold shadow-sm'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                <span>Trousers</span>
              </button>
              <button
                type="button"
                onClick={() => handleSelectCategory('shirts')}
                className={`px-2.5 py-0.5 rounded-[0.25rem] font-grotesk text-[12.5px] font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                  activeSection === 'shirts'
                    ? 'bg-white/28 backdrop-blur-md border border-white/80 text-white font-bold shadow-sm'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                <span>Shirts</span>
              </button>
              <button
                type="button"
                onClick={() => handleSelectCategory('hoodies')}
                className={`px-2.5 py-0.5 rounded-[0.25rem] font-grotesk text-[12.5px] font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                  activeSection === 'hoodies'
                    ? 'bg-white/28 backdrop-blur-md border border-white/80 text-white font-bold shadow-sm'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                <span>Hoodies</span>
              </button>
            </div>

            <div className="glass-capsule px-2.5 py-0.5 rounded-[0.25rem] text-[12px] font-grotesk font-semibold text-white shadow-sm">
              {mobileIndex + 1} / {activeProducts.length}
            </div>
          </div>

          {/* Centered Garment Cutout + Product Name + Price (Zero Models) */}
          <div
            className="flex-1 w-full max-w-[340px] flex flex-col items-center justify-center cursor-pointer group my-auto z-25 pointer-events-auto relative"
            onClick={() => openProductRoute(currentMobileProduct)}
          >
            {currentMobileProduct.soldOut && (
              <div className="mb-2">
                <span className="px-3.5 py-1 rounded-[0.25rem] bg-red-600/95 text-white text-[12px] font-grotesk font-black tracking-[0.14em] uppercase border border-white/50 shadow-sm">
                  SOLD OUT
                </span>
              </div>
            )}

            <div
              className={`relative w-full h-[40vh] max-h-[360px] flex items-center justify-center ${getGarmentCardFrame(currentMobileProduct.id).mobileGridPaddingClass}`}
            >
              <SmartImage
                src={currentMobileProduct.image}
                alt={currentMobileProduct.name}
                className={`${getGarmentCardFrame(currentMobileProduct.id).mobileGridImgClass} h-full object-contain select-none active:scale-98 transition-transform ${
                  currentMobileProduct.soldOut ? 'opacity-85' : ''
                }`}
                sizes="280px"
                skeletonClassName="inset-4 rounded-2xl"
                loading="eager"
                decoding="async"
                fetchPriority="high"
              />
            </div>

            <div className="mt-3.5 flex flex-col items-center text-center">
              <h3 className="font-display text-base font-bold text-slate-900 tracking-tight drop-shadow-[0_1px_2px_rgba(255,255,255,0.85)]">
                {currentMobileProduct.name}
              </h3>
              {currentMobileProduct.subtitle && (
                <span className="text-[11px] font-sans font-medium text-slate-800/85 tracking-tight mt-0.5">
                  {currentMobileProduct.subtitle}
                </span>
              )}

              <div className="showroom-mobile-price-capsule px-5 py-1.5 mt-2 gap-2 shadow-[0_6px_20px_rgba(4,15,34,0.16)]">
                {currentMobileProduct.originalPrice && (
                  <span className="font-grotesk text-[12px] font-medium text-white/60 line-through whitespace-nowrap">
                    {currentMobileProduct.originalPrice}
                  </span>
                )}
                <span className="font-grotesk text-[15px] font-bold text-white tracking-tight whitespace-nowrap">
                  {currentMobileProduct.soldOut ? `${currentMobileProduct.price} · SOLD OUT` : currentMobileProduct.price}
                </span>
              </div>
            </div>
          </div>

          {/* Compact Pagination */}
          <div className="shrink-0 flex items-center gap-1.5 mt-2 z-25">
            {activeProducts.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setMobileIndex(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  mobileIndex === idx ? 'w-6 bg-white shadow-sm' : 'w-1.5 bg-white/40'
                }`}
                aria-label={`Go to article ${idx + 1}`}
              />
            ))}
          </div>

          {/* Left Arrow Button */}
          <div className="absolute left-1.5 top-1/2 -translate-y-1/2 z-30 pointer-events-auto">
            <button
              type="button"
              onClick={handlePrevMobile}
              className="glass-capsule w-10 h-10 rounded-[0.25rem] flex items-center justify-center text-white active:scale-90 shadow-md cursor-pointer"
              aria-label="Previous article"
            >
              <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>

          {/* Right Arrow Button */}
          <div className="absolute right-1.5 top-1/2 -translate-y-1/2 z-30 pointer-events-auto">
            <button
              type="button"
              onClick={handleNextMobile}
              className="glass-capsule w-10 h-10 rounded-[0.25rem] flex items-center justify-center text-white active:scale-90 shadow-md cursor-pointer"
              aria-label="Next article"
            >
              <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. MOBILE SELECTED ARTICLE REVEAL (Garment-only, NO models)*/}
      {/* ======================================================== */}
      {selectedProduct && (
        <div className="md:hidden absolute inset-0 z-30 overflow-y-auto overflow-x-hidden pt-[calc(76px+env(safe-area-inset-top))] pb-[calc(36px+env(safe-area-inset-bottom))] px-5 pointer-events-auto">
          <div className="w-full max-w-sm mx-auto flex flex-col items-center space-y-4">
            {/* Garment Cutout Display + Color Dots Column */}
            <div className="relative flex flex-col items-center w-full py-1">
              <div className="relative w-full flex items-center justify-center pl-2 pr-10">
                {(selectedProduct.category === 'Trousers' || selectedProduct.category === 'Shirts') && (
                  <button
                    type="button"
                    onClick={() => setIsSizeGuideOpen(true)}
                    className="glass-capsule absolute top-1 right-1 z-25 px-2.5 py-0.5 rounded-[0.25rem] text-[11px] font-grotesk font-semibold text-white inline-flex items-center gap-1 shadow-sm transition-all cursor-pointer outline-none"
                    aria-label={`Open ${selectedProduct.category.toLowerCase()} size guide`}
                  >
                    <svg className="w-3 h-3 text-white shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8.25V15.75C3 16.9926 4.00736 18 5.25 18H18.75C19.9926 18 21 16.9926 21 15.75V8.25C21 7.00736 19.9926 6 18.75 6H5.25C4.00736 6 3 7.00736 3 8.25Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 6V10M12 6V11.5M16.5 6V10" />
                    </svg>
                    <span>Size guide</span>
                  </button>
                )}

                <div className="relative h-[38vh] max-h-[350px] w-full max-w-[300px] flex items-center justify-center">
                  <SmartImage
                    src={currentGarmentImage || selectedProduct.image}
                    alt={`${selectedProduct.name} ${activeGallery[selectedImageIndex]?.label || 'garment view'}`}
                    className={`${
                      selectedImageIndex <= 1
                        ? getShirtDetailImageClass(selectedProduct.id, selectedImageIndex === 1, 'mobile')
                        : 'w-full h-full'
                    } object-contain object-center select-none`}
                    sizes="300px"
                    skeletonClassName="inset-4 rounded-2xl"
                    loading="eager"
                    decoding="async"
                    fetchPriority="high"
                  />
                </div>

                {selectedColorVariants.length > 1 && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 z-25">
                    <ColorSwatchRail
                      currentProduct={selectedProduct}
                      variants={selectedColorVariants}
                      onSelectVariant={(variant) => openProductRoute(variant)}
                    />
                  </div>
                )}
              </div>

              {/* Front / Back / Details Delicate Toggle Pill (centered under garment container) */}
              <div className="mt-2 w-full pl-2 pr-10 flex items-center justify-center">
                <div className="glass-capsule p-[2px] rounded-[0.25rem] flex items-center gap-0.5 shadow-sm">
                  <button
                    type="button"
                    onClick={() => setSelectedImageIndex(0)}
                    className={`px-2.5 py-[2px] rounded-[0.2rem] text-[10.5px] font-grotesk font-semibold tracking-[0.08em] uppercase transition-all cursor-pointer ${
                      selectedImageIndex === 0
                        ? 'bg-white/28 backdrop-blur-md border border-white/80 text-white shadow-sm'
                        : 'text-white/80 hover:text-white'
                    }`}
                  >
                    Front
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedImageIndex(1)}
                    className={`px-2.5 py-[2px] rounded-[0.2rem] text-[10.5px] font-grotesk font-semibold tracking-[0.08em] uppercase transition-all cursor-pointer ${
                      selectedImageIndex === 1
                        ? 'bg-white/28 backdrop-blur-md border border-white/80 text-white shadow-sm'
                        : 'text-white/80 hover:text-white'
                    }`}
                  >
                    Back
                  </button>
                  {activeGallery.slice(2).map((detailItem, offset) => {
                    const detailIdx = offset + 2;
                    const detailLabel =
                      activeGallery.length === 3 ? 'Details' : detailItem.label;
                    return (
                      <button
                        key={detailIdx}
                        type="button"
                        onClick={() => setSelectedImageIndex(detailIdx)}
                        className={`px-2.5 py-[2px] rounded-[0.2rem] text-[10.5px] font-grotesk font-semibold tracking-[0.08em] uppercase transition-all cursor-pointer ${
                          selectedImageIndex === detailIdx
                            ? 'bg-white/28 backdrop-blur-md border border-white/80 text-white shadow-sm'
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

            {/* Multi-view thumbnails */}
            {activeGallery.length > 1 && (
              <div className="w-full pl-2 pr-10 flex items-center justify-center gap-2 overflow-x-auto py-1">
                {activeGallery.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`relative w-12 h-12 rounded-xl p-1 overflow-hidden transition-all cursor-pointer ${
                      selectedImageIndex === idx
                        ? 'bg-white/40 border border-white scale-105'
                        : 'bg-white/10 opacity-70'
                    }`}
                  >
                    <SmartImage
                      src={img.src}
                      alt={img.label}
                      className="w-full h-full object-contain"
                      sizes="48px"
                      skeletonClassName="inset-1 rounded-lg"
                      loading="lazy"
                      decoding="async"
                      fetchPriority="low"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Product details card */}
            <div className="flex flex-col items-center text-center space-y-2 pt-1 w-full">
              {selectedProduct.soldOut && (
                <span className="px-3.5 py-1 rounded-[0.25rem] bg-red-600/95 border border-white/50 text-white text-[14.5px] font-grotesk font-black tracking-[0.14em] uppercase">
                  SOLD OUT
                </span>
              )}

              <h2 className="font-display text-2xl font-bold text-white tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.45)]">
                {selectedProduct.name}
              </h2>
              {selectedProduct.subtitle && (
                <span className="text-xs font-sans text-white/85 tracking-tight">
                  {selectedProduct.subtitle}
                </span>
              )}

              <p className="text-xs text-white/80 font-normal leading-relaxed text-center px-4">
                {selectedProduct.fabric}
              </p>

              <div className="showroom-mobile-price-capsule px-5 py-1.5 gap-2 shadow-md">
                {selectedProduct.originalPrice && (
                  <span className="font-grotesk text-[12px] font-medium text-white/60 line-through whitespace-nowrap">
                    {selectedProduct.originalPrice}
                  </span>
                )}
                <span className="font-grotesk text-[15px] font-bold text-white tracking-tight whitespace-nowrap">
                  {selectedProduct.soldOut ? `${selectedProduct.price} · SOLD OUT` : selectedProduct.price}
                </span>
              </div>

              {/* Size selector */}
              <div className="w-full flex items-center justify-center gap-2 pt-2">
                {(['S', 'M', 'L', 'XL'] as const).map((size) => (
                  <button
                    key={size}
                    type="button"
                    disabled={selectedProduct.soldOut}
                    onClick={() => setSelectedSize(size)}
                    className={`w-11 h-10 rounded-lg text-xs font-mono font-semibold transition-all ${
                      selectedProduct.soldOut
                        ? 'bg-white/5 text-white/40 border border-white/15 cursor-not-allowed'
                        : selectedSize === size
                        ? 'bg-white text-black font-bold shadow-md cursor-pointer'
                        : 'bg-white/10 text-white/90 border border-white/25 cursor-pointer'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>

              {/* Add to cart / SOLD OUT */}
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isAdding || selectedProduct.soldOut}
                className={`w-full py-3 px-5 rounded-[0.25rem] border backdrop-blur-md text-[15px] font-grotesk font-semibold tracking-tight flex items-center justify-center gap-2 shadow-lg transition-all mt-2 ${
                  selectedProduct.soldOut
                    ? 'bg-red-950/65 border-red-300/45 text-red-100 font-black tracking-[0.16em] uppercase cursor-not-allowed'
                    : 'selected-reveal-capsule text-white cursor-pointer'
                }`}
              >
                {selectedProduct.soldOut ? 'SOLD OUT' : addedToCart ? 'Added to Bag ✓' : 'Add to cart'}
              </button>

              {(selectedProduct.category === 'Shirts' ||
                selectedProduct.category === 'Hoodies' ||
                selectedProduct.category === 'Trousers') && (
                <button
                  type="button"
                  onClick={() => handleOpenPairWithProduct(selectedProduct)}
                  className="selected-reveal-capsule w-full py-2.5 px-4.5 rounded-[0.25rem] text-white font-grotesk text-[13px] font-bold tracking-wide flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer"
                >
                  <span>
                    {selectedProduct.category === 'Shirts' || selectedProduct.category === 'Hoodies'
                      ? 'Pair it with Trousers'
                      : 'Pair it with A shirt'}
                  </span>
                  <span className="px-2 py-0.5 rounded-[0.25rem] bg-white/25 backdrop-blur-md text-white border border-white/75 font-grotesk font-black text-[11.5px] uppercase">
                    15% OFF
                  </span>
                </button>
              )}

              <button
                type="button"
                onClick={() => closeProductRoute()}
                className="glass-capsule glass-capsule-hover w-full py-2 px-5 rounded-[0.25rem] text-[13px] font-grotesk font-semibold text-white transition-all cursor-pointer"
              >
                Back to Collection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Curation Modal for non-trouser categories */}
      {curationModalCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="relative w-full max-w-md rounded-[0.5rem] bg-slate-900/90 border border-white/25 p-6 text-center shadow-2xl">
            <span className="text-[10px] font-mono tracking-widest text-cyan-300 uppercase block mb-1">
              In Curation
            </span>
            <h3 className="font-display text-2xl font-black text-white uppercase mb-2">
              {curationModalCategory.name} Series
            </h3>
            <p className="text-xs font-mono text-white/70 leading-relaxed mb-6">
              Our architectural {curationModalCategory.name.toLowerCase()} collection is currently in fabrication. Explore our available trouser collection.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                type="button"
                onClick={() => {
                  setCurationModalCategory(null);
                  setActiveSection('trousers');
                }}
                className="selected-reveal-capsule px-4.5 py-2 rounded-[0.25rem] text-white font-grotesk font-bold text-[13px] tracking-wider uppercase shadow-md cursor-pointer"
              >
                Explore Trousers
              </button>
              <button
                type="button"
                onClick={() => setCurationModalCategory(null)}
                className="glass-capsule glass-capsule-hover px-4.5 py-2 rounded-[0.25rem] text-white font-grotesk font-semibold text-[13px] cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {isSizeGuideOpen && Boolean(selectedProduct) && (
        <Suspense fallback={null}>
          <SizeGuideModal
            isOpen={isSizeGuideOpen && Boolean(selectedProduct)}
            category={selectedProduct?.category || 'Trousers'}
            onClose={() => setIsSizeGuideOpen(false)}
          />
        </Suspense>
      )}
    </section>
  );
}
