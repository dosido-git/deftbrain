const express = require('express');
const router = express.Router();
const { withLanguage, withLocaleContext, callClaudeWithRetry } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

const PERSONALITY = `Systems explainer. Large organisations have appeal processes, exceptions, regulators and escalation paths that are real, documented, and almost never mentioned in the first answer someone receives. Your job is to show a person where those paths are.

The framing matters. This is not about beating the system or outsmarting anyone — it is about navigating a system that was never designed to explain itself. The reader is not fighting an enemy; they are dealing with an organisation whose front line is not authorised to say yes, and whose actual decision-makers they have not reached yet. Nobody at the other end is a villain, and treating them as one is both unkind and, practically, the thing most likely to fail.

Every system has a path to resolution — find it. Be specific about who is actually authorised to decide, what the documented exceptions are, and exactly what to ask. Honest about realistic odds. Always lawful, always straightforward: nothing here should depend on misleading anyone.

Keep every field to ONE short sentence (roughly 25 words max) — be punchy, not exhaustive. Provide AT MOST 4 ladder rungs (2 magic_words each), AT MOST 2 loopholes, 3 magic_phrases, and 2 nuclear_options. win_likelihood MUST stay one of the exact English keys high|medium|low|very_low regardless of the response language (it is a code value the UI switches on). Never place a double-quote (") character inside any JSON string value — write magic_words and phrases without wrapping them in quote marks; a literal " breaks the JSON.`;

router.post('/rulebook-breaker', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { system, problem, whatTried, goal, officialAnswer, userLanguage } = req.body;
  if (!system?.trim() || !problem?.trim()) {
    return res.status(400).json({ error: 'Describe the system and the problem.' });
  }

    const userPrompt = `RULEBOOK BREAKER — FIND THE CHEAT CODES

THE SYSTEM: "${system.trim()}"
THE PROBLEM: "${problem.trim()}"
${whatTried?.trim() ? `WHAT THEY'VE ALREADY TRIED: ${whatTried.trim()}` : ''}
${goal?.trim() ? `WHAT THEY WANT TO ACHIEVE: ${goal.trim()}` : ''}
${officialAnswer?.trim() ? `THE OFFICIAL ANSWER THEY WERE GIVEN: ${officialAnswer.trim()}\nThis is the decision every path has to answer. Say which process reviews a decision like this one, who is authorised to revisit it, and what would have to be true for it to change.` : ''}

Map how this system really decides. Find the paths that exist but were not offered. Name the words that get a request routed to someone who can act on it.

NAMED ORGS: laws, agencies, and org names change — use current names only if certain (note: Kaiser Health News is now KFF Health News) and describe processes generically when unsure rather than citing a specific filing route incorrectly.

Return ONLY valid JSON:
{
  "system_analysis": {
    "how_it_actually_works": "How this system actually functions informally vs. what they claim — the real decision architecture",
    "where_the_power_is": "Who actually has discretion to make exceptions in this system — not the front line",
    "their_pressure_points": "What this organisation actually responds to — regulatory obligations, documented policy, reputational duty of care. What makes a request get taken seriously, not what makes them afraid."
  },

  "the_ladder": [
    {
      "rung": 1,
      "title": "Short title for this escalation step",
      "action": "Specific action to take — who to contact, how, what to say",
      "the_mechanism": "Why this step reaches someone with different authority, or triggers a documented process the front line cannot",
      "magic_words": ["Phrase 1 that triggers different handling", "Phrase 2 that signals you know your rights"],
      "expected_outcome": "What typically happens at this step",
      "time_to_try": "How long to wait before moving to the next rung"
    }
  ],

  "the_loopholes": [
    {
      "loophole": "The documented exception, alternative path, or option that exists but is not offered up front",
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
    "what_they_fear": "Why this regulator carries weight — the obligation the organisation has to answer to it. Stated as what they must do, not what frightens them."
  },

  "the_nuclear_options": [
    {
      "option": "The strongest lawful step remaining at this stage, and what it realistically achieves",
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
