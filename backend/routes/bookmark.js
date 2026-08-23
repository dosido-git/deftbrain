const express = require('express');
const router = express.Router();
const { withLanguage, callClaudeWithRetry } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');
const { groundedFacts, normalizeKeyPart } = require('../lib/groundedFacts');

// ════════════════════════════════════════════
// GROUNDING — where the stopping point actually falls
// ════════════════════════════════════════════
// Every other grounded tool here uses search to be more certain. This one uses
// it to be more silent. What recall is worst at is not the events but their
// ORDER, and an accurate fact from the next episode is still a spoiler — the
// one failure this tool exists to prevent. So the search establishes the
// boundary rather than the content: what had definitely happened by the point
// they stopped, and what had not yet.
//
// The asymmetry runs the opposite way to the rest of the codebase. Elsewhere,
// unverified means say it is unverified. Here it means leave it out: a caveat
// does not un-spoil anything, and a thin recap costs a moment of remembering.
const CHRONOLOGY_TTL_MS = 90 * 24 * 60 * 60 * 1000; // a published plot does not move
const COLD_WAIT_MS = 20000;

function chronologyFacts({ title, stoppedAt, mediaType }) {
  const t = String(title || '').trim();
  const at = String(stoppedAt || '').trim();
  if (t.length < 2 || at.length < 1) return Promise.resolve('');
  return groundedFacts({
    cacheKey: `bookmark:${normalizeKeyPart(mediaType || 'show')}:${normalizeKeyPart(t.slice(0, 70))}:${normalizeKeyPart(at.slice(0, 40))}`,
    label: 'bookmark-chronology',
    ttlMs: CHRONOLOGY_TTL_MS,
    coldWaitMs: COLD_WAIT_MS,
    maxTokens: 3000,
    system: 'You establish where a specific point falls in a published work, using episode guides, chapter listings, official synopses and encyclopaedic references. You are being used to PREVENT spoilers, so err relentlessly toward the earlier reading: when you cannot place something with certainty, leave it out rather than guessing. Report only what you can confirm from a page. Return ONLY valid JSON. Never place a double-quote (") character inside any JSON string value.',
    userPrompt: `Establish the chronology of "${t.slice(0, 200)}" (${mediaType || 'show'}) up to and including this exact stopping point: "${at.slice(0, 120)}".

You are drawing a line, not writing a recap. What is needed is which developments are on the reader's side of it and which are not.

Confirm from sources:
(1) what the stopping point corresponds to — its place in the sequence, and what happens in that instalment itself;
(2) the major developments that have DEFINITELY occurred at or before it;
(3) the developments that come AFTER it and must therefore never be mentioned — naming these is what makes the boundary usable;
(4) anything you could not place with confidence on one side or the other.

A development you cannot place goes in (4), never in (2). Being wrong in (2) spoils the thing this reader came here to protect.

Return ONLY valid JSON:
{ "position": "What this stopping point is, in the work's own terms. Empty string if you could not establish it.",
  "before": ["A development confirmed to have happened at or before the stopping point"],
  "after": ["A development confirmed to come after it — for exclusion, never for retelling"],
  "unplaced": ["Something you could not place with confidence on either side"],
  "source": "The domain you checked against. Empty string if none." }`,
    render: (clean) => {
      if (!clean || (!clean.position && !Array.isArray(clean.before))) return '';
      const list = (a) => (Array.isArray(a) && a.length ? a.map(x => `  - ${x}`).join('\n') : '  (none established)');
      return `\n\nVERIFIED CHRONOLOGY, CHECKED TODAY${clean.source ? ` against ${clean.source}` : ''} — this is the boundary, and it OVERRIDES your own recollection of this title wherever the two differ.
STOPPING POINT: ${clean.position || 'could not be established'}
CONFIRMED AT OR BEFORE IT — safe to use:
${list(clean.before)}
CONFIRMED AFTER IT — these are spoilers. Do not mention, hint at, foreshadow, or let any of them shape how you describe what came before:
${list(clean.after)}
COULD NOT BE PLACED — treat every one of these as if it were after. Do not use them:
${list(clean.unplaced)}

Where this block and your memory disagree, the block wins. Where the block is silent about something, your memory has not been checked and the conservatism rule applies in full: leave it out.`;
    },
  });
}

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
      moderate: 'Thematic direction only — you may say the tone shifts or the stakes rise. No events, no outcomes, no character fates, no arrivals or departures, and nothing that would change what they expect to see next. A hint that lets them guess the thing is the thing.',
      'don\'t-care': 'They don\'t mind spoilers. You can reference future events if it helps them decide whether to continue. Still organize the recap around where they stopped.',
    }[spoilerLevel || 'strict'] || 'Reveal NOTHING after their stopping point.';

    // Prepended to every media prompt — the one rule the whole tool rests on.
    const SPOILER_CONSERVATISM = `WHEN IN DOUBT, LEAVE IT OUT. This is the rule that outranks every other instruction here, including completeness, vividness and length.
Episode and chapter boundaries are exactly the thing recall is worst at. If you cannot place a detail with certainty on the correct side of their stopping point, do not include it — not as a hint, not softened, not hedged. A recap that is slightly thin costs them a moment of remembering. A recap that is slightly early costs them the thing they came here to protect. Those are not the same size of mistake, so never split the difference.
Prefer what they told you they remember over what you recall about the title: their own words are dated evidence of where they actually are.
If a VERIFIED CHRONOLOGY block appears at the end of this prompt, it is the boundary and it overrides your recollection wherever they differ. It does NOT license you to reach further: it tells you where the wall is, and everything the rule above says about doubt still applies to everything the block does not cover. A checked list of what came after exists so you can avoid those things, never so you can allude to them.
Say plainly when something is beyond what you can place — 'that thread is still open where you stopped' or 'I would rather not guess at the exact scene' is a good answer. Filling the gap confidently is the only bad one.`;

    const mediaPrompts = {
      show: `MEDIA TYPE: TV Show / Series
TITLE: "${title}"
STOPPED AT: ${stoppedAt}
${whatYouRemember ? `WHAT THEY REMEMBER: ${whatYouRemember}` : ''}
${specificQuestions ? `SPECIFIC QUESTIONS: ${specificQuestions}` : ''}

${SPOILER_CONSERVATISM}

SPOILER POLICY: ${spoilerPolicy}

Generate a spoiler-safe recap. SCHEMA DISCIPLINE: the_story_so_far is ONE JSON string — all paragraphs inside it separated by \n\n; NEVER invent additional keys (no _continued variants). SPOILER RULE: if a question's answer is only revealed after the user's stopping point, say it is not yet revealed where they stopped — never state later reveals as fact.

Return ONLY valid JSON:
{
  "title": "${title}",
  "media_type": "show",
  "stopped_at": "${stoppedAt}",
  "before_you_press_play": ["The two to four things they actually need in their head to start again, and nothing more. Each one short — a name and why it matters, an unresolved question, where they physically are. This is the whole recap for someone who only reads one section, so it must survive on its own. Same certainty bar as everything else: only what you can place at or before their stopping point."],
  "confidence": "high | medium | low — how confident you are in your knowledge of this show up to this point",
  "confidence_note": "Brief note if confidence is not high (e.g., 'I may be off by an episode on exact scene placement') — one sentence",

  "the_story_so_far": "2-4 paragraph recap of the major plot threads UP TO where they stopped. Written in present tense as if they just paused. End with what was actively unfolding when they stopped.",

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
      "thread": "Name of the plot thread. Nothing else.",
      "status": "Where this thread stands at the stopping point — one sentence",
      "tension": "What the unresolved question is — one sentence"
    }
  ],

  "vibe_check": "The emotional/tonal state of the show at this point — are we in a dark stretch? Comedy peak? Building tension? — one sentence",

  "where_you_left_off": "The last major scene or moment, to trigger their memory — but ONLY if you can place it with certainty at or before their stopping point. Prefer what they said they remember. null if you are not sure which scene is the last one they saw; a wrong guess here is the spoiler this tool exists to prevent. — 1-2 sentences or null",

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

${SPOILER_CONSERVATISM}

SPOILER POLICY: ${spoilerPolicy}

Generate a spoiler-safe recap. Return ONLY valid JSON:
{
  "title": "${title}",
  "media_type": "book",
  "stopped_at": "${stoppedAt}",
  "before_you_press_play": ["The two to four things they actually need in their head to start again, and nothing more. Each one short — a name and why it matters, an unresolved question, where they physically are. This is the whole recap for someone who only reads one section, so it must survive on its own. Same certainty bar as everything else: only what you can place at or before their stopping point."],
  "confidence": "high | medium | low",
  "confidence_note": "Brief note if not high — one sentence",

  "the_story_so_far": "2-4 paragraph recap of major plot and themes UP TO where they stopped.",

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
      "thread": "Plot thread or thematic element. Nothing else.",
      "status": "Where it stands — one sentence",
      "tension": "The unresolved question — one sentence"
    }
  ],

  "world_building_refresh": "Key setting details, rules, or context that are easy to forget (especially for fantasy/sci-fi) — one sentence",

  "vibe_check": "The tone and emotional register at this point in the book — one sentence",

  "where_you_left_off": "The last major moment, to trigger memory — ONLY if you can place it with certainty at or before their stopping point. Prefer what they said they remember. null if unsure. — one sentence or null",

  "worth_continuing": "Honest, spoiler-free take on whether the book rewards finishing — one sentence",

  "reading_tip": "Practical suggestion: 'You might want to re-read the last chapter to get back in the flow' or 'You can jump right back in' — one sentence",

  "answers": [] or [{ "question": "...", "answer": "..." }]
}`,

      game: `MEDIA TYPE: Video Game
TITLE: "${title}"
STOPPED AT: ${stoppedAt}
${whatYouRemember ? `WHAT THEY REMEMBER: ${whatYouRemember}` : ''}
${specificQuestions ? `SPECIFIC QUESTIONS: ${specificQuestions}` : ''}

${SPOILER_CONSERVATISM}

SPOILER POLICY: ${spoilerPolicy}

Generate a spoiler-safe recap. Return ONLY valid JSON:
{
  "title": "${title}",
  "media_type": "game",
  "stopped_at": "${stoppedAt}",
  "before_you_press_play": ["The two to four things they actually need in their head to start again, and nothing more. Each one short — a name and why it matters, an unresolved question, where they physically are. This is the whole recap for someone who only reads one section, so it must survive on its own. Same certainty bar as everything else: only what you can place at or before their stopping point."],
  "confidence": "high | medium | low",
  "confidence_note": "Brief note if not high — one sentence",

  "the_story_so_far": "2-4 paragraph recap of story/narrative UP TO where they stopped.",

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
      "thread": "Story or side quest thread. Nothing else.",
      "status": "Where it stands — one sentence",
      "tension": "Unresolved question — one sentence"
    }
  ],

  "vibe_check": "The tone and feel of the game at this point — one sentence",

  "where_you_left_off": "The last moment, to trigger memory — ONLY if you can place it with certainty at or before their stopping point. null if unsure. — one sentence or null",

  "worth_continuing": "Spoiler-free take on whether finishing is rewarding — one sentence",

  "re-entry_tip": "Practical: 'Lower the difficulty for the first hour to re-learn controls' or 'Check your quest log, there were a lot of active side quests'",

  "answers": [] or [{ "question": "...", "answer": "..." }]
}`,

      sports: `MEDIA TYPE: Sports
TEAM/LEAGUE: "${title}"
STOPPED FOLLOWING: ${stoppedAt}
${whatYouRemember ? `WHAT THEY REMEMBER: ${whatYouRemember}` : ''}
${specificQuestions ? `SPECIFIC QUESTIONS: ${specificQuestions}` : ''}

${SPOILER_CONSERVATISM}

SPOILER POLICY: ${spoilerPolicy}

Generate a catch-up guide. For sports, "spoilers" means outcomes of specific games they might want to watch. Return ONLY valid JSON:
{
  "title": "${title}",
  "media_type": "sports",
  "stopped_at": "${stoppedAt}",
  "before_you_press_play": ["The two to four things they actually need in their head to start again, and nothing more. Each one short — a name and why it matters, an unresolved question, where they physically are. This is the whole recap for someone who only reads one section, so it must survive on its own. Same certainty bar as everything else: only what you can place at or before their stopping point."],
  "confidence": "high | medium | low",
  "confidence_note": "Brief note if not high — especially for very recent events you may not know about — one sentence",

  "the_story_so_far": "2-4 paragraph narrative recap of the season/storylines from where they stopped to now. Focus on storylines, not just scores. Written like great sports journalism.",

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
      "impact": "What this means for the team — one sentence"
    }
  ] or [],

  "must_watch_games": [
    {
      "game": "Description without revealing outcome (e.g., 'Lakers vs Celtics, March 15') — one sentence",
      "why": "Why this game is worth watching blind — be vague about outcome — one sentence",
      "spoiler_level": "outcome_unknown | outcome_revealed"
    }
  ],

  "vibe_check": "The general feel of the season — is it exciting? Disappointing? Historic? — one sentence",

  "conversation_ready": "2-3 talking points so they can hold their own in a sports conversation right now without revealing they've been out of the loop — one sentence",

  "answers": [] or [{ "question": "...", "answer": "..." }]
}`,
    };

    const chronology = await chronologyFacts({ title, stoppedAt, mediaType }).catch(() => '');
    const prompt = (mediaPrompts[mediaType] || mediaPrompts.show) + chronology;

    const systemPrompt = `Media return guide. Give people exactly the context they need to pick up where they left off — show, book, game, or sports — without spoiling anything ahead.

Remind them why they cared, who the key players are, where the tension sits, and what to watch for next. Calibrate depth to how long they've been away.

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.

Never place a double-quote (") character inside any JSON string value — write quoted dialogue, titles, or nicknames plainly or with single quotes, or it breaks the JSON.`;

    const data = await callClaudeWithRetry({
model: MODELS.SMART,
      max_tokens: 5000,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: prompt }],
    }, { label: 'bookmark' });
    if (!data.title) {
      return res.status(500).json({ error: 'Could not generate a response. Please try again.' });
    }
    // Defensive: the model occasionally invents the_story_so_far_continued keys;
    // the frontend renders only the_story_so_far, silently dropping the rest
    // (audit 2026-07-19) — merge them back in.
    if (typeof data.the_story_so_far === 'string') {
      Object.keys(data).filter(k => /^the_story_so_far_continued/.test(k)).sort().forEach(k => {
        if (typeof data[k] === 'string') data.the_story_so_far += '\n\n' + data[k];
        delete data[k];
      });
    }
    res.json(data);

  } catch (error) {
    console.error('Bookmark error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.'});
  }
});

module.exports = router;
