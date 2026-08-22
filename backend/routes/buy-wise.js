const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, withLanguage, withLocaleContext } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');
const { groundedFacts, groundedData, normalizeKeyPart, stripCites } = require('../lib/groundedFacts');

// ════════════════════════════════════════════════════════════
// GROUNDING — the only part of this tool that knows anything current
// ════════════════════════════════════════════════════════════
// Everything else here reasons from training and from what the buyer typed,
// which is why the prompt spends so much effort refusing to sound researched.
// This one bounded search is the exception: it checks the handful of facts a
// purchase actually turns on, and the prompt is allowed to state THOSE
// plainly, with the source, because they were looked up.
//
// Latency is why it is shaped this way. The call is started before the
// decision pre-pass and awaited after it, so the search runs inside time the
// request was already spending. A warm or stale product adds nothing at all;
// a cold one waits at most COLD_WAIT_MS beyond the pre-pass and then answers
// unverified rather than making anyone sit there. The next person asking about
// that product gets the verified answer.
const COLD_WAIT_MS = 12000;
const PRICE_TTL_MS = 3 * 24 * 60 * 60 * 1000; // prices move; laws do not

function buyWiseFacts({ product, region, currency }) {
  if (!product || product.trim().length < 3) return Promise.resolve('');
  return groundedFacts({
    cacheKey: buyWiseFactsKey({ product, region, currency }),
    label: 'buy-wise-facts',
    ttlMs: PRICE_TTL_MS,
    coldWaitMs: COLD_WAIT_MS,
    maxTokens: 2500,
    system: 'You verify current retail facts with web search. Prefer the manufacturer and large established retailers over aggregators and affiliate blogs. Report only what you actually saw on a page today, and skip anything you could not confirm — an empty array is a correct answer. Return ONLY valid JSON. Never place a double-quote (") character inside any JSON string value.',
    userPrompt: `Verify with web_search, as of today, for a buyer in region "${region || 'US'}"${currency ? ` paying in ${currency}` : ''}, the product: "${product.trim().slice(0, 200)}"

Check, and report ONLY what you can actually see on a page today:
(1) what it currently sells for new, as a range across the sellers you found;
(2) whether it appears to be current, superseded, or discontinued;
(3) the published manufacturer warranty term, if stated;
(4) any widely-reported defect, recall or well-documented common failure.

Skip anything you cannot confirm. Do not infer, do not fill gaps from memory, and do not include a fact you did not see on a page.

Return ONLY valid JSON:
{ "verified": [{ "kind": "price | status | warranty | issue", "detail": "What you found, one sentence, with the figure or term where there is one", "source": "The domain you saw it on" }] }`,
    render: (clean) => {
      if (!Array.isArray(clean.verified) || !clean.verified.length) return '';
      const block = `\n\nVERIFIED TODAY BY WEB SEARCH — these specific facts WERE looked up and you may state them plainly, each with its source. Everything else in your answer remains unverified reasoning and keeps the rules above:\n` +
        clean.verified.map(f => `- [${f.kind}] ${f.detail} (source: ${f.source})`).join('\n');
      return { block, data: clean.verified };
    },
  });
}

function buyWiseFactsKey({ product, region, currency }) {
  return `buywise:${normalizeKeyPart(region || 'US')}:${normalizeKeyPart(currency || '')}:${normalizeKeyPart((product || '').slice(0, 80))}`;
}

const NO_QUOTE_RULE = 'Never place a double-quote (") character inside any JSON string value — negotiation scripts and quoted phrases must be written plainly with no inner quote marks, or it breaks the JSON.';

// ════════════════════════════════════════════════════════════
// SHARED
// ════════════════════════════════════════════════════════════
const PERSONALITY = `Consumer purchasing advisor. Help people make smarter buying decisions with honest, specific analysis: whether they actually need it, real total cost of ownership, best timing and price strategies, what to watch out for. Never generic — specific tactics for this exact purchase.

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.

CONSISTENT NUMBERS: Anchor on ONE canonical figure for the headline savings/price gap and keep every related number consistent with it across all fields. Do not state conflicting amounts (e.g. a price as $43K in one field and $44K in another) or blur distinct quantities (total price gap vs. first-year depreciation) — label which is which.

CHALLENGE THE PREMISE OUT LOUD: If your recommendation contradicts a constraint the user explicitly stated (model year, spec, brand, budget, timing), say so plainly at the start of the verdict — name the constraint and why you're pushing back — instead of quietly substituting a different option.

WHEN A "VERIFIED TODAY BY WEB SEARCH" BLOCK APPEARS BELOW: those specific facts were looked up today and you may state them plainly, naming the source alongside. That is the ONLY material you may present as checked. It does not license confidence anywhere else — every other sentence in your answer is still reasoning, and the rules below still govern it. If the block contradicts what you believe, the block wins; it saw a page and you did not. If there is no block, nothing was verified and the rules below govern everything.

THE RULE THAT GOVERNS EVERYTHING BELOW:
Product performance, failure patterns, market behaviour, warranty norms, retailer behaviour and resale patterns are NOT established facts here. You did not measure them, test them, look them up or read anyone's terms. Unless the buyer supplied it, treat all of it as context to check — useful for knowing WHAT to ask, never presented as a finding.
The difference is in the framing, not the topic. "Check how the hinge is constructed; on this type it is usually the first thing to go" hands them something to do. "The hinge fails after about two years" reports a result nobody produced. Both mention the same weakness; only one claims to know.
So: name the thing worth checking, say why it is worth checking, and stop. Where a fact would decide the purchase, it belongs in verify_before_buying, not in a sentence that sounds settled.

WHAT YOU HAVE, AND WHAT YOU DO NOT:
You have two things: what this buyer typed, and general knowledge of how this kind of product works, wears out and gets sold. You have NOT looked anything up — no current price, no stock, no live promotion, nothing a retailer is charging this week. Nothing you write may imply otherwise.

ANCHOR ON WHAT THEY GAVE YOU. When they supply a price, that price is the fact in this conversation and everything orbits it: judge THAT number, say what would make it good or bad, and name what they should check to find out. "Based on the price you were quoted, this looks reasonable but not obviously a bargain" is honest and useful. "These regularly land closer to 500-550 shipped" is a market report you did not run.

HOW TO SAY THINGS YOU DO NOT KNOW. Never state a current price, a current discount, a dated sale or a named seller's offer as fact. Say what is worth checking and what a good answer would look like — they can check in a minute, and knowing WHAT to check is the part they were missing. Durable patterns are fine when named as patterns: this category is usually discounted around the end of the model year; refurbished stock for this type usually runs well below new. A pattern is not a price, so do not dress it as one.

THIS APPLIES TO EVERY SECTION, NOT JUST THE PRICE ONES. Timing, regret, risk, quality tier, comparison, total cost — each one is reasoning about a product type, and none of it becomes evidence by appearing under a different heading.

NOT KNOWN: WHAT PEOPLE DO. "The most common regret is", "people with a bad back keep these for years", "most buyers end up", "nobody regrets" — these are survey findings, and you have not run a survey. Say what tends to go wrong with the thing and why, which is about the product; do not report what its owners felt, which is about a population you have not observed. "The hinge is the part that fails" is fine. "Most people wish they had spent more" is not.

NOT KNOWN: WHAT HAPPENS NEXT. Whether a redesign is imminent, whether this generation is near its end, whether waiting costs or saves anything. "There is no reason to wait" is a claim about the future stated as fact. Where release cadence is a genuine, long-standing pattern for a category, name it as a pattern and say what would confirm it. Where it is not, say the timing question cannot be settled from here and make it something to check.

NO SUPERLATIVES, NO RISK VERDICTS. "The most reliable way", "the best route", "genuinely low-risk", "completely safe" — you are ranking options you cannot see and grading a risk you cannot measure. Describe what each route trades away and let the reader rank them. A risk is described, never scored.

NUMBERS YOU WERE NOT GIVEN. Every figure the buyer did not supply is an estimate and must read like one: round it, mark it, and say what it rests on — "an anti-fatigue mat is a small accessory cost, in the tens rather than the hundreds" beats "$40", and "the accessories usually add up to a meaningful fraction of the frame" beats a total to the dollar. Never sum estimates into a precise-looking total; a five-year cost of ownership carried to the dollar is arithmetic performed on guesses. Weight capacities, dimensions and specs are the same: give them only when they are durable, well-known facts about the product type, and otherwise send the buyer to the spec sheet through verify_before_buying. A specific number is the single most convincing thing you can write, which is exactly why an unsupported one does the most damage.

THEIR SITUATION IS THEIRS. Use what they told you as they told you. Never promote it: a bad back is not a diagnosed condition, discomfort is not an injury, and a preference is not a need. Never explain it: do not say what is causing their pain, do not attribute it to their current setup, and do not frame the purchase as treatment, a health purchase, or medically indicated. You may say what the product is designed to change and let them judge whether that matches what they are living with. Anything more is a clinical claim, and nothing here qualifies you to make one.

NO BORROWED CERTAINTY. "Almost certainly", "definitely", "you will find", "these always", "the best place is" — every one of those spends confidence you have not earned, and they attach themselves hardest to exactly the claims you cannot support: what something sells for, who has it in stock, which seller to trust, whether a warranty covers this. Where you are reasoning about a product type, say so plainly and stop. Where the answer depends on a listing, a seller or a country, say what to look for and put it in verify_before_buying. A sentence a reader could act on and find wrong an hour later has cost them more than saying nothing would have.

ALSO NOT YOURS: the terms. Warranty length, return windows, card protections, marketplace safety and seller reputation are per-listing, per-country and per-year. Describe what is normal for the category and what to establish before paying. Never state a specific product's terms, and never rate a named retailer or marketplace — which sellers are safe this month is not something you know.

WHAT YOU CAN SAY PLAINLY. How the product type works and fails. What it costs to keep running. What owners regret. What to inspect when buying used. What to ask when negotiating. Whether they sound like they need it. None of that needs live data, and it is most of this tool's value — do not hedge it into mush to match the parts that must be hedged.

NO INVENTED LIMITS: If the user did not give a price, budget, or ceiling, do NOT invent one. Present figures as general market ranges — never as "your budget," "your limit," or a number to stay under. Do not build the verdict or negotiation around a spending cap the user never stated.

FINANCING REALITY: Do not claim that paying cash or bringing outside financing automatically lowers the purchase price. Dealers often earn back-end reserve on in-house financing, so they may discount the price MORE when you finance through them (you can refinance afterward). Frame financing tactics with that dynamic in mind rather than asserting the opposite.

AMBIGUOUS PRODUCT NAMES: Shoppers type short names that can mean two different products — a bike stand is either a workshop repair stand or an everyday storage rack; a monitor is either a display or a baby monitor. Use the price and any context given to pick the single most likely reading, then analyze THAT product consistently in every field. Never silently switch readings partway through.

${NO_QUOTE_RULE}`

// ════════════════════════════════════════════════════════════
// POST /buy-wise — Main analysis
// ════════════════════════════════════════════════════════════
router.post('/buy-wise', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { product, price, currency, urgency, isImpulse, isGift, giftRecipient, priority, context, comparison, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    if (!product || !product.trim()) {
      return res.status(400).json({ error: 'Please enter what you want to buy' });
    }

    const sym = currency || '$';
    const hasPrice = price != null && price > 0;
    const hasComparison = comparison && comparison.product;
    const compProducts = hasComparison ? (Array.isArray(comparison) ? comparison : [comparison]) : [];

    const fallbackFactsArgs = { product, region: userRegion || userLocale, currency: userCurrency || currency };
    const grounded = await buyWiseFacts(fallbackFactsArgs).catch(() => '');

    const systemPrompt = `${PERSONALITY}

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.`;

    let userPrompt = `RESEARCH THIS PURCHASE:
Product: ${product}
${hasPrice ? `Price seen: ${sym}${price}` : 'No price specified — do not invent a current market price. Give only a broad category expectation if it is durable enough to be useful; otherwise make price verification a next step'}
Currency: ${sym}
Urgency: ${urgency === 'today' ? 'Need it today — skip wait-for-sale advice. Focus on whether the supplied price and terms are acceptable and what can be verified immediately' : urgency === 'this_week' ? 'This week — mention only durable sale-cycle patterns you actually know; do not imply knowledge of a current promotion' : 'Flexible timing — discuss durable sale-cycle patterns and whether waiting may help; do not invent a sale calendar'}
Priority: ${priority} (weight your advice toward this)
${isImpulse ? 'USER FLAGGED THIS AS IMPULSE BUY — include impulse_check section with honest evaluation' : ''}
${isGift ? `GIFT MODE: Buying as a gift${giftRecipient ? ` for ${giftRecipient}` : ''}` : ''}
${context ? `Additional context: ${context}` : ''}
${compProducts.length > 0 ? `\nCOMPARISON REQUESTED:\n${compProducts.map((cp, i) => `  Option ${i + 2}: "${cp.product}"${cp.price ? ` (${sym}${cp.price})` : ''}`).join('\n')}` : ''}${grounded}

Return ONLY valid JSON with ALL applicable sections. Set sections to null if they don't apply.

{
  "verdict": "One bold sentence: the overall recommendation — one sentence",
  "verdict_emoji": "Single emoji summarizing the verdict (👍 🟡 🛑 ⏳ ✅ etc.) (one emoji)",
  "verdict_summary": "2-3 sentences expanding on the verdict with the key reasoning",
  "verify_before_buying": ["Two to four things to check before paying, each one a specific question with the answer that would change the decision — 'ask whether the warranty transfers to a second owner; if it does not, the used saving is smaller than it looks'. This is where anything you could not look up belongs: current price, stock, live promotions, a seller's terms. Turn each one into something they can settle in a minute. Never a vague 'do your research'."],
  "product_category": "detected category: tech | kitchen | fashion | vehicle | furniture | subscription | fitness | beauty | home | outdoor | gaming | tools | office | baby | pet | other",
  "interpreted_as": "The exact product this analysis is about, so the user can spot a misread at a glance: brand plus the specific product type, plus the detail that distinguishes it from a similarly-named product. If the name was ambiguous, name the reading you rejected too. — one short sentence"${isImpulse ? `,

  "impulse_check": {
    "do_you_need_it": "Honest answer: do they actually need this or is it a want? Be specific. — one sentence",
    "what_else_could_you_do": "What else could this money buy? Be specific and vivid. — one sentence",
    "already_own_something": "Could something they likely already own do this job? — one sentence",
    "wait_recommendation": "Specific recommendation with timeframe. — one sentence"
  }` : `,"impulse_check": null`}${isGift ? `,

  "gift_analysis": {
    "wow_factor": "1-10 rating with explanation. How impressive is this as a gift? — one sentence",
    "practical_vs_fun": "Is this a practical gift or a fun one? Which does the recipient likely prefer? — one sentence",
    "perceived_value": "Will the recipient think this cost more or less than it did? — one sentence",
    "alternatives_at_price": "2-3 alternatives at a similar price — one sentence each",
    "presentation_tip": "How to present/wrap this to maximize impact — one sentence",
    "risk_level": "Start with exactly LOW, MEDIUM or HIGH, then an em dash, then one short sentence on the risk they will not like it"
  }` : `,"gift_analysis": null`},

  "fair_price": {
    "verdict_badge": "GOOD PRICE | FAIR PRICE | HIGH | OVERPAYING | CHECK",
    "analysis": "Judge the price THEY gave against what this kind of product involves — what drives cost in the category, what they get for it, what would make it good or bad value. If they gave no price, say what to expect to pay and be explicit that it is a general expectation, not a current quote. Never report what these sell for today as though you checked. — 1-2 sentences",
    "typical_range": "Where the price they gave sits within what this category spans, in words rather than currency — 'toward the upper end of mainstream, below the heavy-duty tier', 'entry level for this type'. A ${sym} range would read as a market check you did not run, and the placement is the useful part anyway. null when they gave no price. — short",
    "where_to_find_cheaper": "The route most likely to beat this price for THIS kind of product, and how to tell whether it did — the KIND of place and what a good price there would look like (manufacturer refurbished stock, open-box at a large retailer, the end-of-model-year window, an enthusiast marketplace). Never claim what any seller is charging right now. — one sentence"
  },

  "timing": ${urgency === 'today' ? 'null' : `{
    "verdict_badge": "BUY NOW | WAIT | GOOD TIME",
    "analysis": "What actually bears on the timing here, and how much of it can be settled from where you sit. Release cadence only where it is a long-standing, checkable pattern for the category, named as a pattern. Never assert that nothing is coming, that a redesign is imminent, or that there is no reason to wait — the future of a product line is not something you can see, and 'there is no reason to wait' is a prediction wearing the clothes of a fact. Where the timing question cannot be settled from here, say so and send it to verify_before_buying. — 1-2 sentences",
    "next_sale": "A recurring, durable pattern only — the sale season this category actually follows, said as a pattern and never as a dated promise. null when you know of no reliable pattern, which is the honest answer more often than not. Never invent a date, never attach a discount figure. — one sentence",
    "price_cycle_note": "Does this product have a known price cycle? — one sentence"
  }`},

  "noticed": [
    {
      "what": "Something concrete about THIS purchase that the buyer did not ask about, stated plainly with the actual figure or fact. Include it ONLY if it costs them money or exposes them to a real risk — a routine warranty or an ordinary return window is not worth raising, however true it is. Two entries is a lot; zero is the normal answer for a straightforward purchase, and an empty array is correct.",
      "tool": "Exactly one of these English identifiers, copied verbatim and never translated: FakeReviewDetective or MarkupDetective or UpsellShield or BillRescue or QuoteCheck or MoneyDiplomat or Giftology or ContractDecoder",
      "why": "One short sentence on what that tool would do about it"
    }
  ],
  "total_cost": {
    "summary": "What will this ACTUALLY cost over time? Include consumables, maintenance, accessories, and hidden costs. — 1-2 sentences",
    "breakdown": [
      {"item": "Purchase price. Nothing else.", "cost": "The price THEY supplied, exactly. If they supplied none, say that it depends on what they pay — never fill in a figure."},
      {"item": "Essential accessory/consumable. Nothing else.", "cost": "What this adds, at the coarsest honest resolution and marked as an estimate — 'roughly the price of the item again over five years', 'tens per year, not hundreds', 'a small one-off'. A ${sym} figure ONLY where it is a well-known fixed price. Never a made-up range that looks researched."},
      {"item": "Maintenance or replacement part. Nothing else.", "cost": "Same rule: how often and roughly how much relative to the purchase, not a precise sum."}
    ],
    "year_1_total": "A total ONLY when the buyer supplied the purchase price AND the additions are well-known fixed costs. Adding estimates together produces a precise-looking number built on guesses, which is the most convincing wrong thing this tool can print — null is the right answer whenever any part of it was estimated.",
    "year_5_total": "Same rule, and null far more often. A five-year total carried to the currency unit is arithmetic performed on assumptions about how they will use it.",
    "price_per_use": null
  },

  "cheaper_alternative": {
    "suggestion": "The cheaper CONFIGURATION or specification that does most of the same job — one motor instead of two, laminate instead of solid core, the previous generation, the smaller size. Say what to look for and roughly how much less it tends to be as a share of the price they gave ('typically around two thirds'). No invented currency ranges, and no named product you are effectively pricing. — one sentence",
    "tradeoffs": "What you give up with the cheaper option. Be honest. — one sentence",
    "refurbished_tip": "Whether this kind of product commonly turns up refurbished or open-box and what the saving tends to be relative to new, as a rough share and never a figure. What to check on a refurbished one matters more than the discount. null if not applicable. — one sentence"
  },

  "used_refurb_deep_dive": {
    "viable": true,
    "where_to_buy_used": ["The KINDS of channel a used or refurbished one turns up in for this product — the manufacturer's own certified-refurbished programme, retailer open-box, the general resale market — with what each is good and bad for. Channels, not brand-name marketplaces you would be vouching for."],
    "what_to_inspect": ["What to check when buying used — product-specific"],
    "typical_used_price": "How much less a used one usually goes for as a SHARE of new for this category — 'used ones typically go for roughly half of new' — never a currency figure, because that is a market reading you did not take. null if this category has no stable pattern.",
    "risk_assessment": "What specifically can be wrong with a used one of THIS product and how visible it is on inspection — the failure, not a grade. Never score the risk ('low-risk', 'safe', 'risky'): you cannot see the unit, the seller or the price. Describe what they would be taking on and let them weigh it. — 1-2 sentences",
    "used_protections": ["What to require of ANY seller before paying for a used one — the protections that make a used purchase safe for this product, phrased as conditions to insist on: a working return window, a serial number you can check against warranty status, proof of purchase date, in-person testing of the parts that fail first. Do not name or rate specific platforms or sellers: which ones are trustworthy this month is not something you know."]
  },

  "warranty_returns": {
    "typical_warranty": "What length of warranty is normal for this KIND of product, said as a norm and not as this product's terms — and that the actual cover is on the listing and worth reading. Warranty terms vary by country, by seller and by year; you are not reading theirs. — one sentence",
    "extended_worth_it": "Whether an extended warranty tends to be worth it for this category and what would make it worth it here — the failure this product actually has, and whether the plan covers that failure. Frame as what to check in the terms, not as a verdict on a plan you have not read. — one sentence",
    "return_tips": "What to establish about the return window before paying — length, who pays return shipping, whether opened items are accepted, what a restocking fee would be. Never rank named retailers on their return policies: those change and you are not reading them. — one sentence",
    "credit_card_protection": "That some cards extend manufacturer warranties or add purchase protection, and that it is worth checking THEIR card's benefits guide before paying — stated as something to check, never as something their card does. — one sentence"
  },

  "buy_vs_subscribe": ${`null if no subscription or rental model exists, otherwise: {
    "analysis": "Compare buying outright vs subscribing vs renting using prices the user supplied. If none were supplied, compare the cost structure without inventing current prices and put live-price checks in verify_before_buying. — 1-2 sentences",
    "breakeven": "At what point does buying become cheaper? — one sentence",
    "recommendation": "Clear recommendation based on their context. — one sentence"
  }`},

  "quality_tier": {
    "recommended_tier": "Budget | Mid-Range | Premium",
    "analysis": "Is this a category where spending more actually matters? Be specific. — 1-2 sentences",
    "spend_vs_save": "One sentence summary."
  },

  "regret_predictor": {
    "common_regrets": "What tends to disappoint about this KIND of product — the limitation people run into once it is in use, described as a property of the thing. Never as a survey finding: no 'the most common regret is', no 'most buyers wish', no counts or rankings of what owners felt. — one sentence",
    "usage_reality": "What this product needs from someone in order to keep earning its place — the effort, space, routine or habit it assumes. Frame it as what the thing demands, never as what people are observed to do with it or how many abandon it. — one sentence",
    "avoid_regret_tip": "One specific thing to check or consider before buying. — one sentence"
  },

  "watch_out": [
    "2-4 specific gotchas, hidden costs, or things that commonly surprise buyers."
  ],

  "negotiation": ${`null unless haggling is realistic. If applicable: {
    "context": "Is negotiation realistic here? What's the typical margin? — 1-2 sentences",
    "script": "Exact words to say to negotiate. — 2-4 sentences",
    "leverage_points": ["Specific leverage points"]
  }`}${compProducts.length > 0 ? `,

  "comparison": {
    "winner": "Just the winning product name, or the words It depends",
    "analysis": "Where these two actually differ in use — the design and specification choices that separate them. Compare the products, not their owners: no claims about how long people keep them, how many regret them, or what buyers report. — 1-2 sentences",
    "for_your_priority": "Based on the user's stated priority (${priority}), which one wins and why? (number)",
    "products": [${[`{"name": "${product}", "pros": ["2-3 advantages"], "cons": ["1-2 drawbacks"]}`].concat(compProducts.map(cp => `{"name": "${cp.product}", "pros": ["2-3 advantages"], "cons": ["1-2 drawbacks"]}`)).join(', ')}]
  }` : ''},

  "where_to_buy": [
    {"platform": "A KIND of place to look for this product — the manufacturer direct, a specialist retailer for the category, a large general retailer, the manufacturer's refurbished outlet, the used market. A category of seller, never a brand name and never a marketplace you are vouching for. Nothing else.", "why": "What that channel is good for with this product and what to watch for there — the tradeoff, not an endorsement. Nothing else."}
  ],

  "followup_questions": [
    "2-3 natural follow-up questions the user might want answered, phrased as the user would ask them (e.g., 'Is the base model enough or should I upgrade?', 'What accessories are actually worth buying?')"
  ],

  "bottom_line": "2-3 sentences. The friend-level honest summary. End with a clear action step."
}`;

    let parsed;
    try {
      parsed = await callClaudeWithRetry({
        model: MODELS.DEEP,
        max_tokens: 8000,
        system: withLanguage(systemPrompt, userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion),
        messages: [{ role: 'user', content: userPrompt }],
      }, { label: 'buy-wise' });
    } catch (err) {
      console.error('BuyWise error:', err);
      if (/truncated at max_tokens/.test(err.message || '')) {
        return res.status(500).json({ error: 'That analysis ran long. Please try again.' });
      }
      return res.status(500).json({ error: 'Something went wrong. Please try again.' });
    }

    if (!parsed.verdict) {
      return res.status(500).json({ error: 'Could not analyze this purchase. Please try again.' });
    }
    // Same rule as the fan-out path: show only what this answer actually used.
    parsed.verified_facts = grounded ? (stripCites(groundedData(buyWiseFactsKey(fallbackFactsArgs))) || null) : null;
    res.json(parsed);

  } catch (error) {
    console.error('BuyWise error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.'});
  }
});

// ════════════════════════════════════════════════════════════
// POST /buy-wise/fast — Main analysis via balanced fan-out.
// 1) DECISION pre-pass: one tiny call locks the verdict + the
//    fair-price / timing badges so every later section stays
//    consistent (no "WAIT" verdict beside a "BUY NOW" timing).
// 2) Three BALANCED groups (presentation / cost / risk+timing)
//    generate concurrently — each ~1/3 of the output, so
//    wall-clock ≈ the slowest single group, not the sum.
// 3) MERGE the locked decision + whatever groups resolved and
//    return ONE JSON object (same shape as POST /buy-wise).
// Degrades safely: a failed group is simply omitted (its panels
// don't render); a failed pre-pass 500s and the client falls
// back to the single-shot POST /buy-wise path.
// ════════════════════════════════════════════════════════════
router.post('/buy-wise/fast', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { product, price, currency, urgency, isImpulse, isGift, giftRecipient, priority, context, comparison, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    if (!product || !product.trim()) {
      return res.status(400).json({ error: 'Please enter what you want to buy' });
    }

    const sym = currency || '$';
    const hasPrice = price != null && price > 0;
    const hasComparison = comparison && comparison.product;
    const compProducts = hasComparison ? (Array.isArray(comparison) ? comparison : [comparison]) : [];
    const timingToday = urgency === 'today';

    const system = withLanguage(PERSONALITY, userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion);

    const factsArgs = { product, region: userRegion || userLocale, currency: userCurrency || currency };
    // Awaited before the decision pre-pass on purpose: the pre-pass locks the
    // fair-price stance that every group must then agree with, so it has to
    // see the verified price too. Warm or stale products cost nothing here.
    const grounded = await buyWiseFacts(factsArgs).catch(() => '');

    const contextHeader = `RESEARCH THIS PURCHASE:
Product: ${product}
${hasPrice ? `Price seen: ${sym}${price}` : 'No price specified — do not invent a current market price. Give only a broad category expectation if it is durable enough to be useful; otherwise make price verification a next step'}
Currency: ${sym}
Urgency: ${urgency === 'today' ? 'Need it today — skip wait-for-sale advice. Focus on whether the supplied price and terms are acceptable and what can be verified immediately' : urgency === 'this_week' ? 'This week — mention only durable sale-cycle patterns you actually know; do not imply knowledge of a current promotion' : 'Flexible timing — discuss durable sale-cycle patterns and whether waiting may help; do not invent a sale calendar'}
Priority: ${priority} (weight your advice toward this)
${isImpulse ? 'USER FLAGGED THIS AS IMPULSE BUY — include impulse_check section with honest evaluation' : ''}
${isGift ? `GIFT MODE: Buying as a gift${giftRecipient ? ` for ${giftRecipient}` : ''}` : ''}
${context ? `Additional context: ${context}` : ''}
${compProducts.length > 0 ? `\nCOMPARISON REQUESTED:\n${compProducts.map((cp, i) => `  Option ${i + 2}: "${cp.product}"${cp.price ? ` (${sym}${cp.price})` : ''}`).join('\n')}` : ''}`;

    // Thin wrapper preserving the (promptBody, label, maxTokens) -> parsed-object
    // contract the fan-out below relies on. callClaudeWithRetry throwing is what
    // Promise.allSettled below catches as 'rejected' — the graceful-degradation
    // behavior is unchanged.
    async function callJson(promptBody, label, maxTokens) {
      return callClaudeWithRetry({
        model: MODELS.DEEP,
        max_tokens: maxTokens,
        system,
        messages: [{ role: 'user', content: promptBody }],
      }, { label: `buy-wise-fast-${label}` });
    }

    // ── 1) DECISION PRE-PASS — tiny, locks the stance for coherence ──
    const DECISION_SCHEMA = `{
  "verdict": "One bold sentence: the overall recommendation — one sentence",
  "verdict_emoji": "Single emoji summarizing the verdict (👍 🟡 🛑 ⏳ ✅ etc.) (one emoji)",
  "verdict_summary": "2-3 sentences expanding on the verdict with the key reasoning",
  "product_category": "detected category: tech | kitchen | fashion | vehicle | furniture | subscription | fitness | beauty | home | outdoor | gaming | tools | office | baby | pet | other",
  "interpreted_as": "The exact product this analysis is about, so the user can spot a misread at a glance: brand plus the specific product type, plus the detail that distinguishes it from a similarly-named product. If the name was ambiguous, name the reading you rejected too. — one short sentence",
  "fair_price_badge": "GOOD PRICE | FAIR PRICE | HIGH | OVERPAYING | CHECK",
  "timing_badge": ${timingToday ? '"NULL — needed today"' : '"BUY NOW | WAIT | GOOD TIME"'}
}`;
    let decision;
    try {
      decision = await callJson(`${contextHeader}${grounded}

Make the CORE DECISION only — the verdict and the two badges. Be decisive. Return ONLY valid JSON, no markdown, no preamble:

${DECISION_SCHEMA}`, 'decision', 800);
    } catch (err) {
      console.error('[buy-wise/fast] decision pre-pass failed:', err.message);
      return res.status(500).json({ error: 'Could not analyze this purchase. Please try again.' });
    }

    if (!decision || !decision.verdict) {
      return res.status(500).json({ error: 'Could not analyze this purchase. Please try again.' });
    }

    // Pinning the resolved product here is what stops the three groups from each
    // picking a different reading of an ambiguous name ("Canyon Bikestand" →
    // repair stand in one panel, storage rack in another).
    const stance = `LOCKED DECISION — every section below MUST stay consistent with this; do NOT contradict it:
- Product being analyzed: ${decision.interpreted_as || product}
- Verdict: ${decision.verdict}
- Fair-price stance: ${decision.fair_price_badge}
- Timing stance: ${timingToday ? 'N/A (needed today)' : decision.timing_badge}`;

    const groupPrompt = (schema) => `${contextHeader}${grounded}

${stance}

Return ONLY valid JSON with EXACTLY these keys (set any that don't apply to null). No markdown, no preamble:

${schema}`;

    // ── 2a) GROUP A — presentation (verdict-adjacent panels) ──
    const GROUP_A = `{${isImpulse ? `
  "impulse_check": {
    "do_you_need_it": "Honest answer: do they actually need this or is it a want? Be specific. — one sentence",
    "what_else_could_you_do": "What else could this money buy? Be specific and vivid. — one sentence",
    "already_own_something": "Could something they likely already own do this job? — one sentence",
    "wait_recommendation": "Specific recommendation with timeframe. — one sentence"
  },` : `
  "impulse_check": null,`}${isGift ? `
  "gift_analysis": {
    "wow_factor": "1-10 rating with explanation. How impressive is this as a gift? — one sentence",
    "practical_vs_fun": "Is this a practical gift or a fun one? Which does the recipient likely prefer? — one sentence",
    "perceived_value": "Will the recipient think this cost more or less than it did? — one sentence",
    "alternatives_at_price": "2-3 alternatives at a similar price — one sentence each",
    "presentation_tip": "How to present/wrap this to maximize impact — one sentence",
    "risk_level": "Start with exactly LOW, MEDIUM or HIGH, then an em dash, then one short sentence on the risk they will not like it"
  },` : `
  "gift_analysis": null,`}
  "fair_price": {
    "verdict_badge": "${decision.fair_price_badge}",
    "analysis": "Judge the price THEY gave against what this kind of product involves — what drives cost in the category, what they get for it, what would make it good or bad value. If they gave no price, say what to expect to pay and be explicit that it is a general expectation, not a current quote. Never report what these sell for today as though you checked. — 1-2 sentences",
    "typical_range": "Where the price they gave sits within what this category spans, in words rather than currency — 'toward the upper end of mainstream, below the heavy-duty tier', 'entry level for this type'. A ${sym} range would read as a market check you did not run, and the placement is the useful part anyway. null when they gave no price. — short",
    "where_to_find_cheaper": "The route most likely to beat this price for THIS kind of product, and how to tell whether it did — the KIND of place and what a good price there would look like (manufacturer refurbished stock, open-box at a large retailer, the end-of-model-year window, an enthusiast marketplace). Never claim what any seller is charging right now. — one sentence"
  },${compProducts.length > 0 ? `
  "comparison": {
    "winner": "Just the winning product name, or the words It depends",
    "analysis": "Where these two actually differ in use — the design and specification choices that separate them. Compare the products, not their owners: no claims about how long people keep them, how many regret them, or what buyers report. — 1-2 sentences",
    "for_your_priority": "Based on the user's stated priority (${priority}), which one wins and why? (number)",
    "products": [${[`{"name": "${product}", "pros": ["2-3 advantages"], "cons": ["1-2 drawbacks"]}`].concat(compProducts.map(cp => `{"name": "${cp.product}", "pros": ["2-3 advantages"], "cons": ["1-2 drawbacks"]}`)).join(', ')}]
  },` : ''}
  "where_to_buy": [
    {"platform": "A KIND of place to look for this product — the manufacturer direct, a specialist retailer for the category, a large general retailer, the manufacturer's refurbished outlet, the used market. A category of seller, never a brand name and never a marketplace you are vouching for. Nothing else.", "why": "What that channel is good for with this product and what to watch for there — the tradeoff, not an endorsement. Nothing else."}
  ],
  "followup_questions": [
    "2-3 natural follow-up questions the user might want answered, phrased as the user would ask them (e.g., 'Is the base model enough or should I upgrade?', 'What accessories are actually worth buying?')"
  ],
  "bottom_line": "2-3 sentences. The friend-level honest summary. End with a clear action step."
}`;

    // ── 2b) GROUP B — cost (the token-heavy money panels) ──
    const GROUP_B = `{
  "verify_before_buying": ["Two to four things to check before paying, each one a specific question with the answer that would change the decision — 'ask whether the warranty transfers to a second owner; if it does not, the used saving is smaller than it looks'. This is where anything you could not look up belongs: current price, stock, live promotions, a seller's terms. Turn each one into something they can settle in a minute. Never a vague 'do your research'."],
  "noticed": [
    {
      "what": "Something concrete about THIS purchase that the buyer did not ask about, stated plainly with the actual figure or fact. Include it ONLY if it costs them money or exposes them to a real risk — a routine warranty or an ordinary return window is not worth raising, however true it is. Two entries is a lot; zero is the normal answer for a straightforward purchase, and an empty array is correct.",
      "tool": "Exactly one of these English identifiers, copied verbatim and never translated: FakeReviewDetective or MarkupDetective or UpsellShield or BillRescue or QuoteCheck or MoneyDiplomat or Giftology or ContractDecoder",
      "why": "One short sentence on what that tool would do about it"
    }
  ],
  "total_cost": {
    "summary": "What will this ACTUALLY cost over time? Include consumables, maintenance, accessories, and hidden costs. — 1-2 sentences",
    "breakdown": [
      {"item": "Purchase price. Nothing else.", "cost": "The price THEY supplied, exactly. If they supplied none, say that it depends on what they pay — never fill in a figure."},
      {"item": "Essential accessory/consumable. Nothing else.", "cost": "What this adds, at the coarsest honest resolution and marked as an estimate — 'roughly the price of the item again over five years', 'tens per year, not hundreds', 'a small one-off'. A ${sym} figure ONLY where it is a well-known fixed price. Never a made-up range that looks researched."},
      {"item": "Maintenance or replacement part. Nothing else.", "cost": "Same rule: how often and roughly how much relative to the purchase, not a precise sum."}
    ],
    "year_1_total": "A total ONLY when the buyer supplied the purchase price AND the additions are well-known fixed costs. Adding estimates together produces a precise-looking number built on guesses, which is the most convincing wrong thing this tool can print — null is the right answer whenever any part of it was estimated.",
    "year_5_total": "Same rule, and null far more often. A five-year total carried to the currency unit is arithmetic performed on assumptions about how they will use it.",
    "price_per_use": null
  },
  "cheaper_alternative": {
    "suggestion": "The cheaper CONFIGURATION or specification that does most of the same job — one motor instead of two, laminate instead of solid core, the previous generation, the smaller size. Say what to look for and roughly how much less it tends to be as a share of the price they gave ('typically around two thirds'). No invented currency ranges, and no named product you are effectively pricing. — one sentence",
    "tradeoffs": "What you give up with the cheaper option. Be honest. — one sentence",
    "refurbished_tip": "Whether this kind of product commonly turns up refurbished or open-box and what the saving tends to be relative to new, as a rough share and never a figure. What to check on a refurbished one matters more than the discount. null if not applicable. — one sentence"
  },
  "used_refurb_deep_dive": {
    "viable": true,
    "where_to_buy_used": ["The KINDS of channel a used or refurbished one turns up in for this product — the manufacturer's own certified-refurbished programme, retailer open-box, the general resale market — with what each is good and bad for. Channels, not brand-name marketplaces you would be vouching for."],
    "what_to_inspect": ["What to check when buying used — product-specific"],
    "typical_used_price": "How much less a used one usually goes for as a SHARE of new for this category — 'used ones typically go for roughly half of new' — never a currency figure, because that is a market reading you did not take. null if this category has no stable pattern.",
    "risk_assessment": "What specifically can be wrong with a used one of THIS product and how visible it is on inspection — the failure, not a grade. Never score the risk ('low-risk', 'safe', 'risky'): you cannot see the unit, the seller or the price. Describe what they would be taking on and let them weigh it. — 1-2 sentences",
    "used_protections": ["What to require of ANY seller before paying for a used one — the protections that make a used purchase safe for this product, phrased as conditions to insist on: a working return window, a serial number you can check against warranty status, proof of purchase date, in-person testing of the parts that fail first. Do not name or rate specific platforms or sellers: which ones are trustworthy this month is not something you know."]
  },
  "buy_vs_subscribe": ${`null if no subscription or rental model exists, otherwise: {
    "analysis": "Compare buying outright vs subscribing vs renting using prices the user supplied. If none were supplied, compare the cost structure without inventing current prices and put live-price checks in verify_before_buying. — 1-2 sentences",
    "breakeven": "At what point does buying become cheaper? — one sentence",
    "recommendation": "Clear recommendation based on their context. — one sentence"
  }`},
  "quality_tier": {
    "recommended_tier": "Budget | Mid-Range | Premium",
    "analysis": "Is this a category where spending more actually matters? Be specific. — 1-2 sentences",
    "spend_vs_save": "One sentence summary."
  }
}`;

    // ── 2c) GROUP C — risk & timing ──
    const GROUP_C = `{
  "timing": ${timingToday ? 'null' : `{
    "verdict_badge": "${decision.timing_badge}",
    "analysis": "What actually bears on the timing here, and how much of it can be settled from where you sit. Release cadence only where it is a long-standing, checkable pattern for the category, named as a pattern. Never assert that nothing is coming, that a redesign is imminent, or that there is no reason to wait — the future of a product line is not something you can see, and 'there is no reason to wait' is a prediction wearing the clothes of a fact. Where the timing question cannot be settled from here, say so and send it to verify_before_buying. — 1-2 sentences",
    "next_sale": "A recurring, durable pattern only — the sale season this category actually follows, said as a pattern and never as a dated promise. null when you know of no reliable pattern, which is the honest answer more often than not. Never invent a date, never attach a discount figure. — one sentence",
    "price_cycle_note": "Does this product have a known price cycle? — one sentence"
  }`},
  "warranty_returns": {
    "typical_warranty": "What length of warranty is normal for this KIND of product, said as a norm and not as this product's terms — and that the actual cover is on the listing and worth reading. Warranty terms vary by country, by seller and by year; you are not reading theirs. — one sentence",
    "extended_worth_it": "Whether an extended warranty tends to be worth it for this category and what would make it worth it here — the failure this product actually has, and whether the plan covers that failure. Frame as what to check in the terms, not as a verdict on a plan you have not read. — one sentence",
    "return_tips": "What to establish about the return window before paying — length, who pays return shipping, whether opened items are accepted, what a restocking fee would be. Never rank named retailers on their return policies: those change and you are not reading them. — one sentence",
    "credit_card_protection": "That some cards extend manufacturer warranties or add purchase protection, and that it is worth checking THEIR card's benefits guide before paying — stated as something to check, never as something their card does. — one sentence"
  },
  "regret_predictor": {
    "common_regrets": "What tends to disappoint about this KIND of product — the limitation people run into once it is in use, described as a property of the thing. Never as a survey finding: no 'the most common regret is', no 'most buyers wish', no counts or rankings of what owners felt. — one sentence",
    "usage_reality": "What this product needs from someone in order to keep earning its place — the effort, space, routine or habit it assumes. Frame it as what the thing demands, never as what people are observed to do with it or how many abandon it. — one sentence",
    "avoid_regret_tip": "One specific thing to check or consider before buying. — one sentence"
  },
  "watch_out": [
    "2-4 specific gotchas, hidden costs, or things that commonly surprise buyers."
  ],
  "negotiation": ${`null unless haggling is realistic. If applicable: {
    "context": "Is negotiation realistic here? What's the typical margin? — 1-2 sentences",
    "script": "Exact words to say to negotiate. — 2-4 sentences",
    "leverage_points": ["Specific leverage points"]
  }`}
}`;

    // ── 3) FAN OUT (concurrent) + MERGE ──
    const [aRes, bRes, cRes] = await Promise.allSettled([
      callJson(groupPrompt(GROUP_A), 'a', 4000),
      callJson(groupPrompt(GROUP_B), 'b', 4000),
      callJson(groupPrompt(GROUP_C), 'c', 4000),
    ]);

    const merged = {
      verdict: decision.verdict,
      verdict_emoji: decision.verdict_emoji,
      verdict_summary: decision.verdict_summary,
      product_category: decision.product_category,
      interpreted_as: decision.interpreted_as,
    };
    [aRes, bRes, cRes].forEach((r) => {
      if (r.status === 'fulfilled' && r.value && typeof r.value === 'object') {
        Object.assign(merged, r.value);
      } else if (r.status === 'rejected') {
        console.warn('[buy-wise/fast] group failed:', r.reason?.message || r.reason);
      }
    });

    // Only what the analysis actually saw. The background refresh can land
    // after the prompt was built, and showing the buyer facts that did not
    // inform the answer would be the same overclaim in a new costume.
    merged.verified_facts = grounded ? (stripCites(groundedData(buyWiseFactsKey(factsArgs))) || null) : null;

    return res.json(merged);
  } catch (error) {
    console.error('[buy-wise/fast] error:', error);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ════════════════════════════════════════════════════════════
// POST /buy-wise/budget — Budget mode
// ════════════════════════════════════════════════════════════
router.post('/buy-wise/budget', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { budget, category, needs, currency, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    if (!budget || !category) {
      return res.status(400).json({ error: 'Please provide a budget and category' });
    }

    const sym = currency || '$';

    const systemPrompt = `${PERSONALITY}

BUDGET MODE: Best option within their budget. Use ${sym}. Specific product names and model numbers.

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.`;

    const userPrompt = `BUDGET MODE:
Budget: ${sym}${budget}
Category: ${category}
${needs ? `What they need it for: ${needs}` : ''}

Recommend the best option(s) within this budget. Return ONLY valid JSON:

{
  "top_pick": {
    "product": "Specific product name with model if applicable — one sentence",
    "price": "${sym}X",
    "why": "Why this is the best option at this budget. Be specific. Nothing else.",
    "where": "Where to buy it — one sentence"
  },
  "runner_up": {
    "product": "Second best option — one sentence",
    "price": "${sym}X",
    "why": "Why someone might prefer this over the top pick. Nothing else.",
    "where": "Where to buy it — one sentence"
  },
  "stretch_pick": {
    "product": "Worth spending 15-25% more for this — one sentence",
    "price": "${sym}X",
    "why": "What the extra money gets you. Is it worth it?. Nothing else.",
    "worth_the_stretch": "Start with exactly YES, MAYBE or NO, then an em dash, then one short sentence of reasoning"
  },
  "avoid": "What to specifically avoid at this price point. Name brands/models if applicable. — one sentence",
  "budget_verdict": "Is ${sym}${budget} a realistic budget for ${category}? What should they expect at this price point? — one sentence",
  "save_more_tip": "How to stretch the budget further (refurb, older model, sales, etc.) — one sentence"
}`;

    let parsed;
    try {
      parsed = await callClaudeWithRetry({
        model: MODELS.DEEP,
        max_tokens: 2500,
        system: withLanguage(systemPrompt, userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion),
        messages: [{ role: 'user', content: userPrompt }],
      }, { label: 'buy-wise-budget' });
    } catch (err) {
      console.error('BuyWise budget error:', err);
      return res.status(500).json({ error: 'Something went wrong. Please try again.' });
    }

    if (!parsed.top_pick) {
      return res.status(500).json({ error: 'Could not analyze the budget. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('BuyWise budget error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.'});
  }
});

// ════════════════════════════════════════════════════════════
// POST /buy-wise/followup — Follow-up questions
// ════════════════════════════════════════════════════════════
router.post('/buy-wise/followup', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { product, question, originalVerdict, currency, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    if (!product || !question) {
      return res.status(400).json({ error: 'Missing product or question' });
    }

    const sym = currency || '$';

    const systemPrompt = `${PERSONALITY}

Follow-up on a purchase being researched. Use ${sym}. Thorough but concise.

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.`;

    const userPrompt = `The user is researching: ${product}
${originalVerdict ? `Original verdict: ${originalVerdict}` : ''}

Their follow-up question: "${question}"

Answer thoroughly. Return ONLY valid JSON:

{
  "answer": "Detailed, specific answer to their question. 3-5 sentences. Be practical and actionable.",
  "key_takeaway": "One bold sentence: the most important thing to know. — one sentence",
  "sources_to_check": ["1-2 specific places they can verify this info (YouTube channel, subreddit, review site, etc.)"]
}`;

    let parsed;
    try {
      parsed = await callClaudeWithRetry({
        model: MODELS.DEEP,
        max_tokens: 2000,
        system: withLanguage(systemPrompt, userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion),
        messages: [{ role: 'user', content: userPrompt }],
      }, { label: 'buy-wise-followup' });
    } catch (err) {
      console.error('BuyWise followup error:', err);
      return res.status(500).json({ error: 'Something went wrong. Please try again.' });
    }

    if (!parsed.answer) {
      return res.status(500).json({ error: 'Could not answer your question. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('BuyWise followup error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.'});
  }
});

// ════════════════════════════════════════════════════════════
// POST /buy-wise/calendar — Deal season calendar
// ════════════════════════════════════════════════════════════
router.post('/buy-wise/calendar', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { category, currency, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    if (!category) {
      return res.status(400).json({ error: 'Please specify a product category' });
    }

    const sym = currency || '$';

    const systemPrompt = `${PERSONALITY}

Deal calendar for this category. Best and worst times to buy. Use ${sym}. Specific sale events, not just months.

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.`;

    const userPrompt = `DEAL CALENDAR for: ${category}

When is the best time to buy ${category}? Map out the full year. Return ONLY valid JSON:

{
  "category": "${category}",
  "best_month": "The single best month to buy, with reason — one sentence",
  "worst_month": "The worst month (highest prices), with reason — one sentence",
  "calendar": [
    {
      "month": "Month name only, for example January",
      "rating": "GREAT | GOOD | AVERAGE | BAD",
      "events": "Specific sale events this month (e.g., 'New Year sales, CES announcements drop last-gen prices') — one sentence",
      "typical_discount": "Typical percentage off or savings range, for example 15-25%"
    }
  ],
  "pro_tips": [
    "3-4 insider tips for getting the best deal on ${category} (e.g., 'Buy last year's model right after new model announcements', 'Manufacturer refurb stores have the best deals in March')"
  ],
  "price_cycle": "Does this category have a predictable price cycle? Explain it. — one sentence"
}

Include all 12 months in the calendar array.`;

    let parsed;
    try {
      parsed = await callClaudeWithRetry({
        model: MODELS.DEEP,
        max_tokens: 5000,
        system: withLanguage(systemPrompt, userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion),
        messages: [{ role: 'user', content: userPrompt }],
      }, { label: 'buy-wise-calendar' });
    } catch (err) {
      console.error('BuyWise calendar error:', err);
      return res.status(500).json({ error: 'Something went wrong. Please try again.' });
    }

    if (!parsed.category) {
      return res.status(500).json({ error: 'Could not check the timing. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('BuyWise calendar error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.'});
  }
});

// ════════════════════════════════════════════════════════════
// POST /buy-wise/photo — Photo Mode: identify product from image
// ════════════════════════════════════════════════════════════
router.post('/buy-wise/photo', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { image, currency, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'Please provide an image' });
    }

    const sym = currency || '$';

    const systemPrompt = `${PERSONALITY}

Identify this product from the image: brand, model, condition, market value, price fairness. Use ${sym}.

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.`;

    const userPrompt = `Look at this product image and identify it. Return ONLY valid JSON:

{
  "identified": true,
  "product_name": "Full product name including brand and model if identifiable — 3-6 words",
  "confidence": "HIGH | MEDIUM | LOW — how confident you are in the identification",
  "condition": "New | Like New | Good | Fair | Poor — based on what's visible",
  "estimated_value": "${sym}X - ${sym}Y",
  "price_tag_visible": false,
  "price_tag_amount": null,
  "price_verdict": null,
  "quick_verdict": "One sentence: is this a good deal / fair price / overpriced?",
  "red_flags": ["Any visible issues: damage, counterfeits signs, missing parts, etc. Empty array if none."],
  "recommendation": "2-3 sentences of practical advice. What should they do?",
  "search_terms": "What to search online to compare prices for this exact item — one sentence"
}

If you cannot identify the product, set identified to false and explain in recommendation.`;

    const content = [
      {
        type: 'image',
        source: { type: 'base64', media_type: 'image/jpeg', data: image },
      },
      { type: 'text', text: userPrompt },
    ];

    let parsed;
    try {
      parsed = await callClaudeWithRetry({
        model: MODELS.DEEP,
        max_tokens: 2000,
        system: withLanguage(systemPrompt, userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion),
        messages: [{ role: 'user', content }],
      }, { label: 'buy-wise-photo' });
    } catch (err) {
      console.error('BuyWise photo error:', err);
      return res.status(500).json({ error: 'Something went wrong. Please try again.' });
    }

    // `identified: false` is a legitimate, well-formed result (the prompt
    // explicitly instructs the model to return it when it can't identify the
    // product) — the frontend has a dedicated UI for it (BuyWise.js checks
    // photoResults.identified). Only a malformed/missing field is a real
    // failure worth a 500.
    if (typeof parsed.identified !== 'boolean') {
      return res.status(500).json({ error: 'Could not analyze this item. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('BuyWise photo error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.'});
  }
});

// ════════════════════════════════════════════════════════════
// POST /buy-wise/convince — Convince My Partner mode
// ════════════════════════════════════════════════════════════
router.post('/buy-wise/convince', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { product, price, currency, direction, context, verdict, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    if (!product) {
      return res.status(400).json({ error: 'Please specify the product' });
    }

    const sym = currency || '$';
    const forBuying = direction === 'for';

    const systemPrompt = `${PERSONALITY}

${forBuying ? 'Case FOR buying' : 'Case AGAINST buying'} to share with a partner. Persuasive but honest. Use ${sym}.

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.`;

    const userPrompt = `Product: ${product}
${price ? `Price: ${sym}${price}` : ''}
Direction: ${forBuying ? 'MAKE THE CASE FOR BUYING' : 'MAKE THE CASE AGAINST BUYING'}
${verdict ? `Previous research verdict: ${verdict}` : ''}
${context ? `Additional context: ${context}` : ''}

Return ONLY valid JSON:

{
  "headline": "${forBuying ? 'Why we should get this' : 'Why we should skip this'} — one compelling sentence",
  "practical_case": "The logical/practical argument. Facts, numbers, utility. 2-3 sentences.",
  "emotional_case": "The feeling-based argument. Quality of life, enjoyment, peace of mind. 2-3 sentences.",
  "financial_case": "The money argument. ${forBuying ? 'Cost-per-use, long-term savings, value retention' : 'What else we could do with the money, hidden costs, depreciation'}. 2-3 sentences.",
  "counter_argument": "The strongest argument the OTHER side would make, with your rebuttal. 2 sentences. — 1-2 sentences",
  "compromise": "A middle-ground option if full agreement isn't reached. 1-2 sentences.",
  "one_liner": "The single most persuasive sentence to close with — something they can text. — one sentence"
}`;

    let parsed;
    try {
      parsed = await callClaudeWithRetry({
        model: MODELS.DEEP,
        max_tokens: 2500,
        system: withLanguage(systemPrompt, userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion),
        messages: [{ role: 'user', content: userPrompt }],
      }, { label: 'buy-wise-convince' });
    } catch (err) {
      console.error('BuyWise convince error:', err);
      return res.status(500).json({ error: 'Something went wrong. Please try again.' });
    }

    if (!parsed.headline) {
      return res.status(500).json({ error: 'Could not generate the case. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('BuyWise convince error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.'});
  }
});

// ════════════════════════════════════════════════════════════
// POST /buy-wise/haul — Haul Review: analyze multiple items
// ════════════════════════════════════════════════════════════
router.post('/buy-wise/haul', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { items, totalBudget, currency, occasion, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ error: 'Please add at least one item' });
    }

    const sym = currency || '$';

    const systemPrompt = `${PERSONALITY}

Review a shopping haul as a whole: redundancies, priorities, better alternatives, missing items. Use ${sym}.

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.`;

    const itemList = items.map((item, i) => `${i + 1}. ${item.name}${item.price ? ` — ${sym}${item.price}` : ''}`).join('\n');
    const totalEstimate = items.reduce((sum, i) => sum + (Number(i.price) || 0), 0);

    const userPrompt = `HAUL REVIEW:
${itemList}

Estimated total: ${sym}${totalEstimate}
${totalBudget ? `Budget: ${sym}${totalBudget}` : ''}
${occasion ? `Occasion/purpose: ${occasion}` : ''}

Review this haul as a whole. Return ONLY valid JSON:

{
  "haul_verdict": "One sentence overall assessment (e.g., 'Solid list with one questionable pick', 'Way over budget — here's what to cut')",
  "haul_emoji": "Single emoji for the overall haul (one emoji)",
  "total_estimated": "${sym}${totalEstimate}",
  "items": [
    {
      "name": "Item name — 3-6 words",
      "verdict": "✅ KEEP | ⚠️ RECONSIDER | ❌ SKIP | 🔄 SWAP",
      "note": "Why — one sentence. Be specific.",
      "better_alternative": "null or a specific better option at similar price — one sentence"
    }
  ],
  "redundancies": ["Any items that overlap or duplicate function. null if none."],
  "missing": ["1-2 things they probably need but didn't include. null if the list is complete."],
  "priority_order": ["If they can only buy some items, which order? List item names from most to least important."],
  "budget_note": "${totalBudget ? `Are they within budget? What to cut if not?` : 'Is this total spend reasonable for what they are getting?'}",
  "save_tip": "One specific way to reduce the total spend without losing value — one sentence"
}`;

    let parsed;
    try {
      parsed = await callClaudeWithRetry({
        model: MODELS.DEEP,
        max_tokens: 5000,
        system: withLanguage(systemPrompt, userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion),
        messages: [{ role: 'user', content: userPrompt }],
      }, { label: 'buy-wise-haul' });
    } catch (err) {
      console.error('BuyWise haul error:', err);
      return res.status(500).json({ error: 'Something went wrong. Please try again.' });
    }

    if (!parsed.haul_verdict || !Array.isArray(parsed.items)) {
      return res.status(500).json({ error: 'Could not analyze the haul. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('BuyWise haul error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.'});
  }
});

// ════════════════════════════════════════════════════════════
// POST /buy-wise/quote — Service/Contractor Quote Check
// ════════════════════════════════════════════════════════════
router.post('/buy-wise/quote', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { service, amount, details, location, urgency, currency, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    if (!service || !service.trim()) {
      return res.status(400).json({ error: 'Please describe the service you were quoted for' });
    }

    const sym = currency || '$';
    const hasAmount = amount != null && amount > 0;

    const systemPrompt = `${PERSONALITY}

Evaluate a service quote or contractor estimate — not a product purchase.

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.`;

    const userPrompt = `SERVICE QUOTE CHECK:
Service: ${service}
${hasAmount ? `Quoted amount: ${sym}${amount}` : 'No amount specified — provide typical range'}
${details ? `Quote details/line items: ${details}` : 'No details provided'}
${location ? `Location: ${location}` : 'Location not specified'}
Urgency: ${urgency === 'today' ? 'Emergency/urgent — they need this done ASAP' : urgency === 'this_week' ? 'Soon but not emergency' : 'Flexible timing — can shop around'}

Return ONLY valid JSON:

{
  "verdict": "One bold sentence: is this a fair quote? — one sentence",
  "verdict_emoji": "Single emoji (✅ 🟡 🚩 ⚠️ 💰 etc.) (one emoji)",
  "verdict_summary": "2-3 sentences explaining the assessment with key reasoning",

  "fair_range": {
    "range": "${sym}X - ${sym}Y typical range for this service",
    "what_drives_cost": "What makes this service more or less expensive (specifics, not generalities) (number)",
    "regional_note": "How location affects pricing for this service, or null if not applicable — one sentence"
  },

  "line_items": [
    {
      "item": "Line item or cost component name. Nothing else.",
      "amount": "${sym}X or null if not broken out",
      "verdict": "fair | high | low | red_flag | info",
      "note": "Why — one specific sentence — one sentence"
    }
  ],

  "negotiable": [
    {
      "item": "What can be negotiated. Nothing else.",
      "how_to_negotiate": "Specific tactic for THIS industry — one sentence",
      "typical_discount": "How much you can typically save, e.g. '10-15%' or '${sym}200-500' — one sentence"
    }
  ] or [],

  "red_flags": ["Specific warning signs in this quote. Empty array if clean."],

  "questions_to_ask": [
    "Exact question phrased as the customer would ask it — 5-8 questions"
  ],

  "timing_tip": "Is now a good or bad time to get this service done? Seasonal pricing patterns? null if not relevant. — one sentence",

  "competing_quotes": {
    "how_many": "How many quotes to get and why — one sentence",
    "where_to_look": "Specific places to find competing providers for THIS service — one sentence",
    "script": "Exact words to say when calling for a competing quote — including how to mention you have another quote without being pushy — 2-4 sentences"
  },

  "diy_option": "Could any part of this be done yourself to save money? Be honest — some things are dangerous or require licensing. null if DIY isn't realistic. — one sentence",

  "insurance_licensing": "What insurance, licensing, or certifications should this provider have? What to ask for. null if not applicable (e.g., tutoring). — one sentence",

  "bottom_line": "2-3 sentences: final recommendation. Be specific about what to do next."
}`;

    let parsed;
    try {
      parsed = await callClaudeWithRetry({
        model: MODELS.DEEP,
        max_tokens: 5000,
        system: withLanguage(systemPrompt, userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion),
        messages: [{ role: 'user', content: userPrompt }],
      }, { label: 'buy-wise-quote' });
    } catch (err) {
      console.error('BuyWise quote error:', err);
      return res.status(500).json({ error: 'Something went wrong. Please try again.' });
    }

    if (!parsed.verdict) {
      return res.status(500).json({ error: 'Could not analyze the quote. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('BuyWise quote error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.'});
  }
});

module.exports = router;
