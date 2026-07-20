const express = require('express');
const router = express.Router();
const { withLanguage, callClaudeWithRetry } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

// ═══════════════════════════════════════════════════
// ROUTE 1: MAIN — Find structural historical parallels
// ═══════════════════════════════════════════════════
router.post('/history-today', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { event, context, userLanguage } = req.body;

    if (!event?.trim()) {
      return res.status(400).json({ error: 'Describe a current event, trend, or controversy.' });
    }

    const contextNote = context?.trim()
      ? `\nUSER'S SPECIFIC ANGLE: "${context}" — weight your parallel selection toward this framing.`
      : '';

    const systemPrompt = withLanguage(`You are a structural historian. You find deep parallels between current events and historical ones — NOT surface-level analogies ("it's like Rome falling"), but structurally specific matches based on power dynamics, institutional behavior, public sentiment, economic pressures, and how similar situations actually played out.

YOUR PRINCIPLES:
- Structural similarity matters more than surface similarity. A trade war might parallel a 17th-century guild dispute better than another trade war.
- Always explain HOW people at the time understood the situation — their framing was usually wrong in instructive ways.
- The most valuable part is where the analogy BREAKS DOWN. Every parallel is imperfect. The differences predict what will be different this time.
- Be specific. Names, dates, numbers. Not "in ancient Rome" but "during the Crisis of the Third Century, specifically 235-284 CE."
- Avoid the 5 most overused analogies (fall of Rome, Weimar Germany, 1930s appeasement, dot-com bubble, Titanic) UNLESS they are genuinely the best structural match. Reach deeper.
- Present multiple parallels. The truth is usually a composite.

REALITY & RELEVANCE CHECK (do this FIRST, before finding any parallels):
- Assess the input's factual premise. If it states something FALSE or inverts a documented fact (e.g. claims a living person died, denies a well-documented event, or asserts a conspiracy), do NOT treat it as a real event or a neutral "counterfactual" — plainly state what is actually true and that the claim is false or unverifiable. If the input is not a current event, trend, or controversy, note that.
- You may still surface structural parallels, but when the premise is false you are analyzing the PHENOMENON of the false belief (how and why such claims spread and persist), never validating the claim as if it happened. Lead with the correction; never lend it false authority.`, userLanguage);

    const prompt = withLanguage(`CURRENT EVENT:
"${event.trim()}"${contextNote}

Find the 2 strongest structural historical parallels. For each:
1. Explain the historical situation with enough detail that someone unfamiliar would understand it
2. Map the structural similarities explicitly (not just "this is similar" but "the mechanism is the same because...")
3. Explain how contemporaries understood it at the time — and how they were wrong
4. Explain what eventually happened
5. Identify specifically where the analogy breaks down and why

Then synthesize: what do these parallels collectively suggest?

OUTPUT LIMITS (CRITICAL — the response MUST be complete, valid JSON that fits well within the token budget):
- Provide exactly 2 parallels — the two strongest structural matches (do not add a third).
- Per parallel: at most 2 structural_similarities, at most 2 where_it_breaks_down, at most 2 key_figures.
- At most 2 further_reading entries.
- Respect every field's stated length (one sentence means one sentence). Be concise and never pad — a focused, fully-closed JSON response is far more useful than a longer one that gets truncated.

FURTHER READING: each title must be ONE exact real book title (with its real author) — never blend two titles; omit an entry rather than approximate.

Return ONLY valid JSON:
{
  "event_summary": "One-sentence restatement of the current event being analyzed — 1-2 sentences",
  "premise_check": {
    "status": "one of: sound | false_premise | unverifiable | not_current_event",
    "assessment": "If status is NOT 'sound': plainly state what is actually true and correct the false/unverifiable claim, or note it is not a current event — 1-2 sentences. If status is 'sound': empty string."
  },
  "parallels": [
    {
      "title": "Short evocative title — e.g., 'The South Sea Bubble (1720)' — 3-6 words",
      "period": "Specific date range — one sentence",
      "region": "Where this happened — one sentence",
      "structural_match_score": 78,
      "what_happened": "2-3 sentences explaining the historical situation with specific names, dates, numbers",
      "structural_similarities": [
        {
          "mechanism": "The shared structural mechanism — e.g., 'Regulatory capture by the entity being regulated' — one sentence",
          "then": "How it manifested historically — one sentence",
          "now": "How it manifests in the current event — one sentence"
        }
      ],
      "contemporary_understanding": "How people AT THE TIME understood what was happening — and how they were wrong — one sentence",
      "what_happened_next": "The outcome. Be specific. Include timeline. — one sentence",
      "where_it_breaks_down": [
        "Specific difference #1 and why it matters",
        "Specific difference #2 and why it matters"
      ],
      "key_figures": [
        {
          "historical": "Name and role — one sentence",
          "modern_parallel": "Who occupies a similar structural position today (or 'no clear parallel') — one sentence"
        }
      ],
      "surprise_insight": "The one thing most people would NOT expect from this parallel — one sentence"
    }
  ],
  "synthesis": {
    "collective_pattern": "What do these parallels collectively suggest about how this is likely to unfold? — one sentence",
    "consensus_prediction": "If history rhymes, the most likely trajectory is... — one sentence",
    "wildcard": "The thing that could make this time genuinely different — one sentence",
    "confidence_note": "Honest assessment of how strong these parallels actually are — one sentence"
  },
  "further_reading": [
    {
      "title": "Book or article title — 3-6 words",
      "author": "Author name — one sentence",
      "why": "Why this is the right thing to read next — one sentence"
    }
  ]
}`, userLanguage);

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 8000,
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }],
    }, { label: 'history-today' });

    if (!parsed.event_summary) {
      return res.status(500).json({ error: 'Could not find historical parallels. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('[HistoryToday] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 2: DEEPER — Expand one parallel with full detail
// ═══════════════════════════════════════════════════
router.post('/history-today-deeper', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { event, parallel, userLanguage } = req.body;

    if (!parallel?.title) {
      return res.status(400).json({ error: 'Select a parallel to explore.' });
    }

    const prompt = withLanguage(`The user is exploring a historical parallel in depth.

CURRENT EVENT: "${event}"
PARALLEL: "${parallel.title}" (${parallel.period})
SUMMARY: ${parallel.what_happened}

Go much deeper. Provide:
1. A detailed narrative of how this historical situation unfolded — month by month or year by year
2. The key decision points where things could have gone differently
3. The information environment — what did people know, what were they told, what did they believe?
4. Who benefited and who suffered, and how long it took for outcomes to become clear
5. What lessons contemporaries drew from it — and whether those lessons were correct
6. Specific quotes from the time that echo current discourse — only include a quote if you are confident it is genuine and accurately attributed to the named speaker. If you are not sure a quote is real and correctly attributed, OMIT that entry entirely rather than inventing or paraphrasing one. An empty echoing_quotes array is acceptable.

Return ONLY valid JSON:
{
  "title": "${parallel.title}",
  "detailed_narrative": "A rich, specific, 200-300 word narrative of how events unfolded chronologically",
  "timeline": [
    {
      "date": "Specific date or period — one sentence",
      "event": "What happened — one sentence",
      "significance": "Why this moment mattered — one sentence",
      "modern_echo": "What this stage looks like in the current situation (or null) — one sentence"
    }
  ],
  "turning_points": [
    {
      "moment": "The decision or event — one sentence",
      "what_actually_happened": "What was chosen — one sentence",
      "alternative": "What could have happened instead — one sentence",
      "why_it_went_this_way": "The structural reason this path was taken — one sentence"
    }
  ],
  "information_environment": {
    "what_people_knew": "What information was available — one sentence",
    "what_they_were_told": "The official narrative — one sentence",
    "what_they_believed": "The prevailing public understanding — one sentence",
    "what_was_actually_true": "The reality, as we now understand it — one sentence"
  },
  "winners_and_losers": {
    "who_benefited": "Specific groups and how — one sentence",
    "who_suffered": "Specific groups and how — one sentence",
    "time_to_clarity": "How long before outcomes were clear — one sentence"
  },
  "echoing_quotes": [
    {
      "quote": "A real historical quote — one sentence",
      "speaker": "Who said it — one sentence",
      "date": "When",
      "modern_resonance": "Why this sounds familiar today — one sentence"
    }
  ],
  "lessons_drawn": {
    "at_the_time": "What lesson contemporaries drew — one sentence",
    "in_hindsight": "What lesson historians draw — one sentence",
    "applicable_now": "Which lesson actually applies to the current situation — one sentence"
  }
}`, userLanguage);

    const parsed = await callClaudeWithRetry({
      model: MODELS.FAST,
      max_tokens: 3500,
      system: withLanguage('You are a narrative historian who brings the past to life with specificity and honesty. Return ONLY valid JSON. No markdown.', userLanguage),
      messages: [{ role: 'user', content: prompt }],
    }, { label: 'history-today-deeper' });

    if (!parsed.title) {
      return res.status(500).json({ error: 'Could not find historical parallels. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('[HistoryTodayDeeper] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 3: COUNTER — Find opposite-outcome parallel
// ═══════════════════════════════════════════════════
router.post('/history-today-counter', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { event, parallels, userLanguage } = req.body;

    if (!event?.trim()) {
      return res.status(400).json({ error: 'Event is required.' });
    }

    const existingTitles = parallels?.map(p => p.title).join(', ') || 'none';

    const prompt = withLanguage(`The user has been shown historical parallels for this current event. Now find the COUNTER-EXAMPLE: a situation with similar starting conditions that went a fundamentally DIFFERENT direction.

CURRENT EVENT: "${event}"
PARALLELS ALREADY SHOWN: ${existingTitles}

Find a historical situation where:
- The starting conditions were structurally similar
- But the outcome was very different (better OR worse)
- The reason for the different outcome is identifiable

This is the most intellectually honest part of the analysis: acknowledging that similar conditions don't always produce similar results.

For "hope_or_warning", return exactly one bare token — either "hope" (if this counter-example suggests things could go better than the main parallels imply) or "warning" (if it suggests they could go worse). No other text in that field.

Return ONLY valid JSON:
{
  "title": "Short title — e.g., 'The Danish Flexible Security Model (1990s)' — 3-6 words",
  "period": "Specific date range — one sentence",
  "region": "Where",
  "similar_starting_conditions": [
    "Condition shared with the current situation"
  ],
  "what_happened_differently": "3-5 sentences on what happened and why the outcome diverged",
  "why_it_diverged": {
    "key_difference": "The single most important factor that produced a different outcome — one sentence",
    "structural_reason": "Why this difference mattered so much — one sentence",
    "was_it_luck_or_choice": "Whether the different outcome was the result of deliberate action, accident, or structural factors beyond anyone's control — one sentence"
  },
  "implication_for_today": "What this counter-example specifically suggests about the current situation — what would need to be true for the current event to follow THIS path instead — one sentence",
  "hope_or_warning": "hope|warning",
  "key_takeaway": "One sentence the user should remember"
}`, userLanguage);

    const parsed = await callClaudeWithRetry({
      model: MODELS.FAST,
      max_tokens: 2500,
      system: withLanguage('You are a structural historian focused on why similar conditions sometimes produce different outcomes. Return ONLY valid JSON. No markdown.', userLanguage),
      messages: [{ role: 'user', content: prompt }],
    }, { label: 'history-today-counter' });

    if (!parsed.title) {
      return res.status(500).json({ error: 'Could not find historical parallels. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('[HistoryTodayCounter] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
