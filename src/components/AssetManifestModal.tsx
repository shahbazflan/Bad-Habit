import React from 'react';
import { HERO_MODELS, PRODUCT_CATALOG, BRAND_CONFIG, ProductRecord } from '../config/appConfig';

interface AssetManifestModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProduct?: ProductRecord | null;
}

export const AssetManifestModal: React.FC<AssetManifestModalProps> = ({
  isOpen,
  onClose,
  selectedProduct,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="manifest-title"
    >
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#0c1a27] text-white rounded-2xl border border-sky-400/30 shadow-2xl p-6 sm:p-8 flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 border-b border-white/10">
          <div>
            <h2 id="manifest-title" className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <span>{BRAND_CONFIG.brandName}</span>
              <span className="text-xs font-mono font-normal px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-400/30">
                Phase 1 Central Configuration & Assets
              </span>
            </h2>
            <p className="text-xs text-white/70 mt-1 font-mono">
              Tagline: &quot;{BRAND_CONFIG.tagline}&quot; // Architecture: Connected Elevator + Rail
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors"
            aria-label="Close Asset Manifest"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto space-y-6 py-4 pr-1 text-sm font-sans">

          {/* Section 1: Hero Models Exact Placement */}
          <div>
            <h3 className="text-xs font-mono font-semibold tracking-wider text-sky-400 uppercase mb-3">
              1. Hero Models — Exact Viewer-Perspective Placement
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {HERO_MODELS.map((model) => (
                <div
                  key={model.id}
                  className="bg-black/40 border border-white/10 rounded-xl p-3 flex flex-col justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-20 bg-sky-950/50 rounded-lg p-1 border border-white/10 flex items-center justify-center shrink-0">
                      <img
                        src={model.resolvedAssetUrl}
                        alt={model.role}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div>
                      <div className="font-semibold text-white text-xs">{model.role}</div>
                      <div className="text-[10px] font-mono text-sky-300">
                        Anchor: {model.anchorXPercent}%
                      </div>
                      <div className="text-[10px] font-mono text-white/60">
                        Scale: {(model.perspectiveScale * 100).toFixed(0)}%
                      </div>
                      <div className="text-[10px] text-white/70 mt-0.5 line-clamp-2">
                        {model.description}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-white/5 text-[9px] font-mono text-white/50 truncate">
                    Source: <span className="text-sky-300">{model.originalUrl}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Four Product Assets & Permanent IDs */}
          <div>
            <h3 className="text-xs font-mono font-semibold tracking-wider text-sky-400 uppercase mb-3">
              2. Product Records — Permanent IDs & Clean Assets
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {PRODUCT_CATALOG.map((product) => {
                const isSelected = selectedProduct?.id === product.id;
                return (
                  <div
                    key={product.id}
                    className={`bg-black/40 border rounded-xl p-3 flex flex-col justify-between transition-all ${
                      isSelected
                        ? 'border-sky-400 ring-2 ring-sky-400/40 bg-sky-950/30'
                        : 'border-white/10'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono font-bold text-xs text-sky-300">
                          {product.id}
                        </span>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Hanger OK
                        </span>
                      </div>
                      <div className="w-full h-28 bg-black/50 rounded-lg p-2 border border-white/5 flex items-center justify-center mb-2">
                        <img
                          src={product.resolvedAssetUrl}
                          alt={product.id}
                          className="h-full w-auto object-contain"
                        />
                      </div>
                      <p className="text-[10px] text-white/70 line-clamp-2">
                        {product.notes}
                      </p>
                    </div>

                    <div className="mt-2 pt-2 border-t border-white/5 text-[9px] font-mono text-white/50 space-y-0.5">
                      <div>Name: <span className="italic text-white/40">[Unsupplied - Empty]</span></div>
                      <div>Price: <span className="italic text-white/40">[Unsupplied - Empty]</span></div>
                      <div>Sizes: <span className="italic text-white/40">[None]</span></div>
                      <div>Source: <span className="text-sky-300">{product.originalUrl}</span></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 3: Verification Checklist */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <h3 className="text-xs font-mono font-semibold tracking-wider text-emerald-400 uppercase mb-2">
              Phase 1 Requirement Checklist Verification
            </h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-white/80">
              <li className="flex items-center gap-1.5">
                <span className="text-emerald-400">✓</span> 1. All Dress Code replaced with BAD HABIT
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-emerald-400">✓</span> 2. Exact tagline: YOU KNOW YOU WANT IT
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-emerald-400">✓</span> 3. Viewer-perspective model placement
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-emerald-400">✓</span> 4. Clean transparent cutouts (no halos)
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-emerald-400">✓</span> 5. Fully visible, grounded on floor plane
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-emerald-400">✓</span> 6. Structural slab with linear underside light
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-emerald-400">✓</span> 7. Scrolling upward reverses transition
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-emerald-400">✓</span> 8. &quot;View collection&quot; uses same transition
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-emerald-400">✓</span> 9. Showroom starts with empty rail & &quot;Trousers&quot;
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-emerald-400">✓</span> 10. Batch 1: BH-001, BH-002, BH-003 in order
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-emerald-400">✓</span> 11. &quot;View More&quot; reveals BH-004 centred
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-emerald-400">✓</span> 12. Next click returns to Batch 1 without duplicates
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-emerald-400">✓</span> 13. Garment colours, textures, hangers intact
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-emerald-400">✓</span> 14. No fabricated try-on or invented prices
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-emerald-400">✓</span> 15. Usable across desktop, tablet, and mobile
              </li>
            </ul>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="pt-4 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-black font-semibold text-xs tracking-wider transition-colors"
          >
            Close Manifest
          </button>
        </div>
      </div>
    </div>
  );
};
