import { existsSync } from 'node:fs';
import { join } from 'node:path';
import cors from 'cors';
import express, { type Express, type RequestHandler } from 'express';
import helmet from 'helmet';
import { errorHandler, notFoundHandler } from './middleware/errors.js';
import type { UserRepository } from './repositories/userRepository.js';
import { createUsersRouter } from './routes/users.js';

export interface CreateAppOptions {
  repository: UserRepository;
  /** Allowed browser origins for the Vite dev server (comma separated or list). */
  clientOrigin?: string | string[];
  /** Absolute path to the built client (client/dist). Serves the SPA when present. */
  clientDistPath?: string | null;
  logRequests?: boolean;
  /** Which backing store the repository uses; surfaced by /api/health. */
  store?: 'cosmos' | 'memory';
}

const requestLogger: RequestHandler = (request, response, next) => {
  const startedAt = performance.now();
  response.on('finish', () => {
    const duration = Math.round(performance.now() - startedAt);
    console.log(
      `[api] ${request.method} ${request.originalUrl} ${response.statusCode} ${duration}ms`,
    );
  });
  next();
};

export function createApp({
  repository,
  clientOrigin = 'http://localhost:3000',
  clientDistPath = null,
  logRequests = false,
  store = 'cosmos',
}: CreateAppOptions): Express {
  const app = express();
  app.disable('x-powered-by');

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:'],
          fontSrc: ["'self'"],
          connectSrc: ["'self'"],
          objectSrc: ["'none'"],
          frameAncestors: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
        },
      },
      crossOriginResourcePolicy: { policy: 'same-origin' },
    }),
  );

  const allowedOrigins = new Set(
    (Array.isArray(clientOrigin) ? clientOrigin : clientOrigin.split(','))
      .map((origin) => origin.trim())
      .filter(Boolean),
  );

  app.use(
    cors({
      origin(origin, callback) {
        // Same-origin requests and non-browser clients have no Origin header.
        if (!origin || allowedOrigins.has(origin) || allowedOrigins.has('*')) {
          callback(null, true);
          return;
        }
        callback(null, false);
      },
      methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'If-Match'],
      exposedHeaders: ['ETag', 'Location'],
      maxAge: 86_400,
    }),
  );

  app.use(express.json({ limit: '64kb' }));
  if (logRequests) app.use(requestLogger);

  const startedAt = Date.now();

  app.get('/api/health', async (_request, response) => {
    const checkStartedAt = performance.now();
    const storeLabel = store === 'memory' ? 'In-memory store' : 'Cosmos DB';

    try {
      await repository.ping();
      response.json({
        status: 'ok',
        store,
        timestamp: new Date().toISOString(),
        uptimeSeconds: Math.round((Date.now() - startedAt) / 1000),
        cosmos: {
          status: 'up',
          latencyMs: Math.round(performance.now() - checkStartedAt),
        },
      });
    } catch (error) {
      console.error(`[api] ${storeLabel} health check failed:`, error);
      response.status(503).json({
        status: 'degraded',
        store,
        timestamp: new Date().toISOString(),
        uptimeSeconds: Math.round((Date.now() - startedAt) / 1000),
        cosmos: {
          status: 'down',
          latencyMs: Math.round(performance.now() - checkStartedAt),
          message:
            store === 'memory'
              ? 'The in-memory store is unavailable.'
              : 'Cosmos DB is unreachable. Check COSMOS_ENDPOINT, COSMOS_KEY and firewall rules.',
        },
      });
    }
  });

  app.use('/api/users', createUsersRouter(repository));
  app.use('/api', notFoundHandler);

  if (clientDistPath) {
    const indexHtml = join(clientDistPath, 'index.html');

    if (existsSync(indexHtml)) {
      app.use(
        express.static(clientDistPath, {
          index: false,
          maxAge: '1y',
          immutable: true,
          setHeaders(response, filePath) {
            if (filePath.endsWith('index.html')) {
              response.setHeader('Cache-Control', 'no-cache');
            }
          },
        }),
      );

      // SPA fallback — everything that is not an API route renders the app.
      app.use((request, response, next) => {
        if (request.method !== 'GET' && request.method !== 'HEAD') {
          next();
          return;
        }
        response.setHeader('Cache-Control', 'no-cache');
        response.sendFile(indexHtml);
      });
    }
  }

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
