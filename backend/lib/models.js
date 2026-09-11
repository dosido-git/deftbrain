// backend/lib/models.js
// ────────────────────────────────────────────────────────────────────────────
// SINGLE SOURCE OF TRUTH for Claude model IDs.
//
// Why this file exists: model IDs used to be hardcoded in ~120 route files.
// When Anthropic retired a dated snapshot (`claude-sonnet-4-20250514`, which was
// the callClaudeWithRetry default), one tool 500'd *silently* — a user hit it and
// left before we knew (2026-07-10). Now every route references a NAMED ROLE
// below, so a retirement is a one-line change here — or, better, a Railway
// env-var flip that takes effect on the next restart with NO code deploy.
//
// RULES:
//  • PIN dated snapshots (`…-YYYYMMDD`) where they exist — determinism beats
//    auto-tracking. An undated alias can silently swap the underlying snapshot
//    between deploys, the exact non-determinism our golden regression suite
//    exists to prevent. (SMART/DEEP have no dated variant listed in /v1/models —
//    the undated id IS the canonical pin.)
//  • Retirement is MONITORED, which is what makes pinning safe: the startup +
//    /api/health/models liveness check (lib/claude.js `checkModels`) catches a
//    404, and the daily currency check (scripts/check-model-currency.js) catches
//    a pin going stale / a newer model appearing — before a user does.
//  • To swap a model in prod without a deploy: set MODEL_SMART / MODEL_FAST /
//    MODEL_DEEP in Railway and restart.
// ────────────────────────────────────────────────────────────────────────────

const MODELS = {
  SMART: process.env.MODEL_SMART || 'claude-sonnet-4-6',            // default workhorse (most tools)
  FAST:  process.env.MODEL_FAST  || 'claude-haiku-4-5-20251001',   // cheap/fast — PINNED snapshot (determinism)
  DEEP:  process.env.MODEL_DEEP  || 'claude-opus-4-8',             // hardest reasoning / vision
};

// Unique set of ids actually in use — exactly what the liveness check pings.
const ALL_MODELS = [...new Set(Object.values(MODELS))];

// Newer models we've SEEN and deliberately chosen NOT to adopt (yet). The daily
// currency check (scripts/check-model-currency.js) fails when a newer same-family
// model appears — add its id here to acknowledge "we're staying put on purpose"
// and turn the check green again. This keeps the decision explicit and reviewable
// rather than silently ignored. Empty = adopt-or-be-nagged.
const ACKNOWLEDGED_NEWER = [
  // Evaluated 2026-07-11: staying on claude-sonnet-4-6. Sonnet 5 is more verbose —
  // AlternatePath deep-mode truncated at the max_tokens tuned for 4.6 (golden
  // 3/3 → 2/3). Adopting it is a deliberate migration (re-tune max_tokens on the
  // max-schema tools + re-verify all goldens + weigh cost/latency), not an env
  // flip. Remove this line when that migration is done.
  'claude-sonnet-5',
  // Evaluated 2026-07-26 (released 07-24): staying on claude-opus-4-8 for now.
  // Opus 5 is live but more verbose at our tuned budgets — golden comparison
  // truncated markup-detective (2500) and two buy-wise legs (4000/5000);
  // markup-detective+dvt pass cleanly on 4-8. Adopting it = deliberate
  // migration (re-budget the 3 DEEP routes, re-verify goldens, re-check the
  // <60s latency bar). Remove this line when that migration is done.
  'claude-opus-5',
];

// ── Price table, USD per million tokens ─────────────────────────────────
// Used ONLY to estimate cost in the metrics report. Matched by longest
// model-id prefix, so a pinned snapshot ('claude-haiku-4-5-20251001') picks up
// its family row. These are published list prices at the time of writing —
// they drift, and a new model generation can land on a different tier — so
// treat the report's dollar figures as estimates and reconcile against the
// Anthropic console. Override or extend without a deploy:
//   MODEL_PRICING_JSON='{"claude-opus-4-8":{"in":5,"out":25,"cache_write":6.25,"cache_read":0.5}}'
// An unmatched model yields `null`, which the report shows as "—" rather than
// a wrong number.
const DEFAULT_PRICING = {
  'claude-opus-4':    { in: 15, out: 75, cache_write: 18.75, cache_read: 1.50 },
  'claude-sonnet-4':  { in: 3,  out: 15, cache_write: 3.75,  cache_read: 0.30 },
  'claude-haiku-4-5': { in: 1,  out: 5,  cache_write: 1.25,  cache_read: 0.10 },
  'claude-opus':      { in: 15, out: 75, cache_write: 18.75, cache_read: 1.50 },
  'claude-sonnet':    { in: 3,  out: 15, cache_write: 3.75,  cache_read: 0.30 },
  'claude-haiku':     { in: 1,  out: 5,  cache_write: 1.25,  cache_read: 0.10 },
};
let PRICING = DEFAULT_PRICING;
try {
  if (process.env.MODEL_PRICING_JSON) PRICING = { ...DEFAULT_PRICING, ...JSON.parse(process.env.MODEL_PRICING_JSON) };
} catch (_) { /* keep defaults; a bad override must never break startup */ }

function priceFor(model) {
  const id = String(model || '');
  let best = null;
  for (const prefix of Object.keys(PRICING)) {
    if (id.startsWith(prefix) && (!best || prefix.length > best.length)) best = prefix;
  }
  return best ? PRICING[best] : null;
}

// usage = { input_tokens, output_tokens, cache_read_input_tokens, cache_creation_input_tokens }
// (the SDK's shape). Returns USD, or null when the model is not in the table.
function estimateCostUSD(model, usage) {
  const p = priceFor(model);
  if (!p || !usage) return null;
  const n = k => Number(usage[k] || 0);
  return (n('input_tokens') * p.in
        + n('output_tokens') * p.out
        + n('cache_creation_input_tokens') * p.cache_write
        + n('cache_read_input_tokens') * p.cache_read) / 1e6;
}

module.exports = { MODELS, ALL_MODELS, ACKNOWLEDGED_NEWER, PRICING, priceFor, estimateCostUSD };
