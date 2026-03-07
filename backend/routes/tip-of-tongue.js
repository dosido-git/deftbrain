const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');

// ════════════════════════════════════════════════════════════
// SHARED
// ════════════════════════════════════════════════════════════
const PERSONALITY = `You are an identification expert with encyclopedic cross-domain knowledge. People describe things from memory — fragmentary, sensory, vibes-based — and you figure out what they're thinking of.

YOUR APPROACH:
- Take fuzzy sensory descriptions and cross-reference against your knowledge to narrow down candidates
- Always provide multiple ranked matches with confidence levels — never just one guess
- Explain WHY each match fits the description — connect the dots so they can confirm
- Include "how to find/recreate/verify" for each match — make it actionable
- When uncertain, describe what category of thing it likely is even if you can't name the exact item
- Use sensory language back at them — mirror their vocabulary
- Distinguish between "this is almost certainly it" and "this could be it" — be calibrated`;

// ════════════════════════════════════════════════════════════
// POST /tip-of-tongue — Main identification
// ════════════════════════════════════════════════════════════
router.post('/tip-of-tongue', async (req, res) => {
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

Identify what they're thinking of. Return ONLY valid JSON:

{
  "category_detected": "What type of thing this is (even if they picked a category, confirm or correct)",
  "thinking": "Brief explanation of your reasoning process — what clues you're working with and how you're narrowing it down. 2-3 sentences max.",

  "matches": [
    {
      "name": "Most likely identification — specific name",
      "confidence": "high | medium | low",
      "confidence_pct": 85,
      "why_it_fits": "Which specific details from their description match this — be vivid and connect the dots",
      "memory_trigger": "The one detail that will make them go 'YES that's it!' — a specific sensory moment, visual, or fact",
      "how_to_verify": "How to confirm this is right — what to search, listen for, look at, taste",
      "how_to_find": "Where to get/experience/recreate this right now — be specific (not 'search online')",
      "fun_fact": "One interesting thing about this item they probably don't know. null if nothing compelling."
    }
  ],

  "if_none_match": "If they read all matches and none are right, what to try next — what additional detail would help narrow it down. Phrased as a question.",

  "also_try": [
    {
      "name": "Related thing they might also enjoy based on their description",
      "why": "Why this is in the same vibe/family"
    }
  ]
}

Return 3-5 matches, ranked by confidence (highest first). If you're genuinely unsure, include fewer matches but with honest confidence levels — don't pad with low-confidence guesses.`;

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 3000,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = message.content.find(b => b.type === 'text')?.text || '';
    const parsed = JSON.parse(cleanJsonResponse(text));
    res.json(parsed);

  } catch (error) {
    console.error('Tip of Tongue error:', error);
    res.status(500).json({ error: error.message || 'Identification failed' });
  }
});

// ════════════════════════════════════════════════════════════
// POST /tip-of-tongue/refine — Narrow down after first attempt
// ════════════════════════════════════════════════════════════
router.post('/tip-of-tongue/refine', async (req, res) => {
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

REFINEMENT MODE: The user already got initial matches and gave feedback. Use their yes/no/close reactions to dramatically narrow the search. "Close" matches are gold — figure out what's close about them and what's different.`;

    const userPrompt = `ORIGINAL DESCRIPTION: "${originalDescription}"
CATEGORY: ${category || 'unknown'}

FEEDBACK ON PREVIOUS MATCHES:
${feedback}

${refinement ? `ADDITIONAL INFO: "${refinement}"` : ''}

Based on their feedback, refine the identification. Return ONLY valid JSON:

{
  "refined_thinking": "What the feedback tells you — which direction to pivot and why. 2-3 sentences.",
  "matches": [
    {
      "name": "Refined identification",
      "confidence": "high | medium | low",
      "confidence_pct": 85,
      "why_it_fits": "Why this is a better match given the feedback",
      "memory_trigger": "The detail that will confirm it",
      "how_to_verify": "How to check",
      "how_to_find": "Where to get it",
      "fun_fact": "Optional interesting fact. null if nothing."
    }
  ],
  "if_none_match": "What to try next if these still aren't right"
}

Return 2-4 refined matches.`;

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = message.content.find(b => b.type === 'text')?.text || '';
    const parsed = JSON.parse(cleanJsonResponse(text));
    res.json(parsed);

  } catch (error) {
    console.error('Tip of Tongue refine error:', error);
    res.status(500).json({ error: error.message || 'Refinement failed' });
  }
});

module.exports = router;
