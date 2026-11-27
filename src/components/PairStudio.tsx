import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  SHIRT_PRODUCTS,
  HOODIE_PRODUCTS,
  MAIN_COLLECTION,
  getShirtCardFrame,
  Product,
} from '../data/products';
import { useCart } from '../context/CartContext';
import { parseNumericPrice, PAIR_DISCOUNT_RATE } from '../utils/pairPricing';
import { preloadCategoryImages, preloadPairAlternateAngles } from '../utils/preloadImages';
import { SmartImage } from './SmartImage';

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
  const pairAddedTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (pairAddedTimerRef.current !== null) {
        window.clearTimeout(pairAddedTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    preloadCategoryImages('pair');
  }, []);

  useEffect(() => {
    if (viewAngle === 'front') {
      preloadPairAlternateAngles(selectedTop, selectedTrouser);
    }
  }, [selectedTop, selectedTrouser, viewAngle]);

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
      if (pairAddedTimerRef.current !== null) {
        window.clearTimeout(pairAddedTimerRef.current);
      }
      pairAddedTimerRef.current = window.setTimeout(() => {
        pairAddedTimerRef.current = null;
        setPairAdded(false);
      }, 3500);
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

  const controlsContent = (
    <div ref={dropdownContainerRef} className="relative z-20 w-full space-y-2">
      {/* Row 1: Change shirt/hoodie | Change trousers */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => {
            setOpenDropdown(null);
            setDrawerTab(isWinterTop ? 'hoodies' : 'shirts');
          }}
          className="glass-capsule glass-capsule-hover py-2 px-2.5 rounded-[0.25rem] text-white font-grotesk font-semibold text-[12.5px] sm:text-[13.5px] tracking-wide transition-all active:scale-[0.97] cursor-pointer outline-none truncate"
        >
          {isWinterTop ? 'Change hoodie' : 'Change shirt'}
        </button>

        <button
          type="button"
          onClick={() => {
            setOpenDropdown(null);
            setDrawerTab('trousers');
          }}
          className="glass-capsule glass-capsule-hover py-2 px-2.5 rounded-[0.25rem] text-white font-grotesk font-semibold text-[12.5px] sm:text-[13.5px] tracking-wide transition-all active:scale-[0.97] cursor-pointer outline-none truncate"
        >
          Change trousers
        </button>
      </div>

      {/* Row 2: Top size M | Trouser size M */}
      <div className="grid grid-cols-2 gap-2">
        {/* Top Size Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() =>
              setOpenDropdown((prev) => (prev === 'top' ? null : 'top'))
            }
            className="glass-capsule glass-capsule-hover w-full py-2 px-3 rounded-[0.25rem] text-white font-grotesk text-[12.5px] sm:text-[13.5px] flex items-center justify-between transition-all cursor-pointer outline-none"
            aria-expanded={openDropdown === 'top'}
            aria-label={`Select ${topLabel} size`}
          >
            <span className="text-white/90 font-medium truncate">
              {topLabelCap} size <strong className="text-white font-bold ml-1">{topSize}</strong>
            </span>
            <svg
              className={`w-3.5 h-3.5 shrink-0 text-white transition-transform duration-200 ${
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
            <div className="absolute left-0 right-0 bottom-full mb-1.5 p-1.5 rounded-[0.5rem] bg-sky-900/90 border border-white/50 backdrop-blur-xl shadow-2xl flex items-center justify-between gap-1 z-30">
              {SIZES.map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => {
                    setTopSize(sz);
                    setOpenDropdown(null);
                  }}
                  className={`flex-1 py-1.5 rounded-[0.25rem] text-xs font-grotesk font-bold transition-all cursor-pointer ${
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
            className={`w-full py-2 px-3 rounded-[0.25rem] border font-grotesk text-[12.5px] sm:text-[13.5px] flex items-center justify-between transition-all outline-none ${
              isTrouserSoldOut
                ? 'bg-white/15 border-white/30 text-white/45 cursor-not-allowed'
                : 'glass-capsule glass-capsule-hover text-white cursor-pointer'
            }`}
            aria-expanded={openDropdown === 'trouser'}
            aria-label="Select trouser size"
          >
            <span className={`font-medium truncate ${isTrouserSoldOut ? 'text-white/45' : 'text-white/90'}`}>
              Trouser size <strong className="font-bold ml-1 text-white">{trouserSize}</strong>
            </span>
            <svg
              className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${
                isTrouserSoldOut ? 'text-white/45' : 'text-white'
              } ${openDropdown === 'trouser' ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2.4"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {openDropdown === 'trouser' && !isTrouserSoldOut && (
            <div className="absolute left-0 right-0 bottom-full mb-1.5 p-1.5 rounded-[0.5rem] bg-sky-900/90 border border-white/50 backdrop-blur-xl shadow-2xl flex items-center justify-between gap-1 z-30">
              {SIZES.map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => {
                    setTrouserSize(sz);
                    setOpenDropdown(null);
                  }}
                  className={`flex-1 py-1.5 rounded-[0.25rem] text-xs font-grotesk font-bold transition-all cursor-pointer ${
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
        className={`w-full py-2.5 sm:py-3 px-4 rounded-[0.25rem] border font-grotesk text-[14px] sm:text-[15.5px] font-bold tracking-[0.06em] uppercase flex items-center justify-center gap-2 transition-all outline-none ${
          isUnavailable
            ? 'bg-red-950/60 border-red-300/50 text-red-100 cursor-not-allowed'
            : pairAdded
            ? 'bg-emerald-500/90 border-emerald-200 text-white cursor-pointer'
            : 'selected-reveal-capsule text-white active:scale-[0.98] cursor-pointer'
        }`}
      >
        {!isUnavailable && !pairAdded && (
          <svg className="w-3.5 h-3.5 text-white shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
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
      <div className="flex items-center justify-start sm:justify-start gap-3 pt-0.5 text-[11px] font-grotesk text-white/95">
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
  );

  return (
    <div
      className={`w-full text-white font-display select-none flex flex-col items-center ${
        isDesktopShowroom
          ? 'h-full overflow-y-auto overscroll-contain pt-[142px] lg:pt-[148px] pb-3.5 px-4 sm:px-6 lg:px-10 justify-start'
          : 'flex-1 min-h-[calc(100svh-72px)] px-2.5 sm:px-5 pt-1 pb-3 justify-between'
      }`}
    >
      {/* Top Back Navigation Control */}
      <div
        className={`w-full flex items-center justify-between mb-2 shrink-0 ${
          isDesktopShowroom ? 'max-w-[1280px]' : 'max-w-none'
        }`}
      >
        <button
          type="button"
          onClick={onBack}
          className="glass-capsule glass-capsule-hover inline-flex items-center gap-1 px-3 py-1 rounded-[0.25rem] text-[12px] font-grotesk font-semibold tracking-[0.10em] uppercase text-white transition-all active:scale-95 cursor-pointer outline-none shadow-sm"
        >
          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
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
      {/* FULL-SCREEN ATELIER PAIR BOARD (Text/Controls Left · Clothes Right)*/}
      {/* ================================================================= */}
      <div
        className={`relative w-full rounded-[0.5rem] border border-white/55 bg-gradient-to-b from-sky-200/20 via-sky-300/15 to-sky-500/25 backdrop-blur-md shadow-[0_24px_64px_rgba(4,24,43,0.32),inset_0_1px_1px_rgba(255,255,255,0.65)] flex-1 flex flex-col justify-between ${
          isDesktopShowroom ? 'max-w-[1280px] p-4 sm:p-6 lg:p-8' : 'max-w-none p-3.5 sm:p-6'
        }`}
      >
        {/* Subtle Inner Radial Glow */}
        <div
          className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 w-72 h-44 rounded-full bg-white/25 blur-3xl"
          aria-hidden="true"
        />

        {/* Side-by-Side Split: Text & Controls on Left · Larger Garments on Right */}
        <div className="relative z-10 w-full flex-1 grid grid-cols-[0.86fr_1.14fr] sm:grid-cols-[0.9fr_1.1fr] gap-2.5 sm:gap-6 lg:gap-10 items-center min-h-0">
          {/* LEFT HAND SIDE: Header Text, Top Toggle Pills, Caption & Desktop Controls */}
          <div className="min-w-0 flex flex-col items-start text-left">
            <span className="font-grotesk text-[11px] sm:text-xs font-bold tracking-[0.22em] text-white/95 uppercase drop-shadow-sm">
              BAD HABIT
            </span>

            <h1 className="font-display text-lg min-[390px]:text-xl sm:text-[26px] lg:text-3xl font-black tracking-[0.04em] text-white uppercase leading-tight mt-0.5 drop-shadow-[0_2px_8px_rgba(4,24,43,0.25)]">
              MAKE A PAIR
            </h1>

            {/* 15% OFF Pill */}
            <span className="glass-capsule mt-1.5 inline-flex items-center justify-center px-3 py-0.5 rounded-[0.25rem] text-white font-grotesk font-black text-[12px] sm:text-[13.5px] tracking-[0.1em] uppercase">
              15% OFF
            </span>

            {/* Front / Back Delicate Segmented Glass Pill */}
            <div className="glass-capsule mt-2 p-[2px] rounded-[0.25rem] inline-flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => setViewAngle('front')}
                className={`px-2.5 sm:px-3 py-[2px] rounded-[0.2rem] text-[10.5px] sm:text-[11px] font-grotesk font-semibold tracking-[0.08em] uppercase transition-all cursor-pointer outline-none ${
                  viewAngle === 'front'
                    ? 'bg-white/28 backdrop-blur-md border border-white/80 text-white shadow-sm'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                Front
              </button>
              <button
                type="button"
                onClick={() => setViewAngle('back')}
                className={`px-2.5 sm:px-3 py-[2px] rounded-[0.2rem] text-[10.5px] sm:text-[11px] font-grotesk font-semibold tracking-[0.08em] uppercase transition-all cursor-pointer outline-none ${
                  viewAngle === 'back'
                    ? 'bg-white/28 backdrop-blur-md border border-white/80 text-white shadow-sm'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                Back
              </button>
            </div>

            {/* Selected Look Caption */}
            <div className="w-full mt-3 mb-2 sm:mb-3.5">
              <p className="font-grotesk text-[12.5px] sm:text-[14px] lg:text-[15px] font-bold text-white tracking-wide leading-snug break-words drop-shadow-[0_1px_3px_rgba(4,24,43,0.45)]">
                {selectedTop.name} + {selectedTrouser.name}
              </p>
              {selectedTop.subtitle && (
                <p className="text-[10.5px] font-sans text-white/80 tracking-tight leading-snug mt-0.5">
                  {selectedTop.subtitle}
                </p>
              )}
            </div>

            {/* Action Controls Inside Left Column on Tablet / Desktop */}
            <div className="hidden sm:block w-full max-w-[440px] mt-1">
              {controlsContent}
            </div>
          </div>

          {/* RIGHT HAND SIDE: Enlarged Garments Matched Front-to-Back */}
          <div className="flex flex-col items-center justify-center w-full h-full">
            {/* Top Garment (Shirt or Hoodie layered above trousers) */}
            <button
              type="button"
              onClick={() => {
                setOpenDropdown(null);
                setDrawerTab(isWinterTop ? 'hoodies' : 'shirts');
              }}
              className={`relative z-20 min-w-[140px] sm:min-w-[180px] flex items-center justify-center cursor-pointer outline-none group ${
                selectedTop.id === 'BH-S06' && viewAngle === 'back'
                  ? 'h-[146px] min-[390px]:h-[164px] sm:h-[20vh] lg:h-[23vh] xl:h-[25vh] max-h-[230px] my-[10px] sm:my-[12px]'
                  : 'h-[172px] min-[390px]:h-[192px] sm:h-[23vh] lg:h-[26vh] xl:h-[29vh] max-h-[265px]'
              }`}
              title={`Change ${topLabel} (${selectedTop.name})`}
              aria-label={`Selected ${topLabel}: ${selectedTop.name}. Click to change ${topLabel}.`}
            >
              <SmartImage
                src={topImageSrc}
                alt={selectedTop.name}
                responsive={false}
                className="h-full w-auto object-contain select-none transition-transform duration-200 group-hover:scale-[1.03]"
                skeletonClassName="inset-2 rounded-[0.5rem]"
                loading="eager"
                decoding="async"
                fetchPriority="high"
              />
            </button>

            {/* Trousers Garment meeting shirt hem cleanly so Front waistband matches Back view */}
            <button
              type="button"
              onClick={() => {
                setOpenDropdown(null);
                setDrawerTab('trousers');
              }}
              className="relative z-10 -mt-[2px] sm:-mt-[4px] -translate-x-[1px] sm:-translate-x-[2px] min-w-[125px] sm:min-w-[160px] h-[238px] min-[390px]:h-[264px] sm:h-[33vh] lg:h-[37vh] xl:h-[40vh] max-h-[375px] flex items-center justify-center cursor-pointer outline-none group transition-transform duration-200"
              title={`Change trousers (${selectedTrouser.name})`}
              aria-label={`Selected trousers: ${selectedTrouser.name}. Click to change trousers.`}
            >
              {isTrouserSoldOut && (
                <span className="absolute top-6 left-1/2 -translate-x-1/2 z-20 px-2.5 py-0.5 rounded-[0.25rem] bg-red-600/95 border border-white/60 text-white font-grotesk font-black text-[11px] tracking-[0.14em] uppercase shadow-md">
                  SOLD OUT
                </span>
              )}
              <SmartImage
                src={trouserImageSrc}
                alt={selectedTrouser.name}
                responsive={false}
                className={`h-full w-auto object-contain select-none transition-transform duration-200 group-hover:scale-[1.02] ${
                  isTrouserSoldOut ? 'opacity-75' : ''
                }`}
                skeletonClassName="inset-2 rounded-[0.5rem]"
                loading="eager"
                decoding="async"
                fetchPriority="high"
              />
            </button>
          </div>
        </div>

        {/* Action Controls Full-Width Below on Narrow Mobile Only (< 640px) */}
        <div className="sm:hidden relative z-20 w-full mt-2.5 pt-2.5 border-t border-white/20 shrink-0">
          {controlsContent}
        </div>

        {/* =============================================================== */}
        {/* SLIDE-UP SHEET DRAWER: SHIRTS / HOODIES / TROUSERS              */}
        {/* =============================================================== */}
        {drawerTab !== null && (
          <div
            className="absolute inset-x-0 bottom-0 top-[8%] sm:top-[10%] z-30 rounded-none bg-gradient-to-b from-[#71b9f2]/90 via-[#5ea7eb]/90 to-[#428fdc]/95 backdrop-blur-2xl border-t-[1.5px] border-x border-white/80 shadow-[0_-18px_50px_rgba(8,64,118,0.28),inset_0_1.5px_2px_rgba(255,255,255,0.75)] flex flex-col px-4 sm:px-5 pt-3 pb-4"
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

            {/* Segmented Glass Pill Tabs: Shirts | Hoodies | Trousers */}
            <div className="glass-capsule mt-2.5 mx-auto p-0.5 rounded-[0.25rem] inline-flex items-center">
              <button
                type="button"
                onClick={() => setDrawerTab('shirts')}
                className={`px-3.5 sm:px-4.5 py-1 rounded-[0.25rem] text-[13px] sm:text-[14px] font-grotesk font-bold tracking-wide transition-all cursor-pointer outline-none ${
                  drawerTab === 'shirts'
                    ? 'bg-white/28 backdrop-blur-md border border-white/80 text-white shadow-sm'
                    : 'text-white/80 hover:text-white border border-transparent'
                }`}
              >
                Shirts
              </button>
              <button
                type="button"
                onClick={() => setDrawerTab('hoodies')}
                className={`px-3.5 sm:px-4.5 py-1 rounded-[0.25rem] text-[13px] sm:text-[14px] font-grotesk font-bold tracking-wide transition-all cursor-pointer outline-none ${
                  drawerTab === 'hoodies'
                    ? 'bg-white/28 backdrop-blur-md border border-white/80 text-white shadow-sm'
                    : 'text-white/80 hover:text-white border border-transparent'
                }`}
              >
                Hoodies
              </button>
              <button
                type="button"
                onClick={() => setDrawerTab('trousers')}
                className={`px-3.5 sm:px-4.5 py-1 rounded-[0.25rem] text-[13px] sm:text-[14px] font-grotesk font-bold tracking-wide transition-all cursor-pointer outline-none ${
                  drawerTab === 'trousers'
                    ? 'bg-white/28 backdrop-blur-md border border-white/80 text-white shadow-sm'
                    : 'text-white/80 hover:text-white border border-transparent'
                }`}
              >
                Trousers
              </button>
            </div>

            {/* Frosted Selection Cards */}
            <div className="mt-3.5 flex-1 overflow-y-auto px-0.5 py-0.5">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pb-1">
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
                          className={`relative rounded-[0.5rem] p-2.5 flex flex-col items-center justify-between transition-all cursor-pointer outline-none ${
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

                          <div
                            className={`relative w-full h-24 sm:h-28 flex items-center justify-center ${
                              viewAngle === 'back' && shirt.id === 'BH-S06'
                                ? 'p-3'
                                : getShirtCardFrame(shirt.id).mobileDetailPaddingClass
                            }`}
                          >
                            <SmartImage
                              src={cardImg}
                              alt={shirt.name}
                              className="h-full w-auto object-contain select-none"
                              sizes="(max-width: 640px) 42vw, 180px"
                              skeletonClassName="inset-1 rounded-[0.5rem]"
                              skeletonVariant="compact"
                              loading={idx < 4 ? 'eager' : 'lazy'}
                              decoding="async"
                            />
                          </div>

                          <span className="mt-1 font-display text-[13px] font-semibold text-white tracking-tight truncate w-full text-center drop-shadow-[0_1px_2px_rgba(8,64,118,0.25)]">
                            {shirt.name}
                          </span>
                          {shirt.subtitle && (
                            <span className="text-[10px] font-sans text-white/75 tracking-tight truncate w-full text-center">
                              {shirt.subtitle}
                            </span>
                          )}
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
                          className={`relative rounded-[0.5rem] p-2.5 flex flex-col items-center justify-between transition-all cursor-pointer outline-none ${
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

                          <div className="relative w-full h-24 sm:h-28 flex items-center justify-center p-1">
                            <SmartImage
                              src={cardImg}
                              alt={hoodie.name}
                              className="h-full w-auto object-contain select-none"
                              sizes="(max-width: 640px) 42vw, 180px"
                              skeletonClassName="inset-1 rounded-[0.5rem]"
                              skeletonVariant="compact"
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
                          className={`relative rounded-[0.5rem] p-2.5 flex flex-col items-center justify-between transition-all cursor-pointer outline-none ${
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
                            <span className="absolute top-2 left-2 z-20 px-2 py-0.5 rounded-[0.25rem] bg-red-600/95 border border-white/60 text-[11px] font-grotesk font-black uppercase tracking-wider text-white shadow">
                              SOLD OUT
                            </span>
                          )}

                          <div className="relative w-full h-24 sm:h-28 flex items-center justify-center p-1">
                            <SmartImage
                              src={cardImg}
                              alt={trouser.name}
                              className={`h-full w-auto object-contain select-none ${
                                trouser.soldOut ? 'opacity-65' : ''
                              }`}
                              sizes="(max-width: 640px) 42vw, 180px"
                              skeletonClassName="inset-1 rounded-[0.5rem]"
                              skeletonVariant="compact"
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
              className="selected-reveal-capsule mt-3 w-full py-3 rounded-[0.25rem] text-white font-grotesk font-bold text-[16.5px] tracking-wide transition-all active:scale-[0.98] cursor-pointer outline-none shrink-0"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
