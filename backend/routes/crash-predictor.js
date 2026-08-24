const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, withLanguage, withLocaleContext } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');
const { runOutputGuard } = require('../lib/outputGuard');

const NO_QUOTE_RULE = 'Never place a double-quote (") character inside any JSON string value. Use single quotes or plain text inside JSON string values.';

function activeKeys(obj = {}) {
  return Object.keys(obj).filter(k => obj[k]);
}

function buildLogSummary(log, idx, total) {
  const physical = activeKeys(log.physicalSymptoms);
  const noticed = [
    ...activeKeys(log.warningSigns),
    ...(log.customSymptoms || []).filter(s => s && s.active).map(s => s.label),
  ];

  return `Check-in ${idx + 1} of ${total} (${log.date || 'date not supplied'})
Energy: ${log.energy ?? 'not tracked'}/10
Sleep: ${log.sleep ?? 'not tracked'}/10
Stress: ${log.stress ?? 'not tracked'}/10
Mood: ${log.mood ?? 'not tracked'}/10
Activities: ${activeKeys(log.activities).join(', ') || 'none logged'}
Physical signals: ${physical.join(', ') || 'none logged'}
Other noticed signals: ${noticed.join(', ') || 'none logged'}
Caffeine: ${log.caffeine ?? 0}
Alcohol: ${log.alcohol ?? 0}
Medication note: ${log.medications || 'none'}
Menstrual/cycle note: ${log.menstrualPhase && log.menstrualPhase !== 'na' ? log.menstrualPhase : 'not tracked'}
Biometrics: ${[
    log.biometrics?.hrv ? `HRV ${log.biometrics.hrv}` : null,
    log.biometrics?.restingHR ? `resting HR ${log.biometrics.restingHR}` : null,
    log.biometrics?.sleepHours ? `sleep hours ${log.biometrics.sleepHours}` : null,
    log.biometrics?.steps ? `steps ${log.biometrics.steps}` : null,
  ].filter(Boolean).join(', ') || 'none logged'}
Weather note: ${[
    log.weather?.condition,
    log.weather?.barometricPressure ? `pressure ${log.weather.barometricPressure}` : null,
  ].filter(Boolean).join(', ') || 'none logged'}
User marked a crash/hit-a-wall day: ${log.crashDay ? 'yes' : 'no'}
Notes: ${log.notes || 'none'}`;
}

const SYSTEM = `You help a person learn from their own repeated check-ins.

Your job is pattern noticing, not diagnosis and not prediction.

EPISTEMIC RULES:
1. Treat every check-in as user-reported data, not objective proof of a medical or psychological state.
2. Never diagnose burnout, depression, anxiety, autonomic dysfunction, hormonal problems, medication effects, weather sensitivity, or any other condition.
3. Never predict a crash, assign crash probability, estimate days until a crash, predict severity, or use green/yellow/orange/red risk levels.
4. Never tell the user that the tool knows their state better than they do.
5. Never assign universal meanings or danger thresholds to HRV, resting heart rate, steps, sleep, caffeine, alcohol, menstrual phase, weather, symptoms, or any other signal.
6. You may compare a person's current entries with their own earlier entries.
7. You may describe repeated co-occurrence only when the supplied logs support it. Say exactly how many observations support the pattern when practical.
8. Correlation is not causation. Use language such as 'showed up together', 'coincided with', 'appeared in the same check-ins', or 'worth watching'. Do not say one signal caused another.
9. If there are too few observations, say so. A possible pattern is more useful than fabricated certainty.
10. If the user has marked crash/hit-a-wall days, you may compare the entries before those marked days with other periods. Do not redefine what a crash means.
11. Recommendations should be small, reversible experiments that help the user learn more from future check-ins. Do not prescribe medical treatment, medication changes, sick leave, emergency protocols, or rigid recovery timelines.
12. Do not infer motives, personality, coping style, masking, poor interoception, or an inability to assess oneself.
13. Use only facts present in the logs. Do not invent work demands, family circumstances, diagnoses, routines, or symptoms.
14. Lead with the most useful observation. Keep the report compact. Say each point once.
15. ${NO_QUOTE_RULE}`;

const ANALYZE_SCHEMA = `Return ONLY valid JSON in exactly this shape:
{
  "headline": "One grounded sentence describing the most useful recent observation. If evidence is thin, say that.",
  "recent_changes": [
    {
      "signal": "short label",
      "observation": "what changed, using only the supplied logs",
      "evidence": "brief concrete support, preferably counts/dates or comparison with this user's recent entries"
    }
  ],
  "patterns_worth_noticing": [
    {
      "pattern": "short label",
      "observation": "what tended to show up together",
      "evidence": "how many observations support it",
      "confidence_note": "established in these logs | possible pattern | too little data"
    }
  ],
  "not_enough_evidence_yet": [
    "A tempting conclusion the data does not yet support, stated plainly"
  ],
  "compared_with_your_usual": [
    {
      "signal": "energy | sleep | stress | mood | another tracked signal",
      "comparison": "short comparison with this user's own logged baseline; omit if there is not enough data"
    }
  ],
  "small_experiment": {
    "try": "one small, reversible change based on the user's own pattern",
    "watch": "what to compare in the next several check-ins",
    "why_this_one": "one sentence tying the experiment to the observed logs without claiming causation"
  },
  "your_own_clues": [
    "recurring user-reported signals that actually appear in the logs"
  ]
}

ARRAY RULES:
- recent_changes: 0-4 items
- patterns_worth_noticing: 0-4 items
- not_enough_evidence_yet: 0-3 items
- compared_with_your_usual: 0-4 items
- your_own_clues: 0-5 items
- Empty arrays are allowed and preferred to invented content.
- Do not add other keys.`;

const PATTERN_SCHEMA = `Return ONLY valid JSON in exactly this shape:
{
  "headline": "One sentence describing the strongest long-term pattern, or saying that no stable pattern is established yet.",
  "recurring_patterns": [
    {
      "pattern": "short label",
      "evidence": "specific support from the logs",
      "limits": "what the logs cannot establish"
    }
  ],
  "before_marked_crash_days": [
    {
      "observation": "a signal or combination that appeared before user-marked crash days",
      "evidence": "how often it appeared before marked crash days versus other periods"
    }
  ],
  "day_or_week_patterns": [
    {
      "observation": "a repeated calendar pattern supported by the logs",
      "evidence": "specific support"
    }
  ],
  "things_that_did_not_repeat": [
    "signals that appeared but did not form a stable pattern"
  ],
  "next_learning_step": {
    "track": "one thing worth continuing or adding",
    "reason": "why it would help distinguish between plausible interpretations"
  }
}

RULES:
- Never manufacture a pattern because the endpoint is called patterns.
- before_marked_crash_days must be empty if the user has not marked crash days.
- Do not add other keys.`;

// callClaudeWithRetry already strips fences, repairs the JSON and parses it —
// see lib/claude.js. It returns an OBJECT, so a second JSON.parse here received
// "[object Object]" and threw on every single call.
//
// Its signature is (promptOrRequest, options) — two arguments. `label` and
// `max_tokens` live in that options object, and `max_tokens` is snake_case:
// passing `maxTokens` silently left these schemas on the 2500 default, which
// is where a bounded 4200-token output would have truncated.
async function callStructured({ prompt, system, userLanguage, userLocale, label }) {
  const localizedSystem = withLanguage(system, userLanguage) + withLocaleContext(userLocale);
  // Full-request form, not simple-string. S7.12: the string form has silently
  // dropped model/system/label before, and this route needs all three.
  return callClaudeWithRetry({
    model: MODELS.SMART,
    max_tokens: 4200,
    system: localizedSystem,
    messages: [{ role: 'user', content: prompt }],
  }, { label });
}

// Everything the visitor actually recorded, as the guard's source of truth.
// A check-in tool's whole failure mode is a day, a number or a note that was
// never logged reappearing as a finding.
function suppliedFrom(logs) {
  return `THE CHECK-INS THE VISITOR RECORDED (${logs.length} in total) — nothing else about them is known:
${logs.map((l, i) => `${i + 1}. ${JSON.stringify(l)}`).join('\n')}

There is no other source. A date, a score, an activity or a note that is not in this list was invented. Correlation between two logged fields is not a cause, and a handful of check-ins is not a rate, a percentage or a prediction about a future day.`;
}

async function guardResult(result, { logs, label, promise, userLanguage, userLocale }) {
  const fields = [];
  const walk = (val, path) => {
    if (typeof val === 'string' && val.trim().length > 15) fields.push([path, val]);
    else if (Array.isArray(val)) val.forEach((v, i) => walk(v, `${path}[${i}]`));
    else if (val && typeof val === 'object') Object.entries(val).forEach(([k, v]) => walk(v, path ? `${path}.${k}` : k));
  };
  walk(result, '');
  await runOutputGuard(result, {
    label,
    fields,
    supplied: suppliedFrom(logs),
    promise,
    guard: router.outputGuard,
    userLanguage,
    locale: withLocaleContext(userLocale),
  });
}

router.post('/crash-predictor-analyze', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { logs = [], userLanguage, userLocale } = req.body;
    if (!Array.isArray(logs) || logs.length < 2) {
      return res.status(400).json({ error: 'Add at least 2 check-ins before asking for a comparison.' });
    }

    const summaries = logs.slice(0, 60).map((log, i, arr) => buildLogSummary(log, i, arr.length)).join('\n\n');
    const prompt = `CHECK-INS:\n${summaries}\n\n${ANALYZE_SCHEMA}`;
    const result = await callStructured({
      prompt,
      system: SYSTEM,
      userLanguage,
      userLocale,
      label: 'crash-predictor-v2-analyze',
    });

    // Shape check before anything else touches it: the frontend maps over these
    // arrays, so a malformed response ships as a render crash rather than an
    // error anyone can act on.
    if (!result?.headline || !Array.isArray(result.recent_changes)) {
      console.error('Crash Predictor: unexpected analyze shape', Object.keys(result || {}));
      return res.status(500).json({ error: 'Could not compare these check-ins.' });
    }

    // Fail-open: it wraps a working answer.
    try {
      await guardResult(result, {
        logs: logs.slice(0, 60),
        label: 'crash-predictor-analyze',
        promise: 'Compare the check-ins the visitor recorded and show what changed between them.',
        userLanguage, userLocale,
      });
    } catch (guardErr) {
      console.error('[crash-predictor] v2 guard skipped:', guardErr.message);
    }

    res.json(result);
  } catch (error) {
    console.error('Crash Predictor V2 analyze error:', error);
    res.status(500).json({ error: 'Could not compare these check-ins.' });
  }
});

router.post('/crash-predictor-patterns', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { logs = [], userLanguage, userLocale } = req.body;
    if (!Array.isArray(logs) || logs.length < 7) {
      return res.status(400).json({ error: 'Keep checking in a little longer before looking for longer-term patterns.' });
    }

    const summaries = logs.slice(0, 120).map((log, i, arr) => buildLogSummary(log, i, arr.length)).join('\n\n');
    const prompt = `CHECK-INS:\n${summaries}\n\n${PATTERN_SCHEMA}`;
    const result = await callStructured({
      prompt,
      system: SYSTEM,
      userLanguage,
      userLocale,
      label: 'crash-predictor-v2-patterns',
    });

    // Shape check before anything else touches it: the frontend maps over these
    // arrays, so a malformed response ships as a render crash rather than an
    // error anyone can act on.
    if (!result?.headline || !Array.isArray(result.recurring_patterns)) {
      console.error('Crash Predictor: unexpected patterns shape', Object.keys(result || {}));
      return res.status(500).json({ error: 'Could not compare the longer-term pattern.' });
    }

    // Fail-open: it wraps a working answer.
    try {
      await guardResult(result, {
        logs: logs.slice(0, 120),
        label: 'crash-predictor-patterns',
        promise: 'Show what repeats across the check-ins the visitor recorded over time.',
        userLanguage, userLocale,
      });
    } catch (guardErr) {
      console.error('[crash-predictor] v2 guard skipped:', guardErr.message);
    }

    res.json(result);
  } catch (error) {
    console.error('Crash Predictor V2 patterns error:', error);
    res.status(500).json({ error: 'Could not compare the longer-term pattern.' });
  }
});

// PF-39. The guard is a PROFILE, not a name — lib/outputGuard reads
// guard.prohibit and guard.require, so a string here declares nothing and the
// checker runs with no tool-specific terms at all.
router.outputStandard = 'v2';
router.outputGuard = {
  prohibit: [
    'invented_log_entry',              // a day, number or note the visitor did not record
    'causal_claim_from_correlation',   // "the poor sleep caused the crash"
    'medical_or_diagnostic_language',
    'unsupported_prediction',          // "you are heading for a crash on Thursday"
    'false_precision',                 // a percentage or score over a handful of check-ins
    'pattern_from_too_few_days',
  ],
  require: [
    'traceable_to_logged_entries',
    'fulfills_tool_promise',
  ],
};

module.exports = router;
