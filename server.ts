import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createApiApp } from './api/index.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ProductSeoRecord {
  id: string;
  name: string;
  category: 'Trousers' | 'Hoodies' | 'Shirts';
  price: string;
  numericPrice: string;
  image: string;
  description: string;
}

const PRODUCT_SEO_LIST: ProductSeoRecord[] = [
  { id: 'BH-T01', name: 'Midnight Blue', category: 'Trousers', price: 'PKR 5,799', numericPrice: '5799', image: '/assets/trousers_v2/midnight_blue_front_only_v2.webp', description: 'Midnight Blue — Pure washed architectural linen trousers by BAD HABIT. PKR 5,799.' },
  { id: 'BH-T06', name: 'Ivory Trousers', category: 'Trousers', price: 'PKR 5,799', numericPrice: '5799', image: '/assets/trousers_v2/ivory_trousers_front_only_v2.webp', description: 'Ivory Trousers — Natural textured slub linen blend trousers by BAD HABIT. PKR 5,799.' },
  { id: 'BH-T07', name: 'Sage Trousers', category: 'Trousers', price: 'PKR 5,799', numericPrice: '5799', image: '/assets/trousers_v2/sage_trousers_front_only_v2.webp', description: 'Sage Trousers — Garment-dyed cotton-linen weave trousers by BAD HABIT. PKR 5,799.' },
  { id: 'BH-T08', name: 'Stone Trousers', category: 'Trousers', price: 'PKR 5,799', numericPrice: '5799', image: '/assets/trousers_v2/stone_trousers_front_only_v2.webp', description: 'Stone Trousers — Earth-tone washed linen architectural trousers by BAD HABIT. PKR 5,799.' },
  { id: 'BH-T10', name: 'Classic Brown Trousers', category: 'Trousers', price: 'PKR 5,799', numericPrice: '5799', image: '/assets/trousers_v2/classic_brown_front_only_v2.webp', description: 'Classic Brown Trousers — Garment-washed cotton twill by BAD HABIT. PKR 5,799.' },
  { id: 'BH-T09', name: 'Deep Charcoal Balloon Pants', category: 'Trousers', price: 'PKR 7,999', numericPrice: '7999', image: '/assets/trousers_v2/deep_charcoal_front_only_v2.webp', description: 'Deep Charcoal Balloon Pants — Volumetric structured twill by BAD HABIT. PKR 7,999.' },
  { id: 'BH-T05', name: 'Ash Baggy', category: 'Trousers', price: 'PKR 7,999', numericPrice: '7999', image: '/assets/trousers_v2/ash_baggy_front_only_v2.webp', description: 'Ash Baggy Trousers — Wide architectural drape by BAD HABIT. PKR 7,999.' },
  { id: 'BH-T11', name: 'Chocolate Balloon Pants', category: 'Trousers', price: 'PKR 7,999', numericPrice: '7999', image: '/assets/trousers_v2/chocolate_balloon_front_only_v2.webp', description: 'Chocolate Balloon Pants — Volumetric structured heavy-loopback cotton by BAD HABIT. PKR 7,999.' },
  { id: 'BH-H01', name: 'Storm Blue Sweatshirt', category: 'Hoodies', price: 'PKR 4,499', numericPrice: '4499', image: '/assets/hoodies/storm_blue_front_only_v2.webp', description: 'Storm Blue Sweatshirt — Heavyweight loopback French terry by BAD HABIT. PKR 4,499.' },
  { id: 'BH-H02', name: 'Onyx Hoodie', category: 'Hoodies', price: 'PKR 4,499', numericPrice: '4499', image: '/assets/hoodies/onyx_hoodie_front_only_v2.webp', description: 'Onyx Hoodie — 500 GSM heavyweight brushed fleece by BAD HABIT. PKR 4,499.' },
  { id: 'BH-H03', name: 'Ivory Sweatshirt', category: 'Hoodies', price: 'PKR 4,499', numericPrice: '4499', image: '/assets/hoodies/ivory_sweatshirt_front_only_v2.webp', description: 'Ivory Sweatshirt — Heavyweight fleece in natural ivory by BAD HABIT. PKR 4,499.' },
  { id: 'BH-H04', name: 'Dusty Rose Hoodie', category: 'Hoodies', price: 'PKR 4,499', numericPrice: '4499', image: '/assets/hoodies/dusty_rose_hoodie_front_only_v2.webp', description: 'Dusty Rose Hoodie — Peach-finish brushed cotton by BAD HABIT. PKR 4,499.' },
  { id: 'BH-H05', name: 'Off-White Hoodie', category: 'Hoodies', price: 'PKR 4,499', numericPrice: '4499', image: '/assets/hoodies/off_white_hoodie_front_only_v2.webp', description: 'Off-White Hoodie — 480 GSM heavyweight fleece by BAD HABIT. PKR 4,499.' },
  { id: 'BH-H06', name: 'Charcoal Raglan Hoodie', category: 'Hoodies', price: 'PKR 4,499', numericPrice: '4499', image: '/assets/hoodies/charcoal_raglan_hoodie_front_v2.webp', description: 'Charcoal Raglan Hoodie — 500 GSM acid-washed French terry by BAD HABIT. PKR 4,499.' },
  { id: 'BH-H07', name: 'Slate Grey Sweatshirt', category: 'Hoodies', price: 'PKR 4,499', numericPrice: '4499', image: '/assets/hoodies/slate_grey_sweatshirt_front_v2.webp', description: 'Slate Grey Sweatshirt — Pigment-dyed heavyweight cotton by BAD HABIT. PKR 4,499.' },
  { id: 'BH-H08', name: 'Chocolate Hoodie', category: 'Hoodies', price: 'PKR 4,499', numericPrice: '4499', image: '/assets/hoodies/washed_umber_hoodie_front_v2.webp', description: 'Chocolate Hoodie — 480 GSM enzyme-washed brushed cotton fleece by BAD HABIT. PKR 4,499.' },
  { id: 'BH-H09', name: 'Oatmeal Hoodie', category: 'Hoodies', price: 'PKR 4,499', numericPrice: '4499', image: '/assets/hoodies/oatmeal_hoodie_front_v2.webp', description: 'Oatmeal Hoodie — 500 GSM heavyweight brushed fleece by BAD HABIT. PKR 4,499.' },
  { id: 'BH-S05', name: 'Magnum Shirt', category: 'Shirts', price: 'PKR 4,249', numericPrice: '4249', image: '/assets/shirts/magnum_boxy_front_v2.webp', description: 'Magnum Shirt (Rough Cuban collar) — Matte poplin by BAD HABIT. PKR 4,249.' },
  { id: 'BH-S06', name: 'Rough Shirt', category: 'Shirts', price: 'PKR 4,249', numericPrice: '4249', image: '/assets/shirts/rough_boxy_front_v2.webp', description: 'Rough Shirt (Rough Cuban collar) — Textured European poplin by BAD HABIT. PKR 4,249.' },
  { id: 'BH-S04', name: 'Maroon Shirt', category: 'Shirts', price: 'PKR 4,249', numericPrice: '4249', image: '/assets/shirts/maroon_boxy_front_v2.webp', description: 'Maroon Shirt (Rough Cuban collar) — Garment-washed poplin by BAD HABIT. PKR 4,249.' },
  { id: 'BH-S03', name: 'Espresso Shirt', category: 'Shirts', price: 'PKR 4,249', numericPrice: '4249', image: '/assets/shirts/espresso_boxy_front_v2.webp', description: 'Espresso Shirt (Rough Cuban collar) — Washed mulberry silk blend by BAD HABIT. PKR 4,249.' },
  { id: 'BH-S02', name: 'Cream Shirt', category: 'Shirts', price: 'PKR 4,249', numericPrice: '4249', image: '/assets/shirts/cream_boxy_front_v2.webp', description: 'Cream Shirt (Rough Cuban collar) — Textured slub cotton by BAD HABIT. PKR 4,249.' },
  { id: 'BH-S01', name: 'Foam Shirt', category: 'Shirts', price: 'PKR 4,249', numericPrice: '4249', image: '/assets/shirts/foam_boxy_front_v2.webp', description: 'Foam Shirt (Rough Cuban collar) — European poplin cotton by BAD HABIT. PKR 4,249.' },
];

const PRODUCT_BY_SLUG = new Map<string, ProductSeoRecord>();
for (const item of PRODUCT_SEO_LIST) {
  const plainSlug = item.name.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const canonicalSlug =
    item.category === 'Trousers' && !plainSlug.endsWith('-trousers') && !plainSlug.endsWith('-pants')
      ? `${plainSlug}-trousers`
      : plainSlug;
  PRODUCT_BY_SLUG.set(canonicalSlug, item);
  if (!PRODUCT_BY_SLUG.has(plainSlug)) {
    PRODUCT_BY_SLUG.set(plainSlug, item);
  }
  if (item.id === 'BH-H08') {
    PRODUCT_BY_SLUG.set('washed-umber-hoodie', item);
  }
}

function escapeHtmlAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function resolveProductFromUrlPath(reqUrl: string): ProductSeoRecord | null {
  const withoutQuery = (reqUrl || '/').split('?')[0].split('#')[0];
  let clean = withoutQuery.replace(/^\/+|\/+$/g, '').toLowerCase();
  if (!clean) return null;
  if (clean.startsWith('products/')) clean = clean.slice('products/'.length);
  else if (clean.startsWith('product/')) clean = clean.slice('product/'.length);
  return PRODUCT_BY_SLUG.get(clean) || null;
}

function getRequestOrigin(req: express.Request): string {
  const rawHost = req.get('x-forwarded-host') || req.get('host');
  const host = rawHost ? rawHost.split(',')[0].trim() : '';
  if (!host) return 'https://storebadhabit.com';
  const rawProto = req.get('x-forwarded-proto') || req.protocol || 'https';
  const proto = rawProto.split(',')[0].trim() || 'https';
  return `${proto}://${host}`;
}

function injectSocialAndPreloadMeta(html: string, req: express.Request): string {
  const origin = getRequestOrigin(req);
  const reqPath = (req.originalUrl || '/').split('?')[0] || '/';
  const ogUrl = `${origin}${reqPath}`;
  const ogImageUrl = `${origin}/og-bad-habit.jpg`;
  const product = resolveProductFromUrlPath(reqPath);

  let out = html
    .replace(/https:\/\/storebadhabit\.com\/og-bad-habit\.jpg/g, escapeHtmlAttr(ogImageUrl))
    .replace(/https:\/\/storebadhabit\.com\//g, escapeHtmlAttr(ogUrl));

  if (product) {
    const title = `${product.name} — BAD HABIT`;
    const safeTitle = escapeHtmlAttr(title);
    const safeDesc = escapeHtmlAttr(product.description);
    const productImagePreload = [
      `<link rel="preload" as="image" type="image/webp" href="/clean_plate_mobile_hd.webp?v=opt30" media="(max-width: 767px)" fetchpriority="high" />`,
      `<link rel="preload" as="image" type="image/avif" href="/clean_plate_1376.avif?v=opt26" media="(min-width: 768px)" fetchpriority="high" />`,
      `<link rel="preload" as="image" type="image/webp" href="${escapeHtmlAttr(product.image)}" fetchpriority="high" />`,
    ].join('\n    ');

    out = out
      .replace(/<title>.*?<\/title>/i, `<title>${safeTitle}</title>`)
      .replace(/(<meta\s+name="description"\s+content=")[^"]*(")/i, `$1${safeDesc}$2`)
      .replace(/(<meta\s+property="og:title"\s+content=")[^"]*(")/i, `$1${safeTitle}$2`)
      .replace(/(<meta\s+property="og:description"\s+content=")[^"]*(")/i, `$1${safeDesc}$2`)
      .replace(/(<meta\s+property="og:type"\s+content=")[^"]*(")/i, `$1product$2`)
      .replace(/(<meta\s+name="twitter:title"\s+content=")[^"]*(")/i, `$1${safeTitle}$2`)
      .replace(/(<meta\s+name="twitter:description"\s+content=")[^"]*(")/i, `$1${safeDesc}$2`)
      .replace(
        /<!-- HERO_PRELOAD_START -->[\s\S]*?<!-- HERO_PRELOAD_END -->/,
        `${productImagePreload}\n    <meta property="product:price:amount" content="${product.numericPrice}" />\n    <meta property="product:price:currency" content="PKR" />`
      );
  }

  return out;
}

async function startServer() {
  const app = createApiApp();
  app.disable('x-powered-by');
  const isProd = process.env.NODE_ENV === 'production';

  // Return clean 204 for legacy browser icon probes when no binary .ico/.png exists
  app.get(['/favicon.ico', '/apple-touch-icon.png', '/apple-touch-icon-precomposed.png'], (req, res) => {
    const publicCandidate = path.join(__dirname, 'public', path.basename(req.path));
    if (fs.existsSync(publicCandidate)) {
      return res.sendFile(publicCandidate);
    }
    return res.status(204).end();
  });

  // Parse CLI flags (--port, --host) passed by dev runner (e.g., npm run dev --port 3000 --host 0.0.0.0)
  const args = process.argv.slice(2);
  let cliPort: number | null = null;
  let cliHost: string = '0.0.0.0';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--port' && args[i + 1]) {
      cliPort = Number(args[i + 1]);
      i++;
    } else if (args[i] === '--host' && args[i + 1]) {
      cliHost = args[i + 1];
      i++;
    }
  }

  // In development, prioritize CLI --port or default to 3000 (ignoring ambient Cloud Run PORT=8080)
  // In production, prioritize process.env.PORT
  const PORT = cliPort || (isProd ? (Number(process.env.PORT) || 3000) : 3000);
  const HOST = cliHost || '0.0.0.0';

  // Bind HTTP listener immediately so container startup probes on port 3000 succeed cleanly
  const server = app.listen(PORT, HOST, () => {
    console.log(`BAD HABIT Server listening on http://${HOST}:${PORT}`);
  });

  server.on('error', (err: any) => {
    console.error(`BAD HABIT Server listen error on ${HOST}:${PORT}:`, err);
    process.exit(1);
  });

  // Frontend Integration (Vite in development, static build in production)
  if (!isProd) {
    // Fast cache headers for public image assets in dev before vite.middlewares
    app.use(
      '/assets',
      express.static(path.join(__dirname, 'public', 'assets'), {
        maxAge: '10m',
        setHeaders: (res, filePath) => {
          res.setHeader('Cache-Control', 'public, max-age=600, stale-while-revalidate=3600');
          if (filePath.endsWith('IVORY_BOXY_front_png_8c2431ce')) {
            res.setHeader('Content-Type', 'image/png');
          }
        },
      })
    );

    app.use((req, res, next) => {
      if (/^\/(?:clean_plate|bad_habit_transparent|og-bad-habit)[^/]*\.(?:avif|webp|jpg|jpeg|png)$/i.test(req.path)) {
        const candidate = path.join(__dirname, 'public', path.basename(req.path));
        if (fs.existsSync(candidate)) {
          res.setHeader('Cache-Control', 'public, max-age=600, stale-while-revalidate=3600');
          return res.sendFile(candidate);
        }
      }
      next();
    });

    const viteReady = import('vite')
      .then(({ createServer: createViteServer }) =>
        createViteServer({
          server: {
            middlewareMode: true,
            hmr: false,
          },
          appType: 'custom',
        })
      )
      .catch((err) => {
        console.error('Failed to initialize Vite dev server:', err);
        process.exit(1);
      });

    app.use(async (req, res, next) => {
      try {
        const vite = await viteReady;
        vite.middlewares(req, res, next);
      } catch (e) {
        next(e);
      }
    });

    app.use(
      express.static(path.join(__dirname, 'public'), {
        maxAge: '10m',
        setHeaders: (res) => {
          res.setHeader('Cache-Control', 'public, max-age=600, stale-while-revalidate=3600');
        },
      })
    );

    // Never return SPA HTML for missing static file extensions
    app.use((req, res, next) => {
      if (/\.(?:js|mjs|css|map|png|jpe?g|webp|avif|gif|svg|ico|woff2?|ttf|json|webmanifest|txt|xml)$/i.test(req.path)) {
        return res.status(404).end();
      }
      next();
    });

    // Fallback for SPA routing in development
    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        const vite = await viteReady;
        const rootIndex = path.resolve(__dirname, 'index.html');
        if (fs.existsSync(rootIndex)) {
          let template = fs.readFileSync(rootIndex, 'utf-8');
          template = await vite.transformIndexHtml(url, template);
          const enhancedHtml = injectSocialAndPreloadMeta(template, req);
          return res
            .status(200)
            .set({
              'Content-Type': 'text/html; charset=utf-8',
              'Cache-Control': 'public, max-age=0, must-revalidate',
            })
            .send(enhancedHtml);
        }
        next();
      } catch (e) {
        try {
          const vite = await viteReady;
          vite.ssrFixStacktrace(e as Error);
        } catch {
          // ignore stack trace helper failure
        }
        next(e);
      }
    });
  } else {
    const distPath = path.join(__dirname, 'dist');
    const indexPath = path.join(distPath, 'index.html');
    const cachedProdHtml = fs.existsSync(indexPath)
      ? fs.readFileSync(indexPath, 'utf-8')
      : null;

    // Hashed Vite bundles get 1y immutable caching; images get 7d + 30d stale-while-revalidate for fast FB/IG revisits
    app.use(
      '/assets',
      express.static(path.join(distPath, 'assets'), {
        maxAge: '7d',
        setHeaders: (res, filePath) => {
          if (/\.(js|css|woff2)$/i.test(filePath)) {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          } else {
            res.setHeader('Cache-Control', 'public, max-age=604800, stale-while-revalidate=2592000');
          }
          if (filePath.endsWith('IVORY_BOXY_front_png_8c2431ce')) {
            res.setHeader('Content-Type', 'image/png');
          }
        },
      })
    );
    app.use(
      '/assets',
      express.static(path.join(__dirname, 'public', 'assets'), {
        maxAge: '7d',
        setHeaders: (res, filePath) => {
          res.setHeader('Cache-Control', 'public, max-age=604800, stale-while-revalidate=2592000');
          if (filePath.endsWith('IVORY_BOXY_front_png_8c2431ce')) {
            res.setHeader('Content-Type', 'image/png');
          }
        },
      })
    );

    // Other dist files (index.html is served dynamically below for per-product OpenGraph & preload hints)
    app.use(
      express.static(distPath, {
        index: false,
        maxAge: '7d',
        setHeaders: (res, filePath) => {
          const baseName = path.basename(filePath);
          if (filePath.endsWith('.html') || baseName === 'sw.js' || baseName === 'registerSW.js') {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          } else if (baseName === 'manifest.webmanifest') {
            res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
            res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
          } else if (/\.(js|css|woff2)$/i.test(filePath)) {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          } else {
            res.setHeader('Cache-Control', 'public, max-age=604800, stale-while-revalidate=2592000');
          }
        },
      })
    );
    app.use(
      express.static(path.join(__dirname, 'public'), {
        index: false,
        maxAge: '7d',
        setHeaders: (res) => {
          res.setHeader('Cache-Control', 'public, max-age=604800, stale-while-revalidate=2592000');
        },
      })
    );
    app.use((req, res, next) => {
      if (/\.(?:js|mjs|css|map|png|jpe?g|webp|avif|gif|svg|ico|woff2?|ttf|json|webmanifest|txt|xml)$/i.test(req.path)) {
        return res.status(404).end();
      }
      next();
    });
    app.get('*', (req, res) => {
      if (cachedProdHtml) {
        const enhancedHtml = injectSocialAndPreloadMeta(cachedProdHtml, req);
        res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
        res.type('html').send(enhancedHtml);
      } else {
        res.status(200).send('BAD HABIT luxury streetwear store is starting up...');
      }
    });
  }
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
