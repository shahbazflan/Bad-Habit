import React, { useState, useRef, useEffect } from 'react';

interface MobileCampaignVideoProps {
  onExplore: () => void;
  onOpenMenu: () => void;
  onOpenBag: () => void;
  cartCount: number;
  isDesktop?: boolean;
}

/**
 * MobileCampaignVideo
 * 
 * Edge-to-edge portrait campaign video for BAD HABIT mobile homepage:
 * - Muted autoplay, looping, and inline playback
 * - Small accessible play/pause control
 * - Approved hero image (/clean_plate.jpg) as temporary poster while loading / when autoplay is unavailable
 * - Proportional fit with adjustable focal position (center 35%)
 * - Compact top navigation row: Menu on left, BAD HABIT logo centered, Shopping Bag on right
 * - Tagline: "YOU KNOW YOU WANT IT"
 * - Restrained frosted transparent glass button: "Explore collection"
 */
export const MobileCampaignVideo: React.FC<MobileCampaignVideoProps> = ({
  onExplore,
  onOpenMenu,
  onOpenBag,
  cartCount,
  isDesktop = false,
}) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // Pause playback when on desktop
  useEffect(() => {
    if (isDesktop) {
      if (videoRef.current) {
        videoRef.current.pause();
      }
      setIsPlaying(false);
    }
  }, [isDesktop]);

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch(() => {
          setIsPlaying(false);
        });
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    } else {
      // Toggle play state for external player / iframe overlay
      setIsPlaying((prev) => !prev);
    }
  };

  return (
    <section
      className="relative w-full h-[100dvh] min-h-[580px] overflow-hidden bg-black flex flex-col justify-between select-none"
      aria-label="BAD HABIT Campaign Video Homepage"
    >
      {/* 1. VIDEO LAYER / POSTER FALLBACK */}
      <div className="absolute inset-0 w-full h-full overflow-hidden z-0">
        {/* Temporary Approved Hero Poster Image (always rendered beneath or as loading fallback) */}
        <img
          src="/clean_plate.jpg"
          alt="BAD HABIT Architectural space"
          className={`absolute inset-0 w-full h-full object-cover object-[center_35%] transition-opacity duration-700 pointer-events-none ${
            isLoaded && !hasError && isPlaying ? 'opacity-0' : 'opacity-100'
          }`}
          loading="eager"
        />

        {/* Ambient Subtle Studio Atmosphere Glow */}
        <div className="absolute inset-0 bg-radial-gradient from-transparent via-cyan-950/15 to-black/60 pointer-events-none" />

        {/* Campaign Video Element (Supports direct mp4 or Wistia embed) */}
        {/* Supplied video asset: https://hasssann-ahmedd.wistia.com/s/ij986pvynhbwhc9 */}
        <div className="absolute inset-0 w-full h-full flex items-center justify-center pointer-events-none">
          <iframe
            ref={iframeRef}
            src="https://hasssann-ahmedd.wistia.com/s/ij986pvynhbwhc9?autoPlay=true&muted=true&controls=false&playbar=false&volumeControl=false&fullscreenButton=false&smallPlayButton=false&loop=true"
            title="BAD HABIT Campaign Video"
            allow="autoplay; fullscreen"
            onLoad={() => setIsLoaded(true)}
            onError={() => {
              setHasError(true);
              setIsLoaded(false);
            }}
            className={`w-[125%] h-[125%] -translate-x-[10%] -translate-y-[10%] object-cover object-[center_35%] transition-opacity duration-700 ${
              isPlaying && isLoaded && !hasError ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ border: 'none' }}
          />

          {/* HTML5 video element ready for direct MP4 stream if provided */}
          <video
            ref={videoRef}
            playsInline
            muted
            loop
            autoPlay
            poster="/clean_plate.jpg"
            className="hidden absolute inset-0 w-full h-full object-cover object-[center_35%]"
          />
        </div>

        {/* Subtle Dark Gradient Overlays for Navigation and Text Readability */}
        {/* Top Gradient for Navigation Row */}
        <div
          className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-none z-10"
          aria-hidden="true"
        />
        {/* Bottom Gradient for Tagline & Explore Button */}
        <div
          className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-black/95 via-black/50 to-transparent pointer-events-none z-10"
          aria-hidden="true"
        />
      </div>

      {/* 2. COMPACT TOP NAVIGATION ROW OVER VIDEO */}
      <header className="relative z-20 w-full flex items-center justify-between px-4 pt-[calc(16px+env(safe-area-inset-top))]">
        {/* Menu Icon on Left */}
        <button
          type="button"
          onClick={onOpenMenu}
          className="w-10 h-10 rounded-full flex items-center justify-center text-white transition-all active:scale-95 cursor-pointer outline-none glass-capsule shadow-sm"
          aria-label="Open navigation menu"
        >
          <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>

        {/* BAD HABIT Logo Centred */}
        <div className="flex flex-col items-center">
          <span className="font-display text-lg font-black tracking-[0.14em] uppercase text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.6)] leading-none">
            BAD HABIT
          </span>
          <span className="text-[8px] font-mono tracking-[0.24em] text-cyan-200/80 uppercase mt-0.5">
            STUDIO
          </span>
        </div>

        {/* Shopping Bag Icon and Item Count on Right */}
        <button
          type="button"
          onClick={onOpenBag}
          className="relative w-10 h-10 rounded-full flex items-center justify-center text-white transition-all active:scale-95 cursor-pointer outline-none glass-capsule shadow-sm"
          aria-label={`Shopping bag containing ${cartCount} items`}
        >
          <svg className="w-4.5 h-4.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
          </svg>
          {cartCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-sky-900/75 border border-white/55 text-white text-[11px] font-grotesk font-bold flex items-center justify-center shadow-sm">
              {cartCount}
            </span>
          )}
        </button>
      </header>

      {/* 3. ACCESSIBLE PLAY/PAUSE CONTROL (Floating cleanly in safe zone) */}
      <div className="absolute right-4 bottom-32 z-20">
        <button
          type="button"
          onClick={togglePlayPause}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-black/40 hover:bg-black/60 border border-white/20 text-white/90 backdrop-blur-md transition-all active:scale-90 shadow-md cursor-pointer outline-none"
          aria-label={isPlaying ? 'Pause campaign video' : 'Play campaign video'}
          title={isPlaying ? 'Pause video' : 'Play video'}
        >
          {isPlaying ? (
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5.14v14l11-7-11-7z" />
            </svg>
          )}
        </button>
      </div>

      {/* 4. BOTTOM CAMPAIGN HERO CONTENT */}
      <div className="relative z-20 w-full flex flex-col items-center text-center px-4 pb-[calc(28px+env(safe-area-inset-bottom))]">
        {/* Tagline */}
        <div className="relative mb-4">
          <p className="font-display text-sm font-semibold tracking-[0.24em] text-white uppercase drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]">
            YOU KNOW YOU WANT IT
          </p>
        </div>

        {/* Restrained Transparent Glass Button: "Explore collection" */}
        <button
          type="button"
          onClick={onExplore}
          className="glass-capsule glass-capsule-hover group relative inline-flex items-center justify-center min-w-[198px] px-6 py-2.5 rounded-full text-white font-grotesk font-semibold text-[13px] tracking-[0.14em] uppercase transition-all duration-300 active:scale-95 cursor-pointer outline-none shadow-[0_4px_24px_rgba(0,0,0,0.35)]"
          aria-label="Explore collection — scroll to categories"
        >
          <span className="text-white font-semibold">
            Explore collection
          </span>
          <svg
            className="w-3.5 h-3.5 ml-1.5 text-white transition-transform duration-200 group-hover:translate-y-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2.2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>
      </div>
    </section>
  );
};
