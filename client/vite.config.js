import fs from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { ROOT, envConfig, loadSite, pageProps, fillTemplate, NOT_FOUND_PAGE } from './scripts/site-data.js';

const API = process.env.API_URL || 'http://localhost:3000';

// Other Vite projects on this machine (e.g. a PWA) can leave a service worker on localhost:5173 that keeps
// serving their cached page. The browser re-fetches the worker script on update checks, so answering those
// paths with a worker that unregisters itself and reloads the tab hands localhost:5173 back to this site.
const SW_PATHS = new Set(['/sw.js', '/dev-sw.js', '/service-worker.js']);
const SW_KILL = `self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil((async () => {
  await self.registration.unregister();
  for (const k of await caches.keys()) await caches.delete(k);
  for (const c of await self.clients.matchAll({ type: 'window' })) c.navigate(c.url);
})()));`;

/**
 * Dev only: renders each page on the server, exactly like the production prerender (scripts/build.js),
 * so `vite` shows the real site. Content JSON edits show on the next refresh; React edits hot-reload.
 */
function nppPages() {
  return {
    name: 'npp-pages',
    apply: 'serve',
    configureServer(server) {
      const env = envConfig(false);
      server.middlewares.use((req, res, next) => {
        if (!SW_PATHS.has(new URL(req.url, 'http://localhost').pathname)) return next();
        res.writeHead(200, { 'Content-Type': 'text/javascript', 'Cache-Control': 'no-store' });
        res.end(SW_KILL);
      });
      return () => {
        server.middlewares.use(async (req, res, next) => {
          if (req.method !== 'GET' && req.method !== 'HEAD') return next();
          const url = new URL(req.originalUrl || req.url, 'http://localhost');
          if (path.extname(url.pathname) && !url.pathname.endsWith('.html')) return next();
          try {
            const route = url.pathname.replace(/(?:\/index)?\.html$/, '').replace(/(.)\/$/, '$1') || '/';
            const ctx = loadSite(env);
            const found = ctx.pages.find((p) => p.path === route);
            const page = found || NOT_FOUND_PAGE;
            const template = await server.transformIndexHtml(req.originalUrl, fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'));
            const { render } = await server.ssrLoadModule('/src/entry-server.jsx');
            const props = pageProps(page, ctx);
            res.writeHead(found ? 200 : 404, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(fillTemplate(template, page, ctx, render(props), props));
          } catch (e) {
            server.ssrFixStacktrace(e);
            next(e);
          }
        });
      };
    },
  };
}

export default defineConfig({
  plugins: [react(), nppPages()],
  appType: 'custom', // pages come from nppPages(), not a single-page index.html fallback
  server: {
    port: 5173,
    // forms and the leads page are handled by the backend (server/)
    proxy: { '/api': API, '/admin': API },
  },
  build: { outDir: 'dist', emptyOutDir: true },
});
