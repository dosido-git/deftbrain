const express = require('express');
const router = express.Router();
const { withLanguage, withLocaleContext, callClaudeWithRetry } = require('../lib/claude');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

const PERSONALITY = `Rigorous intellectual sparring partner. Steelman, then demolish, then rebuild.

METHOD: (1) State the belief in its strongest possible form before attacking. (2) Find the most devastating, hardest-to-dismiss counter-argument — not strawmen. (3) Identify what genuinely survives the attack. (4) Rebuild a more precise, defensible version.

RULES: Credit the belief where it has genuine merit. The rebuild must be something the person can actually hold. If mostly sound, say so — but find the weakness anyway. No moralizing. Take positions.`;

router.post('/ego-killer', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { belief, context, howStrongly, userLanguage } = req.body;
    if (!belief?.trim()) return res.status(400).json({ error: 'What do you believe?' });

    const userPrompt = `EGO KILLER — DEMOLISH AND REBUILD

THE BELIEF: "${belief.trim()}"
${context?.trim() ? `WHY THEY HOLD IT / THEIR CONTEXT: ${context.trim()}` : ''}
${howStrongly ? `HOW STRONGLY HELD: ${howStrongly}/10` : ''}

Steelman it. Destroy it. Rebuild what survives.

Return ONLY valid JSON:
{
  "belief_steelmanned": "The belief restated in its strongest, most sophisticated form — the version its most intelligent defender would be proud of — one sentence",

  "the_demolition": {
    "the_core_attack": "The single most devastating counter-argument — the one that's hardest to dismiss. Not a list of objections. The one that cuts deepest. — one sentence",
    "why_its_devastating": "Why this specific argument is so damaging to this specific belief — the mechanism — one sentence",
    "the_evidence": "The strongest empirical or logical evidence for the counter-position — one sentence",
    "historical_counterexamples": [
      {
        "example": "A specific historical or documented case where this belief failed — one sentence",
        "what_it_shows": "What this case specifically reveals about the belief's limits — one sentence"
      }
    ],
    "the_hidden_assumption": "The unstated assumption the belief depends on — the load-bearing wall that, when removed, collapses the structure — one sentence"
  },

  "what_survives": {
    "the_kernel": "The part of the belief that genuinely withstands the attack — be specific and honest — one sentence",
    "under_what_conditions": "The conditions under which this belief is actually true or useful — one sentence",
    "what_it_explains_well": "What the belief genuinely explains or predicts correctly — one sentence"
  },

  "the_rebuild": {
    "the_stronger_version": "A more precise, more defensible version of the belief that incorporates what was learned from the demolition — one sentence",
    "the_key_qualification": "The crucial qualifier that makes the rebuilt version actually hold — one sentence",
    "now_unshakeable_because": "Why this rebuilt version is harder to attack than the original — one sentence"
  },

  "the_verdict": {
    "outcome": "demolished | refined | vindicated | complicated",
    "outcome_label": "DEMOLISHED | REFINED | VINDICATED | IT'S COMPLICATED",
    "one_line": "One sentence verdict on where the belief stands after this"
  }
}`;

    const parsed = await callClaudeWithRetry({
model: 'claude-sonnet-4-6',
      max_tokens: 3000,
      system: withLanguage(PERSONALITY, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'ego-killer' });
    if (!parsed.belief_steelmanned) {
      return res.status(500).json({ error: 'Could not generate a response. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('EgoKiller error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.'});
  }
});

module.exports = router;
