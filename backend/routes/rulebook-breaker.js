const express = require('express');
const router = express.Router();
const { withLanguage, withLocaleContext, callClaudeWithRetry } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

const PERSONALITY = `Systems navigator. Find the legitimate escalation paths, overlooked policies, and pressure points that let people win against bureaucratic systems.

Every system has a path to resolution — find it. Be specific about who has the power, what leverage exists, and exactly what to say. Honest about realistic odds. Never illegal, always clever.

Keep every field to ONE short sentence (roughly 25 words max) — be punchy, not exhaustive. Provide AT MOST 4 ladder rungs (2 magic_words each), AT MOST 2 loopholes, 3 magic_phrases, and 2 nuclear_options. win_likelihood MUST stay one of the exact English keys high|medium|low|very_low regardless of the response language (it is a code value the UI switches on). Never place a double-quote (") character inside any JSON string value — write magic_words and phrases without wrapping them in quote marks; a literal " breaks the JSON.`;

router.post('/rulebook-breaker', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { system, problem, whatTried, goal, userLanguage } = req.body;
  if (!system?.trim() || !problem?.trim()) {
    return res.status(400).json({ error: 'Describe the system and the problem.' });
  }

    const userPrompt = `RULEBOOK BREAKER — FIND THE CHEAT CODES

THE SYSTEM: "${system.trim()}"
THE PROBLEM: "${problem.trim()}"
${whatTried?.trim() ? `WHAT THEY'VE ALREADY TRIED: ${whatTried.trim()}` : ''}
${goal?.trim() ? `WHAT THEY WANT TO ACHIEVE: ${goal.trim()}` : ''}

Map the leverage. Find the undocumented paths. Name the magic words.

NAMED ORGS: laws, agencies, and org names change — use current names only if certain (note: Kaiser Health News is now KFF Health News) and describe processes generically when unsure rather than citing a specific filing route incorrectly.

Return ONLY valid JSON:
{
  "system_analysis": {
    "how_it_actually_works": "How this system actually functions informally vs. what they claim — the real decision architecture",
    "where_the_power_is": "Who actually has discretion to make exceptions in this system — not the front line",
    "their_pressure_points": "What this organization is sensitive to — regulatory risk, reputation, legal liability, etc."
  },

  "the_ladder": [
    {
      "rung": 1,
      "title": "Short title for this escalation step",
      "action": "Specific action to take — who to contact, how, what to say",
      "the_mechanism": "Why this specific step creates pressure or unlocks a different response",
      "magic_words": ["Phrase 1 that triggers different handling", "Phrase 2 that signals you know your rights"],
      "expected_outcome": "What typically happens at this step",
      "time_to_try": "How long to wait before moving to the next rung"
    }
  ],

  "the_loopholes": [
    {
      "loophole": "The exception, alternative path, or undocumented option",
      "how_to_invoke_it": "Specifically how to trigger this exception",
      "why_it_exists": "Why this exception exists in the system — makes it more believable and easier to invoke"
    }
  ],

  "magic_phrases": [
    {
      "phrase": "The exact words or sentence",
      "when_to_use": "The specific moment or context",
      "why_it_works": "The mechanism — what this phrase triggers in the system"
    }
  ],

  "the_regulatory_angle": {
    "relevant_bodies": "The regulatory agencies, consumer protection offices, or oversight bodies that have jurisdiction",
    "filing_a_complaint": "How to file and why it matters even if nothing happens immediately — the signal it sends",
    "what_they_fear": "The specific regulatory or legal risk that makes a complaint credible leverage"
  },

  "the_nuclear_options": [
    {
      "option": "The maximum legal pressure available at this stage",
      "how_to_execute": "Specific steps to execute it",
      "when_to_use_it": "The condition that makes this appropriate rather than premature",
      "real_likelihood": "Honest assessment of whether this will work"
    }
  ],

  "honest_assessment": {
    "win_likelihood": "high | medium | low | very_low",
    "the_realistic_outcome": "What they can realistically expect if they execute this well",
    "when_to_cut_losses": "The signal that tells them this battle isn't worth more time — and what to do instead"
  },

  "the_first_move": "The single most important action to take in the next 24 hours — specific and actionable"
}`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 6000,
      system: withLanguage(PERSONALITY, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'rulebook-breaker' });
    if (!Array.isArray(parsed.the_ladder) || !parsed.the_ladder.length) {
      return res.status(500).json({ error: 'Could not build your strategy. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('RulebookBreaker error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.'});
  }
});

module.exports = router;
