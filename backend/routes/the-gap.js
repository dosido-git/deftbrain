const express = require('express');
const router = express.Router();
const { withLanguage, withLocaleContext, callClaudeWithRetry } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

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

    const systemPrompt = `You are an expert academic diagnostician. When a student says "I don't understand X", most people try to re-explain X. You do something different: you trace BACKWARDS through the prerequisite chain to find the exact point where their understanding broke.`;

    const levelNote = level === 'high_school' ? 'Student is at the high school level.' 
      : level === 'grad' ? 'Student is at the graduate level — assume strong foundations, look for subtle gaps.'
      : level === 'self_taught' ? 'Student is self-taught — gaps may be more scattered and fundamental.'
      : 'Student is at the undergraduate level.';

    const userPrompt = `STRUGGLING WITH: "${concept}"
${subject ? `SUBJECT/COURSE: ${subject}` : ''}
${whatIKnow ? `WHAT I DO UNDERSTAND: ${whatIKnow}` : ''}
${whereItBroke ? `WHERE IT BROKE: ${whereItBroke}` : ''}
LEVEL: ${levelNote}

Trace back to find the gap. Return ONLY valid JSON:

{
  "concept_analysis": "1-2 sentences: what this concept actually requires you to understand, and why it's commonly confusing.",

  "prerequisite_chain": [
    {
      "concept": "Prerequisite concept name",
      "why_needed": "Why you need this to understand the target concept",
      "quick_test": "A simple question or task that reveals if they have this prerequisite. Phrased as 'Can you...' or 'Do you know...'",
      "gap_likelihood": "high | medium | low",
      "level_in_chain": 1
    }
  ],

  "likely_gap": {
    "concept": "The prerequisite most likely to be the gap",
    "gap_type": "conceptual | procedural | definitional | notational",
    "gap_type_explanation": "What type of gap this is and what that means for how to fix it",
    "why_this_one": "Why this is likely the gap — what symptoms point here",
    "refresher": {
      "core_idea": "The key idea explained simply and clearly — 3-5 sentences max. This should be an actual mini-lesson, not a pointer to go read something.",
      "common_confusion": "The specific misconception that usually causes this gap",
      "practice": "1-2 specific exercises or tasks to confirm understanding",
      "time_estimate": "How long it takes to fill this gap: '10 minutes', '1 hour', '1-2 study sessions'"
    }
  },

  "chain_visualization": "A text-based chain showing the dependency path, e.g., 'Functions → Limits → Derivatives → Integration' with an arrow pointing to the likely gap",

  "forward_connection": "How filling the gap connects back to the original concept they're struggling with — make the 'aha' moment visible",

  "if_thats_not_it": [
    {
      "alternative_gap": "Another possible gap if the main one isn't it",
      "symptom": "What would indicate this is the real gap instead"
    }
  ],

  "study_plan": {
    "step_1": "Fill the gap: specific action",
    "step_2": "Verify the gap is filled: specific test",
    "step_3": "Return to original concept: what to try",
    "total_time": "Estimated total time to get unstuck"
  },

  "encouragement": "Genuine, specific encouragement — not generic 'you can do it'. Something that normalizes having this specific gap."
}

The prerequisite_chain should have 3-6 items, ordered from most foundational (level 1) to the target concept. Mark the most likely gap with high gap_likelihood. Provide AT MOST 2 if_thats_not_it items. gap_likelihood MUST stay one of the exact English keys high|medium|low regardless of the response language (it is a code value the UI switches on, not display text). Keep every field concise. Never place a double-quote (") character inside any JSON string value — a literal " breaks the JSON.`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 3500,
      system: withLanguage(systemPrompt, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'the-gap-trace' });

    if (!parsed.concept_analysis || !parsed.likely_gap) {
      return res.status(500).json({ error: 'Could not trace the gap. Please try again.' });
    }
    res.json(parsed);

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
