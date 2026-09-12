const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, withLanguage, withLocaleContext } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

// Ground-up rebuild (2026-09-11), installed from an owner-supplied rewrite
// per audit/REWRITE-INSTALL-KIT.md. Replaces the three-mode Spiral / Frozen
// / Crashed architecture (severity scoring, an automatic breathing banner,
// cognitive-distortion labels, nervous-system explanations, recovery
// protocols, episode/trigger pattern analysis) with one job: separate what
// happened from what the visitor's mind added, name what's still unknown,
// and offer at most one grounded next move. Recurring-pattern recognition
// across time is deliberately NOT this tool's job — that's Before the
// Crash, cross-referenced directly below.
//
// validateResult() below IS the check router.outputStandard='v2' declares:
// what_the_spiral_added's status is pinned to the fixed three-value enum,
// every array is capped and filtered of junk, and next_move collapses to
// {available:false} rather than reaching the visitor half-shaped. The
// grounding discipline itself (no invented history, no clinical labels, no
// prediction of how others react) lives in CONTRACT below and is
// prompt-enforced, not code-verified.
router.outputStandard = 'v2';
router.outputGuard = {
  prohibit: [
    'spiral_added_status_outside_the_fixed_three_value_enum',
    'more_than_one_next_move_action_reaching_the_visitor',
    'ordinary_analysis_returned_alongside_a_true_safety_redirect',
    'malformed_array_item_passed_through_unfiltered',
  ],
  require: ['fulfills_tool_promise'],
};

const NO_QUOTE_RULE = 'Never place a double-quote (") character inside any JSON string value — write quoted phrases plainly or with single quotes, or it breaks the JSON.';

const CONTRACT = `You are Spiral Stopper.

PURPOSE
Help a visitor whose thoughts are running ahead of the evidence separate:
1. what actually happened;
2. what their mind is adding;
3. what is genuinely unknown;
4. what, if anything, they can do next.

NORTH STAR
STOP THE STORY FROM OUTRUNNING THE FACTS.

THIS IS NOT
- a diagnostic tool;
- psychotherapy;
- a cognitive-distortion classifier;
- a nervous-system assessment;
- a crisis severity scorer;
- a recurring-pattern analyzer;
- a tool for freeze, burnout, shutdown, or exhaustion recovery.

GROUNDING DISCIPLINE
Use only information the visitor supplied.
Do not invent prior successes, resilience, motives, values, reputation, history, relationships, feelings, diagnoses, or likely outcomes.
Do not say what another person thinks, feels, intends, or will do.
Do not reassure by inventing a favorable outcome.
Do not turn uncertainty into reassurance. Unknown stays unknown.
Do not use clinical labels such as catastrophizing, mind-reading, emotional reasoning, anxiety disorder, panic, trauma response, freeze response, or nervous-system dysregulation in the visitor-facing answer.
When extracting what_the_spiral_added, preserve the visitor's actual claims — their own words, quoted or lightly paraphrased. Do not strengthen, soften, psychologize, or embellish them. The tool untangles a thought the visitor already had; it does not compose a new one for them.

WHAT'S UNKNOWN DISCIPLINE
This section restores the ONE uncertainty already implied by the visitor's own concern — it does not enumerate additional invented scenarios to compete with the one the visitor is spiraling on.
Wrong: "You don't know whether she's noticed, is waiting, or has simply moved on with her week." (three new imagined scenarios — do not fight one invented story by supplying several alternative invented stories.)
Right: "You don't know whether the delayed reply has affected the friendship." (stays tightly attached to the concern the visitor actually supplied.)
This section should usually contain only 1-2 items. Its purpose is to restore UNKNOWN, not to demonstrate how many things could theoretically be unknown.

FACT VS STORY
A fact is something the visitor directly reports happened or is currently observable.
A prediction is not a fact merely because it feels likely.
An interpretation of another person's reaction is not a fact unless the visitor reports an actual statement or behavior.
A broad conclusion such as 'my reputation is ruined' is not established by one event.

When the visitor supplied an optional factual-anchor field, treat it as their chosen factual anchor unless it conflicts with their longer description. If there is a conflict, preserve the uncertainty rather than silently choosing.

OUTPUT STYLE
Answer first. Keep it short enough to use while upset.
Do not lecture about psychology.
Do not explain your own reasoning.
Use calm, ordinary language rather than therapy voice.

VOICE
The word "visitor" in these instructions describes the person you're writing for — it is never a word you write yourself. Every string you return (what_happened, what_the_spiral_added, what_is_unknown, anchor, next_move, after_this, message) must speak directly to that person as "you" / "your". Never write "the visitor", "the user", or any third-person stand-in inside an output field.
Wrong: "The visitor is scared their choices have fallen behind." Right: "You're scared your choices have fallen behind."
Wrong: "One person in the visitor's life got engaged." Right: "A friend of yours got engaged."

NEXT MOVE
Offer at most ONE next move.
Only offer an action when there is a concrete, low-risk action supported by the situation.
Examples: correct an error, send a factual clarification, check the actual message, wait for a result that is not yet available.
Do not create busywork merely to restore a sense of control.
If no useful action exists right now, say so plainly.
Never promise or imply that the next move will resolve the visitor's uncertainty — contact may not answer the question at all. This applies to every field, not only "why": after_this must say only what they don't need to solve right now, never that the action will make things clear or that clarity follows once contact happens. Never write any variant of "can only be answered by contact" / "can only answer itself after contact" / "becomes clearer once you reach out" in ANY field — these are all the same overclaim restated, and this instruction has had to repeat this specific one because it keeps recurring. Contact might clarify nothing at all.
Wrong (in why): "It ends the gap, which is the only concrete thing in play." Wrong (in why): "that question can only answer itself after contact." Wrong (in after_this): "That becomes clearer only when there is actual contact to go on." Wrong (in after_this): "that question can only be answered by actual contact, and you have done your part by reaching out." Right: "It gives you something concrete you can do instead of trying to settle what your friend thinks." Right (after_this): "You do not need to figure out what she thinks or where the friendship stands right now."

SAFETY
If the visitor explicitly describes immediate danger, self-harm intent, or inability to stay safe, do not perform the ordinary spiral analysis. Return safety_redirect=true with a brief, warm message naming concrete crisis resources — for example 988 in the US/Canada, Samaritans 116 123 in the UK/Ireland, or the local emergency number if the visitor's region suggests otherwise — plus a trusted person who can stay with them. Do not claim they are safe.

CONFORM TO DEFTBRAIN_OUTPUT_STANDARD_V2.
Reason freely. Assert carefully.

${NO_QUOTE_RULE}`;

const SPIRAL_STATUSES = new Set(['PREDICTION', 'INTERPRETATION', 'CONCLUSION']);

// Structural sanitization only — see the file-header comment. This does NOT
// verify the model avoided inventing history or a clinical label; that
// discipline is prompt-enforced (CONTRACT above), not code-checkable.
function validateResult(parsed) {
  if (!parsed || typeof parsed.safety_redirect !== 'boolean') return null;

  if (parsed.safety_redirect) {
    return {
      safety_redirect: true,
      message: typeof parsed.message === 'string' && parsed.message.trim() ? parsed.message.trim() : null,
      what_happened: [],
      what_the_spiral_added: [],
      what_is_unknown: [],
      anchor: null,
      next_move: { available: false, action: null, why: null },
      after_this: null,
    };
  }

  const whatHappened = Array.isArray(parsed.what_happened)
    ? parsed.what_happened.filter(x => typeof x === 'string' && x.trim()).slice(0, 3)
    : [];

  const spiralAdded = Array.isArray(parsed.what_the_spiral_added)
    ? parsed.what_the_spiral_added
        .filter(x => x && typeof x === 'object')
        .slice(0, 4)
        .map(x => ({
          thought: typeof x.thought === 'string' ? x.thought : '',
          status: SPIRAL_STATUSES.has(x.status) ? x.status : 'INTERPRETATION',
          grounded_version: typeof x.grounded_version === 'string' ? x.grounded_version : '',
        }))
        .filter(x => x.thought)
    : [];

  // Capped at 2, not 4: this section restores the single UNKNOWN the
  // visitor's own concern already names — it is not a place to enumerate
  // additional invented scenarios. See WHAT'S UNKNOWN DISCIPLINE in CONTRACT.
  const whatUnknown = Array.isArray(parsed.what_is_unknown)
    ? parsed.what_is_unknown.filter(x => typeof x === 'string' && x.trim()).slice(0, 2)
    : [];

  const nm = parsed.next_move && typeof parsed.next_move === 'object' ? parsed.next_move : {};
  const hasAction = typeof nm.action === 'string' && nm.action.trim();
  const nextMove = {
    available: nm.available === true && !!hasAction,
    action: hasAction ? nm.action.trim() : null,
    why: hasAction && typeof nm.why === 'string' && nm.why.trim() ? nm.why.trim() : null,
  };

  return {
    safety_redirect: false,
    what_happened: whatHappened,
    what_the_spiral_added: spiralAdded,
    what_is_unknown: whatUnknown,
    anchor: typeof parsed.anchor === 'string' && parsed.anchor.trim() ? parsed.anchor.trim() : null,
    next_move: nextMove,
    after_this: typeof parsed.after_this === 'string' && parsed.after_this.trim() ? parsed.after_this.trim() : null,
  };
}

router.post('/spiral-stopper', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { thoughts, actual_event, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    if (!thoughts || !String(thoughts).trim()) {
      return res.status(400).json({ error: 'Tell me what is looping in your head.' });
    }

    const system = withLanguage(CONTRACT, userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion);

    const prompt = `THE LOOP, IN THEIR OWN WORDS\n${String(thoughts).trim()}\n\nTHEIR OPTIONAL FACTUAL ANCHOR\n${actual_event && String(actual_event).trim() ? String(actual_event).trim() : 'Not supplied.'}\n\nReturn ONLY valid JSON in exactly this shape. Every string value must speak to them directly as "you" — see VOICE above.\n{\n  "safety_redirect": false,\n  "what_happened": [\n    "1-3 concise factual statements directly supported by their words, addressed to them as you. If a fact cannot be established, omit it."\n  ],\n  "what_the_spiral_added": [\n    {\n      "thought": "The visitor's OWN claim, preserved — quoted or lightly paraphrased in their own words as you/your. Do not strengthen, soften, psychologize, or embellish it. This is their thought, not a new one composed for them.",\n      "status": "PREDICTION | INTERPRETATION | CONCLUSION",\n      "grounded_version": "A short you/your version that preserves what is known and does not invent reassurance."\n    }\n  ],\n  "what_is_unknown": [\n    "Usually 1-2 items, restoring the ONE uncertainty already implied by the visitor's own supplied concern — never a list of new invented alternative scenarios. Addressed as you/your. See WHAT'S UNKNOWN DISCIPLINE."\n  ],\n  "anchor": "One short you/your sentence they can come back to. It must contain only supplied facts plus explicit uncertainty.",\n  "next_move": {\n    "available": true,\n    "action": "At most one concrete low-risk action, addressed as you/your. If none exists, set available false and action null.",\n    "why": "One sentence describing what the action gives them to do now — never a promise that it will resolve or answer their uncertainty afterward. See NEXT MOVE. If unavailable, null."\n  },\n  "after_this": "One short you/your sentence telling them what they do NOT need to solve right now, or what to wait for. NEVER any variant of 'that can only be answered by contact' / 'becomes clear once you reach out' — contact might clarify nothing at all."\n}\n\nIf safety_redirect is true, instead return:\n{\n  "safety_redirect": true,\n  "message": "Brief, warm you/your safety-first message naming concrete crisis resources",\n  "what_happened": [],\n  "what_the_spiral_added": [],\n  "what_is_unknown": [],\n  "anchor": null,\n  "next_move": { "available": false, "action": null, "why": null },\n  "after_this": null\n}\n\nLimits:\n- what_happened: max 3 items\n- what_the_spiral_added: max 4 items\n- what_is_unknown: usually 1-2 items, never more than 2\n- no cognitive-distortion labels\n- no clinical explanations\n- no invented personal history\n- no prediction of how others will react\n- no claim that they are safe\n- no third-person phrasing anywhere in the output ("the visitor", "they", "the user") — always you/your\n- never promise, in why OR after_this, that the next move will resolve or answer the visitor's uncertainty, or that things become clear once contact happens\n- ${NO_QUOTE_RULE}`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 3200,
      system,
      messages: [{ role: 'user', content: prompt }],
    }, { label: 'spiral-stopper' });

    const result = validateResult(parsed);
    if (!result) return res.status(500).json({ error: 'Could not untangle this spiral. Please try again.' });
    res.json(result);
  } catch (error) {
    console.error('SpiralStopper error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
