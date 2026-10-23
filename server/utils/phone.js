'use strict';
// Normalise to E.164. Bare 10-digit Indian mobiles (6-9 start) get +91. Overseas numbers must carry + or 00.
function normalisePhone(raw, defaultCc = '91') {
  if (typeof raw !== 'string') return null;
  let s = raw.trim().replace(/[^\d+]/g, '');
  if (!s) return null;
  if (s.startsWith('00')) s = '+' + s.slice(2);
  if (s.startsWith('+')) {
    const d = s.slice(1).replace(/\+/g, '');
    return d.length >= 8 && d.length <= 15 && d[0] !== '0' ? '+' + d : null;
  }
  const d = s.replace(/\+/g, '');
  if (d.length === 10 && /^[6-9]/.test(d)) return '+' + defaultCc + d;
  if (d.length === 11 && d[0] === '0' && /^[6-9]/.test(d[1])) return '+' + defaultCc + d.slice(1);
  if (d.length === 12 && d.startsWith('91') && /^[6-9]/.test(d[2])) return '+' + d;
  if (d.length >= 8 && d.length <= 15 && d[0] !== '0') return '+' + d; // assume country code supplied without +
  return null;
}
module.exports = { normalisePhone };
