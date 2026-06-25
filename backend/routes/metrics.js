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
  const { event, path, props } = req.body || {};
  if (!event || typeof event !== 'string') return res.status(204).end();
  logMetric('event', { event: event.slice(0, 60), path, props });
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

module.exports = router;
