#!/usr/bin/env node
// canned-backend.js — the real backend, answering with saved answers. $0.
//
// For checking what a page DOES (progressive display, tab switches, the
// double-check note, error states) without paying for model calls (owner,
// 2026-10-15: keep test costs down). Answer quality still needs a real run.
//
// It starts the real server.js on :3011 against a stand-in API
// (scripts/lib/standin.js — every key blanked, nothing leaves this machine).
// Each model call is answered with the saved golden answer
// (audit/*-golden-sample.json) whose input best matches the prompt, after a
// delay as if a model wrote it, so parts of a progressive answer land at
// different times. A call no saved case matches gets the largest JSON
// example in its own prompt.
//
//   npm run canned                  start on :3011 (CANNED_PORT to change)
//   CANNED_TOKENS_PER_S=200         simulated writing speed (default 200)
//
// Then point the dev page at it, in the browser console on localhost:3000:
//   localStorage.setItem('db-backend-url', 'http://localhost:3011')   // canned
//   localStorage.removeItem('db-backend-url')                         // back to :3001
// (development builds only — see src/hooks/useClaudeAPI.js).
//
// Every saved answer is a WHOLE answer, so a progressive tool's parts each get
// the whole thing and take their own keys from it; checks get it too and fail
// open. Good enough to see the page work; not a test of the content.

const fs = require('fs');
const path = require('path');
const http = require('http');
const { promptText, largestJsonIn, bestCase, startBackend } = require('./lib/standin');

const ROOT = path.join(__dirname, '..');
const PORT = Number(process.env.CANNED_PORT || 3011);
const SPEED = Number(process.env.CANNED_TOKENS_PER_S || 200);

const cases = [];
for (const f of fs.readdirSync(path.join(ROOT, 'audit'))) {
  if (!/-golden(-sample)?\.json$/.test(f)) continue;
  try {
    for (const c of JSON.parse(fs.readFileSync(path.join(ROOT, 'audit', f), 'utf8')).cases || []) {
      if (c && c.input && c.output) cases.push(c);
    }
  } catch (_) { /* unreadable sample — skip */ }
}

// A multi-step tool asks for different keys at each step (History Today's
// first call wants "picks"), and a saved answer is the finished whole. Keys a
// call asks for that the saved answer lacks are filled from the example in the
// call's own prompt, one-item lists padded to three so "at least two" holds.
const pad = (v) => Array.isArray(v) ? (v.length === 1 ? [v[0], v[0], v[0]] : v).map(pad)
  : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, pad(x)])) : v;
// When no saved input matches (the page's own "Try an example" differs from
// the saved cases), use the saved answer that holds the most of the top-level
// keys the call's prompt asks for — the right tool, near enough.
const askedKeys = (text) => new Set([...text.matchAll(/^ {2}"([a-z_][a-z0-9_]*)":/gm)].map(m => m[1]));
function byKeys(body) {
  const want = askedKeys(promptText(body));
  let best = null, score = 0;
  for (const c of cases) {
    const o = c.output;
    if (!o || typeof o !== 'object' || Array.isArray(o)) continue;
    const n = Object.keys(o).filter(k => want.has(k)).length;
    if (n > score) { best = c; score = n; }
  }
  return best;
}
function answerFor(body) {
  let c = bestCase(body, cases);
  // A text match on a common word can land on another tool's case; if that
  // case has none of the keys this call asks for, match by keys instead.
  const want = askedKeys(promptText(body));
  const has = (x) => x && x.output && typeof x.output === 'object' && Object.keys(x.output).some(k => want.has(k));
  if (!c || (want.size && !has(c))) c = byKeys(body) || c;
  let example = null;
  try { example = JSON.parse(largestJsonIn(promptText(body)) || 'null'); } catch (_) { /* none */ }
  if (!c) return JSON.stringify(example ? pad(example) : { result: 'ok' });
  const saved = c.output;
  if (!example || typeof example !== 'object' || Array.isArray(example)) return JSON.stringify(saved);
  return JSON.stringify({ ...pad(example), ...saved });
}

const api = http.createServer((req, res) => {
  let raw = '';
  req.on('data', d => { raw += d; });
  req.on('end', () => {
    if (req.method !== 'POST' || !/\/v1\/messages(\?|$)/.test(req.url)) {
      res.writeHead(404, { 'content-type': 'application/json' });
      return res.end(JSON.stringify({ type: 'error', error: { type: 'not_found_error', message: 'canned: ' + req.url } }));
    }
    let body = {};
    try { body = JSON.parse(raw); } catch (_) { /* empty */ }
    const text = answerFor(body);
    const outTokens = Math.max(1, Math.ceil(text.length / 4));
    // As if written at SPEED tokens/s, capped by the call's own max_tokens.
    const ms = Math.round(1000 * Math.min(outTokens, body.max_tokens || outTokens) / SPEED);
    setTimeout(() => {
      res.writeHead(200, { 'content-type': 'application/json', 'request-id': 'req_canned' });
      res.end(JSON.stringify({ id: 'msg_canned', type: 'message', role: 'assistant', model: body.model || 'canned', content: [{ type: 'text', text }], stop_reason: 'end_turn', stop_sequence: null, usage: { input_tokens: 10, output_tokens: outTokens } }));
    }, ms);
  });
});

api.listen(0, '127.0.0.1', async () => {
  const apiPort = api.address().port;
  try {
    const { child } = await startBackend(path.join(ROOT, 'backend'), apiPort, PORT);
    child.stdout.on('data', d => process.stdout.write(d));
    child.stderr.on('data', d => process.stderr.write(d));
    console.log(`canned backend on http://localhost:${PORT} — ${cases.length} saved answers, ~${SPEED} tokens/s, $0. Ctrl-C to stop.`);
    const stop = () => { child.kill(); api.close(); process.exit(0); };
    process.on('SIGINT', stop); process.on('SIGTERM', stop);
    child.on('exit', code => { console.log(`backend exited (${code})`); api.close(); process.exit(code || 0); });
  } catch (err) {
    console.error(err.message);
    api.close();
    process.exit(1);
  }
});
