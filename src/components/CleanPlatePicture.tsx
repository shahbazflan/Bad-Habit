import React from 'react';
import {
  HERO_PLATE_URL,
  HERO_PLATE_THUMB_WEBP,
  HERO_PLATE_WEBP_800,
  HERO_PLATE_WEBP_1376,
  HERO_PLATE_AVIF_800,
  HERO_PLATE_AVIF_1376,
  HERO_PLATE_MOBILE_WEBP,
} from '../data/products';

interface CleanPlatePictureProps {
  alt: string;
  className?: string;
  sizes?: string;
  loading?: 'eager' | 'lazy';
  decoding?: 'async' | 'sync' | 'auto';
  fetchPriority?: 'high' | 'low' | 'auto';
  ariaHidden?: boolean;
  /**
   * 'hero' serves the 768x1024 portrait Retina WebP on mobile (<768px) and 1376x768 on desktop.
   * 'thumbnail' serves compact 480w/800w/1376w assets for small card tiles.
   */
  variant?: 'hero' | 'thumbnail';
}

/**
 * Serves hardware-friendly WebP on mobile social webviews (768x1024, 13.4 KB)
 * and AVIF -> WebP -> Progressive MozJPEG on desktop (`clean_plate`).
 */
export const CleanPlatePicture: React.FC<CleanPlatePictureProps> = ({
  alt,
  className = 'w-full h-full object-cover object-center',
  sizes = '100vw',
  loading = 'eager',
  decoding = 'async',
  fetchPriority = 'auto',
  ariaHidden,
  variant = 'hero',
}) => {
  if (variant === 'thumbnail') {
    return (
      <picture className="contents">
        <source
          media="(max-width: 767px)"
          type="image/webp"
          srcSet={HERO_PLATE_THUMB_WEBP}
        />
        <source
          type="image/avif"
          srcSet={`${HERO_PLATE_AVIF_800} 800w, ${HERO_PLATE_AVIF_1376} 1376w`}
          sizes={sizes}
        />
        <source
          type="image/webp"
          srcSet={`${HERO_PLATE_WEBP_800} 800w, ${HERO_PLATE_WEBP_1376} 1376w`}
          sizes={sizes}
        />
        <img
          src={HERO_PLATE_URL}
          width={1376}
          height={768}
          alt={alt}
          aria-hidden={ariaHidden}
          className={className}
          loading={loading}
          decoding={decoding}
          fetchPriority={fetchPriority}
        />
      </picture>
    );
  }

  return (
    <picture className="contents">
      <source
        media="(max-width: 767px)"
        type="image/webp"
        srcSet={HERO_PLATE_MOBILE_WEBP}
      />
      <source
        type="image/avif"
        srcSet={HERO_PLATE_AVIF_1376}
      />
      <source
        type="image/webp"
        srcSet={HERO_PLATE_WEBP_1376}
      />
      <img
        src={HERO_PLATE_URL}
        width={1376}
        height={768}
        alt={alt}
        aria-hidden={ariaHidden}
        className={className}
        loading={loading}
        decoding={decoding}
        fetchPriority={fetchPriority}
      />
    </picture>
  );
};
