const express = require('express');
const router = express.Router();
const { withLanguage, withLocaleContext, callClaudeWithRetry } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

// ── Fact-check pass (2026-10-02) ─────────────────────────────────────────────
// A teaching tool can't ship a wrong number: prompt rules cut the slips
// ("double 3/4 = 6/8", a rate "in the exponent") but don't end them. A second
// call reads the finished explanation and returns only targeted fixes, which
// are applied to whitelisted text fields. Fails OPEN — if the check errors or
// returns junk, the user still gets the original answer.
const CHECKABLE = /^(one_liner|the_key_insight|teaching_tip|go_deeper|analogies\.\d+\.(analogy|why_it_works|where_it_breaks)|common_misconceptions\.\d+\.(myth|reality))$/;

function applyFixes(parsed, fixes) {
  const out = structuredClone(parsed);
  const removals = [];
  let applied = 0;
  for (const f of Array.isArray(fixes) ? fixes : []) {
    const path = String(f?.path || '');
    const m = path.match(/^common_misconceptions\.(\d+)$/);
    if (m && f.remove === true) { removals.push(Number(m[1])); continue; }
    if (!CHECKABLE.test(path) || typeof f.text !== 'string' || !f.text.trim()) continue;
    const keys = path.split('.');
    let node = out;
    for (const k of keys.slice(0, -1)) node = node?.[k];
    const last = keys[keys.length - 1];
    if (!node || typeof node[last] !== 'string') continue;
    node[last] = f.text.trim();
    applied++;
  }
  // Drop false misconceptions, but never empty the section.
  if (Array.isArray(out.common_misconceptions)) {
    const keep = out.common_misconceptions.filter((_, i) => !removals.includes(i));
    if (keep.length && keep.length < out.common_misconceptions.length) {
      applied += out.common_misconceptions.length - keep.length;
      out.common_misconceptions = keep;
    }
  }
  return { result: out, applied };
}

async function factCheck(parsed, { concept, audience, userLanguage }) {
  const system = `Meticulous fact-checker for explanations written for learners. You check; you do not rewrite for style.

Find ONLY real errors: wrong arithmetic or numbers, a number that changes partway through a worked example, a false or overstated factual claim, a comparison word pointing the wrong way (more/less, longer/shorter, base/exponent), a "misconception" that is actually true, or a correction that does not contradict its myth.
Do NOT touch style, tone, length, or analogies that are merely loose — every analogy simplifies, and its where_it_breaks field already says how.

Work in two steps inside the JSON. First "checks": go through EVERY number, calculation, statistic and factual claim in the explanation (every analogy and every misconception), recompute or verify it, and record it briefly — {"path": "...", "claim": "a few words", "ok": true|false}. Recompute; do not trust the text. A worked example must use the same numbers in every step. Then "fixes": a fix for every check that is not ok.

Return ONLY valid JSON: {"checks": [...], "fixes": [...]}. Each fix is either
  {"path": "<field path>", "text": "<the whole corrected field, same language, same length and voice, only the error changed>"}
or, for a misconception that is true, or whose fix would not fit in about the original length, {"path": "common_misconceptions.<i>", "remove": true}.
A fix keeps roughly the original length — these render in fixed card slots. If a statement is true, leave it alone even if you would phrase it differently.
Paths look like: one_liner, the_key_insight, teaching_tip, go_deeper, analogies.2.analogy, analogies.0.where_it_breaks, common_misconceptions.1.reality (0-based).
No errors → "fixes": []. Do not invent problems, but do not wave a claim through without recomputing it. Never place a double-quote (") character inside a JSON string value.`;

  const checked = await callClaudeWithRetry({
    model: MODELS.SMART,
    max_tokens: 3000,
    system: withLanguage(system, userLanguage),
    messages: [{ role: 'user', content: `CONCEPT: ${concept}\nAUDIENCE: ${audience || 'general adult'}\n\nEXPLANATION TO CHECK:\n${JSON.stringify(parsed)}` }],
  }, { label: 'analogy-engine-factcheck', maxRetries: 1 });
  return applyFixes(parsed, checked?.fixes);
}

// ════════════════════════════════════════════════════════════
// POST /analogy-engine — Explain Anything to Anyone
// ════════════════════════════════════════════════════════════
router.post('/analogy-engine', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { concept, audience, audienceInterests, depth, userLanguage } = req.body;

    if (!concept?.trim()) {
      return res.status(400).json({ error: 'Tell us what you need to explain.' });
    }

    const systemPrompt = `Master explainer. Create analogies so precise that complex concepts click instantly.

RULES: Every analogy must be accurate where it holds AND honest about where it breaks down — the break point often teaches more than the parallel. Offer multiple domains (technical, everyday, biological, historical). The key insight is WHY this analogy works structurally, not just how it sounds.

NUMBERS AND FACTS MUST BE RIGHT: a wrong number in a teaching example teaches the wrong thing. Before writing any number, calculation, unit, date or fact, work it out and check it — doubling 3/4 is 6/4 (1 1/2), never 6/8. Never call a changed quantity 'the same amount' or offer two different answers to one calculation. Use small, easy numbers. A worked example states its numbers once and uses those same numbers in every step (a 10% rate stays 10%). If you cannot verify a calculation, describe the idea in words instead of working it out. This applies everywhere — analogies, misconceptions, corrections: if you are not certain a claim is true, leave it out and choose another.
DIRECTION WORDS: comparisons flip meaning when one word is wrong. Before finishing, re-read every sentence that compares (more/less, longer/shorter, higher/lower, earlier/later, bigger/smaller) and confirm each word points the way the claim needs — in whatever language you are writing. Each myth must be genuinely false and each correction must actually contradict it — if the correction would have to concede the myth, or only holds under conditions it does not state, choose a different misconception.
When the concept is itself numeric or mathematical, the analogy must come from outside it (sharing a pizza, splitting a bill) — a recipe that uses fractions is an example of fractions, not an analogy for them.`;

    const userPrompt = `CONCEPT TO EXPLAIN: ${concept}
AUDIENCE: ${audience || 'general adult'}
${audienceInterests ? `AUDIENCE INTERESTS/WORLD: ${audienceInterests}` : ''}
DEPTH: ${depth || 'solid_understanding'}

Generate tailored analogies. Return ONLY valid JSON:
{
  "concept_name": "Clean name of the concept — 3-6 words",
  "one_liner": "The concept explained in one sentence a 10-year-old could understand. No jargon.",

  "analogies": [
    {
      "title": "Short catchy name for this analogy (e.g., 'The Library Card System') — 3-6 words",
      "type": "Visual | Experiential | Narrative | Structural | Emotional | Mechanical",
      "analogy": "The full analogy — 3-5 sentences. Written conversationally, as if explaining to the specific audience. Use their world.",
      "why_it_works": "One sentence on what makes this analogy effective for this audience.",
      "where_it_breaks": "One sentence on the limit of this analogy — what it doesn't capture.",
      "accuracy": "high | medium",
      "memorability": "high | medium"
    }
  ],

  "the_key_insight": "The single most important thing to understand about this concept, stated plainly. The sentence that makes everything click. — one sentence",

  "common_misconceptions": [
    {
      "myth": "2-3 of these — only the strongest, most clearly false ones; 2 is fine. Do not pad to reach a number, and do not split one misconception into two. What people wrongly believe, as ONE claim: a single sentence, no parenthetical, no second clause explaining it. If it needs an explanation it is not a misconception, it is a lesson — cut it or move the substance into the correction.",
      "reality": "The correction, as ONE sentence — aim for about 15 words. That is a target, not a cliff: go over when the correction genuinely needs it, but a 30-word answer means you are explaining rather than correcting. No parenthetical — not one, anywhere; if you reach for brackets, the thing inside them is either the real point or cuttable. These render as a two-line pair, so length is what breaks the format."
    }
  ],

  "go_deeper": "If they want to learn more, what's the next concept to understand? One sentence pointing them forward.",
  "go_deeper_concept": "Just the clean name of that next concept — 2-5 words, no punctuation, ready to drop into a fresh explanation. e.g. 'mRNA vaccine technology'",

  "teaching_tip": "One practical tip for the person doing the explaining — how to deliver these analogies effectively. — one sentence"
}

Generate ${depth === 'quick_grasp' ? '2-3' : depth === 'deep_understanding' ? '5-6' : '3-5'} analogies.`;

    const parsed = await callClaudeWithRetry({
      // SMART, not FAST (2026-10-02): Haiku slipped arithmetic into worked
      // examples ("double 3/4 = 6/8, the same amount") — a teaching tool can't.
      model: MODELS.SMART,
      // 4000 (not 2500) for i18n headroom: deep mode (6 analogies × 3-5
      // sentences) fills ~78% of 2500 in English but truncates → 500 in verbose
      // languages like German. The schema is already bounded; this is headroom.
      max_tokens: 4000,
      system: withLanguage(systemPrompt, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion) + ' Never place a double-quote (") character inside any JSON string value — write quoted phrases or examples plainly or with single quotes, or it breaks the JSON.',
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'analogy-engine' });
    if (!parsed.concept_name) {
      return res.status(500).json({ error: 'Could not generate a response. Please try again.' });
    }

    let finalResult = parsed;
    try {
      const { result, applied } = await factCheck(parsed, { concept, audience, userLanguage });
      if (applied) console.log(`[analogy-engine] fact-check applied ${applied} fix(es)`);
      finalResult = result;
    } catch (err) {
      console.warn('[analogy-engine] fact-check skipped:', err.message);
    }
    return res.json(finalResult);

  } catch (error) {
    console.error('AnalogyEngine error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.'});
  }
});

module.exports = router;
