const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, withLanguage, withLocaleContext } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

const NO_QUOTE_RULE = 'Never place a double-quote (") character inside any JSON string value — quoted phrases or example wording must be written plainly or with single quotes, or it breaks the JSON.';

// ════════════════════════════════════════════════════════════
// POST /pep — PEP, Personal Energy Planner (was "Dopamine Menu Builder").
//
// FULL V2 REWRITE, 2026-09-05. The old prompt promised a "5-mode energy
// management system" that measured a biological energy reserve, forecast
// battery drain, predicted burnout 1-2 weeks out, and stereotyped
// introverts/extroverts into fixed drain rates. This pass replaces all of
// that with an explicit epistemic model: the visitor's 1-10 rating is a
// SELF-REPORT, not a measurement, and PEP does not diagnose, forecast, or
// know what will restore someone before they try it. Same 17-action
// dispatch on one route (was 18 — debt-check ["recharge debt"] is REMOVED
// entirely, not reworded, per an explicit "remove from PEP" instruction).
//
// First v2 upgrade for this tool. Given 17 actions on one route, wiring
// runOutputGuard's per-call fields/promise into each one individually would
// be disproportionate — this follows one-percenter.js's pattern instead:
// router.outputStandard='v2' (auto-prepends DEFTBRAIN_OUTPUT_STANDARD_V2 to
// every call's system prompt) + a single declarative outputGuard + a
// regex-only validateResult() walked over every action's parsed result
// before it's returned. The RULES array is drawn directly from the
// rewrite's own "REMOVE FROM PEP" list (burnout terminology, battery
// percentages, introvert/extrovert stereotypes, nervous-system claims,
// forced encouragement, restorative-vs-numbing binary, invented causal
// mechanisms) — the same "tool-specific equivalent" check the push gate
// (output-standard-audit.js) explicitly allows in place of the full guard.
// ════════════════════════════════════════════════════════════

router.outputStandard = 'v2';
router.outputGuard = {
  checks: ['validateResult'],
  note: 'No per-call runOutputGuard — 17 actions on one route makes per-call fields/promise construction disproportionate to the risk here (this tool never diagnoses a medical condition; the schema itself is the main safeguard). validateResult is a regex walk over every action\'s parsed JSON before it returns. Rule categories, drawn directly from the rewrite\'s own "REMOVE FROM PEP" list: burnout terminology (approaching/risk/pattern, "N weeks to burnout", the old "Burnout Radar" name); battery/energy-cost arithmetic framed as a measurement (percentages, "recharge debt"); introvert/extrovert drain-rate stereotypes and the hosting/presenting cost multipliers; nervous-system or "deep rest" physiological claims; forced encouragement/moralized productivity ("you\'re not failing", "that\'s strength", "it\'s math"); the restorative-vs-numbing binary; and an invented causal mechanism for why an activity worked, including the ordinal-rating-as-quantity error ("nearly doubled your energy"). Schema removal is the primary fix (no more status enum, no more battery/energy_type fields, no debt-check action at all) — these regexes are the backstop for a free-text field smuggling the same claim back in.',
};

// A generic recursive walk, same shape as one-percenter.js's validateResult:
// blank a matched leaf string (capped so a long paragraph containing an
// incidental match isn't nuked wholesale), then prune emptied array items.
const RULES = [
  ['burnout prediction or terminology',
    /\bburnout (?:approaching|risk|pattern|warning)\b|\btime[- ]until[- ]burnout\b|\b\d+(?:-\d+)? weeks? to burnout\b|\bheading toward burnout\b|\bburnout radar\b/i],
  ['battery or energy-cost arithmetic framed as a measurement',
    /\bbattery (?:drops?|falls?|remaining|percentage|drain(?:s|ed)?)\b|\benergy cost (?:percentage|of \d+%)\b|\b\d+% (?:of your )?energy\b|\brecharge debt\b|\benergy debt\b/i],
  ['introvert/extrovert energy stereotype',
    /\bintroverts? drain(?:s)? faster\b|\bextroverts? drain(?:s)? from isolation\b|\bhosting costs? (?:~)?2x\b|\bpresenting costs? (?:~)?1\.5x\b/i],
  ['nervous-system or deep-rest physiological claim',
    /\bnervous system\b|\bresets? your (?:brain|body|nervous system)\b|\bdeep rest\b/i],
  ['forced encouragement or moralized productivity framing',
    /\byou'?re not failing\b|\bthat'?s strength\b|\bthis isn'?t laziness\b|\bit'?s math\b/i],
  ['restorative-vs-numbing binary classification',
    /\bnumbing traps?\b|\brestorative vs\.? numbing\b|\bpleasure vs\.? numbing\b/i],
  ['invented causal mechanism or ordinal-rating-as-quantity error',
    /\bthis (?:activity )?restored you\b|\bnearly doubled your energy\b|\bthis increased your energy\b/i],
  ['generic medical or medication instruction',
    /\bnon-negotiable regardless of time zone\b|\bset an alarm for every dose\b|\btake it at \d/i],
];

function validateResult(data) {
  if (!data || typeof data !== 'object') return data;
  const walk = (node) => {
    if (!node || typeof node !== 'object') return;
    for (const [k, v] of Object.entries(node)) {
      if (typeof v === 'string') {
        const hit = RULES.find(([, re]) => re.test(v));
        if (hit) {
          if (v.length <= 260 && (v.match(/[.!?]/g) || []).length <= 2) {
            console.log(`[pep] ${k} blanked — ${hit[0]}: ${v.slice(0, 200)}`);
            node[k] = '';
          } else {
            console.log(`[pep] ${k} ${hit[0]} (left intact, too long to cut safely): ${v.slice(0, 200)}`);
          }
        }
      } else if (v && typeof v === 'object') walk(v);
    }
  };
  walk(data);
  const prune = (node) => {
    if (Array.isArray(node)) {
      for (let i = node.length - 1; i >= 0; i--) {
        if (node[i] === '') node.splice(i, 1); else prune(node[i]);
      }
      return;
    }
    if (node && typeof node === 'object') Object.values(node).forEach(prune);
  };
  prune(data);
  return data;
}

// ── Shared identity/epistemic discipline, sent as `system` on every call. ──
const SHARED_PROMPT = `PEP — PERSONAL ENERGY PLANNER

Apply DEFTBRAIN_OUTPUT_STANDARD_V2.

CORE PURPOSE

PEP helps someone make practical choices when their available energy matters.

It can:
- suggest something manageable to do right now
- help prioritize tasks against self-reported capacity
- help prepare for a demanding schedule
- compare repeated self-reported check-ins
- adapt a routine during a disruption
- learn from activities the visitor has actually tried and rated

PEP does NOT measure a biological energy reserve.
PEP does NOT diagnose fatigue, burnout, depression, anxiety, illness, nervous-system
states, sleep problems, or any other medical or psychological condition.
PEP does NOT predict future energy levels.
PEP does NOT know what will restore someone before they try it.

The visitor's energy rating is a SELF-REPORT, not a physiological measurement.

Treat it as:

"How much capacity do you feel you have right now?"

not:

"How much energy does your body objectively have?"

NORTH STAR

Turn:

"I don't have much in me today."

into:

"Okay. Given what you told me, here's what I'd do with the capacity you have."

VOICE

Write directly to the visitor as "you."

Be:
- practical
- calm
- economical
- warm without becoming therapeutic
- willing to recommend doing less
- specific enough to act on

Do not:
- diagnose
- psychoanalyze
- infantilize
- moralize productivity
- praise ordinary self-care as bravery
- manufacture reassurance
- tell the visitor what their body or nervous system is "asking for"
- promise that an activity will make them feel better

EPISTEMIC MODEL

Every personalized statement must fall into one of these categories:

1. REPORTED — the visitor explicitly supplied it.
2. OBSERVED — it appears directly in their stored logs or ratings.
3. REASONABLE PLANNING INFERENCE — a practical conclusion useful for planning that
   follows from the supplied information.
4. UNKNOWN — anything not established.

Never promote #3 or #4 into a personal fact.

EXAMPLES

USER: "I have 15 minutes, energy 2/10, I'm home."

GOOD: "With only 15 minutes and very little self-reported energy, I'd keep this
extremely simple."

BAD: "You're running on fumes."
BAD: "Your nervous system needs recovery."
BAD: "Your body is telling you to stop."
BAD: "You're approaching burnout."

SELF-REPORTED MOODS

Mood selections such as stressed, sad, anxious, restless, overstimulated, bored, or
numb are visitor descriptions. They may affect the practical characteristics of a
suggestion. They do NOT establish a disorder, a cause, emotional overload,
nervous-system dysregulation, avoidance, decision paralysis, or a need for a
particular therapeutic technique. Do not intensify the visitor's wording.

HEALTH BOUNDARY

PEP is an everyday planning tool, not a health-management tool.

Do not: give medication schedules; alter medication timing; characterize medication
as "non-negotiable"; advise sleeping whenever/wherever possible; prescribe hydration,
calories, nutrition, exercise, breathing techniques, or medical routines as
treatment; interpret physical symptoms; infer medical significance from fatigue or
low ratings.

If the visitor explicitly identifies medication, medical care, or another health
requirement as something that must happen, preserve it as a constraint:

GOOD: "Keep any medical requirements you identified in the plan."

Do not add medical instructions. If symptoms described appear potentially urgent,
recommend appropriate professional or emergency help rather than trying to solve
them through PEP.

${NO_QUOTE_RULE}`;

router.post('/pep', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  const { action } = req.body;

  try {
    switch (action || 'generate') {

      // ╔══════════════════════════════════════════════╗
      // ║  RIGHT NOW — was "recharge"                  ║
      // ╚══════════════════════════════════════════════╝

      case 'generate': {
        const { energy, time_available, context, time_of_day, mood, environment, already_tried, curated_menu, userLanguage } = req.body;

        const prompt = `PEP — RIGHT NOW

Suggest a small number of activities that are realistically compatible with the
visitor's self-reported capacity, available time, location, mood, constraints, and
prior preferences.

The purpose is not to "restore" the visitor. The purpose is to offer manageable
things they might reasonably want to try.

ENERGY: ${energy || 5}/10
TIME AVAILABLE: ${time_available || 'flexible'}
TIME OF DAY: ${time_of_day || 'unknown'}
MOOD: ${mood || 'not specified'}
LOCATION: ${environment || 'not specified'}
ANYTHING THAT WOULD HELP CHOOSE: "${context || 'not specified'}"
${already_tried?.length ? `ALREADY SUGGESTED THIS SESSION (don't repeat): ${already_tried.join(', ')}` : ''}
${curated_menu?.length ? `THEIR SAVED MENU: ${curated_menu.map(a => a.name).join(', ')}` : ''}

RULES

1. Low self-reported energy means lower demand: fewer steps, less setup, less
physical effort, fewer transitions, less decision-making.

2. Do not assume an activity will restore energy, reduce stress, calm the nervous
system, improve mood, improve circulation, relax muscles, reduce eye strain,
improve sleep, provide "deep rest," or reset anything.

3. Explain FIT, not predicted BENEFIT.

GOOD: "You're home, have 15 minutes, and rated your energy 2/10, so this asks very
little of you."
BAD: "This will calm your nervous system and restore your depleted energy."

4. Ordinary suggestions are welcome — sit somewhere comfortable, listen to
something, step outside, make a drink, shower, read, doodle, stretch if
comfortable, do nothing for a while, complete one tiny task, contact someone,
engage with a hobby. Do not medicalize ordinary activities.

5. Do not classify activities as "restorative" versus "numbing." Scrolling,
television, games, reading, music, lying down, conversation, food, exercise, and
solitude do not have universal psychological meanings. The visitor's own experience
determines whether something was useful.

6. Saved activities and prior ratings are valuable evidence. If an activity has
repeatedly received favorable ratings from this visitor under similar
circumstances, prefer it and say why: "You've rated this well twice before when
your energy was low." Leave from_your_history empty if nothing in their history is
actually relevant here — never invent a match.

7. Do not call anything the "highest-return," "best reset," or objectively optimal
choice. top_pick means: "My best practical suggestion from what you've told me."

8. Duration should describe the activity, not promise when an effect will occur.

9. Do not predict how the visitor will feel afterward. done_when is a concrete
stopping point, never a predicted feeling.

10. Fewer suggestions are better when capacity is low.

Return ONLY valid JSON:
{
  "read": "1-2 sentences of practical reflection using only supplied information.",
  "top_pick": {
    "activity": "The single best option for their exact state right now.",
    "why_it_fits": "Explains fit against what was supplied — never a predicted benefit.",
    "first_step": "The literal first physical action. e.g. 'Stand up and walk to the kitchen.'",
    "duration": "How long.",
    "done_when": "A concrete stopping point — never a predicted feeling."
  },
  "other_options": [
    { "activity": "...", "why_it_fits": "...", "duration": "..." }
  ],
  "from_your_history": {
    "activity": "Only when relevant history exists — otherwise leave both fields empty.",
    "evidence": "What their own prior rating(s) actually showed."
  }
}

2-4 other_options — fewer when capacity is low, never padded to hit a count.
Keep every field to one concise sentence.`;

        const parsed = await callClaudeWithRetry({
          model: MODELS.SMART,
          max_tokens: 3000,
          system: withLanguage(SHARED_PROMPT, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
          messages: [{ role: 'user', content: prompt }],
        }, { label: 'PEP-RightNow' });
        if (!parsed.read) {
          return res.status(500).json({ error: 'Could not generate suggestions. Please try again.' });
        }
        return res.json(validateResult(parsed));
      }

      // ────────────────────────────────────────────
      // JUST DO THIS — one suggestion, no menu
      // ────────────────────────────────────────────
      case 'just-do-this': {
        const { energy, time_of_day, mood, environment, curated_menu, already_tried, userLanguage } = req.body;

        const prompt = `PEP — JUST DO THIS

The visitor wants ONE suggestion instead of a menu to choose from — not because
anything is wrong with them, but because right now a menu itself is unwanted
overhead. Give them one thing. No options, no ranking of alternatives.

ENERGY: ${energy || 5}/10
TIME OF DAY: ${time_of_day || 'unknown'}
MOOD: ${mood || 'not specified'}
LOCATION: ${environment || 'not specified'}
${curated_menu?.length ? `THEIR MENU (prefer from this): ${curated_menu.map(a => a.name).join(', ')}` : ''}
${already_tried?.length ? `ALREADY SUGGESTED THIS SESSION: ${already_tried.join(', ')}` : ''}

Explain fit, not predicted benefit — same discipline as PEP — RIGHT NOW. done_when
is a concrete stopping point, never a predicted feeling.

Return ONLY valid JSON:
{
  "activity": "The one thing. Specific and concrete.",
  "first_move": "The literal first physical action. 'Stand up.' or 'Open the drawer.'",
  "why_it_fits": "One sentence: why this fits what was supplied.",
  "duration": "How long.",
  "done_when": "A concrete stopping point."
}`;

        const parsed = await callClaudeWithRetry({
          model: MODELS.SMART,
          max_tokens: 2000,
          system: withLanguage(SHARED_PROMPT, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
          messages: [{ role: 'user', content: prompt }],
        }, { label: 'PEP-JustDo' });
        if (!parsed.activity) {
          return res.status(500).json({ error: 'Could not generate a suggestion. Please try again.' });
        }
        return res.json(validateResult(parsed));
      }

      // ────────────────────────────────────────────
      // BUILD MENU — AI suggests additions to a saved menu
      // ────────────────────────────────────────────
      case 'build-menu': {
        const { interests, existing_menu, environment, shared, userLanguage } = req.body;

        const prompt = `Suggest activities to add to someone's ${shared ? 'shared/partner' : 'personal'} menu.

INTERESTS: "${interests || 'not specified'}"
LOCATION: ${environment || 'any'}
${existing_menu?.length ? `ALREADY ON MENU (don't repeat): ${existing_menu.map(a => a.name).join(', ')}` : ''}

Suggest 4-6 activities, specific rather than generic. energy_min/energy_max
describe the activity's own typical requirement, not a claim about this visitor.

Return ONLY valid JSON:
{
  "menu_balance_note": "Brief note on what's missing or overrepresented, or empty if nothing stands out.",
  "suggestions": [
    { "activity": "...", "why_add": "Why this belongs on their menu.", "duration": "...", "energy_min": 1, "energy_max": 10, "environments": ["home", "office", "outdoors", "commuting", "in_bed"] }
  ]
}`;

        const parsed = await callClaudeWithRetry({
          model: MODELS.SMART,
          max_tokens: 2500,
          system: withLanguage(SHARED_PROMPT, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
          messages: [{ role: 'user', content: prompt }],
        }, { label: 'PEP-BuildMenu' });
        if (!Array.isArray(parsed.suggestions)) {
          return res.status(500).json({ error: 'Could not generate suggestions. Please try again.' });
        }
        return res.json(validateResult(parsed));
      }

      // ────────────────────────────────────────────
      // SWAP — alternatives when suggestions didn't fit
      // ────────────────────────────────────────────
      case 'swap': {
        const { rejected_activities, energy, time_available, reason, mood, environment, userLanguage } = req.body;

        const prompt = `Someone didn't want these suggestions: ${(rejected_activities || []).join(', ')}. Offer
alternatives that feel different — do not repeat the practical reasoning that
already didn't land.

ENERGY: ${energy || 5}/10, TIME: ${time_available || 'flexible'}, MOOD: ${mood || 'not specified'}, LOCATION: ${environment || 'not specified'}
REASON GIVEN: "${reason || 'not specified'}"

Return ONLY valid JSON:
{
  "read": "Brief acknowledgment — grounded in what was actually said, not invented.",
  "alternatives": [{ "activity": "...", "why_different": "How this differs from what was rejected.", "duration": "..." }],
  "wildcard": { "activity": "Something less expected but still genuinely compatible.", "why": "..." }
}

Write every field with precision — no filler, no restating what was asked.`;

        const parsed = await callClaudeWithRetry({
          model: MODELS.SMART,
          max_tokens: 2000,
          system: withLanguage(SHARED_PROMPT, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
          messages: [{ role: 'user', content: prompt }],
        }, { label: 'PEP-Swap' });
        if (!parsed.read) {
          return res.status(500).json({ error: 'Could not generate alternatives. Please try again.' });
        }
        return res.json(validateResult(parsed));
      }

      // ────────────────────────────────────────────
      // ACTIVITY REFLECTION — "How did that go?"
      // ────────────────────────────────────────────
      case 'rate-activity': {
        const { activity, helpful_rating, energy_before, energy_after, note, memory_note, history, userLanguage } = req.body;

        const prompt = `PEP — ACTIVITY REFLECTION

Reflect only on what the visitor recorded.

ACTIVITY: "${activity}"
HELPFUL RATING: ${helpful_rating}/10
ENERGY: ${energy_before}/10 → ${energy_after}/10
ANYTHING NOTICED: "${note || 'none'}"
SOMETHING TO REMEMBER: "${memory_note || 'none'}"
${history?.length ? `RECENT HISTORY: ${history.slice(0, 5).map(h => `${h.activity}: ${h.rating}/10`).join(', ')}` : ''}

You may calculate numerical differences.

Example: energy before 3, energy after 6.
GOOD: "You rated your energy 3 points higher afterward."
Do not say: "This nearly doubled your energy." The 1-10 scale is ordinal
self-report, not a measurable quantity where 6 represents twice as much
biological energy as 3.

Do not infer causation from one before/after observation.
GOOD: "Your rating was higher afterward."
BAD: "Lying down increased your energy." BAD: "This activity restored you."

One favorable attempt is evidence the activity may be worth trying again — not
evidence it reliably works. Use repeated history carefully: ONE TRY → "You rated
this highly once." REPEATED SIMILAR RESULT → "This has gone well for you several
times." MIXED RESULT → "Your ratings for this have varied."

Do not manufacture mechanisms explaining why an activity worked. Do not
automatically suggest sensory or therapeutic techniques.

Return ONLY valid JSON:
{
  "reflection": "1-2 sentences reflecting only what was reported.",
  "pattern_note": "Only if their history actually reveals something — otherwise empty."
}`;

        const parsed = await callClaudeWithRetry({
          model: MODELS.SMART,
          max_tokens: 1500,
          system: withLanguage(SHARED_PROMPT, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
          messages: [{ role: 'user', content: prompt }],
        }, { label: 'PEP-Reflect' });
        if (!parsed.reflection) {
          return res.status(500).json({ error: 'Could not generate a reflection. Please try again.' });
        }
        return res.json(validateResult(parsed));
      }

      // ────────────────────────────────────────────
      // ENERGY MATCH — from saved menu
      // ────────────────────────────────────────────
      case 'energy-match': {
        const { energy, time_available, curated_menu, mood, environment, userLanguage } = req.body;

        const prompt = `Match activities from this person's saved menu to their current state.

ENERGY: ${energy}/10, TIME: ${time_available || 'flexible'}, MOOD: ${mood || 'not specified'}, LOCATION: ${environment || 'not specified'}
THEIR MENU (with real observed history where it exists): ${JSON.stringify((curated_menu || []).map(a => ({ name: a.name, times_tried: a.times_tried || 0, avg_rating: a.avg_rating ?? null, energy_before_range: a.energy_before_range || null })))}

Rank up to 3-5 from their menu. Prefer what their own history actually supports —
never invent history that isn't there.

Return ONLY valid JSON:
{
  "matched": [{ "rank": 1, "activity": "...", "why_now": "Why this fits right now — cite real history only if it exists." }],
  "gap_note": "Is their menu missing something for this state? Or empty if not."
}`;

        const parsed = await callClaudeWithRetry({
          model: MODELS.SMART,
          max_tokens: 2000,
          system: withLanguage(SHARED_PROMPT, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
          messages: [{ role: 'user', content: prompt }],
        }, { label: 'PEP-Match' });
        if (!Array.isArray(parsed.matched)) {
          return res.status(500).json({ error: 'Could not match activities. Please try again.' });
        }
        return res.json(validateResult(parsed));
      }

      // ────────────────────────────────────────────
      // PATTERN CHECK — descriptive-only observations for My Menu
      // ────────────────────────────────────────────
      case 'pattern-check': {
        const { activity_log, userLanguage } = req.body;

        const prompt = `Describe only relationships actually visible in this activity log — do not
classify activities as restorative versus numbing, and do not name a "top"
performer as though it were objectively best.

LOG (most recent first): ${JSON.stringify((activity_log || []).slice(0, 20).map(a => ({ activity: a.activity, rating: a.rating, energy_before: a.energy_before, energy_after: a.energy_after, mood: a.mood, date: a.date })))}

GOOD: "You've tried this four times. Three were rated 7/10 or higher."
GOOD: "You've tended to choose this when your starting energy was 2-4/10."
GOOD: "Your ratings for this have been mixed."
BAD: "This is your most effective nervous-system reset." BAD: "This reliably gives
you +3 energy." BAD: "This works best when you're anxious" — unless the log
actually, repeatedly supports that specific association.

If the log is too sparse to say anything useful, say so plainly instead of forcing
an observation.

Return ONLY valid JSON:
{
  "summary": "1-2 sentences, purely descriptive.",
  "notable_patterns": [{ "activity": "...", "observation": "A descriptive observation the log actually supports." }],
  "not_enough_data": ["Anything the log is too sparse to say anything about yet."]
}`;

        const parsed = await callClaudeWithRetry({
          model: MODELS.SMART,
          max_tokens: 2000,
          system: withLanguage(SHARED_PROMPT, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
          messages: [{ role: 'user', content: prompt }],
        }, { label: 'PEP-Patterns' });
        if (!parsed.summary) {
          return res.status(500).json({ error: 'Could not analyze your log. Please try again.' });
        }
        return res.json(validateResult(parsed));
      }

      // ────────────────────────────────────────────
      // ACCOUNTABILITY NUDGE
      // ────────────────────────────────────────────
      case 'accountability-nudge': {
        const { activity, userLanguage } = req.body;

        const prompt = `Write a short, warm message inviting someone to do "${activity}" together. 2-3
sentences, casual, no pressure.

Return ONLY valid JSON:
{ "message": "The invitation message." }`;

        const parsed = await callClaudeWithRetry({
          model: MODELS.SMART,
          max_tokens: 1000,
          system: withLanguage(SHARED_PROMPT, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
          messages: [{ role: 'user', content: prompt }],
        }, { label: 'PEP-Nudge' });
        if (!parsed.message) {
          return res.status(500).json({ error: 'Could not write a message. Please try again.' });
        }
        return res.json(validateResult(parsed));
      }

      // ────────────────────────────────────────────
      // RECHARGE INSIGHTS — descriptive dashboard
      // ────────────────────────────────────────────
      case 'recharge-insights': {
        const { activity_log, curated_menu, userLanguage } = req.body;

        const prompt = `Summarize this activity log descriptively. Do not calculate a fake "restoration
power," and do not call anything the objectively "best" option — most_tried_activity
is a count, not a quality ranking.

LOG: ${JSON.stringify((activity_log || []).slice(0, 25).map(a => ({ activity: a.activity, rating: a.rating, energy_before: a.energy_before, energy_after: a.energy_after, mood: a.mood, date: a.date })))}
${curated_menu?.length ? `MENU: ${curated_menu.map(a => a.name).join(', ')}` : ''}

Return ONLY valid JSON:
{
  "dashboard": { "avg_rating": "X/10", "total_sessions": 0, "most_tried_activity": "The activity logged most often, or empty if too few sessions to say." },
  "trend": "Descriptive only — what the numbers look like over time, not a diagnosis.",
  "trend_detail": "1-2 sentences, grounded only in what the log shows."
}`;

        const parsed = await callClaudeWithRetry({
          model: MODELS.SMART,
          max_tokens: 1500,
          system: withLanguage(SHARED_PROMPT, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
          messages: [{ role: 'user', content: prompt }],
        }, { label: 'PEP-Insights' });
        if (!parsed.dashboard) {
          return res.status(500).json({ error: 'Could not generate insights. Please try again.' });
        }
        return res.json(validateResult(parsed));
      }

      // ────────────────────────────────────────────
      // BUILD A SHORT PLAN — practical sequence, not an emotional arc
      // ────────────────────────────────────────────
      case 'build-sequence': {
        const { energy, time_available, mood, environment, curated_menu, userLanguage } = req.body;

        const prompt = `PEP — BUILD A SHORT PLAN

Create a small sequence of compatible activities that fits the visitor's available
time, location, self-reported capacity, mood, and saved preferences/history.

This is a PRACTICAL SEQUENCE, not a therapeutic or physiological progression. Do
not design an emotional arc, nervous-system arc, regulation sequence, recovery
protocol, or grounding protocol. Do not claim one step prepares the body or mind
for another. Sequence activities for practical reasons only — easiest transition,
location, setup, time, visitor preference, logical order.

ENERGY: ${energy}/10, TIME: ${time_available || '30 minutes'}, MOOD: ${mood || 'not specified'}, LOCATION: ${environment || 'home'}
${curated_menu?.length ? `PREFER FROM MENU: ${curated_menu.map(a => a.name).join(', ')}` : ''}

2-4 steps is usually enough. The visitor may stop after any step — partial
completion is valid. Do not imply completing the sequence produces a particular
state.

Return ONLY valid JSON:
{
  "plan_name": "Short, plain name — not an evocative or emotional one.",
  "total_time": "~Xm",
  "steps": [
    { "step": 1, "activity": "...", "duration": "...", "why_this_order": "A practical reason for this position in the sequence — never an emotional or physiological one." }
  ]
}`;

        const parsed = await callClaudeWithRetry({
          model: MODELS.SMART,
          max_tokens: 2000,
          system: withLanguage(SHARED_PROMPT, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
          messages: [{ role: 'user', content: prompt }],
        }, { label: 'PEP-Sequence' });
        if (!parsed.plan_name) {
          return res.status(500).json({ error: 'Could not build a plan. Please try again.' });
        }
        return res.json(validateResult(parsed));
      }

      // ────────────────────────────────────────────
      // SCHEDULE CHECKIN
      // ────────────────────────────────────────────
      case 'schedule-checkin': {
        const { checkin_time, current_energy, current_mood, current_activity, userLanguage } = req.body;

        const prompt = `Prepare a check-in reminder for ${checkin_time}. Current energy: ${current_energy || '?'}/10, mood: ${current_mood || 'not specified'}, currently doing: "${current_activity || 'not specified'}".

Return ONLY valid JSON:
{
  "prep_tip": "One practical sentence to help them prepare.",
  "reminder_message": "The check-in message they'll see.",
  "suggested_activity": { "activity": "...", "why_it_fits": "...", "duration": "..." }
}`;

        const parsed = await callClaudeWithRetry({
          model: MODELS.SMART,
          max_tokens: 1000,
          system: withLanguage(SHARED_PROMPT, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
          messages: [{ role: 'user', content: prompt }],
        }, { label: 'PEP-Checkin' });
        if (!parsed.prep_tip) {
          return res.status(500).json({ error: 'Could not schedule a check-in. Please try again.' });
        }
        return res.json(validateResult(parsed));
      }

      // ╔══════════════════════════════════════════════╗
      // ║  PRIORITIZE — was "budget"                   ║
      // ╚══════════════════════════════════════════════╝

      case 'budget': {
        const { tasks, available_energy, mood, userLanguage } = req.body;

        if (!tasks?.length) {
          return res.status(400).json({ error: 'Add at least one task.' });
        }

        const taskList = tasks.map((t, i) =>
          `${i + 1}. "${t.task}" — self-rated demand: ${t.cost}/10 — priority the visitor gave it: ${t.priority || 'optional'}`
        ).join('\n');

        const prompt = `PEP — PRIORITIZE

The visitor has supplied a self-rated capacity from 1-10, tasks, a self-rated
demand for each task, and a priority label. These numbers are ORDINAL PLANNING
SIGNALS. Do not add task demands together — a 6/10 task plus a 4/10 task does not
equal 10 units of energy, and the visitor's available-capacity rating is not a
numerical pool task demands subtract from. Use the ratings comparatively.

AVAILABLE CAPACITY: ${available_energy || 10}/10
MOOD: ${mood || 'not specified'}

TASKS:
${taskList}

Ask: which tasks are genuinely required? Which important tasks could be made
smaller? Which optional tasks can wait? Which demanding tasks shouldn't be stacked
unnecessarily? Is there an easier sequence? Does the visitor appear to be asking
more of themselves than their own capacity rating suggests is comfortable?

"Required" means the visitor marked it required — do not independently decide that.
A visitor may have mislabeled something, or circumstances may change, and PEP does
not know the consequences. Prefer: "You marked this required, so I'd protect it
unless you know it can move," never "Required tasks must happen."

Do not automatically recommend sleep, food, hydration, hygiene, exercise, or
medical care unless the visitor's own supplied information makes that relevant. Do
not tell the visitor what tomorrow's energy will be. Do not say "This isn't
laziness — it's math" — it is not math, it is prioritization under self-reported
limited capacity.

Return ONLY valid JSON:
{
  "read": "1-2 sentences, honest, grounded only in what was supplied.",
  "protect": [{ "task": "...", "why": "...", "make_it_easier": "A way to make this specific task lighter, or empty if it doesn't need one." }],
  "consider_next": ["Tasks worth doing if capacity allows, in no particular urgency."],
  "postpone_or_drop": [{ "task": "...", "reason": "..." }],
  "sequence": ["A suggested order, only if genuinely useful — otherwise empty."],
  "one_decision": "The single most useful decision to make right now."
}`;

        const parsed = await callClaudeWithRetry({
          model: MODELS.SMART,
          max_tokens: 2500,
          system: withLanguage(SHARED_PROMPT, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
          messages: [{ role: 'user', content: prompt }],
        }, { label: 'PEP-Prioritize' });
        if (!parsed.read) {
          return res.status(500).json({ error: 'Could not prioritize your tasks. Please try again.' });
        }
        return res.json(validateResult(parsed));
      }

      // ╔══════════════════════════════════════════════╗
      // ║  WEEK — was "forecast"                       ║
      // ╚══════════════════════════════════════════════╝

      case 'forecast': {
        const { events, demanding_factors, what_helps, starting_capacity, activity_log, userLanguage } = req.body;

        if (!events?.length) {
          return res.status(400).json({ error: 'Add at least one commitment.' });
        }

        const eventList = events.map((ev, i) =>
          `${i + 1}. "${ev.name}" — ${ev.day || 'TBD'} ${ev.time || ''}, ${ev.duration || 'unspecified duration'}${ev.canLeave === false ? ', cannot leave early' : ''}`
        ).join('\n');

        const historyHint = activity_log?.length > 3
          ? `\nRECENT SELF-REPORTED ENERGY (their own log, most recent first): ${activity_log.slice(0, 10).map(a => a.energy_before).filter(v => v != null).join(', ')}`
          : '';

        const prompt = `PEP — WEEK

Help the visitor inspect the shape of their upcoming commitments. THIS IS NOT AN
ENERGY FORECAST. Do not calculate energy-cost percentages, battery remaining,
burnout thresholds, recharge-hour requirements, capacity percentages, probability
of exhaustion, or predicted recovery time. Do not use introvert/extrovert
stereotypes. Do not assume crowds drain the visitor, solitude restores the visitor,
unfamiliar people cost more, hosting costs twice attending, presenting costs 1.5x
attending, or large groups are inherently draining.

STARTING CAPACITY THIS WEEK: ${starting_capacity || 'not specified'}/10
WHAT TENDS TO MAKE A COMMITMENT MORE DEMANDING FOR THEM: ${demanding_factors?.length ? demanding_factors.join(', ') : 'not specified'}
WHAT TENDS TO HELP AROUND BUSY DAYS: "${what_helps || 'not specified'}"${historyHint}

UPCOMING COMMITMENTS:
${eventList}

Use only visitor-supplied demand preferences and obvious schedule structure. You
MAY identify objective schedule characteristics:

GOOD: "You have three commitments on Thursday." GOOD: "Wednesday's event ends at 9
and Thursday's begins at 8, based on the times you entered." GOOD: "You marked
hosting and back-to-back commitments as especially demanding, and both occur
Friday." GOOD: "Tuesday and Wednesday are the most crowded part of the schedule you
entered."

Do not convert those facts into predicted internal states: BAD: "Your battery will
fall to 18%." BAD: "Friday is a burnout-risk day." BAD: "You'll need six hours
alone afterward."

Recommendations should create OPTIONS: protect unscheduled time, shorten something
if possible, avoid adding another commitment, prepare something beforehand,
identify an event that could be optional, leave early if the visitor indicated
that's possible, move a flexible task, preserve a personally useful activity from
their history. If history is relevant, you may say a past activity "worked well
after similarly busy days" — never that it will restore them this time.

Return ONLY valid JSON:
{
  "week_shape": "1-2 sentences describing the shape of the week — observable structure, not a prediction of how the visitor will feel.",
  "demanding_stretches": [{ "when": "...", "what_makes_it_notable": "Grounded in schedule structure or the visitor's own stated demanding factors — never invented." }],
  "breathing_room": [{ "when": "...", "option": "A concrete option, not a command." }],
  "commitments_to_reconsider": ["Only commitments the visitor's own supplied information makes worth reconsidering."],
  "from_your_history": "Only if genuinely relevant — otherwise empty.",
  "one_move_now": "The single most useful thing to consider doing about this week."
}`;

        const parsed = await callClaudeWithRetry({
          model: MODELS.SMART,
          max_tokens: 3000,
          system: withLanguage(SHARED_PROMPT, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
          messages: [{ role: 'user', content: prompt }],
        }, { label: 'PEP-Week' });
        if (!Array.isArray(parsed.demanding_stretches)) {
          return res.status(500).json({ error: 'Could not look at your week. Please try again.' });
        }
        return res.json(validateResult(parsed));
      }

      // ────────────────────────────────────────────
      // DECLINE MESSAGE
      // ────────────────────────────────────────────
      case 'decline-message': {
        const { event_name, reason, relationship, userLanguage } = req.body;

        const prompt = `Write a polite decline message for "${event_name || 'this event'}".
REASON: ${reason || 'at capacity'}
RELATIONSHIP: ${relationship || 'friend'}

Return ONLY valid JSON:
{
  "message": "The full decline message. Warm, honest, no over-explaining.",
  "alternative_offer": "A smaller alternative to suggest, or empty."
}`;

        const parsed = await callClaudeWithRetry({
          model: MODELS.SMART,
          max_tokens: 1000,
          system: withLanguage(SHARED_PROMPT, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
          messages: [{ role: 'user', content: prompt }],
        }, { label: 'PEP-Decline' });
        if (!parsed.message) {
          return res.status(500).json({ error: 'Could not draft a message. Please try again.' });
        }
        return res.json(validateResult(parsed));
      }

      // ╔══════════════════════════════════════════════╗
      // ║  PATTERNS — was "radar" (Burnout Radar)      ║
      // ╚══════════════════════════════════════════════╝

      case 'radar-checkin': {
        // Wire/storage field names stay `productivity`/`social_energy`/
        // `physical_symptoms` (unchanged since v1) so existing checkinLog
        // history keeps working — only the human-readable LABEL changes to
        // "Focus / getting things done", per the explicit request to make
        // the label less evaluative, not the underlying data model.
        const { sleep, mood, productivity, social_energy, physical_symptoms, checkin_history, userLanguage } = req.body;

        const historyContext = checkin_history?.length > 0
          ? `\nRECENT CHECK-INS (last ${Math.min(checkin_history.length, 7)} days): ${checkin_history.slice(0, 7).map(c => `${c.date?.slice(0, 10)}: sleep=${c.sleep} mood=${c.mood} focus=${c.productivity} social=${c.social_energy}`).join('; ')}`
          : '';

        const prompt = `PEP — PATTERNS: DAILY CHECK-IN

Summarize today's self-report and compare it with prior entries only when enough
data exists. DO NOT DIAGNOSE OR PREDICT BURNOUT. Do not use green/yellow/orange/red
health-style risk classifications, and do not output "all clear," "early warning,"
"burnout approaching," "burnout risk," "time until burnout," "danger," "critical,"
or "intervention." A single day's ratings do not establish that the day was flat,
restful, healthy, unhealthy, draining, energizing, or "a rest day in disguise" —
the visitor supplied ratings, not the meaning of the day.

TODAY:
- Sleep: ${sleep || '?'}/5
- Mood: ${mood || '?'}/5
- Focus / getting things done: ${productivity || '?'}/5
- Social capacity: ${social_energy || '?'}/5
- Anything physical noted: "${physical_symptoms || 'none'}"
${historyContext}

Simply report what stands out descriptively. Example: "All four ratings are 3/5
today, and you didn't note anything physical." That may be the entire result — do
not force insight where none exists. Compare with recent history only if a real
pattern is visible (see PATTERNS: HISTORY rules below); three consecutive lower
entries may justify "three consecutive lower entries" and nothing stronger.

Return ONLY valid JSON:
{
  "today": "Descriptive summary of today's numbers — may be the whole result.",
  "what_changed": ["Only genuine changes from recent entries — otherwise empty."],
  "possible_patterns": [{ "observation": "...", "evidence": "The specific data points behind it.", "strength": "worth_noticing|possible|too_little_data" }],
  "not_enough_to_tell": ["Anything there isn't enough data to say yet."],
  "worth_watching": ["Only if something concrete is worth watching — otherwise empty."],
  "optional_next_step": "Only if genuinely useful — otherwise empty."
}`;

        const parsed = await callClaudeWithRetry({
          model: MODELS.SMART,
          max_tokens: 1500,
          system: withLanguage(SHARED_PROMPT, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
          messages: [{ role: 'user', content: prompt }],
        }, { label: 'PEP-PatternsCheckin' });
        if (!parsed.today) {
          return res.status(500).json({ error: 'Could not process your check-in. Please try again.' });
        }
        return res.json(validateResult(parsed));
      }

      case 'radar-analyze': {
        const { checkin_log, userLanguage } = req.body;

        if (!checkin_log?.length || checkin_log.length < 5) {
          return res.status(400).json({ error: 'Need at least 5 daily check-ins to look for patterns.' });
        }

        const prompt = `PEP — PATTERNS: HISTORY

Analyze only relationships visible in the visitor's recorded data. Use OBSERVED,
POSSIBLE PATTERN, or TOO LITTLE DATA — never causal language unless causation is
actually established.

CHECK-IN LOG (most recent first): ${JSON.stringify(checkin_log.slice(0, 30), null, 2)}

GOOD: "Sleep and focus ratings moved in the same direction on four of the six
logged days." BAD: "Poor sleep is driving your focus decline." GOOD: "Your mood
rating has been lower for the last three entries." BAD: "You're heading toward
burnout." GOOD: "Worth watching if this continues." BAD: "1-2 weeks until
burnout."

Do not invent significance thresholds like "three declining days = burnout
pattern." Three days may justify saying "three consecutive lower entries" and
nothing more. Do not force correlations, weekly patterns, causes, interventions, or
bright spots — if data is insufficient for something, say so.

Return ONLY valid JSON:
{
  "today": "A brief summary of the most recent entry.",
  "what_changed": ["Genuine changes visible across the log."],
  "possible_patterns": [{ "observation": "...", "evidence": "The specific data points behind it.", "strength": "worth_noticing|possible|too_little_data" }],
  "not_enough_to_tell": ["Anything the log is too sparse to say yet."],
  "worth_watching": ["Concrete things worth watching, grounded in the actual data."],
  "optional_next_step": "Only if genuinely useful — otherwise empty."
}`;

        const parsed = await callClaudeWithRetry({
          model: MODELS.SMART,
          max_tokens: 2500,
          system: withLanguage(SHARED_PROMPT, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
          messages: [{ role: 'user', content: prompt }],
        }, { label: 'PEP-PatternsHistory' });
        if (!parsed.today) {
          return res.status(500).json({ error: 'Could not analyze your history. Please try again.' });
        }
        return res.json(validateResult(parsed));
      }

      // ╔══════════════════════════════════════════════╗
      // ║  ADAPT — was "disruption"                    ║
      // ╚══════════════════════════════════════════════╝

      case 'disruption': {
        const { disruption_type, normal_routine, constraints, critical_tasks, available_energy, duration_estimate, userLanguage } = req.body;

        if (!disruption_type) {
          return res.status(400).json({ error: 'What changed?' });
        }

        const prompt = `PEP — ADAPT

Help the visitor create a temporary routine based ONLY on what changed, what their
normal routine contains, what they explicitly say still matters, their
constraints, their self-reported capacity, and expected duration if supplied.

DO NOT FILL IN A GENERIC SURVIVAL ROUTINE. This is crucial. If the visitor leaves
NORMAL ROUTINE blank, do not invent exercise, meal planning, hygiene, communication
obligations, household chores, work, pet care, caregiving, medication, or sleep
routines. If MUST HAPPEN is blank, do not invent critical obligations. Absence of
information means UNKNOWN.

DISRUPTION LABELS DO NOT CREATE FACTS. TRAVEL does not establish unfamiliar
surroundings, a time-zone change, disrupted sleep, medication issues, poor food
access, or people depending on the visitor. SICK DAY does not establish a
diagnosis, severity, bed rest, hydration need, medication use, or inability to
work. TOUGH DAY does not establish an emotional crisis, burnout, anxiety,
depression, grief, or conflict. EMERGENCY does not establish what kind of
emergency occurred. Ask the supplied facts to do the work.

WHAT CHANGED: ${disruption_type}
NORMAL ROUTINE: "${normal_routine || 'not described'}"
CONSTRAINTS THAT ARE DIFFERENT RIGHT NOW: "${constraints || 'not specified'}"
WHAT STILL NEEDS ATTENTION: "${critical_tasks || 'not specified'}"
AVAILABLE ENERGY: ${available_energy || 'not specified'}/10
EXPECTED DURATION: "${duration_estimate || 'unknown'}"

For each routine item actually supplied, decide: KEEP (the visitor identified it as
necessary, or it clearly serves an explicitly stated constraint), LIGHTEN (a
smaller version could preserve what matters), or PAUSE (the visitor hasn't
identified it as necessary and pausing looks compatible with the facts supplied).
Never give "permission" as though PEP has authority over the visitor.

GOOD: "This looks like a reasonable candidate to pause."
BAD: "You have permission to drop this." BAD: "The dishes will wait. Dirty dishes
don't hurt anyone."

If the visitor says "I need to take my medication," PEP may say "Keep your
medication requirement in the temporary routine" — never a schedule, never "set an
alarm for every dose," never "non-negotiable regardless of time zone." PEP does not
manage medication.

Do not invent a recovery trigger. Use visitor-controlled reassessment: "Revisit
this temporary plan when the constraint changes or when your current routine
starts feeling workable again." If a health condition caused the disruption, do
not decide when the visitor is medically ready to resume activity.

Acknowledge only what is known. GOOD: "Your normal routine may not fit right now,
so let's build around what actually has to happen." BAD: "Travel pulls you out of
every rhythm you rely on." BAD: "Trying to hold yourself together in an unfamiliar
place is genuinely hard." Those are invented biography and emotional state.

Return ONLY valid JSON:
{
  "situation": "1-2 sentences acknowledging only what's known.",
  "keep": [{ "item": "...", "lighter_version": "A lighter version if one genuinely helps, or empty if no change is needed." }],
  "lighten": [{ "item": "...", "temporary_version": "The minimal version of this item." }],
  "pause": [{ "item": "...", "reason": "A reasonable-candidate framing, never a grant of permission." }],
  "temporary_shape": [{ "part_of_day": "...", "what_matters": "..." }],
  "unknowns": ["Things left genuinely unknown by what was supplied."],
  "reassess_when": "Visitor-controlled reassessment language.",
  "one_next_step": "The single next thing to do."
}`;

        const parsed = await callClaudeWithRetry({
          model: MODELS.SMART,
          max_tokens: 3000,
          system: withLanguage(SHARED_PROMPT, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
          messages: [{ role: 'user', content: prompt }],
        }, { label: 'PEP-Adapt' });
        if (!parsed.situation) {
          return res.status(500).json({ error: 'Could not build a temporary routine. Please try again.' });
        }
        return res.json(validateResult(parsed));
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }

  } catch (err) {
    console.error('PEP error:', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
