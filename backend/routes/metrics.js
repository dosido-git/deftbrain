const express = require('express');
const router = express.Router();
const { rateLimit } = require('../lib/rateLimiter');
const fs = require('fs');
const nodePath = require('path');
const geoip = require('geoip-lite');
const crypto = require('crypto');
function keyMatches(provided, expected) {
  if (!expected || typeof provided !== 'string') return false;
  const a = Buffer.from(provided), b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function requestIp(req) {
  // req.ip is derived from the trusted proxy hop (server.js `trust proxy`),
  // not the spoofable leftmost X-Forwarded-For value.
  return req.ip || req.connection?.remoteAddress || null;
}

// Derive a coarse location ("City, Region, Country" — as available) from the
// request IP AT WRITE TIME, then discard the IP. Offline lookup (geoip-lite
// ships its own bundled database) — no third-party network call, consistent
// with this file's "owned, no third party" analytics stance. Never store the
// raw IP itself, only the derived string.
function locationOf(req) {
  try {
    const ip = requestIp(req);
    if (!ip) return undefined;
    const geo = geoip.lookup(ip); // null for private/local/unresolvable IPs
    if (!geo) return undefined;
    const parts = [geo.city, geo.region, geo.country].filter(Boolean);
    return parts.length ? parts.join(', ') : undefined;
  } catch (_) {
    return undefined; // never let a lookup failure break the request
  }
}

// Operator self-exclusion — comma-separated list of IPs (e.g. home/office/VPN)
// whose traffic should never be counted, so dashboard numbers reflect only
// real visitors. Set via Railway env var; unset = nothing excluded. Checked
// before any logMetric call, so excluded traffic leaves no trace at all
// (not just hidden in the report).
const EXCLUDED_IPS = (process.env.METRICS_EXCLUDE_IPS || '')
  .split(',').map(s => s.trim()).filter(Boolean);

// Known bots / crawlers / uptime monitors — their hits are noise, not users.
const BOT_UA = /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|embedly|quora link preview|pinterest|redditbot|whatsapp|telegrambot|discordbot|semrush|ahrefs|mj12|dotbot|petalbot|dataforseo|headlesschrome|python-requests|curl|wget|go-http|axios|node-fetch|uptime|monitor|pingdom|statuscake|gtmetrix|lighthouse|inspectiontool/i;

function isExcluded(req) {
  // Bot / crawler / monitor traffic — never counts.
  const ua = req.headers['user-agent'] || '';
  if (!ua || BOT_UA.test(ua)) return true;
  // Self-exclusion by IP (METRICS_EXCLUDE_IPS).
  if (EXCLUDED_IPS.length) {
    const ip = requestIp(req);
    if (ip && EXCLUDED_IPS.includes(ip)) return true;
  }
  return false;
}

// ════════════════════════════════════════════════════════════
// METRICS — lightweight, owned, privacy-clean validation signal.
//
// Two endpoints capture the only things we need at validation stage:
//   POST /api/events    — funnel beacons (page_view, tool_view, tool_run,
//                         tool_complete) so we can see drop-off.
//   POST /api/feedback  — explicit "did this help?" with an optional note,
//                         the highest-signal evidence that a tool addresses a
//                         real concern.
//
// Storage: each record is written two ways — (1) a structured one-line JSON to
// stdout (grep `METRIC`), which on Railway lands in the captured logs (the durable
// prod sink); and (2) appended as JSONL to a local file (default <repo>/metrics.jsonl,
// override with METRICS_LOG_FILE) so you can read it directly — `tail -f metrics.jsonl`.
// The file persists in local dev; on Railway the filesystem is ephemeral (wiped each
// deploy), so stdout remains the prod sink there. Owned, no third party, no cookies,
// no PII. Deliberately right-sized for a validation probe; when traffic earns it, swap
// `logMetric` for a durable store — the rest of the app never changes because every
// metric funnels through that one call.
// ════════════════════════════════════════════════════════════

// Lenient — these are tiny fire-and-forget beacons, NOT token-spending LLM calls.
const METRIC_LIMITS = { perMinute: 60, perDay: 5000 };

// Local append-only sink. Defaults to repo root; override with METRICS_LOG_FILE.
const LOG_FILE = process.env.METRICS_LOG_FILE
  || nodePath.join(__dirname, '..', '..', 'metrics.jsonl');

function logMetric(kind, data) {
  const line = JSON.stringify({ kind, ...data, at: new Date().toISOString() });
  // Never throw into the request path; both sinks are best-effort.
  try { console.log('METRIC ' + line); } catch (_) { /* noop */ }
  try { fs.appendFile(LOG_FILE, line + '\n', () => {}); } catch (_) { /* noop */ }
}

// Funnel events. Body: { event, ...props } (path/ts added client-side).
router.post('/events', rateLimit(METRIC_LIMITS, 'metrics:'), (req, res) => {
  if (isExcluded(req)) return res.status(204).end();
  const { event, path, props, ref, sawGuide } = req.body || {};
  if (!event || typeof event !== 'string') return res.status(204).end();
  // One location per session (on the new-session page_view), not per event —
  // matches how `sessions`/`returning` are already scoped in the report below.
  const location = (event === 'page_view' && props && props.newSession) ? locationOf(req) : undefined;
  logMetric('event', {
    event: event.slice(0, 60),
    path,
    props,
    ...(ref ? { ref: String(ref).slice(0, 120) } : {}),
    ...(sawGuide === true ? { sawGuide: true } : {}),
    ...(location ? { location } : {}),
  });
  return res.status(204).end();
});

// Explicit feedback. Body: { tool, helpful, comment, path }.
router.post('/feedback', rateLimit(METRIC_LIMITS, 'metrics:'), (req, res) => {
  if (isExcluded(req)) return res.status(204).end();
  const { tool, helpful, comment, path } = req.body || {};
  logMetric('feedback', {
    tool: (tool || 'unknown').toString().slice(0, 60),
    helpful: helpful === true || helpful === 'yes',
    comment: (comment || '').toString().slice(0, 500),
    path,
  });
  return res.status(204).end();
});


// Tool-idea capture ("No tool for your problem? Describe it — we build fast.").
// Always logged to the sink (kind: 'idea', surfaced in the report). Also sent
// as an email to hello@deftbrain.com when RESEND_API_KEY is set — same
// graceful-degradation pattern as the newsletter: the feature works without
// the key, the email just doesn't fire. Tight limits: humans submit once.
const IDEA_LIMITS = { perMinute: 3, perDay: 10 };
router.post('/idea', rateLimit(IDEA_LIMITS, 'idea:'), (req, res) => {
  if (isExcluded(req)) return res.status(204).end();
  const { problem, source, query, path } = req.body || {};
  const text = (problem || '').toString().trim().slice(0, 1000);
  if (!text) return res.status(400).json({ error: 'Describe the problem first.' });
  logMetric('idea', {
    problem: text,
    source: (source || 'unknown').toString().slice(0, 60),
    query: (query || '').toString().slice(0, 200),
    path: (path || '').toString().slice(0, 200),
  });
  // Best-effort email — never blocks or fails the request.
  const key = process.env.RESEND_API_KEY;
  if (key) {
    fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.IDEA_EMAIL_FROM || 'DeftBrain Ideas <ideas@deftbrain.com>',
        to: ['hello@deftbrain.com'],
        subject: `💡 Tool idea (${(source || 'site').toString().slice(0, 40)})`,
        text: `Problem described:\n${text}\n\nSearch query: ${query || '—'}\nSource: ${source || '—'}\nPath: ${path || '—'}`,
      }),
    }).catch(err => console.error('[idea-email] send failed:', err.message));
  }
  return res.status(204).end();
});


// ════════════════════════════════════════════════════════════
// METRICS REPORT — the dashboard, as easy as opening a web page.
//
// GET /api/metrics/report?key=<METRICS_KEY>
// Renders a self-contained HTML page (inline SVG charts, no external assets)
// aggregated from the JSONL sink. Guarded by the METRICS_KEY env var; if the
// var is unset the route 404s — safe by default.
//
// NOTE Railway's filesystem is ephemeral: without a volume mounted at
// METRICS_LOG_FILE's directory, the report covers "since last deploy" (stdout
// METRIC lines remain the backup sink either way).
// ════════════════════════════════════════════════════════════

function readMetrics() {
  try {
    const raw = fs.readFileSync(LOG_FILE, 'utf8');
    return raw.split('\n').filter(Boolean).map(l => { try { return JSON.parse(l); } catch (_) { return null; } }).filter(Boolean);
  } catch (_) { return []; }
}

function escH(x) { return String(x).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function pct(n, d) { return d ? Math.round((n / d) * 100) + '%' : '—'; }

// Tiny inline-SVG dual line chart (views + runs per day).
function lineChart(days) {
  const W = 720, H = 160, P = 28;
  const max = Math.max(1, ...days.map(d => Math.max(d.views, d.runs)));
  const x = i => P + (days.length < 2 ? 0 : (i * (W - 2 * P)) / (days.length - 1));
  const y = v => H - P - (v * (H - 2 * P)) / max;
  const pts = k => days.map((d, i) => `${x(i).toFixed(1)},${y(d[k]).toFixed(1)}`).join(' ');
  const labels = days.map((d, i) => (i === 0 || i === days.length - 1 || i === Math.floor(days.length / 2))
    ? `<text x="${x(i)}" y="${H - 8}" font-size="10" text-anchor="middle" fill="#888">${d.day.slice(5)}</text>` : '').join('');
  return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;max-width:${W}px">
    <text x="${P}" y="14" font-size="10" fill="#888">max ${max}</text>
    <polyline points="${pts('views')}" fill="none" stroke="#2c4a6e" stroke-width="2"/>
    <polyline points="${pts('runs')}" fill="none" stroke="#c8872e" stroke-width="2"/>
    ${labels}
    <text x="${W - P}" y="14" font-size="10" text-anchor="end"><tspan fill="#2c4a6e">— views</tspan>  <tspan fill="#c8872e">— runs</tspan></text>
  </svg>`;
}

function barRow(label, value, max, extra) {
  const w = max ? Math.max(1, Math.round((value / max) * 100)) : 0;
  return `<tr><td>${escH(label)}</td><td style="width:50%"><div style="background:#2c4a6e;height:12px;width:${w}%;border-radius:2px"></div></td><td>${value}</td><td>${extra || ''}</td></tr>`;
}

// ════════════════════════════════════════════════════════════
// GET /api/metrics — the clickable dashboard shell.
//
// A tiny PUBLIC page (it holds NO data — the report fetch below is still
// key-gated). It has a key field; the key is kept in THIS browser's
// localStorage, never in a URL or referrer. Because the page is same-origin
// with /api/metrics/report, its fetch() can set the x-metrics-key header —
// which a plain browser navigation cannot. The report renders inside an
// iframe (srcdoc) so its styles stay isolated.
//
// Visit: https://deftbrain.com/api/metrics
// ════════════════════════════════════════════════════════════
router.get('/metrics', rateLimit(METRIC_LIMITS, 'metrics-dash:'), (req, res) => {
  res.type('html').send(`<!DOCTYPE html><html><head><meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="robots" content="noindex,nofollow">
  <title>DeftBrain metrics</title>
  <style>
    *{box-sizing:border-box}
    body{margin:0;font-family:system-ui,sans-serif;background:#f8f7f4;color:#222}
    header{display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding:10px 16px;background:#1a2e44;color:#fff;position:sticky;top:0;z-index:2}
    header b{font-size:14px;margin-right:6px}
    input[type=password]{padding:6px 10px;border:1px solid #ccc;border-radius:6px;font-size:13px;min-width:220px}
    button{padding:6px 12px;border:0;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer;background:#c8872e;color:#fff}
    button.ghost{background:transparent;color:#cbd5e1;font-weight:400}
    select{padding:6px 10px;border:1px solid #ccc;border-radius:6px;font-size:13px;background:#fff;color:#222;cursor:pointer}
    label{font-size:12px;color:#cbd5e1;display:flex;gap:4px;align-items:center;cursor:pointer}
    #msg{font-size:12px;margin-left:auto;color:#cbd5e1}
    iframe{width:100%;border:0;display:block;height:calc(100vh - 52px)}
    #login{padding:48px 16px;text-align:center;color:#666;font-size:14px}
  </style></head><body>
  <header>
    <b>📊 DeftBrain metrics</b>
    <input id="key" type="password" placeholder="metrics key" autocomplete="off" spellcheck="false">
    <label><input id="remember" type="checkbox" checked> remember</label>
    <select id="range" onchange="onRange()">
      <option value="7d">Past week</option>
      <option value="14d">Past 2 weeks</option>
      <option value="30d" selected>Past month</option>
      <option value="90d">Past 3 months</option>
      <option value="all">All time</option>
    </select>
    <button onclick="load()">Load</button>
    <button class="ghost" onclick="reset()">reset baseline</button>
    <button class="ghost" onclick="forget()">forget key</button>
    <span id="msg"></span>
  </header>
  <div id="login">Enter your metrics key above and click <b>Load</b>.</div>
  <iframe id="report" title="metrics report" style="display:none"></iframe>
  <script>
    var K='dbMetricsKey', RK='dbMetricsRange';
    var keyEl=document.getElementById('key');
    var rem=document.getElementById('remember');
    var rangeEl=document.getElementById('range');
    var msg=document.getElementById('msg');
    var frame=document.getElementById('report');
    var login=document.getElementById('login');
    function say(t,ok){msg.style.color=ok?'#86efac':'#fca5a5';msg.textContent=t;}
    function onRange(){localStorage.setItem(RK,rangeEl.value);if(keyEl.value.trim())load();}
    function forget(){localStorage.removeItem(K);keyEl.value='';frame.style.display='none';login.style.display='block';login.textContent='Key forgotten. Enter it again to view.';msg.textContent='';}
    function load(){
      var k=keyEl.value.trim();
      if(!k){say('enter a key');return;}
      msg.style.color='#cbd5e1';msg.textContent='loading\\u2026';
      localStorage.setItem(RK,rangeEl.value);
      fetch('/api/metrics/report?range='+encodeURIComponent(rangeEl.value),{headers:{'x-metrics-key':k}}).then(function(r){
        if(r.status===200)return r.text();
        if(r.status===404)throw new Error('key rejected');
        throw new Error('error '+r.status);
      }).then(function(html){
        if(rem.checked)localStorage.setItem(K,k);else localStorage.removeItem(K);
        frame.srcdoc=html;frame.style.display='block';login.style.display='none';say('loaded',true);
      }).catch(function(e){
        frame.style.display='none';login.style.display='block';login.textContent='Could not load: '+e.message;say(e.message);
      });
    }
    function reset(){
      var k=keyEl.value.trim();
      if(!k){say('enter a key');return;}
      if(!confirm('Archive current data and start a fresh baseline? Nothing is deleted \\u2014 the old data is kept as an archive file.'))return;
      fetch('/api/metrics/reset',{method:'POST',headers:{'x-metrics-key':k}}).then(function(r){
        if(r.status===404)throw new Error('key rejected');
        return r.json();
      }).then(function(j){say(j.ok?'baseline reset':'reset failed',!!j.ok);if(j.ok)load();}).catch(function(e){say(e.message);});
    }
    keyEl.addEventListener('keydown',function(e){if(e.key==='Enter')load();});
    var savedR=localStorage.getItem(RK);
    if(savedR)rangeEl.value=savedR;
    var saved=localStorage.getItem(K);
    if(saved){keyEl.value=saved;load();}
  </script>
  </body></html>`);
});

router.get('/metrics/report', rateLimit(METRIC_LIMITS, 'metrics-report:'), (req, res) => {
  const KEY = process.env.METRICS_KEY;
  if (!keyMatches(req.get('x-metrics-key'), KEY)) return res.status(404).end();
  try {
    // ── time-range filter (query param; key stays in the header) ──
    const RANGE_DAYS = { '7d': 7, '14d': 14, '30d': 30, '90d': 90 };
    const rangeParam = RANGE_DAYS[req.query.range] ? String(req.query.range)
      : (req.query.range === 'all' ? 'all' : '30d'); // default: past month
    const rangeDays = RANGE_DAYS[rangeParam] || null;
    const rangeText = { '7d': 'past week', '14d': 'past 2 weeks', '30d': 'past month', '90d': 'past 3 months', all: 'all time' }[rangeParam];

    const allRows = readMetrics();
    const cutoffISO = rangeDays ? new Date(Date.now() - rangeDays * 86400000).toISOString() : null;
    const rows = cutoffISO ? allRows.filter(r => (r.at || '') >= cutoffISO) : allRows;
    const events = rows.filter(r => r.kind === 'event');
    const feedback = rows.filter(r => r.kind === 'feedback');
    const ideas = rows.filter(r => r.kind === 'idea');
    const toolOf = r => (r.props && r.props.tool) || (r.path || '').split('/')[1] || '?';

    // Sink health — logMetric's file writes are deliberately silent-on-error
    // (logging must never break a request), so surface here whether the sink
    // is writable. Catches a Railway volume mounted with wrong permissions,
    // which would otherwise lose the file sink silently.
    let sinkStatus;
    try {
      fs.accessSync(nodePath.dirname(LOG_FILE), fs.constants.W_OK);
      const st = fs.existsSync(LOG_FILE) ? fs.statSync(LOG_FILE) : null;
      sinkStatus = {
        ok: true,
        detail: st
          ? `writable · ${Math.max(1, Math.round(st.size / 1024))} KB · oldest record ${((allRows[0] && allRows[0].at) || '').slice(0, 10) || '—'}`
          : 'writable · file not created yet (no events since this deploy)',
      };
    } catch (_) {
      sinkStatus = { ok: false, detail: 'NOT WRITABLE — file sink is losing events (stdout METRIC lines still captured in Railway logs)' };
    }

    // ── daily series ──
    const byDay = {};
    for (const e of events) {
      const day = (e.at || '').slice(0, 10); if (!day) continue;
      byDay[day] = byDay[day] || { day, views: 0, runs: 0, sessions: 0 };
      if (e.event === 'page_view') { byDay[day].views++; if (e.props && e.props.newSession) byDay[day].sessions++; }
      if (e.event === 'tool_run') byDay[day].runs++;
    }
    const days = Object.values(byDay).sort((a, b) => a.day.localeCompare(b.day)).slice(-90);

    // ── headline ──
    const pv = events.filter(e => e.event === 'page_view');
    const sessions = pv.filter(e => e.props && e.props.newSession);
    const returningSessions = sessions.filter(e => e.props.returning);
    const runs = events.filter(e => e.event === 'tool_run');
    const completes = events.filter(e => e.event === 'tool_complete');
    const errors = events.filter(e => e.event === 'tool_error');
    const taken = events.filter(e => ['print', 'copy', 'share'].includes(e.event));
    const helpfulYes = feedback.filter(f => f.helpful).length;

    // ── per tool ──
    const tools = {};
    const bump = (t, k, n) => { tools[t] = tools[t] || { views: 0, runs: 0, completes: 0, errors: 0, taken: 0, yes: 0, no: 0, ms: [] }; tools[t][k] += (n == null ? 1 : n); };
    for (const e of pv) { const seg = (e.path || '').split('/')[1]; if (seg && /^[A-Z]/.test(seg)) bump(seg, 'views'); }
    for (const e of runs) bump(toolOf(e), 'runs');
    for (const e of completes) { const t = toolOf(e); bump(t, 'completes'); if (e.props && e.props.ms) tools[t].ms.push(e.props.ms); }
    for (const e of errors) bump(toolOf(e), 'errors');
    for (const e of taken) { const seg = (e.path || '').split('/')[1]; if (seg && /^[A-Z]/.test(seg)) bump(seg, 'taken'); }
    for (const f of feedback) bump(f.tool || '?', f.helpful ? 'yes' : 'no');
    const toolRows = Object.entries(tools).sort((a, b) => b[1].runs - a[1].runs).slice(0, 40)
      .map(([t, v]) => {
        const avgMs = v.ms.length ? Math.round(v.ms.reduce((a, b) => a + b, 0) / v.ms.length / 100) / 10 : null;
        return `<tr><td>${escH(t)}</td><td>${v.views}</td><td>${v.runs}</td><td>${pct(v.runs, v.views)}</td><td>${v.completes}</td><td>${v.errors}</td><td>${avgMs != null ? avgMs + 's' : '—'}</td><td>${v.taken}</td><td>${v.yes + v.no ? pct(v.yes, v.yes + v.no) : '—'}</td></tr>`;
      }).join('');

    // ── sources (session-scoped ref context) ──
    const srcSessions = {}, srcRuns = {};
    for (const e of sessions) { const r = (e.props && e.props.ref) || e.ref || 'direct'; srcSessions[r] = (srcSessions[r] || 0) + 1; }
    for (const e of runs) { const r = e.ref || 'direct'; srcRuns[r] = (srcRuns[r] || 0) + 1; }
    const srcMax = Math.max(1, ...Object.values(srcSessions));
    const srcRows = Object.entries(srcSessions).sort((a, b) => b[1] - a[1]).slice(0, 15)
      .map(([r, n]) => barRow(r, n, srcMax, `${srcRuns[r] || 0} runs`)).join('');

    // ── guide→tool crossover + locale + recency ──
    const runsFromGuides = runs.filter(e => e.sawGuide).length;
    const langs = {};
    for (const e of sessions) { const l = (e.props && e.props.lang) || '?'; langs[l] = (langs[l] || 0) + 1; }
    const langRows = Object.entries(langs).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([l, n]) => `<tr><td>${escH(l)}</td><td>${n}</td></tr>`).join('');
    const buckets = {};
    for (const e of returningSessions) { const b = e.props.bucket || '?'; buckets[b] = (buckets[b] || 0) + 1; }

    // ── locations (session-scoped, derived server-side from IP at write time — see locationOf) ──
    const locs = {};
    for (const e of sessions) { const l = e.location; if (l) locs[l] = (locs[l] || 0) + 1; }
    const locMax = Math.max(1, ...Object.values(locs));
    const locRows = Object.entries(locs).sort((a, b) => b[1] - a[1]).slice(0, 20)
      .map(([l, n]) => barRow(l, n, locMax)).join('');
    const locKnown = Object.values(locs).reduce((a, b) => a + b, 0);
    const ideaRows = ideas.slice(-50).reverse().map(r =>
      `<tr><td>${escH(r.problem || '')}</td><td>${escH(r.source || '')}</td><td>${escH(r.query || '')}</td><td style="white-space:nowrap">${escH((r.at || '').slice(0, 10))}</td></tr>`
    ).join('');

    const fbRows = feedback.slice(-25).reverse().map(f =>
      `<tr><td>${escH(f.tool || '?')}</td><td>${f.helpful ? '👍' : '👎'}</td><td>${escH(f.comment || '')}</td><td style="white-space:nowrap">${escH((f.at || '').slice(0, 10))}</td></tr>`).join('');

    const card = (label, value, sub) => `<div style="background:#fff;border:1px solid #e5e2da;border-radius:10px;padding:14px 18px;min-width:130px"><div style="font-size:26px;font-weight:700;color:#1a2e44">${value}</div><div style="font-size:12px;color:#666">${label}${sub ? `<br><span style="color:#999">${sub}</span>` : ''}</div></div>`;

    res.type('html').send(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>DeftBrain metrics</title>
    <meta name="robots" content="noindex,nofollow">
    <style>body{font-family:system-ui,sans-serif;background:#f8f7f4;color:#222;margin:0;padding:24px;max-width:960px;margin:auto}
    h1{font-size:20px} h2{font-size:15px;margin:28px 0 8px;color:#1a2e44}
    table{width:100%;border-collapse:collapse;background:#fff;border:1px solid #e5e2da;border-radius:8px;font-size:13px}
    th,td{text-align:left;padding:6px 10px;border-bottom:1px solid #f0ede6} th{background:#faf8f5;font-weight:600}
    .cards{display:flex;gap:12px;flex-wrap:wrap}</style></head><body>
    <h1>DeftBrain metrics <span style="font-weight:400;font-size:13px;color:#888">${events.length} events · ${escH(rangeText)}${rows.length ? ' · ' + escH((rows[0].at || '').slice(0, 10)) + ' → today' : ' · no data in this range'}</span></h1>
    <p style="font-size:11px;color:${sinkStatus.ok ? '#888' : '#b91c1c'};margin:2px 0 0">sink: <code>${escH(LOG_FILE)}</code> · ${escH(sinkStatus.detail)}</p>
    <p style="font-size:11px;color:#888;margin:2px 0 0">self-exclusion: ${EXCLUDED_IPS.length ? `${EXCLUDED_IPS.length} IP(s) excluded — your own visits aren't counted` : 'none set — set METRICS_EXCLUDE_IPS to stop counting your own visits'}</p>
    <div class="cards">
      ${card('page views', pv.length)}
      ${card('sessions', sessions.length)}
      ${card('return visitors', returningSessions.length, pct(returningSessions.length, sessions.length) + ' of sessions')}
      ${card('tool runs', runs.length, pct(completes.length, runs.length) + ' complete')}
      ${card('took it with them', taken.length, 'print + copy + share')}
      ${card('helpful', helpfulYes + '/' + feedback.length)}
    </div>
    <h2>Daily trend <span style="font-weight:400;font-size:12px;color:#888">(${escH(rangeText)})</span></h2>${days.length ? lineChart(days) : '<p style="color:#888">No data yet.</p>'}
    <h2>Tools</h2>
    <table><tr><th>tool</th><th>views</th><th>runs</th><th>view→run</th><th>completes</th><th>errors</th><th>avg time</th><th>took it</th><th>helpful</th></tr>${toolRows || '<tr><td colspan=9 style="color:#888">No data yet.</td></tr>'}</table>
    <h2>Sources (sessions · runs attributed)</h2>
    <p style="font-size:11px;color:#888;margin:0 0 6px">Referring hostname, or an explicit <code>?ref=name</code> / <code>?utm_source=name</code> on the link (survives referrers stripped by Slack/email/in-app browsers). "direct" = no referrer and no param — typed/bookmarked, or a stripped source.</p>
    <table>${srcRows || '<tr><td style="color:#888">No data yet.</td></tr>'}</table>
    <h2>Guide → tool crossover</h2>
    <p>${runsFromGuides} of ${runs.length} tool runs (${pct(runsFromGuides, runs.length)}) came from sessions that read a guide first.</p>
    <h2>Return visitors <span style="font-weight:400;font-size:12px;color:#888">— a "return" is this browser (localStorage), not a verified unique person; no cross-device or persistent ID is used</span></h2>
    <p>${returningSessions.length} of ${sessions.length} sessions (${pct(returningSessions.length, sessions.length)}) were returning.</p>
    <table><tr><th>recency</th><th>sessions</th></tr>${Object.entries(buckets).sort((a, b) => b[1] - a[1]).map(([b, n]) => `<tr><td>${escH(b)}</td><td>${n}</td></tr>`).join('') || '<tr><td colspan=2 style="color:#888">No data yet.</td></tr>'}</table>
    <h2>Locations (sessions)</h2>
    <p style="font-size:11px;color:#888;margin:0 0 6px">Derived from IP at write time (offline lookup, no third-party call); the IP itself is discarded, never stored. ${locKnown}/${sessions.length} sessions resolved.</p>
    <table>${locRows || '<tr><td style="color:#888">No data yet.</td></tr>'}</table>
    <h2>Languages (sessions)</h2><table>${langRows || '<tr><td style="color:#888">No data yet.</td></tr>'}</table>
    <h2>Recent feedback</h2>
    <table><tr><th>tool</th><th></th><th>comment</th><th>date</th></tr>${fbRows || '<tr><td colspan=4 style="color:#888">None yet.</td></tr>'}</table>

    <h2>Tool ideas${ideas.length ? ` (${ideas.length})` : ''}</h2>
    <table><tr><th>problem</th><th>source</th><th>query</th><th>date</th></tr>${ideaRows || '<tr><td colspan=4 style="color:#888">None yet.</td></tr>'}</table>
    </body></html>`);
  } catch (err) {
    console.error('metrics report failed:', err.message);
    return res.status(500).send('Report generation failed.');
  }
});

// POST /api/metrics/reset?key=<METRICS_KEY>
// Archives the current sink (rename with a date stamp) and starts a fresh one —
// nothing is deleted; the archive stays on the volume for recovery. Added when
// the first two weeks of data were mostly self-traffic (pre-METRICS_EXCLUDE_IPS)
// and a clean baseline was wanted for real-traffic measurement.
router.post('/metrics/reset', rateLimit(METRIC_LIMITS, 'metrics-reset:'), (req, res) => {
  const KEY = process.env.METRICS_KEY;
  if (!keyMatches(req.get('x-metrics-key'), KEY)) return res.status(404).end();
  try {
    if (!fs.existsSync(LOG_FILE)) {
      return res.json({ ok: true, archived: null, note: 'sink was already empty' });
    }
    const stamp = new Date().toISOString().slice(0, 10);
    let archive = `${LOG_FILE}.archived-${stamp}`;
    let n = 1;
    while (fs.existsSync(archive)) archive = `${LOG_FILE}.archived-${stamp}.${n++}`;
    fs.renameSync(LOG_FILE, archive);
    res.json({ ok: true, archived: archive });
  } catch (err) {
    console.error('[metrics-reset]', err);
    res.status(500).json({ error: 'Reset failed: ' + err.message });
  }
});

module.exports = router;
