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
];

module.exports = { MODELS, ALL_MODELS, ACKNOWLEDGED_NEWER };
