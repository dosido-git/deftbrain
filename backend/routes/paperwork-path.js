const express = require('express');
const router = express.Router();
const { withLanguage, withLocaleContext, callClaudeWithRetry } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit } = require('../lib/rateLimiter');

const { runOutputGuard, stringFields, suppliedText } = require('../lib/outputGuard');
const { researchFacts, checkWorldFacts } = require('../lib/worldFacts');
const { allChecks } = require('../lib/bothChecks');
const { answer, planNote } = require('../lib/progressive');

const LABEL_RE = /^(critical|important|optional)$/i;
// ════════════════════════════════════════════════════════════
// POST /paperwork-path — document checklist + the order to handle it
// for a life event (move, baby, job change, marriage, death, …)
// ════════════════════════════════════════════════════════════
router.post('/paperwork-path', rateLimit(), async (req, res) => {
  try {
    const { lifeEvent, situation, location, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    if (!lifeEvent?.trim()) {
      return res.status(400).json({ error: 'Pick the life event you\'re handling' });
    }

    const situationText = (situation || '').toString().slice(0, 4000);
    const locationText = (location || '').toString().slice(0, 200);

    // Speed (2026-10-14): one call wrote the whole answer (~2.7k tokens, ~57s).
    // It is now two calls at once with disjoint keys — the checklist (what)
    // and the plan (in what order) — each about half the length. The plan
    // pass is told the checklist is written alongside it so it covers the
    // same essentials; the consistency check reads the merged answer.
    const intro = `You are a calm, organized life-admin expert who helps people handle the paperwork around a major life event without missing anything or doing it in the wrong order.

LIFE EVENT: ${lifeEvent}
${locationText ? `LOCATION: ${locationText}` : 'LOCATION: not specified'}
${situationText ? `THEIR SITUATION: ${situationText}` : ''}

Produce a document checklist AND the order to handle it. Requirements vary by country/state/employer — give the TYPICAL set and sequence.

BE SPECIFIC, then hedge — do not be vague. When a deadline or figure is well-established for the stated location (e.g. a region's new-resident vehicle-registration or driver-license grace period, a benefits enrollment window), state the actual number (e.g. "within 30 days", "90-day window") and note it should be confirmed as current. Only avoid inventing a precise figure you are not confident is commonly correct — in that case say the rule exists and point the person to where to confirm it, rather than stating a made-up number. The verify_note covers the blanket "confirm for your jurisdiction" caveat, so individual fields can carry the specific figure.

FIGURE DISCIPLINE: each deadline belongs to ITS OWN item — never reuse one item's window for a different one (e.g. a region's driver-license grace period and its vehicle-registration grace period are usually DIFFERENT numbers; don't apply one to both). If unsure whether two items share a window, hedge that specific figure rather than guessing.`;
    const tail = `Return ONLY the JSON object.`;
    const checklistPrompt = withLanguage(`${intro}

THIS PASS writes the summary, the event label, the verify note and the document checklist as NAMES AND PRIORITIES ONLY — other passes add each document's why and where to get it, and write the ordered steps and watch-outs, from your list.

Return ONLY valid JSON:

{
  "situation_summary": "One sentence restating what they're handling, grounded in their inputs",
  "event_label": "Move day",
  "document_checklist": [
    {
      "document": "Name of the document/task (e.g. 'File a change of address with the postal service')",
      "priority": "critical | important | optional"
    }
  ],
  "verify_note": "A one-sentence reminder that requirements vary by location/employer and where to confirm the specifics"
}

RULES:
- document_checklist: 5-12 items, most impactful first, priority set honestly.
- TIMELINE ANCHOR (relative weeks): the life event ITSELF is WEEK 0. "event_label" is a 1-3 word name for it (e.g. "Move day", "Baby arrives", "First day", "Date of passing"). Every step's week_start/week_end are integers RELATIVE to that: NEGATIVE = weeks BEFORE the event (preparation), 0 = the event week, POSITIVE = weeks AFTER (follow-up). Examples: "2 to 4 weeks before the move" → week_start -4, week_end -2; "the week before" → -1, -1; "the week of / on the day" → 0, 0; "within the 2nd–3rd week after" → +2, +3. A single-week step has week_start == week_end; a windowed step spans it with week_start ≤ week_end. If the event has already occurred when someone uses this (e.g. a death, where handling begins after), keep event at 0 and put every step at 0 or positive.
- Keep every field to one tight sentence. Never put a double-quote (") inside a JSON string value.
- Be specific to the life event; generic "make a checklist" advice is a failure.
- ALL four keys above must be present.

${tail}`, userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion);
    const planPrompt = withLanguage(`${intro}

THIS PASS writes the ordered steps only. Other passes are writing the document checklist and the watch-outs at the same time from the same inputs: make the steps cover the essential documents and tasks for this event (the same ones a complete checklist would list), and name each task plainly so it matches the checklist's wording.

Return ONLY valid JSON:

{
  "ordered_steps": [
    {
      "order": 1,
      "action": "The concrete step to do",
      "week_start": -4,
      "week_end": -2,
      "timing": "When to do it (e.g. 'first', 'within 2 weeks', 'after you have X')",
      "why_first": "Why it comes at this point in the order — often because a later step depends on it. One sentence."
    }
  ]
}

RULES:
- TIMELINE ANCHOR (relative weeks): the life event ITSELF is WEEK 0. "event_label" is a 1-3 word name for it (e.g. "Move day", "Baby arrives", "First day", "Date of passing"). Every step's week_start/week_end are integers RELATIVE to that: NEGATIVE = weeks BEFORE the event (preparation), 0 = the event week, POSITIVE = weeks AFTER (follow-up). Examples: "2 to 4 weeks before the move" → week_start -4, week_end -2; "the week before" → -1, -1; "the week of / on the day" → 0, 0; "within the 2nd–3rd week after" → +2, +3. A single-week step has week_start == week_end; a windowed step spans it with week_start ≤ week_end. If the event has already occurred when someone uses this (e.g. a death, where handling begins after), keep event at 0 and put every step at 0 or positive.
- ordered_steps: 4-8 steps; the ORDER is the whole value — sequence by dependency (what must exist before the next step), not alphabetically. week_start/week_end are RELATIVE to week 0 (the event) per the anchor rule above — they are the recommended window, not a legal deadline. Keep the whole plan realistic (typically about -4 to +8 weeks).
- Keep every field to one tight sentence. Never put a double-quote (") inside a JSON string value.
- Be specific to the life event; generic "make a checklist" advice is a failure.

${tail}`, userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion);

    const watchPrompt = withLanguage(`${intro}

THIS PASS writes the watch-outs only. Other passes are writing the checklist and the ordered steps at the same time from the same inputs.

Return ONLY valid JSON:

{
  "watch_outs": [
    "A common mistake or thing people forget for THIS event — one sentence"
  ]
}

RULES:
- watch_outs: 2-4 items, specific to the life event, one tight sentence each. Never put a double-quote (") inside a JSON string value.

${tail}`, userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion);
    // Each document's why and where, for a slice of the planned list, matched
    // back by position (the plan keeps the names and priorities).
    const detailPrompt = (plan, from, to) => withLanguage(`${intro}${planNote(plan, ['situation_summary', 'document_checklist'])}

THIS PASS adds, for documents ${from + 1} to ${to} of the document_checklist above (in that order, exactly those), why it matters and where or how to get or file it. Other passes cover the rest.

Return ONLY valid JSON:

{
  "details": [
    {
      "document": "The document name, copied exactly from the list",
      "why": "Why it matters — one sentence",
      "where_to_get": "Where/how to obtain or file it — one sentence"
    }
  ]
}

RULES:
- One details item per document, in the list's order. Keep every field to one tight sentence. Never put a double-quote (") inside a JSON string value.

${tail}`, userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion);

    // T1 (audit/DEFECT-TYPES.md): official requirements from a cached web
    // search, run alongside the checklist. Without it the model said a Texas
    // move needs a safety inspection and online voter registration.
    const research = locationText ? researchFacts({ topic: ['paperwork', lifeEvent, locationText], label: 'paperwork-path', brief: `Official requirements for someone handling this life event: "${lifeEvent}" in ${locationText}. What must be registered, transferred, inspected, renewed or filed, with which office, by when, whether it can be done online or only in person or by mail, and fees. Include requirements people commonly assume that do NOT apply there (abolished inspections, registrations that cannot be done online).` }) : null;

    const ask = (content, label) => callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 2500,
      messages: [{ role: 'user', content }],
    }, { label });
    const KEYS = ['situation_summary', 'event_label', 'document_checklist', 'ordered_steps', 'watch_outs', 'verify_note'];

    // Progressive (2026-10-15, lib/progressive.js): the checklist and the plan
    // each show as they land; world facts (T1) and the v2 guard — which
    // includes the T3/T7 consistency checks — run side by side after the
    // answer is on screen (lib/bothChecks.js). Sourced corrections win where
    // both touch the same field.
    // Progressive, plan first (2026-10-17, T11): the summary and the document
    // NAMES show first (~7s); two passes add each one's why and where, and the
    // steps and watch-outs are written alongside from the start.
    const list = ask(checklistPrompt, 'paperwork-path-checklist');
    list.catch(() => {}); // the list part reports its own failure
    const half = l => Math.ceil(((l?.document_checklist) || []).length / 2);
    const detailPart = (i) => ({
      run: async () => {
        const l = await list;
        const n = (l?.document_checklist || []).length, from = i ? half(l) : 0, to = i ? n : half(l);
        return from < to ? ask(detailPrompt(l, from, to), `paperwork-path-detail-${i + 1}`) : null;
      },
      apply: (d, out) => { if (Array.isArray(out?.details)) d.docDetail = { ...d.docDetail, [i]: out.details }; },
    });
    // Details merge by position; the plan keeps each document's name and priority.
    const withDetail = (d) => {
      const docs = d.document_checklist || [], h = Math.ceil(docs.length / 2);
      const detail = [...(d.docDetail?.[0] || []).slice(0, h), ...Array(Math.max(0, h - (d.docDetail?.[0] || []).length)).fill(null), ...(d.docDetail?.[1] || [])];
      const out = Object.fromEntries(KEYS.filter(k => d[k] !== undefined).map(k => [k, d[k]]));
      if (docs.length) out.document_checklist = docs.map((x, j) => ({ document: x.document, why: x.why ?? detail[j]?.why, where_to_get: x.where_to_get ?? detail[j]?.where_to_get, priority: x.priority }));
      return out;
    };
    return await answer(req, res, {
      label: 'paperwork-path',
      parts: [
        { required: true, run: () => list,
          apply: (d, l) => { ['situation_summary', 'event_label', 'document_checklist', 'verify_note'].forEach(k => { d[k] = l?.[k]; }); } },
        detailPart(0), detailPart(1),
        { run: () => ask(planPrompt, 'paperwork-path-plan'),
          apply: (d, plan) => { d.ordered_steps = plan?.ordered_steps; } },
        { run: () => ask(watchPrompt, 'paperwork-path-watch'),
          apply: (d, w) => { d.watch_outs = w?.watch_outs; } },
      ],
      finish: withDetail,
      ready: d => Boolean(d.document_checklist?.length),
      // A details pass that fails leaves those items with names only; that is
      // still an answer, never a reason to throw the rest away.
      complete: d => Boolean(d.ordered_steps && d.document_checklist?.length),
      check: async (draft) => {
        const d = withDetail(draft);
        const fields = stringFields(d);
        await allChecks(d, [
          ...(research ? [x => checkWorldFacts(x, research, { label: 'paperwork-path', fields: fields.filter(([, v]) => v.length > 15), subject: `${lifeEvent} in ${locationText}`, userLanguage })] : []),
          x => runOutputGuard(x, {
            label: 'paperwork-path',
            fields,
            readOnly: fields.filter(([, v]) => LABEL_RE.test(v)).map(([p]) => p),
            supplied: suppliedText(req.body),
            promise: 'A document checklist and the order to handle it for this life event, sequenced by what each step depends on, with the specific figures it can stand behind and where to confirm the rest.',
            guard: router.outputGuard,
            userLanguage,
            locale: withLocaleContext(userLocale, userCurrency, userRegion),
          }),
        ], { label: 'paperwork-path' });
        // Back into the draft from the new object: details merged, repairs included.
        Object.keys(draft).forEach(k => delete draft[k]);
        Object.assign(draft, d);
      },
    });
  } catch (error) {
    console.error('[PaperworkPath]', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

router.outputStandard = 'v2';
// paperwork-path-v2. Reviewed 2026-10-14 against the output standard: the
// schema asks for nothing the guard forbids (deadlines are stated only when
// well-established, and verify_note carries the jurisdiction caveat).
router.outputGuard = {
  prohibit: [
    'invented_deadline_or_fee',             // a window or fee stated as fact with no basis
    'one_items_deadline_reused_for_another', // a license grace period given to registration
    'requirement_from_a_different_jurisdiction',
    'legal_or_tax_outcome_stated_as_certain',
    'generic_checklist_not_specific_to_the_event',
  ],
  require: [
    'fulfills_tool_promise',
    'actionable_output',
    'steps_ordered_by_dependency',
    'figures_it_cannot_stand_behind_point_to_where_to_confirm',
  ],
};
module.exports = router;
