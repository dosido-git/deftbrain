const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, withLanguage } = require('../lib/claude');

// ═══════════════════════════════════════════════════
// GENTLE PUSH GENERATOR — v3 (7 routes)
// v1: single generate call, single challenge
// v2: +3 options, +domains, +regenerate, +reflect, +review
// v3: +courage-countdown, +escalation-ladder,
//     +fear-inventory, +predicted vs actual scariness
// ═══════════════════════════════════════════════════

const DOMAIN_LABELS = {
  social: 'Social & relationships',
  professional: 'Work & career',
  creative: 'Creative expression',
  physical: 'Physical & health',
  emotional: 'Emotional vulnerability',
  financial: 'Financial & money',
};

const CAPACITY_GUIDANCE = {
  low: 'This person is low capacity right now. The pushes should be VERY small — almost trivially easy. Success is defined as attempting at all. The gentlest possible nudge.',
  medium: 'Medium capacity. Pushes should be genuinely challenging but clearly achievable. The sweet spot between "I can do this" and "this scares me a little."',
  high: 'High capacity — feeling strong. Pushes can be more ambitious. Still calibrated and specific, but this person can handle real discomfort right now.',
};

router.post('/gentle-push-generator', async (req, res) => {
  const { action } = req.body;

  try {
    switch (action || 'generate') {

      // ────────────────────────────────────────────
      // GENERATE — 3 pushes at different intensities
      // ────────────────────────────────────────────
      case 'generate': {
        const { domain, comfortZone, growthArea, currentCapacity, pushHistory, userLanguage } = req.body;

        if (!growthArea?.trim()) {
          return res.status(400).json({ error: 'Where do you want to grow?' });
        }

        const domainLabel = DOMAIN_LABELS[domain] || domain || 'general';
        const capacityGuide = CAPACITY_GUIDANCE[currentCapacity] || CAPACITY_GUIDANCE.medium;

        const historySection = pushHistory?.length > 0
          ? `\n\nPUSH HISTORY (most recent first, up to 10):
${pushHistory.slice(0, 10).map(p => `- "${p.challenge}" (${p.intensity}) → ${p.attempted ? `attempted, scariness: ${p.scariness}/5${p.outcome ? `, outcome: ${p.outcome}` : ''}` : 'not attempted'}`).join('\n')}
Use this history to calibrate. If recent pushes were all completed easily (scariness 1-2), slightly raise the bar. If recent pushes were not attempted or rated 4-5 scary, ease off. If there's a pattern of avoiding a specific type of challenge, note it but don't force it.`
          : '';

        const prompt = withLanguage(`You are a warm, encouraging growth companion. Someone wants to expand their comfort zone, and you're generating micro-challenges calibrated to where they are right now.

YOUR PHILOSOPHY:
- Growth happens at the edge of comfort, not miles past it. A good push is "slightly scary but I could see myself doing it."
- Attempting IS success. The outcome doesn't matter. Calling someone and having an awkward 2-minute conversation is a complete win.
- Three options give autonomy. Being told what to do feels different from choosing.
- Each push must be SPECIFIC, CONCRETE, and TIME-BOUND. Not "be more social" — "Text one friend you haven't talked to in a month and ask how they're doing. Do it before Friday."
- Capacity matters deeply. A low-capacity push for someone scared of phone calls might be "listen to a voicemail without anxiety." A high-capacity push might be "call someone you've been avoiding."

DOMAIN: ${domainLabel}
COMFORT ZONE: "${comfortZone || 'not specified'}"
GROWTH AREA: "${growthArea.trim()}"
CAPACITY: ${currentCapacity || 'medium'}
${capacityGuide}
${historySection}

Generate 3 pushes at different intensities. Each must be:
- Specific (who, what, when, how long)
- Achievable within 1 week
- Clearly different in scariness level
- Honest about why it's calibrated that way

Return ONLY valid JSON:
{
  "acknowledgment": "One warm sentence acknowledging where they are and what they want. Not generic — reference their specific comfort zone and growth area.",
  "pushes": [
    {
      "intensity": "gentle",
      "challenge": "The specific, concrete challenge. Time-bound. Achievable.",
      "why_this_size": "Why this calibration — what makes it the right amount of scary.",
      "what_counts": "What counts as success. Always includes 'attempting counts.'",
      "if_too_much": "Specific smaller alternative. Still growth, just tinier.",
      "time_frame": "When to do it by. 'Before Friday' or 'This week' etc."
    },
    {
      "intensity": "moderate",
      "challenge": "...",
      "why_this_size": "...",
      "what_counts": "...",
      "if_too_much": "...",
      "time_frame": "..."
    },
    {
      "intensity": "bold",
      "challenge": "...",
      "why_this_size": "...",
      "what_counts": "...",
      "if_too_much": "...",
      "time_frame": "..."
    }
  ],
  "if_you_dont": "Permission to not do any of them. Genuine, not passive-aggressive. Growth isn't mandatory.",
  "pattern_note": "If push history reveals a pattern (always avoiding one type, always doing the easy one, comfort zone clearly expanding), mention it. Otherwise null."
}`, userLanguage);

        const parsed = await callClaudeWithRetry(prompt, {
          label: 'GPG-Generate',
          max_tokens: 1500,
        });

        return res.json(parsed);
      }

      // ────────────────────────────────────────────
      // REGENERATE — New push with feedback
      // ────────────────────────────────────────────
      case 'regenerate': {
        const { previousPush, feedback, domain, comfortZone, growthArea, currentCapacity, userLanguage } = req.body;

        if (!feedback?.trim()) {
          return res.status(400).json({ error: 'What was wrong with the previous push?' });
        }

        const prompt = withLanguage(`The previous push didn't fit. Generate a better one based on their feedback.

PREVIOUS PUSH: "${previousPush || 'unknown'}"
FEEDBACK: "${feedback.trim()}"
DOMAIN: ${DOMAIN_LABELS[domain] || domain || 'general'}
COMFORT ZONE: "${comfortZone || 'not specified'}"
GROWTH AREA: "${growthArea || 'not specified'}"
CAPACITY: ${currentCapacity || 'medium'}

Common feedback types and how to respond:
- "too scary": Generate something noticeably easier. Half the scariness.
- "too easy": Step it up but don't overdo it. Slightly more edge.
- "wrong direction": The activity type was wrong. Try a completely different approach to the same growth area.
- "not relevant": They need something more connected to their actual life.
- Custom feedback: Adapt based on what they said.

Return ONLY valid JSON:
{
  "response_to_feedback": "One sentence acknowledging their feedback. 'Too scary is useful information, not failure.'",
  "push": {
    "intensity": "adjusted",
    "challenge": "New specific, concrete, time-bound challenge.",
    "why_this_size": "Why this is better calibrated based on the feedback.",
    "what_counts": "What counts as success.",
    "if_too_much": "Even smaller alternative.",
    "time_frame": "When to do it by."
  }
}`, userLanguage);

        const parsed = await callClaudeWithRetry(prompt, {
          label: 'GPG-Regenerate',
          max_tokens: 600,
        });

        return res.json(parsed);
      }

      // ────────────────────────────────────────────
      // REFLECT — Outcome celebration + learning (v3: +predicted vs actual)
      // ────────────────────────────────────────────
      case 'reflect': {
        const { push, attempted, scariness, predictedScariness, whatHappened, userLanguage } = req.body;

        const predVsActual = (predictedScariness && scariness)
          ? `\nPREDICTED SCARINESS: ${predictedScariness}/5 (what they expected)
ACTUAL SCARINESS: ${scariness}/5 (what they experienced)
GAP: ${predictedScariness - scariness > 0 ? `Overpredicted by ${predictedScariness - scariness} points — it was less scary than expected.` : predictedScariness - scariness < 0 ? `Underpredicted by ${scariness - predictedScariness} points — it was scarier than expected.` : 'Predicted accurately.'}`
          : '';

        const prompt = withLanguage(`Someone completed (or attempted, or didn't attempt) a comfort-zone challenge. Reflect back to them with warmth and genuine insight.

THE PUSH: "${push || 'unknown'}"
ATTEMPTED: ${attempted ? 'Yes' : 'No'}
SCARINESS RATING: ${scariness || 'not rated'}/5 (1 = easy, 5 = terrifying)${predVsActual}
WHAT HAPPENED: "${whatHappened || 'not shared'}"

RULES:
- If they attempted: Celebrate genuinely. Not over-the-top. Specific to what they did.
- If they didn't attempt: Zero guilt. Genuine permission. But gently explore why.
- The scariness rating is gold: 1-2 means ready for more. 4-5 means significant stretch.
- If predicted vs actual scariness data exists, this is KEY insight. If they predicted 4 but experienced 2, their brain is overestimating fear — point this out gently. This is their own evidence against their own anxiety.
- If they shared what happened, reflect specifically. Find the growth even in awkward outcomes.
- Always end with a forward look.

Return ONLY valid JSON:
{
  "reflection": "2-3 sentences of warm, specific reflection.",
  "growth_insight": "What this reveals about their comfort zone.",
  "scariness_note": "What the scariness rating tells you about calibration.",
  "prediction_insight": "If predicted vs actual data exists: specific observation about how their brain miscalibrates fear. e.g., 'Your brain said this would be a 4. It was a 2. Your fear antenna is set too high for social situations — and you have the data to prove it.' If no prediction data: null.",
  "next_suggestion": "Direction for next push based on this outcome.",
  "celebration": "If attempted: specific celebration. If not: null."
}`, userLanguage);

        const parsed = await callClaudeWithRetry(prompt, {
          label: 'GPG-Reflect',
          max_tokens: 600,
        });

        return res.json(parsed);
      }

      // ────────────────────────────────────────────
      // REVIEW — Growth pattern analysis
      // ────────────────────────────────────────────
      case 'review': {
        const { pushLog, domains, userLanguage } = req.body;

        if (!pushLog?.length || pushLog.length < 3) {
          return res.status(400).json({ error: 'Need at least 3 logged pushes for patterns.' });
        }

        const prompt = withLanguage(`Analyze this person's growth journey through their push history.

PUSH LOG (most recent first):
${JSON.stringify(pushLog.slice(0, 20), null, 2)}

DOMAIN COMFORT LEVELS (self-reported):
${domains ? JSON.stringify(domains) : 'not tracked'}

Analyze:
- Attempt rate (what % of pushes were attempted?)
- Average scariness vs. intensity chosen (are they always picking gentle? always bold?)
- Domain patterns (which domains are they growing in? which are they avoiding?)
- Scariness trends (are things getting less scary over time? = comfort zone expanding)
- Completion patterns (time of week, consistency)

Return ONLY valid JSON:
{
  "total_pushes": 0,
  "attempted": 0,
  "attempt_rate": "X%",
  "avg_scariness": 0,
  "intensity_pattern": {
    "most_chosen": "gentle|moderate|bold",
    "observation": "What this pattern reveals about their relationship to growth."
  },
  "domain_breakdown": [
    { "domain": "social", "pushes": 0, "attempted": 0, "avg_scariness": 0, "trend": "growing|stable|avoiding" }
  ],
  "comfort_zone_shift": {
    "direction": "expanding|stable|contracting",
    "evidence": "Specific evidence from the data. e.g., 'Phone calls went from 5/5 scary to 2/5 over 6 pushes.'",
    "biggest_growth": "Domain or area with most measurable growth."
  },
  "blind_spots": "Domains or types of challenges they're consistently avoiding. Be honest but kind.",
  "streak": { "current": 0, "longest": 0, "observation": "What the streak says." },
  "encouragement": "Genuine, specific encouragement tied to the data — not generic positivity.",
  "next_recommendation": "Suggested focus area for the next push based on patterns."
}`, userLanguage);

        const parsed = await callClaudeWithRetry(prompt, {
          label: 'GPG-Review',
          max_tokens: 1200,
        });

        return res.json(parsed);
      }

      // ────────────────────────────────────────────
      // COURAGE COUNTDOWN — In-the-moment companion (v3)
      // ────────────────────────────────────────────
      case 'courage-countdown': {
        const { push, domain, comfortZone, userLanguage } = req.body;

        if (!push?.trim()) {
          return res.status(400).json({ error: 'What push are we doing?' });
        }

        const prompt = withLanguage(`Someone is about to do a scary thing RIGHT NOW. They're staring at their phone, or standing outside the door, or hovering over the send button. They need you to walk them through the next 60 seconds.

THE PUSH: "${push.trim()}"
DOMAIN: ${DOMAIN_LABELS[domain] || domain || 'general'}
COMFORT ZONE: "${comfortZone || 'not specified'}"

Generate a 60-second courage sequence:
1. Breathing/grounding (one instruction — not a full exercise)
2. A specific reframe for THIS push (not generic — tied to what they're about to do)
3. A physical micro-action (the smallest first movement)
4. The commitment moment ("You're doing it now")
5. What to do if panic hits mid-push

Each step should be:
- One sentence. Max two.
- Spoken in second person present tense ("You're picking up the phone")
- Calm but forward-moving — not lingering

Return ONLY valid JSON:
{
  "opening": "One sentence acknowledging they're here, right now, about to do the thing. Warm.",
  "steps": [
    { "instruction": "Short, specific instruction", "emoji": "One emoji", "seconds": 10 }
  ],
  "reframe": "The specific cognitive reframe for this exact push. Not 'you can do it' — more like 'You've survived 100% of awkward phone calls. This one won't be different.'",
  "panic_plan": "If your heart is racing mid-push: [specific, brief instruction]. Don't quit — just pause.",
  "go_line": "The final 'you're doing it' line. Bold, warm, specific."
}`, userLanguage);

        const parsed = await callClaudeWithRetry(prompt, {
          label: 'GPG-CourageCountdown',
          max_tokens: 600,
        });

        return res.json(parsed);
      }

      // ────────────────────────────────────────────
      // ESCALATION LADDER — Path from here to goal (v3)
      // ────────────────────────────────────────────
      case 'escalation-ladder': {
        const { domain, comfortZone, growthArea, currentCapacity, pushHistory, userLanguage } = req.body;

        if (!growthArea?.trim()) {
          return res.status(400).json({ error: 'What\'s the growth goal?' });
        }

        const historyContext = pushHistory?.length > 0
          ? `\nCOMPLETED PUSHES: ${pushHistory.filter(p => p.attempted).map(p => `"${p.challenge}" (scariness ${p.scariness}/5)`).slice(0, 8).join(', ')}`
          : '';

        const prompt = withLanguage(`Build an escalation ladder — a visible path from this person's current comfort zone to their growth goal. Show them that the distance between "terrified" and "comfortable" is made of tiny steps.

DOMAIN: ${DOMAIN_LABELS[domain] || domain || 'general'}
COMFORT ZONE: "${comfortZone || 'not specified'}"
GROWTH GOAL: "${growthArea.trim()}"
CURRENT CAPACITY: ${currentCapacity || 'medium'}
${historyContext}

RULES:
- 5-7 rungs from easiest to hardest
- Each rung is a specific, concrete challenge (not vague)
- The gap between rungs should feel small — "I could do the next one"
- If they have push history, mark which rungs they've already passed
- The first rung should be almost trivially easy
- The last rung should be their actual goal or very close to it
- Each rung has an estimated scariness level

Return ONLY valid JSON:
{
  "ladder_intro": "One sentence framing the path. e.g., 'From texting to presenting: 6 small steps.'",
  "rungs": [
    {
      "level": 1,
      "challenge": "Specific, concrete challenge at this level",
      "estimated_scariness": 1,
      "why_this_level": "Brief: why this is the right size for this rung",
      "completed": false
    }
  ],
  "current_position": "Which rung number they're currently at based on history (or 0 if starting)",
  "distance_note": "Encouraging observation about how close/far they are. e.g., 'You're already past rung 3. The next step is smaller than the ones you've already taken.'",
  "next_rung_suggestion": "Which rung to attempt next and why."
}`, userLanguage);

        const parsed = await callClaudeWithRetry(prompt, {
          label: 'GPG-EscalationLadder',
          max_tokens: 1000,
        });

        return res.json(parsed);
      }

      // ────────────────────────────────────────────
      // FEAR INVENTORY — Structured comfort mapping (v3)
      // ────────────────────────────────────────────
      case 'fear-inventory': {
        const { responses, userLanguage } = req.body;

        if (!responses || Object.keys(responses).length < 10) {
          return res.status(400).json({ error: 'Need at least 10 scenario ratings.' });
        }

        const prompt = withLanguage(`Analyze this person's fear inventory — they rated 20 scenarios on a 1-5 scariness scale. Build a precise fear profile.

SCENARIO RATINGS (1 = easy, 5 = terrifying):
${JSON.stringify(responses, null, 2)}

Analyze:
- Which domains are most comfortable vs. most feared?
- Are there specific patterns? (e.g., "fine with strangers, terrified with family" or "fine online, scared in person")
- What's the overall fear level? (mostly 1-2s = generally brave, mostly 4-5s = lots of growth potential)
- What are the best entry points for growth? (areas rated 2-3, where they're uncomfortable but not terrified)

Return ONLY valid JSON:
{
  "profile_summary": "2-3 sentence overall description of their comfort profile.",
  "domain_scores": {
    "social": 0, "professional": 0, "creative": 0,
    "physical": 0, "emotional": 0, "financial": 0
  },
  "strongest": { "domain": "...", "observation": "Why this is their strength" },
  "growth_edge": { "domain": "...", "observation": "Best entry point — uncomfortable but not overwhelming" },
  "biggest_fear": { "domain": "...", "observation": "Most feared area — handle with care" },
  "patterns": [
    { "pattern": "Specific pattern noticed", "insight": "What it might mean" }
  ],
  "recommended_first_push": {
    "domain": "...",
    "direction": "Specific suggestion for first push based on the profile",
    "why": "Why start here"
  }
}`, userLanguage);

        const parsed = await callClaudeWithRetry(prompt, {
          label: 'GPG-FearInventory',
          max_tokens: 1000,
        });

        return res.json(parsed);
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }

  } catch (err) {
    console.error('GentlePushGenerator error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate push.' });
  }
});

module.exports = router;
