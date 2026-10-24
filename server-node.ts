import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { app } from './server';
const PORT = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === 'production';
const __dirname = import.meta.dirname;

// -------------------------------------------------------------
// Vite Dev Integration & Production Static Serving
// -------------------------------------------------------------
async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    // Serve static assets with granular, aggressive caching headers
    app.use(
      express.static(distPath, {
        setHeaders: (res, filePath) => {
          if (filePath.endsWith('.html')) {
            // HTML entry point must always revalidate to pick up latest build hashes
            res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
          } else if (
            filePath.includes('/assets/') ||
            /\.(js|css|woff2|woff|ttf|eot|avif|webp|png|jpg|jpeg|gif|svg|ico)$/i.test(filePath)
          ) {
            // Immutable static assets: Cache aggressively for 1 year across browser and Cloudflare CDN
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
            res.setHeader('X-Cache-Rule', 'cloudflare-immutable-cdn');
          }
        },
      })
    );

    app.get('*', (_req, res) => {
      res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[MAYF Server] Maths at Your Fingertips server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[MAYF Server] Failed to start server:', err);
  process.exit(1);
});
