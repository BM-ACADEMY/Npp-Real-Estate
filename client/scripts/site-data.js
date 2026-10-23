/**
 * Content loading + everything that goes in <head> (meta, canonical, JSON-LD).
 * Used by the prerender build and the dev server, so both produce the same HTML.
 *
 * Input : content/site.json, content/forms.json, content/pages/*.json, content/guides/*.json, public/images
 * SITE_ENV=staging (default) -> noindex everywhere, no analytics ids
 * SITE_ENV=production        -> indexable; GA4_ID / META_PIXEL_ID env vars switch tracking on
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function envConfig(prodFlag) {
  const env = prodFlag ? 'production' : (process.env.SITE_ENV || 'staging').toLowerCase();
  const isProd = env === 'production';
  return {
    env,
    isProd,
    ga4: isProd ? process.env.GA4_ID || '' : process.env.STAGING_GA4_ID || '',
    pixel: isProd ? process.env.META_PIXEL_ID || '' : '',
  };
}

const readJSON = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));

const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

function loadDir(dir) {
  const full = path.join(ROOT, dir);
  if (!fs.existsSync(full)) return [];
  return fs
    .readdirSync(full)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((f) => ({ file: `${dir}/${f}`, ...readJSON(`${dir}/${f}`) }));
}

// custom 404 (noindex, routes visitors to the main services) — served by the backend with status 404
export const NOT_FOUND_PAGE = {
  path: '/404', noindex: true, navKey: '', crumb: 'Page not found', eyebrow: 'Error 404',
  title: 'Page not found | Namma Pondy Properties Pondicherry', description: 'That page is not here. Start from one of our main services in Pondicherry and Kottakuppam, or message our team on WhatsApp and we will help.',
  h1: 'We could not find that page', lead: 'The link may be old or mistyped. Pick what you need below and we will take it from there.',
  heroActions: [{ label: 'WhatsApp us', go: 'wa', style: 'wa' }, { label: 'Go to the home page', go: '/', style: 'line' }],
  blocks: [
    { type: 'doors', h: 'Where would you like to go?', items: [
      { k: 'Buy property', d: 'Tell us your budget and area.', go: '/buy-property-pondicherry' },
      { k: 'Sell property', d: 'Start with a free valuation.', go: '/sell-property-pondicherry' },
      { k: 'I live abroad', d: 'Free property check for your house or shop.', go: '/nri-property-management-pondicherry' },
      { k: 'Talk to us', d: 'WhatsApp, call or a message.', go: '/contact' } ] },
    { type: 'cta', h: 'Not sure where to start?', p: 'Send us one message and we will point you to the right person.', actions: [{ label: 'WhatsApp us', go: 'wa', style: 'wa' }, { label: 'Call us', go: 'tel', style: 'line' }] },
  ],
};

/** Reads all content from disk. Call again to pick up edits. */
export function loadSite(envCfg) {
  const site = readJSON('content/site.json');
  const formsCfg = readJSON('content/forms.json');
  const pages = [...loadDir('content/pages'), ...loadDir('content/guides')].filter((p) => p.published !== false);
  const publishedPaths = new Set(pages.map((p) => p.path));
  const warnings = [];
  const ctx = { site, formsCfg, pages, publishedPaths, env: envCfg, warnings, warn: (m) => warnings.push(m) };
  for (const page of pages) {
    for (const k of ['path', 'title', 'description', 'h1', 'lead', 'blocks']) {
      if (!page[k]) throw new Error(`${page.file}: missing "${k}" — a page without it must fail the build, not ship a default`);
    }
  }
  return ctx;
}

const abs = (site, p) => site.url + (p === '/' ? '/' : p);
const imageExists = (name) => !!name && fs.existsSync(path.join(ROOT, 'public', 'images', name));

function breadcrumbs(page) {
  if (page.path === '/') return [{ name: 'Home', url: '/' }];
  return [{ name: 'Home', url: '/' }, ...(page.crumbParents || []), { name: page.crumb || page.h1, url: page.path }];
}

function guideFor(page, formsCfg) {
  if (page.guide === false) return null;
  if (page.guide && (page.guide.href || page.guide.target)) return page.guide;
  const fb = (page.blocks || []).find((x) => x.type === 'form');
  if (!fb) return null;
  const f = formsCfg[fb.id];
  return { target: f.anchor, label: (page.guide && page.guide.label) || f.cta };
}

/** Everything the React app needs for one page. It is embedded in the HTML and reused for hydration. */
export function pageProps(page, ctx) {
  const { site, formsCfg, pages, publishedPaths, env, warn } = ctx;
  const hasHeroArt = imageExists(page.heroImage);
  if (page.heroImage && !hasHeroArt) warn(`${page.path}: hero image "${page.heroImage}" missing in public/images — hero rendered without a photo`);
  const blocks = page.blocks.map((block) => {
    switch (block.type) {
      case 'form': {
        const form = formsCfg[block.id];
        if (!form) throw new Error(`${page.file}: unknown form id "${block.id}"`);
        return { ...block, form };
      }
      case 'nearby':
        return { ...block, items: (block.items || []).filter((i) => publishedPaths.has(i.go)) };
      case 'articles': {
        const list = pages.filter((p) => p.article).sort((a, b) => (a.article.order || 0) - (b.article.order || 0));
        const groups = {};
        for (const p of list) (groups[p.article.group || 'Guides'] ||= []).push({ path: p.path, h1: p.h1, description: p.description });
        return { ...block, groups: Object.entries(groups).map(([name, items]) => ({ name, items })) };
      }
      default:
        return block;
    }
  });
  const { file, schema, service, ogImage, hreflang, sitemap, modified, published, ...rest } = page;
  return {
    page: { ...rest, blocks, hasHeroArt, crumbs: breadcrumbs(page), waMsg: page.wa || site.defaultWa },
    site,
    guide: guideFor(page, formsCfg),
    npp: {
      env: env.env,
      ga4: env.ga4,
      pixel: env.pixel,
      phone: site.phone,
      waNumber: site.waNumber,
      sourcePage: page.path,
      isArticle: !!page.article,
      articleSlug: page.article ? page.path.split('/').pop() : '',
    },
  };
}

// ---------------------------------------------------------------- schema
function agentSchema(site) {
  const address = { '@type': 'PostalAddress', addressLocality: 'Pondicherry', addressRegion: 'Puducherry', addressCountry: 'IN' };
  if (site.address) address.streetAddress = site.address;
  return {
    '@type': 'RealEstateAgent',
    '@id': `${site.url}/#organization`,
    name: site.name,
    url: site.url,
    logo: abs(site, '/images/logo.webp'),
    telephone: site.phone,
    description: site.description,
    address,
    areaServed: site.areaServed,
    openingHoursSpecification: [
      { '@type': 'OpeningHoursSpecification', dayOfWeek: site.hours.days, opens: site.hours.opens, closes: site.hours.closes },
    ],
    sameAs: [site.instagram],
  };
}

function buildSchema(page, ctx) {
  const { site, warn } = ctx;
  const graph = [agentSchema(site)];
  const schemas = page.schema || [];
  if (schemas.includes('Service')) {
    graph.push({
      '@type': 'Service',
      name: page.service?.name || page.h1,
      serviceType: page.service?.serviceType || page.h1,
      provider: { '@id': `${site.url}/#organization` },
      areaServed: { '@type': 'Place', name: 'Pondicherry, Kottakuppam and nearby areas' },
      url: abs(site, page.path),
    });
  }
  if (schemas.includes('Organization')) {
    graph.push({ '@type': 'Organization', name: site.name, url: site.url, telephone: site.phone, sameAs: [site.instagram] });
  }
  if (schemas.includes('LocalBusiness')) {
    if (site.address) {
      const lb = {
        '@type': 'LocalBusiness',
        name: site.name,
        url: site.url,
        telephone: site.phone,
        address: { '@type': 'PostalAddress', streetAddress: site.address, addressLocality: 'Pondicherry', addressRegion: 'Puducherry', postalCode: site.postalCode || undefined, addressCountry: 'IN' },
        openingHours: 'Mo-Sa 10:00-19:00',
      };
      if (imageExists('logo.webp')) lb.image = abs(site, '/images/logo.webp');
      if (site.geo) lb.geo = { '@type': 'GeoCoordinates', latitude: site.geo.lat, longitude: site.geo.lng };
      else warn(`${page.path}: LocalBusiness published WITHOUT geo-coordinates — add "geo": {"lat":..,"lng":..} to content/site.json`);
      graph.push(lb);
    } else {
      warn(`${page.path}: LocalBusiness schema skipped — office address not set in content/site.json`);
    }
  }
  const faq = page.blocks.find((b) => b.type === 'faq');
  if (faq) {
    graph.push({
      '@type': 'FAQPage',
      mainEntity: faq.items.map((q) => ({ '@type': 'Question', name: q.q, acceptedAnswer: { '@type': 'Answer', text: q.a } })),
    });
  }
  const crumbs = breadcrumbs(page);
  if (crumbs.length > 1) {
    graph.push({
      '@type': 'BreadcrumbList',
      itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: abs(site, c.url) })),
    });
  }
  if (page.article) {
    graph.push({
      '@type': 'Article',
      headline: page.h1,
      datePublished: page.article.datePublished,
      dateModified: page.article.dateModified || page.article.datePublished,
      author: { '@type': 'Organization', name: page.article.author || site.name },
      publisher: { '@id': `${site.url}/#organization` },
      mainEntityOfPage: abs(site, page.path),
    });
  }
  return { '@context': 'https://schema.org', '@graph': graph };
}

// ---------------------------------------------------------------- head
export function renderHead(page, ctx) {
  const { site, env, publishedPaths, warn } = ctx;
  const robots = env.isProd && !page.noindex ? 'index, follow, max-image-preview:large' : 'noindex, nofollow';
  const title = esc(page.title);
  const desc = esc(page.description);
  const url = abs(site, page.path);
  const ogFile = imageExists(page.ogImage) ? page.ogImage : imageExists('logo.webp') ? 'logo.webp' : null;
  const og = ogFile ? `${site.url}/images/${ogFile}` : null;
  if (ogFile !== page.ogImage) warn(`${page.path}: og:image "${page.ogImage || '(none)'}" not found in public/images — ${og ? 'using logo.webp' : 'og:image omitted'}`);
  const hreflang = (page.hreflang || [])
    .filter((h) => publishedPaths.has(h.path))
    .map((h) => `<link rel="alternate" hreflang="${h.lang}" href="${abs(site, h.path)}">`)
    .join('\n');
  return `<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<meta name="description" content="${desc}">
<link rel="canonical" href="${url}">
<meta name="robots" content="${robots}">
<meta property="og:type" content="${page.article ? 'article' : 'website'}">
<meta property="og:site_name" content="${esc(site.name)}">
<meta property="og:locale" content="${(page.lang || 'en-IN').replace('-', '_')}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:url" content="${url}">
${og ? `<meta property="og:image" content="${og}">` : ''}
<meta name="twitter:card" content="${og ? 'summary_large_image' : 'summary'}">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${desc}">
${og ? `<meta name="twitter:image" content="${og}">` : ''}
<meta name="geo.region" content="IN-PY">
<meta name="geo.placename" content="Pondicherry">
${hreflang}
<link rel="icon" type="image/webp" href="/images/logo.webp">
<link rel="apple-touch-icon" href="/images/logo.webp">
<link rel="preload" as="image" href="/images/logo.webp">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,400;6..72,500;6..72,600&family=Karla:wght@400;500;600;700;800&family=Noto+Sans+Tamil:wght@400;600&display=swap">
<link rel="stylesheet" href="/styles.css">
<script type="application/ld+json">
${JSON.stringify(buildSchema(page, ctx), null, 1)}
</script>`;
}

/** Fills index.html: head tags, server-rendered app markup, and the props used for hydration. */
export function fillTemplate(template, page, ctx, appHtml, props) {
  const data = JSON.stringify(props).replace(/</g, '\\u003c');
  return template
    .replace('<!--app-lang-->', () => page.lang || 'en-IN')
    .replace('<!--app-head-->', () => renderHead(page, ctx))
    .replace('<!--app-html-->', () => appHtml)
    .replace('<!--app-data-->', () => `<script id="npp-data" type="application/json">${data}</script>`);
}
