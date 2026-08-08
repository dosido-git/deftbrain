// The metrics sink, extracted from routes/metrics.js so things other than the
// beacon endpoint can write to it — the completeness observer in particular,
// which runs as middleware and has no business importing a route module.
//
// Two sinks, both best-effort by design: logging must never break a request.
//   1. stdout as `METRIC <json>` — survives Railway's ephemeral filesystem.
//   2. appended JSONL at LOG_FILE — what the dashboard reads.

const fs = require('fs');
const nodePath = require('path');

// Local append-only sink. Defaults to repo root; override with METRICS_LOG_FILE.
const LOG_FILE = process.env.METRICS_LOG_FILE
  || nodePath.join(__dirname, '..', '..', 'metrics.jsonl');

function logMetric(kind, data) {
  const line = JSON.stringify({ kind, ...data, at: new Date().toISOString() });
  // Never throw into the request path; both sinks are best-effort.
  try { console.log('METRIC ' + line); } catch (_) { /* noop */ }
  try { fs.appendFile(LOG_FILE, line + '\n', () => {}); } catch (_) { /* noop */ }
}

module.exports = { LOG_FILE, logMetric };
