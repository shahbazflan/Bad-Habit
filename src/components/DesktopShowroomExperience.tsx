import { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import { HeroFloor } from './HeroFloor';
import { useCart } from '../context/CartContext';
import { ErrorBoundary } from './ErrorBoundary';
import { trackPageView } from '../utils/metaPixel';
import { findProductByPath } from '../utils/productRouting';

const ShowroomFloor = lazy(() =>
  import('./ShowroomFloor').then((m) => ({ default: m.ShowroomFloor }))
);

const FLOOR_EDGE_PX = 2;
const SCROLL_RUNWAY_PX = 900;

/**
 * DesktopShowroomExperience
 * Signature architectural elevator experience for desktop screens (>= 768px).
 * Uses direct DOM transform updates inside requestAnimationFrame so scrolling runs
 * smoothly at 60/120fps without reconciling React components on every scroll tick.
 */
export function DesktopShowroomExperience() {
  const [initialHasProductUrl] = useState<boolean>(() =>
    typeof window !== 'undefined' ? Boolean(findProductByPath(window.location.pathname)) : false
  );
  const [activeFloor, setActiveFloor] = useState<'hero' | 'showroom'>(() =>
    initialHasProductUrl ? 'showroom' : 'hero'
  );
  const [isFullyInView, setIsFullyInView] = useState<boolean>(() => initialHasProductUrl);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [showroomMounted, setShowroomMounted] = useState(() => initialHasProductUrl);

  const elevatorTrackRef = useRef<HTMLDivElement | null>(null);
  const viewportHeightRef = useRef<number>(
    typeof window !== 'undefined' ? window.innerHeight : 800
  );
  const scrollProgressRef = useRef<number>(initialHasProductUrl ? 1 : 0);

  const { isCheckoutOpen, confirmedOrder } = useCart();
  const isDedicatedViewActive = isCheckoutOpen || confirmedOrder !== null;

  const applyElevatorTransform = useCallback((progress: number) => {
    const track = elevatorTrackRef.current;
    if (!track) return;
    const totalTravelPx = viewportHeightRef.current + FLOOR_EDGE_PX;
    const currentTranslationY = -progress * totalTravelPx;
    track.style.transform = `translate3d(0, ${currentTranslationY.toFixed(2)}px, 0)`;
  }, []);

  useEffect(() => {
    if (!isDedicatedViewActive && activeFloor === 'hero') {
      trackPageView('desktop:hero');
    }
  }, [activeFloor, isDedicatedViewActive]);

  useEffect(() => {
    const updateSize = () => {
      viewportHeightRef.current = window.innerHeight;
      applyElevatorTransform(scrollProgressRef.current);
    };
    updateSize();
    window.addEventListener('resize', updateSize, { passive: true });
    return () => window.removeEventListener('resize', updateSize);
  }, [applyElevatorTransform]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Prefetch ShowroomFloor JS chunk on idle immediately; mount gently after hero paint or on scroll/click
  useEffect(() => {
    const prefetch = () => {
      void import('./ShowroomFloor');
    };
    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(prefetch, { timeout: 300 });
      return () => window.cancelIdleCallback(id);
    }
    const timer = globalThis.setTimeout(prefetch, 120);
    return () => globalThis.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (showroomMounted) return;
    const mountShowroom = () => {
      void import('./ShowroomFloor');
      setShowroomMounted(true);
    };
    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(mountShowroom, { timeout: 1600 });
      return () => window.cancelIdleCallback(id);
    }
    const timer = globalThis.setTimeout(mountShowroom, 1200);
    return () => globalThis.clearTimeout(timer);
  }, [showroomMounted]);

  useEffect(() => {
    if (initialHasProductUrl && !isDedicatedViewActive) {
      window.scrollTo({ top: SCROLL_RUNWAY_PX, behavior: 'auto' });
      scrollProgressRef.current = 1;
      applyElevatorTransform(1);
    }
  }, [initialHasProductUrl, isDedicatedViewActive, applyElevatorTransform]);

  useEffect(() => {
    const handlePopState = () => {
      if (findProductByPath(window.location.pathname)) {
        setShowroomMounted(true);
        if (!isDedicatedViewActive) {
          window.scrollTo({ top: SCROLL_RUNWAY_PX, behavior: 'auto' });
        }
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isDedicatedViewActive]);

  useEffect(() => {
    if (isDedicatedViewActive) return;

    let rafId: number | null = null;

    const syncFromScroll = () => {
      rafId = null;
      const currentY = window.scrollY;
      const progress = Math.min(1, Math.max(0, currentY / SCROLL_RUNWAY_PX));
      scrollProgressRef.current = progress;
      applyElevatorTransform(progress);

      if (progress > 0.005) {
        setShowroomMounted(true);
      }
      const nextFloor: 'hero' | 'showroom' = progress >= 0.5 ? 'showroom' : 'hero';
      setActiveFloor((prev) => (prev === nextFloor ? prev : nextFloor));
      const nextFull = progress >= 0.9;
      setIsFullyInView((prev) => (prev === nextFull ? prev : nextFull));
    };

    const handleScroll = () => {
      if (rafId === null) {
        rafId = window.requestAnimationFrame(syncFromScroll);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    syncFromScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, [isDedicatedViewActive, applyElevatorTransform]);

  const scrollToFloor = useCallback(
    (floor: 'hero' | 'showroom') => {
      if (isDedicatedViewActive) return;
      if (floor === 'showroom') {
        setShowroomMounted(true);
      }
      const targetScrollY = floor === 'showroom' ? SCROLL_RUNWAY_PX : 0;
      window.scrollTo({
        top: targetScrollY,
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
      });
    },
    [prefersReducedMotion, isDedicatedViewActive]
  );

  const handleViewCollection = useCallback(() => {
    scrollToFloor('showroom');
  }, [scrollToFloor]);

  const handleReturnToHero = useCallback(() => {
    scrollToFloor('hero');
  }, [scrollToFloor]);

  const initialOffsetPx = initialHasProductUrl
    ? -(viewportHeightRef.current + FLOOR_EDGE_PX)
    : 0;

  return (
    <div className="relative w-full bg-[#1f486d] text-white min-h-screen selection:bg-white/20">
      {!isDedicatedViewActive && (
        <div
          className="w-full pointer-events-none"
          style={{ height: `calc(100vh + ${SCROLL_RUNWAY_PX}px)` }}
          aria-hidden="true"
        />
      )}

      <main className="fixed inset-0 w-full h-[100vh] h-[100dvh] overflow-clip">
        <div
          ref={elevatorTrackRef}
          className="w-full flex flex-col will-change-transform"
          style={{
            transform: `translate3d(0, ${initialOffsetPx}px, 0)`,
            transition: 'none',
          }}
        >
          {/* LEVEL 02: HERO RUNWAY */}
          <div className="w-full h-[100vh] h-[100dvh] shrink-0">
            <ErrorBoundary compact sectionName="Hero Runway">
              <HeroFloor
                onViewCollection={handleViewCollection}
                activeFloor={activeFloor}
                onNavigateToFloor={scrollToFloor}
              />
            </ErrorBoundary>
          </div>

          {/* LEVEL 01: LOWER SHOWROOM */}
          <div className="w-full h-[100vh] h-[100dvh] shrink-0">
            {showroomMounted && (
              <ErrorBoundary compact sectionName="Showroom Collection">
                <Suspense fallback={null}>
                  <ShowroomFloor
                    onReturnToHero={handleReturnToHero}
                    isFullyInView={isFullyInView}
                    activeFloor={activeFloor}
                    onNavigateToFloor={scrollToFloor}
                  />
                </Suspense>
              </ErrorBoundary>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
