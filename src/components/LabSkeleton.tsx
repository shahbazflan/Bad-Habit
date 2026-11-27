import React from 'react';

export type SkeletonVariant = 'specimen' | 'compact' | 'canvas';

interface GarmentSkeletonFrameProps {
  variant?: SkeletonVariant;
  className?: string;
}

/**
 * Lightweight CSS-only architectural specimen frame shown while product imagery
 * or dual-layer garments are downloading/decoding over network latency.
 */
export const GarmentSkeletonFrame: React.FC<GarmentSkeletonFrameProps> = ({
  variant = 'specimen',
  className = 'inset-2 rounded-[0.5rem]',
}) => {
  if (variant === 'compact') {
    return (
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute z-0 lab-skeleton-compact ${className}`}
      />
    );
  }

  if (variant === 'canvas') {
    return (
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute z-0 lab-skeleton flex flex-col items-center justify-center gap-2 px-5 py-7 ${className}`}
      >
        <span className="lab-skeleton-reticle" />
        <span className="lab-skeleton-axis" />
        {/* Proportional upper & lower garment structural silhouettes */}
        <span className="relative z-10 w-[56%] h-[34%] rounded-[0.25rem] border border-white/25 bg-white/[0.06]" />
        <span className="relative z-10 w-[44%] h-[46%] grid grid-cols-2 gap-1.5">
          <span className="rounded-[0.2rem] border border-white/25 bg-white/[0.06]" />
          <span className="rounded-[0.2rem] border border-white/25 bg-white/[0.06]" />
        </span>
      </span>
    );
  }

  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute z-0 lab-skeleton ${className}`}
    >
      <span className="lab-skeleton-reticle" />
      <span className="lab-skeleton-axis" />
    </span>
  );
};

interface ProductGridSkeletonProps {
  count?: number;
}

/**
 * Matches MobileProductGrid proportions cleanly while category chunk/images resolve.
 */
export const ProductGridSkeleton: React.FC<ProductGridSkeletonProps> = ({ count = 4 }) => {
  return (
    <div
      role="status"
      aria-label="Loading collection"
      className="w-full text-white px-4 py-3 select-none pb-12"
    >
      <span className="sr-only">Loading collection…</span>

      {/* Top header placeholder bar matching MobileHeader */}
      <div className="mb-4 flex items-center justify-between">
        <div className="lab-skeleton-bar w-10 h-10" />
        <div className="lab-skeleton-bar w-28 h-5" />
        <div className="lab-skeleton-bar w-10 h-10" />
      </div>

      {/* Back breadcrumb & uppercase category headline placeholders */}
      <div className="mb-2">
        <div className="lab-skeleton-bar w-32 h-4" />
      </div>
      <div className="mb-4">
        <div className="lab-skeleton-bar w-44 h-7" />
      </div>

      {/* 2-Column Architectural Frosted Specimen Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
        {Array.from({ length: count }).map((_, idx) => (
          <div
            key={idx}
            className="w-full rounded-[0.5rem] bg-white/[0.10] border border-white/20 backdrop-blur-[6px] p-2.5 sm:p-3 flex flex-col items-center justify-between"
          >
            <div className="relative w-full h-72 sm:h-76 overflow-hidden">
              <GarmentSkeletonFrame variant="specimen" className="inset-2 rounded-[0.5rem]" />
            </div>

            <div className="w-full mt-2 px-2 flex flex-col items-center gap-2">
              <div className="lab-skeleton-bar w-32 h-4" />
              <div className="lab-skeleton-bar w-24 h-6" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Matches MobileProductDetail proportions when transitioning into an article stage.
 */
export const ProductDetailSkeleton: React.FC = () => {
  return (
    <div
      role="status"
      aria-label="Loading garment specification"
      className="w-full text-white px-4 py-3 select-none pb-28"
    >
      <span className="sr-only">Loading product details…</span>

      <div className="mb-2 flex items-center justify-between">
        <div className="lab-skeleton-bar w-32 h-4" />
        <div className="lab-skeleton-bar w-20 h-5" />
      </div>

      <div className="relative w-full h-[52vh] sm:h-[58vh] min-h-[340px] max-h-[540px] flex items-center justify-center pl-4 pr-12">
        <div className="relative w-full h-full">
          <GarmentSkeletonFrame variant="specimen" className="inset-3 rounded-[0.5rem]" />
        </div>
        <div className="absolute right-1 top-1/2 -translate-y-1/2 flex flex-col gap-2">
          {[0, 1, 2].map((dot) => (
            <div key={dot} className="lab-skeleton-compact w-5 h-5 rounded-full" />
          ))}
        </div>
      </div>

      <div className="mt-3 flex justify-center">
        <div className="lab-skeleton-bar w-40 h-6" />
      </div>

      <div className="mt-3 flex justify-center gap-2">
        {[0, 1, 2].map((thumb) => (
          <div key={thumb} className="lab-skeleton-compact w-14 h-14 rounded-xl" />
        ))}
      </div>

      <div className="w-full rounded-[0.5rem] bg-white/[0.10] border border-white/20 backdrop-blur-xl p-4 flex flex-col items-center gap-3 mt-3">
        <div className="lab-skeleton-bar w-44 h-5" />
        <div className="lab-skeleton-bar w-28 h-7" />
        <div className="flex gap-2">
          {[0, 1, 2, 3].map((sz) => (
            <div key={sz} className="lab-skeleton-bar w-10 h-9 rounded-lg" />
          ))}
        </div>
        <div className="lab-skeleton-bar w-full h-11" />
        <div className="lab-skeleton-bar w-full h-10" />
      </div>
    </div>
  );
};

interface PairStudioSkeletonProps {
  isDesktopShowroom?: boolean;
}

/**
 * Matches PairStudio split atelier layout while the studio chunk resolves.
 */
export const PairStudioSkeleton: React.FC<PairStudioSkeletonProps> = ({
  isDesktopShowroom = false,
}) => {
  return (
    <div
      role="status"
      aria-label="Loading Pair Studio"
      className={`w-full text-white select-none flex flex-col items-center ${
        isDesktopShowroom
          ? 'h-full pt-[142px] lg:pt-[148px] pb-3.5 px-4 sm:px-6 lg:px-10 justify-start'
          : 'flex-1 min-h-[calc(100svh-72px)] px-2.5 sm:px-5 pt-2 pb-3 justify-between'
      }`}
    >
      <span className="sr-only">Loading Pair Studio…</span>

      <div
        className={`w-full flex items-center justify-between mb-2 ${
          isDesktopShowroom ? 'max-w-[1280px]' : ''
        }`}
      >
        <div className="lab-skeleton-bar w-32 h-7" />
        <div className="lab-skeleton-bar w-28 h-5" />
      </div>

      <div
        className={`w-full rounded-[0.5rem] border border-white/30 bg-white/[0.08] backdrop-blur-md flex-1 grid grid-cols-[0.86fr_1.14fr] gap-4 sm:gap-8 items-center ${
          isDesktopShowroom ? 'max-w-[1280px] p-4 sm:p-6 lg:p-8' : 'p-3.5 sm:p-6'
        }`}
      >
        <div className="flex flex-col gap-3">
          <div className="lab-skeleton-bar w-24 h-3.5" />
          <div className="lab-skeleton-bar w-44 h-8" />
          <div className="lab-skeleton-bar w-20 h-6" />
          <div className="lab-skeleton-bar w-36 h-4 mt-2" />
          <div className="hidden sm:grid grid-cols-2 gap-2 mt-2">
            <div className="lab-skeleton-bar h-9" />
            <div className="lab-skeleton-bar h-9" />
            <div className="lab-skeleton-bar h-9" />
            <div className="lab-skeleton-bar h-9" />
          </div>
          <div className="hidden sm:block lab-skeleton-bar w-full h-11 mt-1" />
        </div>

        <div className="relative w-full h-[320px] sm:h-[420px]">
          <GarmentSkeletonFrame variant="canvas" className="inset-0 rounded-[0.5rem]" />
        </div>
      </div>
    </div>
  );
};

/**
 * Matches Desktop ShowroomFloor viewport while chunk resolves after hero scroll.
 */
export const ShowroomStageSkeleton: React.FC = () => {
  return (
    <section
      role="status"
      aria-label="Loading desktop showroom"
      className="relative w-full h-[100vh] h-[100dvh] overflow-hidden bg-[#1f486d] select-none flex flex-col items-center justify-center px-8 lg:px-16"
    >
      <span className="sr-only">Loading Showroom…</span>

      {/* Header bar placeholder matching ShowroomFloor top bar */}
      <div className="absolute top-6 inset-x-8 lg:inset-x-14 flex items-center justify-between">
        <div className="lab-skeleton-bar w-32 h-7" />
        <div className="flex items-center gap-3">
          <div className="lab-skeleton-bar w-24 h-7" />
          <div className="lab-skeleton-bar w-24 h-7" />
          <div className="lab-skeleton-bar w-24 h-7" />
          <div className="lab-skeleton-bar w-28 h-7" />
        </div>
        <div className="lab-skeleton-bar w-24 h-8" />
      </div>

      {/* 4-Panel Architectural Specimen Row */}
      <div className="w-full max-w-[1460px] mt-16 grid grid-cols-4 gap-4 lg:gap-6 h-[56vh] max-h-[540px]">
        {[0, 1, 2, 3].map((panel) => (
          <div key={panel} className="relative w-full h-full flex flex-col gap-3">
            <div className="relative flex-1">
              <GarmentSkeletonFrame variant="specimen" className="inset-0 rounded-[0.5rem]" />
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <div className="lab-skeleton-bar w-28 h-4" />
              <div className="lab-skeleton-bar w-36 h-9" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

interface OverlayPanelSkeletonProps {
  variant?: 'drawer' | 'modal' | 'page';
}

/**
 * Architectural frosted placeholder for lazy-loaded drawers, modals, and checkout overlays.
 */
export const OverlayPanelSkeleton: React.FC<OverlayPanelSkeletonProps> = ({
  variant = 'modal',
}) => {
  if (variant === 'drawer') {
    return (
      <div
        role="status"
        aria-label="Loading panel"
        className="fixed inset-0 z-50 flex justify-end bg-sky-950/35 backdrop-blur-sm select-none"
      >
        <span className="sr-only">Loading…</span>
        <div className="relative w-full max-w-md h-full bg-[#1e466e]/95 border-l border-white/25 backdrop-blur-3xl p-6 flex flex-col gap-5">
          <div className="flex items-center justify-between pb-4 border-b border-white/15">
            <div className="lab-skeleton-bar w-36 h-6" />
            <div className="lab-skeleton-compact w-9 h-9 rounded-full" />
          </div>
          {[0, 1, 2].map((row) => (
            <div
              key={row}
              className="rounded-[0.5rem] bg-white/[0.08] border border-white/15 p-3.5 flex gap-3.5 items-center"
            >
              <div className="lab-skeleton-compact w-20 h-24 rounded-xl shrink-0" />
              <div className="flex-1 flex flex-col gap-2">
                <div className="lab-skeleton-bar w-3/4 h-4" />
                <div className="lab-skeleton-bar w-1/2 h-3.5" />
                <div className="lab-skeleton-bar w-2/3 h-6 mt-1" />
              </div>
            </div>
          ))}
          <div className="mt-auto pt-4 border-t border-white/15 flex flex-col gap-3">
            <div className="lab-skeleton-bar w-full h-5" />
            <div className="lab-skeleton-bar w-full h-11" />
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'page') {
    return (
      <div
        role="status"
        aria-label="Loading view"
        className="fixed inset-0 z-50 bg-[#1a3a5a]/92 backdrop-blur-xl flex flex-col items-center justify-start px-4 py-8 overflow-hidden select-none"
      >
        <span className="sr-only">Loading…</span>
        <div className="w-full max-w-5xl flex items-center justify-between mb-8">
          <div className="lab-skeleton-bar w-32 h-8" />
          <div className="lab-skeleton-bar w-28 h-6" />
          <div className="lab-skeleton-bar w-24 h-8" />
        </div>
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6">
          <div className="rounded-[0.5rem] border border-white/20 bg-white/[0.08] p-6 flex flex-col gap-4">
            <div className="lab-skeleton-bar w-44 h-6" />
            <div className="lab-skeleton-bar w-full h-11" />
            <div className="lab-skeleton-bar w-full h-11" />
            <div className="grid grid-cols-2 gap-3">
              <div className="lab-skeleton-bar h-11" />
              <div className="lab-skeleton-bar h-11" />
            </div>
            <div className="lab-skeleton-bar w-full h-24" />
          </div>
          <div className="rounded-[0.5rem] border border-white/20 bg-white/[0.08] p-6 flex flex-col gap-4">
            <div className="lab-skeleton-bar w-36 h-6" />
            <div className="flex gap-3 items-center">
              <div className="lab-skeleton-compact w-16 h-20 rounded-xl shrink-0" />
              <div className="flex-1 flex flex-col gap-2">
                <div className="lab-skeleton-bar w-3/4 h-4" />
                <div className="lab-skeleton-bar w-1/2 h-4" />
              </div>
            </div>
            <div className="lab-skeleton-bar w-full h-11 mt-4" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-label="Loading dialog"
      className="fixed inset-0 z-[75] flex items-center justify-center p-4 bg-slate-950/55 backdrop-blur-md select-none"
    >
      <span className="sr-only">Loading…</span>
      <div className="w-full max-w-md rounded-[0.5rem] bg-[#1c446c]/95 border border-white/25 p-6 flex flex-col gap-4 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-white/15">
          <div className="lab-skeleton-bar w-40 h-5" />
          <div className="lab-skeleton-compact w-8 h-8 rounded-full" />
        </div>
        <div className="relative w-full h-36">
          <GarmentSkeletonFrame variant="specimen" className="inset-0 rounded-[0.5rem]" />
        </div>
        <div className="lab-skeleton-bar w-full h-10" />
        <div className="lab-skeleton-bar w-2/3 h-9" />
      </div>
    </div>
  );
};
