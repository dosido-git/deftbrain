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
2b. A supplied fact CONTRADICTED or quietly swapped for a different one. Told the relationship is a partner, the output calls them a roommate; told the message came by text, it discusses a phone call. This is the most damaging kind, because the visitor knows it is wrong the moment they read it and stops trusting the rest. Check every noun that names a person, a place or a channel against what was typed.
3. Predictions, rankings, timing rules, probabilities, scores, or population claims without support.
4. Psychological, behavioural or interpersonal labels presented as determinations rather than possibilities — including a NAME FOR AN ATTITUDE behind someone's words. Contempt, disdain, dismissiveness, passive aggression, defensiveness and hostility are verdicts on a person, not descriptions of a sentence, and hedging one does not fix it. Also any "likely meaning": you cannot know that literal words meant their opposite.
5. Explanatory commentary that mainly explains the model's own work rather than helping the visitor.
6. Sections that do not materially help complete the tool's promise.
7. Output the tool promised that is missing.`;

// Named so a violation reads the same way in a log, a test and a guard.
const VIOLATION_TYPES = [
  'invented_fact', 'contradicted_supplied_fact', 'mind_reading', 'unsupported_prediction',
  'unnecessary_section', 'self_explanation', 'false_precision', 'promise_not_fulfilled',
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
// A guarded call is generate + check + repair. Each stage is bounded here so
// the total cannot drift past what an edge proxy will wait for. Numbers are
// deliberately well under any plausible gateway timeout: a slightly less
// polished answer beats a 502, every time.
const CHECK_BUDGET_MS  = Number(process.env.OUTPUT_GUARD_CHECK_MS  || 45_000);
const REPAIR_BUDGET_MS = Number(process.env.OUTPUT_GUARD_REPAIR_MS || 45_000);

// Resolves to `fallback` if the promise has not settled in time. The work
// carries on in the background and is ignored — we are past caring about it.
function withDeadline(promise, ms, fallback, label, stage) {
  let timer;
  const bail = new Promise(resolve => {
    timer = setTimeout(() => {
      console.log(`[${label}] v2 guard: ${stage} exceeded ${ms}ms — skipped, returning the unguarded result`);
      resolve(fallback);
    }, ms);
    timer.unref?.();
  });
  return Promise.race([promise, bail]).finally(() => clearTimeout(timer));
}

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

  // maxRetries: 0 — a check that failed once has already cost the visitor time,
  // and retrying it buys a nicety, not the answer.
  const check = await withDeadline(
    callClaudeWithRetry({
      model: MODELS.FAST,
      max_tokens: 2500,
      messages: [{ role: 'user', content: withLanguage(checkPrompt, userLanguage) }],
    }, { label: `${label}-guard`, maxRetries: 0 }).catch(err => {
      console.log(`[${label}] v2 guard: check failed (${err.message}) — returning the unguarded result`);
      return null;
    }),
    CHECK_BUDGET_MS, null, label, 'check');

  // One repair per field: two violations in one field would otherwise be
  // rewritten independently against the original, and the second write would
  // silently undo the first.
  const byField = new Map();
  // The checker sometimes names a CONTAINER — "factors_harder" — when it means
  // one element of it. getByPath returns the array, so the old `!== undefined`
  // test let it through, and setByPath then wrote the repair STRING over the
  // whole array. Downstream that is either a section that silently vanishes
  // (a route that re-sanitises) or a .map() on a string (a white screen).
  // Found on drive-home, 2026-08-25; it could have happened to any v2 route.
  // Repairs only ever rewrite string leaves, so requiring one here removes the
  // failure without narrowing what the guard can legitimately fix.
  const containerHits = [];
  (Array.isArray(check?.violations) ? check.violations : [])
    .filter(v => {
      if (!v || typeof v.field !== 'string') return false;
      if (typeof getByPath(draft, v.field) !== 'string') {
        if (getByPath(draft, v.field) !== undefined) containerHits.push(v.field);
        return false;
      }
      return true;
    })
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
  if (containerHits.length) {
    console.log(`[${label}] v2 guard: dropped ${containerHits.length} violation(s) naming a non-string field, not repaired: ${containerHits.join(', ')}`);
  }

  if (String(check?.verdict).toUpperCase() !== 'FAIL' || !violations.length) return [];

  // Fields that passed, shown to the repair as context it must stay
  // consistent with. Without this a repaired field can contradict the rest of
  // the response — the repair only ever saw the one field it was rewriting.
  const flagged = new Set(allByField.map(([f]) => f));
  const untouched = fields
    .filter(([path]) => !flagged.has(path))
    .slice(0, 40)
    .map(([path, value]) => `${path}: ${value}`)
    .join('\n');

  const repairPrompt = `Rewrite only these fields of a tool's output. Every other field passed and must not be touched.

WHAT THIS TOOL PROMISES:
${promise}

WHAT THE VISITOR ACTUALLY TYPED:
${supplied}

THE REST OF THE RESPONSE — these fields PASSED and are staying exactly as they are. Whatever you write must be consistent with them. If one of them states a conclusion, a choice or a recommendation, your rewrite must not contradict it or substitute a different one:
${untouched || '(no other fields)'}

${allByField.map(([field, vs], i) => `${i}. [${field}]
current:
${getByPath(draft, field)}

violations:
${vs.map(v => `- ${v.violation_type}: "${v.offending_text}"${v.reason ? ` — ${v.reason}` : ''}`).join('\n')}`).join('\n\n')}

Preserve useful content and tone. Remove the identified violations and nothing else.

Do not replace a violation with a milder version of itself — swapping "they are being manipulative" for "they may be being manipulative" keeps the determination and adds a hedge. Cut the claim. If removing it leaves the field shorter or plainer, that is correct.

WHERE THE FIELD IS A DELIVERABLE — a message to send, an option to choose — it must come back usable. Never empty, never a placeholder, never a note about why it was removed. If the violation was the whole idea, write a different one that does the same job without it: the visitor was promised this option and an empty box is not one.

OUTPUT (JSON only):
{ "fixes": [ { "n": 0, "value": "the full rewritten field" } ] }

${NO_QUOTE_RULE}
CRITICAL: Return ONLY valid JSON. No preamble, no markdown.`;

  const repair = await withDeadline(
    callClaudeWithRetry({
      model: MODELS.FAST,
      max_tokens: 3000,
      messages: [{ role: 'user', content: withLanguage(repairPrompt, userLanguage) + locale }],
    }, { label: `${label}-guard-repair`, maxRetries: 0 }).catch(err => {
      console.log(`[${label}] v2 guard: repair failed (${err.message}) — flagged fields left as written`);
      return null;
    }),
    REPAIR_BUDGET_MS, null, label, 'repair');
  if (!repair) return violations;

  // Snapshot before writing: a repair that empties a promised deliverable is
  // worse than the violation it removed, and the visitor is left with a blank
  // option where the tool said there would be one.
  const before = new Map(allByField.map(([field]) => [field, getByPath(draft, field)]));

  // Keyed by NUMBER: withLanguage translates JSON string values, and a
  // translated field path addresses nothing.
  (Array.isArray(repair?.fixes) ? repair.fixes : []).forEach(fix => {
    const entry = allByField[Number(fix?.n)];
    if (!entry || typeof fix.value !== 'string') return;
    setByPath(draft, entry[0], fix.value.trim());
  });

  // Structural completeness. A field the tool promised must still hold
  // something usable; if the repair hollowed it out, keep what was there. A
  // flawed reply the visitor can edit beats an empty box they cannot use.
  const required = Array.isArray(opts.requiredNonEmpty) ? opts.requiredNonEmpty : [];
  const restored = [];
  for (const field of required) {
    const now = getByPath(draft, field);
    if (typeof now === 'string' && now.trim().length >= 2) continue;
    if (!before.has(field)) continue;
    const was = before.get(field);
    if (typeof was === 'string' && was.trim()) { setByPath(draft, field, was); restored.push(field); }
  }
  if (restored.length) {
    console.log(`[${label}] v2 guard: repair emptied ${restored.length} required field(s), restored: ${restored.join(', ')}`);
  }

  return violations;
}

module.exports = { runOutputGuard, V2_CHECKS, VIOLATION_TYPES };
