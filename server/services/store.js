'use strict';
// JSONL file store (default, tested). Mongo adapter used when MONGODB_URI is set and the `mongodb` package is installed (UNTESTED).
const fs = require('fs'); const path = require('path');
const FILE = process.env.STORE_FILE || path.join(__dirname, '..', 'data', 'enquiries.jsonl');
fs.mkdirSync(path.dirname(FILE), { recursive: true });

function fileStore() {
  const readAll = () => (fs.existsSync(FILE) ? fs.readFileSync(FILE, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)) : []);
  const writeAll = (rows) => fs.writeFileSync(FILE, rows.map((r) => JSON.stringify(r)).join('\n') + (rows.length ? '\n' : ''));
  return {
    kind: 'file',
    async insert(doc) { fs.appendFileSync(FILE, JSON.stringify(doc) + '\n'); return doc; },
    async update(id, patch) { const rows = readAll(); const r = rows.find((x) => x.id === id); if (r) Object.assign(r, patch); writeAll(rows); return r; },
    async pending() { return readAll().filter((r) => r.crmStatus !== 'sent'); },
    async all() { return readAll().reverse(); },
  };
}
function mongoStore(uri) {
  let mongodb; try { mongodb = require('mongodb'); } catch { return null; }
  let col; const get = async () => { if (!col) { const c = new mongodb.MongoClient(uri); await c.connect(); col = c.db(process.env.MONGODB_DB || 'npp').collection('enquiries'); } return col; };
  return {
    kind: 'mongo',
    async insert(doc) { await (await get()).insertOne({ ...doc }); return doc; },
    async update(id, patch) { await (await get()).updateOne({ id }, { $set: patch }); },
    async pending() { return (await (await get()).find({ crmStatus: { $ne: 'sent' } }).toArray()); },
    async all() { return (await (await get()).find({}).sort({ createdAt: -1 }).limit(2000).toArray()); },
  };
}
module.exports = (process.env.MONGODB_URI && mongoStore(process.env.MONGODB_URI)) || fileStore();
