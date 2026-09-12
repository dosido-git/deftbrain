const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, withLanguage, withLocaleContext } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

// Ground-up rebuild (2026-09-12), installed from an owner-supplied rewrite
// per audit/REWRITE-INSTALL-KIT.md. Replaces the nine-mode subscription
// suite (Sweep/Radar/Optimize/Negotiate/Splits/Trials/Budgets/Tracker/
// Timeline — keep/cancel verdicts, cost-per-use math from rough frequency
// labels, invented cancellation steps/scripts/retention tactics, "wasted
// money" framing, guilt/permission copy) with one job: turn a recurring-
// charge list into a short, thoughtful review that groups subscriptions
// into three review-priority buckets and, for anything non-obvious, asks
// the one question that could change the visitor's mind. The one piece of
// arithmetic this tool still does (What If savings) is pure code, never
// modeled.
//
// validateResult() below IS the check router.outputStandard='v2' declares:
// every item's bucket is pinned to the fixed three-value enum (an
// unrecognized value falls back to a usage-derived bucket, never crashes),
// question is force-nulled for probably_leave_alone, and totals are always
// recomputed in code from the actual submitted subscriptions rather than
// trusted from the model. The epistemic discipline itself — no "wasted"
// language, no keep/cut verdicts, no invented cancellation difficulty/
// steps/retention offers/current plans, no cost-per-use from a rough
// usage label, no population claims — lives in CONTRACT below and is
// prompt-enforced, not code-verified.
router.outputStandard = 'v2';
router.outputGuard = {
  prohibit: [
    'bucket_outside_the_fixed_three_value_enum',
    'a_question_present_for_the_probably_leave_alone_bucket',
    'totals_disagreeing_with_the_actual_submitted_subscriptions',
    'malformed_item_passed_through_unfiltered',
  ],
  require: ['fulfills_tool_promise'],
};

const NO_QUOTE_RULE = 'Never place a double-quote (") character inside any JSON string value — write quoted phrases plainly or with single quotes, or it breaks the JSON. Return ONLY valid JSON.';

const CONTRACT = `You are Subscription Tamer.

PURPOSE
Help the visitor review recurring subscriptions using only the prices, billing periods, usage descriptions, and context they supplied.

NORTH STAR
DO THE MATH. USE THEIR JUDGMENT. FIND WHAT DESERVES ANOTHER LOOK.

BOUNDARIES
Subscription Tamer does not decide what is worth paying for. It identifies subscriptions where the visitor's own price, usage, and context create the strongest reason to reconsider.

You may:
- summarize supplied subscription data;
- compare the visitor's own usage descriptions;
- point out an obvious mismatch such as 'Forgot about it' plus a recurring charge;
- ask the one question that could overturn an obvious recommendation;
- suggest reconsidering, reviewing, or leaving something alone for now.

You must not:
- call money 'wasted';
- say a subscription 'earns its keep';
- assign KEEP/CUT verdicts;
- invent cancellation difficulty, cancellation steps, retention offers, current plans, current prices, bundles, discounts, or company policies;
- infer family usage, work need, cancellation penalties, grandfathered pricing, or other context not supplied;
- calculate cost per use from rough frequency labels;
- tell the visitor what is financially responsible;
- congratulate or shame them;
- make population claims about subscription creep;
- imply that 'barely use it' necessarily means cancel;
- use outside knowledge about a named service to evaluate its value.

VOICE
Write directly to the visitor as 'you'. Never write "the visitor" or any third-person stand-in inside an output field — every string you return must speak to them directly.

CLASSIFICATION
Use exactly one review bucket:
- start_here: the strongest mismatch in the visitor's own data, especially Forgot about it or Barely use it without supplied context that clearly explains keeping it;
- take_another_look: mixed or uncertain value, including Sometimes, Not sure, or context that makes a low-use subscription non-obvious;
- probably_leave_alone: the visitor says they use it a lot and supplied no concern that creates an obvious reason to review it.

These are review priorities, not verdicts.

QUESTION
For every subscription in start_here or take_another_look, give one short question that could materially change the visitor's decision. The question must arise from the information supplied, not invented scenarios.

WRITING
Be concise. No generic finance advice. No moralizing. No AI-report voice.

CONFORM TO DEFTBRAIN_OUTPUT_STANDARD_V2.
Reason freely. Assert carefully.

${NO_QUOTE_RULE}`;

function n(v) {
  const x = Number(v);
  return Number.isFinite(x) && x >= 0 ? x : 0;
}

function monthlyEquivalent(cost, cycle) {
  const c = n(cost);
  if (cycle === 'yearly') return c / 12;
  if (cycle === 'weekly') return c * 52 / 12;
  return c;
}

function money(x) {
  return Math.round((n(x) + Number.EPSILON) * 100) / 100;
}

const BUCKETS = new Set(['start_here', 'take_another_look', 'probably_leave_alone']);

function fallbackBucket(usage) {
  if (usage === 'forgot' || usage === 'barely') return 'start_here';
  if (usage === 'a_lot') return 'probably_leave_alone';
  return 'take_another_look';
}

// Structural sanitization only — see the file-header comment. This does NOT
// verify the model avoided "wasted"/verdict language or an invented
// cancellation step; that discipline is prompt-enforced (CONTRACT above),
// not code-checkable.
function validateResult(parsed, clean, totals) {
  const allowed = new Set(clean.map(s => s.id));
  const itemMap = new Map(
    (Array.isArray(parsed?.items) ? parsed.items : [])
      .filter(x => x && typeof x === 'object' && allowed.has(String(x.id)))
      .map(x => [String(x.id), x])
  );

  const items = clean.map(s => {
    const ai = itemMap.get(s.id) || {};
    const bucket = BUCKETS.has(ai.bucket) ? ai.bucket : fallbackBucket(s.usage);
    const reason = typeof ai.reason === 'string' && ai.reason.trim()
      ? ai.reason.trim()
      : (bucket === 'start_here'
          ? 'Your own usage description makes this one worth reviewing first.'
          : bucket === 'probably_leave_alone'
            ? 'Nothing you supplied makes this an obvious place to start.'
            : 'Your usage description leaves the value less clear.');
    const question = bucket === 'probably_leave_alone'
      ? null
      : (typeof ai.question === 'string' && ai.question.trim()
          ? ai.question.trim()
          : 'Is there something important about this subscription that the usage label does not capture?');
    return { ...s, bucket, reason, question };
  });

  return {
    totals,
    summary: typeof parsed?.summary === 'string' && parsed.summary.trim()
      ? parsed.summary.trim()
      : `You listed ${items.length} recurring subscription${items.length === 1 ? '' : 's'}.`,
    items,
  };
}

router.post('/subscription-tamer', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { action } = req.body || {};

    if (action === 'parse') {
      const { statement, currency, userLanguage, userLocale, userCurrency, userRegion } = req.body;
      if (!statement || !String(statement).trim()) {
        return res.status(400).json({ error: 'Paste statement text first.' });
      }

      const system = `You review pasted bank or card statement text for POSSIBLE recurring subscription charges.

This is candidate extraction, not merchant identification.

Rules:
- Preserve the merchant wording from the statement whenever possible.
- Do not translate a cryptic merchant string into a famous brand unless the statement itself establishes that identity.
- Do not claim a charge is recurring from one occurrence alone.
- A repeated same/similar merchant and amount can support 'likely recurring'.
- A single plausible subscription-like merchant can be returned as 'possible' for the visitor to confirm.
- Ignore ordinary one-time purchases when clearly identifiable.
- Do not infer usage.
- Do not infer billing cycle unless repetition in the pasted data supports it.
- Every returned item requires visitor confirmation before it becomes part of the subscription list.

${NO_QUOTE_RULE}`;

      const prompt = `CURRENCY: ${currency || '$'}

STATEMENT TEXT:
${String(statement).slice(0, 30000)}

Return ONLY valid JSON:
{
  "candidates": [
    {
      "merchant_text": "Merchant text as it appears in the statement",
      "display_name": "Same merchant text, lightly cleaned for readability only",
      "amount": 12.99,
      "cycle": "monthly | yearly | weekly | unknown",
      "status": "likely recurring | possible",
      "why_flagged": "One short sentence tied only to the pasted statement"
    }
  ]
}`;

      const parsed = await callClaudeWithRetry({
        model: MODELS.FAST,
        max_tokens: 3000,
        system: withLanguage(system, userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion),
        messages: [{ role: 'user', content: prompt }],
      }, { label: 'subscription-tamer-parse' });

      return res.json({ candidates: Array.isArray(parsed?.candidates) ? parsed.candidates : [] });
    }

    if (action === 'analyze') {
      const { subscriptions, currency, userLanguage, userLocale, userCurrency, userRegion } = req.body;
      if (!Array.isArray(subscriptions) || !subscriptions.length) {
        return res.status(400).json({ error: 'Add at least one subscription.' });
      }

      const clean = subscriptions
        .filter(s => String(s?.name || '').trim() && n(s?.cost) >= 0)
        .map((s, i) => ({
          id: String(s.id ?? i + 1),
          name: String(s.name).trim(),
          cost: money(s.cost),
          cycle: ['weekly', 'monthly', 'yearly'].includes(s.cycle) ? s.cycle : 'monthly',
          monthly_cost: money(monthlyEquivalent(s.cost, s.cycle)),
          usage: ['a_lot', 'sometimes', 'barely', 'forgot', 'not_sure'].includes(s.usage) ? s.usage : 'not_sure',
          context: String(s.context || '').trim().slice(0, 600),
        }));

      if (!clean.length) return res.status(400).json({ error: 'Add at least one valid subscription.' });

      const totalMonthly = money(clean.reduce((sum, s) => sum + s.monthly_cost, 0));
      const totalAnnual = money(totalMonthly * 12);
      const sym = currency || '$';

      const rows = clean.map((s, i) => `${i + 1}. ID ${s.id}\nName: ${s.name}\nPrice: ${sym}${s.cost}/${s.cycle}\nMonthly equivalent: ${sym}${s.monthly_cost}\nUsage: ${s.usage}\nContext: ${s.context || 'None supplied'}`).join('\n\n');

      const prompt = `REVIEW THESE SUBSCRIPTIONS
Currency symbol: ${sym}
Total monthly equivalent: ${sym}${totalMonthly}
Total annual equivalent: ${sym}${totalAnnual}

${rows}

Return ONLY valid JSON:
{
  "summary": "One short you/your sentence about the review, based only on the supplied entries.",
  "items": [
    {
      "id": "Exact input ID",
      "bucket": "start_here | take_another_look | probably_leave_alone",
      "reason": "One concise you/your sentence grounded only in the supplied price, usage, and context.",
      "question": "One short decision-changing question for start_here/take_another_look, otherwise null"
    }
  ]
}`;

      const parsed = await callClaudeWithRetry({
        model: MODELS.FAST,
        max_tokens: 3500,
        system: withLanguage(CONTRACT, userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion),
        messages: [{ role: 'user', content: prompt }],
      }, { label: 'subscription-tamer-analyze' });

      const result = validateResult(parsed, clean, { monthly: totalMonthly, annual: totalAnnual });
      if (!Array.isArray(result.items) || !result.items.length) {
        return res.status(500).json({ error: 'Could not review your subscriptions. Please try again.' });
      }
      res.json(result);
      return;
    }

    return res.status(400).json({ error: 'Unknown action.' });
  } catch (error) {
    console.error('SubscriptionTamer error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
