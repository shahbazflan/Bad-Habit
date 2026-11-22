import React, { useEffect, useRef, useState } from 'react';

interface PrecisionZoomStageProps {
  children: React.ReactNode;
  zoomScale?: number;
  resetKey?: string;
  allowClickToggle?: boolean;
  clipOverflow?: boolean;
  className?: string;
  onZoomStateChange?: (isZooming: boolean) => void;
}

/**
 * High-precision, cursor-tracked architectural garment zoom stage.
 * Uses a single damped requestAnimationFrame lerp loop on a GPU transform layer
 * for 60/120fps fluid inspection with zero React re-renders per pointer move.
 */
export const PrecisionZoomStage: React.FC<PrecisionZoomStageProps> = ({
  children,
  zoomScale = 2.35,
  resetKey,
  allowClickToggle = false,
  clipOverflow = true,
  className = '',
  onZoomStateChange,
}) => {
  const stageRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  const [isZooming, setIsZooming] = useState(false);

  const stateRef = useRef({
    targetScale: 1,
    targetX: 0,
    targetY: 0,
    currentScale: 1,
    currentX: 0,
    currentY: 0,
    normU: 0.5,
    normV: 0.5,
    hovering: false,
    paused: false,
    reducedMotion: false,
  });

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      stateRef.current.reducedMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
      ).matches;
    }
  }, []);

  const applyTransform = (scale: number, x: number, y: number) => {
    const layer = layerRef.current;
    if (!layer) return;
    if (Math.abs(scale - 1) < 0.001 && Math.abs(x) < 0.05 && Math.abs(y) < 0.05) {
      layer.style.transform = 'translate3d(0px, 0px, 0px) scale(1)';
      layer.style.willChange = 'auto';
    } else {
      layer.style.willChange = 'transform';
      layer.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0px) scale(${scale.toFixed(4)})`;
    }
  };

  const stopLoop = () => {
    if (rafRef.current !== null) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  const startLoop = () => {
    if (rafRef.current !== null) return;

    const tick = () => {
      const s = stateRef.current;
      const ease = s.reducedMotion ? 0.5 : 0.16;

      s.currentScale += (s.targetScale - s.currentScale) * ease;
      s.currentX += (s.targetX - s.currentX) * ease;
      s.currentY += (s.targetY - s.currentY) * ease;

      const settled =
        Math.abs(s.targetScale - s.currentScale) < 0.001 &&
        Math.abs(s.targetX - s.currentX) < 0.08 &&
        Math.abs(s.targetY - s.currentY) < 0.08;

      if (settled) {
        s.currentScale = s.targetScale;
        s.currentX = s.targetX;
        s.currentY = s.targetY;
        applyTransform(s.currentScale, s.currentX, s.currentY);
        rafRef.current = null;
        return;
      }

      applyTransform(s.currentScale, s.currentX, s.currentY);
      rafRef.current = window.requestAnimationFrame(tick);
    };

    rafRef.current = window.requestAnimationFrame(tick);
  };

  const updateTargetsFromPointer = (clientX: number, clientY: number) => {
    const stage = stageRef.current;
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const rawU = (clientX - rect.left) / rect.width;
    const rawV = (clientY - rect.top) / rect.height;
    // Slight 6% inset mapping so top collars, waistbands & hems are comfortably reachable
    const u = Math.min(1, Math.max(0, (rawU - 0.06) / 0.88));
    const v = Math.min(1, Math.max(0, (rawV - 0.06) / 0.88));

    const s = stateRef.current;
    s.normU = u;
    s.normV = v;

    const activeScale = s.hovering && !s.paused ? zoomScale : 1;
    s.targetScale = activeScale;
    s.targetX = -(u - 0.5) * rect.width * (activeScale - 1);
    s.targetY = -(v - 0.5) * rect.height * (activeScale - 1);
    startLoop();
  };

  const resetZoom = (immediate = false) => {
    const s = stateRef.current;
    s.hovering = false;
    s.paused = false;
    s.targetScale = 1;
    s.targetX = 0;
    s.targetY = 0;
    setIsZooming(false);
    onZoomStateChange?.(false);

    if (immediate) {
      stopLoop();
      s.currentScale = 1;
      s.currentX = 0;
      s.currentY = 0;
      applyTransform(1, 0, 0);
    } else {
      startLoop();
    }
  };

  // Reset immediately on article / angle switch so new slides appear centered at 1x
  useEffect(() => {
    resetZoom(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  useEffect(() => {
    return () => {
      stopLoop();
    };
  }, []);

  const handlePointerEnter = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
    const s = stateRef.current;
    s.hovering = true;
    s.paused = false;
    setIsZooming(true);
    onZoomStateChange?.(true);
    updateTargetsFromPointer(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
    const s = stateRef.current;
    if (!s.hovering) {
      s.hovering = true;
      if (!s.paused) {
        setIsZooming(true);
        onZoomStateChange?.(true);
      }
    }
    updateTargetsFromPointer(e.clientX, e.clientY);
  };

  const handlePointerLeave = () => {
    resetZoom(false);
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!allowClickToggle) return;
    const s = stateRef.current;
    if (!s.hovering) return;
    const nextPaused = !s.paused;
    s.paused = nextPaused;
    setIsZooming(!nextPaused);
    onZoomStateChange?.(!nextPaused);
    updateTargetsFromPointer(e.clientX, e.clientY);
  };

  const cursorClass = allowClickToggle
    ? isZooming
      ? 'cursor-zoom-out'
      : 'cursor-zoom-in'
    : 'cursor-pointer';

  return (
    <div
      ref={stageRef}
      onPointerEnter={handlePointerEnter}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onClick={handleClick}
      className={`relative w-full h-full flex items-center justify-center ${
        clipOverflow ? 'overflow-hidden' : ''
      } ${cursorClass} ${className}`}
    >
      <div
        ref={layerRef}
        className="w-full h-full flex items-center justify-center origin-center pointer-events-none"
      >
        {children}
      </div>
    </div>
  );
};
