'use strict';
const http = require('http'); const fs = require('fs'); const path = require('path'); const qs = require('querystring');
const enquiry = require('./services/enquiry'); const { limited } = require('./utils/rateLimit');
const DIST = path.resolve(process.env.CLIENT_DIST || path.join(__dirname, '..', 'client', 'dist')); const PORT = process.env.PORT || 3000;
const STAGING = (process.env.SITE_ENV || 'staging') !== 'production';
const MIME = { '.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.json':'application/json','.xml':'application/xml','.txt':'text/plain','.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.ico':'image/x-icon','.woff2':'font/woff2' };
const REDIRECTS = [
  [/^\/properties(\/.*)?$/, '/buy-property-pondicherry'], [/^\/post-requirement\/?$/, '/buy-property-pondicherry'],
  [/^\/post-property\/?$/, '/sell-property-pondicherry'], [/^\/business\/(agent|builders-promoter)\/?$/, '/partner-with-us'],
  [/^\/business\/owner\/?$/, '/nri-property-management-pondicherry'],
];
const SEC = { 'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'SAMEORIGIN', 'Referrer-Policy': 'strict-origin-when-cross-origin', 'Permissions-Policy': 'geolocation=(), camera=(), microphone=()' };
function send(res, code, body, type = 'text/plain', extra = {}) { res.writeHead(code, { 'Content-Type': type, ...SEC, ...extra }); res.end(body); }
function readBody(req, max = 20000) { return new Promise((ok, no) => { let b = ''; req.on('data', (c) => { b += c; if (b.length > max) { no(new Error('big')); req.destroy(); } }); req.on('end', () => ok(b)); req.on('error', no); }); }
function toPayload(raw, ctype, req) {
  if (ctype.includes('application/json')) return JSON.parse(raw || '{}');
  const o = qs.parse(raw); const { form_type, source_page, company_website, ...rest } = o; const fields = {};
  for (const [k, v] of Object.entries(rest)) fields[k] = Array.isArray(v) ? v[0] : v;
  return { form_type, source_page, source_url: req.headers.referer || '', company_website, fields, utm: {}, referrer: '' };
}
function serveFile(res, file, code = 200) {
  const ext = path.extname(file); const cache = ext === '.html' ? 'no-cache' : 'public, max-age=86400';
  fs.readFile(file, (e, d) => (e ? send(res, 500, 'Server error') : send(res, code, d, MIME[ext] || 'application/octet-stream', { 'Cache-Control': cache })));
}
function resolve(p) {
  const clean = path.normalize(decodeURIComponent(p)).replace(/^(\.\.[/\\])+/, '');
  const base = path.join(DIST, clean);
  if (!base.startsWith(DIST)) return null;
  for (const c of [base, base + '.html', path.join(base, 'index.html')]) if (fs.existsSync(c) && fs.statSync(c).isFile()) return c;
  return null;
}

const store = require('./services/store');
const esc = (v) => String(v == null ? '' : v).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function adminAuth(req, res) {
  const u = process.env.ADMIN_USER, pw = process.env.ADMIN_PASS;
  if (!u || !pw) { send(res, 404, 'Not found'); return false; }
  const m = /^Basic (.+)$/.exec(req.headers.authorization || '');
  const [gu, ...gp] = m ? Buffer.from(m[1], 'base64').toString().split(':') : [''];
  const crypto = require('crypto'); const eq = (x, y) => x.length === y.length && crypto.timingSafeEqual(Buffer.from(x), Buffer.from(y));
  if (m && eq(gu, u) && eq(gp.join(':'), pw)) return true;
  send(res, 401, 'Login required', 'text/plain', { 'WWW-Authenticate': 'Basic realm="NPP leads"' }); return false;
}
async function adminLeads(req, res, url) {
  if (!adminAuth(req, res)) return;
  const rows = await store.all();
  if (url.pathname === '/admin/leads.csv') {
    const cols = ['createdAt', 'id', 'form_type', 'name', 'phone', 'source_page', 'crmStatus'];
    const q = (v) => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
    const csv = [cols.concat(['details', 'utm_source', 'referrer']).join(',')].concat(rows.map((r) => cols.map((c) => q(r[c])).concat([q(Object.entries(r.fields || {}).map(([k, v]) => k + ': ' + v).join(' | ')), q(r.utm && r.utm.source), q(r.referrer)]).join(','))).join('\n');
    return send(res, 200, csv, 'text/csv; charset=utf-8', { 'Content-Disposition': 'attachment; filename="npp-leads.csv"' });
  }
  const failed = rows.filter((r) => r.crmStatus !== 'sent').length;
  const body = `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>NPP leads</title>
<style>body{font:15px/1.5 system-ui;margin:20px;color:#172B4D}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:6px 8px;text-align:left;vertical-align:top}th{background:#FBEBC0;position:sticky;top:0}.bad{background:#FCE5E3}.ok{color:#0F7A40}a.b{display:inline-block;padding:6px 12px;background:#142447;color:#fff;border-radius:6px;text-decoration:none}</style>
<h1>Enquiries (${rows.length})</h1><p>${failed ? '<b style="color:#A32121">' + failed + ' not yet in the Google Sheet</b> — they retry every 5 minutes. ' : '<span class="ok">All enquiries are in the Google Sheet.</span> '}<a class="b" href="/admin/leads.csv">Download CSV</a></p>
<table><tr><th>Time (IST)</th><th>Type</th><th>Name</th><th>Phone</th><th>Page</th><th>Details</th><th>Sheet</th></tr>${rows.map((r) => `<tr class="${r.crmStatus === 'sent' ? '' : 'bad'}"><td>${esc(new Date(r.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false }))}</td><td>${esc(r.form_type)}</td><td>${esc(r.name)}</td><td><a href="https://wa.me/${esc(String(r.phone).replace('+', ''))}">${esc(r.phone)}</a></td><td>${esc(r.source_page)}</td><td>${esc(Object.entries(r.fields || {}).map(([k, v]) => k + ': ' + v).join(' | '))}</td><td>${esc(r.crmStatus)}</td></tr>`).join('')}</table>`;
  return send(res, 200, body, 'text/html; charset=utf-8', { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' });
}
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x'); const p = url.pathname;
  if (p === '/admin/leads' || p === '/admin/leads.csv') return adminLeads(req, res, url).catch(() => send(res, 500, 'Error'));
  if (STAGING) res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  // One canonical origin: https + non-www (SEO Technical item 18). Enabled when CANONICAL_HOST is set, e.g. nammapondyproperties.com
  const canon = process.env.CANONICAL_HOST;
  if (canon && !/^(localhost|127\.)/.test(req.headers.host || '')) {
    const host = (req.headers.host || '').toLowerCase(); const proto = req.headers['x-forwarded-proto'] || 'http';
    if (host !== canon || proto !== 'https') return send(res, 301, '', 'text/plain', { Location: 'https://' + canon + req.url });
  }
  if (p === '/api/enquiry') {
    if (req.method !== 'POST') return send(res, 405, 'Method not allowed', 'text/plain', { Allow: 'POST' });
    const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
    const wantsJson = (req.headers['content-type'] || '').includes('application/json');
    try {
      const payload = toPayload(await readBody(req), req.headers['content-type'] || '', req);
      if (payload.company_website) return wantsJson ? send(res, 200, '{"ok":true}', 'application/json') : (res.writeHead(303, { Location: '/thank-you' }), res.end()); // honeypot: silent success
      if (limited(ip)) return send(res, 429, '{"ok":false,"error":"Too many requests. Please use WhatsApp."}', 'application/json');
      const r = await enquiry.handle(payload, { ip });
      if (wantsJson) return send(res, r.status, JSON.stringify(r.body), 'application/json');
      if (r.status === 200) { res.writeHead(303, { Location: (payload.source_page || '/') + '?sent=1' }); return res.end(); }
      return send(res, r.status, '<p>' + (r.body.error || 'Error') + '</p><p><a href="https://wa.me/918220969669">Message us on WhatsApp</a></p>', 'text/html; charset=utf-8');
    } catch (e) { return send(res, 400, '{"ok":false,"error":"Bad request"}', 'application/json'); }
  }
  if (!['GET', 'HEAD'].includes(req.method)) return send(res, 405, 'Method not allowed');
  for (const [re, to] of REDIRECTS) if (re.test(p)) return send(res, 301, '', 'text/plain', { Location: to });
  if (p.length > 1 && p.endsWith('/')) return send(res, 301, '', 'text/plain', { Location: p.slice(0, -1) + url.search });
  if (/^\/google[0-9a-f]+\.html$/.test(p)) { const g = resolve(p); if (g) return serveFile(res, g); } // Search Console verification file must answer 200 at its exact .html URL
  if (p.endsWith('.html')) return send(res, 301, '', 'text/plain', { Location: p.replace(/(?:\/index)?\.html$/, '') || '/' });
  const f = resolve(p === '/' ? '/index.html' : p);
  if (f) return serveFile(res, f);
  if (!path.extname(p) && /^\/(business|properties|post-|login|dashboard)/.test(p)) return send(res, 301, '', 'text/plain', { Location: '/' });
  const nf = path.join(DIST, '404.html');
  if (fs.existsSync(nf)) return serveFile(res, nf, 404);
  return send(res, 404, '<h1>Page not found</h1><p><a href="/">Home</a></p>', 'text/html; charset=utf-8');
});
if (require.main === module) {
  server.listen(PORT, () => console.log('NPP server on :' + PORT + (STAGING ? ' (staging, noindex)' : '')));
  if (process.env.N8N_WEBHOOK_URL) setInterval(() => enquiry.retryPending().catch(() => {}), 5 * 60 * 1000).unref();
}
module.exports = server;
