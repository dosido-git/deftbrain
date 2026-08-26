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

CANON VS. THEORY — CRITICAL:

The theory may be wild. The evidence may not be invented.

Clearly distinguish between:

1. CANONICAL EVIDENCE
   Events, dialogue, character behavior, relationships, objects, or other
   details that actually occur in the source material.

2. INTERPRETATION
   The deliberately speculative meaning the theory assigns to those facts.

Never invent a scene, event, quote, relationship, outcome, character status,
ownership interest, chronology, or other supposedly canonical fact merely
because it would strengthen the theory.

When uncertain whether a specific detail is actually canonical, do not state
it as fact. Either omit it or explicitly qualify it.

The fun should come from making an absurdly clever interpretation of real
evidence—not from fabricating the evidence itself.

Evidence ratings such as COMPELLING, SUSPICIOUS, A STRETCH, and PURE DELUSION
rate how strongly a real canonical detail supports the theory. They do not
indicate confidence that the underlying canonical detail is true.

SMOKING GUN:

Choose the single real canonical detail that creates the most entertaining
case for the theory.

"Smoking Gun" means the theory's best piece of circumstantial evidence,
not proof that the theory is actually true.

Do not invent or alter canon to create a Smoking Gun.

Return ONLY valid JSON:

{
  "theory_name": "A catchy, dramatic name for this theory (e.g., 'The Pixar Death Theory')",
  "one_line": "The theory in one shocking sentence",
  "the_theory": "Full theory explanation in 150-250 words. Build the case like a conspiracy theorist: evidence, connections, the big reveal. Make it compelling.",
  "evidence": [
    {
      "detail": "A REAL detail from the source material — something that actually occurs in it. Not invented, not altered",
      "spin": "The speculative reading you are putting on that real detail. This is where the invention belongs",
      "strength": "COMPELLING | SUSPICIOUS | A STRETCH | PURE DELUSION"
    }
  ],
  "the_smoking_gun": "The single REAL canonical detail that makes the most entertaining case. Circumstantial evidence for the theory, not proof it is true, and never invented to fit",
  "counterargument": "The strongest argument AGAINST this theory — and your response to it",
  "plausibility": 4,
  "mind_blown_factor": 7,
  "rabbit_hole": "Where to look for more 'evidence' — what scene to rewatch, what detail to examine"
}

Generate exactly 4-6 evidence items. At least one should be genuinely clever, at least one should be a hilarious stretch.
plausibility and mind_blown_factor are INTEGERS 1-10 (return the number only — most fan theories are plausibility 2-4). Keep every text field to 1-2 sentences — punchy, not padded.`;

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
