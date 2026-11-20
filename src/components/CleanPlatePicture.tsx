import React from 'react';
import {
  HERO_PLATE_URL,
  HERO_PLATE_WEBP_800,
  HERO_PLATE_WEBP_1376,
  HERO_PLATE_AVIF_800,
  HERO_PLATE_AVIF_1376,
} from '../data/products';

interface CleanPlatePictureProps {
  alt: string;
  className?: string;
  sizes?: string;
  loading?: 'eager' | 'lazy';
  decoding?: 'async' | 'sync' | 'auto';
  fetchPriority?: 'high' | 'low' | 'auto';
  ariaHidden?: boolean;
}

/**
 * Serves AVIF -> WebP -> Progressive MozJPEG architectural runway plate (`clean_plate`)
 * matched to viewport width so slow mobile connections fetch a lightweight asset
 * while desktop keeps the full 1376x768 resolution.
 */
export const CleanPlatePicture: React.FC<CleanPlatePictureProps> = ({
  alt,
  className = 'w-full h-full object-cover object-center',
  sizes = '100vw',
  loading = 'eager',
  decoding = 'async',
  fetchPriority = 'auto',
  ariaHidden,
}) => {
  return (
    <picture className="contents">
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
};
