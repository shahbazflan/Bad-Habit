import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { HeroFloor } from './HeroFloor';
import { useCart } from '../context/CartContext';

const ShowroomFloor = lazy(() =>
  import('./ShowroomFloor').then((m) => ({ default: m.ShowroomFloor }))
);

const FLOOR_EDGE_PX = 2;
const SCROLL_RUNWAY_PX = 900;

/**
 * DesktopShowroomExperience
 * Signature architectural elevator experience for desktop screens (>= 768px).
 */
export function DesktopShowroomExperience() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(800);
  const [activeFloor, setActiveFloor] = useState<'hero' | 'showroom'>('hero');
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [showroomMounted, setShowroomMounted] = useState(false);

  const { isCheckoutOpen, confirmedOrder } = useCart();
  const isDedicatedViewActive = isCheckoutOpen || confirmedOrder !== null;

  useEffect(() => {
    const updateSize = () => {
      setViewportHeight(window.innerHeight);
    };
    updateSize();
    window.addEventListener('resize', updateSize, { passive: true });
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Pre-warm and mount lower showroom right after first paint so initial hero load stays instant
  useEffect(() => {
    const mountShowroom = () => {
      void import('./ShowroomFloor');
      setShowroomMounted(true);
    };
    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(mountShowroom, { timeout: 250 });
      return () => window.cancelIdleCallback(id);
    }
    const timer = globalThis.setTimeout(mountShowroom, 100);
    return () => globalThis.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isDedicatedViewActive) return;

    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const maxScroll = SCROLL_RUNWAY_PX;
          const currentY = window.scrollY;
          const progress = Math.min(1, Math.max(0, currentY / maxScroll));
          if (progress > 0.01) {
            setShowroomMounted(true);
          }
          setScrollProgress(progress);
          setActiveFloor(progress >= 0.5 ? 'showroom' : 'hero');
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [isDedicatedViewActive]);

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

  const totalTravelPx = viewportHeight + FLOOR_EDGE_PX;
  const currentTranslationY = -scrollProgress * totalTravelPx;

  return (
    <div className="relative w-full bg-[#1f486d] text-white min-h-screen selection:bg-white/20">
      {!isDedicatedViewActive && (
        <div
          className="w-full pointer-events-none"
          style={{ height: `calc(100vh + ${SCROLL_RUNWAY_PX}px)` }}
          aria-hidden="true"
        />
      )}

      <main className="fixed inset-0 w-full h-[100vh] h-[100dvh] overflow-hidden">
        <div
          className="w-full flex flex-col will-change-transform"
          style={{
            transform: `translate3d(0, ${currentTranslationY}px, 0)`,
            transition: 'none',
          }}
        >
          {/* LEVEL 02: HERO RUNWAY */}
          <div className="w-full h-[100vh] h-[100dvh] shrink-0">
            <HeroFloor
              onViewCollection={() => scrollToFloor('showroom')}
              activeFloor={activeFloor}
              onNavigateToFloor={scrollToFloor}
            />
          </div>

          {/* LEVEL 01: LOWER SHOWROOM */}
          <div className="w-full h-[100vh] h-[100dvh] shrink-0">
            {showroomMounted && (
              <Suspense fallback={null}>
                <ShowroomFloor
                  onReturnToHero={() => scrollToFloor('hero')}
                  isFullyInView={scrollProgress >= 0.9}
                  activeFloor={activeFloor}
                  onNavigateToFloor={scrollToFloor}
                />
              </Suspense>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
