const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, cleanJsonResponse, withLanguage, withLocaleContext } = require('../lib/claude');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

router.post('/sub-sweep', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  const { action } = req.body;

  try {
    switch (action) {

      // ════════════════════════════════════════════════════════
      // ACTION: PARSE — scan statement text for subscriptions
      // ════════════════════════════════════════════════════════
      case 'parse': {
        const { statement, currency, userLanguage, userLocale, userCurrency, userRegion } = req.body;
        if (!statement || !statement.trim()) {
          return res.status(400).json({ error: 'No statement text provided' });
        }

        const parsed = await callClaudeWithRetry({
          model: 'claude-sonnet-4-6',
          max_tokens: 1500,
          system: withLanguage(`You are a financial data parser. Extract recurring subscription charges from bank/credit card statement text. Identify subscriptions even when merchant names are cryptic (e.g., "AMZN*Prime" = Amazon Prime, "GOOGLE *YouTubePrem" = YouTube Premium, "MSFT*Store" = Microsoft 365).`, userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion),
          messages: [{
            role: 'user',
            content: `Parse this statement and identify RECURRING SUBSCRIPTION charges. Ignore one-time purchases, groceries, gas, etc. Currency: ${currency || '$'}

STATEMENT TEXT:
${statement.substring(0, 8000)}

Return ONLY valid JSON:
{
  "subscriptions": [
    {
      "name": "Human-readable service name (e.g., 'Netflix' not 'NFLX*STREAMING') — 3-6 words",
      "cost": 15.49,
      "cycle": "monthly — one sentence",
      "usage_guess": "unknown — one sentence"
    }
  ]
}`
          }],
        }, { label: 'sub-sweep' });
        if (!parsed.verdict && !parsed.subscriptions && !parsed.analysis) {
        return res.status(500).json({ error: 'Could not analyze subscriptions. Please try again.' });
      }
      return res.json(parsed);
      }

      // ════════════════════════════════════════════════════════
      // ACTION: ANALYZE — full subscription audit
      // ════════════════════════════════════════════════════════
      case 'analyze': {
        const { subscriptions, currency, userLanguage, userLocale, userCurrency, userRegion } = req.body;
        if (!subscriptions || !subscriptions.length) {
          return res.status(400).json({ error: 'No subscriptions provided' });
        }

        const sym = currency || '$';
        const totalMonthly = subscriptions.reduce((s, sub) => s + (sub.monthly_cost || sub.cost || 0), 0);

        const subList = subscriptions.map((s, i) => {
          const monthlyCost = s.monthly_cost || s.cost || 0;
          return `${i + 1}. ${s.name} — ${sym}${s.cost || 0}/${s.cycle || 'monthly'} (${sym}${monthlyCost.toFixed(2)}/mo) — Usage: ${s.usage || 'unknown'}`;
        }).join('\n');

        const systemPrompt = `You are a subscription audit expert. You help people identify waste, calculate real costs, and take action. Be brutally honest but not judgmental — people feel shame about forgotten subscriptions, so normalize it. Give them permission to cancel.`;

        const userPrompt = `SUBSCRIPTION AUDIT
Currency: ${sym}
Total monthly: ${sym}${totalMonthly.toFixed(2)} (${sym}${(totalMonthly * 12).toFixed(0)}/year)

SUBSCRIPTIONS:
${subList}

Analyze every subscription. Return ONLY valid JSON:
{
  "wasted_monthly": 25.50,

  "breakdown": {
    "used": 45.00,
    "underused": 20.00,
    "forgotten": 15.00
  },

  "subscriptions": [
    {
      "name": "Netflix — 3-6 words",
      "verdict": "keep | cancel | consider",
      "honesty": "One brutally honest sentence about this subscription's value. Be specific to their usage level. — one sentence",
      "cost_per_use": "4.12",
      "would_you_pay": "Would you pay ${sym}4.12 every time you watch a show? That's actually reasonable for unlimited entertainment. — one sentence",
      "free_alternative": "Free/cheaper alternative or null if verdict is keep — one sentence",
      "cancellation_difficulty": "easy | medium | hard",
      "cancellation_steps": "Step by step how to cancel (e.g., 'Go to Netflix.com → Account → Cancel Membership'). Only for cancel/consider verdicts. — one sentence",
      "cancellation_script": "Ready-to-send cancellation message if applicable (for services requiring contact). null if self-service. — 2-4 sentences",
      "seasonal_note": "If this could be paused seasonally, explain when. null otherwise. — one sentence",
      "retention_tactics": ["List specific tactics this company uses to prevent cancellation", "e.g., 'They'll offer 3 months at 50% off — say no, the next offer is usually better'", "null if easy self-service cancel"]
    }
  ],

  "savings_equivalents": [
    "If user cut all 'cancel' items, translate annual savings into 2-3 real things: e.g., 'a weekend trip to the coast', '47 really good coffees', 'a new PS5 game every other month'. Use culturally appropriate examples."
  ],

  "overall": "2-3 sentence bottom line. How much they're wasting, what to cut first, and one encouraging line about how normal subscription creep is.",

  "permission_statements": [
    "2-3 guilt-free permission statements. Examples: 'Cancelling a service you don't use isn't wasteful — keeping it is.', 'You are not obligated to pay for something just because you signed up once.', 'The financially responsible choice is to cancel what you don't use, not to keep paying out of inertia.'"
  ]
}`;

        const parsed = await callClaudeWithRetry({
          model: 'claude-sonnet-4-6',
          max_tokens: 1000,
          system: withLanguage(systemPrompt, userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion),
          messages: [{ role: 'user', content: userPrompt }],
        }, { label: 'sub-sweep-2' });
        if (!parsed.verdict && !parsed.subscriptions && !parsed.analysis) {
        return res.status(500).json({ error: 'Could not analyze subscriptions. Please try again.' });
      }
      return res.json(parsed);
      }

      // ════════════════════════════════════════════════════════
      // ACTION: OPTIMIZE — find plan upgrades/downgrades/bundles
      // ════════════════════════════════════════════════════════
      case 'optimize': {
        const { subscriptions, currency, userLanguage, userLocale, userCurrency, userRegion } = req.body;
        if (!subscriptions || !subscriptions.length) {
          return res.status(400).json({ error: 'No subscriptions provided' });
        }

        const sym = currency || '$';
        const subList = subscriptions.map((s, i) =>
          `${i + 1}. ${s.name} — ${sym}${s.cost}/${s.cycle} — Plan: ${s.planTier || 'unknown'}`
        ).join('\n');

        const parsed = await callClaudeWithRetry({
          model: 'claude-sonnet-4-6',
          max_tokens: 2000,
          system: withLanguage(`You are a subscription optimization expert. You know current pricing tiers, family/duo plans, student discounts, annual vs monthly pricing, and bundle deals for popular services. Be specific with real numbers. All amounts in ${sym}.`, userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion),
          messages: [{
            role: 'user',
            content: `OPTIMIZE THESE SUBSCRIPTIONS:
${subList}

For each subscription, check for savings opportunities. Return ONLY valid JSON:
{
  "optimizations": [
    {
      "service": "Spotify — one sentence",
      "current_cost": 10.99,
      "current_plan": "Individual Monthly — one sentence",
      "opportunities": [
        {
          "type": "annual_switch|family_plan|student_discount|bundle|downgrade|competitor_switch",
          "description": "Switch to annual plan — 1-2 sentences",
          "new_cost": 9.17,
          "savings_monthly": 1.82,
          "savings_annual": 21.84,
          "how": "Go to spotify.com/account → Manage Plan → Switch to Annual — one sentence",
          "caveat": "Billed as one payment of ${sym}109.99/year — one sentence"
        }
      ]
    }
  ],
  "bundle_opportunities": [
    {
      "services_involved": ["Hulu", "Disney+", "ESPN+"],
      "bundle_name": "Disney Bundle — 3-6 words",
      "bundle_cost": 14.99,
      "current_separate_cost": 38.97,
      "savings_monthly": 23.98,
      "how": "Sign up at disneyplus.com/bundle — one sentence"
    }
  ],
  "total_potential_savings_monthly": 25.50,
  "total_potential_savings_annual": 306.00,
  "top_move": "Your single biggest savings: switch X to annual billing — saves ${sym}Y/year — one sentence"
}`
          }],
        }, { label: 'sub-sweep-3' });
        if (!parsed.verdict && !parsed.subscriptions && !parsed.analysis) {
        return res.status(500).json({ error: 'Could not analyze subscriptions. Please try again.' });
      }
      return res.json(parsed);
      }

      // ════════════════════════════════════════════════════════
      // ACTION: NEGOTIATE — retention scripts for a specific service
      // ════════════════════════════════════════════════════════
      case 'negotiate': {
        const { serviceName, cost, cycle, currency, userLanguage, userLocale, userCurrency, userRegion } = req.body;
        if (!serviceName?.trim()) {
          return res.status(400).json({ error: 'Service name required' });
        }

        const sym = currency || '$';

        const parsed = await callClaudeWithRetry({
          model: 'claude-sonnet-4-6',
          max_tokens: 1500,
          system: withLanguage(`You are an expert in subscription retention negotiations. You know exactly what tactics each company uses to keep customers, what discounts they can offer, and the magic phrases that trigger better deals. Be specific — use real department names, real discount amounts, and real processes. All amounts in ${sym}.`, userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion),
          messages: [{
            role: 'user',
            content: `RETENTION NEGOTIATION SCRIPT for: ${serviceName}
Current cost: ${sym}${cost || '?'}/${cycle || 'monthly'}

Generate a complete retention negotiation script. Return ONLY valid JSON:
{
  "service": "${serviceName}",
  "contact_method": "How to reach retention dept (phone, chat, or both). Include actual phone numbers or paths if known. — one sentence",
  "best_time_to_call": "When retention reps have more authority to give discounts — one sentence",
  "opening_line": "Exact opening sentence to say — one sentence",
  "script_steps": [
    {
      "step": 1,
      "you_say": "Exact words to say — one sentence",
      "they_will_say": "What the rep will likely respond with — one sentence",
      "your_response": "How to counter their response — one sentence",
      "tip": "Why this works — one sentence"
    }
  ],
  "known_offers": [
    {
      "offer": "50% off for 3 months — one sentence",
      "likelihood": "high|medium|low",
      "should_accept": true,
      "why": "This is their standard retention offer — take it — one sentence"
    }
  ],
  "magic_phrases": ["Specific phrases that trigger better deals or escalation to retention"],
  "walk_away_threshold": "The best deal you can realistically expect. If they won't match this, cancel. — one sentence",
  "nuclear_option": "What to do if they refuse everything (social media, FCC complaint, chargeback, etc.) — one sentence"
}`
          }],
        }, { label: 'sub-sweep-4' });
        if (!parsed.verdict && !parsed.subscriptions && !parsed.analysis) {
        return res.status(500).json({ error: 'Could not analyze subscriptions. Please try again.' });
      }
      return res.json(parsed);
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }

  } catch (error) {
    console.error('SubSweep error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
