const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, withLanguage } = require('../lib/claude');
const { rateLimit } = require('../lib/rateLimiter');

const PERSONALITY = `You are a belief systems analyst. You stress-test the guiding beliefs people live by — the operating principles, mental models, and life rules they've accumulated.

Unlike pure philosophical attack, your job is diagnostic: find where the belief is load-bearing and where it's cracking, under what conditions it holds vs. fails, and what more nuanced version actually survives scrutiny.

You're not trying to destroy beliefs. You're trying to make them more accurate — which sometimes means revealing they're mostly right, sometimes revealing they're context-dependent, sometimes revealing they're a useful simplification that misleads in specific situations.

APPROACH:
- Historical counterexamples over abstract logic
- Edge cases that reveal the hidden structure of the belief
- The exact conditions under which the belief is true vs. false
- The psychological function the belief serves (which may be separate from its truth value)
- The more nuanced version that actually holds up`;

router.post('/belief-stress-test', rateLimit(), async (req, res) => {
  try {
    const { belief, context, userLanguage } = req.body;
  if (!belief?.trim()) return res.status(400).json({ error: 'Name a belief to stress-test.' });

    const userPrompt = `BELIEF STRESS TEST

THE BELIEF: "${belief.trim()}"
${context?.trim() ? `THEIR CONTEXT: ${context.trim()}` : ''}

Stress-test this belief across multiple dimensions. Find where it holds and where it breaks.

Return ONLY valid JSON:
{
  "belief_as_understood": "The belief restated clearly and charitably",
  "belief_type": "empirical | moral | strategic | psychological | social",

  "where_it_holds": {
    "the_conditions": "The specific circumstances where this belief is genuinely true and useful",
    "the_evidence_for": "The strongest evidence or examples that support it",
    "why_people_hold_it": "The legitimate reason this became a widely-held belief"
  },

  "stress_tests": [
    {
      "test_type": "historical_counterexample | logical_edge_case | cultural_variation | empirical_exception | self_undermining",
      "test_label": "Human-readable label",
      "the_test": "The specific case, example, or logical scenario that challenges the belief",
      "what_it_reveals": "What this test specifically reveals about the belief's limits or hidden assumptions",
      "severity": "fatal | significant | minor"
    }
  ],

  "the_hidden_structure": {
    "what_its_really_saying": "The deeper claim underneath the surface statement of the belief",
    "the_psychological_function": "What function this belief serves for the person who holds it — separate from whether it's true",
    "when_it_becomes_harmful": "The specific conditions where holding this belief as an absolute rule produces bad outcomes"
  },

  "the_nuanced_version": {
    "the_upgrade": "The more precise version of this belief that survives the stress tests",
    "the_key_conditions": "The 'when' and 'under what circumstances' that make it accurate",
    "still_useful_because": "Why even the upgraded version is worth keeping",
    "example_of_upgrade_in_action": "A concrete example of how the upgraded belief would change a real decision"
  },

  "verdict": {
    "rating": "mostly_true | context_dependent | useful_simplification | mostly_false | it_depends",
    "rating_label": "MOSTLY TRUE | CONTEXT-DEPENDENT | USEFUL SIMPLIFICATION | MOSTLY FALSE | IT DEPENDS",
    "one_line": "One sentence verdict"
  }
}`;

    const parsed = await callClaudeWithRetry(userPrompt, {
      model: 'claude-sonnet-4-6',
      label: 'belief-stress-test',
      max_tokens: 2500,
      system: withLanguage(PERSONALITY, userLanguage),
    });
    res.json(parsed);

  } catch (error) {
    console.error('BeliefStressTest error:', error);
    res.status(500).json({ error: error.message || 'Failed to stress-test the belief' });
  }
});

module.exports = router;
