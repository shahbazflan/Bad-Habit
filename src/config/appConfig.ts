/**
 * BAD HABIT — Central Configuration
 * 
 * Contains all hero model asset mappings and product records.
 * Replacing an asset link later preserves positioning, catalogue order,
 * and animation behaviour.
 * Permanent product IDs remain unchanged.
 */

export interface HeroModelRecord {
  id: 'hero-left' | 'hero-center' | 'hero-right';
  role: 'Left Model' | 'Centre Model' | 'Right Model';
  originalUrl: string;
  resolvedAssetUrl: string;
  description: string;
  anchorXPercent: number; // Left: ~22%, Centre: ~50%, Right: ~78%
  perspectiveScale: number; // Centre closest to viewer, sides slightly smaller
  zDepth: number; // Stacking order
  contactShadow: {
    width: number;
    rx: number;
    ry: number;
    blur: number;
    opacity: number;
  };
}

export interface ProductRecord {
  id: string; // Permanent ID: BH-001, BH-002, BH-003, BH-004
  originalUrl: string;
  resolvedAssetUrl: string;
  // Product configuration fields left empty for this phase as required:
  name: string;
  price: string;
  sizes: string[];
  stock: number | null;
  backPhotoUrl: string | null;
  modelWearingPhotoUrl: string | null;
  hasCompleteAssets: boolean;
  notes: string;
}

export const BRAND_CONFIG = {
  brandName: 'BAD HABIT',
  tagline: 'YOU KNOW YOU WANT IT',
  pageTitle: 'BAD HABIT — Luxury Architectural Fashion',
  metaDescription: 'BAD HABIT — Luxury architectural fashion runway and clothing showroom. YOU KNOW YOU WANT IT.',
};

/**
 * EXACT HERO ASSET ASSIGNMENTS (from viewer's perspective)
 */
export const HERO_MODELS: HeroModelRecord[] = [
  {
    id: 'hero-left',
    role: 'Left Model',
    originalUrl: 'https://imgshare.cc/q2jttcoo',
    resolvedAssetUrl: '/hero-left.png',
    description: 'Man in black shirt, blue trousers, sunglasses, watch',
    anchorXPercent: 22,
    perspectiveScale: 0.90, // Slightly smaller through perspective, stands slightly behind center
    zDepth: 12,
    contactShadow: {
      width: 170,
      rx: 75,
      ry: 16,
      blur: 7,
      opacity: 0.45,
    },
  },
  {
    id: 'hero-center',
    role: 'Centre Model',
    originalUrl: 'https://imgshare.cc/e9qmq1ik',
    resolvedAssetUrl: '/hero-center.png',
    description: 'Man in dark t-shirt, fedora hat, sunglasses, wide-leg dark jeans, closest to viewer',
    anchorXPercent: 50,
    perspectiveScale: 1.0, // Primary focal model, closest to viewer
    zDepth: 15,
    contactShadow: {
      width: 190,
      rx: 85,
      ry: 18,
      blur: 8,
      opacity: 0.55,
    },
  },
  {
    id: 'hero-right',
    role: 'Right Model',
    originalUrl: 'https://imgshare.cc/ea5mdhsn',
    resolvedAssetUrl: '/hero-right.png',
    description: 'Man in navy t-shirt, khaki trousers, sunglasses',
    anchorXPercent: 78,
    perspectiveScale: 0.92, // Slightly smaller through perspective, stands slightly behind center
    zDepth: 12,
    contactShadow: {
      width: 170,
      rx: 75,
      ry: 16,
      blur: 7,
      opacity: 0.45,
    },
  },
];

/**
 * FOUR PRODUCT ASSETS — EXACT ORDER & PERMANENT IDs
 * Product names, prices, sizes, stock, back photographs and model-wearing photographs
 * have not been supplied for this phase and remain empty without invented values.
 */
export const PRODUCT_CATALOG: ProductRecord[] = [
  {
    id: 'BH-001',
    originalUrl: 'https://imgshare.cc/q8hg3aks',
    resolvedAssetUrl: '/products/BH-001.png',
    name: '',
    price: '',
    sizes: [],
    stock: null,
    backPhotoUrl: null,
    modelWearingPhotoUrl: null,
    hasCompleteAssets: false,
    notes: 'Charcoal drawstring sweatpants on black hanger. Background cleanly removed.',
  },
  {
    id: 'BH-002',
    originalUrl: 'https://imgshare.cc/6tqs8vom',
    resolvedAssetUrl: '/products/BH-002.png',
    name: '',
    price: '',
    sizes: [],
    stock: null,
    backPhotoUrl: null,
    modelWearingPhotoUrl: null,
    hasCompleteAssets: false,
    notes: 'Tan/beige Essentials Fear of God trousers on black hanger. Background cleanly removed.',
  },
  {
    id: 'BH-003',
    originalUrl: 'https://imgshare.cc/6iwdg35i',
    resolvedAssetUrl: '/products/BH-003.png',
    name: '',
    price: '',
    sizes: [],
    stock: null,
    backPhotoUrl: null,
    modelWearingPhotoUrl: null,
    hasCompleteAssets: false,
    notes: 'Slate-blue drawstring trousers on black hanger. Background cleanly removed.',
  },
  {
    id: 'BH-004',
    originalUrl: 'https://imgshare.cc/opmxmg7o',
    resolvedAssetUrl: '/products/BH-004.png',
    name: '',
    price: '',
    sizes: [],
    stock: null,
    backPhotoUrl: null,
    modelWearingPhotoUrl: null,
    hasCompleteAssets: false,
    notes: 'Off-white linen trousers on black hanger. Background cleanly removed.',
  },
];

export const TRANSITION_CONFIG = {
  elevatorScrollDistance: 900, // Pixels of scroll travel for the elevator transition
  slabThicknessPx: 140, // Physical structural slab height in pixels
};
