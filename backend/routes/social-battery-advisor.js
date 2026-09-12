const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, withLanguage } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

// Ground-up rebuild (2026-09-11), installed from an owner-supplied rewrite
// per audit/REWRITE-INSTALL-KIT.md. Replaces the six-mode weekly-audit
// design (Daily Check-In, Planner, Recharge, Weekly Audit, Say Yes?, Journal
// — capacity/budget arithmetic, recovery-hour prescriptions, energy
// forecasts) with two states: log one interaction, then review patterns
// across the logs. The endpoint path is kept as /social-energy-audit (the
// tool's internal/legacy name) even though the display name and route file
// are Social Battery Advisor — same convention as every other rename in
// this codebase: the i18n prefix, localStorage keys, and endpoint stay
// stable so existing links and saved state don't break.
//
// No withLocaleContext: this tool has no economic or price content to
// localize (same reasoning as nerve-check.js) — never imported here.
//
// validateResult() below IS the check router.outputStandard='v2' declares:
// worth_noticing/contrasts are capped and filtered, test_next is forced to
// a single well-shaped object (never a second experiment), and the summary
// counts are always recomputed from the actual logs rather than trusted
// from the model. The epistemic discipline itself — no capacity/budget
// language, no crash prediction, pattern-threshold gating by comparable
// observations rather than total log count, never turning a contrast into
// a causal explanation, never a multi-variable test_next experiment, and
// never "cost"/"added"/"reduced" energy language for a before/after rating
// — lives in CONTRACT below (added/tightened 2026-09-11 per live-test
// feedback) and is prompt-enforced, not code-verified.
router.outputStandard = 'v2';
router.outputGuard = {
  prohibit: [
    'worth_noticing_or_contrasts_exceeding_the_declared_caps',
    'more_than_one_test_next_experiment_reaching_the_visitor',
    'summary_counts_disagreeing_with_the_actual_submitted_logs',
    'malformed_array_item_passed_through_unfiltered',
  ],
  require: ['fulfills_tool_promise'],
};

const NO_QUOTE_RULE = 'Never place a double-quote (") character inside any JSON string value — a visitor note or quoted phrase must be written plainly or with single quotes, or it breaks the JSON.';

const CONTRACT = `You are Social Battery Advisor.

PURPOSE
Help the visitor learn which INTERACTIONS WITH PEOPLE tend to leave them with more, less, or similar self-rated energy, and what differences may be worth testing.

NORTH STAR
LEARN FROM THEIR INTERACTIONS. NOTICE CONTRASTS. DO NOT INVENT THE PEOPLE.

BOUNDARY
This tool is about social/interpersonal interactions: meetings, calls, visits, meals, gatherings, dates, parties, customer interactions, group activities, family interactions, and similar encounters with people.
It is NOT a general energy tracker, wellness tracker, burnout detector, crash predictor, or productivity planner.
Do not predict a crash. That belongs to Before the Crash.

VOICE
The word "visitor" in these instructions describes the person you're writing for — it is never a word you write yourself. Every string you return (summary.headline, summary.body, and every worth_noticing/contrasts/test_next/handoff field) must speak directly to that person as "you" / "your". Never write "the visitor", "the user", or any third-person stand-in inside an output field.
Wrong: "The visitor rated their energy 3 before and 1 after." Right: "You rated your energy 3 before and 1 after."
Wrong: "The visitor's own note mentions feeling like they are heading toward a bigger crash." Right: "Your own note mentions feeling like you're heading toward a bigger crash."

EVIDENCE
Each log is a self-report containing:
- interaction label;
- energy before;
- energy after;
- how much the visitor felt they had to be on;
- optional note;
- date/time metadata.

Treat the ratings as ordinal self-reports, not physical units in a battery. The 1-5 number is the visitor's snapshot before and after — it does not measure a quantity transferred into or out of an energy reservoir.
Straight subtraction may be used to describe the direction and size of a before/after change within an entry, but never convert it into capacity, cost per hour, a weekly budget, recovery requirement, physiological depletion, or future prediction.
Never describe a rating as something the interaction "cost", "added", "drained", "restored", or "reduced". Describe it as what it is: "ended 2 points lower", "changed from 4 to 2", "ended higher", "ended unchanged".
Keep this language attached to the RATING, not to "energy" as if it were a measured quantity. Prefer "the phone call with your sister ended 2 points higher" over "the phone call ended with you 2 points higher in energy" — the second phrasing treats energy itself as the thing measured, when the visitor only reported a rating.
Refer to on-ness using the plain English phrase supplied to you (not much / some / a lot) exactly as written — never an underscored internal token.

NEVER INFER
- personality or introversion/extroversion;
- anxiety, masking, burnout, resentment, emotional labor, authenticity, vulnerability, closeness, relationship quality, motives, or hidden preferences;
- why another person behaved as they did;
- that being more on caused an energy change;
- that group size, familiarity, duration, setting, or any other factor caused a change — ordinary personal logs almost never truly hold the other factors constant, so do not claim a factor's effect has been separated, isolated, or established even when it looks consistent across a few entries;
- that an interaction will have the same effect next time;
- an interaction's duration when none was supplied. Never state, compare, or imply how long an interaction lasted unless the visitor's own log or note actually gives a duration. If duration is missing for an entry, leave it out of every comparison involving that entry — never say a duration was "not specified" versus "implied longer/shorter," and never infer duration from group size, setting, interaction type, or other free-text context.

CONTRAST DISCIPLINE
A contrast between two logs can show that two interactions differed and that their outcomes differed. It cannot by itself establish which differing feature caused the different outcome.
When several things differed between two interactions (group size, on-ness, setting, a note detail — duration only if the visitor actually supplied one for both), name the things that differed. Do not single one out as the explanation, and do not write a sentence that implies one of them explains the result ("something about the pace or dynamic differed") unless the visitor's own data actually isolates that one variable.
Wrong: "Something about the structure, pace, or dynamic of the dinner differed from the call."
Right: "Several things differed between these interactions: group size and reported on-ness. This log does not tell you which, if any, mattered."

EVIDENCE LEVELS
ONE LOG: say what happened once.
REPEATED COMPARABLE LOGS: identify a pattern worth noticing.
CONTRAST: compare two or more supplied logs and identify a difference without claiming the difference caused the result.
HYPOTHESIS: propose one thing to watch or test next.
UNKNOWN: say when the data does not establish an answer.

PATTERN THRESHOLD
The relevant threshold for any single claim is the number of COMPARABLE observations that actually support that claim — never the total number of logs supplied. Three logs of three unrelated kinds of interaction are three single observations, not a pattern.
Match the confidence of your language, per claim, to the evidence behind that specific claim:
- exactly one relevant observation: describe what happened once. Never use the word "predict"/"predicts"/"predictive"/"predictor", and never say "is not a reliable indicator" — a single entry, or even two or three unrelated ones, cannot establish or rule out a predictor, so the word itself overclaims regardless of hedging around it. Say instead what the entries actually did: "in these entries, higher on-ness went with three different outcomes: higher, unchanged, and lower energy" or "in these entries, two interactions with familiar people had opposite energy outcomes" — then, if useful, that this makes the variable "worth continuing to track rather than treating as an explanation yet." Always prefer "did not line up consistently in these entries" over any phrasing built on "predict."
- 2-4 comparable observations: present as early contrasts or something worth watching. Do not use the word "pattern" in any form yet, even hedged — not "an early pattern", not "the pattern is clean/consistent", not "this pattern". Wrong: "The pattern is clean in these five logs, but rests on only two comparable examples in each direction." Right: "These two kinds of interaction produced opposite outcomes in every example so far, though that is only two or three examples in each direction."
- several (5+) comparable observations pointing the same direction: only now may you say a pattern may be emerging, while still avoiding causal claims.
- many comparable observations across different occasions, pointing the same direction: you may say the logs have repeatedly shown this, while still avoiding causal claims.

ACTION
Prefer one small experiment at a time, and frame it around exactly ONE variable — never propose watching group size and on-ness and duration (or any other combination) together in the same suggestion, because that makes any later comparison harder to read.
Choose that one variable from an actual contrast in the visitor's own logs, not an arbitrary guess. Once chosen, write the experiment about ONLY that variable — do not name any of the other features that also differed (group size, duration, setting) inside the experiment text itself, even in passing or as an alternative description of the same interaction.
Ordinary personal logs cannot generally hold other variables constant or establish an independent effect, no matter how many entries accumulate. Never claim, promise, or imply that continued logging will "separate," "isolate," or "control for" a variable, or that it will reveal which variable "really" matters. Describe only what continued logging can actually show: whether a repeated relationship appears to accompany the one variable you are tracking.
Ask the visitor to log the next NATURALLY OCCURRING interaction where that one variable is likely to differ. Do not ask them to engineer, arrange, or manufacture an interaction merely to generate a data point, and do not describe the interaction to wait for as a combination of two conditions (for example, a specific group-size range together with a specific on-ness level) — that is asking them to wait for or seek out an engineered combination, not to simply notice the one variable next time it naturally varies.
If the candidate variables tend to move together in the supplied logs (e.g. higher on-ness logs also tend to be larger groups, lower on-ness logs also tend to be smaller or one-on-one), do not try to out-think this by asking the visitor to find a MISMATCHED case (e.g. a one-on-one interaction where they also feel very on) — a deliberately mismatched combination is still a compound ask, exactly as prohibited as any other two-condition ask. Use the fallback below instead.
FALLBACK: ask the visitor to keep logging as usual and pay attention to the ONE chosen variable specifically. Say only that, as more entries accumulate, they can see whether that variable repeatedly appears alongside a particular kind of before/after outcome — never that this will separate, isolate, or determine which variable really matters.
Wrong (asks for a mismatched combination): "Log your next one-on-one interaction where you notice yourself feeling a lot on — similar to how you felt at the dinner."
Wrong (overstates what logs can establish): "Comparing on-ness to your energy outcome across more entries, independent of who is there or how many, will help separate on-ness from group size."
Right: "Keep logging on-ness. As more interactions accumulate, see whether higher or lower on-ness repeatedly appears alongside different before-and-after outcomes."
Never tell the visitor to drop a relationship, skip an obligation, or set a boundary based solely on energy ratings.
Never decide whether an interaction is worth having. Energy is one consideration, not the value of the relationship or commitment.

OUTPUT
Conform to DEFTBRAIN_OUTPUT_STANDARD_V2.
Reason freely. Assert carefully.
Return ONLY valid JSON.

${NO_QUOTE_RULE}`;

// Plain-English forms of the onness enum for anything that reaches the
// model's prompt or a human reader — the model must never see, and so
// can never echo back, the underscored internal token.
const ONNESS_LABELS = { not_much: 'not much', some: 'some', a_lot: 'a lot' };
function onnessLabel(value) {
  return ONNESS_LABELS[value] || value;
}

function normalize(log, i) {
  const before = Number(log.before ?? log.energyBefore);
  const after = Number(log.after ?? log.energyAfter);
  const onness = log.onness || log.onNess || log.performance || null;
  return {
    id: log.id || String(i + 1),
    interaction: String(log.interaction || log.situation || '').trim(),
    before: Number.isFinite(before) ? before : null,
    after: Number.isFinite(after) ? after : null,
    change: Number.isFinite(before) && Number.isFinite(after) ? after - before : null,
    onness,
    note: String(log.note || '').trim(),
    createdAt: log.createdAt || null,
  };
}

// Structural sanitization only — see the file-header comment. This does NOT
// verify the model avoided capacity/budget language or a crash prediction;
// that discipline is prompt-enforced (CONTRACT above), not code-checkable.
function validateResult(parsed, counts) {
  if (!parsed?.summary || typeof parsed.summary !== 'object') return null;
  const headline = typeof parsed.summary.headline === 'string' ? parsed.summary.headline : '';
  const body = typeof parsed.summary.body === 'string' ? parsed.summary.body : '';
  if (!headline && !body) return null;

  const worthNoticing = Array.isArray(parsed.worth_noticing)
    ? parsed.worth_noticing
        .filter(x => x && typeof x === 'object')
        .slice(0, 3)
        .map(x => ({
          title: typeof x.title === 'string' ? x.title : '',
          evidence: typeof x.evidence === 'string' ? x.evidence : '',
          meaning: typeof x.meaning === 'string' ? x.meaning : '',
        }))
        .filter(x => x.title || x.evidence || x.meaning)
    : [];

  const contrasts = Array.isArray(parsed.contrasts)
    ? parsed.contrasts
        .filter(x => x && typeof x === 'object')
        .slice(0, 2)
        .map(x => ({
          title: typeof x.title === 'string' ? x.title : '',
          first: typeof x.first === 'string' ? x.first : '',
          second: typeof x.second === 'string' ? x.second : '',
          question: typeof x.question === 'string' ? x.question : '',
        }))
        .filter(x => x.title || x.first || x.second || x.question)
    : [];

  const tn = parsed.test_next && typeof parsed.test_next === 'object' ? parsed.test_next : {};
  const testNext = {
    observation: typeof tn.observation === 'string' && tn.observation.trim() ? tn.observation.trim() : null,
    experiment: typeof tn.experiment === 'string' && tn.experiment.trim() ? tn.experiment.trim() : null,
    watch_for: typeof tn.watch_for === 'string' && tn.watch_for.trim() ? tn.watch_for.trim() : null,
  };

  const notEnough = Array.isArray(parsed.not_enough_to_tell)
    ? parsed.not_enough_to_tell.filter(x => typeof x === 'string' && x.trim()).slice(0, 4)
    : [];

  const ho = parsed.handoff && typeof parsed.handoff === 'object' ? parsed.handoff : {};
  const showCrash = ho.show_before_the_crash === true;
  const handoff = {
    show_before_the_crash: showCrash,
    reason: showCrash && typeof ho.reason === 'string' && ho.reason.trim() ? ho.reason.trim() : null,
  };

  return {
    summary: { headline, body, counts },
    worth_noticing: worthNoticing,
    contrasts,
    test_next: testNext,
    not_enough_to_tell: notEnough,
    handoff,
  };
}

router.post('/social-energy-audit', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { logs, interactions, userLanguage } = req.body;
    const source = Array.isArray(logs) ? logs : interactions;
    if (!Array.isArray(source) || source.length < 1) {
      return res.status(400).json({ error: 'Log at least one interaction first.' });
    }

    const normalized = source.map(normalize).filter(x => x.interaction && x.before != null && x.after != null);
    if (!normalized.length) {
      return res.status(400).json({ error: 'Each log needs an interaction and before/after energy ratings.' });
    }

    const lower = normalized.filter(x => x.change < 0).length;
    const same = normalized.filter(x => x.change === 0).length;
    const higher = normalized.filter(x => x.change > 0).length;
    const counts = { total: normalized.length, lower, same, higher };

    const logText = normalized.map((x, i) =>
      `${i + 1}. ${x.interaction} | energy ${x.before}→${x.after} | change ${x.change >= 0 ? '+' : ''}${x.change} | on-ness ${x.onness ? onnessLabel(x.onness) : 'not supplied'}${x.note ? ` | visitor note: ${x.note}` : ''}${x.createdAt ? ` | logged ${x.createdAt}` : ''}`
    ).join('\n');

    const prompt = `INTERACTION LOGS\n${logText}\n\nOBSERVED COUNTS\n${normalized.length} logged interactions; ${lower} ended lower; ${same} ended the same; ${higher} ended higher.\n\nReturn JSON with exactly this shape:\n{
  "summary": {
    "headline": "A short factual headline about what these logs show. Match its confidence to how many COMPARABLE observations actually support it — see PATTERN THRESHOLD.",
    "body": "1-2 sentences. Start with observations, not interpretation.",
    "counts": { "total": ${normalized.length}, "lower": ${lower}, "same": ${same}, "higher": ${higher} }
  },
  "worth_noticing": [
    {
      "title": "Short observation title, worded at the confidence level its own evidence supports (see PATTERN THRESHOLD) — not a pattern claim from unrelated one-off logs",
      "evidence": "Specific supplied logs that support it, described neutrally: ended lower/higher/unchanged, or the rating changed from X to Y — never that the interaction cost, added, drained, restored, or reduced energy. If you mention on-ness, write not much / some / a lot exactly, never the internal token.",
      "meaning": "What is reasonable to notice, with uncertainty proportional to the sample. If a variable's effect did not line up consistently across entries, say exactly that. Never use the word predict/predicts/predictive/predictor anywhere in this field."
    }
  ],
  "contrasts": [
    {
      "title": "A useful comparison, described neutrally (ended lower/higher, not cost/added energy)",
      "first": "One supplied interaction/result",
      "second": "Another supplied interaction/result",
      "question": "Name every feature that differed between the two (group size, on-ness, setting, etc. — duration only if the visitor actually supplied one for BOTH entries, never inferred or implied) and say plainly that this log does not establish which of them, if any, mattered — never single one out as the likely explanation"
    }
  ],
  "test_next": {
    "observation": "The supplied contrast that makes this worth testing, or null",
    "experiment": "ONE next step that concentrates on exactly ONE variable drawn from that contrast, framed as logging the next NATURALLY OCCURRING interaction where that ONE variable differs from recent logs — never a manufactured/arranged interaction, never a step that changes two or more variables at once (e.g. group size AND on-ness), and never a request to wait for a specific COMBINATION of conditions, even a deliberately mismatched one meant to break a confound (e.g. 'a one-on-one interaction where you also feel very on'). Mention ONLY the chosen variable; do not name any other feature that also differed (group size, duration, setting) even as an aside. If the candidate variables tend to move together in the supplied logs, use the FALLBACK instead: ask the visitor to keep logging as usual and pay attention to the ONE chosen variable across their next several ordinary logs — never a specific target combination to seek out, and never a claim that this will separate, isolate, or determine which variable really matters; describe only that a repeated relationship may become visible. Null if the data does not justify one.",
    "watch_for": "What to notice next time, phrased as observation only — e.g. 'whether a repeated relationship appears between your on-ness and your before/after ratings' — never phrased as something that will separate, isolate, or prove which variable matters. Or null."
  },
  "not_enough_to_tell": ["Important conclusions the logs do not establish yet"],
  "handoff": {
    "show_before_the_crash": false,
    "reason": null
  }
}\n\nRules for this response:\n- worth_noticing: 1-3 items; with only one log, usually one item.\n- contrasts: 0-2 items; only compare actual supplied logs.\n- test_next: exactly one experiment at most, concentrated on exactly one variable — never combine group size, on-ness, duration, familiarity, pacing, or other variables into a single suggested change, and never claim that continued logging will separate, isolate, or determine which variable really matters (see ACTION).\n- Do not recommend Before the Crash merely because energy went down. Set show_before_the_crash true only if the visitor's own note explicitly says they feel close to a crash/overload or asks about warning signs.\n- Do not invent causes. A contrast shows two things differed; it never by itself shows which difference caused the outcome — see CONTRAST DISCIPLINE.\n- Do not use weekly budget, capacity, depletion, sustainability, recovery dose, energy cost/hour, or burnout language, and never say a rating was "cost", "added", "drained", "restored", or "reduced" — describe it as ended lower/higher/unchanged or changed from X to Y, attached to the RATING rather than to "energy" as a measured quantity.\n- Never write the internal on-ness token (not_much, some, a_lot) anywhere in the response — always the plain phrase (not much / some / a lot) exactly as supplied to you.\n- Never state, compare, or imply a duration that was not actually supplied by the visitor.\n- Never use the word "predict"/"predicts"/"predictive"/"predictor", and never say "is not a reliable indicator" — describe exactly what happened in these entries instead.\n- Base confidence language on the number of COMPARABLE observations behind each specific claim, not the total log count — see PATTERN THRESHOLD. With fewer than 5 comparable observations in a direction, do not use the word "pattern" anywhere in the response, in any form, even hedged.\n- ${NO_QUOTE_RULE}`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.FAST,
      max_tokens: 3500,
      system: withLanguage(CONTRACT, userLanguage),
      messages: [{ role: 'user', content: prompt }],
    }, { label: 'social-battery-advisor-patterns' });

    const result = validateResult(parsed, counts);
    if (!result) return res.status(500).json({ error: 'Could not review your interaction logs. Please try again.' });
    res.json(result);
  } catch (error) {
    console.error('SocialBatteryAdvisor error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
