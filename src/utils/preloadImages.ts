import {
  Product,
  HERO_PLATE_WEBP_800,
  HERO_PLATE_WEBP_1376,
  getSmallVariantUrl,
  withAssetVersion,
} from '../data/products';

let initialPreloaded = false;
const preloadedCategories = new Set<string>();
const requestedUrls = new Set<string>();

interface NetworkConnectionLike {
  saveData?: boolean;
  effectiveType?: string;
}

/**
 * Respects user Save-Data preferences and slow/congested cellular networks
 * (2G, slow-2G, and throttled 3G connections).
 */
export function isConstrainedNetwork(): boolean {
  if (typeof navigator === 'undefined') return false;
  const conn = (navigator as Navigator & { connection?: NetworkConnectionLike }).connection;
  if (!conn) return false;
  if (conn.saveData) return true;
  return (
    conn.effectiveType === 'slow-2g' ||
    conn.effectiveType === '2g' ||
    conn.effectiveType === '3g'
  );
}

function loadImageUrl(url: string): Promise<void> {
  if (!url || typeof window === 'undefined' || requestedUrls.has(url)) {
    return Promise.resolve();
  }
  requestedUrls.add(url);

  return new Promise((resolve) => {
    const img = new Image();
    img.decoding = 'async';
    const done = () => {
      if (typeof img.decode === 'function') {
        img.decode().catch(() => {}).finally(resolve);
      } else {
        resolve();
      }
    };
    img.onload = done;
    img.onerror = () => resolve();
    img.src = url;
  });
}

function preloadUrls(urls: string[], concurrency = 2) {
  if (typeof window === 'undefined' || urls.length === 0 || isConstrainedNetwork()) {
    return;
  }

  const uniquePending: string[] = [];
  const seen = new Set<string>();
  for (const url of urls) {
    if (url && !requestedUrls.has(url) && !seen.has(url)) {
      seen.add(url);
      uniquePending.push(url);
    }
  }
  if (uniquePending.length === 0) return;

  let cursor = 0;
  const worker = async () => {
    while (cursor < uniquePending.length) {
      const nextUrl = uniquePending[cursor++];
      await loadImageUrl(nextUrl);
    }
  };

  const workerCount = Math.min(concurrency, uniquePending.length);
  for (let i = 0; i < workerCount; i++) {
    void worker();
  }
}

/**
 * Lightly warms only the small WebP category thumbnails after window load on fast
 * connections. Strictly a no-op on Save-Data or slow 2G/3G networks.
 */
export function preloadGarmentImages() {
  if (typeof window === 'undefined' || initialPreloaded || isConstrainedNetwork()) {
    return;
  }
  initialPreloaded = true;

  const startWarmup = () => {
    if (isConstrainedNetwork()) return;
    const isSmallViewport = window.innerWidth < 768;
    const rawCovers = [
      withAssetVersion('/assets/categories/category_trousers_hd.webp'),
      withAssetVersion('/assets/categories/category_shirts_v3.webp'),
      withAssetVersion('/assets/categories/category_hoodies_v4.webp'),
    ];
    const categoryCovers = isSmallViewport
      ? rawCovers.map((url) => getSmallVariantUrl(url))
      : rawCovers;
    preloadUrls(categoryCovers, 2);
  };

  const schedule = () => {
    globalThis.setTimeout(() => {
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(startWarmup, { timeout: 2000 });
      } else {
        startWarmup();
      }
    }, 1800);
  };

  if (document.readyState === 'complete') {
    schedule();
  } else {
    window.addEventListener('load', schedule, { once: true });
  }
}

/**
 * Warms only the first visible viewport batch (up to 3 full-HD fronts) when
 * hovering or entering a category—never downloads hidden tabs or full-res backs.
 */
export function preloadCategoryImages(
  category: 'trousers' | 'hoodies' | 'shirts' | 'pair',
  products?: Product[]
) {
  if (
    typeof window === 'undefined' ||
    preloadedCategories.has(category) ||
    isConstrainedNetwork()
  ) {
    return;
  }
  preloadedCategories.add(category);

  if (category === 'pair') {
    const heroPlate =
      typeof window !== 'undefined' && window.innerWidth < 768
        ? HERO_PLATE_WEBP_800
        : HERO_PLATE_WEBP_1376;
    preloadUrls([heroPlate], 1);
    return;
  }

  if (products && products.length > 0) {
    const batchCount = typeof window !== 'undefined' && window.innerWidth >= 1024 ? 4 : 3;
    const firstBatch = products
      .filter((p) => p.category.toLowerCase() === category)
      .slice(0, batchCount)
      .map((p) => p.image);
    preloadUrls(firstBatch, 2);
  }
}

/**
 * Warms ONLY the active item's primary front + immediate back angle (never all
 * colorway variants or distant detail posters), and respects Save-Data / 2G / 3G.
 */
export function preloadProductDetailImages(product: Product) {
  if (typeof window === 'undefined' || !product || isConstrainedNetwork()) return;

  const urls: string[] = [];
  if (product.image) urls.push(product.image);
  const nextAngle = product.backImage || product.frontAndBackImage;
  if (nextAngle) urls.push(nextAngle);

  preloadUrls(urls, 2);
}

/**
 * Preloads ONLY the immediate next item in an active gallery slider (Detail view).
 */
export function preloadNextGalleryItem(
  gallery: { src: string }[],
  activeIndex: number
) {
  if (
    typeof window === 'undefined' ||
    isConstrainedNetwork() ||
    gallery.length <= 1
  ) {
    return;
  }
  const nextIndex = (activeIndex + 1) % gallery.length;
  const nextSrc = gallery[nextIndex]?.src;
  if (nextSrc) {
    preloadUrls([nextSrc], 1);
  }
}

/**
 * Preloads ONLY the immediate next page of desktop showroom carousel cards (small variant).
 */
export function preloadNextCarouselPage(
  products: Product[],
  currentPage: number,
  itemsPerPage: number
) {
  if (
    typeof window === 'undefined' ||
    isConstrainedNetwork() ||
    products.length <= itemsPerPage
  ) {
    return;
  }
  const totalPages = Math.max(1, Math.ceil(products.length / itemsPerPage));
  const nextPage = (currentPage + 1) % totalPages;
  const start = nextPage * itemsPerPage;
  const nextUrls = products
    .slice(start, start + itemsPerPage)
    .map((p) => getSmallVariantUrl(p.image));
  preloadUrls(nextUrls, 2);
}

/**
 * In Pair Studio, warms ONLY the opposite angle (Back/Front) for the two active garments.
 */
export function preloadPairAlternateAngles(top: Product, trouser: Product) {
  if (typeof window === 'undefined' || isConstrainedNetwork()) return;
  const urls: string[] = [];
  if (top.backImage) urls.push(top.backImage);
  if (trouser.backImage) urls.push(trouser.backImage);
  preloadUrls(urls, 2);
}
