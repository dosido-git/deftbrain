const express = require('express');
const router = express.Router();
const { withLanguage, callClaudeWithRetry } = require('../lib/claude');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

// ════════════════════════════════════════════
// MAIN ENDPOINT: Spoiler-free recap
// ════════════════════════════════════════════
router.post('/bookmark', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const {
      mediaType,         // 'show', 'book', 'game', 'sports'
      title,             // Title of the show/book/game OR team/league name
      stoppedAt,         // "Season 2 Episode 5", "Chapter 12", "After the Water Temple", "January 2025"
      whatYouRemember,   // Optional: what they recall to help calibrate
      spoilerLevel,      // 'strict' (default), 'moderate', 'don't-care'
      specificQuestions,  // Optional: "Who is the guy with the scar?", "Did my team make any trades?"
      userLanguage,
    } = req.body;

    if (!title?.trim() || !stoppedAt?.trim()) {
      return res.status(400).json({ error: 'Tell us what you were watching/reading/playing and where you stopped' });
    }

    const spoilerPolicy = {
      strict: 'CRITICAL: Reveal NOTHING that happens after the point they stopped. No hints, no foreshadowing, no "you\'re in for a treat." Treat everything after their stopping point as classified.',
      moderate: 'You can hint at general tone ("things get more intense") but reveal NO specific plot points, outcomes, or character fates after their stopping point.',
      'don\'t-care': 'They don\'t mind spoilers. You can reference future events if it helps them decide whether to continue. Still organize the recap around where they stopped.',
    }[spoilerLevel || 'strict'] || 'Reveal NOTHING after their stopping point.';

    const mediaPrompts = {
      show: `MEDIA TYPE: TV Show / Series
TITLE: "${title}"
STOPPED AT: ${stoppedAt}
${whatYouRemember ? `WHAT THEY REMEMBER: ${whatYouRemember}` : ''}
${specificQuestions ? `SPECIFIC QUESTIONS: ${specificQuestions}` : ''}

SPOILER POLICY: ${spoilerPolicy}

Generate a spoiler-safe recap. Return ONLY valid JSON:
{
  "title": "${title}",
  "media_type": "show",
  "stopped_at": "${stoppedAt}",
  "confidence": "high, medium, or low — how confident you are in your knowledge of this show up to this point (number)",
  "confidence_note": "Brief note if confidence is not high (e.g., 'I may be off by an episode on exact scene placement') — one sentence",

  "the_story_so_far": "2-4 paragraph recap of the major plot threads UP TO where they stopped. Written in present tense as if they just paused. End with what was actively unfolding when they stopped. — one sentence",

  "characters": [
    {
      "name": "Character name — 3-6 words",
      "refresher": "Who they are and what they're up to AT the stopping point — one sentence",
      "relationships": "Key connections to other characters — one sentence",
      "last_seen": "What they were doing the last time we saw them — one sentence"
    }
  ],

  "active_threads": [
    {
      "thread": "Name of the plot thread — one sentence",
      "status": "Where this thread stands at the stopping point — one sentence",
      "tension": "What the unresolved question is — one sentence"
    }
  ],

  "vibe_check": "The emotional/tonal state of the show at this point — are we in a dark stretch? Comedy peak? Building tension? — one sentence",

  "where_you_left_off": "A vivid 1-2 sentence description of the last major scene or moment, to trigger their memory",

  "worth_continuing": "Without spoilers, a honest take on whether the show maintains quality from this point (vague: 'the next stretch is widely considered the show's peak' or 'it gets uneven but has great moments') — one sentence",

  "answers": [
    {
      "question": "Their specific question — one sentence",
      "answer": "Spoiler-safe answer — one sentence"
    }
  ] or []
}`,

      book: `MEDIA TYPE: Book
TITLE: "${title}"
STOPPED AT: ${stoppedAt}
${whatYouRemember ? `WHAT THEY REMEMBER: ${whatYouRemember}` : ''}
${specificQuestions ? `SPECIFIC QUESTIONS: ${specificQuestions}` : ''}

SPOILER POLICY: ${spoilerPolicy}

Generate a spoiler-safe recap. Return ONLY valid JSON:
{
  "title": "${title}",
  "media_type": "book",
  "stopped_at": "${stoppedAt}",
  "confidence": "high, medium, or low (number)",
  "confidence_note": "Brief note if not high — one sentence",

  "the_story_so_far": "2-4 paragraph recap of major plot and themes UP TO where they stopped. — one sentence",

  "characters": [
    {
      "name": "Character name — 3-6 words",
      "refresher": "Who they are at this point in the book — one sentence",
      "relationships": "Key connections — one sentence",
      "last_seen": "What was happening with them — one sentence"
    }
  ],

  "active_threads": [
    {
      "thread": "Plot thread or thematic element — one sentence",
      "status": "Where it stands — one sentence",
      "tension": "The unresolved question — one sentence"
    }
  ],

  "world_building_refresh": "Key setting details, rules, or context that are easy to forget (especially for fantasy/sci-fi) — one sentence",

  "vibe_check": "The tone and emotional register at this point in the book — one sentence",

  "where_you_left_off": "Vivid description of the last major moment to trigger memory — one sentence",

  "worth_continuing": "Honest, spoiler-free take on whether the book rewards finishing — one sentence",

  "reading_tip": "Practical suggestion: 'You might want to re-read the last chapter to get back in the flow' or 'You can jump right back in' — one sentence",

  "answers": [] or [{ "question": "...", "answer": "..." }]
}`,

      game: `MEDIA TYPE: Video Game
TITLE: "${title}"
STOPPED AT: ${stoppedAt}
${whatYouRemember ? `WHAT THEY REMEMBER: ${whatYouRemember}` : ''}
${specificQuestions ? `SPECIFIC QUESTIONS: ${specificQuestions}` : ''}

SPOILER POLICY: ${spoilerPolicy}

Generate a spoiler-safe recap. Return ONLY valid JSON:
{
  "title": "${title}",
  "media_type": "game",
  "stopped_at": "${stoppedAt}",
  "confidence": "high, medium, or low (number)",
  "confidence_note": "Brief note if not high — one sentence",

  "the_story_so_far": "2-4 paragraph recap of story/narrative UP TO where they stopped. — one sentence",

  "characters": [
    {
      "name": "Character name — 3-6 words",
      "refresher": "Who they are and their role — one sentence",
      "relationships": "Key connections — one sentence",
      "last_seen": "What was happening with them — one sentence"
    }
  ],

  "gameplay_refresh": {
    "mechanics_unlocked": "What abilities/tools/systems they should have by this point — one sentence",
    "current_objective": "What the game was asking them to do — one sentence",
    "difficulty_note": "Any heads-up about difficulty at this point — one sentence"
  },

  "active_threads": [
    {
      "thread": "Story or side quest thread — one sentence",
      "status": "Where it stands — one sentence",
      "tension": "Unresolved question — one sentence"
    }
  ],

  "vibe_check": "The tone and feel of the game at this point — one sentence",

  "where_you_left_off": "Vivid description to trigger memory — one sentence",

  "worth_continuing": "Spoiler-free take on whether finishing is rewarding — one sentence",

  "re-entry_tip": "Practical: 'Lower the difficulty for the first hour to re-learn controls' or 'Check your quest log, there were a lot of active side quests'",

  "answers": [] or [{ "question": "...", "answer": "..." }]
}`,

      sports: `MEDIA TYPE: Sports
TEAM/LEAGUE: "${title}"
STOPPED FOLLOWING: ${stoppedAt}
${whatYouRemember ? `WHAT THEY REMEMBER: ${whatYouRemember}` : ''}
${specificQuestions ? `SPECIFIC QUESTIONS: ${specificQuestions}` : ''}

SPOILER POLICY: ${spoilerPolicy}

Generate a catch-up guide. For sports, "spoilers" means outcomes of specific games they might want to watch. Return ONLY valid JSON:
{
  "title": "${title}",
  "media_type": "sports",
  "stopped_at": "${stoppedAt}",
  "confidence": "high, medium, or low (number)",
  "confidence_note": "Brief note if not high — especially for very recent events you may not know about — one sentence",

  "the_story_so_far": "2-4 paragraph narrative recap of the season/storylines from where they stopped to now. Focus on storylines, not just scores. Written like great sports journalism. — one sentence",

  "standings_context": "Where their team (or the league) stands — playoff picture, standings, trajectory. Be specific with records if confident. — 1-2 sentences",

  "key_storylines": [
    {
      "storyline": "The narrative thread — one sentence",
      "what_happened": "Brief summary — one sentence",
      "why_it_matters": "Context for why this is significant — one sentence"
    }
  ],

  "roster_changes": [
    {
      "change": "Trade, signing, injury, return, firing, etc. — one sentence",
      "impact": "What this means for the team (number)"
    }
  ] or [],

  "must_watch_games": [
    {
      "game": "Description without revealing outcome (e.g., 'Lakers vs Celtics, March 15') — one sentence",
      "why": "Why this game is worth watching blind — be vague about outcome — one sentence",
      "spoiler_level": "outcome_unknown (watch it blind) or outcome_revealed (result mentioned in storylines above) — one sentence"
    }
  ],

  "vibe_check": "The general feel of the season — is it exciting? Disappointing? Historic? — one sentence",

  "conversation_ready": "2-3 talking points so they can hold their own in a sports conversation right now without revealing they've been out of the loop — one sentence",

  "answers": [] or [{ "question": "...", "answer": "..." }]
}`,
    };

    const prompt = mediaPrompts[mediaType] || mediaPrompts.show;

    const systemPrompt = `Media return guide. Give people exactly the context they need to pick up where they left off — show, book, game, or sports — without spoiling anything ahead.

Remind them why they cared, who the key players are, where the tension sits, and what to watch for next. Calibrate depth to how long they've been away.

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.`;

    const data = await callClaudeWithRetry({
model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: prompt }],
    }, { label: 'bookmark' });
    if (!data.title) {
      return res.status(500).json({ error: 'Could not generate a response. Please try again.' });
    }
    res.json(data);

  } catch (error) {
    console.error('Bookmark error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.'});
  }
});

module.exports = router;
