// The V2 output standard, checked after generation rather than only asked for
// before it.
//
// PF-38 prevents bypass. V2 defines quality. This checks compliance. A tool
// guard captures the failure modes that are local to one tool. Gate 9 makes
// sure none of it is quietly skipped.
//
// ADVERSARIAL BY CONSTRUCTION, and never asked to improve anything: a model
// invited to rate its own draft rates it as fine. It sees the visitor's input,
// the tool's promise, and the draft — never the model's own reasoning.
//
// REPAIRS ONLY FLAGGED FIELDS. Regenerating the whole response to fix one line
// moves everything else too, and the drift lands somewhere nobody is looking.
const { callClaudeWithRetry, withLanguage } = require('./claude');
const { MODELS } = require('./models');
const { getByPath, setByPath, NO_QUOTE_RULE } = require('./factCheck');

// The seven checks. Deliberately phrased as things to FIND, not as advice.
const V2_CHECKS = `1. Claims about a real person's thoughts, feelings, motives, intentions, needs, likely reactions, or future behaviour that were not supplied or established.
2. Facts about the visitor or the situation that were invented, strengthened, or silently inferred.
3. Predictions, rankings, timing rules, probabilities, scores, or population claims without support.
4. Psychological, behavioural or interpersonal labels presented as determinations rather than possibilities.
5. Explanatory commentary that mainly explains the model's own work rather than helping the visitor.
6. Sections that do not materially help complete the tool's promise.
7. Output the tool promised that is missing.`;

// Named so a violation reads the same way in a log, a test and a guard.
const VIOLATION_TYPES = [
  'invented_fact', 'mind_reading', 'unsupported_prediction', 'unnecessary_section',
  'self_explanation', 'false_precision', 'promise_not_fulfilled',
];

/**
 * @param draft            parsed model response, mutated in place
 * @param opts.label       route slug, for the log line
 * @param opts.fields      [[path, text], ...] to inspect
 * @param opts.supplied    what the visitor actually typed
 * @param opts.promise     one line: what this tool undertakes to deliver
 * @param opts.guard       router.outputGuard — { prohibit: [], require: [] }
 * @param opts.userLanguage / opts.locale
 * @returns violations (possibly empty); never throws past its caller's catch
 */
async function runOutputGuard(draft, opts) {
  const { label, fields, supplied, promise, guard = {}, userLanguage, locale = '' } = opts;
  if (!Array.isArray(fields) || !fields.length) return [];

  const prohibit = Array.isArray(guard.prohibit) ? guard.prohibit : [];
  const require_ = Array.isArray(guard.require) ? guard.require : [];

  const guardBlock = [
    prohibit.length ? `THIS TOOL ADDITIONALLY PROHIBITS — treat any instance as a violation:\n${prohibit.map(x => `- ${x}`).join('\n')}` : '',
    require_.length ? `AND MUST DELIVER:\n${require_.map(x => `- ${x}`).join('\n')}` : '',
  ].filter(Boolean).join('\n\n');

  const checkPrompt = `Review this proposed tool output against the DeftBrain V2 standard and the tool-specific guard.

WHAT THIS TOOL PROMISES:
${promise}

WHAT THE VISITOR ACTUALLY TYPED — the complete set of established facts:
${supplied}

${guardBlock}

PROPOSED OUTPUT:
${fields.map(([path, value]) => `${path}:\n${value}`).join('\n\n')}

Look for:
${V2_CHECKS}

Judge only against the standard and the guard. Say nothing about style, wording or how good the writing is, and do not flag a bracketed placeholder like [Name] — those are intentional.

Return PASS, or FAIL with one entry per violation. Do not rewrite the output.

OUTPUT (JSON only):
{
  "verdict": "PASS or FAIL",
  "violations": [
    { "field": "exact identifier from the proposed output", "violation_type": "one of: ${VIOLATION_TYPES.join(', ')}, or a guard term above", "offending_text": "the exact phrase, quoted", "reason": "a few words" }
  ]
}

verdict and field are machine identifiers, not prose. Write verdict as the English word PASS or FAIL whatever language the rest of this is in, and copy field character-for-character. Code compares both literally; a translated one matches nothing and the check is silently lost.

${NO_QUOTE_RULE}
CRITICAL: Return ONLY valid JSON. No preamble, no markdown.`;

  const check = await callClaudeWithRetry({
    model: MODELS.FAST,
    max_tokens: 2500,
    messages: [{ role: 'user', content: withLanguage(checkPrompt, userLanguage) }],
  }, { label: `${label}-guard` });

  // One repair per field: two violations in one field would otherwise be
  // rewritten independently against the original, and the second write would
  // silently undo the first.
  const byField = new Map();
  (Array.isArray(check?.violations) ? check.violations : [])
    .filter(v => v && typeof v.field === 'string' && getByPath(draft, v.field) !== undefined)
    .forEach(v => {
      if (!byField.has(v.field)) byField.set(v.field, []);
      byField.get(v.field).push(v);
    });
  const violations = [...byField.values()].map(vs => vs[0]);
  const allByField = [...byField.entries()];

  // Logged on every call, pass or fail. A checker that has stopped working
  // returns the same empty list as one that found nothing, and this path is
  // fail-open, so nothing else would ever say so.
  console.log(`[${label}] v2 guard: ${String(check?.verdict).toUpperCase() === 'FAIL' ? 'FAIL' : 'PASS'} (${violations.length} field(s)${violations.length ? ': ' + violations.map(v => `${v.field}=${v.violation_type}`).join(', ') : ''})`);

  if (String(check?.verdict).toUpperCase() !== 'FAIL' || !violations.length) return [];

  const repairPrompt = `Rewrite only these fields of a tool's output. Every other field passed and must not be touched.

WHAT THIS TOOL PROMISES:
${promise}

WHAT THE VISITOR ACTUALLY TYPED:
${supplied}

${allByField.map(([field, vs], i) => `${i}. [${field}]
current:
${getByPath(draft, field)}

violations:
${vs.map(v => `- ${v.violation_type}: "${v.offending_text}"${v.reason ? ` — ${v.reason}` : ''}`).join('\n')}`).join('\n\n')}

Preserve useful content and tone. Remove the identified violations and nothing else.

Do not replace a violation with a milder version of itself — swapping "they are being manipulative" for "they may be being manipulative" keeps the determination and adds a hedge. Cut the claim. If removing it leaves the field shorter or plainer, that is correct, and if it leaves the field with nothing to say, return an empty string rather than filler.

OUTPUT (JSON only):
{ "fixes": [ { "n": 0, "value": "the full rewritten field" } ] }

${NO_QUOTE_RULE}
CRITICAL: Return ONLY valid JSON. No preamble, no markdown.`;

  const repair = await callClaudeWithRetry({
    model: MODELS.FAST,
    max_tokens: 3000,
    messages: [{ role: 'user', content: withLanguage(repairPrompt, userLanguage) + locale }],
  }, { label: `${label}-guard-repair` });

  // Keyed by NUMBER: withLanguage translates JSON string values, and a
  // translated field path addresses nothing.
  (Array.isArray(repair?.fixes) ? repair.fixes : []).forEach(fix => {
    const entry = allByField[Number(fix?.n)];
    if (!entry || typeof fix.value !== 'string') return;
    setByPath(draft, entry[0], fix.value.trim());
  });

  return violations;
}

module.exports = { runOutputGuard, V2_CHECKS, VIOLATION_TYPES };
