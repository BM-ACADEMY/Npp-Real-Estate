'use strict';
const crypto = require('crypto');
const store = require('./store'); const crm = require('./crmForwarder'); const { normalisePhone } = require('../utils/phone');
const FORM_TYPES = ['requirement','document_check','valuation','property_check','video_call','project_enquiry','partner_apply','shoot_booking','general_enquiry'];
const clip = (v, n = 1000) => String(v == null ? '' : v).replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, n);

function validate(p) {
  if (!p || typeof p !== 'object') return { error: 'Invalid request' };
  if (!FORM_TYPES.includes(p.form_type)) return { error: 'Unknown form' };
  const f = p.fields && typeof p.fields === 'object' ? p.fields : {};
  const name = clip(f.name, 120); const phone = normalisePhone(clip(f.phone, 40));
  if (!name) return { error: 'Name is required' };
  if (!phone) return { error: 'A valid phone number is required' };
  return { name, phone, f };
}
async function handle(payload, ctx) {
  const v = validate(payload);
  if (v.error) return { status: 400, body: { ok: false, error: v.error } };
  const { name, phone, f } = v;
  const fields = {}; for (const [k, val] of Object.entries(f)) if (k !== 'name' && k !== 'phone') fields[clip(k, 40)] = clip(val, 2000);
  const doc = {
    id: 'ENQ-' + Date.now().toString(36).toUpperCase() + '-' + crypto.randomBytes(2).toString('hex').toUpperCase(),
    createdAt: new Date().toISOString(), form_type: payload.form_type, source_page: clip(payload.source_page, 200),
    source_url: clip(payload.source_url, 500), referrer: clip(payload.referrer, 500),
    utm: { source: clip(payload.utm && payload.utm.source, 100), medium: clip(payload.utm && payload.utm.medium, 100), campaign: clip(payload.utm && payload.utm.campaign, 100) },
    name, phone, fields, ip: ctx.ip, crmStatus: 'pending', crmAttempts: 0,
  };
  await store.insert(doc);                       // 1. store first — a lead is never lost
  try { await crm.forward(doc); await store.update(doc.id, { crmStatus: 'sent', crmAttempts: 1 }); }
  catch (e) { await store.update(doc.id, { crmStatus: 'failed', crmAttempts: 1, crmError: String(e.message).slice(0, 200) });
    return { status: 502, body: { ok: false, error: 'Could not reach our team system. Please use WhatsApp.', id: doc.id } }; }
  return { status: 200, body: { ok: true, id: doc.id } };
}
async function retryPending() {
  for (const d of await store.pending()) {
    if ((d.crmAttempts || 0) >= 20) continue;
    try { await crm.forward(d); await store.update(d.id, { crmStatus: 'sent', crmAttempts: (d.crmAttempts || 0) + 1 }); }
    catch (e) { await store.update(d.id, { crmAttempts: (d.crmAttempts || 0) + 1, crmError: String(e.message).slice(0, 200) }); }
  }
}
module.exports = { handle, retryPending, validate };
