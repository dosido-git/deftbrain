// evidenceFit.js — T13 in audit/DEFECT-TYPES.md: sourced claims that drift
// from their sources.
//
// Owner's review of Signal vs. Noise, 2026-10-27 (career advice: job-switching,
// passion, an MBA). Every figure was in the research, so the figure check
// (dropUnsourcedFigures) passed — but the answer said what the figures did not:
//   - a pay-GROWTH gap became "job-changers have outearned stayers" (a level);
//   - base-pay and gross-pay growth were used interchangeably;
//   - a January finding was labelled August;
//   - a salary rise among graduates of the FT top-100 schools read as MBA
//     graduates in general, and a "top US MBA" cost rise as MBA costs;
//   - a study of beliefs about interests became a competence-first career rule
//     it never tested; "five studies" became "five experiments";
//   - "often the faster path" sat in a kernel of truth with nothing behind it;
//   - the summary sections said it more firmly than the evidence sections.
// The synthesis prompt already forbids each of these (rules 13–24). A prompt
// rule did not stop them, so this is a check on the finished answer.
//
// One Sonnet pass reads the evidence (with each finding's measure, population,
// period and wording) beside the answer's prose, lists every figure and every
// conclusion with what its source actually says, and repairs only the ones
// that do not fit — narrowed to what the source supports, its scope named in a
// few words, or the unsupported clause taken out. It never adds a fact the
// evidence does not hold. Runs with the other checks, after the answer is on
// screen. Fail-open.
//
//   await checkEvidenceFit(parsed, { label, evidence: JSON.stringify(packet),
//     summary: ['the_bottom_line', 'framing'], userLanguage });
const { callClaudeWithRetry, withLanguage } = require('./claude');
const { MODELS } = require('./models');
const { stringFields, namesAField } = require('./outputGuard');
const { NO_QUOTE_RULE, setByPath } = require('./factCheck');
const { chunkByItem, runChunks } = require('./parallelChunks');

const SYSTEM = `You check one finished answer against the evidence it was written from. Every figure and every conclusion must say what its source says — no more, and about the same people, period and measure.

A field does NOT fit when it:
1. States a figure with a different measure, unit, population, period or comparison than the finding it comes from: a change or growth rate read as a level ("earn more" from "pay grew faster"); one measure swapped for a related one (base pay vs gross pay, median vs average, percent vs percentage points); one month's or year's figure given another date; a figure from a subgroup, sample or ranking (top schools, one industry, one country) given as everyone's.
2. Turns a comparison between groups into a cause ("switching raises pay") when the source only compares them.
3. Adds a rule, condition, threshold, sequence or recommendation the cited finding did not test, or a frequency word ("often", "usually", "most") no finding supports. Caveats, kernels of truth and asides count: they are claims too.
4. Describes a study's design, size or count differently from the evidence (studies called experiments; a survey called a trial).
5. Treats what people believe about a thing as the thing itself.
6. Sets kinds of evidence or methods against each other ("X, not Y") when nothing in the evidence says one cannot help.
7. Is a SUMMARY field that is stronger, broader or more certain than what the evidence fields say about the same point.

Evidence marked as not found on its source page (figures_not_on_page) is not in the evidence.

Repair each field that does not fit:
- narrow it to what the finding supports, naming the scope in a few words ("median annual base-pay growth, August 2026"; "graduates of the FT's top 100 schools, three years out");
- or remove the unsupported clause; if nothing supported is left, say plainly what the evidence does not establish;
- never add a fact, figure or source that is not in the evidence; keep source IDs in square brackets as they are;
- same voice, about the same length or shorter, never empty, never an internal field name.
Fields that fit are left alone. Correct statements are not hedged further.

Work in two steps. First "items": every figure and every conclusion in the ANSWER FIELDS (not the read-only rest) — [{"path":"...","says":"a few words","source_says":"the measure, population, period and comparison in the evidence, or 'not in the evidence'","fits":true|false,"rule":1-7 or null}]. Keep each "says" and "source_says" under 12 words. Then "repairs": one per field with an item that does not fit.

Return ONLY valid JSON: {"items":[...],"repairs":[{"path":"exact path from the list","replacement":"..."}]}
${NO_QUOTE_RULE}`;

// Prose only: labels, enums, ids and short chips stay as they are.
const isProse = v => typeof v === 'string' && v.trim().split(/\s+/).length >= 5 && !/\n\s*\n/.test(v.trim());

// evidence: a string, or (fields) => string giving each chunk only the
// evidence its fields cite. summary: top-level keys that may not be stronger
// than the rest. skip: top-level keys left out; keep: a path pattern left out
// (the visitor's own words, which are not a claim about the evidence).
//
// Speed (2026-10-27): one call over every field wrote ~3,300 tokens and took
// 48s (p90 127s). The fields now go in parallel chunks, one per list item
// (lib/parallelChunks.js); the summary fields get their own chunk, reading
// the rest of the answer as context. Wait ≈ the slowest chunk.
async function checkEvidenceFit(draft, { label, evidence, summary = [], userLanguage, skip = [], keep = null } = {}) {
  try {
    if (!draft || typeof draft !== 'object' || !evidence) return 0;
    const top = p => p.split(/[.[]/)[0];
    const fields = stringFields(draft, 200)
      .filter(([p, v]) => isProse(v) && !skip.includes(top(p)) && !(keep && keep.test(p)));
    if (!fields.length) return 0;
    const isSummary = ([p]) => summary.includes(top(p));
    const body = fields.filter(f => !isSummary(f));
    const chunks = [...chunkByItem(body, 5), fields.filter(isSummary)].filter(ch => ch.length);
    const evidenceFor = ch => (typeof evidence === 'function' ? evidence(ch) : evidence);
    const show = ch => ch.map(([p, v]) => `[${p}]${isSummary([p]) ? ' (SUMMARY)' : ''}\n${v}`).join('\n\n');
    const outs = await runChunks(chunks, (ch, i) => callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 3000,
      system: withLanguage(SYSTEM, userLanguage),
      messages: [{ role: 'user', content: `EVIDENCE:\n${ch.every(isSummary) ? evidenceFor(fields) : evidenceFor(ch)}\n\n${ch.every(isSummary) && body.length ? `THE REST OF THE ANSWER (read only — compare the summary with it):\n${show(body)}\n\n` : ''}ANSWER FIELDS:\n${show(ch)}` }],
    }, { label: `${label}-evidence-fit${chunks.length > 1 ? `-${i + 1}` : ''}` }));
    const known = new Map(fields);
    let changed = 0;
    for (const out of outs) for (const r of Array.isArray(out?.repairs) ? out.repairs : []) {
      const before = known.get(r?.path);
      const after = typeof r?.replacement === 'string' ? r.replacement.trim() : '';
      // A narrowing, not a rewrite: never empty, never much longer.
      if (!before || !after || after.length > before.length * 1.5 + 40 || namesAField(after, draft)) continue;
      if (setByPath(draft, r.path, after)) changed++;
    }
    if (changed) console.log(`[${label}-evidence-fit] repaired ${changed} field(s) that outran their sources`);
    return changed;
  } catch (err) {
    console.warn(`[${label}-evidence-fit] skipped:`, err.message);
    return 0;
  }
}

module.exports = { checkEvidenceFit };
