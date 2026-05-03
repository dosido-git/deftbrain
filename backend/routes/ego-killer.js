const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');
const { rateLimit } = require('../lib/rateLimiter');

const PERSONALITY = `You are a rigorous intellectual sparring partner. Your job is to steelman, then demolish, then rebuild.

You don't attack positions with strawman arguments or cheap shots. You find the strongest, most devastating version of the counter-argument — the one that the belief's most sophisticated defender would be most afraid of. Then, after demolition, you rebuild what survives into a stronger, more defensible position.

THE METHOD:
1. First, steelman the belief — state it in its strongest possible form before attacking
2. Then attack it with the most charitable, most powerful counter-argument available
3. After demolition, identify what genuinely survives the attack
4. Rebuild: a more precise, more defensible version that incorporates what was learned

RULES:
- No strawman attacks. Make the counter-argument HARDER to dismiss, not easier.
- Credit the belief where it has genuine merit — intellectual honesty cuts both ways
- The rebuild should be something the person can actually hold and defend
- If the belief is mostly sound, say so — but find the genuine weakness anyway
- Don't moralize. Don't hedge. Take positions.`;

router.post('/ego-killer', rateLimit(), async (req, res) => {
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
  "belief_steelmanned": "The belief restated in its strongest, most sophisticated form — the version its most intelligent defender would be proud of",

  "the_demolition": {
    "the_core_attack": "The single most devastating counter-argument — the one that's hardest to dismiss. Not a list of objections. The one that cuts deepest.",
    "why_its_devastating": "Why this specific argument is so damaging to this specific belief — the mechanism",
    "the_evidence": "The strongest empirical or logical evidence for the counter-position",
    "historical_counterexamples": [
      {
        "example": "A specific historical or documented case where this belief failed",
        "what_it_shows": "What this case specifically reveals about the belief's limits"
      }
    ],
    "the_hidden_assumption": "The unstated assumption the belief depends on — the load-bearing wall that, when removed, collapses the structure"
  },

  "what_survives": {
    "the_kernel": "The part of the belief that genuinely withstands the attack — be specific and honest",
    "under_what_conditions": "The conditions under which this belief is actually true or useful",
    "what_it_explains_well": "What the belief genuinely explains or predicts correctly"
  },

  "the_rebuild": {
    "the_stronger_version": "A more precise, more defensible version of the belief that incorporates what was learned from the demolition",
    "the_key_qualification": "The crucial qualifier that makes the rebuilt version actually hold",
    "now_unshakeable_because": "Why this rebuilt version is harder to attack than the original"
  },

  "the_verdict": {
    "outcome": "demolished | refined | vindicated | complicated",
    "outcome_label": "DEMOLISHED | REFINED | VINDICATED | IT'S COMPLICATED",
    "one_line": "One sentence verdict on where the belief stands after this"
  }
}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2500,
      system: withLanguage(PERSONALITY, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = message.content.find(b => b.type === 'text')?.text || '';
    const cleaned = cleanJsonResponse(text);
    const parsed = JSON.parse(cleaned);
    res.json(parsed);

  } catch (error) {
    console.error('EgoKiller error:', error);
    res.status(500).json({ error: error.message || 'Failed to demolish the belief' });
  }
});

module.exports = router;
