const express = require('express');
const router = express.Router();
const { withLanguage, withLocaleContext, callClaudeWithRetry } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');
const { isSurging } = require('../lib/surge');

// ════════════════════════════════════════════════════════════
// SHARED
// ════════════════════════════════════════════════════════════
const PERSONALITY = `Identification expert with encyclopedic cross-domain knowledge. People describe things from memory — fragmentary, sensory, vibes-based — and you figure out what they mean. Give multiple ranked matches with confidence levels, never just one guess. Explain why each fits. Include how to find or verify each match. Mirror their sensory vocabulary. When genuinely uncertain, describe the likely category. Be calibrated about certainty.`

// ── Clue check (2026-10-08) ─────────────────────────────────────────────────
// Writing the tool-page example caught this in 3 of 3 runs: "pecorino, black
// pepper, crispy pork, no cream, no egg" came back as cacio e pepe "with
// guanciale" — a dish with no pork — while the right answer (gricia) sat at
// the bottom, described as "sometimes includes tomato". Another run called
// Coraline "his". Ranking from memory is the job, and memory is where it
// slips, so a second reader tests each match against the clues one by one.
// Code does the reranking: a match that contradicts a clue the visitor gave
// can never stay above one that does not. Fail-open.
const MATCH_TEXT_FIELDS = ['name', 'why_it_fits', 'memory_trigger', 'how_to_verify', 'how_to_find', 'fun_fact'];
const CONF_RANK = { high: 0, medium: 1, low: 2 };

async function clueCheck(parsed, clues, userLanguage, label) {
  if (isSurging() || !Array.isArray(parsed?.matches) || !parsed.matches.length) return;
  const listing = parsed.matches.map((m, i) => `MATCH ${i}: ${m.name}\n` + MATCH_TEXT_FIELDS.slice(1)
    .filter(f => typeof m[f] === 'string' && m[f].trim()).map(f => `  ${f}: ${m[f]}`).join('\n')).join('\n\n');
  let out;
  try {
    out = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 1800,
      system: withLanguage(`You check an identification tool's answers. Someone described a half-remembered thing; the tool proposed matches. For EACH match, decide how well it fits the clues, and check every sentence of every field for facts that are wrong about the match itself.

FIT — one of:
- "fits": the thing, as it is actually known, has every clue the person gave, allowing for ordinary memory drift.
- "partial": it fits the core but misses or bends a secondary clue.
- "contradicts": it lacks a KEY clue the person stated plainly — a defining ingredient, the central image, the plot itself (they said crispy pork and the dish has no pork). Memory changes details — a character's gender, a decade, a colour shade — so a mismatch on a detail like that, or on anything the person said they were unsure about, is never "contradicts". When the person names a candidate themselves and doubts it, that candidate is not contradicted by their doubt.
A FACTUAL ERROR is a wrong statement about the match: an ingredient it does not have, a wrong year, creator or plot point, a wrong pronoun for a character. Not style, not length.
Also say whether a candidate that fits every key clue better than all the listed ones is missing.

Return ONLY valid JSON:
{"checks":[{"match":0,"fit":"fits | partial | contradicts","errors":[{"field":"why_it_fits | memory_trigger | how_to_verify | how_to_find | fun_fact","wrong":"the shortest exact span that is wrong, copied character for character","fix":"the words that replace that span in the same sentence, written to the person in the tool's voice — never a comment about the error; empty string if the span should simply go"}]}],"missing":{"name":"better candidate","line":"one sentence to the person naming it and the clues it fits, e.g. Could it be pasta alla carbonara? It has the pepper and crispy pork, and its creaminess comes from egg, not cream."} or null}
Write fix and line in the same language as the matches.
Never place a double-quote (") character inside a JSON string value.`, userLanguage),
      messages: [{ role: 'user', content: `THE CLUES THEY GAVE:\n${clues}\n\nTHE MATCHES:\n${listing}` }],
    }, { label: `${label}-cluecheck`, maxRetries: 1 });
  } catch (e) { console.warn(`[${label}] clue check skipped: ${e.message}`); return; }

  let fixes = 0, demoted = 0;
  const FIT_RANK = { fits: 0, partial: 1, contradicts: 2 };
  const fit = new Map();
  for (const c of Array.isArray(out?.checks) ? out.checks : []) {
    const m = parsed.matches[c?.match];
    if (!m) continue;
    if (c.fit in FIT_RANK) fit.set(m, c.fit);
    for (const e of Array.isArray(c.errors) ? c.errors : []) {
      const f = MATCH_TEXT_FIELDS.slice(1).includes(e?.field) ? e.field : null;
      if (!f || typeof m[f] !== 'string' || !e.wrong || typeof e.fix !== 'string') continue;
      if (!m[f].includes(e.wrong) || e.fix.length > e.wrong.length * 2 + 60) continue; // a fix that balloons is commentary, not a repair
      m[f] = m[f].replace(e.wrong, e.fix).replace(/\s{2,}/g, ' ').replace(/\s+([.,;:])/g, '$1').replace(/\.{2,}/g, '.').replace(/,\s*\./g, '.').trim();
      fixes++;
    }
  }
  const rank = m => FIT_RANK[fit.get(m)] ?? 1;
  for (const m of parsed.matches) {
    if (fit.get(m) === 'contradicts' && m.confidence !== 'low') { m.confidence = 'low'; demoted++; }
    if (fit.get(m) === 'partial' && m.confidence === 'high') { m.confidence = 'medium'; demoted++; }
  }
  const before = parsed.matches[0];
  // stable: better fit first, then confidence, then the original order
  parsed.matches = parsed.matches.map((m, i) => [m, i])
    .sort((a, b) => (rank(a[0]) - rank(b[0])) || ((CONF_RANK[a[0].confidence] ?? 3) - (CONF_RANK[b[0].confidence] ?? 3)) || (a[1] - b[1]))
    .map(([m]) => m);
  // "dominant" was the generator's claim about ITS first match; it does not
  // carry over to a different one, and never to a match that bends a clue.
  if (parsed.matches[0] !== before || rank(parsed.matches[0]) !== 0) parsed.dominant = false;
  if (out?.missing?.name && !parsed.matches.some(m => String(m.name).toLowerCase().includes(String(out.missing.name).toLowerCase()))) {
    // A better candidate the list missed is a question for the reader, not a
    // fabricated match card: it goes into the "none of these?" prompt.
    const line = String(out.missing.line || '').trim() || `${out.missing.name}?`;
    parsed.if_none_match = `${line}${parsed.if_none_match ? ' ' + parsed.if_none_match : ''}`;
  }
  console.log(`[${label}] clue check: fit ${parsed.matches.map(m => fit.get(m) || '?').join('/')}, ${demoted} demoted, ${fixes} fix(es)`);
}

// ════════════════════════════════════════════════════════════
// POST /tip-of-tongue — Main identification
// ════════════════════════════════════════════════════════════
router.post('/tip-of-tongue', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const {
      category,       // 'food', 'music', 'film', 'product', 'scent', 'color', 'place', 'fabric', 'other'
      description,    // The memory/vibes description
      notThis,        // "It's NOT this" — eliminators
      whenWhere,      // Time/place context: "heard in 2019", "ate in Rome", "bought at Target"
      extraClues,     // Any additional details
      userLanguage,
    } = req.body;

    if (!description?.trim()) {
      return res.status(400).json({ error: 'Describe what you\'re trying to identify' });
    }

    const categoryPrompts = {
      food: `FOOD/DRINK IDENTIFICATION MODE:
Cross-reference: flavor profiles (sweet, savory, umami, bitter, sour, smoky, spicy), textures (creamy, crispy, chewy, crunchy, silky), cooking techniques (braised, fried, grilled, fermented), regional cuisines, visual appearance, temperature, and ingredient combinations.
For each match, include: the likely dish/drink name, cuisine origin, key ingredients, how to recreate it (brief recipe concept OR where to order it), and a "memory trigger" — the specific detail that confirms it.`,

      music: `MUSIC IDENTIFICATION MODE:
Cross-reference: genre, era/decade, mood/energy, instrumentation, vocal style (gender, register, technique), tempo, lyric fragments (even misremembered ones), production style, and cultural context (where they likely heard it).
For each match, include: artist and song title, album, year, genre, a brief description of why it matches, how to verify (specific lyric or musical moment to listen for), and where to find it (streaming search terms).`,

      film: `FILM/TV/MEDIA IDENTIFICATION MODE:
Cross-reference: era/decade, genre, plot elements, character descriptions, visual style, tone (dark, comedic, surreal), memorable scenes, country of origin, and "similar to but not" comparisons.
For each match, include: title, year, director/creator, brief plot summary that connects to their description, the specific scene or element they're likely remembering, and where to watch it.`,

      product: `PRODUCT IDENTIFICATION MODE:
Cross-reference: product category, brand aesthetics, packaging details (color, shape, material), scent/texture/feel, retailer, price range, era, and ingredient/material descriptions.
For each match, include: brand and product name, what it looks/feels like, approximate price, where to buy it now, and discontinued alternatives if relevant.`,

      scent: `SCENT/FRAGRANCE IDENTIFICATION MODE:
Cross-reference: fragrance note families (top/heart/base), scent descriptors (fresh, woody, gourmand, floral, aquatic, green, smoky, powdery), context (candle, perfume, body product, room spray, natural), intensity, and similar-scent comparisons.
For each match, include: product name and brand, note breakdown, price range, where to buy, and "if you like this, also try" alternatives.`,

      color: `COLOR IDENTIFICATION MODE:
Cross-reference: color theory (hue, saturation, warmth, undertones), established color names (Pantone, paint brands, design terminology), natural comparisons (dried sage, terracotta, ocean at dusk), and context (fashion, interior design, digital).
For each match, include: the precise color name(s), hex code, closest paint brand match (Benjamin Moore, Sherwin-Williams), what undertones make it different from similar colors, and where they've likely seen it.`,

      place: `PLACE/LOCATION IDENTIFICATION MODE:
Cross-reference: neighborhood, city/country, establishment type, atmosphere/vibe, specific details (decor, food, music, crowd), era visited, price range, and distinguishing features.
For each match, include: place name and address, why it matches, what to search for online to verify (street view, photos, reviews), whether it's still open, and similar alternatives if it's closed.`,

      fabric: `FABRIC/MATERIAL IDENTIFICATION MODE:
Cross-reference: fiber content (cotton, polyester, modal, tencel, cashmere, linen, silk blends), weave/knit structure, weight (GSM), stretch, drape, hand-feel descriptors (soft, crisp, slubby, smooth, peached), and brand/garment associations.
For each match, include: likely fabric composition, what makes it feel that way, specific brands/products known for this fabric, care characteristics, and where to find similar items.`,

      other: `GENERAL IDENTIFICATION MODE:
The user is trying to identify something from a fragmentary memory. Use all available context — sensory details, time period, location, emotional associations, partial facts — to narrow down what they're thinking of.
For each match, include: what it likely is, why it matches, how to verify, and how to find/get it.`,
    };

    const catPrompt = categoryPrompts[category] || categoryPrompts.other;

    const systemPrompt = `${PERSONALITY}

${catPrompt}`;

    const userPrompt = `WHAT THEY REMEMBER:
"${description}"

${notThis ? `IT'S DEFINITELY NOT: ${notThis}` : ''}
${whenWhere ? `TIME/PLACE CONTEXT: ${whenWhere}` : ''}
${extraClues ? `EXTRA CLUES: ${extraClues}` : ''}

Identify what they're thinking of. FACTUAL CONSISTENCY: any factual claim about a match (sample origins, dates, nationalities) must be stated identically everywhere it appears — never give two different origins for the same fact across fields; if unsure of a supporting detail, omit it rather than guess.

Return ONLY valid JSON:

{
  "category_detected": "What type of thing this is (even if they picked a category, confirm or correct)",
  "dominant": true or false — true ONLY when one match is so far ahead of the others that presenting them side by side would be misleading. A remembered detail that belongs to exactly one thing (button eyes, a specific lyric, a named ingredient) makes it dominant. Genuine ambiguity does not.,

  "matches": [
    {
      "name": "Most likely identification — specific name",
      "confidence": "high | medium | low",
      "why_it_fits": "TWO SHORT SENTENCES, maximum. The details they gave, said back to them plainly, so they recognise it — not an analysis of why the match is sound. They will know before they reach the end of it. Never one long sentence held together by commas and dashes.",
      "memory_trigger": "ONE SENTENCE. The single image or moment that lands it. Trigger, do not explain — 'Remember the Other Mother's button eyes? That is Coraline's signature image.' Not a paragraph about why it is memorable.",
      "how_to_verify": "What to search or look at, then what they will be able to tell from it. NEVER the words immediately, instantly, at once, or right away, and never a promise that it will confirm anything — you do not know what they remember. NO: the button eyes will confirm it immediately. YES: the images should make it easy to tell whether that is what you remember.",
      "how_to_find": "Where to go looking. See the FACTUAL RESTRAINT rule below — this is the field it exists for.",
      "fun_fact": "One interesting thing about this they probably do not know. Shown only after they confirm the match, never before. null if nothing genuinely good."
    }
  ],

  "if_none_match": "REQUIRED, never null. AT MOST TWO questions, and they must be about this specific uncertainty rather than a generic ask for more detail. If the doubt is whether the button-eyed figure was the mother, ask that. Two good questions beat five.",

  "also_try": [
    {
      "name": "Related thing they might also enjoy based on their description",
      "why": "Why this is in the same vibe/family"
    }
  ]
}

CLAIM DISCIPLINE — three habits that keep showing up, with the fix for each.

1. why_it_fits ends on a flourish about what people feel. "It's the kind of
   product that gives that sustained hydration feeling people remember for
   hours." You do not know what anyone remembers. Stay on the observable:
     NO:  ...the sustained hydration feeling people remember for hours.
     YES: The rich texture and long-lasting feel make it especially recognizable.
   Clues they can check beat claims about their experience.

2. memory_trigger reaches for absolutes. "Always at Target and CVS checkouts,
   the one everyone seems to own." Never write always, everyone, every, nobody
   or the only — one counter-example turns a good trigger into a wrong fact:
     NO:  Always at Target and CVS checkouts, the one everyone seems to own.
     YES: The squat green tub that is hard to miss in most drugstore beauty aisles.

3. how_to_verify predicts the reader's reaction. It has now written "will
   confirm it immediately", "you will recognize the texture immediately" and
   "instantly recognizable" — three phrasings around the same ban, so the rule
   is a shape rather than a word list.

   TWO PARTS AND NO THIRD. Part one: what to search or look at. Part two: a
   conditional the READER evaluates, and the second half of it must be about
   what THEY will notice, never about what the thing will have. "The glaze will
   have that blue-gray cast" states a fact about the object; "you should notice
   that blue-gray cast in the glaze" points their attention and lets them judge.
   Use should notice, should look familiar, should feel familiar, should sound
   right. Then stop.
     NO:  If it matches, the glaze will have that subtle blue-gray cast.
     YES: If it is the right colour, you should notice that subtle blue-gray cast in the glaze.

   No adverb of speed anywhere in the field — immediately, instantly, at once,
   right away, straight away, on sight, the moment you. You are not predicting
   how fast anyone recognises anything.
     NO:  You'll recognize the texture immediately.
     NO:  The packaging should feel instantly recognizable.
     YES: If it is the right product, the packaging and texture should feel familiar.

The shape to aim for throughout: helpful, calm, and not telling anyone what
they are going to think.

FACTUAL RESTRAINT — how_to_find. You do not know what is streaming today, what a
shop currently stocks, or what is still on a menu. Availability changes weekly
and a confident wrong answer here is the kind of small betrayal people remember.
So never name a service, retailer or platform as currently carrying something.

  NO:  Stream on Netflix, Amazon Prime Video, or rent on Apple TV, Google Play or Vudu.
  YES: Search your usual streaming service or JustWatch for it, or check your library for a disc.
  NO:  In stock at Sephora and Ulta.
  YES: Look for it at a large beauty retailer, or search the brand name plus the product line.

Name the KIND of place and the search that finds it, never the specific
availability. Where the thing is a recipe or a dish, say how to recreate it
instead. This rule outranks being helpful: an honest pointer beats a precise
claim you cannot stand behind.

RULES:
1. ALWAYS return 3-4 matches, ranked by confidence, even when dominant is true. Dominant changes how the interface PRESENTS them — one answer with the rest as a short "not it?" list — it does not mean the others stop existing. Returning a single match leaves that list empty and the reader with nowhere to go. Only drop below three when you genuinely cannot think of another plausible candidate.
2. At most 3 items in also_try.
3. "confidence" MUST be exactly one of these English lowercase codes — high, medium, low — regardless of the output language. Do NOT translate this value; the interface reads it as a code and shows the reader a phrase. Never put a percentage, score or rating anywhere in the response.
4. Keep every field to one tight sentence, and obey the per-field limits above — the reader has come to recognise something, not to read an essay about it.
5. Set dominant honestly. When it is true the interface shows one answer and lists the rest as names only; claiming dominance for a middling guess turns a hedge into a false certainty.
6. Never place a double-quote (") character inside any JSON string value — it breaks the JSON.`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART, // FAST answered cacio e pepe 'with guanciale' 3 of 3 runs (2026-10-07)
      max_tokens: 4000,
      system: withLanguage(systemPrompt, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'tip-of-tongue-find' });

    if (!parsed.matches || !parsed.matches.length) {
      return res.status(500).json({ error: 'Could not find matching words. Please try again.' });
    }
    await clueCheck(parsed, [
      `Description: ${description}`, notThis && `It is NOT: ${notThis}`,
      whenWhere && `When/where: ${whenWhere}`, extraClues && `Extra clues: ${extraClues}`,
    ].filter(Boolean).join('\n'), userLanguage, 'tip-of-tongue-find');
    res.json(parsed);

  } catch (error) {
    console.error('Tip of Tongue error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ════════════════════════════════════════════════════════════
// POST /tip-of-tongue/refine — Narrow down after first attempt
// ════════════════════════════════════════════════════════════
router.post('/tip-of-tongue/refine', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const {
      category,
      originalDescription,
      previousMatches,    // Array of { name, was_it } — "yes", "close", "no"
      refinement,         // Additional info: "it was more like X", "the Y part was right but..."
      userLanguage,
    } = req.body;

    if (!originalDescription?.trim() || !previousMatches?.length) {
      return res.status(400).json({ error: 'Need original description and feedback on matches' });
    }

    const feedback = previousMatches.map(m =>
      `"${m.name}" → ${m.was_it === 'yes' ? 'YES — this is it or very close' : m.was_it === 'close' ? 'CLOSE — right direction but not quite' : 'NO — not this'}`
    ).join('\n');

    const systemPrompt = `${PERSONALITY}

REFINEMENT MODE: Use yes/no/close feedback from initial matches to narrow the search. 'Close' is gold — find what's similar and what differs.`;

    const userPrompt = `ORIGINAL DESCRIPTION: "${originalDescription}"
CATEGORY: ${category || 'unknown'}

FEEDBACK ON PREVIOUS MATCHES:
${feedback}

${refinement ? `ADDITIONAL INFO: "${refinement}"` : ''}

Based on their feedback, refine the identification. Return ONLY valid JSON:

{
  "dominant": true or false — true ONLY when one match is now far enough ahead that showing the others beside it would be misleading.,
  "matches": [
    {
      "name": "Refined identification",
      "confidence": "high | medium | low",
      "why_it_fits": "TWO SHORT SENTENCES maximum — their own details said back plainly, so they recognise it. Not an argument for the match.",
      "memory_trigger": "ONE SENTENCE. The image that lands it. Trigger, do not explain.",
      "how_to_verify": "What to search or look at. Never promise it will confirm anything immediately.",
      "how_to_find": "Where to go looking — see the FACTUAL RESTRAINT rule.",
      "fun_fact": "Optional. Shown only after they confirm the match. null if nothing genuinely good."
    }
  ],
  "if_none_match": "AT MOST TWO questions, about this specific remaining uncertainty rather than a generic ask for more."
}

FACTUAL RESTRAINT — how_to_find. You do not know what is streaming, stocked or
on a menu today. Name the KIND of place and the search that finds it, never a
specific service or retailer as currently carrying it.
  NO:  Stream on Netflix or rent on Apple TV.
  YES: Search your usual streaming service or JustWatch for it, or check your library.

RULES:
1. Return 2-3 refined matches, obeying the per-field limits above.
2. "confidence" MUST be exactly one of these English lowercase codes — high, medium, low — regardless of the output language. Do NOT translate this value; the interface reads it as a code and shows the reader a phrase. Never put a percentage, score or rating anywhere in the response.
3. Keep every field to one tight sentence.
4. Never place a double-quote (") character inside any JSON string value — it breaks the JSON.`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 3000,
      system: withLanguage(systemPrompt, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'tip-of-tongue-refine' });

    if (!parsed.matches || !parsed.matches.length) {
      return res.status(500).json({ error: 'Could not refine matches. Please try again.' });
    }
    await clueCheck(parsed, [`Description: ${originalDescription}`, `Feedback on earlier guesses:\n${feedback}`,
      refinement && `More detail: ${refinement}`].filter(Boolean).join('\n'), userLanguage, 'tip-of-tongue-refine');
    res.json(parsed);

  } catch (error) {
    console.error('Tip of Tongue refine error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
