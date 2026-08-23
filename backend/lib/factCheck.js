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

// Paths are a closed vocabulary handed to the checker verbatim, so these only
// ever see shapes they know: field, field[0], field[0].sub, field.sub.
const PATH = /^([a-z_]+)(?:\[(\d+)\])?(?:\.([a-z_]+))?$/;

function getByPath(obj, path) {
  const m = String(path).match(PATH);
  if (!m) return undefined;
  const [, key, idx, sub] = m;
  let cur = obj[key];
  if (idx !== undefined) cur = Array.isArray(cur) ? cur[Number(idx)] : undefined;
  if (sub) cur = cur && typeof cur === 'object' ? cur[sub] : undefined;
  return cur;
}

function setByPath(obj, path, value) {
  const m = String(path).match(PATH);
  if (!m) return false;
  const [, key, idx, sub] = m;
  if (idx === undefined) {
    if (!sub) { if (!(key in obj)) return false; obj[key] = value; return true; }
    if (!obj[key] || typeof obj[key] !== 'object') return false;
    obj[key][sub] = value; return true;
  }
  if (!Array.isArray(obj[key])) return false;
  const i = Number(idx);
  if (i < 0 || i >= obj[key].length) return false;
  if (!sub) { obj[key][i] = value; return true; }
  if (!obj[key][i] || typeof obj[key][i] !== 'object') return false;
  obj[key][i][sub] = value; return true;
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

module.exports = { checkAgainstSupplied, getByPath, setByPath, NO_QUOTE_RULE };
