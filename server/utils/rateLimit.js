'use strict';
const hits = new Map();
function limited(ip, max = 5, windowMs = 10 * 60 * 1000) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < windowMs);
  if (arr.length >= max) { hits.set(ip, arr); return true; }
  arr.push(now); hits.set(ip, arr); return false;
}
setInterval(() => { const now = Date.now(); for (const [k, v] of hits) if (!v.some((t) => now - t < 600000)) hits.delete(k); }, 600000).unref();
module.exports = { limited };
