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
//  • Use family ALIASES, never dated snapshots (`…-20251001`). Dated ids retire
//    first; the undated alias tracks the current snapshot. (Verified live before
//    committing: `claude-haiku-4-5` resolves, so we use it over the dated form.)
//  • To swap a model in prod without a deploy: set MODEL_SMART / MODEL_FAST /
//    MODEL_DEEP in Railway and restart.
//  • The startup + /api/health/models liveness check (see lib/claude.js
//    `checkModels`) pings every id below so a retirement is caught at deploy
//    time / by the uptime monitor — never by a user.
// ────────────────────────────────────────────────────────────────────────────

const MODELS = {
  SMART: process.env.MODEL_SMART || 'claude-sonnet-4-6',  // default workhorse (most tools)
  FAST:  process.env.MODEL_FAST  || 'claude-haiku-4-5',   // cheap/fast (alias, was dated -20251001)
  DEEP:  process.env.MODEL_DEEP  || 'claude-opus-4-8',    // hardest reasoning / vision
};

// Unique set of ids actually in use — exactly what the liveness check pings.
const ALL_MODELS = [...new Set(Object.values(MODELS))];

// Newer models we've SEEN and deliberately chosen NOT to adopt (yet). The daily
// currency check (scripts/check-model-currency.js) fails when a newer same-family
// model appears — add its id here to acknowledge "we're staying put on purpose"
// and turn the check green again. This keeps the decision explicit and reviewable
// rather than silently ignored. Empty = adopt-or-be-nagged.
const ACKNOWLEDGED_NEWER = [
  // e.g. 'claude-sonnet-5',  // evaluated <date>: staying on 4.6 because <reason>
];

module.exports = { MODELS, ALL_MODELS, ACKNOWLEDGED_NEWER };
