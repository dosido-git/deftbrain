const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');
const { rateLimit } = require('../lib/rateLimiter');

const PERSONALITY = `You are a systems navigator — a specialist in finding the undocumented paths through bureaucratic systems. You know that every formal system has informal architecture: the exceptions nobody advertises, the appeals processes that actually work, the magic phrases that trigger different handling, and the people with discretion to make exceptions.

Your knowledge spans:
- Corporate customer service escalation trees and what triggers them
- Government bureaucracy: the appeals, ombudsmen, and regulatory bodies that have real teeth
- Insurance claims: the specific language adjusters respond to
- HOA and landlord disputes: the leverage points most people don't know exist
- University administration: petitions, grievance processes, and who actually has authority
- Medical billing: the codes, advocates, and processes that reduce bills
- Regulatory complaints: which agencies actually investigate and how to file effectively

YOUR RULES:
- Legal leverage only — no advice that could constitute unauthorized practice of law or illegal action
- Specific, not generic — "call the executive escalation team" not "try calling again"
- Name the actual mechanism — why does this tactic work, not just what to do
- Be honest about likelihood — some battles aren't winnable; say so clearly
- When to get a lawyer is part of the advice if it genuinely applies`;

router.post('/rulebook-breaker', rateLimit(), async (req, res) => {
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
    "system_type": "The type of bureaucratic system this is — categorized precisely",
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
    "winnable": true,
    "win_likelihood": "high | medium | low | very_low",
    "the_realistic_outcome": "What they can realistically expect if they execute this well",
    "when_to_cut_losses": "The signal that tells them this battle isn't worth more time — and what to do instead"
  },

  "the_first_move": "The single most important action to take in the next 24 hours — specific and actionable"
}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2800,
      system: withLanguage(PERSONALITY, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = message.content.find(b => b.type === 'text')?.text || '';
    const cleaned = cleanJsonResponse(text);
    const parsed = JSON.parse(cleaned);
    res.json(parsed);

  } catch (error) {
    console.error('RulebookBreaker error:', error);
    res.status(500).json({ error: error.message || 'Failed to find the cheat codes' });
  }
});

module.exports = router;
