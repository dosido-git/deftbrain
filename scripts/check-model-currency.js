#!/usr/bin/env node
// scripts/check-model-currency.js
// ────────────────────────────────────────────────────────────────────────────
// PROACTIVE model reconciliation — the opposite of waiting for a 404.
//
// Reconciles the model roles in backend/lib/models.js against Anthropic's
// authoritative GET /v1/models list, on a schedule (see the GitHub Action). It
// tells us BEFORE something breaks:
//   • DEAD    — a configured model no longer resolves (ping 404). Exit 1 (fail).
//   • DRIFTED — a newer same-family model is available than the one we use.
//               Exit 1 (fail) so the scheduled run goes red + emails — UNLESS
//               that newer id is in ACKNOWLEDGED_NEWER (a deliberate "we're
//               staying put" decision recorded in models.js).
//
// It does NOT change any constant. Model choice is a quality/cost/behavior
// decision that stays human + golden-verified — this just surfaces it early.
//
// Alias-aware: liveness is decided by an actual ping, not list-membership, so
// undated aliases (e.g. claude-haiku-4-5, which resolves but isn't enumerated)
// are correctly treated as live.
//
// Run locally:  node scripts/check-model-currency.js   (reads backend/.env)
// In CI:        ANTHROPIC_API_KEY as a repo secret (see the workflow).
// ────────────────────────────────────────────────────────────────────────────

const fs = require('fs');
const path = require('path');

// --- API key: env, else parse backend/.env for local runs ---
function apiKey() {
  if (process.env.ANTHROPIC_API_KEY) return process.env.ANTHROPIC_API_KEY;
  try {
    const env = fs.readFileSync(path.join(__dirname, '..', 'backend', '.env'), 'utf8');
    const m = env.match(/^ANTHROPIC_API_KEY\s*=\s*(.+)$/m);
    if (m) return m[1].trim();
  } catch { /* no .env */ }
  return null;
}
const KEY = apiKey();
if (!KEY) { console.error('✗ ANTHROPIC_API_KEY not set (env or backend/.env).'); process.exit(2); }

const { MODELS, ACKNOWLEDGED_NEWER = [] } = require('../backend/lib/models');
const H = { 'x-api-key': KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' };

// Parse `claude-<family>-<version...>` (ignoring any trailing -YYYYMMDD date).
function parse(id) {
  const m = id.match(/^claude-([a-z]+)-([\d-]+?)(?:-\d{8})?$/);
  if (!m) return null;
  return { id, family: m[1], version: m[2].split('-').map(Number) };
}
function cmpVer(a, b) {
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const d = (a[i] || 0) - (b[i] || 0);
    if (d) return d;
  }
  return 0;
}

async function ping(model) {
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST', headers: H,
      body: JSON.stringify({ model, max_tokens: 1, messages: [{ role: 'user', content: 'hi' }] }),
    });
    if (r.ok) return { ok: true };
    const body = await r.text();
    return { ok: false, dead: r.status === 404 || /not_found/i.test(body), status: r.status };
  } catch (e) { return { ok: false, dead: false, status: 'ERR', error: e.message }; }
}

(async () => {
  const listRes = await fetch('https://api.anthropic.com/v1/models?limit=100', { headers: H });
  const list = (await listRes.json()).data || [];
  const available = list.map(m => ({ ...parse(m.id), created: (m.created_at || '').slice(0, 10) })).filter(x => x.family);

  const roles = Object.entries(MODELS);       // [['SMART','claude-...'], ...]
  const dead = [];
  const upgrades = [];

  console.log(`Model currency check — ${new Date().toISOString().slice(0, 10)}`);
  console.log(`Anthropic /v1/models: ${list.length} available\n`);

  for (const [role, id] of roles) {
    const p = await ping(id);
    const mine = parse(id);
    // newest available in the same family
    const newest = available
      .filter(a => mine && a.family === mine.family)
      .sort((a, b) => cmpVer(b.version, a.version))[0];
    const hasNewer = mine && newest && cmpVer(newest.version, mine.version) > 0;
    const acked = hasNewer && ACKNOWLEDGED_NEWER.includes(newest.id);

    let line = `  ${role.padEnd(5)} ${id.padEnd(26)} `;
    if (!p.ok && p.dead) { line += `✗ DEAD (404) — retire/replace NOW`; dead.push(id); }
    else if (!p.ok)      { line += `? ping ${p.status} (transient — not a retirement)`; }
    else if (hasNewer && !acked) { line += `⬆ NEWER AVAILABLE: ${newest.id} (${newest.created})`; upgrades.push({ role, from: id, to: newest.id }); }
    else if (hasNewer && acked)  { line += `✓ live · newer ${newest.id} exists but ACKNOWLEDGED (staying)`; }
    else                 { line += `✓ live · newest in family`; }
    console.log(line);
  }

  console.log('');
  if (dead.length)     console.log(`✗ ${dead.length} DEAD model(s): ${dead.join(', ')}`);
  if (upgrades.length) console.log(`⬆ ${upgrades.length} upgrade(s) available: ${upgrades.map(u => `${u.role} ${u.from}→${u.to}`).join(', ')}\n   → evaluate (run the golden comparison), then bump backend/lib/models.js, OR add the id to ACKNOWLEDGED_NEWER to stay put.`);
  if (!dead.length && !upgrades.length) console.log('✓ all model roles are live and current.');

  process.exit(dead.length || upgrades.length ? 1 : 0);
})();
