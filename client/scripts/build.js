/**
 * Production build: bundles the React app with Vite, then prerenders every route to real HTML.
 *
 * Output: dist/  (one HTML file per route + 404 + sitemap.xml + robots.txt + JS/CSS assets)
 * Every page is complete HTML in the initial response; React hydrates it in the browser.
 *
 *   node scripts/build.js          staging (default): noindex everywhere, robots Disallow
 *   node scripts/build.js --prod   production: indexable, GA4_ID / META_PIXEL_ID switch tracking on
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'vite';
import { ROOT, envConfig, loadSite, pageProps, fillTemplate, NOT_FOUND_PAGE } from './site-data.js';

const DIST = path.join(ROOT, 'dist');
const SSR_OUT = path.join(ROOT, '.ssr');
const env = envConfig(process.argv.includes('--prod'));
const BUILD_DATE = new Date().toISOString().slice(0, 10);

// Read content first so a broken page fails before Vite runs.
const ctx = loadSite(env);

await build({ root: ROOT, logLevel: 'warn' });
await build({ root: ROOT, logLevel: 'warn', build: { ssr: 'src/entry-server.jsx', outDir: SSR_OUT, emptyOutDir: true } });
const { render } = await import(pathToFileURL(path.join(SSR_OUT, 'entry-server.js')).href);
const template = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');

function outFile(p) {
  if (p === '/') return path.join(DIST, 'index.html');
  return path.join(DIST, `${p.replace(/^\//, '')}.html`);
}
function writePage(page, file) {
  const props = pageProps(page, ctx);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, fillTemplate(template, page, ctx, render(props), props));
}

for (const page of ctx.pages) writePage(page, outFile(page.path));
writePage(NOT_FOUND_PAGE, path.join(DIST, '404.html'));

// sitemap — published, indexable routes only
const { site, pages } = ctx;
const abs = (p) => site.url + (p === '/' ? '/' : p);
const urls = pages
  .filter((p) => p.sitemap !== false)
  .map((p) => `  <url><loc>${abs(p.path)}</loc><lastmod>${p.modified || BUILD_DATE}</lastmod></url>`)
  .join('\n');
fs.writeFileSync(
  path.join(DIST, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
);
fs.writeFileSync(
  path.join(DIST, 'robots.txt'),
  env.isProd ? `User-agent: *\nAllow: /\n\nSitemap: ${site.url}/sitemap.xml\n` : `User-agent: *\nDisallow: /\n`
);
fs.writeFileSync(
  path.join(DIST, '_routes.json'),
  JSON.stringify({ env: env.env, built: new Date().toISOString(), routes: pages.map((p) => p.path) }, null, 1)
);
fs.rmSync(SSR_OUT, { recursive: true, force: true });

console.log(`Built ${pages.length} pages -> client/dist/ (env: ${env.env}${env.ga4 ? ', GA4 on' : ', GA4 off'})`);
if (!env.isProd) console.log('Staging build: every page carries noindex and robots.txt disallows crawling.');
const warnings = [...new Set(ctx.warnings)];
if (process.argv.includes('--verbose')) warnings.forEach((w) => console.warn('  warning:', w));
else if (warnings.length) console.warn(`  ${warnings.length} warnings (missing images etc.) — run "node scripts/build.js --verbose" to list them`);
