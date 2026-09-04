const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, withLanguage, withLocaleContext } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

const NO_QUOTE_RULE = 'Never place a double-quote (") character inside any JSON string value — scripts, exact words to say, and quoted phrases must be written plainly or with single quotes, or it breaks the JSON.';

// ═══════════════════════════════════════════════════
// THE GLOBAL RULE — prepended to every route's system prompt.
//
// North star: Money Diplomat is strongest when it answers "what is fair or
// prudent here, given what I actually know, and what can I say?" It is weakest
// when it answers "what is this person secretly thinking?", "what will
// happen?", "what does my culture require?" or "what number is objectively
// correct?". Reason about the money, help with the conversation, do not invent
// the people.
// ═══════════════════════════════════════════════════
const MONEY_DIPLOMAT_V2 = `
Apply DEFTBRAIN_OUTPUT_STANDARD_V2.

Money Diplomat helps with social money decisions. It may reason about fairness,
tradeoffs, boundaries, arithmetic, and conversation strategy.

It must distinguish:
ESTABLISHED
- directly supplied by the user
- arithmetic derived from supplied figures

REASONABLE IMPLICATION
- a cautious interpretation that follows from supplied facts
- must be phrased as possibility, not fact

UNKNOWN
- motives
- intentions
- financial capacity
- willingness to pay
- whether someone is avoiding repayment
- relationship damage
- resentment
- future behavior
- how another person will react
- hidden family dynamics
- workplace politics
- cultural beliefs of an individual
- legal or tax consequences
unless established or verified.

Do not output confidence percentages.

Do not predict:
- whether someone will repay
- whether someone will resent the user
- whether a relationship will worsen
- likely counteroffers
- likely salary outcomes
- whether another person will feel guilty, defensive, insulted, pressured, or grateful

Do not diagnose motives from spending.
A vacation, purchase, gift, restaurant visit, clothing, car, or other visible spending
does not establish ability to repay, financial hardship, priorities, irresponsibility,
or unwillingness to pay.

Do not infer a psychological "real issue" underneath a money disagreement.
Discuss only the practical issue and any explicitly supplied relationship concern.

Do not claim universal social, workplace, dating, family, or cultural norms as facts.
When norms vary, say so and ask or explain what to verify.

Do not invent market rates, tipping norms, gift norms, salary bands, legal rights,
tax deductibility, cultural expectations, or current prices.

If outside-world facts are necessary and not verified, frame them as facts to check.

Scripts may be direct and useful.
Their factual premises may not exceed what the user supplied.

Write directly to the user as "you".
`;

// Applied to the four allocation routes: split, roommate, subs, group.
const FAIRNESS_RULE = `
FAIRNESS

Do arithmetic only from supplied figures.

Do not invent usage, room size, amenities, consumption, income, or who benefits more.

"Fair" is not a hidden mathematical truth.
When several allocations are defensible, show the alternatives and the assumption
behind each.

Prefer:
- Equal split if everyone agrees usage is comparable
- Usage-based split if usage is supplied
- Itemized split if purchases are known

Do not manufacture adjustments merely to make the answer sophisticated.
`;

// ── Deterministic backstops ───────────────────────────────────────────────
// Each is a sentence the tool produced on the lending probe or a sibling route.
// The through-line: a supplied fact used as licence to describe a person.

// "Likely to repay", "resentment risk: moderate", "87% confident".
const PREDICTED_OUTCOME = new RegExp([
  '\\b(?:likely|unlikely|probably|almost certainly) to (?:repay|pay (?:you )?back|resent|agree|accept|say yes|counter)\\b',
  '\\b(?:repayment|resentment|relationship|damage|conflict) (?:risk|likelihood|probability|forecast)\\b',
  '\\b\\d{1,3}\\s?%\\s?(?:confiden\\w*|likely|chance|probability|risk)\\b',
  '\\b(?:high|medium|moderate|low)\\s+(?:risk|likelihood|chance) of (?:resent|non[- ]?payment|damage|conflict)\\b',
  '\\bthey (?:will|are going to|are likely to) (?:resent|feel|be) \\w+',
  '\\bthis (?:will|would) (?:damage|strain|harm|cost you) (?:the|your) (?:relationship|friendship)\\b',
].join('|'), 'i');

// Reading a holiday, a car or a handbag as evidence about someone's finances.
const SPENDING_AS_MOTIVE = new RegExp([
  // Narrowed 2026-09-04. The first version matched any spending noun within
  // fifty characters of an inference verb, and blanked "a quick conversation
  // before the dinner tells you what they actually expect" — a sentence with no
  // claim about anyone's finances in it. The inference has to land on money,
  // ability or priorities to be the thing this rule is for.
  '\\b(?:the |their |that )(?:holiday|vacation|trip|new (?:car|phone|laptop)|handbag|purchase|spending)\\b[^.]{0,50}\\b(?:suggests?|indicates?|shows?|means?|tells you|says a lot|is a sign|signals?|proves?)\\b[^.]{0,45}\\b(?:afford|money|cash|priorit\\w*|finances|financial|able to pay|could (?:have )?(?:paid|repaid)|chose)\\b',
  '\\b(?:if|since) they can afford\\b[^.]{0,40}\\b(?:they can|they could|they should)\\b',
  '\\b(?:priorit|choos)\\w+\\b[^.]{0,35}\\bover (?:repaying|paying you back|the loan|their debt)\\b',
  '\\b(?:avoiding|dodging|ducking) (?:you|repayment|the (?:subject|topic|conversation))\\b',
].join('|'), 'i');

// "The real issue isn't the money" — the psychologising this rewrite removes.
const REAL_ISSUE = new RegExp([
  '\\bthe real (?:issue|problem|question) (?:here )?(?:is ?n.t|isn\\x27t|is not)\\b',
  '\\b(?:this|it) (?:is ?n.t|isn\\x27t|is not) (?:really |actually )?about (?:the )?money\\b',
  '\\bwhat(?:\\x27s| is) (?:really )?(?:going on|underneath|beneath|driving this)\\b',
  '\\bunderlying (?:dynamic|tension|resentment|power|issue)\\b',
  '\\bmoney (?:is|becomes) (?:a )?(?:proxy|stand[- ]in|symbol) for\\b',
].join('|'), 'i');

// A culture, country or background given one uniform money rule.
const CULTURE_AS_RULE = new RegExp([
  '\\bin (?:\\p{Lu}\\p{L}+(?:an|ese|ish|ian|i)?) culture,?\\b',
  '\\b(?:\\p{Lu}\\p{L}+s?) (?:people|families|households) (?:typically|usually|always|generally|tend to|expect)\\b',
  '\\bwhat (?:this|that|it) (?:actually |really )?means in (?:their|his|her) culture\\b',
  '\\bculture (?:clash|gap) (?:risk|score|level)\\b',
  '\\bit(?:\\x27s| is) (?:customary|expected|standard|the norm) (?:in|to)\\b',
].join('|'), 'iu');

// Tax and legal conclusions the tool cannot reach.
const TAX_OR_LEGAL_CONCLUSION = new RegExp([
  '\\b(?:is|will be|should be|are) (?:fully |likely |probably )?tax[- ]deductible\\b',
  '\\byou can (?:claim|deduct|write off)\\b',
  '\\b(?:you (?:are|have)|they (?:are|have)) (?:a )?legal(?:ly)? (?:right|entitled|obligation|obliged|required)\\b',
  '\\bsmall claims court will\\b|\\bthe law (?:requires|says|is) (?:that )?\\b',
].join('|'), 'i');

// A hedge means the sentence proposes rather than asserts — spare it.
const HEDGED = /\b(?:if|whether|may|might|could|unknown|not established|you did not|unless|check|verify|varies|depends)\b/i;

const RULES = [
  ['predicted an outcome or a reaction', PREDICTED_OUTCOME],
  ['read visible spending as evidence about someone', SPENDING_AS_MOTIVE],
  ['invented a real issue underneath the money', REAL_ISSUE],
  ['gave a culture one uniform money rule', CULTURE_AS_RULE, (v) => HEDGED.test(v)],
  ['reached a tax or legal conclusion', TAX_OR_LEGAL_CONCLUSION, (v) => HEDGED.test(v)],
];

// Arrays are objects: Object.entries enumerates their indices, so the walk
// reaches strings inside arrays without a special case.
function validateResult(data) {
  if (!data || typeof data !== 'object') return data;
  const walk = (node) => {
    if (!node || typeof node !== 'object') return;
    for (const [k, v] of Object.entries(node)) {
      if (k === 'recommendation' && typeof v === 'string' && v.length < 40) continue; // pinned enum
      if (typeof v === 'string') {
        const hit = RULES.find(([, re, spare]) => re.test(v) && !(spare && spare(v)));
        if (hit) {
          if (v.length <= 260 && (v.match(/[.!?]/g) || []).length <= 2) {
            console.log(`[money-diplomat] ${k} blanked — ${hit[0]}: ${v.slice(0, 200)}`);
            node[k] = '';
          } else {
            console.log(`[money-diplomat] ${k} ${hit[0]} (left intact, too long to cut safely): ${v.slice(0, 200)}`);
          }
        }
      } else if (v && typeof v === 'object') walk(v);
    }
  };
  walk(data);
  const prune = (node) => {
    if (Array.isArray(node)) {
      for (let i = node.length - 1; i >= 0; i--) {
        const it = node[i];
        if (it === '') node.splice(i, 1);
        else if (it && typeof it === 'object' && Object.values(it).every(x => x === '' || x == null)) node.splice(i, 1);
        else prune(it);
      }
      return;
    }
    if (node && typeof node === 'object') Object.values(node).forEach(prune);
  };
  prune(data);
  return data;
}

// The frontend switches on these, so withLanguage must not translate them.
const ENUMS = {
  recommendation: ['Lend', 'Do not lend yet', 'Lend only under conditions', 'Not enough to tell'],
  verdict: ['Request it', 'Let it go', 'Talk first', 'Not enough to tell'],
  gut_check: ['Looks manageable', 'Worth a closer look', 'Looks difficult', 'Not enough information'],
};
function pinEnums(data) {
  if (!data || typeof data !== 'object') return data;
  for (const [key, allowed] of Object.entries(ENUMS)) {
    if (typeof data[key] !== 'string') continue;
    const v = data[key].trim().toLowerCase();
    data[key] = allowed.find(a => a.toLowerCase() === v) || allowed[allowed.length - 1];
  }
  return data;
}

// ═══════════════════════════════════════════════════
// ROUTE 1: TIP ADVISOR — Culturally calibrated tip recommendation
// ═══════════════════════════════════════════════════
router.post('/money-diplomat-tip', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { situation, country, serviceType, billAmount, partySize, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    if (!situation?.trim()) {
      return res.status(400).json({ error: 'Describe the service situation.' });
    }

    const prompt = withLanguage(`TIP ADVISOR

Do not claim current country/service tipping norms unless verified.

Separate:
- bill arithmetic
- user-supplied service context
- outside-world norm that may need checking

If the norm is not verified, say:
"Local tipping expectations vary; check the current norm for [place/service]."

Never invent:
- automatic gratuity policies
- party-size rules
- service charges
- tax treatment
- current standard percentages

If the user provides a percentage or known policy, calculate exactly from it.

THE SITUATION: ${situation.trim()}
PLACE: ${country?.trim() || 'Not supplied.'}
SERVICE TYPE: ${serviceType || 'Not supplied.'}
BILL AMOUNT: ${billAmount || 'Not supplied — leave the arithmetic out rather than inventing a bill.'}
PARTY SIZE: ${partySize || 'Not supplied.'}

Return ONLY valid JSON:
{
  "practical_answer": "What to actually do, in one or two sentences. If the local norm is not established, say so here rather than picking a percentage as though it were settled",
  "math": {
    "bill": "The bill they supplied, in their currency, or an empty string",
    "percentage_used": "The percentage this arithmetic uses, and where it came from — their own figure, or a stated assumption. Empty string if no arithmetic was possible",
    "tip": "The tip figure, or an empty string",
    "total": "The total, or an empty string"
  },
  "why": ["What in the supplied situation bears on the amount — one short line each"],
  "check_first": ["An outside-world fact that would change the answer and has not been verified — one short line each. Local expectations, service charges and automatic gratuity all belong here rather than in practical_answer"]
}

ARRAY BOUNDS: why 2-4, check_first at most 4.

Return ONLY valid JSON.`, userLanguage);

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 2000,
      system: withLanguage(MONEY_DIPLOMAT_V2 + '\n\nYou help someone decide what to tip. You do the bill arithmetic exactly from what they supply, and you are honest that local tipping expectations vary and may need checking. Return ONLY valid JSON. No markdown. ' + NO_QUOTE_RULE, userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion),
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'MoneyDiplomatTip' });

    if (!parsed.practical_answer) {
      return res.status(500).json({ error: 'Could not generate your script. Please try again.' });
    }
    res.json(validateResult(pinEnums(parsed)));

  } catch (error) {
    console.error('[MoneyDiplomatTip] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 2: BILL SPLITTER — Fair split with social dynamics
// ═══════════════════════════════════════════════════
router.post('/money-diplomat-split', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { situation, people, totalBill, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    if (!situation?.trim()) {
      return res.status(400).json({ error: 'Describe the bill situation.' });
    }

    const prompt = withLanguage(`Figure out the fairest way to split this bill, accounting for the social dynamics. This isn't just math — it's diplomacy.

SITUATION: "${situation.trim()}"
PEOPLE INVOLVED: ${people?.trim() || 'Not specified'}
TOTAL BILL: ${totalBill || 'Not specified'}

Return ONLY valid JSON:
{
  "options": [
    {
      "method": "Equal Split|Proportional|Social Split|Custom",
      "breakdown": [
        { "person": "Person description — one sentence", "amount": "this person's share as a compact figure in the user's currency (e.g. £25) — no sentence", "reasoning": "Why this amount — one sentence" }
      ],
      "total_with_tip": "XXX.XX — one sentence",
      "fairness_score": 85,
      "social_score": 95,
      "best_for": "When to use this option — e.g., 'When everyone's close friends and nobody's counting' — one sentence"
    }
  ],
  "recommended": "Which option you'd recommend for THIS specific group dynamic and why (true/false)",
  "the_awkward_part": "The specific tension in this situation — e.g., 'One person ordered significantly more' — one sentence",
  "how_to_bring_it_up": "Exact words to say if you need to suggest a non-equal split — natural, not awkward — one sentence",
  "tip_recommendation": {
    "percentage": 20,
    "total_tip": "XX.XX — one sentence",
    "note": "How to handle tip in the split — per person or on total — one sentence"
  },
  "next_time": "How to prevent this situation in the future — one practical tip — one sentence"
}`, userLanguage);

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 2500,
      system: withLanguage(MONEY_DIPLOMAT_V2 + FAIRNESS_RULE + '\n\nYou split a bill from the figures supplied. Where several allocations are defensible you show them and name the assumption behind each. Return ONLY valid JSON. No markdown. ' + NO_QUOTE_RULE, userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion),
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'MoneyDiplomatSplit' });

    if (!parsed.options) {
      return res.status(500).json({ error: 'Could not generate your script. Please try again.' });
    }
    res.json(validateResult(pinEnums(parsed)));

  } catch (error) {
    console.error('[MoneyDiplomatSplit] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 3: VENMO VERDICT — Should I request this?
// ═══════════════════════════════════════════════════
router.post('/money-diplomat-venmo', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { situation, amount, relationship, timePassed, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    if (!situation?.trim()) {
      return res.status(400).json({ error: 'Describe the money situation.' });
    }

    const prompt = withLanguage(`ASKING FOR MONEY BACK

Do not infer how much the user will resent the other person.
Do not predict whether the request will damage the relationship.
Judge whether requesting the money is reasonable from the supplied agreement,
amount, timing, relationship context, and communication history.

THE SITUATION: ${situation.trim()}
AMOUNT: ${amount || 'Not supplied.'}
RELATIONSHIP: ${relationship || 'Not supplied.'}
TIME SINCE: ${timePassed || 'Not supplied.'}

Return ONLY valid JSON:
{
  "verdict": "Exactly one of these English strings: Request it, Let it go, Talk first, Not enough to tell",
  "why": ["Reasoning grounded in what they supplied — one short line each"],
  "what_matters": ["The factor that actually bears on this — one short line each"],
  "unknowns": ["Something that would change the answer and was not supplied — one short line each"],
  "script": "Words they could send or say — 2-4 sentences",
  "if_they_push_back": "What to say if the answer is a excuse or a delay — 1-2 sentences"
}

ARRAY BOUNDS: why 2-4, what_matters at most 4, unknowns at most 3.

Return ONLY valid JSON.`, userLanguage);

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 2000,
      system: withLanguage(MONEY_DIPLOMAT_V2 + '\n\nYou help someone decide whether asking for money back is reasonable given what they described, and how to ask. Return ONLY valid JSON. No markdown. ' + NO_QUOTE_RULE, userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion),
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'MoneyDiplomatVenmo' });

    if (!parsed.verdict) {
      return res.status(500).json({ error: 'Could not generate your script. Please try again.' });
    }
    res.json(validateResult(pinEnums(parsed)));

  } catch (error) {
    console.error('[MoneyDiplomatVenmo] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 4: GIFT CALCULATOR — How much to spend
// ═══════════════════════════════════════════════════
router.post('/money-diplomat-gift', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { occasion, relationship, theirSpend, yourBudget, region, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    if (!occasion?.trim() || !relationship?.trim()) {
      return res.status(400).json({ error: 'Describe the occasion and relationship.' });
    }

    const prompt = withLanguage(`GIFT AMOUNT

Do not claim one correct gift amount.

If the user supplies a budget, treat it as the strongest constraint.

Do not invent what the recipient will spend, expects, or considers appropriate.

If regional/cultural gift norms are not verified, say they vary rather than
inventing a typical amount.

OCCASION: ${occasion || 'Not supplied.'}
RELATIONSHIP: ${relationship || 'Not supplied.'}
WHAT THEY SPENT ON YOU, IF SUPPLIED: ${theirSpend || 'Not supplied — do not guess at it.'}
THE USER BUDGET: ${yourBudget || 'Not supplied.'}
REGION: ${region || 'Not supplied.'}

Return ONLY valid JSON:
{
  "range": "A range in the user's currency, not a single number. If they gave a budget, the range sits inside it",
  "why_this_range": ["What in the supplied facts puts the range here — one short line each"],
  "budget_check": "How the range sits against the budget they gave, or a note that no budget was supplied — one or two sentences",
  "social_context": "What is genuinely known here versus what varies by region, family or circle. Say plainly that norms vary where they do — one or two sentences",
  "if_you_want_to_spend_less": "A way to spend less without it reading as an afterthought — 1-2 sentences",
  "if_you_want_to_spend_more": "What more money would actually buy here — 1-2 sentences"
}

ARRAY BOUNDS: why_this_range 2-4.

Return ONLY valid JSON.`, userLanguage);

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 2000,
      system: withLanguage(MONEY_DIPLOMAT_V2 + '\n\nYou help someone settle on a gift amount they are comfortable with. There is no one correct amount, and you never claim to know what the recipient expects. Return ONLY valid JSON. No markdown. ' + NO_QUOTE_RULE, userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion),
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'MoneyDiplomatGift' });

    if (!parsed.range) {
      return res.status(500).json({ error: 'Could not generate your script. Please try again.' });
    }
    res.json(validateResult(pinEnums(parsed)));

  } catch (error) {
    console.error('[MoneyDiplomatGift] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 5: ROOMMATE RECKONER — Fair shared-living splits
// ═══════════════════════════════════════════════════
router.post('/money-diplomat-roommate', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { situation, people, totalCost, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    if (!situation?.trim()) {
      return res.status(400).json({ error: 'Describe the roommate situation.' });
    }

    const prompt = withLanguage(`Figure out a fair money arrangement for this shared-living situation. Account for all the factors that make "just split it equally" not actually fair.

SITUATION: "${situation.trim()}"
PEOPLE: ${people?.trim() || 'Not specified'}
COSTS: ${totalCost || 'Not specified'}

Return ONLY valid JSON:
{
  "fair_split": [
    {
      "person": "Person/room description — one sentence",
      "amount": "monthly amount as a compact figure in the user's currency (e.g. £40/month) — no sentence",
      "percentage": 45,
      "adjustments": ["Each factor that moved their share up or down"]
    }
  ],
  "methodology": "How the split was calculated — square footage, amenities, usage, etc. — one sentence",
  "factors_considered": [
    {
      "factor": "e.g., 'Master bedroom has private bathroom' — one sentence",
      "impact": "+XX or -XX (number)",
      "reasoning": "Why this adjustment is fair — one sentence"
    }
  ],
  "the_conversation": {
    "when": "When to bring this up — before signing, at move-in, or now — one sentence",
    "opener": "Exact words to start this conversation without it feeling accusatory — one sentence",
    "if_pushback": "What to say if someone disagrees with the split — one sentence"
  },
  "common_trap": "The most common roommate money mistake for this type of arrangement — one sentence"
}`, userLanguage);

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 2500,
      system: withLanguage(MONEY_DIPLOMAT_V2 + FAIRNESS_RULE + '\n\nYou allocate shared household costs from the figures supplied. Where several allocations are defensible you show them and name the assumption behind each. Return ONLY valid JSON. No markdown. ' + NO_QUOTE_RULE, userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion),
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'MoneyDiplomatRoommate' });

    if (!parsed.fair_split) {
      return res.status(500).json({ error: 'Could not generate your script. Please try again.' });
    }
    res.json(validateResult(pinEnums(parsed)));

  } catch (error) {
    console.error('[MoneyDiplomatRoommate] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 6: FAMILY MONEY DIPLOMAT — Family financial dynamics
// ═══════════════════════════════════════════════════
router.post('/money-diplomat-family', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { situation, familyDynamic, culturalContext, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    if (!situation?.trim()) {
      return res.status(400).json({ error: 'Describe the family money situation.' });
    }

    const prompt = withLanguage(`FAMILY MONEY

Do not infer love, control, guilt, obligation, power dynamics, favoritism,
family roles, or hidden history unless the user supplies them.

Money disagreements may involve relationship concerns, but do not manufacture them.

Focus on:
- what was asked
- what has been promised
- what the user can and cannot do
- what needs clarification
- a boundary or request the user can communicate

Do not generate "the real issue underneath the money."

If cultural or family expectations are supplied, treat them as context,
not proof that every family member shares them.

THE SITUATION: ${situation.trim()}
WHAT THEY SAID ABOUT THE FAMILY: ${familyDynamic || 'Nothing supplied — do not invent a dynamic.'}
CULTURAL CONTEXT THEY SUPPLIED: ${culturalContext || 'Nothing supplied. Do not assume one, and do not assume every family member shares any expectation they did mention.'}

Return ONLY valid JSON:
{
  "practical_issue": "What is actually being decided, stated plainly — one or two sentences. Not what it is 'really about'",
  "what_is_known": ["A fact THEY supplied — one short line each"],
  "what_needs_clarifying": ["Something unresolved that a conversation could settle — one short line each"],
  "recommendation": "What to do — one or two sentences",
  "conversation": {
    "opener": "How to start it — 1-2 sentences they could say",
    "key_points": ["Something to make sure gets said — one short line each"],
    "boundary_if_needed": "A boundary they could state, or an empty string if none is called for",
    "if_they_disagree": "What to say if the answer is pushback — 1-2 sentences"
  }
}

ARRAY BOUNDS: what_is_known at most 5, what_needs_clarifying at most 4, key_points at most 4.

Return ONLY valid JSON.`, userLanguage);

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 4000,
      system: withLanguage(MONEY_DIPLOMAT_V2 + '\n\nYou help someone handle a family money question practically. You work from what they told you and nothing else. Return ONLY valid JSON. No markdown. ' + NO_QUOTE_RULE, userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion),
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'MoneyDiplomatFamily' });

    if (!parsed.practical_issue) {
      return res.status(500).json({ error: 'Could not generate your script. Please try again.' });
    }
    res.json(validateResult(pinEnums(parsed)));

  } catch (error) {
    console.error('[MoneyDiplomatFamily] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 7: DINING DIPLOMAT — Pre-dinner strategy
// ═══════════════════════════════════════════════════
router.post('/money-diplomat-dining', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { situation, context, yourBudget, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    if (!situation?.trim()) {
      return res.status(400).json({ error: 'Describe the dining situation.' });
    }

    const prompt = withLanguage(`Strategize for this upcoming dining situation BEFORE it happens. Help this person navigate the money dynamics so the meal is enjoyable, not stressful.

SITUATION: "${situation.trim()}"
CONTEXT: ${context?.trim() || 'Social dinner'}
YOUR BUDGET: ${yourBudget || 'Not specified'}

Return ONLY valid JSON:
{
  "pre_game": {
    "restaurant_strategy": "How to influence restaurant choice to match your budget — or how to handle if it's already picked — one sentence",
    "splitting_strategy": "When and how to bring up splitting BEFORE ordering — exact words — one sentence",
    "ordering_strategy": "How to order within budget without being obvious about it — one sentence"
  },
  "who_pays": {
    "expectation": "Who's expected to pay in this specific social context — one sentence",
    "reasoning": "Why — relationship, occasion, cultural norm, who invited — one sentence",
    "the_dance": "How to handle the check-grab moment gracefully — one sentence"
  },
  "scenarios": [
    {
      "if": "A specific scenario that might happen — e.g., 'Someone suggests the tasting menu' — one sentence",
      "then": "What to say or do — specific, natural words — one sentence",
      "avoid": "What NOT to say — one sentence"
    }
  ],
  "budget_moves": {
    "if_over_budget": "How to keep your spend down without being awkward — specific tactics — one sentence",
    "if_pressured": "What to say if someone pushes you to order more or split equally after unequal ordering — one sentence"
  },
  "pro_tip": "One piece of dining diplomacy wisdom specific to this situation — one sentence"
}`, userLanguage);

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 2500,
      system: withLanguage(MONEY_DIPLOMAT_V2 + '\n\nYou help someone handle the money side of a group meal. Specific words to say, not vague advice. Return ONLY valid JSON. No markdown. ' + NO_QUOTE_RULE, userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion),
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'MoneyDiplomatDining' });

    if (!parsed.pre_game) {
      return res.status(500).json({ error: 'Could not generate your script. Please try again.' });
    }
    res.json(validateResult(pinEnums(parsed)));

  } catch (error) {
    console.error('[MoneyDiplomatDining] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 8: GROUP EVENT SETTLER — Trips, events, shared costs
// ═══════════════════════════════════════════════════
router.post('/money-diplomat-group', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { eventType, situation, people, expenses, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    if (!situation?.trim()) {
      return res.status(400).json({ error: 'Describe the group event.' });
    }

    const prompt = withLanguage(`Help settle the money for this group event. Account for who paid what, who used what, and the inevitable person who dropped out or underpaid.

EVENT TYPE: ${eventType || 'Group trip'}
SITUATION: "${situation.trim()}"
PEOPLE: ${people?.trim() || 'Not specified'}
EXPENSES: ${expenses?.trim() || 'Not specified'}

Return ONLY valid JSON:
{
  "settlement": [
    {
      "person": "The person's name, or a short description if no name is given. Nothing else",
      "paid_so_far": "amount paid so far, compact figure in the user's currency",
      "fair_share": "fair share, compact figure in the user's currency",
      "owes_or_owed": "their net, in the user's currency — e.g. +£20 (owes) or -£20 (is owed) — one sentence"
    }
  ],
  "simplification": {
    "explanation": "How to minimize the number of transactions — e.g., 'Instead of 6 transactions, do 3' — 1-2 sentences",
    "transactions": [
      { "from": "Person A — one sentence", "to": "Person B — one sentence", "amount": "amount in the user's currency, compact figure — no sentence", "method": "Venmo/cash/etc. — one sentence" }
    ]
  },
  "the_dropout": {
    "applicable": true,
    "fair_solution": "How to handle the person who dropped out — what they owe, what's fair to eat — one sentence",
    "how_to_tell_them": "Exact message to send — one sentence"
  },
  "next_event_tip": "How to set up money tracking from the START next time — one sentence"
}`, userLanguage);

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 3000,
      system: withLanguage(MONEY_DIPLOMAT_V2 + FAIRNESS_RULE + '\n\nYou settle group expenses from the figures supplied, minimising transactions and handling dropouts. Return ONLY valid JSON. No markdown. ' + NO_QUOTE_RULE, userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion),
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'MoneyDiplomatGroup' });

    if (!parsed.settlement) {
      return res.status(500).json({ error: 'Could not generate your script. Please try again.' });
    }
    res.json(validateResult(pinEnums(parsed)));

  } catch (error) {
    console.error('[MoneyDiplomatGroup] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 9: LENDING COMPASS — Should I lend money?
// ═══════════════════════════════════════════════════
router.post('/money-diplomat-lend', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { situation, amount, relationship, history, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    if (!situation?.trim()) {
      return res.status(400).json({ error: 'Describe the lending situation.' });
    }

    const prompt = withLanguage(`LENDING

Do not predict repayment.

Do not infer willingness or ability to repay from visible discretionary spending.

A missed repayment date establishes that repayment is overdue.
Silence establishes that it has not been discussed, if the user says so.
Neither establishes why.

If an existing loan is overdue, it is reasonable to recommend resolving or
discussing it before adding another loan.

Do not output:
- Likely / Maybe / Unlikely repayment
- relationship risk scores
- resentment forecasts
- confidence percentages

The question is:
"What would be prudent given what is known?"

A strong recommendation is allowed when supported by supplied facts.

THE SITUATION: ${situation.trim()}
AMOUNT ASKED FOR: ${amount || 'Not supplied.'}
RELATIONSHIP: ${relationship || 'Not supplied.'}
HISTORY BETWEEN THEM: ${history || 'Not supplied — do not invent one.'}

Return ONLY valid JSON:
{
  "recommendation": "Exactly one of these English strings: Lend, Do not lend yet, Lend only under conditions, Not enough to tell",
  "why": ["2-4 grounded reasons based only on supplied facts — one short line each"],
  "what_is_known": ["A fact THEY supplied, restated plainly — one short line each"],
  "what_is_not_known": ["Something that matters and was not supplied — one short line each. Why an earlier loan is unpaid belongs here, never in why"],
  "before_you_decide": ["Questions worth answering before lending — one short line each"],
  "if_you_lend": {
    "amount_guidance": "What size of loan would be prudent given what they said — one or two sentences",
    "terms_to_clarify": ["A term to agree out loud before money moves — one short line each"],
    "script": "Words they could actually say — 2-4 sentences"
  },
  "if_you_do_not_lend": {
    "script": "Words they could actually say — 2-4 sentences",
    "if_they_push": "What to say if pressed — 1-2 sentences"
  },
  "existing_debt": {
    "relevant": true,
    "next_step": "What to do about the earlier loan first, or an empty string if there is no earlier loan",
    "script": "Words for raising it, or an empty string"
  }
}

ARRAY BOUNDS: why 2-4, what_is_known at most 5, what_is_not_known at most 4, before_you_decide at most 4, terms_to_clarify at most 4.

Return ONLY valid JSON.`, userLanguage);

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 2500,
      system: withLanguage(MONEY_DIPLOMAT_V2 + '\n\nYou help someone decide whether lending is prudent given what they know. You never predict repayment. Return ONLY valid JSON. No markdown. ' + NO_QUOTE_RULE, userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion),
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'MoneyDiplomatLend' });

    if (!parsed.recommendation) {
      return res.status(500).json({ error: 'Could not generate your script. Please try again.' });
    }
    res.json(validateResult(pinEnums(parsed)));

  } catch (error) {
    console.error('[MoneyDiplomatLend] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 10: WORK MONEY NAVIGATOR — Office money etiquette
// ═══════════════════════════════════════════════════
router.post('/money-diplomat-work', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { situation, role, companySize, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    if (!situation?.trim()) {
      return res.status(400).json({ error: 'Describe the work money situation.' });
    }

    const prompt = withLanguage(`Navigate this workplace money situation. Office money dynamics are especially tricky because of power imbalances, visibility, and the "optional but not really" pressure.

SITUATION: "${situation.trim()}"
YOUR ROLE: ${role?.trim() || 'Employee'}
COMPANY SIZE: ${companySize || 'Not specified'}

Return ONLY valid JSON:
{
  "assessment": {
    "type": "Collection|Gift pool|Expense|Lunch split|Salary talk|Other",
    "pressure_level": "None|Mild|Moderate|Heavy — how much social pressure is involved",
    "career_risk": "None|Low|Medium — could this affect how you're perceived"
  },
  "recommendation": {
    "action": "What to do — specific — one sentence",
    "amount": "How much to contribute/spend if applicable, as a compact figure in the user's currency (e.g. £20) — no sentence",
    "reasoning": "Why this is the right move for your situation — one sentence"
  },
  "if_opting_out": {
    "possible": true,
    "how": "How to opt out without looking cheap or disengaged — exact words — one sentence"
  },
  "scripts": [
    {
      "scenario": "A specific moment in this situation — one sentence",
      "say_this": "What to say — one sentence",
      "not_this": "What NOT to say — one sentence"
    }
  ],
  "the_unwritten_rule": "The thing nobody says out loud but everyone knows about workplace money in this type of situation — one sentence"
}`, userLanguage);

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 2000,
      system: withLanguage(MONEY_DIPLOMAT_V2 + '\n\nYou help someone handle a money question at work, using only what they described about their workplace. Return ONLY valid JSON. No markdown. ' + NO_QUOTE_RULE, userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion),
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'MoneyDiplomatWork' });

    if (!parsed.assessment) {
      return res.status(500).json({ error: 'Could not generate your script. Please try again.' });
    }
    res.json(validateResult(pinEnums(parsed)));

  } catch (error) {
    console.error('[MoneyDiplomatWork] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 11: TRAVEL MONEY GUIDE — Cultural money etiquette
// ═══════════════════════════════════════════════════
router.post('/money-diplomat-travel', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { destination, situation, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    if (!destination?.trim()) {
      return res.status(400).json({ error: 'Where are you going?' });
    }

    const prompt = withLanguage(`CULTURAL MONEY GUIDANCE

Do not describe a country, ethnicity, religion, region, or culture as having one
uniform money rule.

Do not infer an individual's expectations from their background.

Do not invent tipping, gift, bargaining, payment, hosting, wedding, family, or
business norms.

If a cultural norm is not verified, present it as something to check rather than
as a fact.

For two people from different backgrounds:
- use only the expectations they actually describe
- identify where those stated expectations differ
- propose language that makes expectations explicit

Never output a "culture clash risk" score.
Never say what an action "actually means in their culture".

DESTINATION: ${destination || 'Not supplied.'}
THE SITUATION: ${situation.trim()}

You do not have verified current knowledge of tipping, bargaining, payment or
hosting norms at this destination. Name what to check; do not assert it.

Return ONLY valid JSON:
{
  "what_you_have_described": ["What THEY told you about the trip or situation — one short line each"],
  "possible_mismatch": "Where their own habits may not match local practice, written as a possibility rather than a fact about the destination — one or two sentences",
  "what_not_to_assume": ["Something about the destination that must not be assumed — one short line each"],
  "questions_to_make_explicit": ["Something to check before they go, or ask when they arrive — one short line each. Tipping, card acceptance, bargaining and service charges all belong here"],
  "bridge": "A way to handle the moment gracefully whatever the local norm turns out to be — one or two sentences",
  "script": "Words they could say to ask rather than guess — 2-3 sentences"
}

ARRAY BOUNDS: what_you_have_described at most 4, what_not_to_assume at most 4, questions_to_make_explicit at most 5.

Return ONLY valid JSON.`, userLanguage);

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 3000,
      system: withLanguage(MONEY_DIPLOMAT_V2 + '\n\nYou help a traveller prepare for money situations abroad. You do not know current local norms, so you name what to check rather than asserting it. Return ONLY valid JSON. No markdown. ' + NO_QUOTE_RULE, userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion),
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'MoneyDiplomatTravel' });

    if (!parsed.bridge) {
      return res.status(500).json({ error: 'Could not generate your script. Please try again.' });
    }
    res.json(validateResult(pinEnums(parsed)));

  } catch (error) {
    console.error('[MoneyDiplomatTravel] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 13: DATE MONEY — Who pays on dates
// ═══════════════════════════════════════════════════
router.post('/money-diplomat-date', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { situation, dateNumber, dynamic, culturalContext, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    if (!situation?.trim()) {
      return res.status(400).json({ error: 'Describe the dating situation.' });
    }

    const prompt = withLanguage(`DATE MONEY

Do not assign meaning to who pays or suggest that splitting automatically
communicates interest, independence, generosity, commitment, gender expectations,
or relationship intent.

Do not infer what the other person expects.

Give options:
- one person offers
- split evenly
- alternate
- discuss before ordering

Explain the practical tradeoff of each without decoding hidden signals.

Do not output confidence percentages.

THE SITUATION: ${situation.trim()}
WHICH DATE: ${dateNumber || 'Not supplied.'}
WHAT THEY SAID ABOUT THE DYNAMIC: ${dynamic || 'Nothing supplied — do not invent one.'}
CULTURAL CONTEXT THEY SUPPLIED: ${culturalContext || 'Nothing supplied. Do not assume either person holds any particular expectation.'}

Return ONLY valid JSON:
{
  "options": [
    {
      "option": "One of: one person offers, split evenly, alternate, discuss before ordering",
      "how_it_works": "What doing this actually looks like — one or two sentences",
      "how_each_option_may_feel_or_function": "The practical tradeoff, written conditionally — what it MAY mean in practice for the evening, never what it signals about either person",
      "script": "Words they could say — one or two sentences"
    }
  ],
  "what_you_told_me": ["A fact THEY supplied that bears on this — one short line each"],
  "what_is_not_established": ["Something about the other person that was not supplied and must not be assumed — one short line each"],
  "if_it_comes_up_awkwardly": "What to say if the moment arrives and nobody has moved — 1-2 sentences"
}

ARRAY BOUNDS: options 3-4, what_you_told_me at most 4, what_is_not_established at most 3.

Return ONLY valid JSON.`, userLanguage);

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 2500,
      system: withLanguage(MONEY_DIPLOMAT_V2 + '\n\nYou lay out the practical options for who pays and what each one means in practice. You never decode what an option signals about anyone. Return ONLY valid JSON. No markdown. ' + NO_QUOTE_RULE, userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion),
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'MoneyDiplomatDate' });

    if (!parsed.options) {
      return res.status(500).json({ error: 'Could not generate your script. Please try again.' });
    }
    res.json(validateResult(pinEnums(parsed)));

  } catch (error) {
    console.error('[MoneyDiplomatDate] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 14: SUBSCRIPTION SPLITTER — Shared accounts & plans
// ═══════════════════════════════════════════════════
router.post('/money-diplomat-subs', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { situation, service, people, monthlyCost, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    if (!situation?.trim()) {
      return res.status(400).json({ error: 'Describe the shared subscription situation.' });
    }

    const prompt = withLanguage(`Figure out the fair split for this shared subscription or account. Account for actual usage, who set it up, who added extras, and the awkward dynamics of wanting to leave.

SITUATION: "${situation.trim()}"
SERVICE: ${service || 'Not specified'}
PEOPLE SHARING: ${people?.trim() || 'Not specified'}
MONTHLY COST: ${monthlyCost || 'Not specified'}

Return ONLY valid JSON:
{
  "fair_split": [
    {
      "person": "Person description — one sentence",
      "amount": "monthly amount as a compact figure in the user's currency (e.g. £40/month) — no sentence",
      "reasoning": "Why this amount — usage, who manages it, who added extras — one sentence"
    }
  ],
  "the_wrinkle": "The specific complication in this situation — e.g., 'One person barely uses it but was on from the start' — one sentence",
  "manager_premium": {
    "applicable": true,
    "discount": "The person managing the account/payment should get X off — managing is work — one sentence",
    "reasoning": "Why the person who deals with the billing deserves a small break — one sentence"
  },
  "if_leaving": {
    "how_to_say_it": "Exact words to say when you want off the plan — one sentence",
    "transition": "How to handle the transition so nobody loses access suddenly — one sentence"
  },
  "alternatives": "Is there a better way to structure this? — e.g., 'At 18/month split 4 ways, you're each paying 4.50. Individual plans are 7. The savings are real but so is the drama. Worth it?' — one sentence"
}`, userLanguage);

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 2000,
      system: withLanguage(MONEY_DIPLOMAT_V2 + FAIRNESS_RULE + '\n\nYou split a shared subscription from the figures supplied, including the work of managing it if they mentioned it. Return ONLY valid JSON. No markdown. ' + NO_QUOTE_RULE, userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion),
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'MoneyDiplomatSubs' });

    if (!parsed.fair_split) {
      return res.status(500).json({ error: 'Could not generate your script. Please try again.' });
    }
    res.json(validateResult(pinEnums(parsed)));

  } catch (error) {
    console.error('[MoneyDiplomatSubs] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 15: DEBT NUDGE — Generate reminder message for outstanding debt
// ═══════════════════════════════════════════════════
router.post('/money-diplomat-nudge', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { personName, amount, context, daysSince, relationship, attempts, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    if (!personName?.trim() || !amount) {
      return res.status(400).json({ error: 'Who owes you and how much?' });
    }

    const prompt = withLanguage(`A REMINDER ABOUT MONEY OWED

Write a reminder using only:
- amount
- original agreement if supplied
- date/timing
- previous reminders
- context supplied by the user

Do not infer why they have not paid.
Do not accuse them of avoidance.
Do not predict that a particular tone will "work".

WHO: ${personName || 'Not supplied.'}
AMOUNT: ${amount || 'Not supplied.'}
WHAT IT WAS FOR: ${context || 'Not supplied.'}
DAYS SINCE: ${daysSince || 'Not supplied.'}
RELATIONSHIP: ${relationship || 'Not supplied.'}
REMINDERS ALREADY SENT: ${attempts || 'None supplied.'}

Return ONLY valid JSON:
{
  "message": "The reminder, ready to send — 2-4 sentences. Built only from the facts above",
  "why_this_wording": "What the wording does — what it leads with, what it leaves out. Never a claim about how they will react",
  "what_you_supplied": ["A fact from the list above that the message uses — one short line each"],
  "if_no_reply": "What a next step could be, described as an option rather than a prediction — 1-2 sentences"
}

ARRAY BOUNDS: what_you_supplied at most 4.

Return ONLY valid JSON.`, userLanguage);

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 4000,
      system: withLanguage(MONEY_DIPLOMAT_V2 + '\n\nYou write a reminder from what the user supplied. You never guess why the money has not arrived. Return ONLY valid JSON. No markdown. ' + NO_QUOTE_RULE, userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion),
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'MoneyDiplomatNudge' });

    if (!parsed.message) {
      return res.status(500).json({ error: 'Could not generate your script. Please try again.' });
    }
    res.json(validateResult(pinEnums(parsed)));

  } catch (error) {
    console.error('[MoneyDiplomatNudge] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 16: SALARY NEGOTIATION — How much to ask for
// ═══════════════════════════════════════════════════
router.post('/money-diplomat-salary', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { situation, currentSalary, targetRole, location, experience, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    if (!situation?.trim()) {
      return res.status(400).json({ error: 'Describe the negotiation situation.' });
    }

    const prompt = withLanguage(`SALARY TALK

Money Diplomat is helping the user prepare for the conversation.
It is not a salary-market-data tool.

Do not invent:
- market salary
- target salary
- likely outcome
- likely counteroffer
- employer budget
- hiring-manager psychology
- company constraints
- leverage not supplied by the user

If the user supplies a desired figure, help frame and defend it.

If no defensible target is supplied, recommend verifying compensation data rather
than manufacturing a number.

Use the epistemic standard above: ESTABLISHED / REASONABLE IMPLICATION / UNKNOWN.

Scripts can be confident.
Factual premises cannot exceed the supplied evidence.

THE SITUATION: ${situation.trim()}
CURRENT SALARY: ${currentSalary || 'Not supplied.'}
ROLE: ${targetRole || 'Not supplied.'}
LOCATION: ${location || 'Not supplied.'}
EXPERIENCE: ${experience || 'Not supplied.'}

Return ONLY valid JSON:
{
  "what_you_can_make_the_case_from": ["Something THEY supplied that supports an ask — one short line each"],
  "what_you_still_need_to_know": ["Something they would need before naming a number, including compensation data if they gave no target — one short line each"],
  "ask": {
    "amount": "The figure they supplied, or an empty string if they gave none. Never invent one",
    "basis": "What the ask rests on, drawn only from what they supplied — one or two sentences",
    "script": "Words they could say in the room — 3-5 sentences"
  },
  "if_they_push_back": [
    { "situation": "A response they might get — described as a situation, not a prediction", "response": "What to say — 1-2 sentences" }
  ],
  "other_terms_to_consider": ["Something other than base pay worth raising — one short line each"]
}

ARRAY BOUNDS: what_you_can_make_the_case_from at most 5, what_you_still_need_to_know at most 4, if_they_push_back 2-4, other_terms_to_consider at most 5.

Return ONLY valid JSON.`, userLanguage);

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 3000,
      system: withLanguage(MONEY_DIPLOMAT_V2 + '\n\nYou help someone prepare for a compensation conversation. You are not a salary-data source and you never invent a number. Return ONLY valid JSON. No markdown. ' + NO_QUOTE_RULE, userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion),
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'MoneyDiplomatSalary' });

    if (!parsed.ask) {
      return res.status(500).json({ error: 'Could not generate your script. Please try again.' });
    }
    res.json(validateResult(pinEnums(parsed)));

  } catch (error) {
    console.error('[MoneyDiplomatSalary] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 17: AFFORD CHECK — Can I actually afford this?
// ═══════════════════════════════════════════════════
router.post('/money-diplomat-afford', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { situation, cost, income, context, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    if (!situation?.trim()) {
      return res.status(400).json({ error: 'Describe what you\'re considering.' });
    }

    const prompt = withLanguage(`AFFORD CHECK

Do not say "you can afford it" unless the user has supplied enough information.

Cost and income alone are insufficient for a genuine affordability determination.

State what was included and what was not.

Do not output confidence percentages.
Do not infer spending habits, financial discipline, priorities, or emotional motives.

WHAT THEY WANT TO BUY: ${situation.trim()}
COST: ${cost || 'Not supplied.'}
INCOME: ${income || 'Not supplied.'}
ANYTHING ELSE THEY SAID: ${context || 'Nothing supplied.'}

Return ONLY valid JSON:
{
  "gut_check": "Exactly one of these English strings: Looks manageable, Worth a closer look, Looks difficult, Not enough information",
  "what_the_numbers_show": ["Arithmetic from the figures they supplied, and nothing beyond it — one short line each"],
  "what_is_missing": ["Something a real affordability answer needs that they did not supply — one short line each. Cost and income alone are not enough, so this is rarely empty"],
  "questions_to_check": ["A question they can answer for themselves before deciding — one short line each"],
  "low_regret_next_step": "The move that is hardest to regret either way — one or two sentences"
}

ARRAY BOUNDS: what_the_numbers_show at most 4, what_is_missing at most 4, questions_to_check at most 4.

Return ONLY valid JSON.`, userLanguage);

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 4000,
      system: withLanguage(MONEY_DIPLOMAT_V2 + '\n\nYou give an honest read on affordability from the numbers supplied, and say plainly what was not supplied. Return ONLY valid JSON. No markdown. ' + NO_QUOTE_RULE, userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion),
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'MoneyDiplomatAfford' });

    if (!parsed.gut_check) {
      return res.status(500).json({ error: 'Could not generate your script. Please try again.' });
    }
    res.json(validateResult(pinEnums(parsed)));

  } catch (error) {
    console.error('[MoneyDiplomatAfford] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 18: INHERITANCE — Navigating estate money
// ═══════════════════════════════════════════════════
router.post('/money-diplomat-inheritance', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { situation, familyDynamic, culturalContext, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    if (!situation?.trim()) {
      return res.status(400).json({ error: 'Describe the inheritance situation.' });
    }

    const prompt = withLanguage(`INHERITANCE

Do not treat inheritance disputes as evidence of grief dynamics, entitlement,
favoritism, resentment, family hierarchy, or hidden history unless supplied.

Do not provide jurisdiction-specific legal or tax conclusions without verified facts.

Do not decide whether an estate "should" be split equally or equitably as though
there is one objectively correct answer.

THE SITUATION: ${situation.trim()}
WHAT THEY SAID ABOUT THE FAMILY: ${familyDynamic || 'Nothing supplied — do not invent a dynamic.'}
CULTURAL CONTEXT THEY SUPPLIED: ${culturalContext || 'Nothing supplied.'}

Return ONLY valid JSON:
{
  "arrangement_considered": "What arrangement is on the table, from what they described — one or two sentences",
  "principles_in_tension": [
    { "principle": "A fairness principle in play here — equal shares, need, contribution, the deceased's stated wishes, and so on", "pulls_toward": "What this principle would favour — one short line" }
  ],
  "facts_that_matter": ["Something that would change the answer — one short line each"],
  "needs_professional_confirmation": ["Something only an executor, solicitor or tax professional can settle — one short line each. Never resolve these here"],
  "conversation": {
    "opener": "How to raise it — 1-2 sentences",
    "what_to_clarify": ["Something to get said out loud — one short line each"]
  }
}

ARRAY BOUNDS: principles_in_tension 2-4, facts_that_matter at most 5, needs_professional_confirmation at most 4, what_to_clarify at most 4.

Return ONLY valid JSON.`, userLanguage);

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 3000,
      system: withLanguage(MONEY_DIPLOMAT_V2 + '\n\nYou help someone think through an inheritance question practically, and name what needs professional confirmation. Return ONLY valid JSON. No markdown. ' + NO_QUOTE_RULE, userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion),
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'MoneyDiplomatInheritance' });

    if (!parsed.arrangement_considered) {
      return res.status(500).json({ error: 'Could not generate your script. Please try again.' });
    }
    res.json(validateResult(pinEnums(parsed)));

  } catch (error) {
    console.error('[MoneyDiplomatInheritance] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 19: CULTURAL TRANSLATOR — Cross-cultural money in your city
// ═══════════════════════════════════════════════════
router.post('/money-diplomat-cultural', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { yourBackground, theirBackground, situation, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    if (!yourBackground?.trim() || !theirBackground?.trim()) {
      return res.status(400).json({ error: 'Describe both cultural backgrounds.' });
    }

    const prompt = withLanguage(`CULTURAL MONEY GUIDANCE

Do not describe a country, ethnicity, religion, region, or culture as having one
uniform money rule.

Do not infer an individual's expectations from their background.

Do not invent tipping, gift, bargaining, payment, hosting, wedding, family, or
business norms.

If a cultural norm is not verified, present it as something to check rather than
as a fact.

For two people from different backgrounds:
- use only the expectations they actually describe
- identify where those stated expectations differ
- propose language that makes expectations explicit

Never output a "culture clash risk" score.
Never say what an action "actually means in their culture".

WHAT THEY SAID ABOUT THEIR OWN BACKGROUND: ${yourBackground || 'Nothing supplied.'}
WHAT THEY SAID ABOUT THE OTHER PERSON: ${theirBackground || 'Nothing supplied. A background is not an expectation — do not derive one.'}
THE SITUATION: ${situation.trim()}

Return ONLY valid JSON:
{
  "what_you_have_described": ["An expectation one of them ACTUALLY stated — one short line each. Never an expectation inferred from a background"],
  "possible_mismatch": "Where the stated expectations may differ, written as a possibility — one or two sentences. Empty string if only one side's expectations were described",
  "what_not_to_assume": ["Something a background does NOT establish about this person — one short line each"],
  "questions_to_make_explicit": ["A question that would surface the real expectation instead of guessing at it — one short line each"],
  "bridge": "A way to handle the moment that works whatever the expectations turn out to be — one or two sentences",
  "script": "Words they could actually say to make expectations explicit — 2-4 sentences"
}

ARRAY BOUNDS: what_you_have_described at most 5, what_not_to_assume at most 4, questions_to_make_explicit at most 4.

Return ONLY valid JSON.`, userLanguage);

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 2500,
      system: withLanguage(MONEY_DIPLOMAT_V2 + '\n\nYou help two people make their money expectations explicit to each other, using only the expectations they each describe. Return ONLY valid JSON. No markdown. ' + NO_QUOTE_RULE, userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion),
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'MoneyDiplomatCultural' });

    if (!parsed.bridge) {
      return res.status(500).json({ error: 'Could not generate your script. Please try again.' });
    }
    res.json(validateResult(pinEnums(parsed)));

  } catch (error) {
    console.error('[MoneyDiplomatCultural] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 20: CHARITY CALIBRATOR — How much to donate/contribute
// ═══════════════════════════════════════════════════
router.post('/money-diplomat-charity', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { situation, askType, relationship, amount, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    if (!situation?.trim()) {
      return res.status(400).json({ error: 'Describe the donation/contribution ask.' });
    }

    const prompt = withLanguage(`DONATIONS

Do not say a donation is tax-deductible or likely deductible unless verified
for the user's jurisdiction and recipient organization.

Where tax comes up at all, say: tax treatment depends on jurisdiction and the
recipient's status; verify before relying on a deduction.

THE SITUATION: ${situation.trim()}
KIND OF ASK: ${askType || 'Not supplied.'}
RELATIONSHIP TO WHOEVER IS ASKING: ${relationship || 'Not supplied.'}
AMOUNT: ${amount || 'Not supplied.'}

Return ONLY valid JSON:
{
  "recommendation": "What to do — one or two sentences",
  "why": ["Reasoning grounded in what they supplied — one short line each"],
  "amount_guidance": "A range or approach they would be comfortable with, in their currency. Never a figure presented as the correct one",
  "tax_note": "Tax treatment depends on jurisdiction and the recipient's status; verify before relying on a deduction. Say nothing more specific than that",
  "script": "Words they could say, whether giving or declining — 2-4 sentences",
  "if_they_push": "What to say if the ask is repeated — 1-2 sentences"
}

ARRAY BOUNDS: why 2-4.

Return ONLY valid JSON.`, userLanguage);

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 2000,
      system: withLanguage(MONEY_DIPLOMAT_V2 + '\n\nYou help someone decide what to give. Tax treatment depends on jurisdiction and the recipient status, and you never assert it. Return ONLY valid JSON. No markdown. ' + NO_QUOTE_RULE, userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion),
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'MoneyDiplomatCharity' });

    if (!parsed.recommendation) {
      return res.status(500).json({ error: 'Could not generate your script. Please try again.' });
    }
    res.json(validateResult(pinEnums(parsed)));

  } catch (error) {
    console.error('[MoneyDiplomatCharity] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 21: SCENARIO SIMULATOR — Practice money conversations
// ═══════════════════════════════════════════════════
router.post('/money-diplomat-simulate', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { situation, otherPerson, userResponse, conversationHistory, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    if (!situation?.trim()) {
      return res.status(400).json({ error: 'Describe the money situation to practice.' });
    }


    // If no user response yet, start the simulation
    if (!userResponse) {
      const prompt = withLanguage(`PRACTICE MODE

The other person is simulated, not predicted.

Never imply the simulated response reflects what the real person is likely to say,
feel, intend, or do.

Generate one plausible response that tests the user's ability to communicate their
request or boundary.

Do not invent new factual history between the parties.

When coaching the user's response:
- evaluate clarity
- identify unsupported claims
- identify whether the request/boundary is clear
- suggest a stronger phrasing

Do not psychoanalyze either person.

THE SITUATION: ${situation.trim()}
WHO THEY ARE REHEARSING WITH: ${otherPerson || 'Not supplied — keep the other person generic rather than inventing a character.'}

Open the rehearsal. One plausible opening line, nothing about what the real
person would say.

Return ONLY valid JSON:
{
  "scene": "One sentence setting where this is happening, using only what they supplied",
  "opening_line": "What the simulated other person says first — 1-2 sentences",
  "what_this_tests": "What the user has to do well to handle this opening — one sentence"
}

Return ONLY valid JSON.`, userLanguage);

      const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 1000,
      system: withLanguage(MONEY_DIPLOMAT_V2 + '\n\nYou play ONE plausible version of the other person so the user can rehearse. A simulation, never a prediction of what the real person would say, feel or do. Return ONLY valid JSON. No markdown. ' + NO_QUOTE_RULE, userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion),
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'MoneyDiplomatSimStart' });
      return res.json({ type: 'prompt', ...parsed });
    }

    // Evaluate response and continue
    const historyCtx = conversationHistory?.map(h => `Them: "${h.them}" You: "${h.you}"`).join('\n') || '';

    const prompt = withLanguage(`PRACTICE MODE

The other person is simulated, not predicted.

Never imply the simulated response reflects what the real person is likely to say,
feel, intend, or do.

Generate one plausible response that tests the user's ability to communicate their
request or boundary.

Do not invent new factual history between the parties.

When coaching the user's response:
- evaluate clarity
- identify unsupported claims
- identify whether the request/boundary is clear
- suggest a stronger phrasing

Do not psychoanalyze either person.

THE SITUATION: ${situation.trim()}
WHAT THE USER JUST SAID: ${userResponse || ''}
THE REHEARSAL SO FAR: ${historyCtx || 'Just started.'}

Return ONLY valid JSON:
{
  "coaching": {
    "clarity": "Was the request or boundary actually clear? — one or two sentences about the WORDS, not the person",
    "unsupported_claims": ["Something they asserted that their own situation does not support — one short line each. Empty array if none"],
    "stronger_phrasing": "A sharper version of what they were trying to say — 1-2 sentences"
  },
  "reply": "One plausible next line from the simulated other person — 1-2 sentences. Not a prediction",
  "keep_going": true
}

ARRAY BOUNDS: unsupported_claims at most 3.

Return ONLY valid JSON.`, userLanguage);

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 1500,
      system: withLanguage(MONEY_DIPLOMAT_V2 + '\n\nYou play one plausible version of the other person and coach the user reply. The simulation is not a prediction of anyone. Return ONLY valid JSON. No markdown. ' + NO_QUOTE_RULE, userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion),
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'MoneyDiplomatSimEval' });

    res.json({ type: 'evaluation', ...parsed });

  } catch (error) {
    console.error('[MoneyDiplomatSim] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// Reviewed against backend/lib/outputStandard.js during the 2026-09-04 rewrite.
router.outputStandard = 'v2';
router.outputGuard = {
  checks: ['validateResult'],
  note: 'predicted outcomes and reactions, visible spending read as evidence about a person, an invented real-issue-underneath, a culture given one uniform money rule, and tax or legal conclusions are all blanked in code. The three verdict enums are pinned to English because the frontend switches on them. The money-profile and monthly-recap routes were deleted rather than repaired: both built a personality out of usage.',
};

module.exports = router;
