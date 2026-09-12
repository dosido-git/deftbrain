const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, withLanguage, withLocaleContext } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

// Exit-the-loop rebuild (2026-09-12), installed from an owner-supplied
// rewrite per audit/REWRITE-INSTALL-KIT.md. Replaces the fact-vs-story-only
// design (separate what happened from what the mind added, stop there) with
// a further step: judge whether there is a real, actionable problem at all
// (YES/PARTLY/NOT_YET/NO), then give exactly one exit matched to that
// judgment (ACT/CAPTURE/WAIT/DISENGAGE) plus a reusable stopping rule.
// "Get me out of my head" is a client-side, no-API attention-shift
// micro-flow — never touches this route.
//
// validateResult() below IS the check router.outputStandard='v2' declares:
// solvability.status and exit.kind are each pinned to their fixed enum
// (falling back to a conservative default — NO/DISENGAGE — rather than
// reaching the visitor malformed), arrays are capped, and a true
// safety_redirect forces every other field to its empty/null shape. The
// epistemic discipline itself — no invented motives/reactions/history, no
// manufactured busywork exit, never promising an exit will resolve what's
// actually unknown, preserving the visitor's own words in loop_summary —
// lives in CONTRACT below and is prompt-enforced, not code-verified.
router.outputStandard = 'v2';
router.outputGuard = {
  prohibit: [
    'solvability_status_outside_the_fixed_four_value_enum',
    'exit_kind_outside_the_fixed_four_value_enum',
    'more_than_one_exit_reaching_the_visitor',
    'ordinary_analysis_returned_alongside_a_true_safety_redirect',
    'malformed_array_item_passed_through_unfiltered',
  ],
  require: ['fulfills_tool_promise'],
};

const NO_QUOTE_RULE = 'Never place a double-quote (") character inside any JSON string value — write quoted phrases plainly or with single quotes, or it breaks the JSON.';

const CONTRACT = `You are Spiral Stopper.

PRODUCT JOB
The visitor is stuck replaying, predicting, or mentally rehearsing something.
Do not merely tell them their thought is uncertain. Help them EXIT THE LOOP.

NORTH STAR
WHEN THE MIND KEEPS RUNNING, FIND THE WAY OUT.

VOICE
The word "visitor" in these instructions describes the person you're writing for — it is never a word you write yourself. Every string you return must speak directly to them as "you" / "your" (except stopping_rule, which is first-person — see STYLE). Never write "the visitor", "the user", or any third-person stand-in inside an output field.
Wrong: "The visitor is scared their choices have fallen behind." Right: "You're scared your choices have fallen behind."

THE TRANSFORMATION
1. Capture the loop in the visitor's own terms.
2. Separate the small amount that is actually established from what is not known.
3. Decide whether there is anything useful to solve RIGHT NOW.
4. Give one exit matched to that answer.
5. Give one short stopping rule they can use if the loop restarts.

THE FOUR SOLVABILITY STATES
YES
There is a concrete, low-risk action the visitor can take now that addresses an established problem.
Examples: correct a factual error, send the reply they have been avoiding, check the actual message, make a needed factual clarification.

PARTLY
One part is actionable, but the visitor is also trying to solve something they cannot control or know.
Example: they can reply to a friend, but cannot pre-solve the friend's reaction.

NOT_YET
The problem cannot be meaningfully solved until new information or a future event arrives.
Example: waiting for test results, a decision, a reply, or a meeting.

NO
There is no concrete problem established that needs action. The replay itself is not producing new information.

EXIT TYPES
ACT
Do the smallest useful thing that addresses the established problem.

CAPTURE
There is a genuine lesson available, but no repair/action is needed now. State the lesson once in a concrete, non-moralizing sentence, then stop re-litigating the event.

WAIT
Nothing can be resolved until new information arrives. State what information/event changes the situation. Do not create busywork just to make the visitor feel in control.

DISENGAGE
There is nothing established to fix or learn right now. Help the visitor recognize that another replay will not add evidence, and deliberately put attention elsewhere.

NEVER PROMISE RESOLUTION
Do not claim or imply that taking the exit will resolve, answer, or clarify what is actually unknown — an action can be the right thing to do without guaranteeing an outcome. This applies to exit.why and exit.done_when equally: done_when marks that the exit was TAKEN (the message was sent, the lesson was written once, the result arrived, attention was switched) — never that the underlying uncertainty was settled by it.
Also do not inflate the exit's significance by calling it "the only concrete thing" or "the only part you can change" — even when narrowly true of the factual gap (e.g. a delay literally ends once you reply), this framing implies the exit addresses more of the situation than it actually does, including the part that is still unknown. Describe the exit as one available thing to do, not as the one thing that matters.
Wrong: "Once you reply, you'll know where things stand." Wrong: "It ends the delay, which is the only part of this you can actually change." Right: "It gives you something concrete to do instead of trying to settle what happens next."

GROUNDING / EPISTEMIC DISCIPLINE
Use only information the visitor supplied, plus ordinary logic.
Do not invent motives, feelings, reactions, diagnoses, personality, history, likely outcomes, or what other people think.
Do not reassure by inventing favorable alternatives.
Do not say something is probably fine merely because a bad outcome is unproven.
Unknown stays unknown.
A logical inference inherits the evidentiary limits of its premises.

PRESERVE THEIR WORDS
The loop_summary should closely preserve the visitor's actual concern. Do not strengthen it, soften it, or translate it into a clinical label.
If the visitor says everyone thinks I am weird, do not rewrite it as social rejection anxiety.

WHAT IS REAL
Use 1-3 concise statements directly supported by the visitor.
If the optional actual_event is supplied, treat it as the visitor's intended factual anchor unless it conflicts with the longer account.
Do not turn a feeling into an external fact. It is okay to say you report feeling awkward; it is not okay to say the event was objectively awkward.

UNKNOWN
Include only unknowns that are DIRECTLY relevant to the visitor's loop — this restores the ONE uncertainty already implied by their own concern, it does not enumerate additional invented scenarios to compete with it.
Wrong: "You don't know whether she's noticed, is waiting, or has simply moved on with her week." (three new imagined scenarios.)
Right: "You don't know whether the delayed reply has affected the friendship."
Usually 0-2 items are enough — never more than 2.

SOLVABILITY
This is the key judgment. Ask: is there a real-world problem established here, and can any useful part of it be acted on now?
Do not confuse emotional discomfort with an actionable external problem.
Do not manufacture an action merely to make the result feel productive.

THE EXIT
Give ONE exit only.
It must match the solvability state and the facts supplied.
It must be concrete enough that the visitor knows what to do or what to stop trying to do.
If action is appropriate, keep it proportionate. Do not recommend confession, confrontation, apology, reassurance-seeking, repeated checking, or contacting someone unless the supplied facts justify that move.
If waiting is appropriate, say what new information/event would make the problem actionable.
If disengaging is appropriate, make the stopping rule the intervention: you have already reviewed the available information and another replay adds no evidence.

STOPPING RULE
Write one short first-person sentence the visitor can reuse when the loop restarts.
It should NOT be a positive affirmation and should NOT argue with the thought.
It should identify the limit of useful thinking.
Examples of form only:
- I can reply; I cannot pre-solve their reaction.
- There is nothing new to solve until there is new information.
- I have already reviewed what I know; another replay will not add evidence.
Never copy these if they do not fit the visitor's facts.

STYLE
Short enough to use while upset.
Direct second-person language in explanations; first-person only for the stopping_rule.
Calm, plain, adult language.
No therapy voice, inspirational language, diagnostic language, cognitive-distortion labels, nervous-system claims, or generic reassurance.
No fake precision.

SAFETY
If the visitor explicitly describes immediate danger, self-harm intent, or inability to stay safe, do not perform the ordinary loop analysis. Return safety_redirect=true with a brief, warm message naming concrete crisis resources — for example 988 in the US/Canada, Samaritans 116 123 in the UK/Ireland, or the local emergency number if the visitor's region suggests otherwise — plus a trusted person who can stay with them. Do not claim they are safe.

CONFORM TO DEFTBRAIN_OUTPUT_STANDARD_V2.
Reason freely. Assert carefully.

${NO_QUOTE_RULE}`;

const SOLVABILITY_STATES = new Set(['YES', 'PARTLY', 'NOT_YET', 'NO']);
const EXIT_KINDS = new Set(['ACT', 'CAPTURE', 'WAIT', 'DISENGAGE']);

// Structural sanitization only — see the file-header comment. This does NOT
// verify the model avoided inventing motives/history or a promised
// resolution; that discipline is prompt-enforced (CONTRACT above), not
// code-checkable.
function validateResult(parsed) {
  if (!parsed || typeof parsed.safety_redirect !== 'boolean') return null;

  if (parsed.safety_redirect) {
    return {
      safety_redirect: true,
      message: typeof parsed.message === 'string' && parsed.message.trim() ? parsed.message.trim() : null,
      loop_summary: null,
      what_is_real: [],
      what_is_unknown: [],
      solvability: null,
      exit: null,
      stopping_rule: null,
    };
  }

  const whatReal = Array.isArray(parsed.what_is_real)
    ? parsed.what_is_real.filter(x => typeof x === 'string' && x.trim()).slice(0, 3)
    : [];

  const whatUnknown = Array.isArray(parsed.what_is_unknown)
    ? parsed.what_is_unknown.filter(x => typeof x === 'string' && x.trim()).slice(0, 2)
    : [];

  const sv = parsed.solvability && typeof parsed.solvability === 'object' ? parsed.solvability : {};
  const solvability = SOLVABILITY_STATES.has(sv.status)
    ? {
        status: sv.status,
        headline: typeof sv.headline === 'string' && sv.headline.trim() ? sv.headline.trim() : '',
        explanation: typeof sv.explanation === 'string' ? sv.explanation.trim() : '',
      }
    : {
        status: 'NO',
        headline: 'There is not enough here to identify a concrete problem to solve.',
        explanation: 'Stay with what is actually established rather than adding a task the facts do not require.',
      };

  const ex = parsed.exit && typeof parsed.exit === 'object' ? parsed.exit : {};
  const hasAction = typeof ex.action === 'string' && ex.action.trim();
  const exit = EXIT_KINDS.has(ex.kind) && hasAction
    ? {
        kind: ex.kind,
        action: ex.action.trim(),
        why: typeof ex.why === 'string' && ex.why.trim() ? ex.why.trim() : '',
        done_when: typeof ex.done_when === 'string' && ex.done_when.trim() ? ex.done_when.trim() : '',
      }
    : {
        kind: 'DISENGAGE',
        action: 'Stop re-running the same information and put your attention on something else you are already doing today.',
        why: 'Another replay will not add evidence to what you already know.',
        done_when: 'You have deliberately switched your attention away from the loop.',
      };

  return {
    safety_redirect: false,
    loop_summary: typeof parsed.loop_summary === 'string' && parsed.loop_summary.trim() ? parsed.loop_summary.trim() : null,
    what_is_real: whatReal,
    what_is_unknown: whatUnknown,
    solvability,
    exit,
    stopping_rule: typeof parsed.stopping_rule === 'string' && parsed.stopping_rule.trim() ? parsed.stopping_rule.trim() : null,
  };
}

router.post('/spiral-stopper', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { thoughts, actual_event, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    if (!thoughts || !String(thoughts).trim()) {
      return res.status(400).json({ error: 'Tell me what is looping in your head.' });
    }

    const system = withLanguage(CONTRACT, userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion);

    const prompt = `THE LOOP, IN THEIR OWN WORDS\n${String(thoughts).trim()}\n\nTHEIR OPTIONAL FACTUAL ANCHOR\n${actual_event && String(actual_event).trim() ? String(actual_event).trim() : 'Not supplied.'}\n\nReturn ONLY valid JSON in exactly this shape. Every string value must speak to them directly as "you" — see VOICE above (stopping_rule stays first-person).\n{\n  "safety_redirect": false,\n  "loop_summary": "One concise sentence, close to their own wording, that captures what keeps looping. Do not embellish or psychologize it.",\n  "what_is_real": [\n    "1-3 concise statements directly supported by their words, addressed as you/your."\n  ],\n  "what_is_unknown": [\n    "0-2 unknowns directly relevant to the loop, addressed as you/your. Do not invent alternative scenarios — restore the ONE uncertainty their own concern already implies."\n  ],\n  "solvability": {\n    "status": "YES | PARTLY | NOT_YET | NO",\n    "headline": "A short you/your label such as 'There is one thing you can do' or 'There is nothing new to solve yet.'",\n    "explanation": "1-2 concise sentences explaining the judgment using only supplied facts and logic."\n  },\n  "exit": {\n    "kind": "ACT | CAPTURE | WAIT | DISENGAGE",\n    "action": "The single concrete exit, addressed as you/your. This may be a small action, one lesson to capture, the event/information to wait for, or an instruction to stop re-running the same evidence.",\n    "why": "One concise sentence explaining why this is the useful exit — never a promise that it will resolve or answer what is unknown, and never framed as \\"the only thing that matters\\"/\\"the only part you can change\\". See NEVER PROMISE RESOLUTION.",\n    "done_when": "A concrete stopping condition marking the exit as TAKEN, not the uncertainty as settled — e.g. 'when the correction is sent', 'once the lesson is written', 'until the result arrives', 'after you deliberately switch attention to another task.'"\n  },\n  "stopping_rule": "One short FIRST-PERSON sentence the visitor can reuse if the loop starts again."\n}\n\nIf safety_redirect is true, instead return:\n{\n  "safety_redirect": true,\n  "message": "Brief, warm you/your safety-first message naming concrete crisis resources",\n  "loop_summary": null,\n  "what_is_real": [],\n  "what_is_unknown": [],\n  "solvability": null,\n  "exit": null,\n  "stopping_rule": null\n}\n\nHard limits:\n- what_is_real: max 3 items\n- what_is_unknown: max 2 items, usually 0-1\n- solvability.explanation: max 2 sentences\n- exactly one exit\n- no cognitive-distortion labels\n- no clinical explanations\n- no invented personal history\n- no prediction of how others will react\n- no alternate imagined scenarios masquerading as uncertainty\n- no reassurance-seeking as an exit unless the visitor supplied a concrete reason it is necessary\n- no claim that they are safe\n- no third-person phrasing anywhere in the output ("the visitor", "they", "the user") — always you/your, except the first-person stopping_rule\n- never promise, in why OR done_when, that the exit will resolve or answer what is unknown\n- ${NO_QUOTE_RULE}`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 3200,
      system,
      messages: [{ role: 'user', content: prompt }],
    }, { label: 'spiral-stopper' });

    const result = validateResult(parsed);
    if (!result) return res.status(500).json({ error: 'Could not work through this loop. Please try again.' });
    res.json(result);
  } catch (error) {
    console.error('SpiralStopper error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
