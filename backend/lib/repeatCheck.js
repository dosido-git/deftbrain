// repeatCheck.js — T11 in audit/DEFECT-TYPES.md: the same point, said again
// in section after section.
//
// A long answer written by passes that run apart (lib/progressive.js) repeats
// itself even with noOverlap in every prompt. Bill Rescue, live 2026-10-25,
// a debt in collections: "send a debt validation letter" appeared in seven
// sections, and the letter itself was written out three times, worded
// differently each time — a reader could not tell which one to send. A prompt
// rule did not stop it, so this is a check on the finished answer.
//
// One Sonnet pass reads every prose field in the order the page shows them and
// finds the ones that repeat something an EARLIER field already says. Each is
// shortened to what it adds, pointing back to the earlier one for the rest.
// Runs with the other checks, after the answer is on screen. Fail-open: any
// error leaves the draft as it was.
//
//   await trimRepeats(parsed, { label: 'bill-rescue', userLanguage });
const { callClaudeWithRetry, withLanguage } = require('./claude');
const { MODELS } = require('./models');
const { stringFields, namesAField } = require('./outputGuard');
const { NO_QUOTE_RULE } = require('./factCheck');

const SYSTEM = `You edit one answer made of many sections, shown to the reader together in the order given. Find fields that REPEAT what an EARLIER field already says: the same advice, the same fact, the same warning, or a letter or script that is substantially the same as one given earlier.

For each repeat, write a replacement for the LATER field only:
- keep everything it adds that the earlier field does not say;
- point back to the earlier one in plain words for the rest ("Use the validation letter above.", "As above: don't pay before it is validated.");
- never point by an internal field name, and never empty a field;
- never open with a pointer phrase ("As above:", "As covered in…", "As established…") and then restate the point anyway: either keep only what is new, or one short clause pointing back;
- an item in a closing summary list (takeaways, bottom line) stays a short plain statement of its point, with no pointer — a summary is allowed to summarize; only cut what it repeats in detail;
- keep its form: a list item stays one item, a letter that adds nothing becomes one sentence pointing to the earlier letter.

Not repeats: a letter or script addressed to a different person or for a different purpose; a short label or heading; a field that only restates the visitor's own situation.
Leave every other field alone. If nothing repeats, return an empty list.

Return ONLY valid JSON: {"repairs":[{"path":"exact path from the list","replacement":"..."}]}
${NO_QUOTE_RULE}`;

// Fields worth reading: prose (eight words or more). Labels, enums and numbers
// stay out — rewriting one would break a badge or a lookup.
const isProse = v => typeof v === 'string' && v.trim().split(/\s+/).length >= 8;

function setPath(obj, path, value) {
  const keys = path.replace(/\[(\d+)\]/g, '.$1').split('.').filter(Boolean);
  let cur = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (cur == null || typeof cur !== 'object') return false;
    cur = cur[keys[i]];
  }
  const last = keys[keys.length - 1];
  if (cur == null || typeof cur[last] !== 'string') return false;
  cur[last] = value;
  return true;
}

// order: top-level keys in the order the page shows them (the draft's own key
// order is the order its passes finished, not the page's).
async function trimRepeats(draft, { label, userLanguage, order } = {}) {
  try {
    if (!draft || typeof draft !== 'object') return 0;
    const rank = k => { const i = (order || []).indexOf(k.split(/[.[]/)[0]); return i < 0 ? 999 : i; };
    const fields = stringFields(draft, 200).filter(([, v]) => isProse(v))
      .sort((a, b) => rank(a[0]) - rank(b[0]));
    if (fields.length < 3) return 0;
    const out = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 4000,
      system: withLanguage(SYSTEM, userLanguage),
      messages: [{ role: 'user', content: `FIELDS, in the order the reader sees them:\n${fields.map(([p, v]) => `[${p}]\n${v}`).join('\n\n')}` }],
    }, { label: `${label}-repeat-check` });
    const known = new Map(fields);
    let changed = 0;
    for (const r of Array.isArray(out?.repairs) ? out.repairs : []) {
      const before = known.get(r?.path);
      const after = typeof r?.replacement === 'string' ? r.replacement.trim() : '';
      // Only ever shorter, never empty: this check removes, it does not write.
      if (!before || !after || after.length >= before.length || namesAField(after, draft)) continue;
      if (setPath(draft, r.path, after)) changed++;
    }
    if (changed) console.log(`[${label}-repeat-check] trimmed ${changed} repeated field(s)`);
    return changed;
  } catch (err) {
    console.warn(`[${label}-repeat-check] skipped:`, err.message);
    return 0;
  }
}

module.exports = { trimRepeats, setPath };
