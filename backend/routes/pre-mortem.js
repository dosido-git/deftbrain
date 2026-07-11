// backend/routes/pre-mortem.js
// POST /api/pre-mortem
//
// Accepts a plan description and optional context, returns a fictional
// post-mortem written as if the plan already failed — surfacing hidden
// failure modes, warning signs, and the single most critical prevention.

const express = require('express');
const { withLanguage, withLocaleContext, callClaudeWithRetry } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

const router = express.Router();

// ── Prompt ────────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a ruthless pre-mortem analyst. Your job is to write a fictional post-mortem document as if a plan has already failed spectacularly. You do not hedge. You do not say "it might work." You assume failure already happened and you are now explaining why.

Your tone is clear-eyed, clinical, and specific. Not cynical for its own sake — genuinely useful. Your goal is to help the person avoid failure by making them feel the failure concretely before they commit.

You must respond with valid JSON only. No markdown. No explanation outside the JSON object.

Return ONLY valid JSON.`;

function buildUserPrompt(plan, planType, stakes, assumptions) {
  const lines = [
    `You are writing the post-mortem for the following plan. Assume it has already failed.`,
    ``,
    `PLAN:`,
    plan,
  ];

  if (planType) lines.push(`\nPLAN TYPE: ${planType}`);
  if (stakes)   lines.push(`\nWHAT'S AT STAKE: ${stakes}`);
  if (assumptions) lines.push(`\nASSUMPTIONS THE PERSON IS MAKING: ${assumptions}`);

  lines.push(`
Return a JSON object with this exact shape:

{
  "the_postmortem": {
    "memo_header": "A short, dry bureaucratic subject line for the post-mortem memo (e.g. 'RE: Post-Mortem — [Project Name] Shutdown, Q3') — one sentence",
    "executive_summary": "2–3 sentences. What happened at a high level. Past tense. Specific. — 1-2 sentences",
    "narrative": "The story of how it unfolded. 3–5 paragraphs. Past tense. Walk through the sequence of events that led to failure. Name real turning points. — 1-2 sentences",
    "warning_signs_ignored": [
      {
        "when": "Early stage / Mid-stage / Late stage — one sentence",
        "sign": "The specific warning sign that was visible — one sentence",
        "why_it_was_dismissed": "The rationalization used to ignore it — one sentence"
      }
    ],
    "the_fatal_assumption": "The single most dangerous assumption that proved false — one sentence",
    "point_of_no_return": "The moment when failure became inevitable — what decision or event crossed the line — one sentence"
  },
  "failure_modes": [
    {
      "mode": "Short name for this failure mode — 2-4 words",
      "probability": "high | medium | low",
      "description": "How this specific failure mode plays out for this plan — 1-2 sentences",
      "trigger": "What event or decision triggers this failure mode — one sentence",
      "early_warning": "What you would notice early if this failure mode was beginning — one sentence"
    }
  ],
  "the_most_likely": {
    "failure_mode": "Name of the single most likely way this fails — 2-4 words",
    "the_prevention": "One concrete, specific thing the person can do right now to prevent this — one sentence"
  },
  "assumptions_autopsy": [
    {
      "assumption": "A specific assumption embedded in the plan — one sentence",
      "how_to_verify": "A concrete way to test or validate this assumption before committing — one sentence",
      "risk_if_wrong": "What happens to the plan if this assumption is false — one sentence"
    }
  ],
  "the_one_thing": "If the person only does one thing before launching, what is it? One sentence. Actionable. Specific."
}

Rules:
- failure_modes: 3–5 items, mix of probability levels
- warning_signs_ignored: 2–4 items
- assumptions_autopsy: 3–5 items (include both stated and unstated assumptions)
- Be specific to THIS plan — do not give generic startup advice
- The_one_thing must be a concrete action, not a platitude`);

  return lines.join('\n');
}

// ── Route ─────────────────────────────────────────────────────────────────────

router.post('/pre-mortem', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  const { plan, planType, stakes, assumptions, userLanguage } = req.body;

  // Validate required field
  if (!plan || !plan.trim()) {
    return res.status(400).json({ error: 'plan is required.' });
  }

  if (plan.trim().length > 2000) {
    return res.status(400).json({ error: 'plan must be 2000 characters or fewer.' });
  }

  try {
    const data = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 3000,
      system: withLanguage(SYSTEM_PROMPT, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
      messages: [
        {
          role: 'user',
          content: buildUserPrompt(
            plan.trim(),
            planType?.trim() || null,
            stakes?.trim()   || null,
            assumptions?.trim() || null,
          ),
        },
      ],
    }, { label: 'pre-mortem' });

    if (!data.failure_modes || !Array.isArray(data.failure_modes)) {
      return res.status(500).json({ error: 'Could not generate pre-mortem. Please try again.' });
    }
    return res.json(data);

  } catch (err) {
    console.error('pre-mortem error:', err);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
