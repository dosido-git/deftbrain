// backend/lib/surge.js
//
// Surge mode (2026-10-05). When a lot of people arrive at once, the first
// thing to give out is Anthropic's per-minute allowance for a model family
// (about 330 Sonnet runs at once on this account), not this server (a load
// test held 2,000 runs in one process). So under strain the product shifts
// gears instead of turning people away:
//
//   1. OVERFLOW. A call refused as overloaded (429/529) is retried at once on
//      the next model down (Opus → Sonnet → Haiku), which draws on a separate
//      allowance. While a family keeps getting refused, new calls for it start
//      on the fallback directly instead of being refused first.
//   2. LIGHTER RUNS. While surging, the second "number check" pass
//      (lib/factCheck.js withNumberCheck) is skipped, which halves the calls
//      the 10+ number-heavy tools make.
//   3. PROMPT CACHING ON. Every route's fixed instructions are cached (the
//      5-minute kind) while surging — lib/claude.js. Off on normal days, when
//      most cached prompts would expire unread (PROMPT_CACHE_ROUTES still
//      opts single routes in permanently).
//   4. A KIND "BUSY" ANSWER. If a request still fails because of overload, the
//      /api middleware (busyMiddleware below) turns the route's generic 500
//      into a 503 with code "busy" and a plain message; the browser
//      (src/hooks/useClaudeAPI.js) waits and retries before showing it.
//
// It all goes back to normal on its own: surge holds for HOLD_MS after the
// last trigger, then lifts.
//
// Environment:
//   SURGE_MODE=on    force surge on (by hand, during a known spike)
//   SURGE_MODE=off   never surge automatically (overflow on a refusal still
//                    happens: that is a retry, not a mode)
//   SURGE_INFLIGHT   model calls in progress that count as a surge (default 250)

const { AsyncLocalStorage } = require('async_hooks');
const { MODELS } = require('./models');
const { reportSurge } = require('./alerts');

const WINDOW_MS = 60 * 1000;      // how far back refusals count
const OVERLOAD_TRIGGER = 3;       // refusals for one family within WINDOW_MS
const HOLD_MS = 2 * 60 * 1000;    // stay in surge this long after the last trigger

const BUSY_MESSAGE = 'Lots of people are here right now, so this one could not finish. What you entered is still here; please try again in a minute.';

let inflight = 0;
let surgeUntil = 0;
let wasSurging = false;
let surgeReason = '';
// Counted from the moment surge switches on, for the "it's over" email.
let overflows = 0;
let busyAnswers = 0;
const refusals = { opus: [], sonnet: [], haiku: [] };

function mode() { return String(process.env.SURGE_MODE || '').toLowerCase(); }
function inflightLimit() { return Number(process.env.SURGE_INFLIGHT) || 250; }

function familyOf(model) {
  const m = String(model || '').toLowerCase();
  if (m.includes('opus')) return 'opus';
  if (m.includes('sonnet')) return 'sonnet';
  if (m.includes('haiku')) return 'haiku';
  return null;
}

function fallbackFor(model) {
  const f = familyOf(model);
  if (f === 'opus') return MODELS.SMART;
  if (f === 'sonnet') return MODELS.FAST;
  return null;
}

function isOverload(err) {
  const status = err && err.status;
  const msg = ((err && err.message) || '').toLowerCase();
  return status === 429 || status === 529 || /overloaded|rate_limit|rate limit/.test(msg);
}

function prune(list) {
  const cutoff = Date.now() - WINDOW_MS;
  while (list.length && list[0] < cutoff) list.shift();
  return list;
}

function familyStrained(family) {
  if (!family || !refusals[family]) return false;
  return prune(refusals[family]).length >= OVERLOAD_TRIGGER;
}

function refusalCounts() {
  return Object.fromEntries(Object.entries(refusals).map(([k, v]) => [k, prune(v).length]));
}

// An automatic switch on or off: log it and email the owner (lib/alerts.js —
// one email when it starts, one when it ends). A surge forced by SURGE_MODE=on
// never comes through here, so setting it by hand sends nothing.
function logTransition(now) {
  if (now === wasSurging) return;
  wasSurging = now;
  if (now) {
    overflows = 0;
    busyAnswers = 0;
    console.warn(`[surge] ON — ${surgeReason}; inflight=${inflight} refusals sonnet=${refusals.sonnet.length} opus=${refusals.opus.length} haiku=${refusals.haiku.length}`);
    try { reportSurge(true, { reason: surgeReason, inflight, refusals: refusalCounts() }); } catch (_) { /* never let alerting break a request */ }
  } else {
    console.warn(`[surge] off — back to normal (overflows=${overflows}, busy=${busyAnswers})`);
    try { reportSurge(false, { overflows, busy: busyAnswers }); } catch (_) { /* never let alerting break a request */ }
  }
}

function isSurging() {
  const m = mode();
  if (m === 'on') return true;
  if (m === 'off') return false;
  const now = Date.now();
  const strained = Object.keys(refusals).filter(familyStrained);
  if (inflight >= inflightLimit() || strained.length) {
    surgeUntil = now + HOLD_MS;
    if (!wasSurging) surgeReason = strained.length
      ? `${strained.join(' + ')} refused as overloaded ${OVERLOAD_TRIGGER}+ times in a minute`
      : `${inflight} model calls in flight (limit ${inflightLimit()})`;
  }
  const on = now < surgeUntil;
  logTransition(on);
  return on;
}

// ── Per-request "did overload touch this request?" ──
const busyScope = new AsyncLocalStorage();

function noteRefusal(model) {
  const f = familyOf(model);
  if (f) refusals[f].push(Date.now());
  const s = busyScope.getStore();
  if (s) s.overloaded = true;
  isSurging();
}

// A request can be moved to a smaller model only when nothing in it needs the
// bigger one: server-side tools (web search) and extended thinking stay put.
function swappable(params) {
  return params && !params.stream && !params.tools && !params.thinking;
}

/**
 * Wraps a messages.create function with the surge behavior. lib/claude.js
 * installs it as the outermost layer, so every call in the product — through
 * callClaudeWithRetry or direct — passes through it. Streaming calls pass
 * straight through.
 */
function withSurge(create) {
  return async function surgeCreate(params, ...rest) {
    if (!params || typeof params !== 'object' || params.stream) return create(params, ...rest);
    let request = params;
    const fallback = fallbackFor(params.model);
    if (fallback && swappable(params) && (mode() === 'on' || familyStrained(familyOf(params.model)))) {
      request = { ...params, model: fallback };
    }
    inflight++;
    try {
      return await create(request, ...rest);
    } catch (err) {
      if (!isOverload(err)) throw err;
      noteRefusal(request.model);
      const next = fallbackFor(request.model);
      if (!next || !swappable(request)) throw err;
      console.warn(`[surge] ${request.model} refused (overloaded) — overflowing to ${next}`);
      overflows++;
      try {
        return await create({ ...request, model: next }, ...rest);
      } catch (err2) {
        if (isOverload(err2)) noteRefusal(next);
        throw err2;
      }
    } finally {
      inflight--;
    }
  };
}

/**
 * /api middleware: when a request failed because of overload, answer with a
 * 503 the browser recognizes ({ code: 'busy' }) and a plain message, instead
 * of the route's generic "Something went wrong". Every route sends its own
 * 500 from its own catch block; this rewrites only those that overload
 * touched, and never a response already committed (streaming routes).
 */
function busyMiddleware(req, res, next) {
  const scope = { overloaded: false };
  busyScope.enterWith(scope);
  const json = res.json.bind(res);
  res.json = (body) => {
    if (scope.overloaded && res.statusCode >= 500 && !res.headersSent) {
      busyAnswers++;
      res.status(503);
      res.set('Retry-After', '20');
      return json({ error: BUSY_MESSAGE, code: 'busy' });
    }
    return json(body);
  };
  next();
}

function surgeStatus() {
  return {
    surging: isSurging(),
    mode: mode() || 'auto',
    inflight,
    refusalsLastMinute: refusalCounts(),
  };
}

// Surge ends by time (HOLD_MS after the last trigger), which nothing would
// notice on a quiet server; this check is what sends the "it's over" email.
const ticker = setInterval(() => { if (mode() !== 'on' && mode() !== 'off') isSurging(); }, 30 * 1000);
if (ticker.unref) ticker.unref();

module.exports = { withSurge, isSurging, busyMiddleware, surgeStatus, BUSY_MESSAGE, _test: { familyOf, fallbackFor, isOverload } };
