import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createApiApp } from './api/index.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = createApiApp();
  const isProd = process.env.NODE_ENV === 'production';

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

  // Frontend Integration (Vite in development, static build in production)
  if (!isProd) {
    // Fast cache headers for public assets in dev
    app.use(
      '/assets',
      express.static(path.join(__dirname, 'public', 'assets'), {
        maxAge: '30d',
        immutable: true,
      })
    );

    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    app.use(express.static(path.join(__dirname, 'public'), { maxAge: '7d' }));

    // Fallback for SPA routing in development
    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        const rootIndex = path.resolve(__dirname, 'index.html');
        if (fs.existsSync(rootIndex)) {
          let template = fs.readFileSync(rootIndex, 'utf-8');
          template = await vite.transformIndexHtml(url, template);
          return res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
        }
        next();
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    const distPath = path.join(__dirname, 'dist');
    const indexPath = path.join(distPath, 'index.html');

    // Hashed Vite bundles & public assets with long-term immutable caching
    app.use(
      '/assets',
      express.static(path.join(distPath, 'assets'), {
        maxAge: '1y',
        immutable: true,
      })
    );
    app.use(
      '/assets',
      express.static(path.join(__dirname, 'public', 'assets'), {
        maxAge: '30d',
        immutable: true,
      })
    );

    // Other dist files (index.html must never be staled across publishes)
    app.use(
      express.static(distPath, {
        maxAge: '1d',
        setHeaders: (res, filePath) => {
          if (filePath.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          }
        },
      })
    );
    app.use(express.static(path.join(__dirname, 'public'), { maxAge: '7d' }));
    app.get('*', (_req, res) => {
      if (fs.existsSync(indexPath)) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.sendFile(indexPath);
      } else {
        res.status(200).send('BAD HABIT luxury streetwear store is starting up...');
      }
    });
  }

  const server = app.listen(PORT, HOST, () => {
    console.log(`BAD HABIT Server listening on http://${HOST}:${PORT}`);
  });

  server.on('error', (err: any) => {
    console.error(`BAD HABIT Server listen error on ${HOST}:${PORT}:`, err);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
