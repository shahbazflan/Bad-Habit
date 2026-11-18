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

export const PRODUCTS: Product[] = [
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
    image: '/assets/trousers_v2/midnight_blue_front_only.webp',
    backImage: '/assets/trousers_v2/midnight_blue_back_only.webp',
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
    image: '/assets/trousers_v2/ivory_trousers_front_only.webp',
    backImage: '/assets/trousers_v2/ivory_trousers_back_only.webp',
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
    image: '/assets/trousers_v2/sage_trousers_front_only.webp',
    backImage: '/assets/trousers_v2/sage_trousers_back_only.webp',
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
    image: '/assets/trousers_v2/stone_trousers_front_only.webp',
    backImage: '/assets/trousers_v2/stone_trousers_back_only.webp',
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
    image: '/assets/trousers_v2/classic_brown_front_only.webp',
    backImage: '/assets/trousers_v2/classic_brown_back_only.webp',
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
    image: '/assets/trousers_v2/deep_charcoal_front_only.webp',
    backImage: '/assets/trousers_v2/deep_charcoal_back_only.webp',
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
    image: '/assets/trousers_v2/ash_baggy_front_only.webp',
    backImage: '/assets/trousers_v2/ash_baggy_back_only.webp',
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
    image: '/assets/trousers_v2/chocolate_balloon_front_only.webp',
    backImage: '/assets/trousers_v2/chocolate_balloon_back_only.webp',
    price: 'PKR 7,999',
    fabric: 'Volumetric structured heavy-loopback cotton in rich chocolate brown with tapered balloon silhouette, elasticated drawcord waistband, and dual rear patch pockets',
    soldOut: true,
  },

  // ==========================================
  // HOODIES & SWEATSHIRTS COLLECTION
  // ==========================================
  {
    id: 'BH-H01',
    backImage: '/assets/hoodies/storm_blue_back_only.webp',
    name: 'Storm Blue Sweatshirt',
    category: 'Hoodies',
    color: 'Storm Blue',
    colorHex: '#343d49',
    colorGroup: 'sweatshirts',
    image: '/assets/hoodies/storm_blue_front_only.webp',
    frontAndBackImage: '/assets/hoodies/storm_blue_sweatshirt_front_and_back-7_b1259427.webp',
    detailImages: [
      '/assets/hoodies/storm_blue_sweatshirt_detail_catalog-9_d1dd07b0.webp',
    ],
    price: 'PKR 4,499',
    fabric: 'Heavyweight loopback French terry with ribbed crew collar, dropped shoulder silhouette, and micro-ribbed cuffs',
  },
  {
    id: 'BH-H02',
    backImage: '/assets/hoodies/onyx_hoodie_back_only.webp',
    name: 'Onyx Hoodie',
    category: 'Hoodies',
    color: 'Onyx Black',
    colorHex: '#2a2a2d',
    colorGroup: 'hoodies',
    image: '/assets/hoodies/onyx_hoodie_front_only.webp',
    frontAndBackImage: '/assets/hoodies/onyx_hoodie_front_and_back-3_e7aa1c79.webp',
    detailImages: [
      '/assets/hoodies/onyx_hoodie_detail_study-6_b6fd8409.webp',
    ],
    price: 'PKR 4,499',
    fabric: '500 GSM heavyweight brushed fleece with oversized architectural hood, thick tonal drawstrings, and deep kangaroo pocket',
  },
  {
    id: 'BH-H03',
    backImage: '/assets/hoodies/ivory_sweatshirt_back_only.webp',
    name: 'Ivory Sweatshirt',
    category: 'Hoodies',
    color: 'Ivory',
    colorHex: '#dfdbd5',
    colorGroup: 'sweatshirts',
    image: '/assets/hoodies/ivory_sweatshirt_front_only.webp',
    frontAndBackImage: '/assets/hoodies/bad_habit_ivory_sweatshirt_showcase-6_431d360f.webp',
    detailImages: [
      '/assets/hoodies/ivory_sweatshirt_detail_poster-5_d4199c93.webp',
    ],
    price: 'PKR 4,499',
    fabric: 'Clean heavyweight fleece in natural unbleached ivory with double-needle rib collar, balloon sleeves, and fitted hem',
  },
  {
    id: 'BH-H04',
    backImage: '/assets/hoodies/dusty_rose_back_only.webp',
    name: 'Dusty Rose Hoodie',
    category: 'Hoodies',
    color: 'Dusty Rose',
    colorHex: '#cabbbc',
    colorGroup: 'hoodies',
    image: '/assets/hoodies/dusty_rose_hoodie_front_only.webp',
    frontAndBackImage: '/assets/hoodies/dusty_rose_hoodie_front_and_back-1_6413d979.webp',
    detailImages: [
      '/assets/hoodies/dusty_rose_hoodie_detail_showcase-3_1e9d1dee.webp',
    ],
    price: 'PKR 4,499',
    fabric: 'Premium peach-finish brushed cotton with tonal BAD HABIT chest embroidery, cross-over hood, and seamless kangaroo pocket',
  },
  {
    id: 'BH-H05',
    backImage: '/assets/hoodies/off_white_back_only.webp',
    name: 'Off-White Hoodie',
    category: 'Hoodies',
    color: 'Off-White',
    colorHex: '#e2e1e1',
    colorGroup: 'hoodies',
    image: '/assets/hoodies/off_white_hoodie_front_only.webp',
    detailImages: [
      '/assets/hoodies/off_white_hoodie_details_03.webp',
    ],
    price: 'PKR 4,499',
    fabric: 'Heavyweight 480 GSM fleece in architectural off-white with double-layer cross-over hood, tonal metal eyelets & aglets, and structured kangaroo pocket',
  },
  {
    id: 'BH-H06',
    backImage: '/assets/hoodies/charcoal_raglan_hoodie_back.webp',
    name: 'Charcoal Raglan Hoodie',
    category: 'Hoodies',
    color: 'Washed Charcoal',
    colorHex: '#4a4f58',
    colorGroup: 'hoodies',
    image: '/assets/hoodies/charcoal_raglan_hoodie_front.webp',
    price: 'PKR 4,499',
    fabric: 'Heavyweight 500 GSM acid-washed French terry with tonal embroidered chest emblem, raglan sleeves, double-layer hood, and kangaroo pocket',
  },
  {
    id: 'BH-H07',
    backImage: '/assets/hoodies/slate_grey_sweatshirt_back.webp',
    name: 'Slate Grey Sweatshirt',
    category: 'Hoodies',
    color: 'Slate Grey',
    colorHex: '#6f7379',
    colorGroup: 'sweatshirts',
    image: '/assets/hoodies/slate_grey_sweatshirt_front.webp',
    price: 'PKR 4,499',
    fabric: 'Pigment-dyed heavyweight loopback cotton with sun-faded mineral wash, distressed ribbed crew collar, dropped shoulders, and structured cuffs',
  },
  {
    id: 'BH-H08',
    backImage: '/assets/hoodies/washed_umber_hoodie_back.webp',
    name: 'Washed Umber Hoodie',
    category: 'Hoodies',
    color: 'Washed Umber',
    colorHex: '#5d585b',
    colorGroup: 'hoodies',
    image: '/assets/hoodies/washed_umber_hoodie_front.webp',
    price: 'PKR 4,499',
    fabric: '480 GSM enzyme-washed brushed cotton fleece in deep umber with cord-free structured hood, dropped shoulder seams, and deep kangaroo pocket',
  },
  {
    id: 'BH-H09',
    backImage: '/assets/hoodies/oatmeal_hoodie_back.webp',
    name: 'Oatmeal Hoodie',
    category: 'Hoodies',
    color: 'Oatmeal',
    colorHex: '#dcd8d5',
    colorGroup: 'hoodies',
    image: '/assets/hoodies/oatmeal_hoodie_front.webp',
    price: 'PKR 4,499',
    fabric: '500 GSM heavyweight brushed fleece in warm oatmeal with tonal chest emblem embroidery, cross-over hood, raglan sleeves, and kangaroo pocket',
  },

  // ==========================================
  // SHIRTS COLLECTION (Magnum, Rough, Maroon, Espresso, Cream, Foam)
  // ==========================================
  {
    id: 'BH-S05',
    backImage: '/assets/shirts/deep_espresso_shirt_back.webp',
    name: 'Magnum BOXY',
    category: 'Shirts',
    color: 'Black',
    colorHex: '#222020',
    colorGroup: 'shirts',
    image: '/assets/shirts/black_boxy_front.webp',
    price: 'PKR 4,999',
    fabric: 'Deep black heavyweight matte poplin with structured collar stand, tonal buttons, and architectural straight boxy hem',
  },
  {
    id: 'BH-S06',
    backImage: '/assets/shirts/taupe_poplin_shirt_back.webp',
    name: 'Rough BOXY',
    category: 'Shirts',
    color: 'Rough Olive',
    colorHex: '#796e63',
    colorGroup: 'shirts',
    image: '/assets/shirts/rough_boxy_front.webp',
    price: 'PKR 4,999',
    fabric: 'Crisp textured European poplin with original branded labels, wide camp collar, and relaxed boxy tailoring',
  },
  {
    id: 'BH-S04',
    backImage: '/assets/shirts/chocolate_camp_shirt_back.webp',
    name: 'Maroon BOXY',
    category: 'Shirts',
    color: 'Maroon',
    colorHex: '#5a3330',
    colorGroup: 'shirts',
    image: '/assets/shirts/maroon_boxy_front.webp',
    price: 'PKR 4,999',
    fabric: 'Rich maroon garment-washed poplin with unstructured camp collar, clean tonal stitching, and breathable boxy fit',
  },
  {
    id: 'BH-S03',
    backImage: '/assets/shirts/espresso_silk_shirt_back.webp',
    name: 'Espresso BOXY',
    category: 'Shirts',
    color: 'Espresso',
    colorHex: '#3c2e28',
    colorGroup: 'shirts',
    image: '/assets/shirts/espresso_boxy_front.webp',
    price: 'PKR 4,999',
    fabric: 'Ultra-smooth washed mulberry silk blend with fluid drape, tonal buttons, and architectural boxy camp collar',
  },
  {
    id: 'BH-S02',
    backImage: '/assets/shirts/ivory_camp_shirt_back.webp',
    name: 'Cream BOXY',
    category: 'Shirts',
    color: 'Cream',
    colorHex: '#dacfc2',
    colorGroup: 'shirts',
    image: '/assets/shirts/cream_boxy_front.webp',
    price: 'PKR 4,999',
    fabric: 'Premium textured slub cotton in warm cream with open cuban collar, dropped shoulder drape, and boxy tailoring',
  },
  {
    id: 'BH-S01',
    backImage: '/assets/shirts/white_camp_shirt_back.webp',
    name: 'Foam BOXY',
    category: 'Shirts',
    color: 'Foam White',
    colorHex: '#e8e6e4',
    colorGroup: 'shirts',
    image: '/assets/shirts/foam_boxy_front.webp',
    price: 'PKR 4,999',
    fabric: '100% lightweight European poplin cotton with relaxed camp collar, mother-of-pearl buttons, and structured boxy hem',
  },
];

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
