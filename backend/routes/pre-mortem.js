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

REAL-WORLD BOUNDARY: assumptions_autopsy, how_to_verify, and the_one_thing may ONLY reference businesses, agencies, people, and facts the user supplied — invented narrative entities (competitors, venues) stay inside the fictional postmortem story and must never appear in actionable steps.

Return ONLY valid JSON.`;

// The plan brief is identical for both halves; only the assignment differs.
function buildBrief(plan, planType, stakes, assumptions) {
  const lines = [
    `You are writing the post-mortem for the following plan. Assume it has already failed.`,
    ``,
    `PLAN:`,
    plan,
  ];

  if (planType) lines.push(`\nPLAN TYPE: ${planType}`);
  if (stakes)   lines.push(`\nWHAT'S AT STAKE: ${stakes}`);
  if (assumptions) lines.push(`\nASSUMPTIONS THE PERSON IS MAKING: ${assumptions}`);

  lines.push(`\nYou are writing ONE HALF of this document. Another analyst is writing the other half — return only your own keys.`);
  return lines.join('\n');
}

// ── Half A: the fictional memo. Invented entities live here and nowhere else ──
function buildMemoPrompt(brief) {
  return `${brief}

YOUR HALF: the post-mortem memo itself — the story of how it failed.

Return a JSON object with this exact shape, and this one top-level key:

{
  "the_postmortem": {
    "memo_header": "A short, dry bureaucratic subject line for the post-mortem memo (e.g. 'RE: Post-Mortem — [Project Name] Shutdown, Q3')",
    "executive_summary": "2–3 sentences. What happened at a high level. Past tense. Specific.",
    "narrative": "The story of how it unfolded. 2–3 short paragraphs. Past tense. Walk through the sequence of events that led to failure. Name real turning points.",
    "warning_signs_ignored": [
      {
        "when": "Early stage / Mid-stage / Late stage",
        "sign": "The specific warning sign that was visible",
        "why_it_was_dismissed": "The rationalization used to ignore it"
      }
    ],
    "the_fatal_assumption": "The single most dangerous assumption that proved false",
    "point_of_no_return": "The moment when failure became inevitable — what decision or event crossed the line"
  }
}

Rules:
- warning_signs_ignored: 2–4 items
- Be specific to THIS plan — do not give generic startup advice
- Keep every field concise (narrative may be 2–3 short paragraphs; everything else one sentence)
- Never place a double-quote (") character inside any JSON string value — a literal " breaks the JSON

Return ONLY the valid JSON object. No markdown, no preamble.`;
}

// ── Half B: the actionable half. Sees the plan, never the invented narrative ──
function buildPreventionPrompt(brief) {
  return `${brief}

YOUR HALF: what actually threatens this plan, and what to do about it before committing.

Return a JSON object with this exact shape, and these four top-level keys:

{
  "failure_modes": [
    {
      "mode": "Short name for this failure mode",
      "probability": "high | medium | low",
      "description": "How this specific failure mode plays out for this plan",
      "trigger": "What event or decision triggers this failure mode",
      "early_warning": "What you would notice early if this failure mode was beginning"
    }
  ],
  "the_most_likely": {
    "failure_mode": "Name of the single most likely way this fails — must be one of the modes you listed above, named identically",
    "the_prevention": "One concrete, specific thing the person can do right now to prevent this"
  },
  "assumptions_autopsy": [
    {
      "assumption": "A specific assumption embedded in the plan",
      "how_to_verify": "A concrete way to test or validate this assumption before committing",
      "risk_if_wrong": "What happens to the plan if this assumption is false"
    }
  ],
  "the_one_thing": "If the person only does one thing before launching, what is it? One sentence. Actionable. Specific."
}

Rules:
- failure_modes: 3–5 items, mix of probability levels
- assumptions_autopsy: 3–5 items (include both stated and unstated assumptions)
- Be specific to THIS plan — do not give generic startup advice
- The_one_thing must be a concrete action, not a platitude
- Every field here is ACTIONABLE and must reference only businesses, agencies, people and facts the user supplied. Invent nothing.
- "probability" must be EXACTLY one of high, medium, low — lowercase English, never translated. The interface colour-codes it and falls back to medium for anything else. Every other string is written in the user's language as normal.
- Keep every field to one concise sentence
- Never place a double-quote (") character inside any JSON string value — a literal " breaks the JSON

Return ONLY the valid JSON object. No markdown, no preamble.`;
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
    // One 5-key schema at max_tokens 4500 measured 100s — the slowest route in
    // the catalog, and far past the ~60s where Safari abandons the fetch. The
    // seam is the document's own: the fictional memo in one call, the
    // actionable half in the other. Disjoint top-level keys, merged back to the
    // original response shape (frontend untouched).
    //
    // It also enforces the REAL-WORLD BOUNDARY structurally rather than by
    // instruction: the prevention half never sees the invented competitors and
    // venues, so it cannot leak them into a step the user is meant to act on.
    const brief = buildBrief(
      plan.trim(),
      planType?.trim() || null,
      stakes?.trim()   || null,
      assumptions?.trim() || null,
    );
    const systemSuffix = withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion);
    const [memoHalf, preventionHalf] = await Promise.all([
      callClaudeWithRetry({
        model: MODELS.SMART,
        max_tokens: 2500,
        system: withLanguage(SYSTEM_PROMPT, userLanguage) + systemSuffix,
        messages: [{ role: 'user', content: buildMemoPrompt(brief) }],
      }, { label: 'pre-mortem:memo' }),
      callClaudeWithRetry({
        model: MODELS.SMART,
        max_tokens: 2500,
        system: withLanguage(SYSTEM_PROMPT, userLanguage) + systemSuffix,
        messages: [{ role: 'user', content: buildPreventionPrompt(brief) }],
      }, { label: 'pre-mortem:prevention' }),
    ]);
    const data = { ...memoHalf, ...preventionHalf };

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
