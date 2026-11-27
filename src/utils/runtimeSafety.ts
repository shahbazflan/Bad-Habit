import { normalizePhoneToE164 } from './phone';
import type { CartItem } from '../context/CartContext';
import type { MemberProfile, WishlistItem } from '../context/MemberContext';

let globalHandlersInitialized = false;

const IGNORED_ERROR_PATTERNS = [
  'ResizeObserver loop limit exceeded',
  'ResizeObserver loop completed with undelivered notifications',
];

function shouldIgnoreErrorMessage(msg: string): boolean {
  return IGNORED_ERROR_PATTERNS.some((pattern) => msg.includes(pattern));
}

function isBrowserExtensionSource(source: string): boolean {
  return /^(?:chrome-extension|moz-extension|safari-extension|safari-web-extension):\/\//i.test(source) ||
    /(?:chrome-extension|moz-extension|safari-extension|safari-web-extension):\/\//i.test(source);
}

export function initGlobalErrorHandlers(): void {
  if (globalHandlersInitialized || typeof window === 'undefined') return;
  globalHandlersInitialized = true;

  window.addEventListener('error', (event: ErrorEvent) => {
    const filename = String(event?.filename || '');
    const message = String(event?.message || event?.error?.message || '');
    if (isBrowserExtensionSource(filename) || shouldIgnoreErrorMessage(message)) {
      event.preventDefault();
      return;
    }
    console.error('[BAD HABIT] Global error captured:', {
      message: message || 'Unknown error',
      filename: event?.filename,
      lineno: event?.lineno,
      colno: event?.colno,
    });
  });

  window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    const reason = event?.reason;
    const message =
      reason instanceof Error ? reason.message : typeof reason === 'string' ? reason : 'Unhandled promise rejection';
    const stack = reason instanceof Error ? String(reason.stack || '') : '';

    if (isBrowserExtensionSource(stack) || shouldIgnoreErrorMessage(message)) {
      event.preventDefault();
      return;
    }

    // Prevent aborted fetch errors or benign WebSocket HMR closes from crashing runtime
    if (
      (reason instanceof DOMException && reason.name === 'AbortError') ||
      (reason instanceof Error && reason.name === 'AbortError')
    ) {
      event.preventDefault();
      return;
    }

    console.error('[BAD HABIT] Unhandled promise rejection captured:', message);
    event.preventDefault();
  });

  window.addEventListener('vite:preloadError', (event) => {
    try {
      const key = 'bad_habit_preload_retry_ts';
      const now = Date.now();
      const lastRetry = Number(window.sessionStorage.getItem(key) || '0');
      if (!lastRetry || now - lastRetry > 15000) {
        window.sessionStorage.setItem(key, String(now));
        event.preventDefault();
        window.location.reload();
      }
    } catch {
      // Ignore storage access restrictions in private webviews
    }
  });
}

export function safeStorageGet<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed === null || parsed === undefined ? fallback : (parsed as T);
  } catch {
    return fallback;
  }
}

export function safeStorageSet(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota/private mode errors
  }
}

export function safeStorageRemove(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore storage errors
  }
}

const VALID_SIZES = new Set(['S', 'M', 'L', 'XL']);

export function sanitizeCartItems(raw: unknown): CartItem[] {
  if (!Array.isArray(raw)) return [];
  const result: CartItem[] = [];

  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') continue;
    const item = entry as Record<string, unknown>;
    const productId = typeof item.productId === 'string' ? item.productId.trim() : '';
    const name = typeof item.name === 'string' ? item.name.trim() : '';
    const size = typeof item.size === 'string' && VALID_SIZES.has(item.size) ? (item.size as CartItem['size']) : 'M';
    const price = Number(item.price);
    const quantity = Math.min(Math.max(1, Math.floor(Number(item.quantity) || 1)), 5);
    const image = typeof item.image === 'string' ? item.image.trim() : '';
    const formattedPrice =
      typeof item.formattedPrice === 'string' && item.formattedPrice.trim()
        ? item.formattedPrice
        : Number.isFinite(price) && price > 0
        ? `PKR ${price.toLocaleString()}`
        : '';

    if (!productId || !name || !Number.isFinite(price) || price <= 0 || !image) {
      continue;
    }

    result.push({
      productId,
      name,
      price,
      formattedPrice,
      size,
      quantity,
      image,
    });
  }

  return result;
}

export function sanitizeWishlistItems(raw: unknown): WishlistItem[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const result: WishlistItem[] = [];

  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') continue;
    const item = entry as Record<string, unknown>;
    const productId = typeof item.productId === 'string' ? item.productId.trim() : '';
    if (!productId || seen.has(productId)) continue;
    seen.add(productId);

    result.push({
      productId,
      name: typeof item.name === 'string' && item.name.trim() ? item.name.trim() : productId,
      price: typeof item.price === 'string' ? item.price : '',
      image: typeof item.image === 'string' ? item.image : '',
      category: typeof item.category === 'string' ? item.category : 'Collection',
      addedAt: typeof item.addedAt === 'string' ? item.addedAt : new Date().toISOString(),
    });
  }

  return result;
}

export function sanitizeMemberProfile(raw: unknown): MemberProfile | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  const id = typeof obj.id === 'string' ? obj.id.trim() : '';
  const email = typeof obj.email === 'string' ? obj.email.trim().toLowerCase() : '';
  const phone = normalizePhoneToE164(typeof obj.phone === 'string' ? obj.phone : '');
  if (!id || !email || !phone) return null;

  const orderCount = Math.max(0, Math.floor(Number(obj.orderCount) || 0));

  return {
    id,
    email,
    phone,
    displayName: typeof obj.displayName === 'string' ? obj.displayName.trim() : '',
    promoCode: typeof obj.promoCode === 'string' && obj.promoCode.trim() ? obj.promoCode.trim() : 'BH-DETECTED',
    orderCount,
    firstOrderDiscountUsed: Boolean(obj.firstOrderDiscountUsed) || orderCount > 0,
    firstOrderNumber: typeof obj.firstOrderNumber === 'string' ? obj.firstOrderNumber : null,
    wishlist: sanitizeWishlistItems(obj.wishlist),
    createdAt: typeof obj.createdAt === 'string' ? obj.createdAt : new Date().toISOString(),
    updatedAt: typeof obj.updatedAt === 'string' ? obj.updatedAt : new Date().toISOString(),
  };
}
