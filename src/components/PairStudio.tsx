import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  SHIRT_PRODUCTS,
  HOODIE_PRODUCTS,
  MAIN_COLLECTION,
  Product,
} from '../data/products';
import { useCart } from '../context/CartContext';
import { parseNumericPrice, PAIR_DISCOUNT_RATE } from '../utils/pairPricing';
import { preloadCategoryImages, preloadProductDetailImages } from '../utils/preloadImages';

export interface PairStudioProps {
  initialTop?: Product | null;
  initialShirt?: Product | null;
  initialTrouser?: Product | null;
  initialMode?: 'summer' | 'winter';
  onBack: () => void;
  onOpenBag?: () => void;
  backLabel?: string;
  isDesktopShowroom?: boolean;
}

const SIZES = ['S', 'M', 'L', 'XL'] as const;
type SizeType = (typeof SIZES)[number];
type DrawerMode = 'shirts' | 'hoodies' | 'trousers' | null;

export const PairStudio: React.FC<PairStudioProps> = ({
  initialTop,
  initialShirt,
  initialTrouser,
  initialMode = 'summer',
  onBack,
  onOpenBag,
  backLabel = 'Back',
  isDesktopShowroom = false,
}) => {
  const { addPairToCart, isAdding, setIsBagOpen } = useCart();

  const resolvedSeedTop = initialTop ?? initialShirt ?? null;
  const derivedInitialMode: 'summer' | 'winter' = resolvedSeedTop
    ? resolvedSeedTop.category === 'Hoodies'
      ? 'winter'
      : 'summer'
    : initialMode;

  const defaultTrouser = useMemo(() => {
    if (initialTrouser) return initialTrouser;
    if (derivedInitialMode === 'winter') {
      return (
        MAIN_COLLECTION.find((t) => t.id === 'BH-T09') ||
        MAIN_COLLECTION.find((t) => !t.soldOut) ||
        MAIN_COLLECTION[0]
      );
    }
    return (
      MAIN_COLLECTION.find((t) => t.id === 'BH-T07') ||
      MAIN_COLLECTION.find((t) => !t.soldOut) ||
      MAIN_COLLECTION[0]
    );
  }, [initialTrouser, derivedInitialMode]);

  const defaultTop = useMemo(() => {
    if (resolvedSeedTop) return resolvedSeedTop;
    if (derivedInitialMode === 'winter') {
      return (
        HOODIE_PRODUCTS.find((h) => h.id === 'BH-H06') || HOODIE_PRODUCTS[0]
      );
    }
    return SHIRT_PRODUCTS.find((s) => s.id === 'BH-S03') || SHIRT_PRODUCTS[0];
  }, [resolvedSeedTop, derivedInitialMode]);

  const [selectedTop, setSelectedTop] = useState<Product>(defaultTop);
  const [selectedTrouser, setSelectedTrouser] = useState<Product>(defaultTrouser);
  const [topSize, setTopSize] = useState<SizeType>('M');
  const [trouserSize, setTrouserSize] = useState<SizeType>('M');
  const [viewAngle, setViewAngle] = useState<'front' | 'back'>('front');
  const [drawerTab, setDrawerTab] = useState<DrawerMode>(null);
  const [openDropdown, setOpenDropdown] = useState<'top' | 'trouser' | null>(null);
  const [pairAdded, setPairAdded] = useState(false);

  const dropdownContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    preloadCategoryImages('pair');
  }, []);

  useEffect(() => {
    preloadProductDetailImages(selectedTop);
  }, [selectedTop]);

  useEffect(() => {
    preloadProductDetailImages(selectedTrouser);
  }, [selectedTrouser]);

  useEffect(() => {
    if (resolvedSeedTop) {
      setSelectedTop(resolvedSeedTop);
    } else if (initialMode === 'winter') {
      setSelectedTop(
        HOODIE_PRODUCTS.find((h) => h.id === 'BH-H06') || HOODIE_PRODUCTS[0]
      );
    } else {
      setSelectedTop(
        SHIRT_PRODUCTS.find((s) => s.id === 'BH-S03') || SHIRT_PRODUCTS[0]
      );
    }
  }, [resolvedSeedTop, initialMode]);

  useEffect(() => {
    if (initialTrouser) {
      setSelectedTrouser(initialTrouser);
    } else if (initialMode === 'winter') {
      setSelectedTrouser(
        MAIN_COLLECTION.find((t) => t.id === 'BH-T09') || MAIN_COLLECTION[0]
      );
    } else {
      setSelectedTrouser(
        MAIN_COLLECTION.find((t) => t.id === 'BH-T07') || MAIN_COLLECTION[0]
      );
    }
  }, [initialTrouser, initialMode]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownContainerRef.current &&
        !dropdownContainerRef.current.contains(e.target as Node)
      ) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isWinterTop = selectedTop.category === 'Hoodies';
  const topLabel = isWinterTop ? 'hoodie' : 'shirt';
  const topLabelCap = isWinterTop ? 'Hoodie' : 'Shirt';

  const topPrice = parseNumericPrice(selectedTop.price);
  const trouserPrice = parseNumericPrice(selectedTrouser.price);
  const regularTotal = topPrice + trouserPrice;
  const discountAmount = Math.round(regularTotal * PAIR_DISCOUNT_RATE);
  const finalPairPrice = regularTotal - discountAmount;

  const isTrouserSoldOut = Boolean(selectedTrouser.soldOut);
  const isTopSoldOut = Boolean(selectedTop.soldOut);
  const isUnavailable = isTrouserSoldOut || isTopSoldOut;

  const topImageSrc =
    viewAngle === 'back' && selectedTop.backImage
      ? selectedTop.backImage
      : selectedTop.image;

  const trouserImageSrc =
    viewAngle === 'back' && selectedTrouser.backImage
      ? selectedTrouser.backImage
      : selectedTrouser.image;

  const handleAddPair = async () => {
    if (isAdding || isUnavailable) return;

    const ok = await addPairToCart(
      {
        productId: selectedTop.id,
        name: selectedTop.name,
        price: topPrice,
        formattedPrice: selectedTop.price,
        size: topSize,
        image: selectedTop.image,
        quantity: 1,
      },
      {
        productId: selectedTrouser.id,
        name: selectedTrouser.name,
        price: trouserPrice,
        formattedPrice: selectedTrouser.price,
        size: trouserSize,
        image: selectedTrouser.image,
        quantity: 1,
      }
    );

    if (ok) {
      setPairAdded(true);
      setTimeout(() => setPairAdded(false), 3500);
    }
  };

  const handleViewBag = () => {
    if (onOpenBag) {
      onOpenBag();
    } else {
      setIsBagOpen(true);
    }
  };

  const drawerHeading =
    drawerTab === 'shirts'
      ? 'Choose a shirt'
      : drawerTab === 'hoodies'
      ? 'Choose a hoodie'
      : 'Choose trousers';

  return (
    <div
      className={`w-full text-white font-display select-none ${
        isDesktopShowroom
          ? 'h-full overflow-y-auto overscroll-contain pt-[84px] pb-10 px-4 sm:px-6 flex flex-col items-center justify-start'
          : 'px-3.5 sm:px-5 pt-1.5 pb-24 flex flex-col items-center'
      }`}
    >
      {/* Top Back Navigation Control */}
      <div className="w-full max-w-[420px] flex items-center justify-between mb-2.5">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/15 hover:bg-white/25 border border-white/35 text-[11px] font-display font-semibold tracking-[0.12em] uppercase text-white transition-all active:scale-95 cursor-pointer outline-none backdrop-blur-md shadow-sm"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          <span>{backLabel}</span>
        </button>

        <span className="text-[11px] font-display font-bold tracking-[0.14em] uppercase text-white/90 drop-shadow-sm">
          PKR {finalPairPrice.toLocaleString()}{' '}
          <span className="text-white/60 line-through font-normal ml-1">
            PKR {regularTotal.toLocaleString()}
          </span>
        </span>
      </div>

      {/* ================================================================= */}
      {/* FROSTED ATELIER PAIR BOARD (Exact Reference Architecture)         */}
      {/* ================================================================= */}
      <div className="relative w-full max-w-[420px] rounded-[34px] border border-white/55 bg-gradient-to-b from-sky-200/20 via-sky-300/15 to-sky-500/25 backdrop-blur-md px-5 sm:px-6 pt-5 pb-6 shadow-[0_24px_64px_rgba(4,24,43,0.32),inset_0_1px_1px_rgba(255,255,255,0.65)] overflow-hidden flex flex-col items-center">
        {/* Subtle Inner Radial Glow */}
        <div
          className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 w-72 h-44 rounded-full bg-white/25 blur-3xl"
          aria-hidden="true"
        />

        {/* Header Stack: BAD HABIT -> MAKE A PAIR -> 15% OFF -> Front/Back */}
        <div className="relative z-10 flex flex-col items-center text-center w-full">
          <span className="font-display text-[11px] sm:text-xs font-bold tracking-[0.22em] text-white/95 uppercase drop-shadow-sm">
            BAD HABIT
          </span>

          <h1 className="font-display text-2xl sm:text-[27px] font-black tracking-[0.04em] text-white uppercase leading-tight mt-0.5 drop-shadow-[0_2px_8px_rgba(4,24,43,0.25)]">
            MAKE A PAIR
          </h1>

          {/* Glowing 15% OFF Pill */}
          <span className="mt-1.5 inline-flex items-center justify-center px-4 py-0.5 rounded-full bg-gradient-to-r from-[#06b6d4] via-[#0ea5e9] to-[#0284c7] border border-cyan-100/90 text-white font-display font-black text-[11px] tracking-[0.1em] uppercase shadow-[0_0_18px_rgba(14,165,233,0.65)]">
            15% OFF
          </span>

          {/* Front / Back Segmented Glass Pill */}
          <div className="mt-3 p-0.5 rounded-full bg-white/15 border border-white/55 backdrop-blur-md inline-flex items-center shadow-inner">
            <button
              type="button"
              onClick={() => setViewAngle('front')}
              className={`px-6 py-1 rounded-full text-xs font-display font-bold tracking-wide transition-all cursor-pointer outline-none ${
                viewAngle === 'front'
                  ? 'bg-white/40 text-white shadow-[0_2px_10px_rgba(255,255,255,0.3)]'
                  : 'text-white/85 hover:text-white'
              }`}
            >
              Front
            </button>
            <button
              type="button"
              onClick={() => setViewAngle('back')}
              className={`px-6 py-1 rounded-full text-xs font-display font-bold tracking-wide transition-all cursor-pointer outline-none ${
                viewAngle === 'back'
                  ? 'bg-white/40 text-white shadow-[0_2px_10px_rgba(255,255,255,0.3)]'
                  : 'text-white/85 hover:text-white'
              }`}
            >
              Back
            </button>
          </div>
        </div>

        {/* =============================================================== */}
        {/* VERTICAL OUTFIT STACK: TOP GARMENT DRAPED OVER TROUSERS         */}
        {/* =============================================================== */}
        <div className="relative z-10 w-full flex flex-col items-center justify-center pt-3 pb-2">
          {/* Top Garment (Shirt or Hoodie layered above trousers so hem covers button) */}
          <button
            type="button"
            onClick={() => {
              setOpenDropdown(null);
              setDrawerTab(isWinterTop ? 'hoodies' : 'shirts');
            }}
            className="relative z-20 h-[156px] sm:h-[176px] flex items-center justify-center cursor-pointer outline-none group"
            title={`Change ${topLabel} (${selectedTop.name})`}
            aria-label={`Selected ${topLabel}: ${selectedTop.name}. Click to change ${topLabel}.`}
          >
            <img
              src={topImageSrc}
              alt={selectedTop.name}
              className="h-full w-auto object-contain select-none transition-transform duration-200 group-hover:scale-[1.03]"
              loading="eager"
              decoding="async"
            />
          </button>

          {/* Trousers Garment pulled beneath top hem & shifted slightly left to align under placket */}
          <button
            type="button"
            onClick={() => {
              setOpenDropdown(null);
              setDrawerTab('trousers');
            }}
            className={`relative z-10 -mt-[22px] sm:-mt-[26px] h-[220px] sm:h-[244px] flex items-center justify-center cursor-pointer outline-none group transition-transform duration-200 ${
              viewAngle === 'front'
                ? selectedTrouser.id === 'BH-T09' || selectedTrouser.id === 'BH-T11'
                  ? '-translate-x-[3px]'
                  : '-translate-x-[6px] sm:-translate-x-[7px]'
                : '-translate-x-[2px]'
            }`}
            title={`Change trousers (${selectedTrouser.name})`}
            aria-label={`Selected trousers: ${selectedTrouser.name}. Click to change trousers.`}
          >
            {isTrouserSoldOut && (
              <span className="absolute top-8 left-1/2 -translate-x-1/2 z-20 px-3 py-0.5 rounded-full bg-red-600/95 border border-white/60 text-white font-display font-black text-[10px] tracking-[0.16em] uppercase shadow-md">
                SOLD OUT
              </span>
            )}
            <img
              src={trouserImageSrc}
              alt={selectedTrouser.name}
              className={`h-full w-auto object-contain select-none transition-transform duration-200 group-hover:scale-[1.02] ${
                isTrouserSoldOut ? 'opacity-75' : ''
              }`}
              loading="eager"
              decoding="async"
            />
          </button>
        </div>

        {/* Selected Look Caption */}
        <div className="relative z-10 w-full text-center mb-3">
          <p className="font-display text-xs font-semibold text-white/95 tracking-wide truncate px-2">
            {selectedTop.name} + {selectedTrouser.name}
          </p>
        </div>

        {/* =============================================================== */}
        {/* CONTROLS BELOW OUTFIT (Reference Exact Button & Dropdown Grid)  */}
        {/* =============================================================== */}
        <div ref={dropdownContainerRef} className="relative z-20 w-full space-y-2.5">
          {/* Row 1: Change shirt/hoodie | Change trousers */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => {
                setOpenDropdown(null);
                setDrawerTab(isWinterTop ? 'hoodies' : 'shirts');
              }}
              className="py-2.5 px-3 rounded-full bg-gradient-to-b from-white/30 to-white/10 hover:from-white/40 hover:to-white/20 border border-white/55 text-white font-display font-semibold text-xs sm:text-[13px] tracking-wide shadow-[0_6px_16px_rgba(4,24,43,0.16),inset_0_1px_1px_rgba(255,255,255,0.65)] transition-all active:scale-[0.97] cursor-pointer outline-none truncate"
            >
              {isWinterTop ? 'Change hoodie' : 'Change shirt'}
            </button>

            <button
              type="button"
              onClick={() => {
                setOpenDropdown(null);
                setDrawerTab('trousers');
              }}
              className="py-2.5 px-3 rounded-full bg-gradient-to-b from-white/30 to-white/10 hover:from-white/40 hover:to-white/20 border border-white/55 text-white font-display font-semibold text-xs sm:text-[13px] tracking-wide shadow-[0_6px_16px_rgba(4,24,43,0.16),inset_0_1px_1px_rgba(255,255,255,0.65)] transition-all active:scale-[0.97] cursor-pointer outline-none truncate"
            >
              Change trousers
            </button>
          </div>

          {/* Row 2: Top size M ⌄ | Trouser size M ⌄ */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* Top Size Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() =>
                  setOpenDropdown((prev) => (prev === 'top' ? null : 'top'))
                }
                className="w-full py-2.5 px-4 rounded-full bg-gradient-to-b from-white/25 to-white/10 hover:from-white/35 hover:to-white/20 border border-white/50 text-white font-display text-xs sm:text-[13px] flex items-center justify-between shadow-[0_4px_14px_rgba(4,24,43,0.14),inset_0_1px_1px_rgba(255,255,255,0.55)] transition-all cursor-pointer outline-none"
                aria-expanded={openDropdown === 'top'}
                aria-label={`Select ${topLabel} size`}
              >
                <span className="text-white/90 font-medium truncate">
                  {topLabelCap} size <strong className="text-white font-bold ml-1">{topSize}</strong>
                </span>
                <svg
                  className={`w-3.5 h-3.5 shrink-0 text-white/90 transition-transform duration-200 ${
                    openDropdown === 'top' ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2.4"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {openDropdown === 'top' && (
                <div className="absolute left-0 right-0 bottom-full mb-1.5 p-1.5 rounded-2xl bg-sky-900/85 border border-white/50 backdrop-blur-xl shadow-2xl flex items-center justify-between gap-1 z-30">
                  {SIZES.map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => {
                        setTopSize(sz);
                        setOpenDropdown(null);
                      }}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-display font-bold transition-all cursor-pointer ${
                        topSize === sz
                          ? 'bg-white text-slate-950 shadow-sm'
                          : 'text-white/85 hover:bg-white/15 hover:text-white'
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Trouser Size Dropdown */}
            <div className="relative">
              <button
                type="button"
                disabled={isTrouserSoldOut}
                onClick={() =>
                  setOpenDropdown((prev) => (prev === 'trouser' ? null : 'trouser'))
                }
                className={`w-full py-2.5 px-4 rounded-full border text-white font-display text-xs sm:text-[13px] flex items-center justify-between shadow-[0_4px_14px_rgba(4,24,43,0.14),inset_0_1px_1px_rgba(255,255,255,0.55)] transition-all outline-none ${
                  isTrouserSoldOut
                    ? 'bg-white/10 border-white/25 text-white/50 cursor-not-allowed'
                    : 'bg-gradient-to-b from-white/25 to-white/10 hover:from-white/35 hover:to-white/20 border-white/50 cursor-pointer'
                }`}
                aria-expanded={openDropdown === 'trouser'}
                aria-label="Select trouser size"
              >
                <span className="text-white/90 font-medium truncate">
                  Trouser size <strong className="text-white font-bold ml-1">{trouserSize}</strong>
                </span>
                <svg
                  className={`w-3.5 h-3.5 shrink-0 text-white/90 transition-transform duration-200 ${
                    openDropdown === 'trouser' ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2.4"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {openDropdown === 'trouser' && !isTrouserSoldOut && (
                <div className="absolute left-0 right-0 bottom-full mb-1.5 p-1.5 rounded-2xl bg-sky-900/85 border border-white/50 backdrop-blur-xl shadow-2xl flex items-center justify-between gap-1 z-30">
                  {SIZES.map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => {
                        setTrouserSize(sz);
                        setOpenDropdown(null);
                      }}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-display font-bold transition-all cursor-pointer ${
                        trouserSize === sz
                          ? 'bg-white text-slate-950 shadow-sm'
                          : 'text-white/85 hover:bg-white/15 hover:text-white'
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Row 3: ADD PAIR TO BAG Primary Full-Width Glass Pill */}
          <button
            type="button"
            disabled={isAdding || isUnavailable}
            onClick={handleAddPair}
            className={`w-full py-3.5 px-6 rounded-full border font-display text-sm sm:text-[15px] font-bold tracking-[0.06em] uppercase flex items-center justify-center gap-2.5 transition-all outline-none shadow-[0_10px_28px_rgba(4,24,43,0.24),inset_0_1px_1px_rgba(255,255,255,0.75)] ${
              isUnavailable
                ? 'bg-red-950/60 border-red-300/50 text-red-100 cursor-not-allowed'
                : pairAdded
                ? 'bg-emerald-500/70 border-emerald-200 text-white cursor-pointer'
                : 'bg-gradient-to-b from-white/35 via-white/20 to-white/10 hover:from-white/45 hover:to-white/20 border-white/65 text-white active:scale-[0.98] cursor-pointer'
            }`}
          >
            {!isUnavailable && !pairAdded && (
              <svg className="w-4 h-4 text-white shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            )}
            <span>
              {isUnavailable
                ? 'Selected Article Sold Out'
                : isAdding
                ? 'Adding Pair…'
                : pairAdded
                ? 'Pair Added to Bag ✓'
                : 'ADD PAIR TO BAG'}
            </span>
          </button>

          {/* Live Pair Savings & View Bag Link */}
          <div className="flex items-center justify-center gap-3 pt-0.5 text-[11px] font-display text-white/90">
            <span>
              15% Off Applied · Save PKR {discountAmount.toLocaleString()}
            </span>
            {pairAdded && (
              <button
                type="button"
                onClick={handleViewBag}
                className="underline font-bold text-white hover:text-cyan-100 cursor-pointer"
              >
                View Bag →
              </button>
            )}
          </div>
        </div>

        {/* =============================================================== */}
        {/* SLIDE-UP SHEET DRAWER: SHIRTS / HOODIES / TROUSERS              */}
        {/* =============================================================== */}
        {drawerTab !== null && (
          <div
            className="absolute inset-x-0 bottom-0 top-[18%] sm:top-[20%] z-30 rounded-t-[32px] bg-gradient-to-b from-[#71b9f2]/80 via-[#5ea7eb]/82 to-[#428fdc]/90 backdrop-blur-2xl border-t-[1.5px] border-x border-white/80 shadow-[0_-18px_50px_rgba(8,64,118,0.28),inset_0_1.5px_2px_rgba(255,255,255,0.75)] flex flex-col px-4 sm:px-5 pt-3 pb-4"
            role="dialog"
            aria-label={drawerHeading}
          >
            {/* White Handle Bar + Crisp Close X */}
            <div className="relative flex items-center justify-center mb-2">
              <div className="w-11 h-1.5 rounded-full bg-white shadow-sm" aria-hidden="true" />
              <button
                type="button"
                onClick={() => setDrawerTab(null)}
                className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center text-white hover:bg-white/15 transition-colors cursor-pointer outline-none"
                aria-label="Close selector"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Sheet Title */}
            <h2 className="font-display text-[22px] sm:text-2xl font-bold text-white text-center tracking-tight drop-shadow-[0_1px_4px_rgba(8,64,118,0.2)]">
              {drawerHeading}
            </h2>

            {/* Segmented Glossy Glass Pill Tabs: Shirts | Hoodies | Trousers */}
            <div className="mt-3 mx-auto p-0.5 rounded-full bg-white/18 border border-white/55 backdrop-blur-md inline-flex items-center shadow-[inset_0_1px_2px_rgba(255,255,255,0.3)]">
              <button
                type="button"
                onClick={() => setDrawerTab('shirts')}
                className={`px-4 sm:px-5 py-1.5 rounded-full text-xs sm:text-[13px] font-display font-bold tracking-wide transition-all cursor-pointer outline-none ${
                  drawerTab === 'shirts'
                    ? 'bg-gradient-to-b from-white/60 via-white/38 to-white/20 border border-white/80 text-white shadow-[0_2px_12px_rgba(255,255,255,0.4),inset_0_1px_1px_rgba(255,255,255,0.9)]'
                    : 'text-white/90 hover:text-white border border-transparent'
                }`}
              >
                Shirts
              </button>
              <button
                type="button"
                onClick={() => setDrawerTab('hoodies')}
                className={`px-4 sm:px-5 py-1.5 rounded-full text-xs sm:text-[13px] font-display font-bold tracking-wide transition-all cursor-pointer outline-none ${
                  drawerTab === 'hoodies'
                    ? 'bg-gradient-to-b from-white/60 via-white/38 to-white/20 border border-white/80 text-white shadow-[0_2px_12px_rgba(255,255,255,0.4),inset_0_1px_1px_rgba(255,255,255,0.9)]'
                    : 'text-white/90 hover:text-white border border-transparent'
                }`}
              >
                Hoodies
              </button>
              <button
                type="button"
                onClick={() => setDrawerTab('trousers')}
                className={`px-4 sm:px-5 py-1.5 rounded-full text-xs sm:text-[13px] font-display font-bold tracking-wide transition-all cursor-pointer outline-none ${
                  drawerTab === 'trousers'
                    ? 'bg-gradient-to-b from-white/60 via-white/38 to-white/20 border border-white/80 text-white shadow-[0_2px_12px_rgba(255,255,255,0.4),inset_0_1px_1px_rgba(255,255,255,0.9)]'
                    : 'text-white/90 hover:text-white border border-transparent'
                }`}
              >
                Trousers
              </button>
            </div>

            {/* 2-Column Scrollable Frosted Selection Cards (Exact Reference Look) */}
            <div className="mt-3.5 flex-1 overflow-y-auto px-0.5 py-0.5">
              <div className="grid grid-cols-2 gap-3 pb-1">
                {drawerTab === 'shirts'
                  ? SHIRT_PRODUCTS.map((shirt, idx) => {
                      const isSelected = shirt.id === selectedTop.id;
                      const cardImg =
                        viewAngle === 'back' && shirt.backImage
                          ? shirt.backImage
                          : shirt.image;
                      return (
                        <button
                          key={shirt.id}
                          type="button"
                          onClick={() => {
                            setSelectedTop(shirt);
                            setPairAdded(false);
                          }}
                          className={`relative rounded-2xl p-2.5 flex flex-col items-center justify-between transition-all cursor-pointer outline-none ${
                            isSelected
                              ? 'bg-gradient-to-b from-white/48 via-sky-100/32 to-sky-300/24 border-2 border-white shadow-[0_0_22px_rgba(56,189,248,0.85),0_0_8px_rgba(255,255,255,0.75),inset_0_0_16px_rgba(255,255,255,0.3)]'
                              : 'bg-gradient-to-b from-white/42 via-white/28 to-white/18 hover:from-white/52 hover:to-white/26 border border-white/55 backdrop-blur-md shadow-[0_4px_14px_rgba(12,72,130,0.12),inset_0_1px_1px_rgba(255,255,255,0.65)]'
                          }`}
                          aria-label={`Select ${shirt.name}`}
                        >
                          {isSelected && (
                            <span className="absolute top-2 right-2 z-20 w-6 h-6 rounded-full bg-gradient-to-b from-[#29d3f8] to-[#0284c7] border-2 border-white flex items-center justify-center shadow-[0_0_12px_rgba(56,189,248,0.9)]">
                              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            </span>
                          )}

                          <div className="w-full h-24 sm:h-28 flex items-center justify-center p-1">
                            <img
                              src={cardImg}
                              alt={shirt.name}
                              className="h-full w-auto object-contain select-none"
                              loading={idx < 4 ? 'eager' : 'lazy'}
                              decoding="async"
                            />
                          </div>

                          <span className="mt-1 font-display text-[13px] font-semibold text-white tracking-tight truncate w-full text-center drop-shadow-[0_1px_2px_rgba(8,64,118,0.25)]">
                            {shirt.name}
                          </span>
                        </button>
                      );
                    })
                  : drawerTab === 'hoodies'
                  ? HOODIE_PRODUCTS.map((hoodie, idx) => {
                      const isSelected = hoodie.id === selectedTop.id;
                      const cardImg =
                        viewAngle === 'back' && hoodie.backImage
                          ? hoodie.backImage
                          : hoodie.image;
                      return (
                        <button
                          key={hoodie.id}
                          type="button"
                          onClick={() => {
                            setSelectedTop(hoodie);
                            setPairAdded(false);
                          }}
                          className={`relative rounded-2xl p-2.5 flex flex-col items-center justify-between transition-all cursor-pointer outline-none ${
                            isSelected
                              ? 'bg-gradient-to-b from-white/48 via-sky-100/32 to-sky-300/24 border-2 border-white shadow-[0_0_22px_rgba(56,189,248,0.85),0_0_8px_rgba(255,255,255,0.75),inset_0_0_16px_rgba(255,255,255,0.3)]'
                              : 'bg-gradient-to-b from-white/42 via-white/28 to-white/18 hover:from-white/52 hover:to-white/26 border border-white/55 backdrop-blur-md shadow-[0_4px_14px_rgba(12,72,130,0.12),inset_0_1px_1px_rgba(255,255,255,0.65)]'
                          }`}
                          aria-label={`Select ${hoodie.name}`}
                        >
                          {isSelected && (
                            <span className="absolute top-2 right-2 z-20 w-6 h-6 rounded-full bg-gradient-to-b from-[#29d3f8] to-[#0284c7] border-2 border-white flex items-center justify-center shadow-[0_0_12px_rgba(56,189,248,0.9)]">
                              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            </span>
                          )}

                          <div className="w-full h-24 sm:h-28 flex items-center justify-center p-1">
                            <img
                              src={cardImg}
                              alt={hoodie.name}
                              className="h-full w-auto object-contain select-none"
                              loading={idx < 4 ? 'eager' : 'lazy'}
                              decoding="async"
                            />
                          </div>

                          <span className="mt-1 font-display text-[13px] font-semibold text-white tracking-tight truncate w-full text-center drop-shadow-[0_1px_2px_rgba(8,64,118,0.25)]">
                            {hoodie.name}
                          </span>
                        </button>
                      );
                    })
                  : MAIN_COLLECTION.map((trouser, idx) => {
                      const isSelected = trouser.id === selectedTrouser.id;
                      const cardImg =
                        viewAngle === 'back' && trouser.backImage
                          ? trouser.backImage
                          : trouser.image;
                      return (
                        <button
                          key={trouser.id}
                          type="button"
                          onClick={() => {
                            setSelectedTrouser(trouser);
                            setPairAdded(false);
                          }}
                          className={`relative rounded-2xl p-2.5 flex flex-col items-center justify-between transition-all cursor-pointer outline-none ${
                            isSelected
                              ? 'bg-gradient-to-b from-white/48 via-sky-100/32 to-sky-300/24 border-2 border-white shadow-[0_0_22px_rgba(56,189,248,0.85),0_0_8px_rgba(255,255,255,0.75),inset_0_0_16px_rgba(255,255,255,0.3)]'
                              : 'bg-gradient-to-b from-white/42 via-white/28 to-white/18 hover:from-white/52 hover:to-white/26 border border-white/55 backdrop-blur-md shadow-[0_4px_14px_rgba(12,72,130,0.12),inset_0_1px_1px_rgba(255,255,255,0.65)]'
                          }`}
                          aria-label={`Select ${trouser.name}`}
                        >
                          {isSelected && (
                            <span className="absolute top-2 right-2 z-20 w-6 h-6 rounded-full bg-gradient-to-b from-[#29d3f8] to-[#0284c7] border-2 border-white flex items-center justify-center shadow-[0_0_12px_rgba(56,189,248,0.9)]">
                              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            </span>
                          )}

                          {trouser.soldOut && (
                            <span className="absolute top-2 left-2 z-20 px-2 py-0.5 rounded-full bg-red-600/95 border border-white/60 text-[8.5px] font-display font-black uppercase tracking-wider text-white shadow">
                              SOLD OUT
                            </span>
                          )}

                          <div className="w-full h-24 sm:h-28 flex items-center justify-center p-1">
                            <img
                              src={cardImg}
                              alt={trouser.name}
                              className={`h-full w-auto object-contain select-none ${
                                trouser.soldOut ? 'opacity-65' : ''
                              }`}
                              loading={idx < 4 ? 'eager' : 'lazy'}
                              decoding="async"
                            />
                          </div>

                          <span className="mt-1 font-display text-[13px] font-semibold text-white tracking-tight truncate w-full text-center drop-shadow-[0_1px_2px_rgba(8,64,118,0.25)]">
                            {trouser.name}
                          </span>
                        </button>
                      );
                    })}
              </div>
            </div>

            {/* Done Button */}
            <button
              type="button"
              onClick={() => setDrawerTab(null)}
              className="mt-3 w-full py-3.5 rounded-full bg-gradient-to-b from-white/38 via-white/22 to-sky-300/25 hover:from-white/48 hover:to-sky-300/35 border border-white/80 text-white font-display font-bold text-base tracking-wide shadow-[0_8px_24px_rgba(8,64,118,0.22),inset_0_1.5px_2px_rgba(255,255,255,0.85)] transition-all active:scale-[0.98] cursor-pointer outline-none shrink-0"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
