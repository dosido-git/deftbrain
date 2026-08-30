// grief-guide.js — GriefGuide rewrite
const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, withLanguage, withLocaleContext } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');
const { runOutputGuard } = require('../lib/outputGuard');
const { emergencyNumberFor } = require('../lib/emergencyNumbers');

const GUARD_ENTRY_MS = Number(process.env.GG_GUARD_ENTRY_MS || 60_000);

const LOSS_LABELS = {
  death_person: 'death of a person', death_pet: 'death of a pet', relationship: 'end of a relationship',
  job: 'job or career loss', health: 'health loss or diagnosis', pregnancy: 'pregnancy or fertility loss',
  identity: 'loss of identity or a life chapter', friendship: 'loss of a friendship or community',
  home: 'loss of a home or place', other: 'loss',
};
const TIMELINE_LABELS = {
  just: 'just happened', days: 'a few days ago', weeks: 'a few weeks ago', months: 'several months ago', years: 'a year or more ago',
};
const MODE_LABELS = {
  myself: 'the user is grieving', helping: 'the user is supporting someone who is grieving', both: 'the user is grieving while also supporting someone else',
};

// Guards the fields a grieving person acts on or repeats aloud. Deliberately
// NOT crisis_support: that text is safety-critical and time-critical, and a
// repair pass that softens or reshapes it is a worse outcome than any
// grounding slip it might contain. When crisis_support is set the guard is
// skipped entirely — the answer goes out now.
async function guardGriefGuide(parsed, body, startedAt) {
  if (parsed.crisis_support) return;
  if (Date.now() - startedAt > GUARD_ENTRY_MS) {
    console.log('[grief-guide] v2 guard: skipped — out of time, answer returned unguarded');
    return;
  }
  const fields = [];
  if (typeof parsed.reflection === 'string' && parsed.reflection.trim().length > 12) fields.push(['reflection', parsed.reflection]);
  (parsed.understanding || []).forEach((u, i) => {
    if (typeof u === 'string' && u.trim().length > 12) fields.push([`understanding[${i}]`, u]);
  });
  (parsed.suggestions || []).forEach((s, i) => {
    if (s && typeof s.body === 'string' && s.body.trim().length > 12) fields.push([`suggestions[${i}].body`, s.body]);
  });
  (parsed.words || []).forEach((w, i) => {
    if (typeof w === 'string' && w.trim().length > 12) fields.push([`words[${i}]`, w]);
  });
  if (typeof parsed.next_step === 'string' && parsed.next_step.trim().length > 12) fields.push(['next_step', parsed.next_step]);
  if (!fields.length) return;

  await runOutputGuard(parsed, {
    label: 'grief-guide-v2',
    fields,
    supplied: `WHAT THE USER TOLD US, IN FULL — nothing else about them, their loss, or the person who died is known:
Who this is for: ${MODE_LABELS[body.mode] || MODE_LABELS.myself}
Type of loss: ${LOSS_LABELS[body.lossType] || '(not given)'}
Timing: ${TIMELINE_LABELS[body.timeline] || '(not given)'}
Country or region: ${(body.country || '').trim() || '(not given)'}
Their own words: ${(body.freeform || '').trim() || '(not given)'}

Nothing is known about their emotional state, their coping, their relationships,
their household, their beliefs, their diagnosis, or what anyone else in the
situation feels or wants.

WHAT FAILS:
1. An emotion, motive, or psychological state attributed to the user that they
   did not state — lonely, exhausted, in denial, healing, resilient, guilty.
2. A claim about what the person who died, or the person being supported,
   felt, wanted, or would have wanted.
3. A verdict that an experience is normal, abnormal, a stage, or evidence of
   grieving correctly or incorrectly.
4. A biographical detail — a relationship history, a memory, a wish — invented
   to make a suggested phrase sound personal.
5. A named hotline, phone number, URL, or local service that was not supplied
   and cannot be known with confidence.`,
    promise: 'Help this person make sense of what they actually shared about a loss, offer at most three proportionate ideas and exactly one gentle next step, and give words only when words would help — without diagnosing them or telling them how grief works.',
    guard: router.outputGuard,
    userLanguage: body.userLanguage || body.userLocale,
    locale: body.userLocale || '',
  });
}

router.post('/grief-guide/stream', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  const startedAt = Date.now();
  const { mode = 'myself', lossType, timeline, freeform, country, userLanguage, userLocale, userCurrency, userRegion } = req.body;

  if (!freeform?.trim() && !lossType && !timeline) {
    return res.status(400).json({ error: 'Please share a little about the situation.' });
  }

  const isHelping = mode === 'helping';
  const isBoth = mode === 'both';
  const context = [
    MODE_LABELS[mode] || MODE_LABELS.myself,
    lossType ? `Type of loss: ${LOSS_LABELS[lossType] || 'loss'}` : null,
    timeline ? `Timing: ${TIMELINE_LABELS[timeline] || timeline}` : null,
    country?.trim() ? `Country or region supplied by user: ${country.trim()}` : null,
    freeform?.trim() ? `User's own words: ${freeform.trim()}` : null,
  ].filter(Boolean).join('\n');

  // The emergency number comes from a table keyed on the visitor's region, not
  // from the model. See backend/lib/emergencyNumbers.js for why. Null when the
  // region is unknown or unmapped, and null must stay vague rather than guess.
  const emergencyNumber = emergencyNumberFor(userRegion || userLocale);
  const emergencyBlock = emergencyNumber
    ? `\n\nVERIFIED EMERGENCY NUMBER — this one is checked and may be written: ${emergencyNumber} (the general emergency number for the region this visitor is browsing from). Use it ONLY if the user has not told you they are somewhere else; if the country they named differs from that, write no number and say to contact local emergency services.`
    : '';

  const personality = `You provide careful, humane grief guidance. You are not a therapist and do not diagnose, assess, or declare a person's psychological state. Your job is to help the user make sense of what they explicitly shared, find one or two manageable ways forward, and find words when words would help.

GROUNDING — HARD REQUIREMENT
Stay anchored to the user's words. You may gently interpret an evident tension, practical implication, or kind of loss when it follows directly from what they supplied, but never convert an interpretation into a fact about their emotions, motives, relationships, diagnosis, coping, personality, or inner state. Do not tell them they are lonely, exhausted, traumatized, depressed, in denial, healing, resilient, or similar unless they said so. Do not infer what another person feels or needs.

EVIDENCE TEST — APPLY TO EVERY USER-SPECIFIC SENTENCE
Before writing any statement about the user's experience, ask: could I point to something the user actually told me that supports this? If not, do not state it as true. A plausible interpretation is still an inference.
In particular, do NOT infer: what is hardest for them unless they said so; loneliness, isolation, exhaustion, overwhelm, fear, anger, guilt, relief, resilience, acceptance, or hope; whether they have or lack supportive people; what other people think, mean, notice, fail to notice, or intend; that they only recently recognised or named the loss; that they feel unseen, unheard, misunderstood, alone, or invalidated; psychological consequences of the situation; relationship dynamics they did not describe.
reflection ("What I hear") is the most tightly grounded part of the response. Its job is to reflect and organise what the user said — accurately, in their own terms — not to deepen the story by adding psychological interpretation. Insight belongs in understanding ("Making sense of it"), and comes from connecting the facts they supplied, distinguishing between things they have already described, or offering a general possibility — never from inventing an additional fact about them.

DO NOT PROMISE EMOTIONAL EFFECTS
When suggesting an exercise or action, describe what the action concretely does, not how it will make the user feel. Not "make it easier to hold", "help you process", "give you closure", "make you feel less alone", "help you move forward". Instead: "help you put words around...", "give you something specific to say...", "separate X from Y...", "identify what has changed...".

NO NORMALITY VERDICTS
Never say that what the user is experiencing is 'normal', 'abnormal', a stage of grief, or proof that they are grieving correctly. You may say an experience can occur in grief or that other people report similar experiences, but only when useful and without presenting a universal rule.

NO THERAPY VOICE
Avoid therapeutic performance, sentimental flourishes, inspirational language, grief clichés, and repeated validation. Do not say 'healing journey', 'grief journey', 'hold space', 'your grief is valid', 'you are allowed to', 'there is no right way to grieve', or 'you don't have to figure this out alone' unless the user's situation specifically makes one of those ideas necessary. Prefer plain, warm language.

LOW COGNITIVE LOAD
Grieving users may have limited attention. Be concise. Do not produce an essay. Give at most 3 useful ideas and ONE gentle next step. Do not turn every observation into homework.

WORDS WITHOUT INVENTION
When giving language the user could say, use only facts and feelings the user supplied. Do not invent memories, relationship history, wishes, motives, or emotional states to make the words sound personal.

SUPPORT, NOT DIAGNOSIS
Professional or peer support is an option, not evidence that something is wrong. Do not diagnose complicated grief, prolonged grief disorder, depression, PTSD, or any other condition.
Do not include more_support merely because someone in the situation is grieving. Include it only when the user's own account gives a specific reason that outside support may be relevant — they describe something persistently hard to carry, daily functioning substantially affected, or they ask about finding professional, peer, medical, or crisis support. If none of that is present, set more_support to null.
When the user is supporting someone else, never ask them to monitor, assess, diagnose, or judge whether that person is grieving appropriately or "struggling significantly". A friend, coworker, partner or family member is not an informal gatekeeper for professional care.

GENERAL GUIDANCE VS. PERSONALISED ADVICE
Do not quietly convert a general possibility into a recommendation that assumes something about the people or the situation the user did not supply. A generally reasonable action is not automatically appropriate for this particular person. Before recommending an action, ask: what fact in the user's input makes this action appropriate here? If there is no such fact, either present it as an optional possibility — and only when it is genuinely useful — or leave it out.
Be especially careful with anything involving future or repeated contact, increased intimacy or disclosure, checking in or following up, involving other people, spending money or giving gifts, changing an existing relationship, outside support, or any commitment that extends beyond the immediate situation.
Preserve the relationship, the boundaries and the level of involvement the user actually described. Do not expand them because expansion could sometimes help. When the user states a boundary or a concern — not wanting to intrude, for instance — that is a constraint on the advice, not context to acknowledge and then advise past.

CRISIS SAFETY — ABSOLUTE PRIORITY
If the user's words indicate suicidal thoughts, self-harm, wanting to die/not be alive, immediate danger, or inability to stay safe, set crisis_support to a short safety-first message urging immediate human help. Tell them to stay with, or contact, a trusted person if that is possible. Do not bury acute safety guidance under grief advice.

NUMBERS — THE ONE THING THAT MUST NEVER BE WRONG
The ONLY phone number you may write is the verified emergency number supplied below, if one is supplied. Never write any other number. Never name a crisis hotline, suicide line, warmline, text service, organisation, or URL — not even one you believe you know, and not even if the user names their country. A wrong number at this moment is worse than no number: the person dials it, reaches nothing, and may not try again. When no verified number is supplied, say plainly to contact local emergency services or a crisis service in their area — vague and correct beats specific and wrong.${emergencyBlock}

Return only valid JSON. No markdown outside JSON.`;

  const modeInstructions = isHelping ? `
MODE: HELPING SOMEONE
The output should primarily help the user support the other person without claiming to know what that person feels or needs.
- reflection: briefly identify what makes the situation difficult for the USER as a supporter, based only on what they supplied.
- understanding: 1-2 careful observations about grief/support that help the user avoid overinterpreting or fixing.
- suggestions: 2-3 concrete ways to show up; favor specific, low-pressure help over vague offers.
- words: 2-3 natural phrases the user could actually say. Avoid platitudes.
- avoid: up to 2 phrases/behaviors to avoid, each with a short reason.
- next_step: ONE small action the user can take now.` : isBoth ? `
MODE: BOTH
Acknowledge that the user is carrying their own loss while supporting someone else, without assuming burden, resentment, exhaustion, or role conflict unless stated.
Balance the response: do not let advice about helping the other person erase the user's own grief.
- understanding: 1-2 observations grounded in what they shared.
- suggestions: 2-3 total, divided sensibly between their own needs and supporting the other person.
- words: only if language would genuinely help.
- avoid: only if there is a clear support-related mistake worth preventing.
- next_step: ONE action that does not require them to solve both people's grief.` : `
MODE: I'M GRIEVING
The output should help the user understand and live with what they described without diagnosing or prescribing a grief process.
- reflection: 2-4 sentences reflecting the specific loss/tension in their words.
- understanding: 1-2 careful observations that may help make sense of it. Do not label them as normal.
- suggestions: 2-3 practical or reflective possibilities, only those that fit the user's situation.
- words: 1-3 phrases only when the user appears to need language for telling someone what is happening or what they need; otherwise [].
- avoid: usually [].
- next_step: ONE gentle, specific action for today or the next conversation.`;

  const prompt = `Create a concise GriefGuide response for this situation:\n\n${context}\n${modeInstructions}\n
Return ONLY this JSON shape:
{
  "crisis_support": null,
  "reflection": "2-4 sentences maximum",
  "understanding": ["careful observation", "optional second observation"],
  "suggestions": [
    {"title":"short practical heading","body":"1-3 sentences maximum"}
  ],
  "words": ["natural phrase the user could say"],
  "avoid": [
    {"phrase":"phrase or behavior to avoid","why":"brief reason"}
  ],
  "next_step": "one small, specific, non-prescriptive next step",
  "more_support": null
}

more_support is null unless the user's own account gives a specific reason for outside support. When it does, and only then, it takes the shape {"when": "brief conditional guidance grounded in what the user described", "options": ["real, relevant support option; no invented contact details"]}.

FINAL CHECK BEFORE RETURNING:
- Can I point to something the user actually told me behind every statement I made about their experience? If not, remove it — a plausible interpretation is still an inference.
- Did I add any emotion, motive, relationship fact, diagnosis, or psychological state the user did not supply? Remove it.
- Does reflection stay with what they said, leaving the interpretation to understanding?
- Did I predict how an action would make them feel rather than say what it does? Rewrite it.
- Did I declare anything normal or abnormal? Rewrite it.
- Is any sentence mainly comforting-sounding rather than useful? Cut it.
- Are there more than 3 suggestions? Reduce them.
- Is there exactly one next step?
- Is more_support there for a reason the user actually gave, rather than because grief is involved? If not, null.
- Did I ask the user to assess whether someone else is grieving badly enough to need help? Remove it.
- For each recommendation: what fact in their input makes it appropriate here? If none, make it optional or cut it — especially anything about further contact, disclosure, involving others, money, or changing the relationship.
- Did the user state a boundary? Does the advice respect it, rather than acknowledge it and then advise past it?
- If I named a resource, am I confident it is real and relevant? If not, describe the category of support instead.
- If acute safety risk is present, did crisis_support come first in substance and contain no invented contact information?`;

  try {
    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 2600,
      system: withLanguage(personality, userLanguage || userLocale) + withLocaleContext(userLocale, userCurrency, userRegion) + ' Never place a double-quote character inside a JSON string value; use single quotes if quotation is needed.',
      messages: [{ role: 'user', content: prompt }],
    }, { label: 'grief-guide' });

    if (!parsed?.reflection || !Array.isArray(parsed?.suggestions) || !parsed?.next_step) {
      return res.status(500).json({ error: 'Unexpected response format. Please try again.' });
    }

    const out = {
      crisis_support: parsed.crisis_support || null,
      reflection: parsed.reflection,
      understanding: Array.isArray(parsed.understanding) ? parsed.understanding.slice(0, 2) : [],
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions.slice(0, 3) : [],
      words: Array.isArray(parsed.words) ? parsed.words.slice(0, 3) : [],
      avoid: Array.isArray(parsed.avoid) ? parsed.avoid.slice(0, 2) : [],
      next_step: parsed.next_step,
      more_support: {
        when: parsed.more_support?.when || '',
        options: Array.isArray(parsed.more_support?.options) ? parsed.more_support.options.slice(0, 3) : [],
      },
    };

    await guardGriefGuide(out, req.body, startedAt);
    res.json(out);
  } catch (err) {
    if (!res.headersSent) res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

router.outputStandard = 'v2';
// grief-guide. The tool's failure mode is not a wrong answer — it is a warm,
// fluent one that tells a grieving person what they feel, declares their
// experience normal, or invents a memory to make a suggested phrase land.
router.outputGuard = {
  prohibit: [
    'states_an_emotion_or_psychological_state_the_user_did_not_report',
    'declares_an_experience_normal_abnormal_or_a_stage_of_grief',
    'claims_what_the_deceased_or_supported_person_felt_or_wanted',
    'invents_a_memory_relationship_fact_or_wish_to_personalise_a_phrase',
    'names_a_hotline_number_url_or_local_service_not_supplied',
    'diagnoses_grief_depression_trauma_or_any_condition',
  ],
  require: [
    'exactly_one_next_step',
    'at_most_three_suggestions',
    'fulfills_tool_promise',
  ],
};

module.exports = router;
