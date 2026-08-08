// Did the user actually get a usable answer, or a page of empty cards?
//
// The funnel could already see two failures: no answer at all (tool_error) and
// a white screen (tool_render_error). It could not see the third — a valid 200
// whose payload is missing half its sections. Nothing throws, nothing 500s, the
// tool just renders blank cards and the dashboard calls it delivered.
//
// WHY THIS OBSERVES RATHER THAN GUARDS.
//
// The obvious fix is a content guard: if a section is missing, fail the
// request. That is the wrong fix twice over. It makes the user's experience
// worse — someone who would have got 9 of 10 sections now gets nothing — and
// guards are this codebase's single biggest cause of hard-down tools.
// MeetingBSDetector, RoomReader, GratitudeDebtClearer and
// ComplaintEscalationWriter were each 500ing on EVERY call because a guard
// keyed a nested or nullable field, and a guard that validates an enum is a
// hard 500 in all twelve non-English languages, because withLanguage
// translates JSON string values. Every one of those was added in good faith.
//
// So this changes nothing about the response. It compares what went out
// against what a known-good answer looks like, and reports the difference.
//
// WHERE THE EXPECTED SHAPE COMES FROM.
//
// The golden samples — 125 tools, 233 endpoints, 318 cases, already maintained
// because check:golden depends on them. This is the same comparison
// check-golden's diffCase makes, lifted out of CI into the running server so it
// applies to REAL user inputs rather than small fixtures.
//
// Keyed by endpoint AND action, because 17 endpoints dispatch on req.body.action
// and return a genuinely different shape per action (/api/pep alone has three).
// Keying on endpoint alone would compare a forecast against a generate and
// call every one of them broken.
//
// IT IS A HEURISTIC, and it is treated as one. Some sections are legitimately
// empty — manipulation_tactics: [] on a benign message is a correct answer, not
// a thin one — so a single thin result must never alert. It feeds the
// rate-based path, where "38% of this tool's answers this hour are missing
// three sections" is a signal and one is noise.

const fs = require('fs');
const nodePath = require('path');

// Flag only when a substantial share of the known-good sections are absent.
// One missing section out of ten is usually the model exercising a legitimate
// empty; a third of them missing is not.
const MISSING_RATIO = Number(process.env.COMPLETENESS_MISSING_RATIO) || 0.34;
const MIN_EXPECTED_KEYS = 3; // below this the ratio is too coarse to mean anything

let index = null; // shapeKey → string[] of reliably-present top-level keys

const isEmpty = (v) =>
  v == null || v === '' ||
  (Array.isArray(v) && v.length === 0) ||
  (typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 0);

function shapeKey(endpoint, action) {
  return `${endpoint || ''}::${action == null ? '' : String(action).slice(0, 40)}`;
}

// Build the index once, at first use. Reads the golden samples off disk; they
// ship with the repo, so this works in production.
function buildIndex(dir) {
  const built = new Map();
  let files = [];
  try { files = fs.readdirSync(dir).filter(f => f.endsWith('-golden-sample.json')); }
  catch { return built; } // no audit dir (e.g. a trimmed deploy) — observer stays off

  for (const file of files) {
    let doc;
    try { doc = JSON.parse(fs.readFileSync(nodePath.join(dir, file), 'utf8')); }
    catch { continue; }
    for (const c of (doc.cases || [])) {
      const out = c && c.output;
      if (!out || typeof out !== 'object' || Array.isArray(out)) continue;
      const key = shapeKey(c.endpoint, c.input && c.input.action);
      const nonEmpty = Object.keys(out).filter(k => !k.startsWith('_') && !isEmpty(out[k]));
      const prev = built.get(key);
      // INTERSECTION across cases for the same shape, not union. A key that is
      // populated in one golden and empty in another is not reliably expected,
      // and treating it as required would manufacture false positives.
      built.set(key, prev ? prev.filter(k => nonEmpty.includes(k)) : nonEmpty);
    }
  }
  return built;
}

function getIndex() {
  if (!index) index = buildIndex(nodePath.join(__dirname, '..', '..', 'audit'));
  return index;
}

/**
 * Compare an outgoing payload against the known-good shape for its endpoint.
 * @returns {null|{ thin: boolean, expected: number, missing: string[], ratio: number }}
 *          null when there is no baseline to compare against — no golden for
 *          this endpoint/action, too few expected keys, or a non-object payload.
 */
function assess(endpoint, action, payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null;
  if (payload.error) return null; // an error response is a different failure, already counted
  const expected = getIndex().get(shapeKey(endpoint, action));
  if (!expected || expected.length < MIN_EXPECTED_KEYS) return null;

  const missing = expected.filter(k => !(k in payload) || isEmpty(payload[k]));
  const ratio = missing.length / expected.length;
  return { thin: ratio >= MISSING_RATIO, expected: expected.length, missing, ratio };
}

/**
 * The whole observation, in one testable place. server.js wraps res.json and
 * calls this; keeping it here rather than inline in the middleware is what
 * makes it possible to prove the chain fires without a six-minute model call.
 * Records the metric and feeds the rate-based alerter. Never throws.
 * @returns {{ observed: boolean, thin?: boolean, missing?: string[] }}
 */
function observeJson({ fullPath, action, payload, statusCode, tool }) {
  if (statusCode !== 200) return { observed: false };
  const result = assess(fullPath, action, payload);
  if (!result) return { observed: false };
  if (!result.thin) return { observed: true, thin: false };

  const label = tool || String(fullPath || '').replace(/^\/api\//, '');
  const { logMetric } = require('./metricsSink');
  const { reportThinResult } = require('./alerts');
  logMetric('event', {
    event: 'tool_thin_result',
    path: fullPath,
    props: {
      tool: label,
      missing: result.missing.slice(0, 10),
      expected: result.expected,
      ratio: Math.round(result.ratio * 100) / 100,
    },
  });
  reportThinResult({ tool: label, missing: result.missing, expected: result.expected, path: fullPath });
  return { observed: true, thin: true, missing: result.missing };
}

// Exposed for tests.
function _setIndexForTest(map) { index = map; }
function _resetIndex() { index = null; }

module.exports = { assess, observeJson, shapeKey, isEmpty, buildIndex, _setIndexForTest, _resetIndex };
