#!/usr/bin/env node
'use strict';
// Starts backend (server/, :3000) and frontend (client/, :5173) together. Ctrl+C stops both.
const path = require('path');
const { spawn } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const procs = [
  ['server', '\x1b[36m'],
  ['client', '\x1b[35m'],
].map(([name, color]) => {
  const p = spawn('npm', ['run', 'dev'], { cwd: path.join(ROOT, name), shell: true, env: process.env });
  const out = (stream) => (chunk) =>
    String(chunk)
      .split(/\r?\n/)
      .filter(Boolean)
      .forEach((line) => stream.write(`${color}[${name}]\x1b[0m ${line}\n`));
  p.stdout.on('data', out(process.stdout));
  p.stderr.on('data', out(process.stderr));
  p.on('exit', (code) => console.log(`[${name}] stopped${code ? ` (exit ${code})` : ''}`));
  return p;
});

console.log('Open http://localhost:5173 for the site (React). The API runs on http://localhost:3000.');
const stop = () => { procs.forEach((p) => p.kill()); process.exit(0); };
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
