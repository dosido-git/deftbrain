const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, withLanguage } = require('../lib/claude');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

const PERSONALITY = `Rigorous belief stress-tester. Find the breaking points, exceptions, and hidden assumptions in any belief — then upgrade it into something more defensible.

METHOD: Steelman first. Attack with the most damaging counterexamples and edge cases you can find. Look for cultural variations, historical failures, and internal contradictions. Then rebuild a more precise version that survives the attack. Always honest about what genuinely survives and what doesn't.`;

router.post('/belief-stress-test', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { belief, context, userLanguage } = req.body;
  if (!belief?.trim()) return res.status(400).json({ error: 'Name a belief to stress-test.' });

    const userPrompt = `BELIEF STRESS TEST

THE BELIEF: "${belief.trim()}"
${context?.trim() ? `THEIR CONTEXT: ${context.trim()}` : ''}

Stress-test this belief across multiple dimensions. Find where it holds and where it breaks.

Return ONLY valid JSON:
{
  "belief_as_understood": "The belief restated clearly and charitably — one sentence",
  "belief_type": "empirical | moral | strategic | psychological | social",

  "where_it_holds": {
    "the_conditions": "The specific circumstances where this belief is genuinely true and useful — one sentence",
    "the_evidence_for": "The strongest evidence or examples that support it — one sentence",
    "why_people_hold_it": "The legitimate reason this became a widely-held belief — one sentence"
  },

  "stress_tests": [
    {
      "test_label": "Human-readable label — 2-4 words",
      "the_test": "The specific case, example, or logical scenario that challenges the belief — one sentence",
      "what_it_reveals": "What this test specifically reveals about the belief's limits or hidden assumptions — one sentence",
      "severity": "fatal | significant | minor"
    }
  ],

  "the_hidden_structure": {
    "what_its_really_saying": "The deeper claim underneath the surface statement of the belief — one sentence",
    "the_psychological_function": "What function this belief serves for the person who holds it — separate from whether it's true — one sentence",
    "when_it_becomes_harmful": "The specific conditions where holding this belief as an absolute rule produces bad outcomes — one sentence"
  },

  "the_nuanced_version": {
    "the_upgrade": "The more precise version of this belief that survives the stress tests — one sentence",
    "the_key_conditions": "The 'when' and 'under what circumstances' that make it accurate — one sentence",
    "still_useful_because": "Why even the upgraded version is worth keeping — one sentence",
    "example_of_upgrade_in_action": "A concrete example of how the upgraded belief would change a real decision — one sentence"
  },

  "verdict": {
    "rating": "mostly_true | context_dependent | useful_simplification | mostly_false | it_depends",
    "rating_label": "MOSTLY TRUE | CONTEXT-DEPENDENT | USEFUL SIMPLIFICATION | MOSTLY FALSE | IT DEPENDS",
    "one_line": "One sentence verdict"
  }
}`;

    const parsed = await callClaudeWithRetry({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      system: withLanguage(PERSONALITY, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'belief-stress-test' });
    if (!parsed.belief_as_understood) {
      return res.status(500).json({ error: 'Could not stress-test this belief. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('BeliefStressTest error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
