import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// The API runs on :8080 during development by default; Vite proxies /api so the
// browser only ever talks to a single origin (no CORS problems).
// Override both ports ad hoc, e.g. API_PORT=5001 WEB_PORT=5174 npm run dev.
const webPort = Number.parseInt(process.env.WEB_PORT ?? '', 10) || 3000;
const apiProxyTarget =
  process.env.API_PROXY_TARGET ??
  `http://localhost:${Number.parseInt(process.env.API_PORT ?? '', 10) || 8080}`;

export default defineConfig({
  plugins: [react()],
  server: {
    port: webPort,
    strictPort: true,
    proxy: {
      '/api': {
        target: apiProxyTarget,
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
});
