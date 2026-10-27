// certaintyCheck.js — T5 in audit/DEFECT-TYPES.md: overreach. The answer sounds
// more certain than anyone could be.
//
// Owner's review of Bill Rescue, 2026-10-25: precise settlement targets ("Offer
// $2,920. Accept up to $4,380.") and categorical legal claims ("you have no
// obligation to pay them anything", "they must stop collection activity")
// read as authoritative — more so for the polished presentation — when each
// depends on conditions the tool cannot know: who holds the debt, what the
// collector paid for it, whether the dispute went in writing within 30 days,
// which state's law applies.
//
// One Sonnet pass reads the prose fields and rewrites only the overreaching
// ones: a target or prediction becomes a starting point with its basis; a
// legal, medical or financial rule that holds only under conditions names the
// condition; a claim the answer cannot support is said as "may" or "check".
// Correct, unconditional statements are left alone — this is calibration, not
// hedging everything. Runs with the other checks, after the answer is on
// screen. Fail-open.
//
//   await calibrateClaims(parsed, { label: 'bill-rescue', userLanguage });
const { callClaudeWithRetry, withLanguage } = require('./claude');
const { MODELS } = require('./models');
const { stringFields, namesAField } = require('./outputGuard');
const { NO_QUOTE_RULE, setByPath } = require('./factCheck');
const { chunkByItem, runChunks } = require('./parallelChunks');

const SYSTEM = `You review one finished answer for OVERREACH: places where it sounds more certain than anyone could be. Rewrite only those fields.

Overreach is:
1. A precise target or prediction stated as what will happen or what to do — an amount to offer or accept, a percentage a company "will" agree to, a timeline that depends on someone else. Rewrite it as a starting point with its basis and a plain note that the outcome varies ("A common opening offer is around 40%, because collectors often buy debts for far less; what they accept varies.").
2. A legal, medical, financial, technical or scientific rule stated as always true when it holds only under conditions or in the typical case (a boiling point that depends on pressure; a "copy" that is really a new reference to shared data) — a deadline, who it applies to, which jurisdiction, what must be done first. Keep the point and name the condition in a few words ("Under the US FDCPA, if you dispute in writing within 30 days of their first notice, they must pause collection until they verify the debt.").
3. A claim the answer cannot support — what a specific company will do, what a court will decide. Say "may", or say what to check and with whom.

Not overreach — leave alone: an instruction to the reader ("Send the letter by certified mail"), a rule that really is unconditional, an amount the reader gave, a fact stated with its condition already.
Keep each rewrite about the same length, in the same voice, and keep the point. Never empty a field. Apostrophes (') are fine.

Work in two steps. First "claims": every legal, medical, financial, technical or scientific rule, every target amount or percentage, and every prediction about what someone will do — [{"path":"...","claim":"a few words","condition":"the condition or basis it depends on, or 'none — unconditional'","ok":true|false}]. A rule with a deadline, a jurisdiction or a prerequisite that the text leaves out is not ok. Then "repairs": one per claim that is not ok.

Return ONLY valid JSON: {"claims":[...],"repairs":[{"path":"exact path from the list","replacement":"..."}]}  — repairs empty if every claim is ok.
${NO_QUOTE_RULE}`;

// Prose only (six words or more): labels, enums and amounts the page shows as
// figures stay as they are — rewriting one would break a badge or a layout.
// Letters (text with its own line breaks) are documents to send, not claims
// to annotate — a live run replaced a whole letter with one paragraph and a note.
const isProse = v => typeof v === 'string' && v.trim().split(/\s+/).length >= 6 && !/\n/.test(v.trim());

async function calibrateClaims(draft, { label, userLanguage } = {}) {
  try {
    if (!draft || typeof draft !== 'object') return 0;
    const fields = stringFields(draft, 200).filter(([, v]) => isProse(v));
    if (!fields.length) return 0;
    // Speed (2026-10-27): parallel chunks, one per list item — one call over
    // every field took 29s (lib/parallelChunks.js).
    const chunks = chunkByItem(fields, 5);
    const outs = await runChunks(chunks, (ch, i) => callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 3000,
      system: withLanguage(SYSTEM, userLanguage),
      messages: [{ role: 'user', content: `FIELDS:\n${ch.map(([p, v]) => `[${p}]\n${v}`).join('\n\n')}` }],
    }, { label: `${label}-certainty-check${chunks.length > 1 ? `-${i + 1}` : ''}` }));
    const known = new Map(fields);
    let changed = 0;
    for (const r of outs.flatMap(out => (Array.isArray(out?.repairs) ? out.repairs : []))) {
      const before = known.get(r?.path);
      const after = typeof r?.replacement === 'string' ? r.replacement.trim() : '';
      // A calibration, not a rewrite: never empty, never much longer or shorter.
      if (!before || !after || after.length > before.length * 1.6 + 40 || after.length < before.length * 0.7 || namesAField(after, draft)) continue;
      if (setByPath(draft, r.path, after)) changed++;
    }
    if (changed) console.log(`[${label}-certainty-check] calibrated ${changed} overreaching field(s)`);
    return changed;
  } catch (err) {
    console.warn(`[${label}-certainty-check] skipped:`, err.message);
    return 0;
  }
}

module.exports = { calibrateClaims };
