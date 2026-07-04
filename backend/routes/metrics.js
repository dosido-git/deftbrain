const express = require('express');
const router = express.Router();
const { rateLimit } = require('../lib/rateLimiter');
const fs = require('fs');
const nodePath = require('path');

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
  const { event, path, props, ref, sawGuide } = req.body || {};
  if (!event || typeof event !== 'string') return res.status(204).end();
  logMetric('event', {
    event: event.slice(0, 60),
    path,
    props,
    ...(ref ? { ref: String(ref).slice(0, 120) } : {}),
    ...(sawGuide === true ? { sawGuide: true } : {}),
  });
  return res.status(204).end();
});

// Explicit feedback. Body: { tool, helpful, comment, path }.
router.post('/feedback', rateLimit(METRIC_LIMITS, 'metrics:'), (req, res) => {
  const { tool, helpful, comment, path } = req.body || {};
  logMetric('feedback', {
    tool: (tool || 'unknown').toString().slice(0, 60),
    helpful: helpful === true || helpful === 'yes',
    comment: (comment || '').toString().slice(0, 500),
    path,
  });
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

router.get('/metrics/report', rateLimit(METRIC_LIMITS, 'metrics-report:'), (req, res) => {
  const KEY = process.env.METRICS_KEY;
  if (!KEY || req.query.key !== KEY) return res.status(404).end();
  try {

    const rows = readMetrics();
    const events = rows.filter(r => r.kind === 'event');
    const feedback = rows.filter(r => r.kind === 'feedback');
    const toolOf = r => (r.props && r.props.tool) || (r.path || '').split('/')[1] || '?';

    // ── daily series ──
    const byDay = {};
    for (const e of events) {
      const day = (e.at || '').slice(0, 10); if (!day) continue;
      byDay[day] = byDay[day] || { day, views: 0, runs: 0, sessions: 0 };
      if (e.event === 'page_view') { byDay[day].views++; if (e.props && e.props.newSession) byDay[day].sessions++; }
      if (e.event === 'tool_run') byDay[day].runs++;
    }
    const days = Object.values(byDay).sort((a, b) => a.day.localeCompare(b.day)).slice(-30);

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
    <h1>DeftBrain metrics <span style="font-weight:400;font-size:13px;color:#888">${events.length} events · ${rows.length ? escH((rows[0].at || '').slice(0, 10)) + ' → today' : 'no data yet'}</span></h1>
    <div class="cards">
      ${card('page views', pv.length)}
      ${card('sessions', sessions.length)}
      ${card('returning sessions', returningSessions.length, pct(returningSessions.length, sessions.length) + ' of sessions · ' + escH(Object.entries(buckets).map(([b, n]) => `${b}: ${n}`).join(' · ') || ''))}
      ${card('tool runs', runs.length, pct(completes.length, runs.length) + ' complete')}
      ${card('took it with them', taken.length, 'print + copy + share')}
      ${card('helpful', helpfulYes + '/' + feedback.length)}
    </div>
    <h2>Daily trend (last 30 days)</h2>${days.length ? lineChart(days) : '<p style="color:#888">No data yet.</p>'}
    <h2>Tools</h2>
    <table><tr><th>tool</th><th>views</th><th>runs</th><th>view→run</th><th>completes</th><th>errors</th><th>avg time</th><th>took it</th><th>helpful</th></tr>${toolRows || '<tr><td colspan=9 style="color:#888">No data yet.</td></tr>'}</table>
    <h2>Sources (sessions · runs attributed)</h2>
    <table>${srcRows || '<tr><td style="color:#888">No data yet.</td></tr>'}</table>
    <h2>Guide → tool crossover</h2>
    <p>${runsFromGuides} of ${runs.length} tool runs (${pct(runsFromGuides, runs.length)}) came from sessions that read a guide first.</p>
    <h2>Languages (sessions)</h2><table>${langRows || '<tr><td style="color:#888">No data yet.</td></tr>'}</table>
    <h2>Recent feedback</h2>
    <table><tr><th>tool</th><th></th><th>comment</th><th>date</th></tr>${fbRows || '<tr><td colspan=4 style="color:#888">None yet.</td></tr>'}</table>
    </body></html>`);
  } catch (err) {
    console.error('metrics report failed:', err.message);
    return res.status(500).send('Report generation failed.');
  }
});

module.exports = router;
