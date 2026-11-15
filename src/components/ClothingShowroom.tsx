import React, { useState } from 'react';
import { PRODUCT_CATALOG, ProductRecord } from '../config/appConfig';

interface ClothingShowroomProps {
  onScrollToHero: () => void;
  onOpenProductInfo?: (product: ProductRecord) => void;
}

type RailBatch = 'empty' | 'batch1' | 'batch2';

export const ClothingShowroom: React.FC<ClothingShowroomProps> = ({
  onScrollToHero,
  onOpenProductInfo,
}) => {
  const [railBatch, setRailBatch] = useState<RailBatch>('empty');
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null);

  // Products
  const p1 = PRODUCT_CATALOG[0]; // BH-001
  const p2 = PRODUCT_CATALOG[1]; // BH-002
  const p3 = PRODUCT_CATALOG[2]; // BH-003
  const p4 = PRODUCT_CATALOG[3]; // BH-004

  // Handle category/batch button click
  const handleControlClick = () => {
    if (isTransitioning) return; // Prevent rapid clicking from breaking states

    setIsTransitioning(true);

    if (railBatch === 'empty') {
      // "Trousers" clicked: bring in BH-001, BH-002, BH-003 from left
      setRailBatch('batch1');
      setTimeout(() => {
        setIsTransitioning(false);
      }, 950);
    } else if (railBatch === 'batch1') {
      // "View More" clicked: slide batch 1 to right, bring BH-004 from left
      setRailBatch('batch2');
      setTimeout(() => {
        setIsTransitioning(false);
      }, 950);
    } else if (railBatch === 'batch2') {
      // "View More" clicked again: return to batch 1
      setRailBatch('batch1');
      setTimeout(() => {
        setIsTransitioning(false);
      }, 950);
    }
  };

  return (
    <section
      className="relative w-full h-[100vh] h-[100dvh] overflow-hidden select-none"
      aria-label="BAD HABIT Lower Clothing Showroom"
    >
      {/* Architectural Background */}
      <img
        src="/clean_plate.jpg"
        alt="Pale-blue architectural pavilion open to blue sky with white clouds and white floor"
        className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none z-0"
        loading="eager"
        decoding="sync"
      />

      {/* Ceiling ambient shadow cast by the structural slab above */}
      <div className="absolute top-0 left-0 w-full h-[48px] bg-gradient-to-b from-black/25 via-sky-950/10 to-transparent pointer-events-none z-10" />

      {/* Return to Hero indicator button (top right subtle access) */}
      <div className="absolute top-6 right-6 z-30 pointer-events-auto">
        <button
          onClick={onScrollToHero}
          className="text-xs font-medium tracking-wider text-white/70 hover:text-white px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md transition-all shadow-sm flex items-center gap-1.5"
          aria-label="Return to Level 02 Hero Runway"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
          <span>Hero Runway</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* CATEGORY & BATCH CONTROL BUTTON (Positioned Above Rail)  */}
      {/* "Trousers" initially, replaces with "View More"           */}
      {/* ======================================================== */}
      <div className="absolute top-[15%] sm:top-[16%] left-1/2 -translate-x-1/2 z-30 pointer-events-auto flex flex-col items-center">
        <button
          onClick={handleControlClick}
          disabled={isTransitioning}
          className={`glass-capsule-btn px-8 py-3 sm:px-10 sm:py-3.5 text-sm sm:text-base tracking-wide text-white transition-all duration-300 ${
            isTransitioning ? 'opacity-80 cursor-wait' : 'cursor-pointer'
          }`}
          aria-label={
            railBatch === 'empty'
              ? 'Trousers - Load initial batch of garments on rail'
              : railBatch === 'batch1'
              ? 'View More - Show next garment batch'
              : 'View More - Return to first garment batch'
          }
        >
          <span className="font-semibold select-none">
            {railBatch === 'empty' ? 'Trousers' : 'View More'}
          </span>
          <span className="text-[10px] ml-2 px-1.5 py-0.5 rounded-full bg-white/20 text-white/90 font-mono tracking-normal">
            {railBatch === 'empty' ? '0/4' : railBatch === 'batch1' ? '1-3 of 4' : '4 of 4'}
          </span>
        </button>

        {/* Guidance hint */}
        <p className="text-[11px] font-medium tracking-wider text-sky-950/70 sm:text-white/80 drop-shadow-[0_1px_4px_rgba(255,255,255,0.7)] mt-2 select-none uppercase">
          {railBatch === 'empty'
            ? 'Click Trousers to load rail'
            : railBatch === 'batch1'
            ? 'Showing BH-001, BH-002, BH-003'
            : 'Showing BH-004'}
        </p>
      </div>

      {/* ======================================================== */}
      {/* SUSPENDED METALLIC RAIL & SUSPENSION CABLES               */}
      {/* Matching Storyboard Reference                            */}
      {/* ======================================================== */}
      <div className="absolute top-[26%] left-0 w-full z-20 pointer-events-none">
        {/* Left and Right Ceiling Aircraft Cables dropped from ceiling to rail */}
        <div className="relative w-full max-w-[1360px] mx-auto h-[240px]">
          {/* Left suspension cable */}
          <div className="absolute -top-[26vh] left-[15%] w-[1.5px] h-[34vh] bg-gradient-to-b from-white/90 via-sky-100/70 to-slate-400 shadow-[0_0_4px_rgba(255,255,255,0.6)]">
            {/* Cable mounting bracket at rail */}
            <div className="absolute bottom-0 -left-[3.5px] w-[8px] h-[10px] rounded-sm bg-[#5c6b75] border border-white/60 shadow-sm" />
          </div>

          {/* Right suspension cable */}
          <div className="absolute -top-[26vh] right-[15%] w-[1.5px] h-[34vh] bg-gradient-to-b from-white/90 via-sky-100/70 to-slate-400 shadow-[0_0_4px_rgba(255,255,255,0.6)]">
            {/* Cable mounting bracket at rail */}
            <div className="absolute bottom-0 -left-[3.5px] w-[8px] h-[10px] rounded-sm bg-[#5c6b75] border border-white/60 shadow-sm" />
          </div>

          {/* Slim Metallic Rail (Satin Chrome Horizontal Cylinder) */}
          <div className="absolute top-[7.5vh] left-[4%] right-[4%] h-[6px] rounded-full bg-gradient-to-b from-white via-[#8fa3b3] to-[#435360] shadow-[0_3px_10px_rgba(7,27,45,0.22),inset_0_1px_1px_rgba(255,255,255,0.9)]">
            {/* Brushed metal specular highlight along top edge */}
            <div className="w-full h-[1.5px] bg-white/80 rounded-full" />
            {/* Left finial cap */}
            <div className="absolute -left-[4px] -top-[2px] w-[6px] h-[10px] rounded-sm bg-[#8a9ba7] shadow-sm" />
            {/* Right finial cap */}
            <div className="absolute -right-[4px] -top-[2px] w-[6px] h-[10px] rounded-sm bg-[#8a9ba7] shadow-sm" />
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* CLOTHING ON RAIL — PRECISE BATCH SLIDE ANIMATION         */}
      {/* ======================================================== */}
      <div className="absolute top-[32%] left-0 w-full h-[62vh] max-h-[640px] z-20 pointer-events-auto overflow-hidden">
        <div className="relative w-full max-w-[1360px] mx-auto h-full px-4 sm:px-8">

          {/* ---------------------------------------------------- */}
          {/* BATCH 1: BH-001, BH-002, BH-003                     */}
          {/* ---------------------------------------------------- */}
          {/* ITEM 1: BH-001 (Charcoal Sweatpants) ~22% position */}
          <div
            className={`absolute top-0 -translate-x-1/2 flex flex-col items-center transition-all duration-[850ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
              railBatch === 'empty'
                ? '-translate-x-[400%] opacity-0 pointer-events-none'
                : railBatch === 'batch1'
                ? 'opacity-100 pointer-events-auto'
                : 'translate-x-[400%] opacity-0 pointer-events-none'
            }`}
            style={{
              left: '22%',
              height: '100%',
            }}
          >
            <GarmentCard
              product={p1}
              isHovered={hoveredProduct === p1.id}
              onHover={() => setHoveredProduct(p1.id)}
              onLeave={() => setHoveredProduct(null)}
              onClick={() => onOpenProductInfo?.(p1)}
            />
          </div>

          {/* ITEM 2: BH-002 (Essentials Fear of God) ~50% position */}
          <div
            className={`absolute top-0 -translate-x-1/2 flex flex-col items-center transition-all duration-[850ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
              railBatch === 'empty'
                ? '-translate-x-[400%] opacity-0 pointer-events-none'
                : railBatch === 'batch1'
                ? 'opacity-100 pointer-events-auto'
                : 'translate-x-[400%] opacity-0 pointer-events-none'
            }`}
            style={{
              left: '50%',
              height: '100%',
              transitionDelay: railBatch === 'batch1' ? '40ms' : '0ms',
            }}
          >
            <GarmentCard
              product={p2}
              isHovered={hoveredProduct === p2.id}
              onHover={() => setHoveredProduct(p2.id)}
              onLeave={() => setHoveredProduct(null)}
              onClick={() => onOpenProductInfo?.(p2)}
            />
          </div>

          {/* ITEM 3: BH-003 (Slate Blue Drawstring) ~78% position */}
          <div
            className={`absolute top-0 -translate-x-1/2 flex flex-col items-center transition-all duration-[850ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
              railBatch === 'empty'
                ? '-translate-x-[400%] opacity-0 pointer-events-none'
                : railBatch === 'batch1'
                ? 'opacity-100 pointer-events-auto'
                : 'translate-x-[400%] opacity-0 pointer-events-none'
            }`}
            style={{
              left: '78%',
              height: '100%',
              transitionDelay: railBatch === 'batch1' ? '80ms' : '0ms',
            }}
          >
            <GarmentCard
              product={p3}
              isHovered={hoveredProduct === p3.id}
              onHover={() => setHoveredProduct(p3.id)}
              onLeave={() => setHoveredProduct(null)}
              onClick={() => onOpenProductInfo?.(p3)}
            />
          </div>

          {/* ---------------------------------------------------- */}
          {/* BATCH 2: BH-004 ONLY (Cream Linen Trousers) ~50%    */}
          {/* ---------------------------------------------------- */}
          <div
            className={`absolute top-0 -translate-x-1/2 flex flex-col items-center transition-all duration-[850ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
              railBatch === 'batch2'
                ? 'opacity-100 pointer-events-auto'
                : '-translate-x-[400%] opacity-0 pointer-events-none'
            }`}
            style={{
              left: '50%',
              height: '100%',
            }}
          >
            <GarmentCard
              product={p4}
              isHovered={hoveredProduct === p4.id}
              onHover={() => setHoveredProduct(p4.id)}
              onLeave={() => setHoveredProduct(null)}
              onClick={() => onOpenProductInfo?.(p4)}
            />
          </div>

        </div>
      </div>

      {/* Subtle floor contact shadow beneath the rail plane */}
      <div className="absolute bottom-0 left-0 w-full h-[14vh] bg-gradient-to-t from-black/5 to-transparent pointer-events-none z-15" />
    </section>
  );
};

interface GarmentCardProps {
  product: ProductRecord;
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
  onClick: () => void;
}

const GarmentCard: React.FC<GarmentCardProps> = ({
  product,
  isHovered,
  onHover,
  onLeave,
  onClick,
}) => {
  return (
    <div
      className="relative flex flex-col items-center justify-start cursor-pointer group h-full outline-none focus-visible:ring-2 focus-visible:ring-sky-400 rounded-lg p-2"
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={`Article ${product.id}. Click to inspect asset records.`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {/* Floating Permanent ID Tag */}
      <div
        className={`mb-2 px-2.5 py-0.5 rounded-full text-[11px] font-mono tracking-wider transition-all duration-200 border ${
          isHovered
            ? 'bg-sky-950/80 text-white border-sky-400/60 shadow-md scale-105'
            : 'bg-black/40 text-white/80 border-white/20'
        }`}
      >
        {product.id}
      </div>

      {/* Garment Image on Black Hanger */}
      <div className="relative flex-1 flex items-start justify-center max-w-[28vw] sm:max-w-[240px] md:max-w-[280px]">
        <img
          src={product.resolvedAssetUrl}
          alt={`Permanent ID ${product.id} hanging on rail`}
          className="h-full w-auto max-h-[44vh] sm:max-h-[46vh] object-contain object-top select-none transition-transform duration-300 group-hover:scale-[1.01]"
          loading="eager"
          decoding="sync"
        />
      </div>

      {/* Article Status Note (No invented prices/sizes) */}
      <div
        className={`mt-2 transition-opacity duration-200 text-center ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <span className="text-[10px] font-mono text-sky-950 font-semibold px-2 py-0.5 rounded bg-white/70 backdrop-blur-sm shadow-sm">
          Awaiting Model Try-On
        </span>
      </div>
    </div>
  );
};
