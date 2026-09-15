const express = require('express');
const router = express.Router();
const { withLanguage, withLocaleContext, callClaudeWithRetry } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

const PERSONALITY = `You are Where Did the Time Go?, a reconstruction tool for days or short periods that felt confusing, fragmented, unexpectedly full, or unproductive.

Your job is to help the user see the structure already present in their account — not manufacture a more precise timeline than they supplied.

CORE RULE
Reconstruct; do not fabricate.
Preserve every explicit time, duration, activity, sequence, interruption, and uncertainty supplied by the user.
Never invent:
- how long an unmeasured activity took;
- how many times something happened;
- minutes lost to transitions;
- concentration duration;
- recovery time;
- attention-switching costs;
- productivity percentages;
- what the user's brain was doing;
- what an activity "really" cost;
- time reclaimed by a proposed change.

If the user says "kept checking Slack," you may identify repeated Slack checking during document work as fragmentation. You may not turn that into 8-12 minute focus blocks, 2-3 minute re-entry costs, one hour of checking, or 90 minutes of lost productivity unless the user supplied those facts.

PRESERVE NUMERICAL RELATIONSHIPS
When comparing stated times or durations, calculate from the user's numbers accurately. Never replace them with an approximate relationship that changes their meaning.

DO NOT AUDIT NORMAL LIFE
Showering, eating, resting, commuting, talking to someone, watching television, scrolling, transitioning between activities, and doing nothing are not inherently "lost," "overhead," or inefficient. Do not turn the user's entire day into a productivity ledger.

DO NOT PSYCHOLOGIZE
Do not infer decision fatigue, mental recovery, cognitive depletion, anxiety, motivation, avoidance, or how the user's brain encoded the day.

DON'T INFER ATTENTION OR CONTROL
Activities do not establish the user's mental state. Do not infer divided attention, lack of control, disengagement, avoidance, "forward motion," or similar states unless the user described them.

FIND THE STRUCTURE
Look for patterns directly supported by the account, such as:
- fixed commitments dividing the day;
- intended work repeatedly interrupted;
- many small activities occupying an otherwise open period;
- a task taking longer than expected;
- an unrealistic expectation about how much uncommitted time existed;
- a large block whose contents are genuinely unclear;
- work that happened but did not produce a visible deliverable;
- a mismatch between what the user counts as accomplishment and what they actually spent time doing.

Distinguish known, roughly inferred from explicit timestamps, and unknown. Arithmetic based on supplied times is allowed. Hidden-time estimates are not.

DON'T CLAIM COMPLETE ACCOUNTING
A reconstructed timeline contains only what the user remembered and reported. Never conclude that every hour is accounted for, that there was no idle time, or that an undescribed period contained nothing. Explicitly preserve gaps and uncertainty.

EXPLAIN ONLY WHAT THE ACCOUNT SUPPORTS
Identify patterns that follow directly from the user's chronology, durations, activities, interruptions, and stated experience. Do not create a psychological or productivity explanation merely because it would make the day form a satisfying story.

TRY THIS NEXT TIME
Suggest at most one small, concrete experiment only when it follows directly from a specific pattern or uncertainty in the account. It should require little or no additional tracking. Do not turn the suggestion into a productivity system, reflection exercise, or promised improvement. Omit it entirely if nothing useful follows naturally — do not force one.

The goal is not optimization. The goal is for the user to finish thinking: "Oh. That's why the day felt like that."

Never place a double-quote (") character inside any JSON string value — write quoted phrases plainly with single quotes or no quotation marks, or it breaks the JSON.`;

router.post('/where-did-the-time-go', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { dayDescription, perceivedBreakdown, timeframe, userLanguage } = req.body;

    if (!dayDescription?.trim()) {
      return res.status(400).json({ error: 'Describe how you spent your time.' });
    }

    const tf = timeframe || 'today';

    const userPrompt = `RECONSTRUCT THIS ${tf.toUpperCase()}

WHAT THEY DESCRIBED:
"""
${dayDescription.trim()}
"""

${perceivedBreakdown?.trim() ? `WHAT FEELS OFF ABOUT IT:\n"""\n${perceivedBreakdown.trim()}\n"""` : 'No stated feeling of mismatch — reconstruct the day and note whatever structure is actually visible in the account.'}

Reconstruct the day using only what was supplied. Do not invent minutes, costs, or mechanisms this account doesn't support.

Return ONLY valid JSON:

{
  "the_day_you_described": [
    {
      "time": "A time or rough period exactly as given or directly inferable ('7:30', 'Morning', 'Late morning', 'Afternoon') — never invent more precision than the account supports",
      "note": "What happened then, using only supplied detail. Keep genuinely unclear stretches visibly uncertain rather than filling them in."
    }
  ],
  "what_made_it_feel_different": [
    "2-4 concise observations, each the strongest explanation the account actually supports for why the day felt the way it did — grounded in specific things the user described, not general productivity theory"
  ],
  "the_biggest_mismatch": "One concise mismatch between what the user expected or remembers and the day as reconstructed, stated only if the account actually supports one. If nothing clearly supports a mismatch, say that honestly instead of inventing one.",
  "try_this_next_time": "One small, concrete experiment tied directly to the strongest observed pattern, requiring little or no extra tracking, framed as something to try and explaining what it tests — never a productivity system, reflection exercise, promised outcome, reclaimed-hours figure, or productivity percentage. Set this to null if no useful, low-effort experiment follows naturally from this specific account — do not force one just to fill the field.",
  "session_label": "A short, neutral label for this session, for a history list — 2-3 recognizable anchors from the account (e.g. 'Workday — fragmented document time'). Never quote or paraphrase the opening of what the user wrote.",
  "session_tags": ["2-3 very short (1-3 word) anchors from the account, for a compact summary line — e.g. '2 calls', 'Slack interruptions'"]
}

RULES:
1. the_day_you_described: at most 12 entries — group closely-related minutes together rather than listing every small mention separately.
2. Never place a double-quote (") character inside any JSON string value.

FINAL CHECK:
- Does every time and duration in the_day_you_described trace back to something the user actually said or a direct calculation from times they gave?
- If you compared two stated times or durations, does the comparison match their actual numeric relationship?
- Did you avoid inventing transition costs, recovery time, focus-block lengths, check-counts, or any other unmeasured minutes?
- Did you leave genuinely unclear stretches uncertain rather than filling them in, and avoid implying the account is a complete record of the whole period?
- Are showering, eating, resting, scrolling, and similar normal-life activities left alone rather than treated as "lost" time?
- Does what_made_it_feel_different explain the feeling using only what's in the account, with no claims about the user's brain, motivation, attention, control, or psychology?
- Is try_this_next_time (if not null) a single low-effort experiment tied to a real pattern, never a system, exercise, or promised gain?
- Did you check the_biggest_mismatch and try_this_next_time honestly rather than forcing an answer the account doesn't support?`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.FAST,
      max_tokens: 3500,
      system: withLanguage(PERSONALITY, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'where-did-the-time-go' });

    if (!Array.isArray(parsed.the_day_you_described) || !parsed.the_day_you_described.length || !Array.isArray(parsed.what_made_it_feel_different) || !parsed.what_made_it_feel_different.length) {
      return res.status(500).json({ error: 'Could not reconstruct your day. Please try again.' });
    }

    res.json(parsed);
  } catch (error) {
    console.error('WhereDidTheTimeGo error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
