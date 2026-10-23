'use strict';
// Compares dist/ with the locked SEO workbook targets (seo/on-page-targets.json). Exit 1 on any mismatch.
const fs = require('fs'); const path = require('path');
const T = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'seo', 'on-page-targets.json'), 'utf8'));
const DIST = path.join(__dirname, '..', 'dist');
const dec = (s) => s.replace(/&amp;/g, '&').replace(/&#39;|&#x27;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
let bad = 0; const F = (r, m) => { bad++; console.log(`  FAIL ${r}: ${m}`); };
for (const [r, t] of Object.entries(T)) {
  const f = path.join(DIST, r === '/' ? 'index.html' : r.slice(1) + '.html'); if (!fs.existsSync(f)) { F(r, 'page not built'); continue; }
  const h = fs.readFileSync(f, 'utf8');
  const title = dec((h.match(/<title>([^<]*)<\/title>/) || [])[1] || ''), desc = dec((h.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '');
  const h1 = dec((h.match(/<h1[^>]*>([^<]*)<\/h1>/) || [])[1] || '');
  if (title !== t.title) F(r, `title\n      have: ${title}\n      want: ${t.title}`);
  if (desc !== t.description) F(r, `description\n      have: ${desc}\n      want: ${t.description}`);
  if (h1 !== t.h1) F(r, `h1\n      have: ${h1}\n      want: ${t.h1}`);
  const types = new Set(); for (const m of h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) for (const n of (JSON.parse(m[1])['@graph'] || [])) types.add(n['@type']);
  for (const s of t.schema) if (!types.has(s)) F(r, `schema ${s} missing (have: ${[...types].join(', ')})`);
  const links = new Set([...h.matchAll(/<a [^>]*href="([^"#]+)/g)].map((m) => m[1]));
  for (const l of t.links) if (!links.has(l)) F(r, `internal link to ${l} missing`);
  if (!/<link rel="canonical"/.test(h)) F(r, 'canonical missing');
}
console.log(bad ? `\n${bad} mismatches` : 'SEO targets: all pages match the workbook'); process.exit(bad ? 1 : 0);
