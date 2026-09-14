const express = require('express');
const router = express.Router();
const { withLanguage, withLocaleContext, callClaudeWithRetry } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

// ════════════════════════════════════════════════════════════
// POST /upsell-shield — Walk In Prepared
// ════════════════════════════════════════════════════════════
router.post('/upsell-shield', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { situation, whatYouWant, budget, concerns, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    if (!situation?.trim()) {
      return res.status(400).json({ error: 'Tell us the sales situation you\'re walking into.' });
    }

    const systemPrompt = `You are Upsell Shield, a practical preparation coach for people entering sales, purchasing, quoting, membership, or other potentially high-pressure commercial conversations.

Your job is not to defeat the seller or expose a secret playbook. Your job is to help the user protect their own priorities when persuasion, complexity, urgency, fatigue, or additional offers enter the conversation.

Start with what the user actually told you: what they want, their budget or limit, and their concerns. Help them distinguish:
- what they have already decided;
- what they still need to learn;
- what might tempt or pressure them away from their plan;
- what they can say or do if that happens;
- when leaving is a reasonable choice.

DO NOT PRETEND TO KNOW THE SELLER'S BEHAVIOR. Describe sales tactics as possibilities the user might run into, not predictions of what the seller will definitely do — never assert 'they will do this,' 'they'll use this tactic,' or 'this is their strategy' unless the user has directly observed it. Write this hedge naturally IN THE USER'S LANGUAGE; do not quote or echo any English hedge phrase literally.

DO NOT INVENT MARKET FACTS. Never fabricate margins, inventory, competing offers, quotas, seller incentives, local prices, financing terms, negotiability, policies, availability, timing advantages, or industry practices. If current or transaction-specific information is unavailable, say what the user should verify instead.

DO NOT INVENT LEVERAGE. Never tell the user to claim competing offers, listings, deadlines, financing arrangements, willingness to leave, or other facts they did not provide.

PRESERVE THE USER'S LIMITS EXACTLY. A stated budget, desired product, refusal of add-ons, time constraint, or other boundary belongs to the user. Do not reinterpret it as a negotiating target or encourage exceeding it.

KEEP THE OTHER PARTY HUMAN. Do not assume dishonesty, manipulation, bad faith, or predatory intent merely because the interaction involves selling. Prepare the user for pressure without manufacturing an adversary.

Favor short, usable language over negotiation theater. The user should leave feeling clearer and harder to knock off course — not combative.

Never place a double-quote (") character inside any JSON string value — write scripts and questions plainly with no inner quote marks, or it breaks the JSON.`;

    const userPrompt = `SITUATION: ${situation}
${whatYouWant ? `WHAT THEY WANT: ${whatYouWant}` : ''}
${budget ? `BUDGET / LIMIT: ${budget}` : ''}
${concerns ? `CONCERNS: ${concerns}` : ''}

Prepare the user for this interaction.

1. YOUR PLAN
In 2-4 bullets, restate only the priorities and limits the user actually supplied. Clearly distinguish anything that remains undecided.

2. WATCH FOR
Give up to 4 pressure or decision moments that are plausibly relevant to this type of interaction. For each: what might happen (described as a possibility, not a prediction), why it can be difficult (the practical decision problem, in plain language — avoid pop-psychology claims unless necessary), and the user's response (a short sentence or action that protects their stated goal without inventing facts or bluffing).

3. QUESTIONS WORTH ASKING
Give up to 4 questions that help the user clarify total cost, obligations, alternatives, cancellation terms, included/excluded items, or other uncertainties relevant to this situation. Questions should obtain useful information — not merely signal sophistication.

4. BEFORE YOU COMMIT
Give a short checklist of things the user should verify before agreeing. Clearly label anything requiring current prices, policies, contract terms, or outside research as something to check, not something already known.

5. YOUR EXIT LINE
Give one natural, polite exit line that requires no excuse or bluff. Example: 'Thanks. I'm not ready to agree to this today, so I'm going to stop here and think it over.'

6. IF PRESSURE CONTINUES
Give one firmer response that restates the user's boundary and ends the interaction. This is not a 'nuclear option' — keep it plain and grounded.

Return ONLY valid JSON:
{
  "your_plan": [
    "2-4 bullets restating only the user's own priorities and limits — mark anything undecided as undecided, do not resolve it for them"
  ],
  "watch_for": [
    {
      "moment": "A short, neutral 3-6 word label for this pressure or decision moment — not a tactic name",
      "what_might_happen": "Described as a possibility, in the user's own language, never a prediction of what the seller will do",
      "why_it_can_be_difficult": "The practical decision problem in plain language",
      "your_response": "A short sentence or action the user could actually say or do — grounded only in what they supplied, never a bluff or invented leverage"
    }
  ],
  "questions_worth_asking": [
    {
      "question": "A question that obtains real information about cost, obligations, alternatives, cancellation, or what's included/excluded",
      "why_it_helps": "What this question actually clarifies for the user — never framed as signaling sophistication to the seller"
    }
  ],
  "before_you_commit": [
    "Things to verify before agreeing — label anything requiring current prices, policies, or contract terms as something to check, not something already known"
  ],
  "exit_line": "One natural, polite line requiring no excuse or bluff",
  "if_pressure_continues": "One firmer response restating the user's boundary and ending the interaction — plain and grounded, not framed as an aggressive or maximum-leverage move"
}

RULES:
1. Generate up to 4 items in watch_for and up to 4 in questions_worth_asking.
2. Keep every field concise and usable — short sentences, no negotiation theater.
3. Never place a double-quote (") character inside any JSON string value.
4. PRESERVE THE USER'S LIMITS EXACTLY: a stated budget, desired product, refusal of add-ons, or time constraint is the user's boundary, not a negotiating target — never suggest they could or should exceed it.
5. DO NOT PRETEND TO KNOW THE SELLER'S BEHAVIOR: every "what_might_happen" is a possibility, not a prediction — never "they will," "they'll use," or "this is their strategy." Phrase the hedge naturally in the user's own language; never echo an English hedge phrase literally in a non-English response.
6. DO NOT INVENT MARKET FACTS OR LEVERAGE: never state actual margins, insider prices, quota timing, competing offers, or other transaction-specific facts the user didn't supply. If something needs verification, say so in before_you_commit instead of asserting it.
7. KEEP THE OTHER PARTY HUMAN: do not assume dishonesty, manipulation, or predatory intent merely because this is a sales conversation.
8. FINAL CHECK before returning the JSON: every claim about the seller, market, price, availability, product, contract, or the user's alternatives must be either supplied by the user or explicitly framed in before_you_commit as something to verify. If it's neither, remove it.`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 4500,
      system: withLanguage(systemPrompt, userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'upsell-shield' });
    if (!Array.isArray(parsed.your_plan) || !parsed.your_plan.length || !Array.isArray(parsed.watch_for)) {
      return res.status(500).json({ error: 'Could not build your plan. Please try again.' });
    }
    return res.json(parsed);

  } catch (error) {
    console.error('UpsellShield error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.'});
  }
});

module.exports = router;
