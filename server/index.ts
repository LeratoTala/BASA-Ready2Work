import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { aiEnabled, isProduction, serverConfig } from './config';
import { rateLimit } from './rateLimit';
import { cvDraftRouter } from './routes/cvDraft';
import { registerRouter } from './routes/register';
import { applyRouter } from './routes/apply';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(dirname, '..', 'dist');

async function main() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(express.json({ limit: serverConfig.limits.bodyBytes }));

  // Security headers (kept dependency-free; swap for `helmet` if you prefer).
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  if (serverConfig.allowedOrigins.length > 0) {
    app.use('/api', (req, res, next) => {
      const origin = req.headers.origin;
      if (origin && serverConfig.allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Vary', 'Origin');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
      }
      if (req.method === 'OPTIONS') return res.sendStatus(204);
      return next();
    });
  }

  app.get('/api/health', (_req, res) => res.json({ status: 'ok', ai: aiEnabled }));
  app.use(
    '/api',
    rateLimit(serverConfig.rateLimit.windowMs, serverConfig.rateLimit.maxRequests),
    registerRouter,
    applyRouter,
    cvDraftRouter
  );

  if (isProduction) {
    app.use(express.static(distDir));
    app.get('*', (_req, res) => res.sendFile(path.join(distDir, 'index.html')));
  } else {
    const { createServer } = await import('vite');
    const vite = await createServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  }

  app.listen(serverConfig.port, '0.0.0.0', () => {
    console.log(`BASA server listening on port ${serverConfig.port} (${serverConfig.nodeEnv}); AI ${aiEnabled ? 'enabled' : 'disabled'}`);
  });
}

main().catch((err) => {
  console.error('Failed to start server', err);
  process.exit(1);
});
