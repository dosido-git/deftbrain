// Email alerting for the two failures a user actually experiences:
// tool_render_error (a white screen) and tool_error (no answer at all).
//
// THEY NEED DIFFERENT RULES, and that is the main idea in this file.
//
// A render crash is ALWAYS a bug — a 200 the UI could not draw. It is rare and
// every single one is actionable, so the first occurrence mails immediately.
//
// A tool_error is not always a bug. It covers a genuine backend 500 (a real
// defect), but also one user's wifi dropping, a 529 the retry could not ride
// out, and Safari abandoning a fetch at ~60s. Mailing the first of those would
// be mailing the weather. So tool_error is RATE-based: it stays silent until a
// fingerprint crosses a threshold inside a window, because "this happened five
// times in fifteen minutes" is a signal and "this happened once" is not.
//
// The network class is worth keeping rather than dropping, for one reason: a
// spike in "Load failed" is the only production signal that a route has gone
// back over the browser's ~60s limit. No static gate can see that, and the
// latency sweep only measures small fixture inputs on demand.
//
// WHY THIS IS NOT "send an email per event".
//
// /api/events is PUBLIC and unauthenticated — it has to be, it is a beacon
// endpoint. Its rate limit is 60/min per IP, and an attacker can rotate IPs.
// Wiring a mailer straight to it would build an open email-amplification
// endpoint aimed at our own inbox. Even with no attacker, one bad deploy on a
// popular tool means every affected visitor fires a beacon, which is a
// self-inflicted mail flood and a fast way to get the sending domain throttled.
//
// So three guards, in order:
//   1. FINGERPRINT — group by tool + message with digits/URLs normalised out,
//      so "failed at index 3" and "failed at index 7" are one bug, not two.
//   2. COOLDOWN — a fingerprint mails at most once an hour. Repeats in between
//      are counted and reported in the next mail for that fingerprint.
//   3. GLOBAL CAP — a hard ceiling per hour across all fingerprints. Past it,
//      everything is counted and nothing is sent; the next mail that does go
//      out says how many were suppressed.
//
// State is in-memory and per-process, like lib/groundedFacts' cache: it empties
// on deploy, which for alerting is the right default — after a deploy you WANT
// the first occurrence of everything, because the deploy is the usual cause.
//
// Best-effort throughout. This must never throw into the beacon path and must
// never delay the 204.

const HOUR_MS = 60 * 60 * 1000;
const COOLDOWN_MS = Number(process.env.CRASH_ALERT_COOLDOWN_MS) || HOUR_MS;
const MAX_PER_HOUR = Number(process.env.CRASH_ALERT_MAX_PER_HOUR) || 10;
const MAX_FINGERPRINTS = 500; // bounded like the grounded-facts cache

// Rate window for tool_error, and the per-class thresholds inside it. A class
// stays silent until it crosses its threshold in the window.
//   server   — a 5xx or a backend error string. Systematic; a few is enough.
//   network  — Load failed / Failed to fetch / aborted. Noisy per user, so the
//              bar is higher; crossing it usually means a latency regression.
//   limit    — 429s. Either abuse or a limit set too tight. Higher still.
const ERROR_WINDOW_MS = Number(process.env.TOOL_ERROR_WINDOW_MS) || 15 * 60 * 1000;
const ERROR_THRESHOLDS = {
  server: Number(process.env.TOOL_ERROR_THRESHOLD_SERVER) || 3,
  network: Number(process.env.TOOL_ERROR_THRESHOLD_NETWORK) || 10,
  limit: Number(process.env.TOOL_ERROR_THRESHOLD_LIMIT) || 20,
  // A thin result is a heuristic (see lib/completeness), so the bar is higher
  // than a hard server error: one is a legitimate empty section, five in a
  // window is a tool quietly rendering blank cards.
  thin: Number(process.env.TOOL_ERROR_THRESHOLD_THIN) || 5,
};
// Render crashes are rarer and always real, so tool_error alerts may take at
// most half the hourly cap — a noisy error class must never crowd out a crash.
const ERROR_SHARE_OF_CAP = 0.5;
const NETWORK_ALERTS_ON = process.env.TOOL_ERROR_ALERT_NETWORK !== 'off';

const seen = new Map(); // fingerprint → { count, sinceLastMail, firstAt, lastMailAt }
const errorWindows = new Map(); // fingerprint → { hits: number[], lastMailAt }
let errorsSentThisWindow = 0;
let windowStart = Date.now();
let sentThisWindow = 0;
let suppressedThisWindow = 0;

// Collapse the volatile parts of a message so one bug is one fingerprint:
// array indices, ids, line/column numbers, urls, hex blobs.
function fingerprintOf(tool, message) {
  const norm = String(message || '')
    .replace(/https?:\/\/\S+/g, '<url>')
    .replace(/\b[0-9a-f]{8,}\b/gi, '<hex>')
    .replace(/\d+/g, '<n>')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 160);
  return `${tool || '?'}::${norm}`;
}

function rollWindow(now) {
  if (now - windowStart >= HOUR_MS) {
    windowStart = now;
    sentThisWindow = 0;
    errorsSentThisWindow = 0;
    suppressedThisWindow = 0;
  }
}

// Which of the three kinds of "no answer" this is. The message is all the
// client can tell us, so classify on it.
function classifyError(message) {
  const m = String(message || '').toLowerCase();
  if (/\b429\b|too many requests|rate limit/.test(m)) return 'limit';
  if (/load failed|failed to fetch|networkerror|network request failed|abort|timed? ?out|connection/.test(m)) return 'network';
  return 'server';
}

function evict() {
  if (seen.size < MAX_FINGERPRINTS) return;
  let oldestKey, oldest = Infinity;
  for (const [k, v] of seen) if (v.firstAt < oldest) { oldest = v.firstAt; oldestKey = k; }
  if (oldestKey !== undefined) seen.delete(oldestKey);
}

function esc(s) {
  return String(s == null ? '' : s).slice(0, 500);
}

/**
 * Record a render crash and email it if the guards allow.
 * @param {object} crash
 * @param {string} crash.tool       tool id from the beacon
 * @param {string} crash.message    the thrown error's message
 * @param {string} crash.where      first component-stack frame
 * @param {string} crash.path       page path
 * @param {string} crash.userAgent  request UA (helps spot browser-specific breaks)
 * @returns {{ mailed: boolean, reason: string, count: number }} for logging/tests
 */
function reportRenderCrash({ tool, message, where, path, userAgent } = {}) {
  const now = Date.now();
  rollWindow(now);

  const fp = fingerprintOf(tool, message);
  const prev = seen.get(fp);
  const entry = prev || { count: 0, sinceLastMail: 0, firstAt: now, lastMailAt: 0 };
  entry.count += 1;
  entry.sinceLastMail += 1;
  seen.set(fp, entry);
  if (!prev) evict();

  const isNew = !prev;
  const cooledDown = now - entry.lastMailAt >= COOLDOWN_MS;
  if (!isNew && !cooledDown) {
    return { mailed: false, reason: 'cooldown', count: entry.count };
  }
  if (sentThisWindow >= MAX_PER_HOUR) {
    suppressedThisWindow += 1;
    // Log the breach ONCE per window, not once per suppressed event. The first
    // version logged every one — a 200-crash burst wrote 190 lines and buried
    // the ten alerts that actually went out. A flood must not flood the log
    // either; the running total goes in the next email instead.
    if (suppressedThisWindow === 1) {
      console.error(`[alerts] hourly cap of ${MAX_PER_HOUR} reached — further alerts suppressed until the window rolls; first suppressed: ${fp}`);
    }
    return { mailed: false, reason: 'capped', count: entry.count };
  }

  const key = process.env.RESEND_API_KEY;
  if (!key) return { mailed: false, reason: 'no-key', count: entry.count };

  const repeats = entry.sinceLastMail;
  entry.sinceLastMail = 0;
  entry.lastMailAt = now;
  sentThisWindow += 1;
  const suppressedNote = suppressedThisWindow
    ? `\n\n⚠️ ${suppressedThisWindow} further crash report(s) were suppressed this hour by the ${MAX_PER_HOUR}/hour cap. Open the dashboard for the full picture.`
    : '';
  suppressedThisWindow = 0;

  const body = [
    `${isNew ? 'NEW render crash' : 'Render crash still happening'} — the user saw a white screen where an answer should have been.`,
    ``,
    `Tool:      ${esc(tool) || '(unknown)'}`,
    `Path:      ${esc(path) || '—'}`,
    `Message:   ${esc(message) || '—'}`,
    `Where:     ${esc(where) || '—'}`,
    `Browser:   ${esc(userAgent) || '—'}`,
    ``,
    isNew
      ? `First occurrence.`
      : `Seen ${repeats}× since the last alert, ${entry.count}× total since ${new Date(entry.firstAt).toISOString()}.`,
    ``,
    `This is tool_render_error — the response was a valid 200 and React threw while rendering it.`,
    `Usual cause: a field the UI prints directly came back as an object or array instead of a string.`,
    `Check the three-way sync for that field, and add a server-side coercion if the model can vary the shape.`,
    suppressedNote,
  ].join('\n');

  send(key, `${isNew ? '🔴' : '🔁'} Render crash: ${esc(tool) || 'unknown tool'}`, body);
  return { mailed: true, reason: isNew ? 'new' : 'repeat', count: entry.count };
}

// Shared transport. Best-effort: never awaited, never throws.
function send(key, subject, text) {
  fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.ALERT_EMAIL_FROM || 'DeftBrain Alerts <alerts@deftbrain.com>',
      to: [process.env.CRASH_ALERT_TO || 'err@deftbrain.com'],
      subject,
      text,
    }),
  })
    // A rejected PROMISE is a network failure; a 401/403/422 from Resend is a
    // resolved one. The first version only caught the former, so a wrong key or
    // an unverified sending domain would have meant alerts silently never
    // arriving — the exact failure mode this alerting exists to end.
    .then(async (r) => {
      if (!r || r.ok) return;
      const detail = await r.text().catch(() => '');
      console.error(`[alerts] Resend rejected the alert: HTTP ${r.status} ${detail.slice(0, 200)}`);
    })
    .catch(err => console.error('[alerts] send failed:', err.message));
}

/**
 * Record a tool_error and email it only once its class crosses the rate
 * threshold inside the window. Unlike a render crash, one of these is usually
 * the weather rather than a bug.
 * @returns {{ mailed: boolean, reason: string, hits: number, klass: string }}
 */
function reportToolError({ tool, message, path, userAgent, forceClass } = {}) {
  const now = Date.now();
  rollWindow(now);

  const klass = forceClass || classifyError(message);
  if (klass === 'network' && !NETWORK_ALERTS_ON) {
    return { mailed: false, reason: 'network-alerts-off', hits: 0, klass };
  }

  const fp = `${klass}::${fingerprintOf(tool, message)}`;
  const w = errorWindows.get(fp) || { hits: [], lastMailAt: 0 };
  // Drop anything outside the window, then record this one. The array is
  // bounded by the threshold logic below, not by time alone, so trim hard.
  w.hits = w.hits.filter(t => now - t < ERROR_WINDOW_MS);
  w.hits.push(now);
  if (w.hits.length > 1000) w.hits = w.hits.slice(-1000);
  errorWindows.set(fp, w);
  if (errorWindows.size > MAX_FINGERPRINTS) {
    const oldest = [...errorWindows.entries()].sort((a, b) => (a[1].hits[0] || 0) - (b[1].hits[0] || 0))[0];
    if (oldest) errorWindows.delete(oldest[0]);
  }

  const threshold = ERROR_THRESHOLDS[klass] || ERROR_THRESHOLDS.server;
  if (w.hits.length < threshold) {
    return { mailed: false, reason: 'below-threshold', hits: w.hits.length, klass };
  }
  if (now - w.lastMailAt < COOLDOWN_MS) {
    return { mailed: false, reason: 'cooldown', hits: w.hits.length, klass };
  }
  // Reserved headroom: a noisy error class must not crowd out render crashes.
  const errorCap = Math.floor(MAX_PER_HOUR * ERROR_SHARE_OF_CAP);
  if (errorsSentThisWindow >= errorCap || sentThisWindow >= MAX_PER_HOUR) {
    suppressedThisWindow += 1;
    if (suppressedThisWindow === 1) {
      console.error(`[alerts] error-alert budget reached (${errorCap}/hour) — suppressing until the window rolls; first: ${fp}`);
    }
    return { mailed: false, reason: 'capped', hits: w.hits.length, klass };
  }

  const key = process.env.RESEND_API_KEY;
  if (!key) return { mailed: false, reason: 'no-key', hits: w.hits.length, klass };

  w.lastMailAt = now;
  sentThisWindow += 1;
  errorsSentThisWindow += 1;
  const hits = w.hits.length;
  const mins = Math.round(ERROR_WINDOW_MS / 60000);

  const meaning = {
    thin: 'The response was a valid 200 but arrived missing a large share of its sections, so the user saw empty cards. Not a crash and not a 500 — check the prompt and the route guard for that endpoint, and whether a recent split dropped a sub-schema.',
    server: 'The backend refused or failed. This is a defect — check the route guard, a truncation at max_tokens, or a three-way sync break.',
    network: `The request never completed for the user. A spike in this class usually means the route went back over the browser's ~60s limit — re-run scripts/latency-sweep.js against it.`,
    limit: 'Users are being rate-limited. Either genuine abuse, or a limit set tighter than real usage needs.',
  }[klass];

  const body = [
    `${hits} failures on ${esc(tool) || 'an unknown tool'} in the last ${mins} minutes — over the ${threshold} threshold for the "${klass}" class.`,
    ``,
    `Tool:      ${esc(tool) || '(unknown)'}`,
    `Path:      ${esc(path) || '—'}`,
    `Class:     ${klass}`,
    `Message:   ${esc(message) || '—'}`,
    `Browser:   ${esc(userAgent) || '—'}`,
    `Rate:      ${hits} in ${mins}m`,
    ``,
    meaning,
    ``,
    klass === 'thin'
      ? `Silent below ${threshold} in ${mins}m by design — a single empty section is often a correct answer.`
      : `This is tool_error — the user got no answer at all, as opposed to a render\ncrash where they got a white screen. Silent below ${threshold} in ${mins}m by design;\nsingle failures are usually one user's connection, not a bug.`,
  ].join('\n');

  send(key, `${klass === 'thin' ? '🕳️' : '⚠️'} ${hits}× ${klass}: ${esc(tool) || 'unknown tool'}`, body);
  return { mailed: true, reason: 'threshold-crossed', hits, klass };
}

// Exposed for tests: reset the process-local state.
function _resetAlertState() {
  seen.clear();
  errorWindows.clear();
  windowStart = Date.now();
  sentThisWindow = 0;
  errorsSentThisWindow = 0;
  suppressedThisWindow = 0;
}

/**
 * A valid 200 that came back missing most of its sections. Shares the whole
 * rate/cooldown/cap machinery with tool_error — it is the same kind of signal
 * (only meaningful as a rate) and must draw from the same budget.
 */
function reportThinResult({ tool, missing, expected, path } = {}) {
  return reportToolError({
    tool,
    path,
    message: `thin result: ${missing.length}/${expected} sections empty (${missing.slice(0, 6).join(', ')})`,
    userAgent: '',
    forceClass: 'thin',
  });
}

module.exports = {
  reportRenderCrash,
  reportToolError,
  reportThinResult,
  classifyError,
  fingerprintOf,
  _resetAlertState,
  // back-compat for the existing test script
  _resetCrashAlertState: _resetAlertState,
};
