/* Enquiry forms. Success is shown only after the server confirms store + CRM.
   Without JavaScript the form still posts to /api/enquiry as a normal HTML form. */
import { useEffect, useRef, useState } from 'react';
import { attribution, track, trackLead } from '../lib/analytics.js';
import { waLink } from '../lib/markup.js';
import { useSite } from '../lib/SiteContext.js';
import { Action } from './Basics.jsx';

// Parameters from the SEO Tracking Plan. Never send name, phone or free text to analytics.
const PARAMS = {
  requirement: { property_type: 'property_type', budget_band: 'budget' },
  valuation: { area: 'area', property_type: 'property_type' },
  property_check: { country: 'country', property_type: 'property_type', rented_or_vacant: 'rented_or_vacant' },
  video_call: { country: 'country' },
  partner_apply: { area: 'area', years_experience: 'years_experience' },
  shoot_booking: { location: 'location' },
};
function gaParams(type, fields) {
  const p = { form_type: type }, m = PARAMS[type] || {};
  Object.keys(m).forEach((k) => { if (fields[m[k]]) p[k] = String(fields[m[k]]).slice(0, 80); });
  if (type === 'video_call') { try { p.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch (e) {} }
  return p;
}
const validPhone = (v) => { const d = v.replace(/[^\d]/g, ''); return d.length >= 7 && d.length <= 15; };
const SKIP = ['form_type', 'source_page', 'company_website'];

function Control({ f, id, invalid }) {
  const attrs = {
    id,
    name: f.name,
    required: f.required || undefined,
    'aria-required': f.required ? 'true' : undefined,
    autoComplete: f.autocomplete,
    'aria-describedby': f.help ? `${id}-help` : undefined,
    'aria-invalid': invalid ? 'true' : undefined,
  };
  if (f.type === 'select') {
    return (
      <select {...attrs}>
        <option value="">Select…</option>
        {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    );
  }
  if (f.type === 'textarea') return <textarea {...attrs} rows={4}></textarea>;
  if (f.type === 'tel') return <input {...attrs} type="tel" inputMode="tel" />;
  return <input {...attrs} type={f.type || 'text'} />;
}

export function EnquiryForm({ block, page }) {
  const { site, waMsg } = useSite();
  const cfg = block.form;
  const fid = cfg.anchor;
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState(null); // { kind: 'ok' | 'err', body }
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const statusRef = useRef(null);
  const formRef = useRef(null);
  const note = block.note || cfg.note;
  const waHref = cfg.wa ? waLink(site.waNumber, cfg.waMsg || waMsg) : 'https://wa.me/' + site.waNumber;

  useEffect(() => { if (status && statusRef.current) statusRef.current.focus(); }, [status]);

  async function onSubmit(ev) {
    ev.preventDefault();
    if (busy) return;
    const form = formRef.current;
    const name = form.elements.name.value.trim();
    const phone = form.elements.phone.value;
    const errs = {};
    if (!name) errs.name = 'Please enter your name.';
    if (!validPhone(phone)) errs.phone = 'Please enter a valid number. Include your country code if you are outside India.';
    setErrors(errs);
    if (errs.name || errs.phone) { form.elements[errs.name ? 'name' : 'phone'].focus(); return; }

    const fields = {};
    for (const el of form.querySelectorAll('input[name],select[name],textarea[name]')) {
      if (SKIP.includes(el.name)) continue;
      if (el.value.trim()) fields[el.name] = el.value.trim();
    }
    const { utm, referrer } = attribution();
    const payload = {
      form_type: cfg.form_type, source_page: page.path, source_url: location.href,
      referrer, utm, fields,
      company_website: form.elements.company_website.value || '',
      submitted_at: new Date().toISOString(),
    };
    setBusy(true);
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 20000);
    try {
      const r = await fetch('/api/enquiry', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: ctrl.signal });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || j.ok === false) throw new Error('server');
      setSent(true);
      setStatus({
        kind: 'ok',
        body: (
          <><strong>Thank you, {name}.</strong> We have your details and will reply on WhatsApp or by phone{' '}
            {cfg.form_type === 'document_check' ? 'with how to send the documents.' : 'during office hours (10 AM – 7 PM, Monday to Saturday).'}</>
        ),
      });
      try { sessionStorage.setItem('npp_submitted', '1'); } catch (e) {}
      track(cfg.ga_event, gaParams(cfg.form_type, fields));
      trackLead();
    } catch (e) {
      setStatus({
        kind: 'err',
        body: (
          <><strong>We could not send that just now.</strong> Nothing has been lost on your side — please{' '}
            <a href={waHref} target="_blank" rel="noopener">send it to us on WhatsApp</a> or call{' '}
            <a href={`tel:${site.phone}`}>{site.phone.replace('+91', '')}</a>.</>
        ),
      });
    } finally {
      clearTimeout(timer);
      setBusy(false);
    }
  }

  return (
    <>
      <h2>{block.h || cfg.title}</h2>
      <form
        ref={formRef}
        className="formcard"
        id={fid}
        method="post"
        action="/api/enquiry"
        noValidate
        data-form-type={cfg.form_type}
        data-ga-event={cfg.ga_event}
        data-source-page={page.path}
        onSubmit={onSubmit}
      >
        <input type="hidden" name="form_type" value={cfg.form_type} />
        <input type="hidden" name="source_page" value={page.path} />
        <p className="hp" aria-hidden="true"><label>Leave this empty<input type="text" name="company_website" tabIndex={-1} autoComplete="off" /></label></p>
        {cfg.fields.map((f) => {
          const id = `${fid}-${f.name}`;
          const err = errors[f.name];
          return (
            <div key={f.name} className={'field' + (err ? ' has-error' : '')} hidden={sent || undefined}>
              <label htmlFor={id}>{f.label}{f.required && <> <span className="req">required</span></>}</label>
              <Control f={f} id={id} invalid={!!err} />
              {f.help && <span className="help" id={`${id}-help`}>{f.help}</span>}
              {err && <span className="err">{err}</span>}
            </div>
          );
        })}
        <button className="btn btn-bloom btn-full" type="submit" disabled={busy} hidden={sent || undefined}>
          {busy ? 'Sending…' : block.cta || cfg.cta}
        </button>
        <div
          ref={statusRef}
          className={'form-status' + (status ? ' ' + status.kind : '')}
          role="status"
          aria-live="polite"
          hidden={!status}
          tabIndex={status ? -1 : undefined}
        >
          {status && status.body}
        </div>
        {cfg.wa && (
          <>
            <p className="or" hidden={sent || undefined}>or, if it is easier</p>
            <Action a={{ label: cfg.wa, go: 'wa', style: 'wa', msg: cfg.waMsg }} pos="form" full />
          </>
        )}
        {note && <p className="formnote">{note}</p>}
      </form>
    </>
  );
}
