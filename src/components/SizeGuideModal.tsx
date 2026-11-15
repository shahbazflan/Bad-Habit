import React, { useEffect } from 'react';

interface SizeGuideModalProps {
  isOpen: boolean;
  category: 'Trousers' | 'Shirts' | string;
  onClose: () => void;
}

const SIZE_GUIDE_ASSETS: Record<'Trousers' | 'Shirts', { src: string; title: string }> = {
  Trousers: {
    src: '/assets/size_guides/trousers_size_guide.webp',
    title: 'Trousers Size Guide',
  },
  Shirts: {
    src: '/assets/size_guides/shirts_size_guide.webp',
    title: 'Boxy Shirts Size Guide',
  },
};

export const SizeGuideModal: React.FC<SizeGuideModalProps> = ({
  isOpen,
  category,
  onClose,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const asset =
    category === 'Shirts' ? SIZE_GUIDE_ASSETS.Shirts : SIZE_GUIDE_ASSETS.Trousers;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label={asset.title}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[440px] rounded-2xl overflow-hidden bg-[#1b4670]/90 border border-white/30 shadow-[0_24px_64px_rgba(4,24,43,0.6)] p-2.5 sm:p-3"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between px-1.5 pb-2">
          <span className="font-display text-xs sm:text-sm font-bold tracking-wider uppercase text-white">
            {asset.title}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 border border-white/25 flex items-center justify-center text-white transition-all cursor-pointer active:scale-95 outline-none"
            aria-label="Close size guide"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Size Guide Graphic */}
        <div className="w-full rounded-xl overflow-hidden bg-slate-950/30 border border-white/15">
          <img
            src={asset.src}
            alt={asset.title}
            className="w-full max-h-[76vh] object-contain mx-auto select-none"
            loading="eager"
            decoding="async"
          />
        </div>
      </div>
    </div>
  );
};
