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
const { currentRequestBody } = require('./outputStandard');

// The seven checks. Deliberately phrased as things to FIND, not as advice.
const V2_CHECKS = `1. Claims about a real person's thoughts, feelings, motives, intentions, needs, likely reactions, or future behaviour that were not supplied or established.
2. Facts about the visitor or the situation that were invented, strengthened, or silently inferred.
2b. A supplied fact CONTRADICTED or quietly swapped for a different one. Told the relationship is a partner, the output calls them a roommate; told the message came by text, it discusses a phone call. This is the most damaging kind, because the visitor knows it is wrong the moment they read it and stops trusting the rest. Check every noun that names a person, a place or a channel against what was typed.
3. Predictions, rankings, timing rules, probabilities, scores, or population claims without support.
4. Psychological, behavioural or interpersonal labels presented as determinations rather than possibilities — including a NAME FOR AN ATTITUDE behind someone's words. Contempt, disdain, dismissiveness, passive aggression, defensiveness and hostility are verdicts on a person, not descriptions of a sentence, and hedging one does not fix it. Also any "likely meaning": you cannot know that literal words meant their opposite.
5. Explanatory commentary that mainly explains the model's own work rather than helping the visitor.
6. Sections that do not materially help complete the tool's promise.
7. Output the tool promised that is missing.`;

// Two defect TYPES that no single field shows (audit/DEFECT-TYPES.md T3, T7).
// Kept separate so a route that is not on the v2 standard can run just these
// (opts.only = 'consistency') without inheriting the whole v2 review.
const CONSISTENCY_CHECKS = `8. Two parts of the output that CONTRADICT each other: one field says something and another says the opposite about the same thing — a count or total, a direction (higher/lower, for/against), a schedule or frequency, which option comes out ahead, whether something applies, what happened first. Each may read fine on its own; compare them. Flag one of the two and put the other field's exact identifier in "conflicts_with" — both will be rewritten together, so do not try to decide which one is right.
9. A CHOICE THE VISITOR MADE that the output ignores or goes against: an option, mode, style, tone, length, frequency or setting they picked, or something they asked to include or avoid (see THE VISITOR'S CHOICES, and what they typed). Writing as if they had chosen differently, or as if they had chosen nothing, is the violation. Flag the field where it happens.`;

// The visitor's own settings, from the request body (lib/outputStandard.js
// carries it per request). Long free text is already in `supplied`; what
// tends to get lost is the short stuff — "frequency: weekly", "avoid:
// sudden sounds", "style: disagree_and_commit" — so only short scalar values
// are listed. Locale plumbing, history and uploads are not choices.
const NOT_A_CHOICE = /^(user(Language|Locale|Currency|Region|Timezone)|sessionHistory|history|previous.*|image.*|file.*|.*base64.*|.*Data|pdf.*|audio.*|context|text|input)$/i;
function visitorChoices(body) {
  if (!body || typeof body !== 'object') return '';
  const out = [];
  const add = (key, v) => {
    if (out.length >= 30 || NOT_A_CHOICE.test(key.split('.').pop())) return;
    if (typeof v === 'boolean') { if (v) out.push(`${key}: yes`); return; }
    if (typeof v === 'number' && Number.isFinite(v)) { out.push(`${key}: ${v}`); return; }
    if (typeof v === 'string') {
      const t = v.trim();
      if (t && t.length <= 80 && !t.includes('\n')) out.push(`${key}: ${t}`);
      return;
    }
    if (Array.isArray(v)) {
      const items = v.filter(x => typeof x === 'string' && x.trim() && x.length <= 60).slice(0, 8);
      if (items.length && items.length === v.length) out.push(`${key}: ${items.join(', ')}`);
    }
  };
  for (const [k, v] of Object.entries(body)) {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      for (const [k2, v2] of Object.entries(v)) add(`${k}.${k2}`, v2);
    } else add(k, v);
  }
  return out.join('\n');
}

// Named so a violation reads the same way in a log, a test and a guard.
const VIOLATION_TYPES = [
  'invented_fact', 'contradicted_supplied_fact', 'mind_reading', 'unsupported_prediction',
  'unnecessary_section', 'self_explanation', 'false_precision', 'promise_not_fulfilled',
  'contradicts_another_field', 'ignored_visitor_choice',
];

/**
 * @param draft            parsed model response, mutated in place
 * @param opts.label       route slug, for the log line
 * @param opts.fields      [[path, text], ...] to inspect
 * @param opts.supplied    what the visitor actually typed
 * @param opts.promise     one line: what this tool undertakes to deliver
 * @param opts.guard       router.outputGuard — { prohibit: [], require: [] }
 * @param opts.userLanguage / opts.locale
 * @param opts.only       'consistency' runs only checks 8–9 (contradiction,
 *                         ignored choice) — for routes not on the v2 standard
 * @param opts.consistencyModel  model for checks 8–9 (default MODELS.SMART)
 * @param opts.readOnly   field paths shown to the checks but never repaired
 * @param opts.model      check + repair model (default MODELS.FAST); a route
 *                         whose violations are subtle readings of a long
 *                         document can ask for MODELS.SMART
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
  const { label, fields, supplied, promise, guard = {}, userLanguage, locale = '', model = MODELS.FAST, only = '' } = opts;
  const consistencyOnly = only === 'consistency';
  const consistencyModel = opts.consistencyModel || process.env.CONSISTENCY_CHECK_MODEL || MODELS.SMART;
  // Shown to the check as context, never rewritten (labels, enums, numbers).
  const readOnly = new Set(Array.isArray(opts.readOnly) ? opts.readOnly : []);
  const choices = visitorChoices(opts.body || currentRequestBody());
  if (!Array.isArray(fields) || !fields.length) return [];

  const prohibit = Array.isArray(guard.prohibit) ? guard.prohibit : [];
  const require_ = Array.isArray(guard.require) ? guard.require : [];

  const guardBlock = [
    prohibit.length ? `THIS TOOL ADDITIONALLY PROHIBITS — treat any instance as a violation:\n${prohibit.map(x => `- ${x}`).join('\n')}` : '',
    require_.length ? `AND MUST DELIVER:\n${require_.map(x => `- ${x}`).join('\n')}` : '',
  ].filter(Boolean).join('\n\n');

  // Two checks, run side by side so the slower one sets the wait, not the sum:
  // the v2 standard on the route's own model, and the contradiction /
  // ignored-choice check (T3, T7) on CONSISTENCY_MODEL. Measured 2026-10-09
  // on a plan that ignored "Disagree & commit": Haiku caught it one run in
  // two even with a per-choice accounting step, Sonnet two in two. Spotting
  // that two fields disagree, or that a choice never shows, is reading across
  // the whole answer — the step a small model skips.
  const buildCheck = (cons) => `${cons ? 'Check this proposed tool output for two things only: parts that contradict each other, and choices the visitor made that it ignores.' : 'Review this proposed tool output against the DeftBrain V2 standard and the tool-specific guard.'}

WHAT THIS TOOL PROMISES:
${promise}

WHAT THE VISITOR ACTUALLY TYPED — the complete set of established facts:
${supplied}
${cons && choices ? `
THE VISITOR'S CHOICES — settings and options they picked on the form:
${choices}
` : ''}
${cons ? '' : guardBlock}

PROPOSED OUTPUT:
${fields.map(([path, value]) => `${path}:\n${value}`).join('\n\n')}

Look for:
${cons ? CONSISTENCY_CHECKS : V2_CHECKS}

${cons ? 'Look ONLY for those two. Anything else, however imperfect, is out of scope here.' : 'Judge only against the standard and the guard.'} Say nothing about style, wording or how good the writing is.

NEVER flag a bracketed placeholder. [Name], [the evidence], [duration], [the timeline], [what we can defer] — any of them, anywhere, however many. A placeholder is how this product marks a fact the visitor has to supply, so a sentence built around one is the CORRECT handling of a missing fact, not an invented one: "each visit lasts [duration]" asserts nothing. Rewriting placeholders away is a regression, and a field is not a violation for containing them.

${cons && choices ? `ACCOUNT FOR EVERY CHOICE FIRST. A choice is easy to miss when the output reads well, so do not judge it at a glance: for each line under THE VISITOR'S CHOICES that should shape the output (a mode, style, method, framework, tone, length, frequency, something to include or avoid — not a plain fact like a name or a count), write it in "choice_check" with the field that clearly carries it out, or "NONE". A field that merely mentions the choice without doing it does not count. Every "NONE" is also an ignored_visitor_choice violation, on the field where the choice should have shown.

` : ''}Return PASS, or FAIL with one entry per violation. Do not rewrite the output.

OUTPUT (JSON only):
{${cons && choices ? `
  "choice_check": [ { "choice": "the line, as listed", "honored_in": "exact field identifier, or NONE" } ],` : ''}
  "verdict": "PASS or FAIL",
  "violations": [
    { "field": "exact identifier from the proposed output", "violation_type": "one of: ${VIOLATION_TYPES.join(', ')}, or a guard term above", "offending_text": "the exact phrase, quoted", "reason": "a few words", "conflicts_with": "for contradicts_another_field only: the other field's exact identifier" }
  ]
}

verdict and field are machine identifiers, not prose. Write verdict as the English word PASS or FAIL whatever language the rest of this is in, and copy field character-for-character. Code compares both literally; a translated one matches nothing and the check is silently lost.

${NO_QUOTE_RULE}
CRITICAL: Return ONLY valid JSON. No preamble, no markdown.`;

  // maxRetries: 0 — a check that failed once has already cost the visitor time,
  // and retrying it buys a nicety, not the answer.
  const runCheck = (cons) => withDeadline(
    callClaudeWithRetry({
      model: cons ? consistencyModel : model,
      max_tokens: 2500,
      messages: [{ role: 'user', content: withLanguage(buildCheck(cons), userLanguage) }],
    }, { label: `${label}-${cons ? 'consistency' : 'guard'}`, maxRetries: 0 }).catch(err => {
      console.log(`[${label}] ${cons ? 'consistency' : 'v2 guard'}: check failed (${err.message}) — returning the unguarded result`);
      return null;
    }),
    CHECK_BUDGET_MS, null, label, cons ? 'consistency check' : 'check');
  const [v2Check, consCheck] = await Promise.all([consistencyOnly ? null : runCheck(false), runCheck(true)]);
  const isFail = (c) => String(c?.verdict).toUpperCase() === 'FAIL';
  const check = {
    verdict: isFail(v2Check) || isFail(consCheck) ? 'FAIL' : 'PASS',
    violations: [v2Check, consCheck].flatMap(c => (isFail(c) && Array.isArray(c?.violations) ? c.violations : [])),
  };

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
      if (typeof getByPath(draft, v.field) !== 'string' || readOnly.has(v.field)) {
        if (getByPath(draft, v.field) !== undefined) containerHits.push(v.field);
        return false;
      }
      return true;
    })
    .forEach(v => {
      if (!byField.has(v.field)) byField.set(v.field, []);
      byField.get(v.field).push(v);
    });
  // Consistency-only runs fix just their two types; anything else the checker
  // volunteers is out of scope and would rewrite fields nobody asked about.
  if (consistencyOnly) {
    for (const [f, vs] of [...byField]) {
      const keep = vs.filter(v => v.violation_type === 'contradicts_another_field' || v.violation_type === 'ignored_visitor_choice');
      if (keep.length) byField.set(f, keep); else byField.delete(f);
    }
  }
  // A contradiction is two fields, and the checker cannot be trusted to pick
  // the wrong one: tested on the logged cases, it kept the wrong side twice in
  // three ("jazz every night" over "Thu–Sat", "differed sharply" over a
  // detail that misread the logs). So both sides go to the repair together,
  // which settles it against what the visitor typed.
  for (const vs of [...byField.values()]) {
    for (const v of vs) {
      if (v.violation_type !== 'contradicts_another_field' || typeof v.conflicts_with !== 'string') continue;
      const other = v.conflicts_with.trim();
      if (other === v.field || typeof getByPath(draft, other) !== 'string' || readOnly.has(other)) continue;
      if (!byField.has(other)) byField.set(other, []);
      if (!byField.get(other).some(x => x.violation_type === 'contradicts_another_field')) {
        byField.get(other).push({ field: other, violation_type: 'contradicts_another_field', offending_text: '', reason: v.reason, conflicts_with: v.field });
      }
    }
  }
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

  // The item a flagged field sits in (2026-10-08). Plot Hole Finder's repair
  // rewrote two findings' case_against with the focus question's argument —
  // it saw "findings[2].case_against" and nothing saying that finding was
  // about the police trapped underground. Sibling text of the same object
  // anchors the rewrite to its own subject.
  const ownerOf = (field) => {
    const cut = field.lastIndexOf('.');
    if (cut < 0) return '';
    const parent = getByPath(draft, field.slice(0, cut));
    if (!parent || typeof parent !== 'object' || Array.isArray(parent)) return '';
    const own = field.slice(cut + 1);
    return Object.entries(parent)
      .filter(([k, v]) => k !== own && typeof v === 'string' && v.trim())
      .slice(0, 4)
      .map(([k, v]) => `${k}: ${v.length > 160 ? v.slice(0, 160) + '…' : v}`)
      .join(' | ');
  };

  // Both sides of a contradiction are in this repair (see above); the note
  // pairs them so the two rewrites land on the same answer.
  const conflictNote = (v) => {
    if (v.violation_type !== 'contradicts_another_field' || typeof v.conflicts_with !== 'string') return '';
    return `\n  contradicts [${v.conflicts_with.trim()}], which is also being rewritten here. Decide from what the visitor typed which side is right and make BOTH fields agree with it. If what they typed does not settle it, take the disputed claim out of both rather than picking a side.`;
  };

  const repairPrompt = `Rewrite only these fields of a tool's output. Every other field passed and must not be touched.

WHAT THIS TOOL PROMISES:
${promise}

WHAT THE VISITOR ACTUALLY TYPED:
${supplied}
${choices ? `
THE VISITOR'S CHOICES — honor every one:
${choices}
` : ''}
THE REST OF THE RESPONSE — these fields PASSED and are staying exactly as they are. Whatever you write must be consistent with them. If one of them states a conclusion, a choice or a recommendation, your rewrite must not contradict it or substitute a different one:
${untouched || '(no other fields)'}

${allByField.map(([field, vs], i) => `${i}. [${field}]${ownerOf(field) ? `
belongs to: ${ownerOf(field)} — the rewrite must stay about THIS item, not another one` : ''}
current:
${getByPath(draft, field)}

violations:
${vs.map(v => `- ${v.violation_type}${v.offending_text ? `: "${v.offending_text}"` : ''}${v.reason ? ` — ${v.reason}` : ''}${conflictNote(v)}`).join('\n')}`).join('\n\n')}

Preserve useful content and tone. Remove the identified violations and nothing else.

Do not replace a violation with a milder version of itself — swapping "they are being manipulative" for "they may be being manipulative" keeps the determination and adds a hedge. Cut the claim. If removing it leaves the field shorter or plainer, that is correct.

WHERE THE FIELD IS A DELIVERABLE — a message to send, an option to choose — it must come back usable. Never empty, never a placeholder, never a note about why it was removed. If the violation was the whole idea, write a different one that does the same job without it: the visitor was promised this option and an empty box is not one.

OUTPUT (JSON only). Copy "field" exactly as it appears in the brackets above — do not translate it, it is an address, not text:
{ "fixes": [ { "n": 0, "field": "the.exact.path.in.brackets", "value": "the full rewritten field" } ] }

${NO_QUOTE_RULE}
CRITICAL: Return ONLY valid JSON. No preamble, no markdown.`;

  const repair = await withDeadline(
    callClaudeWithRetry({
      model,
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

  // Keyed by NUMBER because withLanguage translates JSON string values, and a
  // translated field path addresses nothing. But an index is one digit the
  // repair can get wrong, and when it does the write lands in the wrong field
  // silently. Measured on friendship-fade-alerter: one run in four put an
  // explanation into a starter's `message` — a field the visitor is told to
  // send to a real person as written.
  //
  // So the repair now returns the path too. Where that path exactly matches a
  // field we flagged, it wins: an exact identifier match is far stronger
  // evidence of intent than an integer, and if the two disagree the integer is
  // the one that was mistyped. A path we do not recognise (translated despite
  // the instruction, or invented) falls back to the index, which is no worse
  // than before.
  const indexOfPath = new Map(allByField.map(([f], i) => [f, i]));
  (Array.isArray(repair?.fixes) ? repair.fixes : []).forEach(fix => {
    let idx = Number(fix?.n);
    const named = typeof fix?.field === 'string' ? indexOfPath.get(fix.field.trim()) : undefined;
    if (named !== undefined && named !== idx) {
      console.log(`[${label}] v2 guard: repair keyed n=${fix.n} but named "${fix.field}" — writing to the named field`);
      idx = named;
    }
    const entry = allByField[idx];
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

// Every string (and number) leaf of a response, as [[path, text]] — the field list a
// whole-response check needs, without each route hand-listing its schema.
function stringFields(obj, max = 60) {
  const out = [];
  const walk = (v, p) => {
    if (out.length >= max) return;
    if (typeof v === 'string') { if (v.trim()) out.push([p, v]); return; }
    // Numbers are shown so a check can see "minutes: 10" beside the prose;
    // repairs only ever write strings, so they are read-only here.
    if (typeof v === 'number' && Number.isFinite(v)) { out.push([p, String(v)]); return; }
    if (Array.isArray(v)) { v.forEach((x, i) => walk(x, `${p}[${i}]`)); return; }
    if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) walk(x, p ? `${p}.${k}` : k);
  };
  walk(obj, '');
  return out;
}

// A value a renderer is likely to switch on or show as a chip — a number, an
// enum ("activity", "HAS PROBLEMS"), an id, a time — rather than prose.
// Rewriting one breaks a badge or a lookup, so whole-response checks only read
// these. Prose is four words or more.
function isLabel(v) {
  const t = String(v).trim();
  return /^-?\d/.test(t) || /^[A-Za-z0-9_-]+$/.test(t) || t.split(/\s+/).length < 4;
}

// What the visitor sent, as text, for checks that compare against it.
function suppliedText(body, cap = 8000) {
  if (!body || typeof body !== 'object') return '';
  const lines = [];
  for (const [k, v] of Object.entries(body)) {
    if (/^user(Language|Locale|Currency|Region|Timezone)$/.test(k) || /base64|image|file|pdf|audio/i.test(k)) continue;
    if (v === null || v === undefined || v === '' || v === false) continue;
    lines.push(`${k}: ${typeof v === 'string' ? v : JSON.stringify(v)}`);
  }
  const text = lines.join('\n');
  return text.length > cap ? text.slice(0, cap) + '…' : text;
}

/**
 * T3 + T7 for any route, one line at the call site: does the answer
 * contradict itself, and does it honor the choices the visitor made? Reads
 * the request body from the route context, checks every string field, and
 * repairs both sides of a contradiction together. Fail-open: an error here
 * returns the draft as it was.
 *
 *   await checkConsistency(parsed, { label: 'date-night', promise: '…', userLanguage });
 */
async function checkConsistency(draft, { label, promise, userLanguage, locale = '', model, body } = {}) {
  try {
    if (!draft || typeof draft !== 'object') return [];
    const reqBody = body || currentRequestBody() || {};
    const fields = stringFields(draft);
    return await runOutputGuard(draft, {
      readOnly: fields.filter(([, v]) => isLabel(v)).map(([p]) => p),
      label, promise: promise || 'Answers the visitor\'s request.', userLanguage, locale, model: model || MODELS.SMART, body: reqBody,
      fields, supplied: suppliedText(reqBody), only: 'consistency',
    });
  } catch (err) {
    console.log(`[${label}] consistency check skipped: ${err.message}`);
    return [];
  }
}

module.exports = { runOutputGuard, checkConsistency, stringFields, suppliedText, V2_CHECKS, CONSISTENCY_CHECKS, VIOLATION_TYPES, visitorChoices };
