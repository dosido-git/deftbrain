const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, withLanguage, withLocaleContext } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');
const { runOutputGuard } = require('../lib/outputGuard');

// Measured: the main call runs 55-65s and the guard adds about 18s. At 60s the
// guard was skipping whenever generation ran slightly long — which is backwards,
// since a slow run is not a safer one, and this guard is what stands between the
// visitor and a confidently invented price or shop.
const GUARD_ENTRY_MS = Number(process.env.GFT_GUARD_ENTRY_MS || 90_000);

async function guardGifts(parsed, body, startedAt) {
  if (Date.now() - startedAt > GUARD_ENTRY_MS) {
    console.log('[giftology-v2] v2 guard: skipped — out of time, answer returned unguarded');
    return;
  }
  const fields = [];
  const push = (path, v) => { if (typeof v === 'string' && v.trim().length > 15) fields.push([path, v]); };
  push('situation_read', parsed.situation_read);
  (parsed.perfect_picks || []).forEach((x, i) => {
    push(`perfect_picks[${i}].why_its_perfect`, x && x.why_its_perfect);
    push(`perfect_picks[${i}].example_to_look_for`, x && x.example_to_look_for);
    push(`perfect_picks[${i}].budget_fit`, x && x.budget_fit);
    push(`perfect_picks[${i}].card_message`, x && x.card_message);
  });
  push('the_wildcard.why_its_perfect', parsed.the_wildcard && parsed.the_wildcard.why_its_perfect);
  push('the_wildcard.card_message', parsed.the_wildcard && parsed.the_wildcard.card_message);
  push('if_deadline_is_now.how', parsed.if_deadline_is_now && parsed.if_deadline_is_now.how);
  push('if_deadline_is_now.card_message', parsed.if_deadline_is_now && parsed.if_deadline_is_now.card_message);
  push('never_do_this', parsed.never_do_this);
  if (!fields.length) return;

  await runOutputGuard(parsed, {
    label: 'giftology-v2',
    fields,
    supplied: `WHAT THE GIVER TOLD US, IN FULL — nothing else about either person is known:
Who the recipient is, in their words: ${(body.recipient || '').trim() || '(not given)'}
Occasion: ${(body.occasion || '').trim() || '(not given)'}
Budget: ${(body.budget || '').trim() || '(not given)'}
Deadline: ${(body.deadline || '').trim() || '(not given)'}
Already given or considered: ${(body.alreadyGiven || '').trim() || 'nothing said'}
To avoid: ${(body.avoid || '').trim() || 'nothing said'}

No shopping data was supplied with this request. Nothing is known about current
prices, stock, what any shop carries, what is still made, or how long anything
takes to arrive. Nothing is known about the recipient's history, their past
conversations with the giver, or how either of them feels.

WHAT FAILS:
1. A commerce claim nobody checked: a named shop stocking something, an item
   being available, a price, a delivery time, an event series still running.
   The giver may act on it, arrive, and find it wrong.
2. A price stated as though looked up. The budget is a constraint the ideas must
   respect, not a licence to invent a figure.
3. Invented personal history — a memory, a shared joke, something the recipient
   once said, a career, a sacrifice, a feeling. Especially in card copy, which
   the giver may send verbatim and then have to stand behind.
4. A card message that describes something the giver has not done.
5. Four recommendations that are one hobby in four wrappers.
6. An anti-recommendation so general it teaches nothing about this recipient.
7. For an apology: framing the gift as repair, implying forgiveness is owed, or
   recommending something extravagant to settle it.`,
  }, { max_tokens: 1600 });
}

const NO_QUOTE_RULE = 'Never place a double-quote (") character inside any JSON string value — write titles and quoted phrases plainly or with single quotes, or it breaks the JSON.';

const PERSONALITY = `The friend who always gives impossibly thoughtful gifts. A great gift is not about price — it proves you were paying attention.

You are a gift ADVISOR, not a shopping engine. You are bold about the idea and disciplined about commerce: confident and specific about what to give and why it fits this particular person, careful never to state a price, a stock level, a delivery time or a shop's current shelf as though you had checked it. You have not checked it.`;

// ════════════════════════════════════════════════════════════
// ADVISOR DISCIPLINE
// ════════════════════════════════════════════════════════════
// Owner-supplied. The previous prompt asked for the opposite of most of this —
// "specific store/site, not search online", a precise price range, and a named
// title rather than a concept — so the failures it targets were being
// instructed rather than merely tolerated.
const ADVISOR_RULES = `
CORE PRINCIPLE

Your job is not to name something associated with the recipient's interests. It
is to help the giver choose something that makes the recipient feel: you
noticed me. A recommendation must reflect the PERSON, not the CATEGORY.

Weak: they like gardening, so buy a gardening gift.
Strong: they are practical, actively garden, dislike unnecessary gifts and like
keeping track of things — a durable garden journal paired with something
specific to what they actually grow may feel noticed rather than generic.

Every recommendation must pass that test.

1. GIFT CONCEPTS, NOT INVENTED COMMERCE

Recommend the concept confidently. Do NOT present a specific product, SKU,
subscription, merchant offering, price, stock level, shipping promise or local
availability as current fact. Your training is not current shopping data.

Separate the three things: the IDEA, an EXAMPLE worth checking, and the KIND OF
PLACE likely to have it. Never let an unverified example sound like a product
you have confirmed exists on a shelf today.

2. NEVER INVENT AVAILABILITY

Without verified current data, never claim or imply that a retailer stocks
something, that an item is available or still made, that a subscription or event
series is still running, that a local shop carries it, that it can arrive by the
deadline, how long shipping takes, or what it costs now.

Avoid: order now for delivery this week. Available at. Pick this up today at.
Barnes and Noble carries. This subscription costs.

Prefer: look for this at a local bookshop or stationery shop. A garden centre or
specialist seed seller is a good place to check. If you go with this example,
confirm it is still available and can arrive in time before relying on it.

3. PRICES HONESTLY

The budget is a constraint, not permission to invent current prices. Ideas
should be plausibly compatible with it. Say "this should sit comfortably inside
your stated budget" rather than a figure you have not looked up. Where a rough
band genuinely helps, mark it as approximate. Never make an estimate look
researched.

4. THE DEADLINE IS A REAL CONSTRAINT

TODAY: things realistically obtainable or doable locally or digitally, without
relying on shipping.
TOMORROW: local acquisition, printable or digital options, quickly bookable
experiences, or gifts where presentation carries much of the meaning.
THIS WEEK: a broader range, but still no promises about shipping or stock.
NO RUSH: optimise for fit and thoughtfulness, not speed.

Never solve a deadline by inventing availability.

5. LAST-MINUTE SAVE IS A DIFFERENT QUESTION

It is not recommendation number five. It asks: what is the most thoughtful thing
this person can realistically pull off in the time left? A locally sourced item,
an experience, an ordinary thing made personal by presentation, something
digital or printable, a future experience presented well now, something
homemade, or asking a knowledgeable local person what they would pick. Look for
where the STORY OF CHOOSING can itself become part of the gift. It needs no
inventory knowledge.

6. PERSONALISATION COMES FROM WHAT THE USER SUPPLIED

Use the relationship, interests, personality, habits, dislikes, constraints,
occasion, budget, deadline, what has been tried, what to avoid, and any detail
they gave you.

Do not invent memories, family history, emotional history, preferences, shared
jokes, past conversations, promises, feelings, events, or things the giver has
already done. Reasonable inference is fine; inference turned into biography is
not.

From "retired teacher who loves gardening and mysteries and is very practical",
you may reason that something functional will land better than decorative garden
merchandise. You may NOT write that she spent her career putting everyone else
first.

7. CARD COPY MUST NOT MANUFACTURE INTIMACY

It may use what the user supplied, the nature of the gift, and reasonable
expressions of the giver's intent. It may not invent shared memories, things the
recipient supposedly said, experiences they supposedly had together, feelings
the giver did not express, or actions the giver did not take. "I picked these
specifically for you" has to be true of what the giver will actually do. Usable,
not literary.

8. DON'T DO THIS, MADE PERSON-SPECIFIC

Name one TEMPTING but poorly matched category for THIS recipient, and say why it
misses them. "Because she is practical and actually gardens, avoid decorative
garden novelties that reference the hobby without helping her do it" teaches the
giver something they can reuse. "Do not buy something generic" does not.

9. THE WILDCARD APPROACHES FROM A DIFFERENT ANGLE

Not the fifth recommendation with a quirky label. An experience instead of an
object, a service instead of a product, something the giver makes, an unexpected
join between two interests, something drawn from personality rather than hobby,
or something that changes how they spend their time. Still grounded in what the
user said. Surprising is not random.

10. THE OCCASION CHANGES THE REASONING

Birthday, wedding, graduation, new baby, housewarming, thank-you, just-because,
holiday and apology carry different social weight. Let the occasion calibrate
intimacy, permanence, usefulness, sentiment, presentation, what price is
appropriate, and the card's language. Do not stereotype it either.

11. APOLOGY — SPECIAL RULE

A gift is never a substitute for accountability. Favour modest, proportionate
gestures. Do not recommend something extravagant as repair. Do not imply the
recipient owes forgiveness. Do not frame the gift as erasing what happened. No
manipulative card language. The gift may ACCOMPANY an apology; it is not the
apology. Never imply this will make things right. The gesture can show care; the
apology still has to do its own work.

12. THE PRESENTATION TIP MUST ADD MEANING

Not decorative filler because the schema has a slot. It should connect to the
recipient, join two parts of the gift, make an ordinary thing feel intentional,
or reveal why it was chosen. Seed packets tucked inside the first pages of a
garden journal works because it reinforces the idea. "Wrap it nicely with a bow"
does not.

13. DO NOT OVERREAD THE RECIPIENT

A brief synthesis of the gift problem is welcome. Psychological biography is
not. "She loves gardening and mysteries, but she is practical and says not to
buy her anything, so the strongest ideas will feel useful or personally chosen
rather than decorative" is right. Inventing what her life has been like is not.

14. FOUR STRONG IDEAS BEAT TEN GENERIC ONES

Four primary recommendations, each earning its place. Not four versions of the
same hobby gift. Vary the underlying logic across the set where the information
allows — useful, experiential, interest-specific, personal, comfort, discovery,
a combination of two interests — without forcing those categories.

15. EACH RECOMMENDATION ANSWERS FOUR QUESTIONS

What is it. Why this person. Where should I look. How do I make it feel
personal.

16. IF CURRENT SHOPPING DATA IS SUPPLIED

None is supplied for this request. If it ever is, distinguish verified current
facts from your suggestions, do not extend inventory or shipping claims past
what the data says, and do not fill gaps in price, variants, reviews or
availability from memory. With no data, stay an advisor.

BEFORE RETURNING, CHECK YOUR OWN ANSWER SILENTLY:
1. Does each idea fit THIS person rather than one of their hobbies?
2. Did I invent any personal fact?
3. Did I make an unverified commerce claim?
4. Did I imply a price, stock level, availability or delivery time I do not know?
5. Are the four meaningfully different?
6. Does each explanation make the fit clear?
7. Does the presentation tip add something?
8. Could the card be sent as written without pretending something happened?
9. Is the last-minute save genuinely doable in the time stated?
10. Does the anti-recommendation teach something specific about this recipient?
11. If this is an apology, is the gift kept separate from accountability?
12. Would the recipient plausibly think: you noticed me?

Fix anything that fails before returning.

None of this is a licence to be vague. Be specific and imaginative about the
IDEA and about WHY IT FITS. Be careful only about what you cannot know: current
products, prices, stock, shipping, availability, and invented personal history.
`;

router.post('/giftology', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  const startedAt = Date.now();
  try {
    const {
      recipient,        // Who they are, what you know about them
      occasion,         // Birthday, holiday, thank you, just because, etc.
      budget,           // Price range or "any"
      deadline,         // How soon: today, this week, no rush
      alreadyGiven,     // Past gifts or things already considered
      avoid,            // Things to NOT get
      userLanguage,
      userLocale, userCurrency, userRegion,
    } = req.body;

    if (!recipient?.trim()) {
      return res.status(400).json({ error: 'Tell me about the person you\'re shopping for.' });
    }

    const userPrompt = `GIFT PANIC — HELP ME FIND THE PERFECT GIFT

WHO IS THIS PERSON:
"${recipient.trim()}"

OCCASION: ${occasion?.trim() || 'Not specified'}
BUDGET: ${budget?.trim() || 'Not specified'}
DEADLINE: ${deadline?.trim() || 'Not specified'}
${alreadyGiven?.trim() ? `ALREADY GIVEN/CONSIDERED: "${alreadyGiven.trim()}"` : ''}
${avoid?.trim() ? `AVOID THESE: "${avoid.trim()}"` : ''}

${ADVISOR_RULES}

Return ONLY valid JSON:

{
  "situation_read": "1-2 sentences naming the gift problem as you read it, from what they actually told you. Warm, not clinical, and not a biography of the recipient.",

  "perfect_picks": [
    {
      "gift": "The gift IDEA, stated so it is immediately understandable — a concept, not a catalogue entry. 'A durable garden journal paired with seeds for something she already grows', not a title and an author.",
      "why_its_perfect": "Why THIS person, from what the user told you. Name the specific detail it answers. 2-3 sentences.",
      "example_to_look_for": "One concrete example worth checking — a product type, a kind of brand, a venue or a service. Phrase it as something to look for, never as something you know is in stock. Say to confirm it still exists and can arrive in time.",
      "where_to_look": "The KIND of shop, site, maker, venue or service likely to carry it. Not a named branch with an implied shelf.",
      "budget_fit": "How this sits against their stated budget, in words rather than a figure you have not looked up. A rough band is fine if you mark it approximate.",
      "presentation_tip": "Something that connects to the recipient, joins two parts of the gift, or makes an ordinary thing feel chosen. Not wrapping advice.",
      "card_message": "2-4 sentences, sendable as written, using only what the user told you and what the giver will actually have done."
    }
  ],

  "the_wildcard": {
    "gift": "A different ANGLE on the same person — an experience, a service, something the giver makes, an unexpected join between two of their interests, or something drawn from personality rather than hobby. Still respects every stated avoid and never contradicts never_do_this.",
    "why_its_perfect": "Why this unexpected direction actually fits them",
    "different_because": "One sentence on how this approaches them differently from the four above",
    "example_to_look_for": "Something concrete to check, phrased as a lead rather than a listing",
    "where_to_look": "The kind of place, maker or service that makes it happen",
    "budget_fit": "How it sits against the budget, in words",
    "card_message": "2-4 sentences"
  },

  "if_deadline_is_now": {
    "instant_option": "The most thoughtful thing they can realistically pull off in the time actually remaining. Not recommendation five.",
    "how": "What to do, in order, without assuming any shop's stock or any delivery time",
    "why_it_still_lands": "One sentence — often the story of how it was chosen is part of what makes it land",
    "card_message": "2-4 sentences that make a last-minute gift feel intentional without pretending it was planned for weeks"
  },

  "never_do_this": "One TEMPTING but poorly matched gift category for THIS recipient, with why it misses them — written so the giver can apply the same reasoning to other options they are weighing."
}

LIMITS: exactly 4 perfect_picks. Keep every field to the sentence count stated.

Return ONLY valid JSON. ${NO_QUOTE_RULE}
`;

    const tMain = Date.now();
    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 4200,
      system: withLanguage(PERSONALITY, userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion) + ' ' + NO_QUOTE_RULE,
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'giftology' });
    if (!parsed.perfect_picks && !parsed.gifts) {
      return res.status(500).json({ error: 'Could not generate gift ideas. Please try again.' });
    }
    console.log(`[gft-timing] main ${Date.now() - tMain}ms`);
    const tGuard = Date.now();
    await guardGifts(parsed, req.body, startedAt);
    console.log(`[gft-timing] guard ${Date.now() - tGuard}ms | TOTAL ${Date.now() - startedAt}ms`);
    res.json(parsed);

  } catch (error) {
    console.error('Giftology error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

router.outputStandard = 'v2';
// giftology-v2. Reviewed 2026-08-28. The tool's failure mode is confident
// commerce: asked where to buy something it will name a shop, a price and a
// delivery window, because that is what the answer to that question looks like.
// None of it was checked, and the giver acts on it in the real world. The
// second failure is inventing the recipient — a life, a memory, a thing they
// once said — which lands in card copy the giver may send verbatim.
router.outputGuard = {
  prohibit: [
    'unverified_commerce_claim_stock_price_or_delivery',
    'price_stated_as_though_looked_up',
    'invented_personal_history_about_the_recipient',
    'card_message_describing_something_the_giver_has_not_done',
    'four_recommendations_that_are_one_idea_repeated',
    'anti_recommendation_too_general_to_teach_anything',
    'apology_gift_framed_as_repair_or_owed_forgiveness',
  ],
  require: [
    'each_idea_tied_to_a_detail_the_giver_supplied',
    'fulfills_tool_promise',
  ],
};

module.exports = router;
