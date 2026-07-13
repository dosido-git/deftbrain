// grief-guide.js
const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, withLanguage, withLocaleContext } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

const LOSS_LABELS = {
  death_person:  'death of a person',
  death_pet:     'death of a pet',
  relationship:  'end of a relationship',
  job:           'job or career loss',
  health:        'health loss or diagnosis',
  pregnancy:     'pregnancy or fertility loss',
  identity:      'loss of identity or a life chapter',
  friendship:    'loss of a friendship or community',
  home:          'loss of a home or place',
  other:         'loss',
};

const TIMELINE_LABELS = {
  just:   'just happened (hours ago)',
  days:   'a few days ago',
  weeks:  'a few weeks ago',
  months: 'several months ago',
  years:  'a year or more ago',
};

const MODE_LABELS = {
  myself:  'themselves',
  helping: 'someone they care about',
  both:    'themselves and someone they care about',
};

router.post('/grief-guide/stream', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  const { mode, lossType, timeline, freeform, country, userLanguage, userLocale, userCurrency, userRegion } = req.body;

  if (!freeform?.trim() && !lossType && !timeline) {
    return res.status(400).json({ error: 'Please share a little about your situation.' });
  }

  const lossLabel     = LOSS_LABELS[lossType] ?? 'loss';
  const timelineLabel = TIMELINE_LABELS[timeline] ?? null;
  const modeLabel     = MODE_LABELS[mode] ?? 'themselves';
  const isHelping     = mode === 'helping' || mode === 'both';

  const systemPrompt = withLanguage(
    `You are a compassionate grief counselor and educator. You help people understand grief, normalize what they're experiencing, and find their way through loss. You are warm, non-clinical, and non-prescriptive — you don't tell people how to feel or how long grief should last. You acknowledge that grief is not linear and that there is no right way to grieve. You are careful not to project emotions onto people or assume what they're feeling.

SAFETY OVERRIDE (absolute priority): If anything the person shares mentions suicidal thoughts, wanting to die or "not be here" / "no point in living", thoughts of self-harm, or being in danger, you MUST populate the "crisis_support" field with a warm safety-first message and concrete crisis resources, and your "opening" must lead with care and safety. Err on the side of INCLUDING crisis_support whenever there is any hint of this — never leave it null when the person hints at not wanting to live. This overrides the "non-alarmist" tone.

You always return only valid JSON with no markdown, no code blocks, and no explanation outside the JSON object.`,
    userLanguage
  );

  const context = [
    `This person is seeking guidance for: ${modeLabel}`,
    lossType    ? `Type of loss: ${lossLabel}` : null,
    timelineLabel ? `When it happened: ${timelineLabel}` : null,
    country?.trim() ? `Country: ${country.trim()}` : null,
    freeform?.trim() ? `What they shared: ${freeform.trim()}` : null,
  ].filter(Boolean).join('\n');

  const prompt = `Provide compassionate, personalized grief guidance based on this person's situation:

${context}

Return ONLY valid JSON with this exact structure:
{
  "crisis_support": <If what they shared hints at ANY suicidal thoughts, wanting to die or "not be here", self-harm, or immediate danger — a warm, non-judgmental 2-3 sentence message that gently but clearly urges them to reach out for support RIGHT NOW, naming concrete crisis help: the US & Canada 988 Suicide & Crisis Lifeline (call or text 988), the UK & Ireland Samaritans (116 123), or their country's crisis line / the local emergency number (112 in Europe, 911 in the US/Canada). ONLY null when there is genuinely no hint of acute risk.>,
  "opening": <2-3 sentence warm, empathetic acknowledgment of what they've shared — reflect what they said, don't project emotions they didn't mention>,
  "what_is_normal": [<specific experience that is normal to grieve this way — grounded in what they described if possible — max 5>],
  "guidance": [
    {
      "title": <short, warm heading — e.g. "On the waves of grief", "Giving yourself permission">,
      "body": <2-3 paragraph compassionate guidance on this aspect — specific to their situation>,
      "practical": [<optional concrete suggestion — max 3 — only include if genuinely helpful, never prescriptive>]
    }
  ],
  ${isHelping ? `"what_to_say": [<specific phrase or sentence to say to the grieving person — warm, genuine, not clichéd — max 4>],
  "what_not_to_say": [<common phrase to avoid and brief note why — e.g. "Everything happens for a reason — this dismisses their pain" — max 4>],` : '"what_to_say": [], "what_not_to_say": [],'}
  "when_to_seek_help": <1-2 sentences on signs that talking to a professional might help — non-alarmist, normalizing>,
  "support_resources": [<specific, real resource relevant to their country and type of loss if known — e.g. "The National Alliance for Eating Disorders" is NOT a grief resource — only include if genuinely applicable — max 3 — empty array if unsure>]
}

Guidelines:
- ACUTE RISK (overrides everything below): if what they shared signals suicidal thoughts, self-harm, wanting to die, or immediate danger, set "crisis_support" (above) with concrete crisis resources and make the "opening" lead with warmth and safety FIRST — do NOT bury it under grief-processing guidance. The "non-alarmist, normalizing" tone below applies ONLY to ordinary grief, NEVER to acute risk.
- opening: reflect their words back — if they mentioned a specific detail (e.g. "I keep thinking I need to call him"), acknowledge it directly
- what_is_normal: normalize the specific experiences they described, not generic grief symptoms
- guidance: AT MOST 4 sections (aim for 3-4), ordered by what seems most relevant to their situation. Include at least one section specifically relevant to their type of loss and timeline. Keep each "body" to 1-2 short paragraphs.
- ${isHelping ? 'what_to_say: phrases that are genuine and specific, not platitudes. "I\'m here" is better than "Let me know if you need anything"' : 'Omit what_to_say and what_not_to_say sections (not applicable for self-grief mode)'}
- when_to_seek_help: normalize professional support; don't make it feel like something is wrong with them
- Tone throughout: warm, human, not clinical. Never use terms like "the grieving process" or "healing journey." Write like a wise, caring friend who happens to know a lot about grief.
- Return ONLY the JSON object`;

  try {
    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 5500,
      system: systemPrompt + withLocaleContext(userLocale, userCurrency, userRegion),
      messages: [{ role: 'user', content: prompt }],
    }, { label: 'grief-guide' });

    if (!parsed?.opening || !Array.isArray(parsed?.guidance)) {
      return res.status(500).json({ error: 'Unexpected response format. Please try again.' });
    }

    res.json({
      opening:           parsed.opening,
      what_is_normal:    Array.isArray(parsed.what_is_normal)    ? parsed.what_is_normal    : [],
      guidance:          parsed.guidance,
      what_to_say:       Array.isArray(parsed.what_to_say)       ? parsed.what_to_say       : [],
      what_not_to_say:   Array.isArray(parsed.what_not_to_say)   ? parsed.what_not_to_say   : [],
      when_to_seek_help: parsed.when_to_seek_help ?? '',
      support_resources: Array.isArray(parsed.support_resources) ? parsed.support_resources : [],
    });
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({ error: 'Something went wrong. Please try again.' });
    }
  }
});

module.exports = router;
