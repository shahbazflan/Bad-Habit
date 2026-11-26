import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer';

export default defineConfig(() => {
  return {
    define: {
      __ASSET_VERSION__: JSON.stringify(Date.now().toString(36)),
    },
    plugins: [
      react(),
      tailwindcss(),
      ViteImageOptimizer({
        includePublic: true,
        exclude: /(?:Screenshot_|IMG_|BAD-HABIT-|Shop_by_category__|_sm\.webp|_v2\.webp|clean_plate_|size_guide|hero_landing_model_cutout|bad_habit_transparent|og-bad-habit|assets\/aistudio\/.*\.(?:png|jpg|jpeg))/i,
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
