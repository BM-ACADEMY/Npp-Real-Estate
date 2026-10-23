/* Gentle lead popup: a small card (bottom sheet on phones), never full-screen, shown once per visit
   after ~30 s or 60% scroll. Not shown on /contact or once the visitor has sent any enquiry. */
import { useEffect, useRef, useState } from 'react';
import { track } from '../lib/analytics.js';
import { useSite } from '../lib/SiteContext.js';

const COPY = {
  '/nri-property-management-pondicherry': ['Living abroad? Get a free property check', 'We visit, film a walk-through and send a written report in 3 working days.'],
  '/free-rental-audit': ['Claim your free rental audit', 'Leave your number. We will call you at a time that suits your country.'],
  '/buy-property-pondicherry': ['Looking to buy? Tell us your budget', 'We shortlist and verify documents before you visit anything.'],
  '/sell-property-pondicherry': ['Thinking of selling? Get a free valuation', 'Leave your number and we will arrange a visit.'],
  '/free-property-valuation': ['Want your valuation sooner?', 'Leave your number and we will call you today.'],
  '/our-projects': ['Ask what plots are open now', 'We will send you today’s availability and prices.'],
  '/partner-with-us': ['Interested in a tie-up?', 'Leave your number and we will call you back.'],
  '/instagram-reel-shoot': ['Want your property filmed?', 'Leave your number and we will confirm a shoot date.'],
};
const DEFAULT_COPY = ['Not sure where to start?', 'Leave your number and our team will call you back during office hours (10 AM – 7 PM, Mon–Sat).'];

const markDone = () => { try { sessionStorage.setItem('npp_popup_done', '1'); } catch (e) {} };

export function Popup() {
  const { site } = useSite();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState(null); // { kind, text }
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const openerRef = useRef(null);
  const pathRef = useRef('/');

  useEffect(() => {
    const path = location.pathname.replace(/\/$/, '') || '/';
    pathRef.current = path;
    if (path === '/contact') return;
    try { if (sessionStorage.getItem('npp_popup_done') || sessionStorage.getItem('npp_submitted')) return; } catch (e) {}
    let shown = false, later;
    function show() {
      if (shown) return; shown = true;
      openerRef.current = document.activeElement;
      setOpen(true);
      track('popup_shown', { popup: path });
    }
    const timer = setTimeout(show, 30000);
    function onScroll() {
      const h = document.documentElement;
      if ((h.scrollTop + innerHeight) / h.scrollHeight > 0.6) { window.removeEventListener('scroll', onScroll); clearTimeout(timer); later = setTimeout(show, 1500); }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { clearTimeout(timer); clearTimeout(later); window.removeEventListener('scroll', onScroll); };
  }, []);

  function close() {
    markDone(); setOpen(false);
    const o = openerRef.current; if (o && o.focus) try { o.focus(); } catch (e) {}
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  if (!open) return null;
  const path = pathRef.current;
  const copy = COPY[path] || DEFAULT_COPY;

  async function onSubmit(ev) {
    ev.preventDefault();
    const f = ev.currentTarget, n = f.elements.name.value.trim(), p = f.elements.phone.value.trim();
    if (!n || p.replace(/\D/g, '').length < 7) { setStatus({ kind: 'err', text: 'Please enter your name and a valid number.' }); return; }
    setBusy(true);
    try {
      const r = await fetch('/api/enquiry', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        form_type: 'general_enquiry', source_page: path, source_url: location.href, referrer: document.referrer, utm: {},
        fields: { name: n, phone: p, message: 'Popup callback request from ' + path }, company_website: '', submitted_at: new Date().toISOString() }) });
      const j = await r.json();
      if (!r.ok || j.ok === false) throw new Error('server');
      try { sessionStorage.setItem('npp_submitted', '1'); } catch (e) {}
      setSent(true);
      setStatus({ kind: 'ok', text: 'Thank you. We will call you back soon.' });
      track('general_enquiry', { form_type: 'general_enquiry', via: 'popup' });
      setTimeout(close, 3500);
    } catch (e) {
      setBusy(false);
      setStatus({ kind: 'err', text: 'Could not send. Please use the WhatsApp link below or call ' + site.phone.replace('+91', '') + '.' });
    }
  }

  return (
    <div className="npp-pop" role="dialog" aria-labelledby="npp-pop-h" aria-modal="false">
      <button type="button" className="npp-pop-x" aria-label="Close" onClick={close}>&times;</button>
      <h2 id="npp-pop-h">{copy[0]}</h2>
      <p className="npp-pop-p">{copy[1]}</p>
      <form noValidate onSubmit={onSubmit}>
        <div className="field" hidden={sent || undefined}>
          <label htmlFor="npp-pn">Your name</label>
          <input id="npp-pn" name="name" autoComplete="name" required />
        </div>
        <div className="field" hidden={sent || undefined}>
          <label htmlFor="npp-pp">WhatsApp or phone number</label>
          <input id="npp-pp" name="phone" type="tel" inputMode="tel" autoComplete="tel" required />
          <span className="help">Include your country code if outside India.</span>
        </div>
        <button className="btn btn-bloom btn-full" type="submit" disabled={busy} hidden={sent || undefined}>{busy ? 'Sending…' : 'Call me back'}</button>
        <div className={'form-status' + (status ? ' ' + status.kind : '')} role="status" aria-live="polite" hidden={!status}>{status && status.text}</div>
      </form>
      <a className="npp-pop-wa" target="_blank" rel="noopener" data-pos="popup"
        href={'https://wa.me/' + site.waNumber + '?text=' + encodeURIComponent('Hi, I would like to talk about a property in Pondicherry')}>
        Or message us on WhatsApp
      </a>
    </div>
  );
}
