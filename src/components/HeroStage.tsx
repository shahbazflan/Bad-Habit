import React from 'react';
import { HERO_MODELS } from '../config/appConfig';

interface HeroStageProps {
  onViewCollection: () => void;
}

export const HeroStage: React.FC<HeroStageProps> = ({ onViewCollection }) => {
  const leftModel = HERO_MODELS.find((m) => m.id === 'hero-left')!;
  const centerModel = HERO_MODELS.find((m) => m.id === 'hero-center')!;
  const rightModel = HERO_MODELS.find((m) => m.id === 'hero-right')!;

  return (
    <section
      className="relative w-full h-[100vh] h-[100dvh] overflow-hidden select-none"
      aria-label="BAD HABIT Hero Runway Collection"
    >
      {/* Architectural Background */}
      <img
        src="/clean_plate.jpg"
        alt="Pale-blue architectural pavilion open to blue sky with white clouds and white floor"
        className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none z-0"
        loading="eager"
        decoding="sync"
      />

      {/* Frosted Glass "View collection" Capsule Button on the Left */}
      <div
        className="absolute left-[clamp(20px,5vw,80px)] top-[50%] -translate-y-1/2 z-30 pointer-events-auto"
      >
        <button
          onClick={onViewCollection}
          className="glass-capsule-btn px-6 py-3.5 sm:px-7 sm:py-4 text-sm sm:text-base tracking-tight text-white group"
          aria-label="View collection - advance elevator transition to clothing showroom"
        >
          <span>View collection</span>
          <svg
            className="w-4 h-4 ml-2.5 inline-block transition-transform duration-300 group-hover:translate-y-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </button>
      </div>

      {/* ======================================================== */}
      {/* THREE-MODEL HERO FORMATION (Viewer's Perspective)       */}
      {/* Left: ~22%, Centre: ~50% (closest), Right: ~78%          */}
      {/* ======================================================== */}
      <div className="absolute inset-0 pointer-events-none z-10">

        {/* 1. LEFT MODEL (~22% width, stands slightly back in perspective) */}
        <div
          className="absolute -translate-x-1/2 flex flex-col items-center justify-end"
          style={{
            left: `${leftModel.anchorXPercent}%`,
            bottom: '4.8vh',
            height: '71vh',
            maxHeight: '780px',
            zIndex: leftModel.zDepth,
          }}
        >
          {/* Contact and Cast Daylight Shadows beneath left model feet */}
          <div className="absolute bottom-0 w-[170px] h-[34px] -mb-[12px] pointer-events-none">
            {/* Left foot contact shadow */}
            <div
              className="absolute left-[18%] bottom-[4px] w-[62px] h-[10px] rounded-[50%] bg-[#03101c]/80 blur-[2px]"
            />
            {/* Right foot contact shadow */}
            <div
              className="absolute right-[16%] bottom-[1px] w-[68px] h-[11px] rounded-[50%] bg-[#03101c]/85 blur-[2.2px]"
            />
            {/* Diffuse daylight cast shadow spreading soft blue-slate tone */}
            <div
              className="absolute inset-0 w-full h-full rounded-[50%] bg-[#0a233a]/35 blur-[9px]"
              style={{ transform: 'scale(1.15, 0.7) translateY(4px)' }}
            />
          </div>

          <img
            src={leftModel.resolvedAssetUrl}
            alt={leftModel.description}
            className="relative z-10 h-full w-auto max-w-[26vw] object-contain object-bottom drop-shadow-[0_4px_12px_rgba(7,27,45,0.12)] filter"
            loading="eager"
            decoding="sync"
          />
        </div>

        {/* 2. CENTRE MODEL (~50% width, closest to viewer, largest scale) */}
        <div
          className="absolute -translate-x-1/2 flex flex-col items-center justify-end"
          style={{
            left: `${centerModel.anchorXPercent}%`,
            bottom: '3.0vh',
            height: '79vh',
            maxHeight: '860px',
            zIndex: centerModel.zDepth,
          }}
        >
          {/* Contact and Cast Daylight Shadows beneath centre model feet */}
          <div className="absolute bottom-0 w-[180px] h-[36px] -mb-[12px] pointer-events-none">
            {/* Back shoe direct contact */}
            <div
              className="absolute left-[16%] bottom-[4px] w-[64px] h-[11px] rounded-[50%] bg-[#020b14]/90 blur-[2px]"
            />
            {/* Front shoe direct contact */}
            <div
              className="absolute right-[14%] bottom-[0px] w-[72px] h-[12px] rounded-[50%] bg-[#020b14]/95 blur-[2.2px]"
            />
            {/* Bridge shadow */}
            <div
              className="absolute inset-x-[15%] bottom-[3px] h-[16px] rounded-[50%] bg-[#061828]/50 blur-[5px]"
            />
            {/* Diffuse ambient daylight cast shadow */}
            <div
              className="absolute inset-0 w-full h-full rounded-[50%] bg-[#082238]/40 blur-[10px]"
              style={{ transform: 'scale(1.2, 0.75) translateY(4px)' }}
            />
          </div>

          <img
            src={centerModel.resolvedAssetUrl}
            alt={centerModel.description}
            className="relative z-10 h-full w-auto max-w-[30vw] object-contain object-bottom drop-shadow-[0_6px_16px_rgba(7,27,45,0.16)] filter"
            loading="eager"
            decoding="sync"
          />
        </div>

        {/* 3. RIGHT MODEL (~78% width, stands slightly back in perspective) */}
        <div
          className="absolute -translate-x-1/2 flex flex-col items-center justify-end"
          style={{
            left: `${rightModel.anchorXPercent}%`,
            bottom: '4.8vh',
            height: '72vh',
            maxHeight: '790px',
            zIndex: rightModel.zDepth,
          }}
        >
          {/* Contact and Cast Daylight Shadows beneath right model feet */}
          <div className="absolute bottom-0 w-[170px] h-[34px] -mb-[12px] pointer-events-none">
            {/* Left foot contact shadow */}
            <div
              className="absolute left-[14%] bottom-[5px] w-[64px] h-[10px] rounded-[50%] bg-[#03101c]/80 blur-[2px]"
            />
            {/* Right foot contact shadow */}
            <div
              className="absolute right-[18%] bottom-[1px] w-[66px] h-[11px] rounded-[50%] bg-[#03101c]/85 blur-[2.2px]"
            />
            {/* Diffuse daylight cast shadow */}
            <div
              className="absolute inset-0 w-full h-full rounded-[50%] bg-[#0a233a]/35 blur-[9px]"
              style={{ transform: 'scale(1.15, 0.7) translateY(4px)' }}
            />
          </div>

          <img
            src={rightModel.resolvedAssetUrl}
            alt={rightModel.description}
            className="relative z-10 h-full w-auto max-w-[26vw] object-contain object-bottom drop-shadow-[0_4px_12px_rgba(7,27,45,0.12)] filter"
            loading="eager"
            decoding="sync"
          />
        </div>

      </div>

      {/* Subtle bottom ground daylight gradient for realism */}
      <div className="absolute bottom-0 left-0 w-full h-[12vh] bg-gradient-to-t from-black/5 to-transparent pointer-events-none z-15" />
    </section>
  );
};
