/* Analytics. Loads GA4 / Meta Pixel only in production when IDs are set. */
let C = {};

export function track(name, params = {}) {
  params.source_page = C.sourcePage;
  try { if (C.env === 'production' && C.ga4) window.gtag('event', name, params); } catch (e) {}
  if (C.env !== 'production' && window.console) console.debug('[npp-event]', name, params);
}

export function initAnalytics(cfg) {
  C = cfg || {};
  window.nppTrack = track;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  if (C.env === 'production' && C.ga4) {
    const s = document.createElement('script');
    s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(C.ga4);
    document.head.appendChild(s);
    window.gtag('js', new Date()); window.gtag('config', C.ga4);
  }
  if (C.env === 'production' && C.pixel) {
    !function (f, b, e, v, n, t, s) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); }; if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = []; t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s); }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    window.fbq('init', C.pixel); window.fbq('track', 'PageView');
  }
  document.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    const h = a.getAttribute('href') || '';
    const pos = a.getAttribute('data-pos') || 'body';
    if (h.indexOf('wa.me/') > -1) track('whatsapp_click', { button_position: pos });
    else if (h.indexOf('tel:') === 0) track('phone_click', {});
  });
  document.addEventListener('toggle', (e) => {
    const d = e.target;
    if (d && d.tagName === 'DETAILS' && d.open && d.closest('.faq')) {
      const q = d.querySelector('summary');
      track('faq_open', { question: q ? q.textContent.trim().slice(0, 100) : '' });
    }
  }, true);
  let fired = !C.isArticle; // scroll_75 is for /guides/* articles only
  window.addEventListener('scroll', () => {
    if (fired) return;
    const h = document.documentElement;
    if ((h.scrollTop + window.innerHeight) / h.scrollHeight >= 0.75) { fired = true; track('scroll_75', { article_slug: C.articleSlug }); }
  }, { passive: true });
}

export function trackLead() {
  try { if (window.fbq && C.pixel) window.fbq('track', 'Lead'); } catch (e) {}
}

/** UTM + first referrer for this visit, kept in sessionStorage so later pages still attribute the lead. */
export function attribution() {
  const utm = {};
  let referrer = '';
  try {
    const q = new URLSearchParams(location.search);
    ['utm_source', 'utm_medium', 'utm_campaign'].forEach((k) => { if (q.get(k)) sessionStorage.setItem('npp_' + k, q.get(k)); });
    if (!sessionStorage.getItem('npp_referrer') && document.referrer) sessionStorage.setItem('npp_referrer', document.referrer);
    ['utm_source', 'utm_medium', 'utm_campaign'].forEach((k) => { const v = sessionStorage.getItem('npp_' + k); if (v) utm[k.replace('utm_', '')] = v; });
    referrer = sessionStorage.getItem('npp_referrer') || '';
  } catch (e) {}
  return { utm, referrer };
}
