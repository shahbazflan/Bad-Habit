/**
 * BAD HABIT Showroom Products
 * 
 * Replaced Trouser Collection from Wistia folder: bb8tqqfbpe (10 authoritative articles)
 * Added Hoodie & Sweatshirt Collection from Wistia folder: 2zkm2572il (4 authoritative articles)
 * 
 * Each article features authentic 100% transparent PNG garment cutouts and high-definition
 * detail showcases (waistband, pocket, drawstring, embroidery, cuff, hem) with ZERO background cards.
 */

export type ColorGroup =
  | 'trousers-tailored'
  | 'trousers-streetwear'
  | 'hoodies'
  | 'sweatshirts'
  | 'shirts';

export interface Product {
  id: string;
  name: string;
  subtitle?: string;
  category: 'Trousers' | 'Hoodies' | 'Shirts';
  subCollection?: 'Tailored' | 'Streetwear';
  color: string;
  colorHex: string;
  colorGroup: ColorGroup;
  image: string; // Transparent front garment / primary showcase cutout
  frontAndBackImage?: string; // Front & back showcase slide (second image in details)
  backImage?: string; // Transparent back garment cutout
  detailImages?: string[]; // High-definition close-up detail cutouts
  price: string;
  fabric: string;
  isHighlight?: boolean;
  soldOut?: boolean;
}

export const HERO_PLATE_URL = '/clean_plate.jpg?v=opt26';
export const HERO_PLATE_WEBP_800 = '/clean_plate_800.webp?v=opt26';
export const HERO_PLATE_WEBP_1376 = '/clean_plate_1376.webp?v=opt26';
export const HERO_PLATE_AVIF_800 = '/clean_plate_800.avif?v=opt26';
export const HERO_PLATE_AVIF_1376 = '/clean_plate_1376.avif?v=opt26';
export const HERO_LOGO_URL = '/bad_habit_transparent.webp?v=opt26';
export const HERO_MODEL_URL = '/assets/aistudio/hero_mobile_model_cutout.webp?v=opt26';

export const ASSET_CACHE_VERSION =
  typeof __ASSET_VERSION__ !== 'undefined' ? __ASSET_VERSION__ : '20261121-v8';

export function withAssetVersion(assetPath: string): string {
  if (!assetPath || assetPath.startsWith('http') || assetPath.includes('?')) {
    return assetPath;
  }
  return `${assetPath}?v=${ASSET_CACHE_VERSION}`;
}

/**
 * Maps an active studio WebP URL to its pre-generated lightweight `_sm.webp`
 * responsive variant (400px-560px) while preserving any query cache key.
 */
export function getSmallVariantUrl(url: string): string {
  if (!url) return url;
  const qIdx = url.indexOf('?');
  const base = qIdx >= 0 ? url.slice(0, qIdx) : url;
  const query = qIdx >= 0 ? url.slice(qIdx) : '';

  if (base.endsWith('_sm.webp') || !base.endsWith('.webp')) {
    return url;
  }

  const isEligible =
    base.endsWith('_v2.webp') ||
    base.startsWith('/assets/hoodies/') ||
    base.startsWith('/assets/trousers_v2/') ||
    base.startsWith('/assets/shirts/') ||
    base.startsWith('/assets/categories/category_trousers_hd') ||
    base.startsWith('/assets/categories/category_shirts_v3') ||
    base.startsWith('/assets/categories/category_hoodies_v4') ||
    base.startsWith('/assets/size_guides/') ||
    base === '/bad_habit_transparent.webp' ||
    base === '/assets/aistudio/hero_mobile_model_cutout.webp';

  if (!isEligible) return url;
  return `${base.replace(/\.webp$/, '_sm.webp')}${query}`;
}

/**
 * Generates an accurate width-descriptor `srcSet` string matched to the
 * pre-generated WebP widths so mobile/thumbnail slots download 10-25 KB WebPs.
 */
export function getResponsiveSrcSet(url: string): string | undefined {
  if (!url) return undefined;
  const smUrl = getSmallVariantUrl(url);
  if (smUrl === url) return undefined;

  const qIdx = url.indexOf('?');
  const base = qIdx >= 0 ? url.slice(0, qIdx) : url;

  if (base === '/bad_habit_transparent.webp') {
    return `${smUrl} 560w, ${url} 1000w`;
  }
  if (base === '/assets/aistudio/hero_mobile_model_cutout.webp') {
    return `${smUrl} 240w, ${url} 375w`;
  }
  if (base.startsWith('/assets/categories/')) {
    return `${smUrl} 400w, ${url} 740w`;
  }
  if (base.startsWith('/assets/size_guides/')) {
    return `${smUrl} 480w, ${url} 900w`;
  }
  if (base.endsWith('_v2.webp')) {
    return `${smUrl} 440w, ${url} 900w`;
  }
  return `${smUrl} 400w, ${url} 720w`;
}

const RAW_PRODUCTS: Product[] = [
  // ==========================================
  // TAILORED TROUSERS (Exact Order: Midnight Blue, Ivory, Sage, Stone, Classic Brown)
  // ==========================================
  {
    id: 'BH-T01',
    name: 'Midnight Blue',
    category: 'Trousers',
    subCollection: 'Tailored',
    color: 'Midnight Blue',
    colorHex: '#2a384c',
    colorGroup: 'trousers-tailored',
    image: '/assets/trousers_v2/midnight_blue_front_only_v2.webp',
    backImage: '/assets/trousers_v2/midnight_blue_back_only_v2.webp',
    frontAndBackImage: '/assets/trousers_v2/midnight_blue_trousers_transparent_poster-1_fb454bd2.webp',
    detailImages: [
      '/assets/trousers_v2/midnight_blue_trousers_detail_poster-2_d6eee5c8.webp',
    ],
    price: 'PKR 6,499',
    fabric: 'Pure washed architectural linen with elasticated drawstring waistband, horn button, and tonal monogram weave',
  },
  {
    id: 'BH-T06',
    name: 'Ivory Trousers',
    category: 'Trousers',
    subCollection: 'Tailored',
    color: 'Ivory',
    colorHex: '#e8e0d7',
    colorGroup: 'trousers-tailored',
    image: '/assets/trousers_v2/ivory_trousers_front_only_v2.webp',
    backImage: '/assets/trousers_v2/ivory_trousers_back_only_v2.webp',
    frontAndBackImage: '/assets/trousers_v2/white_typography_on_transparent_fashion_carousel-14_5936d425.webp',
    detailImages: [
      '/assets/trousers_v2/transparent_fashion_slide_with_white_typography-16_e57d3a87.webp',
    ],
    price: 'PKR 6,499',
    fabric: 'Natural textured slub linen blend with relaxed straight cut, belt loops, and tonal back welt pockets',
  },
  {
    id: 'BH-T07',
    name: 'Sage Trousers',
    category: 'Trousers',
    subCollection: 'Tailored',
    color: 'Sage Green',
    colorHex: '#9fa392',
    colorGroup: 'trousers-tailored',
    image: '/assets/trousers_v2/sage_trousers_front_only_v2.webp',
    backImage: '/assets/trousers_v2/sage_trousers_back_only_v2.webp',
    frontAndBackImage: '/assets/trousers_v2/sage_trousers_poster_with_white_typography-6_754f145e.webp',
    detailImages: [
      '/assets/trousers_v2/sage_trousers_macro_details_poster-8_229092bc.webp',
      '/assets/trousers_v2/sage_trousers_fashion_poster-7_c47a8ef2.webp',
    ],
    price: 'PKR 6,499',
    fabric: 'Subtle sage garment-dyed cotton-linen weave with tonal drawcord, horn button, and tailored waistband',
  },
  {
    id: 'BH-T08',
    name: 'Stone Trousers',
    category: 'Trousers',
    subCollection: 'Tailored',
    color: 'Stone',
    colorHex: '#d4c5b8',
    colorGroup: 'trousers-tailored',
    image: '/assets/trousers_v2/stone_trousers_front_only_v2.webp',
    backImage: '/assets/trousers_v2/stone_trousers_back_only_v2.webp',
    frontAndBackImage: '/assets/trousers_v2/stone_trousers_poster_with_white_typography-11_142a391c.webp',
    detailImages: [
      '/assets/trousers_v2/stone_trousers_detail_poster-9_2b5e0113.webp',
    ],
    price: 'PKR 6,499',
    fabric: 'Earth-tone washed linen with relaxed drape, horn button closure, back flap pockets, and clean finished hem',
  },
  {
    id: 'BH-T10',
    name: 'Classic Brown Trousers',
    category: 'Trousers',
    subCollection: 'Tailored',
    color: 'Classic Brown',
    colorHex: '#cbb396',
    colorGroup: 'trousers-tailored',
    image: '/assets/trousers_v2/classic_brown_front_only_v2.webp',
    backImage: '/assets/trousers_v2/classic_brown_back_only_v2.webp',
    frontAndBackImage: '/assets/trousers_v2/transparent_fashion_slide_with_white_typography-4_ae58e102.webp',
    detailImages: [
      '/assets/trousers_v2/transparent_fashion_carousel_with_white_typography-2_33cfcc84.webp',
      '/assets/trousers_v2/transparent_white_typography_trouser_poster-7_d7aaa4b7.webp',
    ],
    price: 'PKR 6,499',
    fabric: 'Garment-washed cotton twill in signature warm saddle brown with architectural relaxed cut and horn button closure',
  },

  // ==========================================
  // STREETWEAR TROUSERS (Deep Charcoal Balloon, Ash Baggy, Chocolate Balloon [SOLD OUT])
  // ==========================================
  {
    id: 'BH-T09',
    name: 'Deep Charcoal Balloon Pants',
    category: 'Trousers',
    subCollection: 'Streetwear',
    color: 'Deep Charcoal',
    colorHex: '#2a2d34',
    colorGroup: 'trousers-streetwear',
    image: '/assets/trousers_v2/deep_charcoal_front_only_v2.webp',
    backImage: '/assets/trousers_v2/deep_charcoal_back_only_v2.webp',
    frontAndBackImage: '/assets/trousers_v2/transparent_bad_habit_fashion_catalog_slide-6_9517fe91.webp',
    detailImages: [
      '/assets/trousers_v2/white_typography_on_a_transparent_fashion_slide-5_287bf00d.webp',
    ],
    price: 'PKR 7,999',
    fabric: 'Volumetric structured twill with tapered balloon silhouette, elasticated cording, and dual rear patch pockets',
  },
  {
    id: 'BH-T05',
    name: 'Ash Baggy',
    category: 'Trousers',
    subCollection: 'Streetwear',
    color: 'Ash Grey',
    colorHex: '#bcbabb',
    colorGroup: 'trousers-streetwear',
    image: '/assets/trousers_v2/ash_baggy_front_only_v2.webp',
    backImage: '/assets/trousers_v2/ash_baggy_back_only_v2.webp',
    frontAndBackImage: '/assets/trousers_v2/ash-baggy-trousers-front-and-back-white-transparent_ad7ed4a3.webp',
    detailImages: [
      '/assets/trousers_v2/ash-baggy-trousers-the-details-21-white-transparent_ad7e3eb9.webp',
    ],
    price: 'PKR 6,499',
    fabric: 'Slouch-cut textured weave fleece with wide architectural drape, elongated drawcord, and deep hand pockets',
  },
  {
    id: 'BH-T11',
    name: 'Chocolate Balloon Pants',
    category: 'Trousers',
    subCollection: 'Streetwear',
    color: 'Chocolate Brown',
    colorHex: '#574a44',
    colorGroup: 'trousers-streetwear',
    image: '/assets/trousers_v2/chocolate_balloon_front_only_v2.webp',
    backImage: '/assets/trousers_v2/chocolate_balloon_back_only_v2.webp',
    price: 'PKR 7,999',
    fabric: 'Volumetric structured heavy-loopback cotton in rich chocolate brown with tapered balloon silhouette, elasticated drawcord waistband, and dual rear patch pockets',
    soldOut: true,
  },

  // ==========================================
  // HOODIES & SWEATSHIRTS COLLECTION
  // ==========================================
  {
    id: 'BH-H01',
    backImage: '/assets/hoodies/storm_blue_back_only_v2.webp',
    name: 'Storm Blue Sweatshirt',
    category: 'Hoodies',
    color: 'Storm Blue',
    colorHex: '#343d49',
    colorGroup: 'sweatshirts',
    image: '/assets/hoodies/storm_blue_front_only_v2.webp',
    frontAndBackImage: '/assets/hoodies/storm_blue_sweatshirt_front_and_back-7_b1259427.webp',
    detailImages: [
      '/assets/hoodies/storm_blue_sweatshirt_detail_catalog-9_d1dd07b0.webp',
    ],
    price: 'PKR 4,499',
    fabric: 'Heavyweight loopback French terry with ribbed crew collar, dropped shoulder silhouette, and micro-ribbed cuffs',
  },
  {
    id: 'BH-H02',
    backImage: '/assets/hoodies/onyx_hoodie_back_only_v2.webp',
    name: 'Onyx Hoodie',
    category: 'Hoodies',
    color: 'Onyx Black',
    colorHex: '#2a2a2d',
    colorGroup: 'hoodies',
    image: '/assets/hoodies/onyx_hoodie_front_only_v2.webp',
    frontAndBackImage: '/assets/hoodies/onyx_hoodie_front_and_back-3_e7aa1c79.webp',
    detailImages: [
      '/assets/hoodies/onyx_hoodie_detail_study-6_b6fd8409.webp',
    ],
    price: 'PKR 4,499',
    fabric: '500 GSM heavyweight brushed fleece with oversized architectural hood, thick tonal drawstrings, and deep kangaroo pocket',
  },
  {
    id: 'BH-H03',
    backImage: '/assets/hoodies/ivory_sweatshirt_back_only_v2.webp',
    name: 'Ivory Sweatshirt',
    category: 'Hoodies',
    color: 'Ivory',
    colorHex: '#dfdbd5',
    colorGroup: 'sweatshirts',
    image: '/assets/hoodies/ivory_sweatshirt_front_only_v2.webp',
    frontAndBackImage: '/assets/hoodies/bad_habit_ivory_sweatshirt_showcase-6_431d360f.webp',
    detailImages: [
      '/assets/hoodies/ivory_sweatshirt_detail_poster-5_v2.webp',
    ],
    price: 'PKR 4,499',
    fabric: 'Clean heavyweight fleece in natural unbleached ivory with double-needle rib collar, balloon sleeves, and fitted hem',
  },
  {
    id: 'BH-H04',
    backImage: '/assets/hoodies/dusty_rose_back_only_v2.webp',
    name: 'Dusty Rose Hoodie',
    category: 'Hoodies',
    color: 'Dusty Rose',
    colorHex: '#cabbbc',
    colorGroup: 'hoodies',
    image: '/assets/hoodies/dusty_rose_hoodie_front_only_v2.webp',
    frontAndBackImage: '/assets/hoodies/dusty_rose_hoodie_front_and_back-1_6413d979.webp',
    detailImages: [
      '/assets/hoodies/dusty_rose_hoodie_detail_showcase-3_v2.webp',
    ],
    price: 'PKR 4,499',
    fabric: 'Premium peach-finish brushed cotton with tonal emblem chest embroidery, cross-over hood, and seamless kangaroo pocket',
  },
  {
    id: 'BH-H05',
    backImage: '/assets/hoodies/off_white_back_only_v2.webp',
    name: 'Off-White Hoodie',
    category: 'Hoodies',
    color: 'Off-White',
    colorHex: '#e2e1e1',
    colorGroup: 'hoodies',
    image: '/assets/hoodies/off_white_hoodie_front_only_v2.webp',
    detailImages: [
      '/assets/hoodies/off_white_hoodie_details_03.webp',
    ],
    price: 'PKR 4,499',
    fabric: 'Heavyweight 480 GSM fleece in architectural off-white with double-layer cross-over hood, tonal metal eyelets & aglets, and structured kangaroo pocket',
  },
  {
    id: 'BH-H06',
    backImage: '/assets/hoodies/charcoal_raglan_hoodie_back_v2.webp',
    name: 'Charcoal Raglan Hoodie',
    category: 'Hoodies',
    color: 'Washed Charcoal',
    colorHex: '#4a4f58',
    colorGroup: 'hoodies',
    image: '/assets/hoodies/charcoal_raglan_hoodie_front_v2.webp',
    price: 'PKR 4,499',
    fabric: 'Heavyweight 500 GSM acid-washed French terry with tonal embroidered chest emblem, raglan sleeves, double-layer hood, and kangaroo pocket',
  },
  {
    id: 'BH-H07',
    backImage: '/assets/hoodies/slate_grey_sweatshirt_back_v2.webp',
    name: 'Slate Grey Sweatshirt',
    category: 'Hoodies',
    color: 'Slate Grey',
    colorHex: '#6f7379',
    colorGroup: 'sweatshirts',
    image: '/assets/hoodies/slate_grey_sweatshirt_front_v2.webp',
    price: 'PKR 4,499',
    fabric: 'Pigment-dyed heavyweight loopback cotton with sun-faded mineral wash, distressed ribbed crew collar, dropped shoulders, and structured cuffs',
  },
  {
    id: 'BH-H08',
    backImage: '/assets/hoodies/washed_umber_hoodie_back_v2.webp',
    name: 'Washed Umber Hoodie',
    category: 'Hoodies',
    color: 'Washed Umber',
    colorHex: '#5d585b',
    colorGroup: 'hoodies',
    image: '/assets/hoodies/washed_umber_hoodie_front_v2.webp',
    price: 'PKR 4,499',
    fabric: '480 GSM enzyme-washed brushed cotton fleece in deep umber with cord-free structured hood, dropped shoulder seams, and deep kangaroo pocket',
  },
  {
    id: 'BH-H09',
    backImage: '/assets/hoodies/oatmeal_hoodie_back_v2.webp',
    name: 'Oatmeal Hoodie',
    category: 'Hoodies',
    color: 'Oatmeal',
    colorHex: '#dcd8d5',
    colorGroup: 'hoodies',
    image: '/assets/hoodies/oatmeal_hoodie_front_v2.webp',
    price: 'PKR 4,499',
    fabric: '500 GSM heavyweight brushed fleece in warm oatmeal with tonal chest emblem embroidery, cross-over hood, raglan sleeves, and kangaroo pocket',
  },

  // ==========================================
  // SHIRTS COLLECTION (Magnum, Rough, Maroon, Espresso, Cream, Foam)
  // ==========================================
  {
    id: 'BH-S05',
    backImage: '/assets/shirts/magnum_boxy_back_v2.webp',
    name: 'Magnum BOXY',
    subtitle: 'Rough Cuban collar',
    category: 'Shirts',
    color: 'Black',
    colorHex: '#222020',
    colorGroup: 'shirts',
    image: '/assets/shirts/magnum_boxy_front_v2.webp',
    price: 'PKR 4,999',
    fabric: 'Deep black heavyweight matte poplin with structured collar stand, tonal buttons, and architectural straight boxy hem',
  },
  {
    id: 'BH-S06',
    backImage: '/assets/shirts/rough_boxy_back_v2.webp',
    name: 'Rough BOXY',
    subtitle: 'Rough Cuban collar',
    category: 'Shirts',
    color: 'Rough Olive',
    colorHex: '#796e63',
    colorGroup: 'shirts',
    image: '/assets/shirts/rough_boxy_front_v2.webp',
    price: 'PKR 4,999',
    fabric: 'Crisp textured European poplin with original branded labels, wide camp collar, and relaxed boxy tailoring',
  },
  {
    id: 'BH-S04',
    backImage: '/assets/shirts/maroon_boxy_back_v2.webp',
    name: 'Maroon BOXY',
    subtitle: 'Rough Cuban collar',
    category: 'Shirts',
    color: 'Maroon',
    colorHex: '#5a3330',
    colorGroup: 'shirts',
    image: '/assets/shirts/maroon_boxy_front_v2.webp',
    price: 'PKR 4,999',
    fabric: 'Rich maroon garment-washed poplin with unstructured camp collar, clean tonal stitching, and breathable boxy fit',
  },
  {
    id: 'BH-S03',
    backImage: '/assets/shirts/espresso_boxy_back_v2.webp',
    name: 'Espresso BOXY',
    subtitle: 'Rough Cuban collar',
    category: 'Shirts',
    color: 'Espresso',
    colorHex: '#3c2e28',
    colorGroup: 'shirts',
    image: '/assets/shirts/espresso_boxy_front_v2.webp',
    price: 'PKR 4,999',
    fabric: 'Ultra-smooth washed mulberry silk blend with fluid drape, tonal buttons, and architectural boxy camp collar',
  },
  {
    id: 'BH-S02',
    backImage: '/assets/shirts/cream_boxy_back_v2.webp',
    name: 'Cream BOXY',
    subtitle: 'Rough Cuban collar',
    category: 'Shirts',
    color: 'Cream',
    colorHex: '#dacfc2',
    colorGroup: 'shirts',
    image: '/assets/shirts/cream_boxy_front_v2.webp',
    price: 'PKR 4,999',
    fabric: 'Premium textured slub cotton in warm cream with open cuban collar, dropped shoulder drape, and boxy tailoring',
  },
  {
    id: 'BH-S01',
    backImage: '/assets/shirts/foam_boxy_back_v2.webp',
    name: 'Foam BOXY',
    subtitle: 'Rough Cuban collar',
    category: 'Shirts',
    color: 'Foam White',
    colorHex: '#e8e6e4',
    colorGroup: 'shirts',
    image: '/assets/shirts/foam_boxy_front_v2.webp',
    price: 'PKR 4,999',
    fabric: '100% lightweight European poplin cotton with relaxed camp collar, mother-of-pearl buttons, and structured boxy hem',
  },
];

export const PRODUCTS: Product[] = RAW_PRODUCTS.map((p) => ({
  ...p,
  image: withAssetVersion(p.image),
  backImage: p.backImage ? withAssetVersion(p.backImage) : undefined,
  frontAndBackImage: p.frontAndBackImage ? withAssetVersion(p.frontAndBackImage) : undefined,
  detailImages: p.detailImages ? p.detailImages.map(withAssetVersion) : undefined,
}));

export const TAILORED_TROUSERS = PRODUCTS.filter(
  (p) => p.category === 'Trousers' && p.subCollection !== 'Streetwear'
);
export const STREETWEAR_TROUSERS = PRODUCTS.filter(
  (p) => p.category === 'Trousers' && p.subCollection === 'Streetwear'
);
export const MAIN_COLLECTION = PRODUCTS.filter((p) => p.category === 'Trousers');
export const HIGHLIGHT_PRODUCTS = STREETWEAR_TROUSERS;
export const HOODIE_PRODUCTS = PRODUCTS.filter((p) => p.category === 'Hoodies');
export const SHIRT_PRODUCTS = PRODUCTS.filter((p) => p.category === 'Shirts');

export function getColorVariants(product: Product): Product[] {
  return PRODUCTS.filter((p) => p.colorGroup === product.colorGroup);
}

const SUBTITLE_BY_PRODUCT_ID = new Map<string, string>(
  RAW_PRODUCTS.filter((p) => p.subtitle).map((p) => [p.id, p.subtitle as string])
);

export function getProductSubtitle(productId?: string | null): string | undefined {
  if (!productId) return undefined;
  return SUBTITLE_BY_PRODUCT_ID.get(productId);
}

export interface ShirtCardFrame {
  desktopCardImgClass: string;
  desktopDetailPaddingClass: string;
  mobileGridImgClass: string;
  mobileGridPaddingClass: string;
  mobileDetailPaddingClass: string;
}

const DEFAULT_SHIRT_FRAME: ShirtCardFrame = {
  desktopCardImgClass: 'w-[91%]',
  desktopDetailPaddingClass: 'p-3',
  mobileGridImgClass: 'w-full',
  mobileGridPaddingClass: 'p-4 sm:p-5',
  mobileDetailPaddingClass: 'p-2',
};

const DEFAULT_GARMENT_FRAME: ShirtCardFrame = {
  desktopCardImgClass: 'w-full',
  desktopDetailPaddingClass: 'p-0',
  mobileGridImgClass: 'w-full',
  mobileGridPaddingClass: 'p-1',
  mobileDetailPaddingClass: 'p-0',
};

const GARMENT_FRAME_BY_ID: Record<string, ShirtCardFrame> = {
  // ==========================================
  // SHIRTS (Balanced Left/Right & Front/Back proportions)
  // ==========================================
  'BH-S05': DEFAULT_SHIRT_FRAME,
  'BH-S06': {
    desktopCardImgClass: 'w-[115%] max-w-none',
    desktopDetailPaddingClass: 'p-0',
    mobileGridImgClass: 'w-[112%] max-w-none',
    mobileGridPaddingClass: 'px-0 py-2 sm:py-3',
    mobileDetailPaddingClass: 'p-0',
  },
  'BH-S04': DEFAULT_SHIRT_FRAME,
  'BH-S03': {
    desktopCardImgClass: 'w-[94%]',
    desktopDetailPaddingClass: 'p-2',
    mobileGridImgClass: 'w-full',
    mobileGridPaddingClass: 'px-3 py-4 sm:px-4 sm:py-5',
    mobileDetailPaddingClass: 'p-1.5',
  },
  'BH-S02': {
    desktopCardImgClass: 'w-[81%]',
    desktopDetailPaddingClass: 'p-4',
    mobileGridImgClass: 'w-[92%]',
    mobileGridPaddingClass: 'p-4 sm:p-5',
    mobileDetailPaddingClass: 'p-2.5',
  },
  'BH-S01': {
    desktopCardImgClass: 'w-[98%]',
    desktopDetailPaddingClass: 'p-1',
    mobileGridImgClass: 'w-[105%] max-w-none',
    mobileGridPaddingClass: 'px-1.5 py-2.5 sm:px-2.5 sm:py-3',
    mobileDetailPaddingClass: 'p-0.5',
  },

  // ==========================================
  // HOODIES & SWEATSHIRTS (Balanced aspect-ratio card & detail framing)
  // ==========================================
  'BH-H01': {
    ...DEFAULT_GARMENT_FRAME,
    desktopCardImgClass: 'w-[98%]',
  },
  'BH-H02': {
    ...DEFAULT_GARMENT_FRAME,
    desktopCardImgClass: 'w-[96%]',
  },
  'BH-H03': {
    desktopCardImgClass: 'w-[114%] max-w-none',
    desktopDetailPaddingClass: 'p-0',
    mobileGridImgClass: 'w-[112%] max-w-none',
    mobileGridPaddingClass: 'px-0.5 py-2',
    mobileDetailPaddingClass: 'p-0',
  },
  'BH-H04': {
    desktopCardImgClass: 'w-[86%]',
    desktopDetailPaddingClass: 'p-3',
    mobileGridImgClass: 'w-[90%]',
    mobileGridPaddingClass: 'p-2.5 sm:p-3',
    mobileDetailPaddingClass: 'p-2',
  },
  'BH-H05': {
    desktopCardImgClass: 'w-[91%]',
    desktopDetailPaddingClass: 'p-4',
    mobileGridImgClass: 'w-[92%]',
    mobileGridPaddingClass: 'p-2 sm:p-3',
    mobileDetailPaddingClass: 'p-3',
  },
  'BH-H06': {
    ...DEFAULT_GARMENT_FRAME,
    desktopCardImgClass: 'w-[97%]',
  },
  'BH-H07': {
    desktopCardImgClass: 'w-[107%] max-w-none',
    desktopDetailPaddingClass: 'p-0',
    mobileGridImgClass: 'w-[105%] max-w-none',
    mobileGridPaddingClass: 'px-1 py-2',
    mobileDetailPaddingClass: 'p-0',
  },
  'BH-H08': {
    desktopCardImgClass: 'w-[102%] max-w-none',
    desktopDetailPaddingClass: 'p-0',
    mobileGridImgClass: 'w-[102%] max-w-none',
    mobileGridPaddingClass: 'p-1',
    mobileDetailPaddingClass: 'p-0',
  },
  'BH-H09': {
    desktopCardImgClass: 'w-[92%]',
    desktopDetailPaddingClass: 'p-1.5',
    mobileGridImgClass: 'w-[94%]',
    mobileGridPaddingClass: 'p-1.5 sm:p-2',
    mobileDetailPaddingClass: 'p-1',
  },

  // ==========================================
  // TROUSERS
  // ==========================================
  'BH-T09': {
    ...DEFAULT_GARMENT_FRAME,
    desktopDetailPaddingClass: 'p-1',
    mobileDetailPaddingClass: 'p-1',
  },
};

export function getShirtCardFrame(productId: string): ShirtCardFrame {
  return GARMENT_FRAME_BY_ID[productId] || (productId.startsWith('BH-S') ? DEFAULT_SHIRT_FRAME : DEFAULT_GARMENT_FRAME);
}

export function getGarmentCardFrame(productId: string): ShirtCardFrame {
  return getShirtCardFrame(productId);
}

export function getShirtDetailImageClass(
  productId: string,
  isBackView: boolean,
  platform: 'desktop' | 'mobile'
): string {
  // Rough BOXY Back (1086x1448 portrait) vs Front (1448x1086 landscape):
  // Constrain Back height so torso & collar-to-hem size match Front cleanly
  if (productId === 'BH-S06' && isBackView) {
    return platform === 'desktop' ? 'h-[71%] w-auto' : 'h-[63%] w-auto';
  }
  // Cream BOXY Front (1199x1312 portrait) vs Back (1312x1199 landscape):
  if (productId === 'BH-S02' && !isBackView) {
    return platform === 'desktop' ? 'h-[81%] w-auto' : 'h-[85%] w-auto';
  }
  // Dusty Rose Hoodie Front (892x1054 portrait) vs Back (1230x1261 square-ish):
  if (productId === 'BH-H04' && !isBackView) {
    return platform === 'desktop' ? 'h-[90%] w-auto' : 'h-[92%] w-auto';
  }

  const frame = getGarmentCardFrame(productId);
  const fullBackIds = new Set(['BH-S02', 'BH-S01', 'BH-H04', 'BH-H09', 'BH-T09']);
  const slightlyLooserBackIds = new Set(['BH-S05', 'BH-S04']);

  if (isBackView && fullBackIds.has(productId)) {
    return 'w-full h-full p-0';
  }
  if (isBackView && slightlyLooserBackIds.has(productId)) {
    return platform === 'desktop' ? 'w-full h-full p-2' : 'w-full h-full p-1.5';
  }
  if (isBackView && productId === 'BH-S03') {
    return platform === 'desktop' ? 'w-full h-full p-3' : 'w-full h-full p-2';
  }

  const pad =
    platform === 'desktop'
      ? frame.desktopDetailPaddingClass
      : frame.mobileDetailPaddingClass;
  return `w-full h-full ${pad}`;
}



