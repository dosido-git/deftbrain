const express = require('express');
const router = express.Router();
const { withLanguage, withLocaleContext, callClaudeWithRetry } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

// ════════════════════════════════════════════════════════════
// POST /toast-writer — Write a Toast, Speech, or Tribute
// ════════════════════════════════════════════════════════════
router.post('/toast-writer', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { person, occasion, relationship, stories, tone, duration, avoid, userLanguage } = req.body;

    if (!person?.trim() || !occasion?.trim()) {
      return res.status(400).json({ error: 'Tell us who the toast is for and the occasion.' });
    }

    const systemPrompt = `You are a speechwriter for personal toasts, tributes, roasts, memorial remarks, retirements, birthdays, weddings, graduations, awards, farewells, and other short spoken occasions.

Your job is to help the speaker sound like a thoughtful version of themselves — not like a professional speechwriter took over.

CORE PRINCIPLES:
- SPECIFIC BEATS GENERIC. Use the details the speaker actually supplied.
- FACTS ARE SACRED. Never invent a relationship, event, personality trait, quote, reaction, nickname, diagnosis, promise, achievement, family detail, or emotional history.
- DO NOT RESOLVE CONTRADICTIONS BY GUESSING. If the supplied fields conflict, preserve only what is clearly compatible and avoid the uncertain detail.
- RESPECT THE AVOID LIST COMPLETELY, including indirect references, jokes, euphemisms, or emotional callbacks to avoided material.
- WRITE FOR THE EAR. Short sentences, natural rhythm, contractions, and spoken transitions are better than polished prose.
- THE SPEAKER IS NOT THE SUBJECT unless the occasion genuinely calls for it. Keep the focus on the person or people being honored.
- HUMOR MUST COME FROM SUPPLIED MATERIAL. Do not invent embarrassing stories or exaggerate a real detail into a different event.
- MATCH THE OCCASION. Memorials require care; roasts require affection and boundaries; weddings should not manufacture intimacy with a spouse the user barely described; awards should not invent achievements.
- DELIVERY CUES should be sparse and useful. Do not choreograph every glance and pause.
- LENGTH IS A CEILING, NOT A QUOTA. A strong 75-second toast is better than padding to two minutes.
- Never identify the speaker by name unless the user supplied it. Use [YOUR NAME] only if an introduction is actually useful.`;

    const userPrompt = `PERSON / PEOPLE BEING HONORED: ${person}
OCCASION: ${occasion}
SPEAKER'S RELATIONSHIP TO THEM: ${relationship || 'not specified'}
${stories ? `STORIES / DETAILS THE SPEAKER SUPPLIED:
${stories}` : 'STORIES / DETAILS THE SPEAKER SUPPLIED: none'}
REQUESTED TONE: ${tone || 'warm_and_funny'}
MAXIMUM LENGTH: ${duration || '2_minutes'}
${avoid ? `DO NOT MENTION OR ALLUDE TO:
${avoid}` : 'DO NOT MENTION OR ALLUDE TO: nothing specified'}

FIRST, silently check the fields for contradictions. Never invent a fact to reconcile them. Base the speech only on details that can coexist safely.

Create THREE usable versions, but do NOT force three unrelated personalities. The selected tone is the center of gravity for all three. Make the versions differ mainly in structure and emphasis:
1. a direct, natural version;
2. a more story-led version if the supplied material supports one;
3. a slightly more polished or concise version appropriate to the same occasion and requested tone.

If the occasion or supplied material makes humor inappropriate, do not force humor merely to differentiate the versions. If the user selected Roast-y, keep every joke affectionate and based only on supplied details.

Every version must:
- preserve the supplied facts exactly;
- avoid unsupported claims such as 'best friend', 'always', 'never', 'everyone knows', 'the person who will always...', unless supplied;
- avoid invented dialogue. You may paraphrase a supplied sentiment, but do not put new words in someone's mouth;
- avoid claiming what another person thinks or feels unless supplied;
- use at most 2-4 inline delivery cues such as [PAUSE] or [RAISE GLASS], only where they genuinely help;
- end with a line that can actually be spoken aloud at this occasion.

Return ONLY valid JSON:
{
  "occasion_read": "One concise sentence stating what this toast is really honoring, using only supported facts.",
  "versions": [
    {
      "style": "A plain-language description of this take, consistent with the requested tone",
      "label": "A short useful label",
      "speech": "Complete ready-to-deliver toast",
      "opening_line": "The actual first spoken line from the speech",
      "closing_line": "The actual final spoken line from the speech",
      "estimated_time": "Realistic approximate speaking time"
    }
  ],
  "delivery_tips": [
    "2-3 tips tied to specific moments in these speeches or this occasion"
  ],
  "common_mistakes": [
    "2-3 mistakes that are especially relevant to this input or occasion"
  ],
  "emergency_closer": "One short line the speaker can say if they lose their place, using only supported facts"
}

RULES:
1. Generate EXACTLY 3 versions.
2. Keep all three within the requested maximum length; do not pad shorter material.
3. opening_line and closing_line must be copied from that version's speech, not invented separately.
4. If the source details are thin, write a simpler toast rather than fabricating specificity.
5. Keep occasion_read, labels, tips, mistakes, and emergency_closer concise.
6. Never place a double-quote (") character inside any JSON string value; use no inner quotation marks so the JSON remains valid.`;

    const parsed = await callClaudeWithRetry({
model: MODELS.FAST,
      max_tokens: 6000,
      system: withLanguage(systemPrompt, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'toast-writer' });
    if (!Array.isArray(parsed.versions) || !parsed.versions.length) {
      return res.status(500).json({ error: 'Could not write your toast. Please try again.' });
    }
    return res.json(parsed);

  } catch (error) {
    console.error('ToastWriter error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.'});
  }
});

module.exports = router;
