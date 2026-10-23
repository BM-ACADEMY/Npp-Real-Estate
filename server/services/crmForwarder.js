'use strict';
const https = require('https'); const http = require('http');
function post(url, body, secret, timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    const u = new URL(url); const lib = u.protocol === 'https:' ? https : http; const data = JSON.stringify(body);
    const req = lib.request(u, { method: 'POST', timeout: timeoutMs, headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data), 'X-NPP-Secret': secret || '' } }, (res) => {
      res.resume(); res.on('end', () => (res.statusCode >= 200 && res.statusCode < 300 ? resolve() : reject(new Error('CRM status ' + res.statusCode))));
    });
    req.on('timeout', () => req.destroy(new Error('CRM timeout'))); req.on('error', reject); req.end(data);
  });
}
async function forward(doc) {
  const url = process.env.N8N_WEBHOOK_URL;
  if (!url) throw new Error('N8N_WEBHOOK_URL not set');
  await post(url, doc, process.env.N8N_SECRET);
}
module.exports = { forward };
