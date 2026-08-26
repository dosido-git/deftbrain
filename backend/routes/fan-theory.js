const express = require('express');
const router = express.Router();
const { withLanguage, withLocaleContext, callClaudeWithRetry } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');
const { runOutputGuard } = require('../lib/outputGuard');

// The theory is finished before the guard runs; never hold it hostage.
const GUARD_ENTRY_MS = Number(process.env.FAN_THEORY_GUARD_ENTRY_MS || 60_000);
const CANON_CHECK_MS = Number(process.env.FAN_THEORY_CANON_MS || 30_000);

// Two rounds of "silently audit before returning" did not hold — the finale was
// described wrongly, an office burned down that never burns down, and the
// Jim/Pam and Michael/Holly arcs were bent to fit. A model asked to check its
// own work in the same breath as producing it does not really check it. This is
// a separate call that sees ONLY the factual claims and the title, with no
// theory to protect, which is the whole point (owner, 2026-08-26).
async function canonCheck(title, claims, userLanguage) {
  if (!claims.length) return null;
  const prompt = `These are factual claims about "${title}". Judge each ONLY on whether it is accurate to the actual work. You have not been told the theory they were written for, and you do not need it.

${claims.map((c, i) => `${i}. ${c}`).join('\n')}

For each, return a verdict:
- "ok" — accurate as written.
- "fix" — recognisably about something real but wrong in a detail, exaggerated, or overstated. Supply a "replacement": the same observation, corrected and made broader/safer, keeping it one sentence.
- "cut" — describes something that does not happen in the work, contradicts it, or you cannot verify.

Exaggeration counts as wrong. "The office burns down" is not a fix of a small fire; it is a different event. Do not soften a false claim into a vague one — if it did not happen, cut it.

Write "verdict" as the English word ok, fix or cut whatever language the rest of this is in — code compares it literally. "replacement" is shown to the reader and must be in their language.\n\nReturn ONLY valid JSON: { "verdicts": [ { "n": 0, "verdict": "ok|fix|cut", "replacement": "only when fix" } ] }`;
  try {
    const res = await Promise.race([
      callClaudeWithRetry({ model: MODELS.FAST, max_tokens: 1500, messages: [{ role: 'user', content: withLanguage(prompt, userLanguage) }] },
        { label: 'fan-theory-canon-check', maxRetries: 0 }),
      new Promise(r => setTimeout(() => r(null), CANON_CHECK_MS)),
    ]);
    return Array.isArray(res?.verdicts) ? res.verdicts : null;
  } catch (err) {
    console.log(`[fan-theory-v2] canon check failed (${err.message}) — claims left as written`);
    return null;
  }
}


const PERSONALITY = `Fan theory analyst and grader. Evaluate theories for plausibility, internal consistency, and use of canonical evidence. Be the brilliant, slightly pedantic professor who has seen everything.

Judge theories on their own merits: a great crack theory earns more respect than a boring obvious one. Identify the smoking gun evidence, the fatal flaw, and what would need to be true for the theory to work.

Never place a double-quote (") character inside any JSON string value — write quoted titles, dialogue, or phrases plainly or with single quotes, or it breaks the JSON.`;

// ════════════════════════════════════════════════════════════
// POST /fan-theory — Generate a wild fan theory
// ════════════════════════════════════════════════════════════
router.post('/fan-theory', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  const startedAt = Date.now();
  try {
    const { title, mediaType, direction, typeTouched, userLanguage } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({ error: 'Name a movie, show, book, or game!' });
    }

    const directionHints = {
      villain: 'Generate a theory about a hero/good character secretly being the villain or having sinister motives.',
      connected: 'Generate a theory connecting this to another franchise/universe in a way nobody would expect.',
      timeline: 'Generate a theory about the timeline being wrong, events happening in a different order, or time loops.',
      alive: 'Generate a theory about a dead character actually being alive, or a living character already being dead.',
      simulation: 'Generate a theory about the whole thing being a simulation, dream, or story-within-a-story.',
      wild: 'Go absolutely wild. The most creative, unexpected angle you can find.'
    };

    const userPrompt = `FAN THEORY GENERATOR:

TITLE: "${title.trim()}"
TYPE: ${mediaType || 'movie'}${typeTouched ? ' (the visitor chose this)' : ' (a default the visitor did not change — if this work is primarily known in a different medium, use that one instead and say so in detected_type)'}
DIRECTION: ${direction || 'wild'}
${directionHints[direction] || directionHints.wild}

Create the most surprising, entertaining theory you can without changing the
source material to make it possible.

Your job is to reinterpret real details, not invent new ones. The ideal reaction is:
"That's probably wrong—but I can't believe those details actually fit."
not:
"That would be interesting if those things had actually happened."

Be conservative about what happened; be fearless about what it might mean.

CANON INTEGRITY — NON-NEGOTIABLE

The theory may be wild. The evidence may not be invented.

- Base every factual claim about the source material on events, dialogue, characters, relationships, chronology, rules, or details you are confident actually appear in the work.
- Never invent, combine, relocate, or misremember a scene, quotation, character action, plot event, or piece of lore in order to make the theory work.
- Clearly separate observation from interpretation. In each evidence item, the observation must describe something actually present in the source; the interpretation may speculate freely about what it means.
- If you are uncertain whether a specific detail is canonical, do not present it as evidence. Use a broader detail you are confident about or omit it.
- Do not treat absence of information as proof. You may identify an omission or ambiguity, but label the inference appropriately.
- Prefer a weaker theory supported by real evidence over a spectacular theory supported by invented evidence.

EVIDENCE STRENGTH

Assign evidence labels based on how strongly the real canonical detail supports the theory—not on how entertaining the interpretation is.
A theory may contain weak evidence, stretches, and outright absurd interpretations. Label them accordingly. Do not inflate evidence strength to make the theory seem more convincing.

THE SMOKING GUN

Use THE SMOKING GUN only for the strongest genuine canonical detail supporting the theory.
If no detail deserves that description, use CLOSEST THING TO A SMOKING GUN instead — set "smoking_gun_is_weak" to true when you do. Never manufacture or distort evidence to create a smoking gun.
Keep it to 2-3 sentences, under 300 characters: the canonical detail first, then the reading. Both halves must be there. It is the punchline, not another essay.

COUNTERARGUMENT

Give the strongest canon-based argument against the theory. Do not create a weak objection merely so the theory can defeat it.
If the counterargument seriously damages or defeats the theory, say so. A theory can be entertaining even when it is probably wrong.

PLAUSIBILITY SCORE

Score plausibility according to how well the theory fits the actual source material: strength of evidence, consistency with canon, explanatory power, contradictions, and how many unsupported assumptions it requires.
Creativity and entertainment value belong in the mind-blown score, not the plausibility score.

Return ONLY valid JSON:

{
  "theory_name": "A catchy, dramatic name for this theory (e.g., 'The Pixar Death Theory')",
  "one_line": "The theory in one shocking sentence",
  "the_theory": "Full theory explanation in 150-250 words. Build the case like a conspiracy theorist: evidence, connections, the big reveal. Make it compelling.",
  "evidence": [
    {
      "detail": "OBSERVATION ONLY. A specific, canonical detail from the work that you are confident is accurate. The interface draws the arrow and prints spin after it — do NOT put an arrow, and do NOT put the interpretation, in this field",
      "spin": "THEORY INTERPRETATION. How a fan theorist could reinterpret that real detail to support the theory. This is the text AFTER the arrow, and it may be audacious, conspiratorial or ridiculous",
      "strength": "COMPELLING | SUSPICIOUS | A STRETCH | PURE DELUSION"
    }
  ],
  "detected_type": "movie | show | book | game — the medium this work is primarily known in",
  "smoking_gun_is_weak": false,
  "the_smoking_gun": "UNDER 300 CHARACTERS, 2-3 sentences. One sentence of canon, then one or two of reading — BOTH halves must be there. The canonical detail first, then the theory reading of it. The punchline, not another essay. Real canon, circumstantial evidence for the theory, never proof and never invented to fit",
  "counterargument": "The strongest argument AGAINST this theory — and your response to it",
  "plausibility": 4,
  "mind_blown_factor": 7,
  "rabbit_hole": "Where to look for more 'evidence' — what scene to rewatch, what detail to examine"
}

Generate exactly 4-6 evidence items. At least one should be genuinely clever, at least one should be a hilarious stretch.
plausibility and mind_blown_factor are INTEGERS 1-10 (return the number only — most fan theories are plausibility 2-4). Keep every text field to 1-2 sentences — punchy, not padded.

FINAL CANON AUDIT:

Before returning the answer, inspect ONLY the text before each →.

For every factual claim ask:
"Would a knowledgeable fan immediately recognize this as unquestionably
true from the source?"

If not, simplify it until the answer is yes.

Do not ask whether the claim is plausible.
Do not ask whether it fits the theory.
Ask only whether it is reliably canonical.

If uncertain, remove it.`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.FAST,
      max_tokens: 4000,
      system: withLanguage(PERSONALITY, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'fan-theory' });

    // A model told to think in "observation → interpretation" sometimes writes
    // the arrow into the observation field. Split rather than scold: the half
    // after the arrow is the spin, which is where it belonged.
    (parsed.evidence || []).forEach(e => {
      if (typeof e?.detail === 'string' && e.detail.includes('→')) {
        const [head, ...tail] = e.detail.split('→');
        const rest = tail.join('→').trim();
        e.detail = head.trim();
        if (rest && !e.spin) e.spin = rest;
      }
    });

    if (!parsed.theory_name || !Array.isArray(parsed.evidence)) {
      return res.status(500).json({ error: 'Could not generate a fan theory. Please try again.' });
    }

    // Canon check, before the guard: bad facts are cheaper to remove than to
    // argue with, and the guard should not be repairing a claim that should not
    // be there at all.
    const claimIdx = [];
    const claims = [];
    (parsed.evidence || []).forEach((e, i) => {
      if (typeof e?.detail === 'string' && e.detail.trim()) { claimIdx.push({ kind: 'evidence', i }); claims.push(e.detail.trim()); }
    });
    if (typeof parsed.the_smoking_gun === 'string' && parsed.the_smoking_gun.trim()) { claimIdx.push({ kind: 'smoking_gun' }); claims.push(parsed.the_smoking_gun.trim()); }

    const verdicts = await canonCheck(title.trim(), claims, userLanguage);
    if (verdicts) {
      const drop = new Set();
      let fixed = 0;
      for (const v of verdicts) {
        const slot = claimIdx[Number(v?.n)];
        if (!slot) continue;
        if (v.verdict === 'cut') { drop.add(Number(v.n)); continue; }
        if (v.verdict === 'fix' && typeof v.replacement === 'string' && v.replacement.trim()) {
          fixed++;
          if (slot.kind === 'evidence') parsed.evidence[slot.i].detail = v.replacement.trim();
          else parsed.the_smoking_gun = v.replacement.trim();
        }
      }
      // Never cut the tool down to nothing: a theory with one piece of evidence
      // is still a theory, none is a blank card.
      const keep = (parsed.evidence || []).filter((_, i) => !drop.has(claimIdx.findIndex(c => c.kind === 'evidence' && c.i === i)));
      if (keep.length >= 2) parsed.evidence = keep;
      // If the Smoking Gun itself was invented, promote the strongest surviving
      // evidence rather than leaving the card blank — and label it honestly.
      const sgIdx = claimIdx.findIndex(c => c.kind === 'smoking_gun');
      if (sgIdx >= 0 && drop.has(sgIdx)) {
        const rank = { COMPELLING: 0, SUSPICIOUS: 1, 'A STRETCH': 2, 'PURE DELUSION': 3 };
        const best = [...(parsed.evidence || [])]
          .filter(e => e?.detail && e?.spin)
          .sort((a, b) => (rank[a.strength] ?? 9) - (rank[b.strength] ?? 9))[0];
        parsed.the_smoking_gun = best ? `${best.detail} ${best.spin}` : '';
        parsed.smoking_gun_is_weak = true;
      }
      if (drop.size || fixed) console.log(`[fan-theory-v2] canon check: ${fixed} corrected, ${drop.size} cut of ${claims.length} claims`);
    }

    const elapsed = Date.now() - startedAt;
    if (elapsed > GUARD_ENTRY_MS) {
      console.log(`[fan-theory-v2] v2 guard: skipped — ${Math.round(elapsed / 1000)}s already spent, answer returned unguarded`);
      return res.json(parsed);
    }

    // Only the halves that claim to be canon. `spin` is the invented reading and
    // is the product; guarding it would be guarding the joke.
    const fields = [];
    (parsed.evidence || []).forEach((e, i) => {
      if (typeof e?.detail === 'string' && e.detail.trim()) fields.push([`evidence[${i}].detail`, e.detail]);
    });
    if (typeof parsed.the_smoking_gun === 'string') fields.push(['the_smoking_gun', parsed.the_smoking_gun]);
    if (typeof parsed.rabbit_hole === 'string') fields.push(['rabbit_hole', parsed.rabbit_hole]);

    await runOutputGuard(parsed, {
      label: 'fan-theory-v2',
      fields,
      supplied: `THE VISITOR NAMED ONE TITLE AND NOTHING ELSE:
Title: ${title.trim()}
Type: ${mediaType || 'movie'}
Theory direction they picked: ${direction || 'wild'}

The source material is public and widely known; you may use it. What you may not do is add to it.

WHAT FAILS — and ONLY these. A wild, absurd, obviously-wrong READING is the entire product and must never be flagged:
1. A scene, event or moment that does not occur in the source material.
2. A line of dialogue nobody says, presented as a quote.
3. A relationship, ownership, parentage, or character status that is not established in the work.
4. A chronology or outcome that contradicts the work, stated as if it were canon.
5. A detail the writer is plainly unsure about, stated flatly as fact rather than qualified.
6. A smoking gun that is not actually in the source. The theory's best circumstantial evidence still has to exist.

The COMPELLING / SUSPICIOUS / A STRETCH / PURE DELUSION rating describes how well a REAL detail supports the theory. A PURE DELUSION rating does not license an invented detail.`,
      promise: 'Fan Theory builds a wild but defensible theory about a named work: an absurdly clever interpretation of details that really are in it.',
      guard: router.outputGuard,
      userLanguage,
      locale: withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
    });

    res.json(parsed);

  } catch (error) {
    console.error('FanTheory error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ════════════════════════════════════════════════════════════
// POST /fan-theory/grade — Grade a user's fan theory
// ════════════════════════════════════════════════════════════
router.post('/fan-theory/grade', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { title, theory, userLanguage } = req.body;

    if (!theory?.trim()) {
      return res.status(400).json({ error: 'Share your theory!' });
    }

    const userPrompt = `GRADE THIS FAN THEORY:

ABOUT: "${title?.trim() || 'Unknown'}"
THE THEORY: "${theory.trim().slice(0, 2000)}"

You are a fan theory professor grading this submission. Be thorough, fair, and entertaining. Identify what's clever, what's a stretch, and what's pure cope.

Return ONLY valid JSON:

{
  "grade": "A+ | A | B | C | D | F — with a +/- modifier",
  "grade_title": "A title for this grade level (e.g., 'Certified Galaxy Brain', 'Noble Effort', 'Delusional But Dedicated')",
  "strengths": [
    "What's genuinely clever or well-observed about this theory"
  ],
  "weaknesses": [
    "Where the theory falls apart — be specific"
  ],
  "plausibility": 4,
  "creativity": 7,
  "evidence_quality": "ROCK SOLID | DECENT | CIRCUMSTANTIAL | VIBES ONLY",
  "professor_notes": "2-3 sentences of feedback in the voice of a professor. Constructive but entertaining.",
  "improvement_suggestion": "How could this theory be made more convincing? One specific suggestion.",
  "would_reddit_upvote": "How would this perform on Reddit? One sentence prediction."
}

plausibility and creativity are INTEGERS 1-10 (return the number only). strengths and weaknesses: at most 4 each. Keep every text field to 1-2 sentences.`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.FAST,
      max_tokens: 2000,
      system: withLanguage(PERSONALITY, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'fan-theory-grade' });

    if (!parsed.grade || !parsed.professor_notes) {
      return res.status(500).json({ error: 'Could not grade your theory. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('FanTheory grade error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

router.outputStandard = 'v2';
// fan-theory-v2. Reviewed 2026-08-26. The theory is meant to be wrong; the
// EVIDENCE is not meant to be invented. Everything here polices the second
// half, and nothing polices the first — a wild reading is the product.
router.outputGuard = {
  prohibit: [
    'invented_scene_or_event',
    'invented_quote_or_dialogue',
    'invented_relationship_or_character_status',
    'invented_chronology_or_outcome',
    'uncertain_detail_stated_as_canon',
    'smoking_gun_that_is_not_in_the_source',
    'exaggerated_real_event',            // a small fire becomes the office burning down
    'contradicts_the_source',
  ],
  require: [
    'evidence_is_real_even_where_the_reading_is_not',
    'fulfills_tool_promise',
  ],
};

module.exports = router;
