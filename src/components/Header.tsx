import React from 'react';
import { BRAND_CONFIG } from '../config/appConfig';

interface HeaderProps {
  currentLevel: 'hero' | 'showroom';
  onNavigate: (level: 'hero' | 'showroom') => void;
  onOpenManifest?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentLevel, onNavigate, onOpenManifest }) => {
  return (
    <header
      className="fixed top-0 left-0 w-full z-40 flex items-start justify-between px-6 sm:px-12 pt-6 sm:pt-10 pb-4 pointer-events-none"
      role="banner"
    >
      {/* Brand & Exact Tagline */}
      <div className="pointer-events-auto flex flex-col">
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onNavigate('hero');
          }}
          className="group inline-flex flex-col outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 rounded-sm"
          aria-label={`${BRAND_CONFIG.brandName} - ${BRAND_CONFIG.tagline}`}
        >
          <span className="font-extrabold text-2xl sm:text-3xl tracking-[0.08em] text-white uppercase select-none drop-shadow-[0_2px_12px_rgba(0,0,0,0.3)] transition-opacity group-hover:opacity-90 leading-tight">
            {BRAND_CONFIG.brandName}
          </span>
          <span className="text-[10px] sm:text-[11px] font-semibold tracking-[0.24em] text-white/90 uppercase select-none drop-shadow-[0_1px_8px_rgba(0,0,0,0.35)] mt-1">
            {BRAND_CONFIG.tagline}
          </span>
        </a>
      </div>

      {/* Level Navigation & Manifest Inspector */}
      <nav aria-label="Level navigation" className="pointer-events-auto flex items-center gap-3">
        {onOpenManifest && (
          <button
            onClick={onOpenManifest}
            className="text-xs font-medium tracking-wider text-white/70 hover:text-white px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md transition-all shadow-sm"
            title="Inspect Phase 1 Assets & Permanent IDs"
            aria-label="Inspect Phase 1 Assets & Permanent IDs"
          >
            Asset Manifest
          </button>
        )}

        <div className="flex items-center p-1 rounded-full bg-black/20 border border-white/20 backdrop-blur-md shadow-md text-xs font-medium text-white/80">
          <button
            onClick={() => onNavigate('hero')}
            className={`px-3 py-1 rounded-full transition-all ${
              currentLevel === 'hero'
                ? 'bg-white text-black font-semibold shadow-sm'
                : 'hover:text-white text-white/70'
            }`}
            aria-label="Navigate to Level 02: Hero Runway"
            aria-current={currentLevel === 'hero' ? 'page' : undefined}
          >
            L02 Hero
          </button>
          <button
            onClick={() => onNavigate('showroom')}
            className={`px-3 py-1 rounded-full transition-all ${
              currentLevel === 'showroom'
                ? 'bg-white text-black font-semibold shadow-sm'
                : 'hover:text-white text-white/70'
            }`}
            aria-label="Navigate to Level 01: Showroom Rail"
            aria-current={currentLevel === 'showroom' ? 'page' : undefined}
          >
            L01 Showroom
          </button>
        </div>
      </nav>
    </header>
  );
};
