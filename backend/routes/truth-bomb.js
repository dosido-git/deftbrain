const express = require('express');
const router = express.Router();
const { withLanguage, withLocaleContext, callClaudeWithRetry } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

const PERSONALITY = `Clear-eyed confidant for things people are afraid to say.

CORE PRINCIPLE: Truth Bomb does not push the user toward disclosure. Speaking and staying silent are equally legitimate choices. Your job is to help the user see the situation clearly enough to choose — not to tilt the choice toward speaking.

Help the user separate three things: what they actually know, what they are interpreting, and what they fear might happen. Do not reward certainty merely because the user's statement is emotionally strong.

Help the user understand what the unsaid thing means, what staying silent actually does right now, what speaking might accomplish, and whether saying it is wise, premature, unsafe, unnecessary, or simply not theirs to say.

Never diagnose another person, predict another person's reaction as fact, invent motives, infer hidden relationship rules, or turn a single past event into a psychological explanation. When evidence is thin, say so plainly.

If the subject involves health, substance use, abuse, self-harm, violence, coercion, retaliation, employment power, legal exposure, or another high-stakes situation, reduce certainty and prioritize safety, support, and appropriate professional or emergency help over confrontation.

The three scripts are options, not an escalation ladder. 'Full Truth' means the fullest supportable truth from the user's perspective — not maximum accusation, certainty, or force.`;

router.post('/truth-bomb', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { theUnsaidThing, whoItsAbout, whyNotSaying, relationshipContext, userLanguage } = req.body;
  if (!theUnsaidThing?.trim()) {
    return res.status(400).json({ error: 'What\'s the thing you\'re not saying?' });
  }
    if (theUnsaidThing.trim().length < 8) {
      // Degenerate 1-char input made the model answer in prose -> JSON parse
      // failed through all retries -> hard 500 (audit 2026-07-19).
      return res.status(400).json({ error: 'Give a bit more detail — a sentence or two works best.' });
    }

    const userPrompt = `TRUTH BOMB — THE UNSAID THING, EXAMINED

THE THING THEY'RE NOT SAYING:
${theUnsaidThing.trim()}
${whoItsAbout?.trim() ? `WHO IT'S ABOUT / TO: ${whoItsAbout.trim()}` : ''}
${whyNotSaying?.trim() ? `WHY THEY HAVEN'T SAID IT: ${whyNotSaying.trim()}` : ''}
${relationshipContext?.trim() ? `RELATIONSHIP CONTEXT: ${relationshipContext.trim()}` : ''}

Before writing, silently separate:
- OBSERVATIONS: what the user directly reports or can reasonably know.
- INTERPRETATIONS: conclusions, motives, labels, or meanings that may or may not be true.
- UNCERTAINTIES: facts or reactions the user cannot know from the information supplied.

Then help them decide what, if anything, is worth saying.

Return ONLY valid JSON:
{
  "the_thing_examined": {
    "what_its_really_about": "Prefer the user's own stated conflict over a deeper formulation. If you can accurately restate the tension using concepts and concerns already present in the input, do that instead of improving on it with a psychological, moral, relational, or therapeutic interpretation the user didn't supply.",
    "why_its_hard_to_say": "The specific conflict or fear supported by the user's own account",
    "what_hiding_it_costs": "WHAT STAYING SILENT DOES — describe only the present, practical effect of staying silent, using only what follows directly from the user's own account. Treat speaking and silence as equally legitimate choices: do not assume silence is harmful, that speaking would improve the situation, or that current circumstances will continue. Identify BOTH what silence currently preserves or avoids AND what it leaves unresolved or unknown — not only a cost."
  },

  "reality_check": {
    "what_you_know": "The strongest relevant observation supported by what the user supplied",
    "what_you_dont_know": "The most important uncertainty or inference the user should not mistake for fact",
    "what_saying_it_can_do": "What speaking can realistically accomplish",
    "what_saying_it_cant_do": "What speaking cannot guarantee, control, diagnose, or settle"
  },

  "three_ways_to_say_it": [
    {
      "version": "The Gentle Opening",
      "directness": 1,
      "when_to_use": "When an invitation or question is wiser than a conclusion",
      "the_words": "A real sentence or two the user could say, grounded only in supported observations and their own concern",
      "tradeoff": "What this approach makes easier and what it leaves unresolved"
    },
    {
      "version": "The Clear Statement",
      "directness": 2,
      "when_to_use": "When the user wants to name the concern plainly without overstating what they know",
      "the_words": "A real sentence or two using I-statements, observations, and supportable claims",
      "tradeoff": "What this approach makes clear and what reaction or uncertainty remains"
    },
    {
      "version": "The Full Truth",
      "directness": 3,
      "when_to_use": "When the user wants to say the fullest supportable truth from their own perspective",
      "the_words": "The fullest honest version that still distinguishes observation from interpretation and does not invent certainty",
      "tradeoff": "What this version puts on the table and what it still cannot control"
    }
  ],

  "the_timing": {
    "when_to_say_it": "Conditions that would make the conversation safer and more useful",
    "what_to_avoid": "Conditions likely to make it less safe or productive",
    "if_they_dont_respond_well": "A short next response that does not argue, diagnose, corner, or escalate"
  },

  "permission_to_not_say_it": {
    "is_silence_legitimate": true,
    "when_silence_is_okay": "When delaying, saying less, seeking support first, or not saying it may be a legitimate choice",
    "the_honest_cost": "The real tradeoff the user accepts if they stay silent, stated without guilt or moral pressure"
  },

  "safety_note": "Empty string unless the situation raises a meaningful safety, health, substance-use, coercion, retaliation, legal, or professional-risk concern. If it does, give one brief, practical caution appropriate to that risk."
}

RULES:
1. EXACTLY 3 items in three_ways_to_say_it, in the order shown.
2. Keep each field concise: normally one or two sentences.
3. Never turn the user's suspicion into a fact. Use language such as I have noticed, I am worried, it seems to me, or I may be wrong when appropriate.
4. Never claim what the other person will probably do unless the supplied history genuinely supports a limited inference; even then, label it as uncertain.
5. Never diagnose substance use disorder, addiction, mental illness, abuse, dishonesty, or another condition from the user's description.
6. Never invent relationship facts. Do not upgrade friend to closest friend, criticism to proof, silence to a price of admission, or concern to fear unless supplied.
7. Do not treat speaking as inherently braver, healthier, or more honest than silence.
8. If the user selected myself or no one yet — just myself, adapt the three versions into three ways of stating the truth to themselves; do not fabricate a conversation partner.
9. For workplace power, abuse, threats, coercion, self-harm, violence, medical emergencies, or other high-stakes risks, do not default to confrontation. safety_note should direct the user toward an appropriate safer next step.
10. Never place a double-quote (") character inside any JSON string value.
11. Do not impose a moral or psychological narrative on the user's situation ("being wronged", "self-betrayal", "the real issue", "what you truly want", "not fair to you") unless the user supplied it. Prefer describing the tension without naming a hidden story for them.
12. RESTATEMENT OVER INTERPRETATION: for what_its_really_about specifically, check whether the user's own words already state the tension. If so, restate it using their own concepts and concerns, compressed and clarified but not deepened. Only reach for a formulation beyond what the user said when their account genuinely does not name the conflict themselves.
13. ATTRIBUTION CHECK: preserve exactly who said, observed, inferred, or believes each thing, in every field. If the user says another person MIGHT say or feel something, that stays the user's expectation, inference, memory, or guess — it must never be rewritten as that person's actual stated position ("her stated reason is X", "she says X", "X is his reason"). Say "you think she may say X" or equivalent, not "her reason is X". Never create a causal connection the user did not provide (e.g. do not say silence is "building distance" or "damaging" anything unless the user reported that effect directly).
14. SCRIPT DISCIPLINE: in three_ways_to_say_it (the_words), translate the user's own meaning into natural spoken language without adding motives, virtues, concessions, obligations, or emotions merely to make the wording sound more gracious or persuasive. A script may sound better than the user's raw words, but it may not say more than the user's raw words — no apology, no acknowledgment of the other person's feelings, no concession, and no self-critical line ("that's not fair to you/them") unless the user's own account supplied it.`;

    const parsed = await callClaudeWithRetry({
model: MODELS.SMART,
      max_tokens: 3500,
      system: withLanguage(PERSONALITY, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'truth-bomb' });
    if (!parsed.the_thing_examined) {
      return res.status(500).json({ error: 'Could not analyze this. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('TruthBomb error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.'});
  }
});

module.exports = router;
