import { registerSW } from 'virtual:pwa-register';

let swInitialized = false;

function hasServiceWorkerSupport(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const protocol = window.location?.protocol;
    const hostname = window.location?.hostname;
    const isSecureContextOrLocal =
      window.isSecureContext ||
      protocol === 'https:' ||
      hostname === 'localhost' ||
      hostname === '127.0.0.1';

    if (!isSecureContextOrLocal) return false;
    return 'serviceWorker' in navigator && typeof navigator.serviceWorker?.register === 'function';
  } catch {
    return false;
  }
}

/**
 * Registers the Workbox service worker after the initial viewport has painted,
 * preventing any bandwidth/CPU contention during first load in restricted
 * Instagram / Facebook in-app browsers while caching critical shell & garment
 * assets into the Cache API for instant repeat visits.
 */
export function registerServiceWorker(): void {
  if (swInitialized || !hasServiceWorkerSupport()) return;
  swInitialized = true;

  const startRegistration = () => {
    const idleCallback = (
      window as Window & {
        requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      }
    ).requestIdleCallback;

    const invokeRegister = () => {
      try {
        registerSW({
          immediate: true,
          onRegisteredSW(_swUrl, registration) {
            if (!registration) return;
            window.setInterval(() => {
              try {
                if (navigator.onLine) {
                  void registration.update().catch(() => {});
                }
              } catch {
                // Ignore update poll errors in suspended webviews
              }
            }, 60 * 60 * 1000);
          },
          onRegisterError() {
            // Silently ignore in restricted WKWebView / private browsing contexts
          },
        });
      } catch {
        // Silently ignore if browser container restricts Service Worker execution
      }
    };

    if (typeof idleCallback === 'function') {
      idleCallback(invokeRegister, { timeout: 1500 });
    } else {
      window.setTimeout(invokeRegister, 900);
    }
  };

  if (document.readyState === 'complete') {
    startRegistration();
  } else {
    window.addEventListener('load', startRegistration, { once: true });
  }
}
