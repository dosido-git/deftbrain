// scripts/lib/standin.js — run the real backend against a stand-in API.
//
// Shared by smoke-tools.js (every endpoint once) and golden-for-push.js
// (replaying a tool's saved answers). The backend is the real server.js with
// the real Anthropic SDK; only ANTHROPIC_BASE_URL points here instead of at
// Anthropic, so the SDK's request building, APIPromise, streaming and retries
// are all exercised. Every key-like environment variable is blanked for the
// child: nothing leaves this machine and nothing is billed.
//
// `pick(body)` returns the text the stand-in answers with (or null for the
// fallback: the largest JSON example found in the prompt itself).

const fs = require('fs');
const path = require('path');
const http = require('http');
const net = require('net');
const { spawn } = require('child_process');

function promptText(body) {
  const parts = [];
  const sys = body.system;
  if (typeof sys === 'string') parts.push(sys);
  else if (Array.isArray(sys)) for (const b of sys) if (b && b.text) parts.push(b.text);
  for (const m of body.messages || []) {
    if (typeof m.content === 'string') parts.push(m.content);
    else if (Array.isArray(m.content)) for (const b of m.content) if (b && b.text) parts.push(b.text);
  }
  return parts.join('\n\n');
}

function largestJsonIn(text) {
  if (typeof text !== 'string') return null;
  let best = null;
  const starts = [];
  for (let i = 0; i < text.length && starts.length < 60; i++) {
    if (text[i] === '{' && (i === 0 || /[\n:]\s*$/.test(text.slice(Math.max(0, i - 4), i)) || /\n/.test(text[i - 1]))) starts.push(i);
  }
  for (const s of starts) {
    let depth = 0, inStr = false, esc = false;
    for (let j = s; j < text.length; j++) {
      const ch = text[j];
      if (inStr) { if (esc) esc = false; else if (ch === '\\') esc = true; else if (ch === '"') inStr = false; continue; }
      if (ch === '"') inStr = true;
      else if (ch === '{') depth++;
      else if (ch === '}' && --depth === 0) {
        const cand = text.slice(s, j + 1);
        try { JSON.parse(cand); if (!best || cand.length > best.length) best = cand; } catch (_) { /* not JSON */ }
        break;
      }
    }
  }
  return best;
}

// Which saved case a model call belongs to: the one whose typed input shows up
// most in the prompt. Replay runs one tool at a time, so the candidates are
// that tool's cases and their inputs differ.
function bestCase(body, cases) {
  const text = promptText(body);
  let best = null, bestScore = 0;
  for (const c of cases) {
    let score = 0;
    const walk = (v) => {
      if (typeof v === 'string') { const t = v.trim(); if (t.length >= 12 && text.includes(t.slice(0, 200))) score += t.length; }
      else if (Array.isArray(v)) v.forEach(walk);
      else if (v && typeof v === 'object') Object.values(v).forEach(walk);
    };
    walk(c.input);
    if (score > bestScore) { best = c; bestScore = score; }
  }
  return best;
}

function startFakeApi(pick, stats = { total: 0, stream: 0 }) {
  const server = http.createServer((req, res) => {
    let raw = '';
    req.on('data', d => { raw += d; });
    req.on('end', () => {
      if (req.method !== 'POST' || !/\/v1\/messages(\?|$)/.test(req.url)) {
        res.writeHead(404, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ type: 'error', error: { type: 'not_found_error', message: 'stand-in: ' + req.url } }));
        return;
      }
      let body = {};
      try { body = JSON.parse(raw); } catch (_) { /* empty */ }
      stats.total++;
      let text = pick(body);
      if (!text) text = largestJsonIn(promptText(body)) || '{"result":"ok"}';
      // Assistant prefill ("{" or similar): the model continues after it.
      const msgs = body.messages || [];
      const last = msgs[msgs.length - 1];
      if (last && last.role === 'assistant') {
        const pre = (typeof last.content === 'string' ? last.content
          : Array.isArray(last.content) ? last.content.map(b => b.text || '').join('') : '').trim();
        if (pre && text.startsWith(pre)) text = text.slice(pre.length);
      }
      const model = body.model || 'claude-standin';
      const usage = { input_tokens: 10, output_tokens: Math.max(1, Math.ceil(text.length / 4)) };
      if (body.stream) {
        stats.stream++;
        res.writeHead(200, { 'content-type': 'text/event-stream', 'request-id': 'req_standin' });
        const ev = (type, data) => res.write(`event: ${type}\ndata: ${JSON.stringify({ type, ...data })}\n\n`);
        ev('message_start', { message: { id: 'msg_standin', type: 'message', role: 'assistant', model, content: [], stop_reason: null, stop_sequence: null, usage: { input_tokens: 10, output_tokens: 1 } } });
        ev('content_block_start', { index: 0, content_block: { type: 'text', text: '' } });
        for (let i = 0; i < text.length; i += 400) ev('content_block_delta', { index: 0, delta: { type: 'text_delta', text: text.slice(i, i + 400) } });
        ev('content_block_stop', { index: 0 });
        ev('message_delta', { delta: { stop_reason: 'end_turn', stop_sequence: null }, usage: { output_tokens: usage.output_tokens } });
        ev('message_stop', {});
        res.end();
        return;
      }
      res.writeHead(200, { 'content-type': 'application/json', 'request-id': 'req_standin' });
      res.end(JSON.stringify({ id: 'msg_standin', type: 'message', role: 'assistant', model, content: [{ type: 'text', text }], stop_reason: 'end_turn', stop_sequence: null, usage }));
    });
  });
  return new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve(server)));
}

function freePort() {
  return new Promise(resolve => {
    const s = net.createServer();
    s.listen(0, '127.0.0.1', () => { const { port } = s.address(); s.close(() => resolve(port)); });
  });
}

function childEnv(backendDir, port, apiPort) {
  const env = { ...process.env };
  // Blank anything that could reach a paid or outward-facing service. dotenv
  // never overrides a variable that is already set, even to ''.
  for (const k of Object.keys(env)) if (/KEY|TOKEN|SECRET|PASSWORD|_URL$/i.test(k)) env[k] = '';
  try {
    for (const line of fs.readFileSync(path.join(backendDir, '.env'), 'utf8').split('\n')) {
      const k = (line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=/) || [])[1];
      if (k) env[k] = '';
    }
  } catch (_) { /* no .env */ }
  return Object.assign(env, {
    PORT: String(port),
    NODE_ENV: 'development',
    ANTHROPIC_API_KEY: 'standin-not-a-key',
    ANTHROPIC_BASE_URL: `http://127.0.0.1:${apiPort}`,
    SURGE_MODE: 'off',
    METRICS_LOG_FILE: '/dev/null',
    GROUNDED_CACHE_PATH: '',
    AUDIT_WATCH: 'off',
    TOOL_ERROR_ALERT_NETWORK: 'off',
  });
}

// Starts backendDir/server.js on a spare port. Resolves { child, port, logs }.
async function startBackend(backendDir, apiPort) {
  const port = await freePort();
  const state = { buf: '' };
  const child = spawn(process.execPath, ['server.js'], { cwd: backendDir, env: childEnv(backendDir, port, apiPort), stdio: ['ignore', 'pipe', 'pipe'] });
  child.stdout.on('data', d => { state.buf += d; });
  child.stderr.on('data', d => { state.buf += d; });
  await new Promise((resolve, reject) => {
    const t0 = Date.now();
    const poll = setInterval(() => {
      if (/startup OK/.test(state.buf)) { clearInterval(poll); resolve(); }
      else if (child.exitCode !== null || Date.now() - t0 > 60000) {
        clearInterval(poll);
        reject(new Error('backend did not start:\n' + state.buf.slice(-2000)));
      }
    }, 200);
  });
  return { child, port, logs: () => state.buf };
}

module.exports = { promptText, largestJsonIn, bestCase, startFakeApi, freePort, startBackend };
