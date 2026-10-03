// Check a generated draft against the facts the visitor actually supplied,
// then repair only what fails.
//
// This is the third tool to need it. Caption Magic invented what a photograph
// showed; Cold Open Craft invented a job role, an opinion and an action from a
// one-line background; Comeback Cooker invented eight years of doing the work.
// Each time the prompt was told not to, and each time the next review found the
// same failure in a new costume — because the sentence needs a specific and
// invention is the only place to get one.
//
// TWO PROPERTIES MAKE IT WORK, and both are easy to lose in a refactor:
//
//   1. The checker is ADVERSARIAL. Its only job is to find unsupported claims.
//      It is never asked to improve the draft, because a model asked to rate
//      its own output rates it as fine.
//   2. It sees ONLY the supplied facts and the draft — never the source
//      material the generator saw. A checker that can look at the photograph
//      will agree that a claim about the photograph is plausible.
//
// Fail-open by construction: this wraps a working answer, and a net that can
// drop the answer is worse than no net. Callers should still try/catch.
const { callClaudeWithRetry, withLanguage } = require('./claude');
const { MODELS } = require('./models');

const NO_QUOTE_RULE = 'Never place a double-quote (") character inside any JSON string value — write quoted phrases plainly or with single quotes, or it breaks the JSON.';

// Paths come from the field walk each route does over its own response, so
// the shapes are whatever that response nests: field, field[0], field[0].sub,
// field.sub, and — Culture Briefing, 2026-08-25 — field[0].sub[1] and
// field.sub[0]. The old regex stopped at one index plus one key, so anything
// deeper resolved to undefined, the violation was filtered out before repair,
// and the guard logged FAIL with zero fields. It found the problem and threw
// it away. Parse the path properly instead of enumerating shapes.
const SEGMENT = /([A-Za-z_][A-Za-z0-9_]*)|\[(\d+)\]/g;

function parsePath(path) {
  const str = String(path);
  const segs = [];
  let m, consumed = 0;
  SEGMENT.lastIndex = 0;
  while ((m = SEGMENT.exec(str))) {
    // reject anything the tokens do not fully cover (stray punctuation, spaces)
    if (m.index !== consumed && str.slice(consumed, m.index) !== '.') return null;
    consumed = m.index + m[0].length;
    segs.push(m[1] !== undefined ? m[1] : Number(m[2]));
  }
  if (consumed !== str.length || !segs.length || typeof segs[0] !== 'string') return null;
  return segs;
}

function getByPath(obj, path) {
  const segs = parsePath(path);
  if (!segs) return undefined;
  let cur = obj;
  for (const seg of segs) {
    if (cur === null || typeof cur !== 'object') return undefined;
    if (typeof seg === 'number') {
      if (!Array.isArray(cur) || seg < 0 || seg >= cur.length) return undefined;
    } else if (!(seg in cur)) return undefined;
    cur = cur[seg];
  }
  return cur;
}

function setByPath(obj, path, value) {
  const segs = parsePath(path);
  if (!segs) return false;
  let cur = obj;
  for (let i = 0; i < segs.length - 1; i++) {
    const seg = segs[i];
    if (cur === null || typeof cur !== 'object') return false;
    if (typeof seg === 'number') {
      if (!Array.isArray(cur) || seg < 0 || seg >= cur.length) return false;
    } else if (!(seg in cur)) return false;
    cur = cur[seg];
  }
  const last = segs[segs.length - 1];
  if (cur === null || typeof cur !== 'object') return false;
  if (typeof last === 'number') {
    if (!Array.isArray(cur) || last < 0 || last >= cur.length) return false;
  } else if (!(last in cur)) return false;
  cur[last] = value;
  return true;
}

/**
 * @param draft      the parsed model response, mutated in place
 * @param opts.label       tool name for the log line
 * @param opts.supplied    text block: everything the visitor actually typed
 * @param opts.fields      [[path, text], ...] — the strings to check
 * @param opts.lookFor     tool-specific bullet list of what counts as invention
 * @param opts.repairNote  tool-specific guidance for the rewrite
 * @param opts.userLanguage / opts.locale
 */
async function checkAgainstSupplied(draft, opts) {
  const { label, supplied, fields, lookFor, repairNote, userLanguage, locale = '' } = opts;
  if (!Array.isArray(fields) || !fields.length) return;

  const drafts = fields.map(([path, value]) => `${path}:\n${value}`).join('\n\n');

  const checkPrompt = `You are checking a draft for claims the visitor did not make. You are not writing or improving it.

WHAT THE VISITOR ACTUALLY TYPED — the complete set of true things:
${supplied}

DRAFT:
${drafts}

Find anything the fields above do not support:
${lookFor}

Say nothing about tone, quality, length or how well it works. Brackets like [Name] are intentional placeholders and are not violations.

OUTPUT (JSON only):
{
  "verdict": "PASS or FAIL",
  "violations": [
    { "field": "exact identifier from the draft above", "claim": "the unsupported phrase, quoted", "why": "what it asserts that was never supplied, in a few words" }
  ]
}

verdict and field are machine identifiers, not prose. Write verdict as the English word PASS or FAIL whatever language the rest of this is in, and copy field character-for-character. Code compares both literally; a translated one matches nothing and the check is silently lost.

${NO_QUOTE_RULE}
CRITICAL: Return ONLY valid JSON. No preamble, no markdown.`;

  const check = await callClaudeWithRetry({
    model: MODELS.FAST,
    max_tokens: 2000,
    messages: [{ role: 'user', content: withLanguage(checkPrompt, userLanguage) }],
  }, { label: `${label}-check` });

  // One repair per field: two violations in the same line would otherwise be
  // repaired independently against the ORIGINAL text, and the second write
  // would silently undo the first.
  const seen = new Set();
  const violations = (Array.isArray(check?.violations) ? check.violations : [])
    .filter(v => v && typeof v.field === 'string' && getByPath(draft, v.field) !== undefined)
    .filter(v => !seen.has(v.field) && seen.add(v.field));

  // Logged on every call, pass or fail. A checker that has stopped working
  // returns the same empty list as one that found nothing wrong, and nothing
  // else in a fail-open path would ever say so.
  console.log(`[${label}] supplied-facts check: ${String(check?.verdict).toUpperCase() === 'FAIL' ? 'FAIL' : 'PASS'} (${violations.length} violation(s)${violations.length ? ': ' + violations.map(v => v.field).join(', ') : ''})`);

  if (String(check?.verdict).toUpperCase() !== 'FAIL' || !violations.length) return violations;

  const repairPrompt = `Repair specific lines that claim things the visitor never said. Everything else has been accepted.

WHAT THE VISITOR ACTUALLY TYPED:
${supplied}

${violations.map((v, i) => `${i}. [${v.field}]
current:
${getByPath(draft, v.field)}

unsupported: ${v.claim}${v.why ? ` — ${v.why}` : ''}`).join('\n\n')}

${repairNote}

Cut the unsupported claim. Do not replace it with a different unsupported claim — the usual repair failure is swapping one invention for a safer-sounding one. If removing it leaves the line plainer, that is correct.

OUTPUT (JSON only):
{ "fixes": [ { "n": 0, "value": "the full repaired text" } ] }

${NO_QUOTE_RULE}
CRITICAL: Return ONLY valid JSON. No preamble, no markdown.`;

  const repair = await callClaudeWithRetry({
    model: MODELS.FAST,
    max_tokens: 2500,
    messages: [{ role: 'user', content: withLanguage(repairPrompt, userLanguage) + locale }],
  }, { label: `${label}-repair` });

  // Keyed by NUMBER, not by path: withLanguage translates JSON string values,
  // and a translated field path addresses nothing.
  (Array.isArray(repair?.fixes) ? repair.fixes : []).forEach(fix => {
    const v = violations[Number(fix?.n)];
    if (!v || typeof fix.value !== 'string' || !fix.value.trim()) return;
    setByPath(draft, v.field, fix.value.trim());
  });

  return violations;
}

// ── Number check (2026-10-03) ────────────────────────────────────────────────
// A second, independent failure: not invention but WRONG MATH. Analogy Engine
// told a child that doubling 3/4 cup gives "6/8, the same amount"; prompt
// rules cut those slips but never ended them. This pass recomputes every
// number in the finished answer and repairs only what is wrong.
//
// WHAT MAKES IT WORK (proved on Analogy Engine — keep both):
//   1. A forced per-claim "checks" list BEFORE the fixes. Asked only for
//      fixes, the checker returned [] on answers with known errors.
//   2. Fields keyed by NUMBER, not path — withLanguage translates JSON string
//      values, and a translated path addresses nothing (see above).
// It checks arithmetic and consistency, not the world: prices, rates, laws
// and anything the visitor typed are taken as given. Fail-open; logged every
// call. FACT_CHECK=off disables it everywhere without a deploy.

// Every string containing a digit and every number, as [path, value] pairs.
// Short enum-like strings rarely contain digits, so they stay out; numbers
// keep their type on repair so a field rendered as {value}/10 or a CSS width
// can never come back as prose.
function numericFields(obj, { max = 80 } = {}) {
  const out = [];
  const walk = (node, path) => {
    if (out.length >= max) return;
    if (typeof node === 'number' && Number.isFinite(node)) out.push([path, node]);
    else if (typeof node === 'string' && /\d/.test(node)) out.push([path, node]);
    else if (Array.isArray(node)) node.forEach((v, i) => walk(v, `${path}[${i}]`));
    else if (node && typeof node === 'object') {
      for (const k of Object.keys(node)) walk(node[k], path ? `${path}.${k}` : k);
    }
  };
  walk(obj, '');
  return out.filter(([p]) => p);
}

/**
 * @param draft              parsed model response, mutated in place
 * @param opts.label         tool name for logs/metrics
 * @param opts.context       short text: what the visitor asked / supplied
 * @param opts.fields        [[path, value], ...] (default: numericFields(draft))
 * @param opts.facts         also check well-established factual claims (explainers)
 * @param opts.removable     array paths whose items may be dropped when false
 *                           (never emptied), e.g. ['common_misconceptions']
 * @param opts.extraRules    tool-specific lines for the checker
 * @param opts.userLanguage
 * @returns number of changes applied
 */
async function checkNumbers(draft, opts) {
  if (process.env.FACT_CHECK === 'off') return 0;
  const { label, context = '', facts = false, removable = [], extraRules = '', userLanguage } = opts;
  const fields = (opts.fields || numericFields(draft)).filter(([, v]) => v !== undefined && v !== null);
  if (!fields.length) return 0;

  // The path stays visible: the checker needs to know a field is a 'myth' or a
  // 'before' figure to judge it. Fixes still key on n, never on the path.
  const list = fields.map(([path, v], n) => `${n}. ${path} [${typeof v === 'number' ? 'number' : 'text'}]: ${v}`).join('\n');

  const system = `Meticulous checker of numbers${facts ? ' and facts' : ''} in a finished answer. You check; you do not rewrite for style.

Find ONLY real errors:
- arithmetic that is wrong (recompute it — do not trust the text);
- totals that do not match their parts, percentages that do not match the numbers they come from, wrong unit or time conversions, durations and times that do not add up;
- the same quantity given two different values in different places, or a worked example whose numbers change partway through;
- a comparison word pointing the wrong way (more/less, higher/lower, longer/shorter, before/after, base/exponent).${facts ? `
- a false or overstated factual claim; a "misconception" that is actually true, or a correction that does not contradict it.` : ''}
Take as GIVEN: anything the visitor supplied, and real-world figures you cannot verify (prices, fees, rates, laws, schedules, estimates). Check the arithmetic that uses them, not the figures themselves. Ranges and rough estimates are fine if internally consistent.
${extraRules}
Read each item in light of its field name: a field can state something on purpose that is not the answer's own claim (a misconception, a claim being tested, a 'before' figure). Judge it as what it is.
Do NOT touch style, tone, wording, or anything that is merely loose. If a statement is true, leave it alone even if you would phrase it differently.

Work in two steps. First "checks": for every item that contains a calculation, a total, a conversion or a number that must agree with another item${facts ? ', and every factual claim' : ''}, record {"n": <item number>, "claim": "a few words", "work": "your own recomputation or reasoning, briefly — e.g. 10 x 1.1 = 11, 11 x 1.1 = 12.1, text says 11 percent: inconsistent", "ok": true|false}. Do the work; a check without it is a guess. Then "fixes": one per item that is not ok —
  {"n": <item number>, "value": <the whole corrected item: same language, same length and voice, only the error changed; a [number] item gets a plain number>}${removable.length ? `
  or {"n": <item number>, "remove": true} for an item in a list entry that is false and cannot be fixed in about its original length.` : ''}
Return ONLY valid JSON: {"checks": [...], "fixes": [...]}. No errors → "fixes": []. Do not invent problems, and do not wave a calculation through without recomputing it.
${NO_QUOTE_RULE}`;

  const checked = await callClaudeWithRetry({
    model: MODELS.SMART,
    max_tokens: 4000,
    system: withLanguage(system, userLanguage),
    messages: [{ role: 'user', content: `${context ? `WHAT THE VISITOR ASKED:\n${context}\n\n` : ''}ITEMS TO CHECK:\n${list}` }],
  }, { label: `${label}-numcheck`, maxRetries: 1 });

  let applied = 0;
  const changed = [];
  const removals = {}; // array path -> Set(index)
  const seen = new Set();
  for (const fix of Array.isArray(checked?.fixes) ? checked.fixes : []) {
    const n = Number(fix?.n);
    if (!Number.isInteger(n) || !fields[n] || seen.has(n)) continue;
    seen.add(n);
    const [path, original] = fields[n];
    if (fix.remove === true) {
      const arr = removable.find(a => path.startsWith(`${a}[`));
      const idx = arr && Number(path.slice(arr.length + 1).split(']')[0]);
      if (arr && Number.isInteger(idx)) (removals[arr] = removals[arr] || new Set()).add(idx);
      continue;
    }
    let value = fix.value;
    if (typeof original === 'number') {
      value = typeof value === 'number' ? value : Number(String(value).replace(/[^\d.-]/g, ''));
      if (!Number.isFinite(value)) continue;
    } else if (typeof value !== 'string' || !value.trim()) continue;
    else value = value.trim();
    if (value === original) continue;
    if (setByPath(draft, path, value)) {
      applied++;
      changed.push(path);
      if (process.env.FACT_CHECK_DEBUG) console.log(`[${label}] ${path}\n  was: ${original}\n  now: ${value}`);
    }
  }
  // Drop false list entries, highest index first, never emptying a list.
  for (const [arr, idxs] of Object.entries(removals)) {
    const list = getByPath(draft, arr);
    if (!Array.isArray(list)) continue;
    for (const i of [...idxs].sort((a, b) => b - a)) {
      if (list.length > 1 && i < list.length) { list.splice(i, 1); applied++; }
    }
  }

  const bad = (Array.isArray(checked?.checks) ? checked.checks : []).filter(c => c && c.ok === false).length;
  console.log(`[${label}] number check: ${fields.length} item(s), ${bad} flagged, ${applied} change(s) applied${changed.length ? ': ' + changed.join(', ') : ''}`);
  return applied;
}

// What the visitor typed, as checker context: the scalar text/number fields of
// the request body, minus locale plumbing and uploads (base64 is noise).
const NOT_CONTEXT = /^(userLanguage|userLocale|userCurrency|userRegion|.*(image|file|photo|base64|data)$)/i;
function visitorContext(body, max = 2000) {
  const lines = [];
  for (const [k, v] of Object.entries(body || {})) {
    if (NOT_CONTEXT.test(k)) continue;
    if ((typeof v === 'string' && v.trim()) || typeof v === 'number') lines.push(`${k}: ${String(v).slice(0, 600)}`);
  }
  return lines.join('\n').slice(0, max);
}

// Fail-open wrapper for routes: never lets the check cost the visitor their answer.
async function withNumberCheck(draft, opts) {
  try { await checkNumbers(draft, opts); }
  catch (err) { console.warn(`[${opts?.label}] number check skipped: ${err.message}`); }
  return draft;
}

module.exports = { checkAgainstSupplied, checkNumbers, withNumberCheck, numericFields, visitorContext, getByPath, setByPath, NO_QUOTE_RULE };
