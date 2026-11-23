import { parseNumericPrice } from './pairPricing';
import { safeStorageGet, safeStorageSet } from './runtimeSafety';

export const META_PIXEL_ID = '1876320856885682';
export const STORE_CURRENCY = 'PKR';

const PURCHASED_ORDERS_STORAGE_KEY = 'bad_habit_meta_purchased_orders_v1';
const CONSENT_STORAGE_KEYS = ['bad_habit_cookie_consent', 'cookie_consent', 'cookieConsent'] as const;

type FbqCommand = 'init' | 'track' | 'trackCustom' | 'consent';

interface FbqFunction {
  (command: FbqCommand, ...args: unknown[]): void;
  queue?: unknown[];
  loaded?: boolean;
  version?: string;
}

declare global {
  interface Window {
    fbq?: FbqFunction;
    _fbq?: FbqFunction;
    __bhMetaPixelInitialTracked?: boolean;
    __bhCookieConsent?: boolean | { analytics?: boolean; marketing?: boolean };
  }
}

let lastTrackedPageKey: string | null = null;
let lastTrackedViewContentKey: string | null = null;
const trackedPurchaseOrderIds = new Set<string>();

function loadPersistedPurchasedOrderIds(): Set<string> {
  const combined = new Set<string>(trackedPurchaseOrderIds);
  const storedLocal = safeStorageGet<unknown>(PURCHASED_ORDERS_STORAGE_KEY, []);
  if (Array.isArray(storedLocal)) {
    for (const id of storedLocal) {
      if (typeof id === 'string' && id.trim()) {
        combined.add(id.trim());
      }
    }
  }
  if (typeof window !== 'undefined') {
    try {
      const rawSession = window.sessionStorage.getItem(PURCHASED_ORDERS_STORAGE_KEY);
      if (rawSession) {
        const parsed = JSON.parse(rawSession);
        if (Array.isArray(parsed)) {
          for (const id of parsed) {
            if (typeof id === 'string' && id.trim()) {
              combined.add(id.trim());
            }
          }
        }
      }
    } catch {
      // Ignore storage access errors in restricted browsers
    }
  }
  return combined;
}

function persistPurchasedOrderId(orderRef: string): void {
  const clean = orderRef.trim();
  if (!clean) return;
  trackedPurchaseOrderIds.add(clean);
  const existing = Array.from(loadPersistedPurchasedOrderIds());
  if (!existing.includes(clean)) {
    existing.push(clean);
  }
  const trimmed = existing.slice(-100);
  safeStorageSet(PURCHASED_ORDERS_STORAGE_KEY, trimmed);
  if (typeof window !== 'undefined') {
    try {
      window.sessionStorage.setItem(PURCHASED_ORDERS_STORAGE_KEY, JSON.stringify(trimmed));
    } catch {
      // Ignore storage quota / security errors
    }
  }
}

/**
 * Checks if tracking consent is allowed. Defaults to true when no consent banner
 * has declined marketing/analytics cookies, and respects any explicit rejection flag.
 */
export function hasTrackingConsent(): boolean {
  if (typeof window === 'undefined') return false;

  const globalConsent = window.__bhCookieConsent;
  if (globalConsent === false) return false;
  if (globalConsent && typeof globalConsent === 'object') {
    if (globalConsent.marketing === false || globalConsent.analytics === false) {
      return false;
    }
  }

  for (const key of CONSENT_STORAGE_KEYS) {
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) continue;
      const lower = raw.trim().toLowerCase();
      if (lower === 'false' || lower === 'denied' || lower === 'rejected' || lower === 'necessary') {
        return false;
      }
      if (lower.startsWith('{')) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          if (parsed.marketing === false || parsed.analytics === false || parsed.consent === false) {
            return false;
          }
        }
      }
    } catch {
      // Ignore malformed/restricted storage entries
    }
  }

  return true;
}

export function setMetaPixelConsent(granted: boolean): void {
  if (typeof window === 'undefined' || typeof window.fbq !== 'function') return;
  window.fbq('consent', granted ? 'grant' : 'revoke');
}

function callFbq(
  command: 'track' | 'trackCustom',
  eventName: string,
  params?: Record<string, unknown>,
  options?: { eventID?: string }
): void {
  if (typeof window === 'undefined' || typeof window.fbq !== 'function') return;
  if (!hasTrackingConsent()) return;

  if (params && options) {
    window.fbq(command, eventName, params, options);
  } else if (params) {
    window.fbq(command, eventName, params);
  } else {
    window.fbq(command, eventName);
  }
}

/**
 * Tracks one Meta Pixel PageView per genuine client-side view transition.
 * Consumes the initial PageView already dispatched by index.html on first load
 * so PageView is never duplicated on mount.
 */
export function trackPageView(pageKey: string): void {
  if (!pageKey || typeof window === 'undefined') return;

  if (window.__bhMetaPixelInitialTracked) {
    window.__bhMetaPixelInitialTracked = false;
    lastTrackedPageKey = pageKey;
    return;
  }

  if (lastTrackedPageKey === pageKey) {
    return;
  }

  lastTrackedPageKey = pageKey;
  callFbq('track', 'PageView');
}

/**
 * Tracks ViewContent when a product detail view is opened or switched to another article.
 */
export function trackViewContent(product: {
  id: string;
  name: string;
  category: string;
  price: number | string;
}): void {
  if (!product?.id) return;
  const viewKey = product.id;
  if (lastTrackedViewContentKey === viewKey) {
    return;
  }
  lastTrackedViewContentKey = viewKey;

  const numericValue =
    typeof product.price === 'number'
      ? Math.max(0, product.price)
      : parseNumericPrice(String(product.price || '0'));

  callFbq('track', 'ViewContent', {
    content_type: 'product',
    content_ids: [product.id],
    content_name: product.name,
    content_category: product.category,
    value: numericValue,
    currency: STORE_CURRENCY,
  });
}

export function clearLastViewContentKey(): void {
  lastTrackedViewContentKey = null;
}

export interface PixelCartItemInput {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

/**
 * Tracks AddToCart strictly after an item or pair is successfully added to the cart.
 */
export function trackAddToCart(
  addedItems: PixelCartItemInput[],
  overrideTotalValue?: number
): void {
  const validItems = addedItems.filter((it) => it?.productId && Number(it.quantity) > 0);
  if (validItems.length === 0) return;

  const contentIds = validItems.map((it) => String(it.productId));
  const contents = validItems.map((it) => ({
    id: String(it.productId),
    quantity: Math.max(1, Number(it.quantity) || 1),
    item_price: Math.max(0, Number(it.price) || 0),
  }));
  const numItems = contents.reduce((sum, it) => sum + it.quantity, 0);
  const computedValue =
    typeof overrideTotalValue === 'number' && Number.isFinite(overrideTotalValue)
      ? Math.max(0, Math.round(overrideTotalValue))
      : contents.reduce((sum, it) => sum + it.item_price * it.quantity, 0);

  callFbq('track', 'AddToCart', {
    content_type: 'product',
    content_ids: contentIds,
    content_name: validItems.map((it) => it.name).join(' + '),
    contents,
    num_items: numItems,
    value: computedValue,
    currency: STORE_CURRENCY,
  });
}

/**
 * Tracks InitiateCheckout once per checkout open using live bag contents and subtotal.
 */
export function trackInitiateCheckout(
  bagItems: Array<{ productId: string; quantity: number; price: number }>,
  subtotalValue: number
): void {
  const validItems = bagItems.filter((it) => it?.productId && Number(it.quantity) > 0);
  if (validItems.length === 0) return;

  const contentIds = validItems.map((it) => String(it.productId));
  const contents = validItems.map((it) => ({
    id: String(it.productId),
    quantity: Math.max(1, Number(it.quantity) || 1),
    item_price: Math.max(0, Number(it.price) || 0),
  }));
  const numItems = contents.reduce((sum, it) => sum + it.quantity, 0);

  callFbq('track', 'InitiateCheckout', {
    content_type: 'product',
    content_ids: contentIds,
    contents,
    num_items: numItems,
    value: Math.max(0, Math.round(Number(subtotalValue) || 0)),
    currency: STORE_CURRENCY,
  });
}

export interface PixelConfirmedOrderInput {
  id?: string;
  orderNumber: string;
  items: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
  }>;
  pricing?: {
    total?: number;
    subtotal?: number;
    currency?: string;
  };
}

/**
 * Tracks Purchase ONLY after backend order creation is confirmed,
 * using the server-returned order number, items, total, and currency,
 * with strict multi-layer deduplication per order.
 */
export function trackPurchase(
  order: PixelConfirmedOrderInput,
  options?: { duplicatePrevented?: boolean }
): boolean {
  if (!order?.orderNumber || options?.duplicatePrevented) {
    return false;
  }
  if (!hasTrackingConsent()) {
    return false;
  }

  const orderNumber = String(order.orderNumber).trim();
  const orderId = order.id ? String(order.id).trim() : '';
  const alreadyTracked = loadPersistedPurchasedOrderIds();

  if (alreadyTracked.has(orderNumber) || (orderId && alreadyTracked.has(orderId))) {
    return false;
  }

  const validItems = Array.isArray(order.items)
    ? order.items.filter((it) => it?.productId && Number(it.quantity) > 0)
    : [];
  const contentIds = validItems.map((it) => String(it.productId));
  const contents = validItems.map((it) => ({
    id: String(it.productId),
    quantity: Math.max(1, Number(it.quantity) || 1),
    item_price: Math.max(0, Number(it.unitPrice) || 0),
  }));
  const numItems = contents.reduce((sum, it) => sum + it.quantity, 0);
  const confirmedValue = Math.max(
    0,
    Number(order.pricing?.total ?? order.pricing?.subtotal ?? 0) || 0
  );
  const currency = order.pricing?.currency || STORE_CURRENCY;

  persistPurchasedOrderId(orderNumber);
  if (orderId) {
    persistPurchasedOrderId(orderId);
  }

  callFbq(
    'track',
    'Purchase',
    {
      content_type: 'product',
      content_ids: contentIds,
      contents,
      num_items: numItems,
      value: confirmedValue,
      currency,
      order_id: orderNumber,
    },
    { eventID: orderNumber }
  );

  return true;
}
