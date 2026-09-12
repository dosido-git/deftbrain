const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, withLanguage } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

// Ground-up rebuild (2026-09-11), installed from an owner-supplied rewrite
// per audit/REWRITE-INSTALL-KIT.md. Replaces the six-mode weekly-audit
// design (Daily Check-In, Planner, Recharge, Weekly Audit, Say Yes?, Journal
// — capacity/budget arithmetic, recovery-hour prescriptions, energy
// forecasts) with two states: log one interaction, then review patterns
// across the logs. The endpoint path is kept as /social-energy-audit (the
// tool's internal/legacy name) even though the display name and route file
// are Social Battery Advisor — same convention as every other rename in
// this codebase: the i18n prefix, localStorage keys, and endpoint stay
// stable so existing links and saved state don't break.
//
// No withLocaleContext: this tool has no economic or price content to
// localize (same reasoning as nerve-check.js) — never imported here.
//
// validateResult() below IS the check router.outputStandard='v2' declares:
// worth_noticing/contrasts are capped and filtered, test_next is forced to
// a single well-shaped object (never a second experiment), and the summary
// counts are always recomputed from the actual logs rather than trusted
// from the model. The epistemic discipline itself (no capacity/budget
// language, no crash prediction, pattern-threshold gating) lives in
// CONTRACT below and is prompt-enforced, not code-verified.
router.outputStandard = 'v2';
router.outputGuard = {
  prohibit: [
    'worth_noticing_or_contrasts_exceeding_the_declared_caps',
    'more_than_one_test_next_experiment_reaching_the_visitor',
    'summary_counts_disagreeing_with_the_actual_submitted_logs',
    'malformed_array_item_passed_through_unfiltered',
  ],
  require: ['fulfills_tool_promise'],
};

const NO_QUOTE_RULE = 'Never place a double-quote (") character inside any JSON string value — a visitor note or quoted phrase must be written plainly or with single quotes, or it breaks the JSON.';

const CONTRACT = `You are Social Battery Advisor.

PURPOSE
Help the visitor learn which INTERACTIONS WITH PEOPLE tend to leave them with more, less, or similar self-rated energy, and what differences may be worth testing.

NORTH STAR
LEARN FROM THEIR INTERACTIONS. NOTICE CONTRASTS. DO NOT INVENT THE PEOPLE.

BOUNDARY
This tool is about social/interpersonal interactions: meetings, calls, visits, meals, gatherings, dates, parties, customer interactions, group activities, family interactions, and similar encounters with people.
It is NOT a general energy tracker, wellness tracker, burnout detector, crash predictor, or productivity planner.
Do not predict a crash. That belongs to Before the Crash.

EVIDENCE
Each log is a self-report containing:
- interaction label;
- energy before;
- energy after;
- how much the visitor felt they had to be on;
- optional note;
- date/time metadata.

Treat the ratings as ordinal self-reports, not physical units in a battery.
Straight subtraction may be used to describe the direction and size of a before/after change within an entry, but never convert it into capacity, cost per hour, a weekly budget, recovery requirement, physiological depletion, or future prediction.

NEVER INFER
- personality or introversion/extroversion;
- anxiety, masking, burnout, resentment, emotional labor, authenticity, vulnerability, closeness, relationship quality, motives, or hidden preferences;
- why another person behaved as they did;
- that being more on caused an energy change;
- that group size, familiarity, duration, setting, or any other factor caused a change unless the visitor's repeated data actually isolates it;
- that an interaction will have the same effect next time.

EVIDENCE LEVELS
ONE LOG: say what happened once.
REPEATED COMPARABLE LOGS: identify a pattern worth noticing.
CONTRAST: compare two or more supplied logs and identify a difference without claiming the difference caused the result.
HYPOTHESIS: propose one thing to watch or test next.
UNKNOWN: say when the data does not establish an answer.

PATTERN THRESHOLD
Do not call something a personal pattern from a single example.
Use cautious language with 2 comparable observations.
With 3+ comparable observations pointing the same direction, you may say the logs show a repeated pattern, while still avoiding causal claims.

ACTION
Prefer one small experiment at a time.
A good experiment changes one controllable feature, if practical, and says what to compare next time.
Never tell the visitor to drop a relationship, skip an obligation, or set a boundary based solely on energy ratings.
Never decide whether an interaction is worth having. Energy is one consideration, not the value of the relationship or commitment.

OUTPUT
Conform to DEFTBRAIN_OUTPUT_STANDARD_V2.
Reason freely. Assert carefully.
Return ONLY valid JSON.

${NO_QUOTE_RULE}`;

function normalize(log, i) {
  const before = Number(log.before ?? log.energyBefore);
  const after = Number(log.after ?? log.energyAfter);
  const onness = log.onness || log.onNess || log.performance || null;
  return {
    id: log.id || String(i + 1),
    interaction: String(log.interaction || log.situation || '').trim(),
    before: Number.isFinite(before) ? before : null,
    after: Number.isFinite(after) ? after : null,
    change: Number.isFinite(before) && Number.isFinite(after) ? after - before : null,
    onness,
    note: String(log.note || '').trim(),
    createdAt: log.createdAt || null,
  };
}

// Structural sanitization only — see the file-header comment. This does NOT
// verify the model avoided capacity/budget language or a crash prediction;
// that discipline is prompt-enforced (CONTRACT above), not code-checkable.
function validateResult(parsed, counts) {
  if (!parsed?.summary || typeof parsed.summary !== 'object') return null;
  const headline = typeof parsed.summary.headline === 'string' ? parsed.summary.headline : '';
  const body = typeof parsed.summary.body === 'string' ? parsed.summary.body : '';
  if (!headline && !body) return null;

  const worthNoticing = Array.isArray(parsed.worth_noticing)
    ? parsed.worth_noticing
        .filter(x => x && typeof x === 'object')
        .slice(0, 3)
        .map(x => ({
          title: typeof x.title === 'string' ? x.title : '',
          evidence: typeof x.evidence === 'string' ? x.evidence : '',
          meaning: typeof x.meaning === 'string' ? x.meaning : '',
        }))
        .filter(x => x.title || x.evidence || x.meaning)
    : [];

  const contrasts = Array.isArray(parsed.contrasts)
    ? parsed.contrasts
        .filter(x => x && typeof x === 'object')
        .slice(0, 2)
        .map(x => ({
          title: typeof x.title === 'string' ? x.title : '',
          first: typeof x.first === 'string' ? x.first : '',
          second: typeof x.second === 'string' ? x.second : '',
          question: typeof x.question === 'string' ? x.question : '',
        }))
        .filter(x => x.title || x.first || x.second || x.question)
    : [];

  const tn = parsed.test_next && typeof parsed.test_next === 'object' ? parsed.test_next : {};
  const testNext = {
    observation: typeof tn.observation === 'string' && tn.observation.trim() ? tn.observation.trim() : null,
    experiment: typeof tn.experiment === 'string' && tn.experiment.trim() ? tn.experiment.trim() : null,
    watch_for: typeof tn.watch_for === 'string' && tn.watch_for.trim() ? tn.watch_for.trim() : null,
  };

  const notEnough = Array.isArray(parsed.not_enough_to_tell)
    ? parsed.not_enough_to_tell.filter(x => typeof x === 'string' && x.trim()).slice(0, 4)
    : [];

  const ho = parsed.handoff && typeof parsed.handoff === 'object' ? parsed.handoff : {};
  const showCrash = ho.show_before_the_crash === true;
  const handoff = {
    show_before_the_crash: showCrash,
    reason: showCrash && typeof ho.reason === 'string' && ho.reason.trim() ? ho.reason.trim() : null,
  };

  return {
    summary: { headline, body, counts },
    worth_noticing: worthNoticing,
    contrasts,
    test_next: testNext,
    not_enough_to_tell: notEnough,
    handoff,
  };
}

router.post('/social-energy-audit', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { logs, interactions, userLanguage } = req.body;
    const source = Array.isArray(logs) ? logs : interactions;
    if (!Array.isArray(source) || source.length < 1) {
      return res.status(400).json({ error: 'Log at least one interaction first.' });
    }

    const normalized = source.map(normalize).filter(x => x.interaction && x.before != null && x.after != null);
    if (!normalized.length) {
      return res.status(400).json({ error: 'Each log needs an interaction and before/after energy ratings.' });
    }

    const lower = normalized.filter(x => x.change < 0).length;
    const same = normalized.filter(x => x.change === 0).length;
    const higher = normalized.filter(x => x.change > 0).length;
    const counts = { total: normalized.length, lower, same, higher };

    const logText = normalized.map((x, i) =>
      `${i + 1}. ${x.interaction} | energy ${x.before}→${x.after} | change ${x.change >= 0 ? '+' : ''}${x.change} | on-ness ${x.onness || 'not supplied'}${x.note ? ` | visitor note: ${x.note}` : ''}${x.createdAt ? ` | logged ${x.createdAt}` : ''}`
    ).join('\n');

    const prompt = `INTERACTION LOGS\n${logText}\n\nOBSERVED COUNTS\n${normalized.length} logged interactions; ${lower} ended lower; ${same} ended the same; ${higher} ended higher.\n\nReturn JSON with exactly this shape:\n{
  "summary": {
    "headline": "A short factual headline about what these logs show",
    "body": "1-2 sentences. Start with observations, not interpretation.",
    "counts": { "total": ${normalized.length}, "lower": ${lower}, "same": ${same}, "higher": ${higher} }
  },
  "worth_noticing": [
    {
      "title": "Short observation title",
      "evidence": "Specific supplied logs that support it",
      "meaning": "What is reasonable to notice, with uncertainty proportional to the sample"
    }
  ],
  "contrasts": [
    {
      "title": "A useful comparison",
      "first": "One supplied interaction/result",
      "second": "Another supplied interaction/result",
      "question": "One neutral question about what may have differed"
    }
  ],
  "test_next": {
    "observation": "The supplied observation that makes this worth testing, or null",
    "experiment": "ONE small controllable change to try next time, or null if the data does not justify one",
    "watch_for": "What before/after result to compare, or null"
  },
  "not_enough_to_tell": ["Important conclusions the logs do not establish yet"],
  "handoff": {
    "show_before_the_crash": false,
    "reason": null
  }
}\n\nRules for this response:\n- worth_noticing: 1-3 items; with only one log, usually one item.\n- contrasts: 0-2 items; only compare actual supplied logs.\n- test_next: exactly one experiment at most.\n- Do not recommend Before the Crash merely because energy went down. Set show_before_the_crash true only if the visitor's own note explicitly says they feel close to a crash/overload or asks about warning signs.\n- Do not invent causes.\n- Do not use weekly budget, capacity, depletion, sustainability, recovery dose, energy cost/hour, or burnout language.\n- ${NO_QUOTE_RULE}`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.FAST,
      max_tokens: 3500,
      system: withLanguage(CONTRACT, userLanguage),
      messages: [{ role: 'user', content: prompt }],
    }, { label: 'social-battery-advisor-patterns' });

    const result = validateResult(parsed, counts);
    if (!result) return res.status(500).json({ error: 'Could not review your interaction logs. Please try again.' });
    res.json(result);
  } catch (error) {
    console.error('SocialBatteryAdvisor error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
