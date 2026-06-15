const express = require('express');
const router = express.Router();
const { withLanguage, withLocaleContext, callClaudeWithRetry } = require('../lib/claude');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

const PERSONALITY = `Systems navigator. Find the legitimate escalation paths, overlooked policies, and pressure points that let people win against bureaucratic systems.

Every system has a path to resolution — find it. Be specific about who has the power, what leverage exists, and exactly what to say. Honest about realistic odds. Never illegal, always clever.`;

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

Return ONLY valid JSON:
{
  "system_analysis": {
    "how_it_actually_works": "How this system actually functions informally vs. what they claim — the real decision architecture — one sentence",
    "where_the_power_is": "Who actually has discretion to make exceptions in this system — not the front line — one sentence",
    "their_pressure_points": "What this organization is sensitive to — regulatory risk, reputation, legal liability, etc. (number)"
  },

  "the_ladder": [
    {
      "rung": 1,
      "title": "Short title for this escalation step — 3-6 words",
      "action": "Specific action to take — who to contact, how, what to say — one sentence",
      "the_mechanism": "Why this specific step creates pressure or unlocks a different response — one sentence",
      "magic_words": ["Phrase 1 that triggers different handling", "Phrase 2 that signals you know your rights"],
      "expected_outcome": "What typically happens at this step — one sentence",
      "time_to_try": "How long to wait before moving to the next rung — one sentence"
    }
  ],

  "the_loopholes": [
    {
      "loophole": "The exception, alternative path, or undocumented option — one sentence",
      "how_to_invoke_it": "Specifically how to trigger this exception — one sentence",
      "why_it_exists": "Why this exception exists in the system — makes it more believable and easier to invoke — one sentence"
    }
  ],

  "magic_phrases": [
    {
      "phrase": "The exact words or sentence — one sentence",
      "when_to_use": "The specific moment or context — one sentence",
      "why_it_works": "The mechanism — what this phrase triggers in the system — one sentence"
    }
  ],

  "the_regulatory_angle": {
    "relevant_bodies": "The regulatory agencies, consumer protection offices, or oversight bodies that have jurisdiction — one sentence",
    "filing_a_complaint": "How to file and why it matters even if nothing happens immediately — the signal it sends — one sentence",
    "what_they_fear": "The specific regulatory or legal risk that makes a complaint credible leverage — one sentence"
  },

  "the_nuclear_options": [
    {
      "option": "The maximum legal pressure available at this stage — one sentence",
      "how_to_execute": "Specific steps to execute it — one sentence",
      "when_to_use_it": "The condition that makes this appropriate rather than premature — one sentence",
      "real_likelihood": "Honest assessment of whether this will work — one sentence"
    }
  ],

  "honest_assessment": {
    "win_likelihood": "high | medium | low | very_low",
    "the_realistic_outcome": "What they can realistically expect if they execute this well — one sentence",
    "when_to_cut_losses": "The signal that tells them this battle isn't worth more time — and what to do instead — one sentence"
  },

  "the_first_move": "The single most important action to take in the next 24 hours — specific and actionable — one sentence"
}`;

    const parsed = await callClaudeWithRetry({
model: 'claude-sonnet-4-6',
      max_tokens: 2800,
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
