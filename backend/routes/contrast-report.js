const express = require('express');
const router = express.Router();
const { anthropic, callClaudeWithRetry, withLanguage, withLocaleContext } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');
const { runOutputGuard } = require('../lib/outputGuard');

const PERSONALITY = `Decision contrast analyst. Help people understand what they're actually choosing between by making both paths vivid and specific.

Don't recommend. Illuminate. Show the texture of each path — the unexpected good parts, the hidden costs, the second-order effects nobody thinks about until they're living them. Be emotionally honest without being manipulative.

Never place a double-quote (") character inside any JSON string value — write quoted speech in the narratives plainly or with single quotes, or it breaks the JSON.

Return ONLY valid JSON. No preamble, no markdown fences, no text before or after the JSON.`;

// ════════════════════════════════════════════
// HELPER: Build user prompt (shared by both routes)
// ════════════════════════════════════════════
function buildPrompt({ pathA, pathB, aboutYou, whatsHard, timeframe }) {
  const tf = timeframe || '2 years';
  return `THE CONTRAST REPORT

THE DECISION:
Path A: "${pathA.trim()}"
Path B: "${pathB.trim()}"
${aboutYou?.trim() ? `\nWHAT MATTERS HERE (their words):\n"${aboutYou.trim()}"` : ''}${whatsHard?.trim() ? `\nWHAT MAKES THIS HARD (their words):\n"${whatsHard.trim()}"` : ''}

TIMEFRAME: ${tf} from now

Write two vivid "day in the life" narratives — one for each path, set ${tf} from now. Each should be a single ordinary day (a Tuesday, not a milestone), written in second person present tense, 200-300 words. Make each future feel real enough that the reader's body reacts.

Then surface what you noticed — not advice, just honest observation.

GROUNDING — the whole risk of this tool is here:
The more vivid a scene is, the more an invented detail feels like insight. You will have to imagine most of these two days from a handful of things they told you. That is allowed; passing the invention off as knowledge is not.

THIS OUTPUT HAS THREE ZONES, AND THEY DO NOT SHARE A STANDARD.

ZONE 1 — "decision_framed". NO invention whatsoever. Restate their choice in as close to their own words as a sentence allows. It sits at the top and frames everything below it, so it must contain nothing they did not write. "Leave, and start over on my own" is leaving and starting over; it is not a journey of self-discovery.
  NO:  ...or to leave that life and find out who you are outside of it.
  YES: ...or to leave and start over on your own.

ZONE 2 — the two narratives. Imagination encouraged. Invent the coffee, the plumber, the armchair, the delayed email, the weather, the queue, the commute. Do NOT invent major facts, motives, psychological traits or outcomes.

ZONE 3 — "what_to_notice", and "how_to_read". Back to Zone 1's standard. You may point at the narratives, but you may not analyse invented details as though they revealed something about this person. Everything asserted here has to be traceable to what they wrote.
- Anything they told you is fixed. Never contradict it, never quietly resolve it — if they did not say whether a partner is moving too, do not decide.
- Where you invent, invent lightly and visibly: the texture of a morning, a queue, a phone call, weather. Not a salary, a diagnosis, a pregnancy, a breakup, a named person who does not exist, or a fact about their family.
- In Zone 3, an uncertainty they stated stays an uncertainty. Never settle it, never grade it, and never describe the parts of their life they did not describe.
  NO:  the love is not in question              (they said "I still love him" - that is a statement, not a verdict)
  NO:  whether you have been asking yourself the real question   (they said "whether I have stopped asking" - leave it open)
  NO:  inside a life that mostly works           (you have no idea whether it works)
  YES: You said you still love him, and you cannot tell whether you are building the life you want or whether you have stopped asking. Staying preserves the relationship and shared life you have built over nine years; leaving means stepping outside it to find out what being on your own is actually like. Neither path answers your question automatically.
- Where the invention IS load-bearing, let the sentence show it is a guess — "maybe", "some version of", "if it goes the way these usually do". A reader who thinks "no, it would not be like that" has learned something real; a reader who cannot tell what you made up has not.
- No verdicts. Never say which path is better, never predict an outcome, never tell them what they want.
- TEXTURE IS FREE; INTERIOR LIFE IS NOT. Invent the ordinary as much as you need — weather, a commute, a kitchen, a queue, what is on the radio. Do not invent their motivations, values, fears, psychological tendencies, relationship dynamics, or how any of it turns out.
- NOTHING INVENTED MAY BE PROMOTED. This is the one boundary the tool lives or dies on, and it has a direction: material flows INTO the stories, never out of them. Invent the plumber, the armchair, the delayed email, the rain — then leave them there. A detail you made up may not reappear as a conclusion, as one side of the tradeoff, or inside the question you leave them with. The test is a single question asked of every sentence in Zone 3: if the visitor said "that part is not true", would this sentence still stand? If it collapses, it was built on your fiction and it does not belong there.
  NO:  the second path asks you to be alone with your work in a way the first never does   (you invented the solitude)
  YES: you said you have two clients lined up and eight months of savings
  NO:  what would it take for the quiet in that flat to stop feeling like relief?          (the flat, the quiet and the relief are all yours)
  YES: if nothing about your current job got worse, would you still want to leave?
- NEVER TELL THEM WHAT THE DECISION IS REALLY ABOUT. Not "this is really a question about identity", not "underneath the job it is about your marriage", not "the real choice is whether to keep waiting". They named their decision; they were there for it. Finding the deeper thing underneath is the single most tempting move this tool offers and it is always either obvious or wrong — and when it is wrong, it is wrong about someone's life, in a sentence that sounds wise. Illuminate the dilemma they named. Do not replace it with a better one.
- THE ANALYSIS MAY NOT TREAT THE FICTION AS EVIDENCE. You just made these two days up. Nothing in them is a finding about this person, and how the writing went is a fact about writing, not about them. Never report which path was richer, easier, more alive or more fun to write — novelty is simply easier to dramatise than continuity, and saying so with "this is not an endorsement" attached is still a thumb on the scale.
- Their reaction to the stories is the material. Your reaction to your own stories is not.
- NEVER ATTRIBUTE A MOTIVE THEY DID NOT STATE. An uncertainty is not a motive. "I cannot tell whether I want this or whether I am just bored" is a person wondering; it is not a person fleeing.
  NO:  the boredom you were running from
  YES: the boredom you are wondering about
- DESCRIBE THE MEANINGFUL MOMENT; DO NOT EXPLAIN IT. When a line lands on something that might matter, stop at the fact. The reader decides whether it means anything, and telling them robs the moment of the only thing that made it worth writing.
  NO:  The work came from you, which means something.
  YES: The work came from you.
- THE COST OF A PATH BELONGS IN THE DAY, NOT IN A NOTE UNDER IT. Let the Tuesday carry it — the third revision request, the empty afternoon, the message you do not send. Do not append a sentence explaining what the day showed; there is no field for that any more, and there is no field for it because pointing at your own invention and calling it a cost was the tool interpreting its own fiction.
- Do not invent a consequence to make a cost land harder. "Harder to reverse", "calcifies", "a door quietly closing" are all predictions dressed as description. A cost can simply be the thing they already named, still there later.
  NO:  two years of competence without challenge calcifies into something harder to name, and harder to reverse
  YES: two more years of familiar, manageable work leaves the question you are asking now still waiting for you
${whatsHard?.trim() ? 'What they said makes this hard is the centre of gravity. Both days should be days in which that tension is quietly present — not discussed, not resolved, just there.' : ''}

The NO/YES pairs above are shape, not wording. Never reuse their sentences; write for the two paths in front of you.

Return ONLY valid JSON:

{
  "decision_framed": "ZONE 1. Restate the core decision in one clean sentence, in as close to their own words as the sentence allows. No interpretation, no reframing, nothing they did not write.",
  "how_to_read": "One or two sentences, in your own words: these are not predictions, they are two plausible days built from THE FEW THINGS THEY SHARED - phrase it that way round, never 'almost nothing you told me', which is honest but reads as a complaint about their input - the texture is imagined, the tension at the centre is theirs, and the useful thing is what they react to, including the parts that feel wrong.",
  "path_a": {
    "label": "Short label for this path (3-5 words)",
    "narrative": "200-300 word day-in-the-life narrative. Second person, present tense. A plausible Tuesday, ${tf} from now. Specific, sensory, honest — including both the good and the cost, carried by the day itself rather than named afterwards. End on a small, unresolved moment — but always complete the final sentence."
  },
  "path_b": {
    "label": "Short label for this path (3-5 words)",
    "narrative": "200-300 word day-in-the-life narrative. Same rules. Different life. Equally vivid and honest."
  },
  "what_to_notice": {
    "the_tradeoff": "The tradeoff THEY described, in near enough their own words that they could point at each clause and find where it came from. NAME the specific things - good manager, predictable hours, two clients, eight months of savings - rather than gesturing at 'something real' or 'the thing you cannot name'. Do not add an inference to make it rounder: if they told you they have savings and clients lined up, the second path is not simply giving up security. 2-3 sentences.",
    "watch_your_reaction": "Point them at their own response, and stop there. Both reactions are useful: the corrections show where the sketch missed, the moments that pull them in show where to look more closely. Do NOT say what a lean-in reveals about what they want - a scene can pull because it is frightening or novel, not because it is wanted. 1-2 sentences.",
    "a_question_to_sit_with": "One question that ILLUMINATES THE DILEMMA THEY ALREADY NAMED, built only from what they wrote — never from a detail you invented in the narratives - do not out-clever them by finding a deeper one underneath it. The strongest version isolates a variable in their own uncertainty. If they said they cannot tell whether they want out or are just bored, ask: 'If nothing about your current job got worse, would you still want to leave?' That diagnoses nothing and could actually be answered. One sentence."
  }
}`;
}

// ════════════════════════════════════════════
// ROUTE: Standard (non-streaming) — fallback
// ════════════════════════════════════════════
router.post('/contrast-report', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { pathA, pathB, aboutYou, whatsHard, timeframe, userLanguage } = req.body;

    const MAX_INPUT = 5000;
    if ((pathA || '').length > MAX_INPUT || (pathB || '').length > MAX_INPUT || (aboutYou || '').length > MAX_INPUT) {
      return res.status(400).json({ error: 'That description is too long — trim it to the essentials (under 5,000 characters per field).' });
    }
    if (!pathA?.trim() || !pathB?.trim()) {
      return res.status(400).json({ error: "Describe both paths you're considering." });
    }

    const parsed = await callClaudeWithRetry(
      buildPrompt({ pathA, pathB, aboutYou, whatsHard, timeframe }),
      {
        label: 'contrast-report',
        model: MODELS.SMART,
        max_tokens: 4000,
        system: withLanguage(PERSONALITY, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
      }
    );

    if (!parsed.path_a || !parsed.path_b) {
      return res.status(500).json({ error: 'Could not generate the contrast report. Please try again.' });
    }
    // v2 guard. Everything after the narratives is in this list, and the
    // narratives are not — which is now the whole shape of the response, since
    // the two per-path interpretation fields were removed.
    // they are imagined by design, and checking them would sand off the tool.
    // Everything that draws a conclusion is checked, because the risk here is
    // one direction only — a detail invented for a story reappearing as a
    // finding about someone's life.
    try {
      const fields = [];
      const push = (k, v) => { if (typeof v === 'string' && v.trim()) fields.push([k, v]); };
      push('decision_framed', parsed.decision_framed);
      push('how_to_read', parsed.how_to_read);
      push('what_to_notice.the_tradeoff', parsed.what_to_notice?.the_tradeoff);
      push('what_to_notice.watch_your_reaction', parsed.what_to_notice?.watch_your_reaction);
      push('what_to_notice.a_question_to_sit_with', parsed.what_to_notice?.a_question_to_sit_with);

      await runOutputGuard(parsed, {
        label: 'contrast-report',
        fields,
        supplied: `PATH A: ${pathA}
PATH B: ${pathB}
WHAT MATTERS IN THIS DECISION (their words): ${aboutYou || '(not supplied)'}
WHAT PULLS THEM TOWARD EACH PATH (their words): ${whatsHard || '(not supplied)'}
TIMEFRAME: ${timeframe || '2 years'}

THE TWO NARRATIVES IN THIS RESPONSE ARE FICTION, WRITTEN BY THE GENERATOR, AND THEY ARE NOT EVIDENCE. Do not treat a detail from them as supplied. The test for every field above: if the visitor said "that part is not true", would the sentence still stand? If it collapses, it was built on the fiction and it is a violation.

An uncertainty they stated must stay open. A motive they did not state may not be attributed. And nothing may tell them what their decision is really about — they named it.`,
        promise: 'Two vivid imagined days, one per path, and observations traceable to what the visitor actually wrote.',
        guard: router.outputGuard,
        requiredNonEmpty: ['decision_framed'],
        userLanguage,
        locale: withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
      });
    } catch (guardErr) {
      console.error('[contrast-report] v2 guard skipped:', guardErr.message);
    }

    res.json(parsed);

  } catch (error) {
    console.error('ContrastReport error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ════════════════════════════════════════════
// ROUTE: Streaming — SSE endpoint
// NOTE: Uses raw anthropic.messages.stream — streaming requires raw SSE API;
// callClaudeWithRetry does not support streaming. This is the documented exception.
// ════════════════════════════════════════════
router.post('/contrast-report/stream', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  const { pathA, pathB, aboutYou, whatsHard, timeframe, userLanguage } = req.body;

  if (!pathA?.trim() || !pathB?.trim()) {
    return res.status(400).json({ error: "Describe both paths you're considering." });
  }

  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const sendEvent = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const stream = anthropic.messages.stream({
      model: MODELS.SMART,
      max_tokens: 4000,
      system: withLanguage(PERSONALITY, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
      messages: [{ role: 'user', content: buildPrompt({ pathA, pathB, aboutYou, whatsHard, timeframe }) }],
    });

    stream.on('text', (chunk) => {
      sendEvent({ chunk });
    });

    stream.on('error', (err) => {
      console.error('ContrastReport stream error:', err);
      sendEvent({ error: err.message || 'Stream failed' });
      res.end();
    });

    stream.finalMessage()
      .then(() => {
        sendEvent({ done: true });
        res.end();
      })
      .catch((err) => {
        if (err?.name === 'APIUserAbortError') return;
        console.error('ContrastReport finalMessage error:', err);
        sendEvent({ error: err.message || 'Stream failed' });
        res.end();
      });

  } catch (error) {
    console.error('ContrastReport stream setup error:', error);
    sendEvent({ error: error.message || 'Failed to start stream' });
    res.end();
  }
});

// PF-39. Reviewed against DEFTBRAIN_OUTPUT_STANDARD_V2 on 2026-08-24, converted
// on contact. This tool is the clearest case in the catalog for the guard being
// SCOPED rather than global: the two narratives are invention on purpose and are
// never checked, and everything around them is checked hard.
router.outputStandard = 'v2';

router.outputGuard = {
  prohibit: [
    'promoted_invented_detail',        // a made-up detail reappearing as a conclusion
    'interpreted_own_fiction',         // pointing at an invented moment and saying what it shows
    'reframed_the_decision',           // "this is really about..."
    'invented_motive_or_trait',
    'resolved_a_stated_uncertainty',
    'verdict_on_a_path',
    'fiction_treated_as_evidence',
  ],
  require: [
    'traceable_to_their_words',
  ],
  // The narratives. Invention is the deliverable there, and a guard that
  // trimmed them would be removing the thing the visitor came for.
  allow: ['imagined_day_in_the_life'],
};

module.exports = router;
