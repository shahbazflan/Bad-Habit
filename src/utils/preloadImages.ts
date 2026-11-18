import {
  PRODUCTS,
  Product,
  MAIN_COLLECTION,
  SHIRT_PRODUCTS,
  getColorVariants,
} from '../data/products';

let initialPreloaded = false;
const preloadedCategories = new Set<string>();
const requestedUrls = new Set<string>();

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

function preloadUrls(urls: string[], concurrency = 4) {
  if (typeof window === 'undefined' || urls.length === 0) return;

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
 * Gently warm category covers and Make a Pair poster cutouts right after
 * initial hero paint so scrolling into categories feels instantaneous.
 */
export function preloadGarmentImages() {
  if (typeof window === 'undefined' || initialPreloaded) return;
  initialPreloaded = true;

  const posterShirt = SHIRT_PRODUCTS.find((p) => p.id === 'BH-S05') || SHIRT_PRODUCTS[5];
  const posterTrouser = MAIN_COLLECTION.find((p) => p.id === 'BH-T10') || MAIN_COLLECTION[4];

  const startWarmup = () => {
    const categoryCovers = [
      '/assets/categories/category_trousers_hd.webp',
      '/assets/categories/category_shirts_v3.webp',
      '/assets/categories/category_hoodies_desktop.webp',
    ];
    preloadUrls(
      [
        ...categoryCovers,
        posterShirt?.image || '',
        posterTrouser?.image || '',
      ],
      4
    );
  };

  const schedule = () => {
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(startWarmup, { timeout: 400 });
    } else {
      setTimeout(startWarmup, 150);
    }
  };

  if (document.readyState === 'complete') {
    schedule();
  } else {
    window.addEventListener('load', schedule, { once: true });
  }
}

/**
 * On-demand category warmup when user hovers, touches, or enters a category.
 * Prioritizes front cutouts first so product grids populate instantaneously.
 */
export function preloadCategoryImages(
  category: 'trousers' | 'hoodies' | 'shirts' | 'pair'
) {
  if (typeof window === 'undefined' || preloadedCategories.has(category)) return;
  preloadedCategories.add(category);

  const frontUrls: string[] = [];
  const backUrls: string[] = [];

  PRODUCTS.forEach((product) => {
    const match =
      category === 'pair'
        ? product.category === 'Shirts' ||
          product.category === 'Trousers' ||
          product.category === 'Hoodies'
        : product.category.toLowerCase() === category;
    if (match) {
      if (product.image) frontUrls.push(product.image);
      if (product.backImage) backUrls.push(product.backImage);
    }
  });

  if (category === 'trousers') {
    backUrls.push('/assets/size_guides/trousers_size_guide.webp');
  } else if (category === 'shirts') {
    backUrls.push('/assets/size_guides/shirts_size_guide.webp');
  }

  preloadUrls([...frontUrls, ...backUrls], 4);
}

/**
 * Immediately warms all gallery angles, colorway swatches, and size guide
 * for an individual article on hover/touch or article open.
 */
export function preloadProductDetailImages(product: Product) {
  if (typeof window === 'undefined' || !product) return;

  const urls: string[] = [];
  if (product.image) urls.push(product.image);
  if (product.backImage) urls.push(product.backImage);
  if (product.frontAndBackImage) urls.push(product.frontAndBackImage);
  if (product.detailImages && product.detailImages.length > 0) {
    urls.push(...product.detailImages);
  }

  const variants = getColorVariants(product);
  for (const variant of variants) {
    if (variant.image) urls.push(variant.image);
    if (variant.backImage) urls.push(variant.backImage);
  }

  if (product.category === 'Trousers') {
    urls.push('/assets/size_guides/trousers_size_guide.webp');
  } else if (product.category === 'Shirts') {
    urls.push('/assets/size_guides/shirts_size_guide.webp');
  }

  preloadUrls(urls, 4);
}
