const express = require('express');
const router = express.Router();
const { withLanguage, withLocaleContext, callClaudeWithRetry } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');
const { runOutputGuard } = require('../lib/outputGuard');

// The theory is finished before the guard runs; never hold it hostage.
const GUARD_ENTRY_MS = Number(process.env.FAN_THEORY_GUARD_ENTRY_MS || 60_000);


const PERSONALITY = `Fan theory analyst and grader. Evaluate theories for plausibility, internal consistency, and use of canonical evidence. Be the brilliant, slightly pedantic professor who has seen everything.

Judge theories on their own merits: a great crack theory earns more respect than a boring obvious one. Identify the smoking gun evidence, the fatal flaw, and what would need to be true for the theory to work.

Never place a double-quote (") character inside any JSON string value — write quoted titles, dialogue, or phrases plainly or with single quotes, or it breaks the JSON.`;

// ════════════════════════════════════════════════════════════
// POST /fan-theory — Generate a wild fan theory
// ════════════════════════════════════════════════════════════
router.post('/fan-theory', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  const startedAt = Date.now();
  try {
    const { title, mediaType, direction, userLanguage } = req.body;

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
TYPE: ${mediaType || 'movie'}
DIRECTION: ${direction || 'wild'}
${directionHints[direction] || directionHints.wild}

Generate a wild but internally-consistent fan theory. The theory must cite specific plot details as evidence. It should be WRONG but DEFENSIBLE — that "wait... actually?" feeling.

CANONICAL EVIDENCE — STRICT MODE:

Use only simple canonical observations you are highly confident are true.

Prefer broad, unmistakable facts over impressive-sounding specifics.

GOOD:
"Michael repeatedly behaves in ways that would get many managers in trouble."

BAD:
"Michael is almost fired or demoted at least seven times."

GOOD:
"The documentary crew follows the employees for years."

BAD:
"The crew never speaks, never interferes, and never reacts emotionally."

GOOD:
"Sabre introduces unusual products and management practices."

BAD:
Listing specific Sabre policies unless you are highly confident each one
actually appears in the source.

Never add:
- exact counts unless certain
- "always," "never," "only," or similar absolutes unless unquestionably true
- rankings, statistics, chronology, quotes, episode details, or named events
  unless highly confident
- plausible details reconstructed from memory
- facts inferred from the theory itself

When choosing between a colorful specific claim and a boring canonical fact,
USE THE BORING CANONICAL FACT.

The creativity belongs entirely in the interpretation after the arrow.

In the JSON below, "detail" is the text BEFORE the arrow and "spin" is the
text AFTER it. The reader sees them joined that way.

SMOKING GUN:

Choose the single real canonical detail that creates the most entertaining
case for the theory.

"Smoking Gun" means the theory's best piece of circumstantial evidence,
not proof that the theory is actually true.

Do not invent or alter canon to create a Smoking Gun.

SMOKING GUN LENGTH:

Keep the Smoking Gun concise: 2–3 sentences maximum, and under 300 characters
in total — count them.
State the canonical detail first, then the theory's interpretation. Both halves
must be present; a bare fact with no reading is not a Smoking Gun, and a reading
with no fact is not evidence.
It should feel like the theory's punchline, not another essay. If it runs long,
cut the qualifying clauses, not the reading.

Return ONLY valid JSON:

{
  "theory_name": "A catchy, dramatic name for this theory (e.g., 'The Pixar Death Theory')",
  "one_line": "The theory in one shocking sentence",
  "the_theory": "Full theory explanation in 150-250 words. Build the case like a conspiracy theorist: evidence, connections, the big reveal. Make it compelling.",
  "evidence": [
    {
      "detail": "A SIMPLE, BROAD canonical observation you are highly confident of. Boring and unmistakable beats colourful and specific. No counts, absolutes, quotes or episode details unless certain",
      "spin": "The speculative reading you are putting on that real detail. This is where the invention belongs",
      "strength": "COMPELLING | SUSPICIOUS | A STRETCH | PURE DELUSION"
    }
  ],
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

    if (!parsed.theory_name || !Array.isArray(parsed.evidence)) {
      return res.status(500).json({ error: 'Could not generate a fan theory. Please try again.' });
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
  ],
  require: [
    'evidence_is_real_even_where_the_reading_is_not',
    'fulfills_tool_promise',
  ],
};

module.exports = router;
