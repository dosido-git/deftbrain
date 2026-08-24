const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, withLanguage, withLocaleContext } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { checkAgainstSupplied } = require('../lib/factCheck');
const { rateLimit } = require('../lib/rateLimiter');

const PERSONALITY = `Razor-sharp wit specializing in the comeback someone SHOULD have said — the one they thought of three hours later. Clever, not cruel. Satisfying because it's smart, not mean. Each comeback lands differently. At least one so calm it barely raises its voice. Never punch down. Built from the specific situation the person described and nothing else — no invented history, no guesses at what anyone meant. This is cathartic fiction about a real moment, and the moment belongs to them.`

router.post('/comeback-cooker', rateLimit(), async (req, res) => {
  try {
    const { situation, whatTheySaid, relationship, mood, userLanguage } = req.body;

    if (!situation?.trim()) {
      return res.status(400).json({ error: 'Describe what happened.' });
    }

    const moodMap = {
      surgical:  'SURGICAL — Cold, precise, devastating. The kind of response that ends a conversation permanently.',
      witty:     'WITTY — Quick, clever, makes everyone laugh. The comeback you\'d see in a movie.',
      petty:     'PETTY — Unapologetically petty. Not trying to be the bigger person today.',
      dignified: 'DIGNIFIED — Calm and composed but absolutely lethal. Unbothered energy that somehow hurts more.',
    };

    const userPrompt = `COMEBACK COOKER

THE SITUATION:
"${situation.trim()}"
${whatTheySaid?.trim() ? `\nWHAT THEY SAID: "${whatTheySaid.trim()}"` : ''}
${relationship?.trim() ? `RELATIONSHIP: ${relationship.trim()}` : ''}
MOOD: ${moodMap[mood] || moodMap.witty}

Generate 5 comebacks this person WISHES they'd said. Cathartic fantasies — satisfying, clever, and specific to this situation.

MAKE THEM ACTUALLY GOOD. Five distinct comebacks, not five paraphrases and not five techniques demonstrated. The failure to watch for is five polite acknowledgements in a row — noted, got it, thanks for the feedback, I'll take that under advisement. That is one line five times, and none of them is the line anyone lies awake wishing they had said. Even the calmest mood wants teeth: dignified means unbothered, not agreeable. Each has to be a line a real person could deliver and feel better for having thought of. If one is awkward to say out loud, cut it. If one concedes the criticism, cut it — agreeing cleverly is still agreeing, and it reads straight to anyone who is not in on the joke. Shortest version that lands; a comeback that needs a run-up is not a comeback.

ONLY THEIR FACTS, AND NEVER THEIR POSITION. Every specific belongs to the person who typed the form, and so does every stance. Where the remark was intrusive — about children, weight, money, religion, someone's relationship, their choices — the comeback declines the subject and does not answer it. "We're good with our current family size" answers it, and answers it on behalf of someone who may want children badly, may be in the middle of losing that hope, or may simply not be discussing it with this person. You cannot know, so do not decide. Deflection never needs a position. No invented job history, tenure, achievements, prior incidents, other people, or details of what happened. Told a peer criticised them in a channel, you do not know how long they have done the work, what they did last quarter, or who else was watching. A comeback built on an invented specific is one they cannot use, because they would be lying to send it.

NO READING THE OTHER PERSON'S MIND. You were given a description of a moment, not access to anyone's motives. Whether they meant it, were sniping, wanted to undermine, or moved on to avoid a reply — none of that is knowable and none of it belongs anywhere in the output.

Return ONLY valid JSON:

{
  "comebacks": [
    {
      "line": "The exact words they should have said — punchy, quotable, ready to deliver. The line and nothing else: no technique name, no explanation of why it lands, no stage direction about tone or pauses. Anyone who has replayed this moment for three hours already knows how they would say it."
    }
  ],
  "the_high_road": {
    "line": "The response that costs nothing and closes the subject. Calm, brief, and impossible to argue with. The line alone — no explanation of why it is the high road, which is evident from reading it."
  },
  "the_nuclear_option": {
    "line": "The one that is too far. Genuinely too far, and genuinely funny — this is the fantasy drawer, so enjoy it. Where a specific would be the ammunition, leave a bracketed placeholder rather than inventing one.",
    "warning": "One light line, six words or so. Probably better enjoyed than sent. Not a lecture about burning relationships or being done with this person — they know what this is, that is why it is fun."
  }
}

Never place a double-quote (") character inside any JSON string value — quoted remarks must be written plainly or with single quotes, or the JSON breaks.`;

    const lang = withLanguage('', userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion);

    const parsed = await callClaudeWithRetry({
      model: MODELS.FAST,
      max_tokens: 4000,
      system: PERSONALITY + (lang ? `\n\n${lang}` : ''),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'ComebackCooker' });

    if (!Array.isArray(parsed.comebacks) || !parsed.comebacks.length) {
      return res.status(500).json({ error: 'Could not cook up comebacks. Please try again.' });
    }

    // A comeback built on an invented specific is one they cannot use: sending
    // it would mean claiming something that is not true about their own life.
    // Fail-open — a fantasy comeback is still better than an error.
    try {
      const fields = [];
      parsed.comebacks.forEach((cb, i) => {
        if (typeof cb?.line === 'string') fields.push([`comebacks[${i}].line`, cb.line]);
      });
      if (typeof parsed.the_high_road?.line === 'string') fields.push(['the_high_road.line', parsed.the_high_road.line]);
      // the_nuclear_option.line is deliberately NOT checked. It is the fantasy
      // drawer, the schema already requires a bracketed placeholder instead of
      // invented ammunition, and running it through a factual check turns the
      // one line allowed to be too far into the tamest thing on the page.

      await checkAgainstSupplied(parsed, {
        label: 'comeback-cooker',
        supplied: `THE SITUATION: ${situation.trim()}
WHAT THEY SAID: ${whatTheySaid?.trim() || '(not supplied)'}
RELATIONSHIP: ${relationship?.trim() || '(not supplied)'}`,
        fields,
        lookFor: `- an invented SPECIFIC about the visitor's life: how long they have done the work, what they achieved, a previous incident, their job title, their team, anything not in the fields above
- A POSITION, CIRCUMSTANCE OR INTENTION THEY DID NOT STATE. This is the worst one, because a comeback that puts a stance in their mouth is one they cannot use without asserting it. Family plans, whether they want children, health, money, relationship status, religion, politics, where they live, what they intend to do next — none of it is knowable from a description of a remark. "We're good with our current family size" is unusable by someone who is undecided, struggling, grieving, or simply not discussing it, and the tool has no way to know which. Deflecting an intrusive question NEVER requires answering it: the line can decline the subject without taking a position on it.
- an invented specific about the OTHER person or the setting: who else was present, what was said before, where this happened
- MIND-READING: what the other person meant, wanted, intended, was trying to do, or why they moved on. A described action is not a motive.
- a PREDICTION: what anyone will think, how the visitor will look, whether the other person will feel small, what the room will conclude. Nobody watched this happen except the visitor.
Exaggeration, absurdity and obvious fantasy are FINE — this tool writes the line someone wishes they had said, and a joke that claims nothing is not a violation. Flag only where a reader would take it as a fact about the real situation.`,
        repairNote: `Keep the comeback funny and keep it sharp. These are meant to be satisfying, so a repaired line that has lost its edge has not been repaired. Where a specific was invented, either drop it or leave a bracketed placeholder the visitor can fill.`,
        userLanguage,
        locale: withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
      });
    } catch (err) {
      console.error('ComebackCooker supplied-facts check skipped:', err.message);
    }

    res.json(parsed);

  } catch (error) {
    console.error('ComebackCooker error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.'});
  }
});

// PF-39. Reviewed against DEFTBRAIN_OUTPUT_STANDARD_V2 on 2026-08-23. The
// output was explaining the social dynamics back to the visitor: a "read" that
// invented motive and consequence, a technique label on every line, and a
// paragraph predicting what everyone watching would conclude. What it owed them
// was five good lines.
router.outputStandard = 'v2';

module.exports = router;
