import { PRODUCTS, Product } from '../data/products';
import type { CategoryId } from '../components/MobileCategorySection';

export function slugifyProductName(name: string): string {
  return String(name || '')
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Generates a readable lowercase hyphenated URL slug for every product.
 * Trousers whose base name omits "trousers"/"pants" (e.g. "Midnight Blue")
 * resolve to "<name>-trousers" (e.g. "midnight-blue-trousers").
 */
export function getProductSlug(product: Pick<Product, 'name' | 'category'>): string {
  const base = slugifyProductName(product.name);
  if (
    product.category === 'Trousers' &&
    !base.endsWith('-trousers') &&
    !base.endsWith('-pants')
  ) {
    return `${base}-trousers`;
  }
  return base;
}

export function getProductPath(product: Pick<Product, 'name' | 'category'>): string {
  return `/${getProductSlug(product)}`;
}

export function getCategoryIdForProduct(product: Pick<Product, 'category'>): CategoryId {
  if (product.category === 'Hoodies') return 'hoodies';
  if (product.category === 'Shirts') return 'shirts';
  return 'trousers';
}

export function getShowroomSectionForProduct(
  product: Pick<Product, 'category'>
): 'trousers' | 'hoodies' | 'shirts' {
  if (product.category === 'Hoodies') return 'hoodies';
  if (product.category === 'Shirts') return 'shirts';
  return 'trousers';
}

const PRODUCT_BY_SLUG = new Map<string, Product>();

for (const product of PRODUCTS) {
  const canonicalSlug = getProductSlug(product);
  PRODUCT_BY_SLUG.set(canonicalSlug, product);

  const plainSlug = slugifyProductName(product.name);
  if (plainSlug && !PRODUCT_BY_SLUG.has(plainSlug)) {
    PRODUCT_BY_SLUG.set(plainSlug, product);
  }
}

// Legacy slug alias for renamed Washed Umber Hoodie -> Chocolate Hoodie (BH-H08)
const chocolateHoodie = PRODUCTS.find((p) => p.id === 'BH-H08');
if (chocolateHoodie) {
  PRODUCT_BY_SLUG.set('washed-umber-hoodie', chocolateHoodie);
}

export function findProductByPath(pathname?: string): Product | null {
  const raw =
    typeof pathname === 'string'
      ? pathname
      : typeof window !== 'undefined'
      ? window.location.pathname
      : '';
  if (!raw) return null;

  const withoutQuery = raw.split('?')[0].split('#')[0];
  let clean = withoutQuery.replace(/^\/+|\/+$/g, '').toLowerCase();
  if (!clean) return null;

  if (clean.startsWith('products/')) {
    clean = clean.slice('products/'.length);
  } else if (clean.startsWith('product/')) {
    clean = clean.slice('product/'.length);
  }

  return PRODUCT_BY_SLUG.get(clean) || null;
}

export function pushProductUrl(
  product: Product,
  stateExtra?: Record<string, unknown>
): void {
  if (typeof window === 'undefined') return;
  try {
    const targetPath = getProductPath(product);
    const nextState = {
      ...(stateExtra || {}),
      productId: product.id,
      productSlug: getProductSlug(product),
    };
    if (window.location.pathname !== targetPath) {
      window.history.pushState(nextState, '', targetPath);
    } else {
      window.history.replaceState(nextState, '', targetPath);
    }
  } catch {
    // Ignore history API errors in restricted embedded webviews
  }
}

export function replaceProductUrl(
  product: Product,
  stateExtra?: Record<string, unknown>
): void {
  if (typeof window === 'undefined') return;
  try {
    const targetPath = getProductPath(product);
    window.history.replaceState(
      {
        ...(stateExtra || {}),
        productId: product.id,
        productSlug: getProductSlug(product),
      },
      '',
      targetPath
    );
  } catch {
    // Ignore history API errors in restricted embedded webviews
  }
}

export function pushHomeUrl(stateExtra?: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;
  try {
    const nextState = {
      ...(stateExtra || {}),
      productId: null,
      productSlug: null,
    };
    if (window.location.pathname !== '/') {
      window.history.pushState(nextState, '', '/');
    } else if (stateExtra) {
      window.history.pushState(nextState, '', '/');
    }
  } catch {
    // Ignore history API errors in restricted embedded webviews
  }
}
