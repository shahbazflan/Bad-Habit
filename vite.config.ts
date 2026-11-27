import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ command }) => {
  return {
    define: {
      __ASSET_VERSION__: JSON.stringify(Date.now().toString(36)),
    },
    plugins: [
      react(),
      tailwindcss(),
      ViteImageOptimizer({
        includePublic: true,
        exclude: /(?:Screenshot_|IMG_|BAD-HABIT-|Shop_by_category__|_sm\.webp|_v2\.webp|clean_plate_|size_guide|hero_landing_model_cutout|bad_habit_transparent|og-bad-habit|pwa-|apple-touch-icon|assets\/aistudio\/.*\.(?:png|jpg|jpeg))/i,
        png: {
          compressionLevel: 9,
          palette: false,
          effort: 8,
        },
        webp: {
          quality: 88,
          effort: 5,
        },
        jpeg: {
          quality: 90,
          mozjpeg: true,
        },
        jpg: {
          quality: 90,
          mozjpeg: true,
        },
        cache: true,
      }),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: false,
        includeAssets: [],
        manifest: {
          id: '/',
          name: 'BAD HABIT',
          short_name: 'BAD HABIT',
          description: 'BAD HABIT — Luxury architectural fashion runway and clothing showroom. YOU KNOW YOU WANT IT.',
          start_url: '/',
          scope: '/',
          display: 'standalone',
          orientation: 'portrait',
          theme_color: '#1f486d',
          background_color: '#1f486d',
          categories: ['shopping', 'fashion', 'lifestyle'],
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true,
          ignoreURLParametersMatching: [/^v$/, /^utm_/, /^fbclid$/, /^igshid$/],
          globPatterns: [
            'index.html',
            'assets/index-*.{js,css}',
            'assets/vendor-react-*.js',
            'assets/rolldown-runtime-*.js',
            'assets/workbox-window*.js',
            'assets/MobileCategorySection-*.js',
            'assets/CleanPlatePicture-*.js',
            'assets/SmartImage-*.js',
            'assets/productRouting-*.js',
            'assets/phone-*.js',
            'favicon.svg',
            'apple-touch-icon.png',
            'clean_plate_mobile_hd.webp',
            'clean_plate_thumb.webp',
            'clean_plate_1376.avif',
            'bad_habit_transparent_sm.webp',
            'assets/aistudio/hero_landing_model_cutout.webp',
            'assets/categories/category_*_sm.webp',
          ],
          globIgnores: [
            '**/Screenshot_*',
            '**/IMG_*',
            '**/BAD-HABIT-*',
            '**/Shop_by_category__*',
            '**/hero_mobile_model_cutout*',
            '**/assets/aistudio/*.png',
            '**/assets/email-thumbs/**',
          ],
          navigateFallback: command === 'build' ? 'index.html' : null,
          navigateFallbackDenylist: [/^\/api\//, /\/[^/]+\.[^/]+$/],
          runtimeCaching: [
            {
              urlPattern: ({ url }) => url.origin === self.location.origin && url.pathname.startsWith('/api/'),
              handler: 'NetworkOnly',
            },
            {
              urlPattern: ({ url }) =>
                url.origin === self.location.origin &&
                url.pathname.startsWith('/assets/') &&
                /\.js$/i.test(url.pathname),
              handler: 'CacheFirst',
              options: {
                cacheName: 'bad-habit-lazy-chunks-v1',
                expiration: {
                  maxEntries: 60,
                  maxAgeSeconds: 60 * 60 * 24 * 30,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: ({ url }) =>
                url.origin === self.location.origin &&
                /\.(?:webp|avif|jpg|jpeg|png|svg)$/i.test(url.pathname),
              handler: 'CacheFirst',
              options: {
                cacheName: 'bad-habit-images-v1',
                expiration: {
                  maxEntries: 180,
                  maxAgeSeconds: 60 * 60 * 24 * 30,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'google-fonts-stylesheets',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-webfonts',
                expiration: {
                  maxEntries: 30,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: true,
          type: 'module',
          navigateFallback: '/',
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname || '.', '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    build: {
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
              return 'vendor-react';
            }
            if (id.includes('node_modules/firebase') || id.includes('node_modules/@firebase')) {
              return 'vendor-firebase';
            }
          },
        },
      },
    },
  };
});
