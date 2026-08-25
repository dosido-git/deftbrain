const express = require('express');
const router = express.Router();
const { withLanguage, withLocaleContext, callClaudeWithRetry } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');
const { runOutputGuard } = require('../lib/outputGuard');

// The standing rule for both endpoints (owner, 2026-08-25). This tool notices
// what was dreamed and what recurs. It does not diagnose, and it does not
// borrow authority it has not got — the previous version returned PTSD
// indicators, a nightmare prognosis, a sleep-health assessment and a
// therapist export summary from one paragraph of remembered dream.
const GROUND_RULES = `WHAT THIS TOOL IS
It notices what is in the dream the person described, offers several ways of looking at it, and asks good questions. It is not a diagnosis and not a reading.

NEVER:
- State what a dream means. Offer possibilities, always more than one, always tentative.
- Assess sleep quality, sleep health, REM stages, sleep hygiene or dream recall from dream content. A remembered dream says nothing reliable about any of it.
- Assess mental health, trauma, PTSD, or whether professional help is needed. Do not classify nightmares by severity or forecast how they will develop.
- Claim therapeutic value, name growth areas, or prescribe anything.
- Explain individual dream content in neurological terms. "The amygdala was processing fear" is not a finding about this person's dream; it is decoration borrowed from science writing.
- Assert universal symbol meanings. Water is not "always the unconscious". A symbol may carry an association FOR THIS DREAMER; say so as one possibility among others.
- Invent waking-life events. Use only what the dreamer supplied under life context. If they supplied none, say there is nothing to connect it to rather than reaching for something.
- Infer an emotional state the dreamer did not report. If they listed no emotions, do not decide how they felt.

ALWAYS:
- Distinguish what was described from what is being suggested about it.
- Where an interpretive tradition is named, name it as a tradition — a Jungian reading, a Freudian reading — not as fact.
- Keep every string to one sentence unless a length is given.
- Never place a double-quote (") inside a JSON string value; write quoted dream phrases plainly or with single quotes.
- Return complete, valid JSON that closes every bracket. No markdown.`;

// Interpretation IS the product here — offering several readings of a dream is
// the job, and the guard must not treat a suggested association as an invented
// fact. What it does police is the authority the tool used to borrow: a
// diagnosis, a sleep finding, a waking-life event nobody mentioned, or a
// feeling the dreamer never reported.
function suppliedFrom({ description, emotions, lifeContext, dreams }) {
  if (Array.isArray(dreams)) {
    return `THE DREAMS THE PERSON RECORDED (${dreams.length}) — nothing else about them is known:
${dreams.map((d, i) => `${i + 1}. ${d.description || d.summary || '(none)'} | emotions they reported: ${(Array.isArray(d.emotions) ? d.emotions : []).join(', ') || 'none'}`).join('\n')}

This mode COUNTS what recurs. A count must match these descriptions. Anything appearing once is not a pattern.`;
  }
  const em = Array.isArray(emotions) ? emotions.filter(Boolean) : [];
  return `WHAT THE DREAMER SUPPLIED, IN FULL:
The dream: ${description || '(none)'}
Emotions they reported: ${em.length ? em.join(', ') : 'NONE — they reported no emotions at all.'}
Waking life they mentioned: ${lifeContext && lifeContext.trim() ? lifeContext.trim() : 'NOTHING. They described no waking-life context whatsoever.'}

WHAT THIS TOOL IS. It notices what is in the dream, offers several possible readings, and asks questions. Suggesting an association is the product — do NOT flag a reading, a possibility, or a question for being interpretive. Multiple competing readings of the same image are correct, not contradictory.

WHAT FAILS:
1. A diagnosis or clinical judgement — mental health, trauma, PTSD, nightmare severity, whether professional help is needed, or how a nightmare will develop.
2. A claim about sleep — sleep quality, sleep health, REM, sleep hygiene, dream recall. A remembered dream establishes none of it.
3. A neurological explanation of THIS dream's content. Naming a brain region is decoration, not a finding.
4. A universal symbol meaning stated as fact — 'water always represents the unconscious'. A reading offered as one possibility is fine.
5. A waking-life event the dreamer did not mention, or a feeling they did not report.
6. Therapeutic value, growth areas, or a prescription.`;
}

async function guardDream(parsed, body, label, promise) {
  const fields = [];
  const walk = (val, path) => {
    if (typeof val === 'string' && val.trim().length > 15) fields.push([path, val]);
    else if (Array.isArray(val)) val.forEach((v, i) => walk(v, `${path}[${i}]`));
    else if (val && typeof val === 'object') Object.entries(val).forEach(([k, v]) => walk(v, path ? `${path}.${k}` : k));
  };
  walk(parsed, '');
  await runOutputGuard(parsed, {
    label, fields,
    supplied: suppliedFrom(body),
    promise,
    guard: router.outputGuard,
    userLanguage: body.userLanguage,
    locale: withLocaleContext(body.userLocale, body.userCurrency, body.userRegion),
  });
  return parsed;
}

router.post('/dream-pattern-spotter-single', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { description, date, emotions, lifeContext, userLanguage } = req.body;

    if (!description || !description.trim()) {
      return res.status(400).json({ error: 'Dream description is required' });
    }

    const emotionList = Array.isArray(emotions) ? emotions.filter(Boolean) : (emotions ? [emotions] : []);
    const emotionContext = emotionList.length
      ? `Emotions the dreamer reported: ${emotionList.join(', ')}`
      : 'The dreamer reported NO emotions. Do not infer any — describe the dream without assigning feelings to them.';

    const contextInfo = lifeContext && lifeContext.trim()
      ? `Waking life the dreamer chose to mention: ${lifeContext.trim()}`
      : 'The dreamer mentioned NOTHING about their waking life. connections_to_your_life MUST be an empty array — there is nothing supplied to connect this to, and inventing a connection is the failure this field exists to avoid.';

    const prompt = `A person has described a dream. Work only from what they wrote.

DREAM
Date: ${date || 'not given'}
${emotionContext}
${contextInfo}

Description: ${description}

${GROUND_RULES}

OUTPUT (JSON only):
{
  "at_a_glance": "2-3 sentences describing what happened in the dream and, if they reported any, the emotions they reported. Description only — no interpretation, no meaning, nothing they did not say.",
  "what_stands_out": [
    { "element": "an element or moment from the dream, in a few words", "why_it_stands_out": "what makes it notable within the dream itself — one sentence" }
  ],
  "possible_associations": [
    { "element": "the element being considered", "possibilities": ["one reading", "a different reading", "a third that does not agree with the first two"] }
  ],
  "different_lenses": {
    "jungian": "How a Jungian reading would approach this dream, named as that tradition — one or two sentences.",
    "freudian": "How a Freudian reading would approach it, named as that tradition — one or two sentences.",
    "dream_science": "What research on dreaming can and cannot say about a dream like this — one or two sentences. This is about the study of dreams in general, NOT a neurological claim about this person's dream."
  },
  "connections_to_your_life": [
    "Only where the dreamer supplied waking-life context: one sentence noting a possible link, framed as possible. Empty array when they supplied none."
  ],
  "questions_worth_sitting_with": ["3-5 questions that open something up rather than lead to an answer"],
  "patterns_to_watch": ["An element worth noticing if it turns up in a future dream — one sentence each"]
}

Give 3-5 items in what_stands_out and 3-5 in questions_worth_sitting_with.

Return ONLY the JSON object. No markdown, no preamble.`;

    const result = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 3000,
      messages: [{ role: 'user', content: withLanguage(prompt, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion) }],
    }, { label: 'dream-single' });

    // A connection to a life the dreamer never described is the one thing this
    // tool must not manufacture, so it is enforced rather than requested.
    if (!lifeContext || !lifeContext.trim()) result.connections_to_your_life = [];

    await guardDream(result, req.body, 'dream-single', 'What is in the dream the person described, several ways of looking at it, and questions worth sitting with — never a diagnosis and never a single meaning.');
    res.json(result);
  } catch (error) {
    console.error('Dream analysis error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

router.post('/dream-pattern-spotter-pattern', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { dreams, userLanguage } = req.body;

    if (!dreams || dreams.length < 2) {
      return res.status(400).json({ error: 'At least 2 dreams required for pattern analysis' });
    }

    const total = dreams.length;
    const summary = dreams.map((d, i) => {
      const em = Array.isArray(d.emotions) ? d.emotions.filter(Boolean) : [];
      return [
        `DREAM ${i + 1} (${d.date || 'no date'})`,
        `Described: ${d.description || d.summary || '(no description stored)'}`,
        em.length ? `Emotions they reported: ${em.join(', ')}` : 'Emotions they reported: none',
        d.lifeContext ? `Waking life they mentioned: ${d.lifeContext}` : '',
      ].filter(Boolean).join('\n');
    }).join('\n\n');

    const prompt = `${total} dreams from one person. Report what actually recurs across them.

${summary}

${GROUND_RULES}

THIS IS COUNTING, NOT INTERPRETING. An element recurs or it does not. Count only what appears in the descriptions above, give the real number out of ${total}, and name which dreams. Anything appearing once is not a pattern and does not belong here. Do not classify the dreams into types, do not produce a distribution, and do not draw a psychological profile from the tally.

OUTPUT (JSON only):
{
  "recurring_elements": [
    { "element": "the thing that recurs — a place, object, person, situation", "count": 3, "of": ${total}, "dreams": ["Dream 1", "Dream 3", "Dream 5"] }
  ],
  "recurring_emotions": [
    { "emotion": "an emotion the dreamer REPORTED, never one you inferred", "count": 4, "of": ${total} }
  ],
  "recurring_narrative_patterns": [
    { "pattern": "a shape the dreams share — trying to reach something, a destination changing, familiar people behaving unexpectedly", "count": 2, "of": ${total}, "dreams": ["Dream 2", "Dream 4"] }
  ],
  "possible_connections": ["Something worth exploring across these dreams, framed as a possibility and grounded in the recurrences above — one sentence each, 2-4 of them"],
  "limits": "One or two sentences on what this many dreams cannot establish."
}

Return ONLY the JSON object. No markdown, no preamble.`;

    const result = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 3000,
      messages: [{ role: 'user', content: withLanguage(prompt, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion) }],
    }, { label: 'dream-patterns' });

    // A "pattern" of one is a single dream wearing a label. And `of` is the
    // same number every time, so fill it here rather than trust three arrays
    // to carry it — one of them did not, and rendered "2 of undefined".
    for (const key of ['recurring_elements', 'recurring_emotions', 'recurring_narrative_patterns']) {
      if (!Array.isArray(result[key])) continue;
      result[key] = result[key]
        .filter(x => Number(x?.count) >= 2)
        .map(x => ({ ...x, of: total }));
    }

    await guardDream(result, req.body, 'dream-patterns', 'What actually recurs across the dreams the person recorded, counted, with what this many dreams cannot establish stated plainly.');
    res.json(result);
  } catch (error) {
    console.error('Dream pattern analysis error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

router.outputStandard = 'v2';
// dream-pattern-spotter-v2. Reviewed 2026-08-25. Offering readings is the
// product and is not guarded; the borrowed authority this rebuild removed is.
router.outputGuard = {
  prohibit: [
    'clinical_or_mental_health_judgement',   // trauma, PTSD, severity, "seek help"
    'sleep_claim_from_dream_content',        // sleep quality, REM, recall, hygiene
    'neurological_explanation_of_this_dream',
    'universal_symbol_meaning_as_fact',
    'invented_waking_life_event',
    'emotion_the_dreamer_did_not_report',
    'therapeutic_value_or_prescription',
    'single_definitive_meaning',             // "this dream means X"
  ],
  require: [
    'multiple_possibilities_not_one_answer',
    'grounded_in_what_was_described',
    'fulfills_tool_promise',
  ],
};

module.exports = router;
