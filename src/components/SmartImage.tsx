import React, { useLayoutEffect, useRef, useState } from 'react';
import { getResponsiveSrcSet } from '../data/products';
import { GarmentSkeletonFrame, SkeletonVariant } from './LabSkeleton';

export interface SmartImageProps
  extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string;
  alt: string;
  /** Responsive `sizes` attribute tailored to rendered slot width. */
  sizes?: string;
  /** Show CSS-only architectural laboratory skeleton inside parent while image is loading/decoding. */
  showSkeleton?: boolean;
  /** Extra classes for the architectural skeleton placeholder overlay. */
  skeletonClassName?: string;
  /** Structural detail level for the skeleton frame ('specimen' | 'compact' | 'canvas'). */
  skeletonVariant?: SkeletonVariant;
  /** Set false to bypass automatic `_sm.webp` srcSet resolution. */
  responsive?: boolean;
}

/**
 * Responsive, CLS-safe image component with CSS-only architectural laboratory
 * skeleton placeholders and graceful offline/error fallback.
 */
export const SmartImage: React.FC<SmartImageProps> = ({
  src,
  alt,
  sizes,
  srcSet: explicitSrcSet,
  className = '',
  showSkeleton = true,
  skeletonClassName = 'inset-2 rounded-[0.5rem]',
  skeletonVariant = 'specimen',
  responsive = true,
  loading = 'lazy',
  decoding = 'async',
  onLoad,
  onError,
  ...rest
}) => {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  const computedSrcSet =
    explicitSrcSet ?? (responsive ? getResponsiveSrcSet(src) : undefined);

  // Sync immediately if the browser already has the image decoded in cache
  useLayoutEffect(() => {
    setErrored(false);
    const el = imgRef.current;
    if (el && el.complete && el.naturalWidth > 0) {
      setLoaded(true);
    } else {
      setLoaded(false);
    }
  }, [src]);

  const shouldFadeLazy = loading !== 'eager';

  return (
    <>
      {showSkeleton && !loaded && !errored && (
        <GarmentSkeletonFrame variant={skeletonVariant} className={skeletonClassName} />
      )}

      {errored ? (
        <span
          role="img"
          aria-label={alt || 'Garment preview unavailable'}
          className="relative z-10 flex flex-col items-center justify-center gap-1.5 px-3 py-3 text-center text-white/70 select-none lab-skeleton-compact rounded-[0.5rem]"
        >
          <svg
            className="w-5 h-5 opacity-75"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 19.5h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5z"
            />
          </svg>
          <span className="text-[10px] font-mono tracking-wide uppercase opacity-80">
            Reload to view
          </span>
        </span>
      ) : (
        <img
          ref={imgRef}
          src={src}
          srcSet={computedSrcSet}
          sizes={computedSrcSet ? sizes : undefined}
          alt={alt}
          loading={loading}
          decoding={decoding}
          onLoad={(e) => {
            setLoaded(true);
            onLoad?.(e);
          }}
          onError={(e) => {
            setErrored(true);
            onError?.(e);
          }}
          className={
            shouldFadeLazy
              ? `relative z-10 ${className} transition-opacity duration-150 ${loaded ? 'opacity-100' : 'opacity-0'}`
              : `relative z-10 ${className}`
          }
          {...rest}
        />
      )}
    </>
  );
};
