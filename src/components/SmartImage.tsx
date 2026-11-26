import React, { useLayoutEffect, useRef, useState } from 'react';
import { getResponsiveSrcSet } from '../data/products';

export interface SmartImageProps
  extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string;
  alt: string;
  /** Responsive `sizes` attribute tailored to rendered slot width. */
  sizes?: string;
  /** Show subtle keyblue glass pulse inside parent while image is decoding. */
  showSkeleton?: boolean;
  /** Extra classes for the subtle skeleton placeholder overlay. */
  skeletonClassName?: string;
  /** Set false to bypass automatic `_sm.webp` srcSet resolution. */
  responsive?: boolean;
}

/**
 * Responsive, CLS-safe image component with subtle decode placeholder and
 * graceful offline/error fallback so broken image icons never render.
 */
export const SmartImage: React.FC<SmartImageProps> = ({
  src,
  alt,
  sizes,
  srcSet: explicitSrcSet,
  className = '',
  showSkeleton = true,
  skeletonClassName = 'inset-2 rounded-xl',
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

  const shouldAnimateFade = showSkeleton && loading !== 'eager';

  return (
    <>
      {shouldAnimateFade && !loaded && !errored && (
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute ${skeletonClassName} bg-white/[0.08] animate-pulse`}
        />
      )}

      {errored ? (
        <span
          role="img"
          aria-label={alt || 'Garment preview unavailable'}
          className="flex flex-col items-center justify-center gap-1 px-2 py-2 text-center text-white/60 select-none"
        >
          <svg
            className="w-6 h-6 opacity-70"
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
            shouldAnimateFade
              ? `${className} transition-opacity duration-150 ${loaded ? 'opacity-100' : 'opacity-0'}`
              : className
          }
          {...rest}
        />
      )}
    </>
  );
};
