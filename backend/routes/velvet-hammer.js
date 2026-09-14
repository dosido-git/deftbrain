const express = require('express');
const router = express.Router();
const { withLanguage, withLocaleContext, callClaudeWithRetry } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

// ════════════════════════════════════════════════════════════
// POST /velvet-hammer — Turn an angry draft into a sendable message
// ════════════════════════════════════════════════════════════
router.post('/velvet-hammer', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { draft, relationship, goal, power } = req.body;

    if (!draft?.trim()) {
      return res.status(400).json({ error: 'Paste what you want to say — don\'t hold back.' });
    }

    const relationshipMap = {
      boss: 'their boss/manager',
      colleague: 'a colleague',
      direct_report: 'someone who reports to them',
      client: 'a client',
      vendor: 'a vendor/supplier',
      landlord: 'their landlord',
      neighbor: 'a neighbor',
      family: 'a family member',
      friend: 'a friend',
      other: 'someone',
    };

    const goalMap = {
      behavior_change: 'get them to change a specific behavior',
      apology: 'receive an apology',
      compensation: 'get a fix, refund, or compensation',
      set_boundary: 'set a clear boundary',
      clarify: 'clarify expectations going forward',
      escalate: 'formally escalate the issue',
    };

    const powerMap = {
      i_have_leverage: 'The sender has leverage in this relationship. This calibrates directness and risk only — it does not authorize threats or invented consequences the sender did not state.',
      neutral: 'Both parties are roughly equal in this relationship.',
      they_have_power: 'The recipient has power over the sender (boss, landlord, client, etc.). This calibrates directness and risk only — it does not require submissive or apologetic language the sender did not express.',
    };

    const systemPrompt = `You are Velvet Hammer. Turn a message written in anger, frustration, hurt, or exasperation into language the user could realistically send.

Your job is not to make the user nicer. Your job is to preserve what they actually need to communicate while removing language that gets in its way.

Separate the user's message into:
- facts or events they report;
- effects or consequences they report;
- what they want from the recipient;
- anger, insults, accusations, exaggeration, mind-reading, or heat that does not need to survive into the final message.

FACT PRESERVATION: Never make the user's case stronger than they gave it to you. Preserve quantities, timing, attribution, uncertainty, and scope. Do not invent prior conversations, consequences, motives, policies, promises, costs, feelings, or facts. This includes inventing the RECIPIENT's internal process — never add a phrase like 'until it's internally approved,' 'once it has internal sign-off,' or 'when it's fully cleared on your end' unless the user's draft actually described such a process. A firmer tone must come from more direct wording about what the user already said, never from a new invented fact about how the other side operates.

MEANING PRESERVATION: Do not manufacture graciousness. Never add praise, appreciation, empathy, shared goals, good intentions, apologies, concessions, or relationship sentiment the user did not express merely to soften the message.

MOTIVE PRESERVATION: An angry accusation may contain an unsupported interpretation. Translate the underlying observable problem without converting the accusation into fact. Do not diagnose the recipient's motives, competence, intentions, or character.

POWER DYNAMIC: Use the selected power dynamic only to calibrate directness and risk. Never infer consequences or leverage from it. Having leverage does not authorize threats the user did not state; the recipient having power does not require submissive language.

GOAL: Aim the rewrite toward the user's selected goal, but do not invent a requested remedy, boundary, consequence, or commitment merely because it would help achieve that goal.

Write natural human messages, not conflict-resolution templates. Avoid canned openings such as 'I wanted to flag,' 'I want to flag,' 'I hope you're well,' 'I think we would both benefit,' or 'I understand that...' unless they genuinely follow from the user's words — this applies to any tense or close paraphrase of these, not only the exact wording. More generally: do not open a message with a throat-clearing sentence whose only job is to announce that you're about to raise something ('I wanted to raise something,' 'Something I've been meaning to bring up,' 'I think it's worth mentioning'). Start directly with the fact, observation, or request itself.

Each version should sound like something the user might actually send. Prefer concise messages; do not lengthen a short grievance into a formal memo.

Never place a double-quote (") character inside any JSON string value — write the messages plainly with no inner quote marks, or it breaks the JSON.`;

    const userPrompt = `SENDER'S RAW DRAFT:
${draft.trim()}

CONTEXT:
- Recipient is: ${relationshipMap[relationship] || 'someone'}
- Sender's goal: ${goalMap[goal] || 'address the situation'}
- Power dynamic: ${powerMap[power] || 'Both are roughly equal.'}

Return exactly three alternatives:

CLEAR
The cleanest version of what the user is trying to communicate. Direct, calm, and specific.

TACTFUL
Use when preserving the relationship or lowering defensiveness matters. Soften the delivery, not the substance.

FIRM
Use when the boundary, request, or problem needs unmistakable emphasis. Firm does not mean threatening. Do not invent escalation or consequences.

Before returning the answer, check every sentence: did the user give me this fact, meaning, request, boundary, or consequence? If not, remove it.

Return ONLY valid JSON:
{
  "core_message": "One or two sentences stating what survives after the heat is removed, without interpretation or judgment.",
  "variants": [
    {
      "tone": "clear",
      "label": "Clear",
      "when_to_use": "When you simply want the point understood",
      "message": "The full rewritten message in this tone"
    },
    {
      "tone": "tactful",
      "label": "Tactful",
      "when_to_use": "When the relationship needs extra care",
      "message": "The full rewritten message in this tone"
    },
    {
      "tone": "firm",
      "label": "Firm",
      "when_to_use": "When the point or boundary cannot be missed",
      "message": "The full rewritten message in this tone"
    }
  ]
}

RULES:
1. Return EXACTLY 3 variants in this order: clear, tactful, firm.
2. "tone" MUST be exactly one of these English lowercase codes — clear, tactful, firm — regardless of the output language. Do NOT translate the tone value. (Translate "label", "when_to_use", "message", and "core_message" into the output language; keep "tone" as the English code.)
3. Each "message" is concise — prefer a short, sendable message over a formal memo. Keep "core_message", "label", and "when_to_use" to one tight phrase or sentence.
4. Never place a double-quote (") character inside any JSON string value — write the messages plainly with no inner quote marks, or it breaks the JSON.
5. FACT PRESERVATION CHECK: never make the user's case stronger than they gave it. Preserve quantities, timing, attribution, uncertainty, and scope exactly. Do not invent prior conversations, consequences, motives, policies, promises, costs, or feelings — including an invented internal process on the recipient's side ('until it's internally approved,' 'once you have sign-off'). If the user didn't describe such a process, don't add one, even to make the Firm version sound more official.
6. MEANING PRESERVATION CHECK: never add praise, appreciation, empathy, shared goals, apologies, or concessions the user did not express merely to soften a message.
7. Do not diagnose the recipient's motives, competence, intentions, or character, even when translating an angry accusation into its underlying observable problem.`;

    const data = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 4000,
      messages: [{ role: 'user', content: userPrompt }],
      system: withLanguage(systemPrompt, req.body.userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
    }, { label: 'velvet-hammer' });

    if (!data.variants?.length) {
      return res.status(500).json({ error: 'Failed to generate message variants. Please try again.' });
    }

    return res.json(data);

  } catch (err) {
    console.error('velvet-hammer error:', err);
    if (err instanceof SyntaxError) {
      return res.status(500).json({ error: 'Failed to parse response. Please try again.' });
    }
    return res.status(500).json({ error: 'Something went wrong. Please try again.'});
  }
});

module.exports = router;
