const express = require('express');
const router = express.Router();
const { withLanguage, withLocaleContext, callClaudeWithRetry, NO_INVENTED_FACTS } = require('../lib/claude');
const { answer, onlyKeys, planFirst, planNote } = require('../lib/progressive');
const { MODELS } = require('../lib/models');
const { allChecks } = require('../lib/bothChecks');
const { calibrateClaims } = require('../lib/certaintyCheck');
const { checkConsistency } = require('../lib/outputGuard');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

// A frequency claim reads as a proven one. "The single most common reason" and
// "statistically the most common sticking point" are not wrong, but a reader
// does not separate common from established — and this tool has no study behind
// it, only a pattern it has seen described. Testing also caught it reaching for
// "the literature on calculus misconceptions consistently identifies", which is
// an authority it does not have.
const FREQUENCY_RULE = `
On how common something is: soften every superlative and never cite research,
literature, studies or data you cannot name.

  NO:  The single most common reason students get stuck here.
  YES: One of the most common reasons students get stuck here.
  NO:  Statistically the most common sticking point for this topic.
  YES: A very common sticking point for this topic.
  NO:  The literature on misconceptions consistently identifies this.
  YES: This trips up a lot of people at the same stage.
  NO:  Research shows 80% of students miss this.
  YES: Plenty of people miss this.

"Common", "often", "a lot of people" are all fine. "The single most", "always",
"statistically", "studies show", "the literature" are not. You are describing a
pattern you recognise, not reporting a finding.`;

// ════════════════════════════════════════════════════════════
// POST /the-gap — Trace back to the missing prerequisite
// ════════════════════════════════════════════════════════════
router.post('/the-gap', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const {
      concept,         // What they don't understand
      subject,         // Course / field
      whatIKnow,       // What they DO understand (helps calibrate)
      whereItBroke,    // Optional: "I was fine until..." 
      level,           // 'high_school', 'undergrad', 'grad', 'self_taught'
      userLanguage,
    } = req.body;

    if (!concept?.trim()) {
      return res.status(400).json({ error: 'What concept are you struggling with?' });
    }
    if (concept.trim().length < 3) {
      return res.status(400).json({ error: 'Tell us a bit more — what topic or concept is this about?' });
    }

    const systemPrompt = `You are an expert academic diagnostician. When a student says "I don't understand X", most people try to re-explain X. You do something different: you trace BACKWARDS through the prerequisite chain to find the exact point where their understanding broke.

${NO_INVENTED_FACTS}`;

    const levelNote = level === 'high_school' ? 'Student is at the high school level.' 
      : level === 'grad' ? 'Student is at the graduate level — assume strong foundations, look for subtle gaps.'
      : level === 'self_taught' ? 'Student is self-taught — gaps may be more scattered and fundamental.'
      : 'Student is at the undergraduate level.';

    // How much they told us decides how the gap is framed (owner's review,
    // 2026-10-27): a topic name alone gives a place to check, not a diagnosis.
    const described = Boolean(whatIKnow?.trim() || whereItBroke?.trim());
    const userPrompt = `STRUGGLING WITH: "${concept}"
${subject ? `SUBJECT/COURSE (given by the reader — use it): ${subject}` : 'SUBJECT/COURSE: not given — work it out from the concept itself and report it in subject_detected.'}
${whatIKnow ? `WHAT I DO UNDERSTAND: ${whatIKnow}` : ''}
${whereItBroke ? `WHERE IT BROKE: ${whereItBroke}` : ''}
LEVEL: ${levelNote}

Trace back to find the gap. ${FREQUENCY_RULE}

WHAT YOU KNOW ABOUT THIS PERSON. ${described ? 'Only what they wrote above.' : 'Only the topic name — nothing about how they are stuck.'} You have not seen them work, so the gap you name is a place to CHECK FIRST, not a finding about them. Never say what they can or cannot do, what they were or were not taught, or how their confusion feels, unless they wrote it. The check below is how they find out whether you picked the right place.

Return ONLY valid JSON:

{
  "concept_analysis": "1-2 sentences: what this concept actually requires you to understand, and why it's commonly confusing.",

  "subject_detected": "The field this concept belongs to, in one or two words — Calculus, Molecular biology, Statistics. Echo back the reader's own subject if they gave one.",

  "likely_gap": {
    "concept": "The prerequisite worth checking first",
    "gap_type": "EXACTLY one of these four English words, never translated: conceptual | procedural | definitional | notational",
    "why_check_this": "1-2 sentences: why this is a useful place to check first for this topic — conditional, never a claim about what this person does or lacks"
  },

  "check": {
    "example": "A tiny worked example the questions refer to, in the subject's own notation: at most 12 lines of code, a short worked problem, or a short passage. Line breaks allowed.",
    "questions": [
      {
        "question": "One question about the example that a person with this prerequisite answers easily — about the example, never 'Can you explain…'",
        "answer": "The correct answer, 1-2 sentences",
        "if_missed": "Which gap a wrong answer points to, in a few words"
      }
    ]
  },

  "refresher": {
    "core_idea": "The key idea explained simply — 3-5 sentences, an actual mini-lesson tied to the example. If you use a picture or analogy, keep its positions and directions the same throughout.",
    "common_confusion": "The specific misconception that usually causes this gap",
    "practice": {
      "task": "ONE short exercise",
      "how_to_check": "How they can tell they got it right"
    }
  },

  "prerequisite_chain": [
    {
      "concept": "Prerequisite concept name",
      "why_needed": "One sentence: why you need this to understand the target concept",
      "quick_test": "One short concrete question that reveals whether they have this prerequisite — a question to answer, never 'Can you…' or 'Do you know…'",
      "level_in_chain": 1
    }
  ],

  "encouragement": "One sentence that normalizes getting stuck on this topic — never a claim about why this person is stuck or how they were taught."
}

check.questions: 2-3, each testing ONE distinct thing that would point to a different gap (for recursion, stopping is not the same question as how a result gets back). prerequisite_chain: 3-4 items in the order worth checking, most foundational first. No time estimates anywhere. State technical rules with the conditions they need: a typical case is not a universal rule. Keep every field concise. Never place a double-quote (") character inside any JSON string value — a literal " breaks the JSON.`;

    // Progressive, plan first (2026-10-18, lib/progressive.js, T11): the gap
    // to check shows first; the check, the lesson and the prerequisite list
    // are written alongside, handed it, so they all point at the same gap.
    // Speed (2026-10-27): each pass writes one short part.
    const system = withLanguage(systemPrompt, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion);
    const call = (content, maxTokens, tag) => callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content }],
    }, { label: tag });
    const PLAN = ['concept_analysis', 'subject_detected', 'likely_gap'];
    const plan = call(onlyKeys(userPrompt, PLAN), 800, 'the-gap-trace');
    plan.catch(() => {}); // the plan part reports its own failure
    return await answer(req, res, {
      label: 'the-gap',
      parts: [
        ...planFirst(PLAN, () => plan, [
          ['check'],
          ['refresher'],
        ], (keys, i, p) => call(onlyKeys(userPrompt, keys) + planNote(p, PLAN), 1500, `the-gap-trace-${i + 2}`)),
        // The prerequisite list does not depend on which gap is picked, so it
        // starts at once instead of waiting for the plan (speed, 2026-10-27).
        { run: () => call(onlyKeys(userPrompt, ['prerequisite_chain', 'encouragement']), 1200, 'the-gap-trace-4'),
          apply: (d, o) => { if (o?.prerequisite_chain) d.prerequisite_chain = o.prerequisite_chain; if (o?.encouragement) d.encouragement = o.encouragement; } },
      ],
      finish: d => {
        const { refresher, ...out } = structuredClone(d);
        // The lesson travels inside likely_gap, where saved results and the
        // dig endpoint expect it.
        if (out.likely_gap && refresher) out.likely_gap = { ...out.likely_gap, refresher };
        out.basis = described ? 'described' : 'topic_only';
        if (out.check && !Array.isArray(out.check.questions)) out.check.questions = [];
        return out;
      },
      ready: d => Boolean(d.concept_analysis && d.likely_gap),
      complete: d => Boolean(d.concept_analysis && d.likely_gap),
      // T3/T4/T5 (audit/DEFECT-TYPES.md), side by side (lib/bothChecks.js):
      // technical rules with their conditions; then contradictions (an analogy
      // that changes direction) and details about the person they never gave.
      check: d => allChecks(d, [
        x => calibrateClaims(x, { label: 'the-gap', userLanguage }),
        x => checkConsistency(x, { label: 'the-gap', userLanguage }),
      ], { label: 'the-gap' }),
    });

  } catch (error) {
    console.error('The Gap error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ════════════════════════════════════════════════════════════
// POST /the-gap/dig — Dig deeper into a specific prerequisite
// ════════════════════════════════════════════════════════════
router.post('/the-gap/dig', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const {
      originalConcept,
      prerequisite,     // Which prerequisite they want to dig into
      testResult,       // 'failed' | 'unsure' | 'passed' — how they did on the quick test
      userLanguage,
    } = req.body;

    if (!prerequisite?.trim()) {
      return res.status(400).json({ error: 'Which prerequisite do you want to explore?' });
    }

    const systemPrompt = `You are an expert academic diagnostician performing a deeper dive into a specific prerequisite concept. The student identified this as a potential gap area. Provide a thorough but focused refresher.`;

    const userPrompt = `ORIGINAL STRUGGLE: "${originalConcept || 'not specified'}"
PREREQUISITE TO DIG INTO: "${prerequisite}"
TEST RESULT: ${testResult === 'failed' ? 'They could NOT answer the quick test — this is likely the gap' : testResult === 'unsure' ? 'They were UNSURE on the quick test — partial understanding' : 'They PASSED the quick test but want to strengthen it anyway'}

${FREQUENCY_RULE}

Provide a focused refresher. Return ONLY valid JSON:

{
  "concept": "${prerequisite}",
  "refresher": {
    "in_plain_english": "Explain this concept as if talking to a smart friend who missed that day of class. 4-6 sentences. Use analogies if helpful.",
    "formal_definition": "The textbook-level definition, precisely stated.",
    "key_insight": "The ONE thing that makes this click — the insight most explanations skip.",
    "visual_or_analogy": "A visual metaphor, diagram description, or real-world analogy that makes it concrete.",
    "worked_example": "A specific worked example showing this concept in action, step by step.",
    "practice_problems": [
      {
        "problem": "A practice problem",
        "hint": "A hint if stuck",
        "answer": "The answer with brief explanation"
      }
    ],
    "common_mistakes": [
      "Specific mistakes students make with this concept"
    ]
  },
  "connects_forward": "Now that you understand this, here's how it connects to ${originalConcept || 'the concept you were struggling with'}..."
}

Include 2-3 practice problems, ordered easy → hard, and AT MOST 3 common_mistakes. Keep every field concise. Never place a double-quote (") character inside any JSON string value — a literal " breaks the JSON.`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 4000,
      system: withLanguage(systemPrompt, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'the-gap-deeper' });

    if (!parsed.concept || !parsed.refresher) {
      return res.status(500).json({ error: 'Could not dig deeper. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('The Gap dig error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
