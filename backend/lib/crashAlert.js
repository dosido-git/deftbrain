// Email alerting for render crashes (tool_render_error).
//
// A render crash is the one failure the funnel used to call a success: the
// server answered 200, React threw while rendering it, the user got a white
// screen. Those should reach a human the day they land rather than whenever
// someone next opens the dashboard.
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

const seen = new Map(); // fingerprint → { count, sinceLastMail, firstAt, lastMailAt }
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
    suppressedThisWindow = 0;
  }
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
      console.error(`[crash-alert] hourly cap of ${MAX_PER_HOUR} reached — further alerts suppressed until the window rolls; first suppressed: ${fp}`);
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

  fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.ALERT_EMAIL_FROM || 'DeftBrain Alerts <alerts@deftbrain.com>',
      to: [process.env.CRASH_ALERT_TO || 'err@deftbrain.com'],
      subject: `${isNew ? '🔴' : '🔁'} Render crash: ${esc(tool) || 'unknown tool'}`,
      text: body,
    }),
  })
    // A rejected PROMISE is a network failure; a 401/403/422 from Resend is a
    // resolved one. The first version only caught the former, so a wrong key or
    // an unverified sending domain would have meant alerts silently never
    // arriving — the exact failure mode this alerting exists to end.
    .then(async (r) => {
      if (!r || r.ok) return;
      const detail = await r.text().catch(() => '');
      console.error(`[crash-alert] Resend rejected the alert: HTTP ${r.status} ${detail.slice(0, 200)}`);
    })
    .catch(err => console.error('[crash-alert] send failed:', err.message));

  return { mailed: true, reason: isNew ? 'new' : 'repeat', count: entry.count };
}

// Exposed for tests: reset the process-local state.
function _resetCrashAlertState() {
  seen.clear();
  windowStart = Date.now();
  sentThisWindow = 0;
  suppressedThisWindow = 0;
}

module.exports = { reportRenderCrash, fingerprintOf, _resetCrashAlertState };
