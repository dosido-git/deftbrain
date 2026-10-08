const express = require('express');
const router = express.Router();
const { withLanguage, withLocaleContext, callClaudeWithRetry } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');
const { runOutputGuard } = require('../lib/outputGuard');

// Reviewed under the v2 output standard 2026-10-08 (quality wave second
// sample: core_message said "three emails went unanswered" when the draft
// showed one was answered, and called the user "the sender"). The prompt
// already carried the v2 rules; the guard is the check behind them.
router.outputStandard = 'v2';
router.outputGuard = {
  prohibit: [
    'a count, date, amount or event changed from the draft (three unanswered when the draft shows one answered)',
    'a consequence, deadline, escalation or threat the user did not state',
    'praise, apology, concession or warmth the user did not express',
    'a motive, intention or character judgment about the recipient',
    'a boundary or request wider than the one in the draft',
    'the user described in the third person (the sender, the user, the visitor)',
  ],
  require: ['three sendable messages in the user\'s own voice, same facts and scope as the draft'],
};

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

BOUNDARY PRESERVATION: A stated problem or desired change may be translated into a clear request or boundary, but do not broaden it. 'Stop expecting instant replies to 10 p.m. messages' may become 'I won't respond immediately to late-night messages'; it must not become 'I'm unavailable after hours' unless the user said that. Tone changes how the same boundary is expressed, not its scope.

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
  "session_label": "A short, neutral, recognizable 3-7 word description of the issue — safe to show in a session list later. Never reproduce insults, profanity, accusations, sensitive details, or emotionally charged wording from the draft. Describe the subject, not the user's anger. Example: 'late-night Slack messages'.",
  "core_message": "One or two sentences, addressed to the user as you, stating what survives after the heat is removed, without interpretation or judgment. Never call the user the sender. Every count and date must match the draft exactly: if the draft shows some emails were answered, do not say they all went unanswered.",
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
7. Do not diagnose the recipient's motives, competence, intentions, or character, even when translating an angry accusation into its underlying observable problem.
8. BOUNDARY PRESERVATION CHECK: when a version states a request or boundary, it must be the SAME SCOPE as what the user described — a specific time, channel, or behavior stays specific; do not widen it into a general or absolute version (e.g. a complaint about late-night messages must not become a claim of being unavailable after hours generally, unless the user said that). Tone may change the wording, never the scope.
9. RECENT SESSION LABEL: session_label must be a short, neutral, recognizable description of the issue — not a summary of the message, not a paraphrase of the anger. Do not reproduce insults, profanity, accusations, sensitive details, or emotionally charged wording from the user's draft. Describe the subject (what the disagreement is about), not the user's anger.`;

    const data = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 4000,
      messages: [{ role: 'user', content: userPrompt }],
      system: withLanguage(systemPrompt, req.body.userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
    }, { label: 'velvet-hammer' });

    if (!data.variants?.length) {
      return res.status(500).json({ error: 'Failed to generate message variants. Please try again.' });
    }

    await runOutputGuard(data, {
      label: 'velvet-hammer',
      fields: [['core_message', data.core_message], ...data.variants.map((v, i) => [`variants[${i}].message`, v?.message])]
        .filter(([, v]) => typeof v === 'string' && v.trim()),
      supplied: `THE USER'S OWN DRAFT (every fact, count, date and amount must match this):\n${draft.trim()}\n\nRecipient: ${relationshipMap[relationship] || 'someone'}. Goal: ${goalMap[goal] || 'address the situation'}. Power: ${powerMap[power] || 'roughly equal'}.`,
      promise: 'The same message with the heat removed, in three tones, keeping every fact, amount and scope exactly as the user gave it.',
      guard: router.outputGuard,
      requiredNonEmpty: ['variants[0].message', 'variants[1].message', 'variants[2].message'],
      userLanguage: req.body.userLanguage,
      locale: withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
    });

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
