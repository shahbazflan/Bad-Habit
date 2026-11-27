import { lazy, ComponentType } from 'react';

/**
 * Retries transient dynamic import failures (common on cellular handoffs and
 * social media in-app browsers) up to `maxRetries` times with short backoff.
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  importer: () => Promise<{ default: T }>,
  maxRetries = 2
) {
  return lazy(async () => {
    let lastError: unknown;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await importer();
      } catch (err) {
        lastError = err;
        if (attempt < maxRetries) {
          const delayMs = attempt === 0 ? 300 : 850;
          await new Promise((resolve) => globalThis.setTimeout(resolve, delayMs));
        }
      }
    }
    throw lastError;
  });
}
