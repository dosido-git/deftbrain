const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, withLanguage } = require('../lib/claude');

// ═══════════════════════════════════════════════════
// ROUTE 1: MAIN — Find structural historical parallels
// ═══════════════════════════════════════════════════
router.post('/history-today', async (req, res) => {
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
- Present multiple parallels. The truth is usually a composite.`, userLanguage);

    const prompt = withLanguage(`CURRENT EVENT:
"${event.trim()}"${contextNote}

Find 2-3 structural historical parallels. For each:
1. Explain the historical situation with enough detail that someone unfamiliar would understand it
2. Map the structural similarities explicitly (not just "this is similar" but "the mechanism is the same because...")
3. Explain how contemporaries understood it at the time — and how they were wrong
4. Explain what eventually happened
5. Identify specifically where the analogy breaks down and why

Then synthesize: what do these parallels collectively suggest?

Return ONLY valid JSON:
{
  "event_summary": "One-sentence restatement of the current event being analyzed",
  "parallels": [
    {
      "title": "Short evocative title — e.g., 'The South Sea Bubble (1720)'",
      "period": "Specific date range",
      "region": "Where this happened",
      "structural_match_score": 78,
      "what_happened": "3-5 sentences explaining the historical situation with specific names, dates, numbers",
      "structural_similarities": [
        {
          "mechanism": "The shared structural mechanism — e.g., 'Regulatory capture by the entity being regulated'",
          "then": "How it manifested historically",
          "now": "How it manifests in the current event"
        }
      ],
      "contemporary_understanding": "How people AT THE TIME understood what was happening — and how they were wrong",
      "what_happened_next": "The outcome. Be specific. Include timeline.",
      "where_it_breaks_down": [
        "Specific difference #1 and why it matters",
        "Specific difference #2 and why it matters"
      ],
      "key_figures": [
        {
          "historical": "Name and role",
          "modern_parallel": "Who occupies a similar structural position today (or 'no clear parallel')"
        }
      ],
      "surprise_insight": "The one thing most people would NOT expect from this parallel"
    }
  ],
  "synthesis": {
    "collective_pattern": "What do these parallels collectively suggest about how this is likely to unfold?",
    "consensus_prediction": "If history rhymes, the most likely trajectory is...",
    "wildcard": "The thing that could make this time genuinely different",
    "confidence_note": "Honest assessment of how strong these parallels actually are"
  },
  "further_reading": [
    {
      "title": "Book or article title",
      "author": "Author name",
      "why": "Why this is the right thing to read next"
    }
  ]
}`, userLanguage);

    const parsed = await callClaudeWithRetry(prompt, {
      label: 'HistoryToday',
      max_tokens: 6000,
      system: systemPrompt,
    });

    console.log(`[HistoryToday] Event: "${event.substring(0, 50)}", Parallels: ${parsed.parallels?.length}`);
    res.json(parsed);

  } catch (error) {
    console.error('[HistoryToday] Error:', error);
    res.status(500).json({ error: error.message || 'Failed to find parallels.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 2: DEEPER — Expand one parallel with full detail
// ═══════════════════════════════════════════════════
router.post('/history-today-deeper', async (req, res) => {
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
6. Specific quotes from the time that echo current discourse

Return ONLY valid JSON:
{
  "title": "${parallel.title}",
  "detailed_narrative": "A rich, specific, 200-300 word narrative of how events unfolded chronologically",
  "timeline": [
    {
      "date": "Specific date or period",
      "event": "What happened",
      "significance": "Why this moment mattered",
      "modern_echo": "What this stage looks like in the current situation (or null)"
    }
  ],
  "turning_points": [
    {
      "moment": "The decision or event",
      "what_actually_happened": "What was chosen",
      "alternative": "What could have happened instead",
      "why_it_went_this_way": "The structural reason this path was taken"
    }
  ],
  "information_environment": {
    "what_people_knew": "What information was available",
    "what_they_were_told": "The official narrative",
    "what_they_believed": "The prevailing public understanding",
    "what_was_actually_true": "The reality, as we now understand it"
  },
  "winners_and_losers": {
    "who_benefited": "Specific groups and how",
    "who_suffered": "Specific groups and how",
    "time_to_clarity": "How long before outcomes were clear"
  },
  "echoing_quotes": [
    {
      "quote": "A real historical quote",
      "speaker": "Who said it",
      "date": "When",
      "modern_resonance": "Why this sounds familiar today"
    }
  ],
  "lessons_drawn": {
    "at_the_time": "What lesson contemporaries drew",
    "in_hindsight": "What lesson historians draw",
    "applicable_now": "Which lesson actually applies to the current situation"
  }
}`, userLanguage);

    const parsed = await callClaudeWithRetry(prompt, {
      label: 'HistoryTodayDeeper',
      max_tokens: 5000,
      system: withLanguage('You are a narrative historian who brings the past to life with specificity and honesty. Return ONLY valid JSON. No markdown.', userLanguage),
    });

    console.log(`[HistoryTodayDeeper] Expanded: "${parallel.title}", Timeline: ${parsed.timeline?.length}`);
    res.json(parsed);

  } catch (error) {
    console.error('[HistoryTodayDeeper] Error:', error);
    res.status(500).json({ error: error.message || 'Failed to expand parallel.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 3: COUNTER — Find opposite-outcome parallel
// ═══════════════════════════════════════════════════
router.post('/history-today-counter', async (req, res) => {
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

Return ONLY valid JSON:
{
  "title": "Short title — e.g., 'The Danish Flexible Security Model (1990s)'",
  "period": "Specific date range",
  "region": "Where",
  "similar_starting_conditions": [
    "Condition shared with the current situation"
  ],
  "what_happened_differently": "3-5 sentences on what happened and why the outcome diverged",
  "why_it_diverged": {
    "key_difference": "The single most important factor that produced a different outcome",
    "structural_reason": "Why this difference mattered so much",
    "was_it_luck_or_choice": "Whether the different outcome was the result of deliberate action, accident, or structural factors beyond anyone's control"
  },
  "implication_for_today": "What this counter-example specifically suggests about the current situation — what would need to be true for the current event to follow THIS path instead",
  "hope_or_warning": "hope|warning — does this counter-example suggest things could go better or worse than the main parallels suggest?",
  "key_takeaway": "One sentence the user should remember"
}`, userLanguage);

    const parsed = await callClaudeWithRetry(prompt, {
      label: 'HistoryTodayCounter',
      max_tokens: 2500,
      system: withLanguage('You are a structural historian focused on why similar conditions sometimes produce different outcomes. Return ONLY valid JSON. No markdown.', userLanguage),
    });

    console.log(`[HistoryTodayCounter] Counter: "${parsed.title}", Type: ${parsed.hope_or_warning}`);
    res.json(parsed);

  } catch (error) {
    console.error('[HistoryTodayCounter] Error:', error);
    res.status(500).json({ error: error.message || 'Failed to find counter-example.' });
  }
});

module.exports = router;
