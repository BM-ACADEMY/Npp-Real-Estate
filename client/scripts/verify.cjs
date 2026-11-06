'use strict';
const fs = require('fs'); const path = require('path');
const DIST = path.join(__dirname, '..', 'dist'); const prod = process.argv.includes('--prod') || process.env.SITE_ENV === 'production';
let errors = 0, warns = 0; const E = (m) => { errors++; console.log('  ERROR ' + m); }; const W = (m) => { warns++; console.log('  warn  ' + m); };
const files = []; (function walk(d) { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); fs.statSync(p).isDirectory() ? walk(p) : p.endsWith('.html') && !/^google[0-9a-f]+\.html$/.test(f) && files.push(p); } })(DIST); // Search Console verification files are not pages
const routeOf = (f) => { let r = '/' + path.relative(DIST, f).replace(/\\/g, '/').replace(/\.html$/, ''); return r === '/index' ? '/' : r; };
const routes = new Set(files.map(routeOf)); routes.delete('/404'); const anchors = {};
const dec = (s) => s.replace(/&amp;/g, '&').replace(/&#39;|&#x27;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const pages = files.map((f) => { const h = fs.readFileSync(f, 'utf8'); anchors[routeOf(f)] = new Set([...h.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1])); return { f, r: routeOf(f), h }; });
for (const { r, h } of pages) {
  console.log(r);
  if (!/<form class="formcard"|class="cta[" ]/.test(h)) E('no enquiry form or CTA block on page (CTA is mandatory)');
  if (!/wa\.me\//.test(h) || !/tel:/.test(h)) E('WhatsApp and call links must be on every page');
  const h1 = (h.match(/<h1[\s>]/g) || []).length; if (h1 !== 1) E(`${h1} H1 tags`);
  const t = dec((h.match(/<title>([^<]*)<\/title>/) || [])[1] || ''); const d = dec((h.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '');
  if (t.length < 40 || t.length > 60) W(`title ${t.length} chars (target 40-60): "${t}"`);
  if (d.length < 120 || d.length > 158) W(`description ${d.length} chars (target 120-158)`);
  if (!/<link rel="canonical" href="https:\/\/nammapondyproperties\.com[^"]*"/.test(h)) E('canonical missing');
  const is404 = r === '/404'; const noindex = /<meta name="robots" content="[^"]*noindex/.test(h); if (prod && noindex && !is404) E('noindex in production'); if (!prod && !noindex) E('staging page is indexable'); if (is404 && !noindex) E('404 page must be noindex');
  if (/TO BE COMPLETED|\bTBD\b|lorem ipsum|\bxxx\b|Template page|Sample article|To be added before launch/i.test(h.replace(/<script[\s\S]*?<\/script>/g, ''))) E('placeholder / internal note text present');
  for (const m of h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) { try { const j = JSON.parse(m[1]); const faq = (j['@graph'] || []).find((x) => x['@type'] === 'FAQPage');
    if (faq) { const vis = [...h.matchAll(/<summary>([^<]*)<\/summary>/g)].map((x) => dec(x[1])); const sch = faq.mainEntity.map((q) => q.name); if (JSON.stringify(vis) !== JSON.stringify(sch)) E('FAQ schema differs from visible FAQ'); }
    if (/TO BE COMPLETED/.test(m[1])) E('address placeholder in JSON-LD'); } catch (e) { E('JSON-LD does not parse'); } }
  for (const m of h.matchAll(/<a [^>]*href="([^"]+)"/g)) { const href = dec(m[1]); if (/^(https?:|tel:|mailto:|#)/.test(href)) { if (href.startsWith('#') && href.length > 1 && !anchors[r].has(href.slice(1))) E(`broken in-page anchor ${href}`); continue; }
    const [pth, hash] = href.split('#'); if (!routes.has(pth || r)) { E(`broken link ${href}`); continue; } if (hash && !(anchors[pth || r] || new Set()).has(hash)) E(`anchor ${href} not found`); }
  if (/\b1[23],?\d{3}\+?\s*(followers)?/.test(h) && /followers/.test(h)) { /* known figure */ }
  if (/(\d[\d.,]*\s*(lakh|K)\+?\s*(followers|views))/i.test(h) && !/Insights/.test(h) && /views/.test(h)) W('Instagram figures without date source');
}
if (!fs.existsSync(path.join(DIST, 'sitemap.xml'))) E('sitemap.xml missing'); else { const n = (fs.readFileSync(path.join(DIST, 'sitemap.xml'), 'utf8').match(/<loc>/g) || []).length; console.log(`sitemap: ${n} urls`); }
if (!pages.some((p) => /Instagram Insights, ([^.]*)\./.test(p.h))) {} else { const m = pages.map((p) => (p.h.match(/Instagram Insights, ([^.]*)\./) || [])[1]).find(Boolean); W(`Instagram figures are dated "${m}" — refresh from Insights before launch (SEO rule: never publish a number we cannot show)`); }
console.log(`\n${pages.length} pages, ${errors} errors, ${warns} warnings`); process.exit(errors ? 1 : 0);
