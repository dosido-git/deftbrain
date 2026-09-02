const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, withLanguage, withLocaleContext } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

const NO_QUOTE_RULE = 'Never place a double-quote (") character inside any JSON string value — write quoted phrases or cues plainly or with single quotes, or it breaks the JSON.';

// Same rule as CONTEXTS: the area they picked, not a cause we made up for it.
// "Tight hips" no longer arrives "from sitting", tension is no longer "and
// stress", and sore wrists are no longer attributed to typing.
const BODY_AREAS = {
  'stiff-neck': 'Stiff or tight neck and shoulders',
  'sore-back': 'Sore or tight lower back',
  'tight-hips': 'Tight hips',
  'restless-legs': 'Restless legs',
  'general-tension': 'General body tension',
  'just-blah': 'No specific area, just low energy',
  'wrists-hands': 'Sore wrists or hands',
  'stiff-all-over': 'Stiff all over'
};

// What the visitor actually selected, in words no stronger than the chip they
// tapped. These strings go straight into the prompt, so anything added here is
// something the model will faithfully repeat back as though the visitor had said
// it. "Emotional day" used to arrive as "Emotionally draining day (stress,
// anxiety, sadness, overwhelm)" — four feelings nobody reported.
const CONTEXTS = {
  'long-meeting': 'Just finished a long meeting or class',
  'bad-sleep': 'Says they slept badly',
  'screen-marathon': 'Has been looking at screens for hours',
  'emotional-day': 'Describes today as an emotional day',
  'ate-too-much': 'Says they ate too much',
  'hungover': 'Hungover',
  'travel-day': 'Has been travelling today (car, plane or train)',
  'period-cramps': 'Period cramps',
  'just-woke-up': 'Just woke up',
  'been-standing': 'Has been on their feet all day',
  'pre-event-nerves': 'Nervous about something coming up',
  'post-argument': 'After a difficult conversation or conflict'
};

// ═══════════════════════════════════════════════════
// ROUTE 1: RIGHT NOW — Energy + context-aware workout
// ═══════════════════════════════════════════════════
// ── v2 post-generation check ────────────────────────────────────────────────
// Reviewed against backend/lib/outputStandard.js on 2026-09-01. Declaring v2 is
// what makes the contract's own first line true: the standard text is injected
// by lib/claude.js only for routes that declare it, so "Follow
// DEFTBRAIN_OUTPUT_STANDARD_V2" was pointing at a document the model could not
// see.
//
// The check is aimed at the OUTCOMES clause, which is the enumerable one: a
// movement described by the effect it will supposedly have. A field that is one
// short sentence promising an effect is blanked; anything longer is logged, not
// mutated, because cutting a clause out of a step could leave an instruction
// that no longer makes sense.
// Two registers, because banning one only moves the model into the other. The
// clinical set was already here; the folk set is what came back instead once the
// clinical words were forbidden ("gets the blood moving" for "improves
// circulation"). Both are the same claim: an effect this movement will have on
// your body, which the tool has no way to know.
//
// English only, deliberately: this is a backstop, not the fix. The fix is that
// no schema field asks for an effect any more, which holds in all 13 languages.
const CLINICAL_OUTCOME = /\b(?:relieves?|releases?|reduces?|eases?|calms?|resets?|boosts?|restores?|flushes?|undoes|fixes|treats?|activates?|corrects?|improves?)\b[^.]{0,60}\b(?:pain|tension|stress|anxiety|circulation|nervous system|posture|energy|stiffness|soreness|cortisol|tightness|aches?|knots?|cramps?|mobility|flexibility|range of motion)\b|\b(?:will|helps?) (?:relieve|release|reduce|calm|improve|increase|fix|undo)\b/i;
const FOLK_OUTCOME = new RegExp([
  // "gets the blood moving", "blood flow"
  /\bgets? (?:the |your )?blood (?:moving|flowing|pumping)\b/,
  /\bblood flow\b/,
  // Third-person claims about what a movement does to a body part. The -s is
  // required and load-bearing: "opens up the shoulders" is a claim about the
  // exercise, "open your chest" is a positioning cue we want to keep.
  /\b(?:opens|loosens|unlocks|lengthens|decompresses|unwinds|melts|wakes|activates|engages)\s+(?:up\s+|out\s+)?(?:the|your)\s+(?:(?:front|back|sides?|top|base)\s+of\s+(?:the|your)\s+)?(?:[a-z]+\s+)?(?:shoulders?|hips?|chest|back|spine|neck|legs?|body|joints?|muscles?|core|glutes|abs|hamstrings)\b/,
  // Claims about what it spares you
  /\bwithout\s+(?:putting|placing|adding)?\s*(?:any\s+)?(?:strain|stress|pressure|load|impact)\s+on\b/,
  /\b(?:easy|gentle|kind)\s+on\s+(?:the|your)\s+(?:joints?|back|knees?|spine)\b/,
  // Benefit by idiom
  /\bgoes? a long way\b/,
  /\b(?:does|do|works?) wonders\b/,
  /\bcounteracts?\b/,
  /\bcombats?\b/,
  /\b(?:undoe?s?|undoing|counters?|countering)\s+(?:all\s+)?(?:the\s+)?(?:sitting|desk|hunching|slouching)\b/,
].map(r => r.source).join('|'), 'i');
// Absolutes about effort. Low energy means less demand, not that an active
// movement costs nothing — and "zero effort required" on a movement the visitor
// then has to perform reads as the tool not having listened.
const ABSOLUTE_EFFORT = new RegExp([
  /\bzero\s+(?:real\s+)?(?:effort|work|exertion)\b/,
  /\b(?:no|without\s+any)\s+(?:real|actual|muscular|physical)?\s*(?:effort|exertion|work)(?:\s+(?:required|needed|involved|at all))?/,
  /\b(?:almost|practically|virtually|basically)\s+no\s+(?:real\s+|muscular\s+|physical\s+)?(?:effort|exertion|work)\b/,
  /\beffortless(?:ly)?\b/,
  /\brequires?\s+(?:almost\s+)?nothing\b/,
].map(r => r.source).join('|'), 'i');

// Context turned into causation. The visitor said they had a long screen day;
// that is not a licence to explain what screen days do to shoulders in general.
const CAUSAL_GENERALIZATION = new RegExp([
  /\btends?\s+to\b/,
  /\busually\s+(?:gets?|get|becomes?|ends?\s+up|stays?|sits?|holds?)\b/,
  /\boften\s+(?:gets?|get|becomes?|ends?\s+up|stays?)\b/,
  /\b(?:most|many)\s+people\b/,
  /\bwe\s+(?:all\s+)?(?:tend|hold|carry|store)\b/,
].map(r => r.source).join('|'), 'i');

const OUTPUT_RULES = [
  ['promised an effect', CLINICAL_OUTCOME],
  ['promised an effect in plainer words', FOLK_OUTCOME],
  ['claimed the movement costs nothing', ABSOLUTE_EFFORT],
  ['generalised about bodies instead of using their inputs', CAUSAL_GENERALIZATION],
];
const PROMISED_OUTCOME = {
  test: (v) => OUTPUT_RULES.some(([, re]) => re.test(v)),
  rule: (v) => (OUTPUT_RULES.find(([, re]) => re.test(v)) || [''])[0],
};

function validateResult(data) {
  if (!data || typeof data !== 'object') return data;
  const walk = (node) => {
    if (Array.isArray(node)) return node.forEach(walk);
    if (!node || typeof node !== 'object') return;
    for (const [k, v] of Object.entries(node)) {
      if (typeof v === 'string' && PROMISED_OUTCOME.test(v)) {
        if (v.length <= 160 && (v.match(/[.!?]/g) || []).length <= 1) {
          console.log(`[lazy-workout-adapter] ${k} blanked — ${PROMISED_OUTCOME.rule(v)}: ${v.slice(0, 70)}`);
          node[k] = '';
        } else {
          console.log(`[lazy-workout-adapter] ${k} ${PROMISED_OUTCOME.rule(v)} (left intact, too long to cut safely): ${v.slice(0, 70)}`);
        }
      } else if (v && typeof v === 'object') walk(v);
    }
  };
  walk(data);
  return data;
}

const LWA_CONTRACT = `
LAZY WORKOUT ADAPTER — INPUT INTERPRETATION

Follow DEFTBRAIN_OUTPUT_STANDARD_V2.

The visitor is asking for movement that fits the capacity, time, setting, physical information, and circumstances they supplied today.

ADAPT; DO NOT DIAGNOSE

Use the visitor's selections to modify the routine, not to explain the visitor.

"Bad sleep," "emotional day," "long meeting," "hungover," "cramps," "nervous/anxious," "after a conflict," and similar inputs are context for adaptation. They do not establish a medical, physical, or psychological condition.

Do not infer why the visitor has low energy, pain, stiffness, tension, restlessness, or another sensation.

Do not tell the visitor what their body "needs," what their nervous system is doing, what caused a symptom, or what an exercise will fix unless that is established.

Treat energy as today's self-reported capacity, not fitness level, motivation, health, or psychological state.

PHYSICAL INPUTS

"Where do you feel it?" describes what the visitor reported feeling. It does not authorize diagnosis or treatment.

Do not convert:
"sore back" into a back injury;
"tight hips" into shortened muscles;
"tension" into stress physiology;
"restless legs" into a medical condition.

INJURIES AND LIMITATIONS

Treat every supplied injury or limitation as a hard constraint.

Do not design around it by assuming movements are safe merely because they seem gentle.

If the limitation makes a proposed movement uncertain, choose a different movement that does not depend on the affected area.

Do not provide rehabilitation, post-surgical progression, or injury treatment unless the tool is explicitly operating within an appropriate medical-safety pathway.

CONTEXT SHOULD MATTER

Selections should materially affect the routine when relevant.

Examples:
- little time -> fewer movements, not rushed movements;
- low energy -> lower effort and simpler transitions;
- office -> movements practical in an office;
- in bed -> movements that can actually be done in bed;
- sore body area -> avoid unnecessarily loading it;
- screen marathon -> movement may change position or visual focus without claiming the screen time caused a symptom.

Do not force every selected detail into the output when it does not materially change the recommendation.

The goal is the smallest useful routine that fits today.

LAZY WORKOUT ADAPTER — OUTPUT CONTRACT

Produce a routine the visitor can use immediately.

The result should feel like:
"Here is a manageable way to move right now."

Not:
"Here is my analysis of your body, mood, health, or motivation."

ANSWER FIRST

Lead with the routine.

Do not begin with encouragement, a diagnosis, an explanation of the visitor's condition, or a paragraph about why movement is beneficial.

Keep setup short.

For every movement, make clear:
- what to do;
- how long or how many repetitions when needed;
- any positioning cue necessary to perform it;
- an easier alternative when materially useful.

Do not overload simple movements with coaching language.

EFFORT

Match effort to the visitor's stated capacity.

Low energy means reduce demand, complexity, transitions, and required effort. It does not mean the visitor is fragile.

Higher energy permits more movement but does not authorize a demanding workout merely because the slider is high.

Never frame completion as an obligation.

No guilt, streak pressure, "no excuses," earned-rest language, or claims that doing something is morally better than doing nothing.

OUTCOMES

Do not promise or predict that a movement will:
- relieve pain;
- release tension;
- improve circulation;
- calm the nervous system;
- increase energy;
- improve sleep;
- reduce anxiety;
- undo sitting;
- fix posture;
- accelerate recovery;

unless the available information supports that specific claim.

Describe the movement rather than inventing its effect.

Prefer:
"Slow shoulder rolls."

Not:
"This releases the tension stored in your shoulders."

Prefer:
"Finish with slow breathing."

Not:
"This tells your nervous system that the hard part is over."

DO NOT INVENT EMOTIONAL INTENSITY

Preserve the user's description of their day without amplifying it.

If the user selected "Emotional day," do not rewrite that as:
"emotionally draining"
"overwhelming"
"rough"
"heavy"

unless the user supplied those descriptions.

Use the supplied wording:
"You mentioned an emotional day..."

DO NOT TURN CONTEXT INTO CAUSATION

Explain why a movement fits using the user's stated constraints, not an
invented physical consequence of their day.

Prefer:
"You mentioned a stiff neck, so this keeps the movement small and gentle."

Not:
"Shoulders tend to get held still during long screen sessions."

DO NOT EQUATE LOW ENERGY WITH ZERO PHYSICAL EFFORT

Low energy should reduce demand, transitions, complexity, and intensity.
Do not describe active movements as requiring "zero effort," "no real
effort," or similar absolutes.

Prefer:
"keeps the effort low"
"requires little setup"
"keeps you on the floor"

Not:
"zero effort required"
"without any real effort"

EXPLAIN THE FIT, NOT THE BENEFIT

The green line under each movement should answer:
"Why did this movement make sense for the inputs I gave you?"

It should NOT make a therapeutic claim or manufacture physiology.

Ground it in:
- energy/capacity;
- available time;
- location;
- stated body area;
- practical constraints;
- simplicity or position.

Do not claim the movement treats, relieves, fixes, releases, restores,
opens, activates, improves, or corrects the reported issue.

SAFETY

Do not diagnose, rehabilitate, prescribe treatment, or impersonate a physical therapist or medical professional.

Pain is not a challenge to push through.

If a movement causes pain, dizziness, unusual shortness of breath, or another concerning symptom, tell the visitor to stop that movement.

Respect supplied limitations without speculating about their cause.

Do not prescribe exercise progression after surgery, acute injury, or another medical event merely because the visitor entered it in a text field. When appropriate, keep guidance within ordinary low-risk movement and defer to instructions already given by the visitor's clinician.

PRECISION

Use the visitor's available time as a real constraint.

Movement durations and repetitions may be specified when they define the routine.

Do not invent physiological thresholds, recovery timelines, calorie burns, therapeutic doses, or expected improvement.

Do not make the routine fill every available minute merely because time is available.

AGENCY AND RECOVERY PATH

Make reducing the routine legitimate.

When appropriate provide an obvious easier path:
- fewer repetitions;
- smaller range of motion;
- seated instead of standing;
- skip the movement;
- stop after the first movement.

A partial routine is still a valid use of the tool.

FINAL CHECK

Before returning the result:
- Did today's inputs actually change the routine?
- Did I diagnose anything the visitor merely described?
- Did I promise a physical or emotional effect?
- Did I treat low energy as incapacity?
- Did I override an injury or limitation?
- Is every movement understandable without expert knowledge?
- Is there anything here that can be removed?
- Can the visitor start immediately?
`;

router.post('/lazy-workout-adapter', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { energy, bodyAreas, timeMinutes, limitations, setting, completionCount, preferences, contexts, userLanguage } = req.body;
    if (!energy && energy !== 0) return res.status(400).json({ error: 'How\'s your energy right now?' });

    const energyNum = parseInt(energy);
    const progressionLevel = Math.min(Math.floor((completionCount || 0) / 10), 5);
    const bodyContext = (bodyAreas || []).map(b => BODY_AREAS[b] || b).join(', ');
    const contextDesc = (contexts || []).map(ct => CONTEXTS[ct] || ct).join('. ');

    const prompt = withLanguage(`Create a genuinely low-barrier workout. Meet them where they are.

ENERGY: ${energyNum}/10 ${energyNum <= 3 ? '(very low — be gentle)' : energyNum <= 6 ? '(moderate)' : '(decent — can push a bit)'}
BODY: ${bodyContext || 'No specifics'}
${contextDesc ? `WHAT HAPPENED: ${contextDesc}` : ''}
TIME: ${timeMinutes || '10'} min${timeMinutes && parseInt(timeMinutes) <= 5 ? ' (SHORT)' : ''}
SETTING: ${setting || 'home'}
LIMITATIONS: ${limitations || 'None'}
${preferences?.hated?.length ? `DISLIKE (NEVER include): ${preferences.hated.join(', ')}` : ''}
${preferences?.loved?.length ? `LIKE (favor): ${preferences.loved.join(', ')}` : ''}
PROGRESSION: ${progressionLevel}/5 (invisible — do not mention)

RULES:
- If WHAT HAPPENED is provided, tailor specifically to that situation.
- Energy 1-3: feels like stretching. Floor-based. No standing at 1-2.
- Energy 4-6: gentle mix. Energy 7-10: moderate but accessible.
- Every exercise has a "too much?" fallback and a "do while" multitask option.
- 3-8 exercises, scaled to TIME (short sessions get fewer, longer sessions get more).
- "seconds" is each exercise's duration in seconds, integer.
- Warm, casual, zero-guilt.

Return ONLY valid JSON:
{
  "workout_name": "Casual name — 3-6 words",
  "vibe": "One warm sentence. If context provided, acknowledge it.",
  "total_time": "${timeMinutes || '10'} minutes",
  "exercises": [{ "name": "name", "duration": "time", "seconds": 60, "how": "conversational instructions — one sentence", "why": "one sentence naming which of THEIR inputs put this movement here — their energy level, their minutes, their setting, or the area they named. Start from what they told you, not from the body. Never state what the movement does to them", "too_much": "easier version — one sentence", "do_while": "multitask option — one sentence", "body_area": "target — one sentence" }],
  "rest_note": "generous rest guidance — one sentence",
  "barrier_check": { "clothes": "current clothes fine — one sentence", "space": "space needed — one sentence", "noise": "apartment-friendly? — one sentence", "equipment": "none or what helps — one sentence" },
  "done_is_done": "warm half-is-fine message — one sentence",
  "if_you_want_more": "optional extra — one sentence"
}`, userLanguage);

    const parsed = await callClaudeWithRetry({
        model: MODELS.SMART,
        max_tokens: 4000,
        system: withLanguage('Low-pressure movement coach. Any movement counts. Never guilt-trip. Warm, casual, zero-judgment. Return ONLY valid JSON. No markdown. ' + NO_QUOTE_RULE + LWA_CONTRACT, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
        messages: [{ role: 'user', content: prompt }],
    }, { label: 'lazy-workout-adapter' });
    if (!parsed.vibe && !parsed.exercises && !parsed.workout) {
      return res.status(500).json({ error: 'Could not adapt your workout. Please try again.' });
    }
    res.json(validateResult(parsed));
  } catch (error) {
    console.error('[LazyWorkout]', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 2: MICRO — 2-minute floor
// ═══════════════════════════════════════════════════
router.post('/lazy-workout-adapter-micro', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { bodyAreas, position, limitations, userLanguage } = req.body;
    const bodyContext = (bodyAreas || []).map(b => BODY_AREAS[b] || b).join(', ');

    const prompt = withLanguage(`2-minute micro session. Three movements, 40 seconds each. For someone who can't do more right now.
BODY: ${bodyContext || 'Just blah'} | POSITION: ${position || 'sitting or lying down'}
LIMITATIONS: ${limitations || 'None'}
Rules: feels like stretching. Feels good immediately. No standing unless specified. Effortless transitions. Respect LIMITATIONS — never load or strain an injured area.

Return ONLY valid JSON:
{ "session_name": "name", "total_time": "2 minutes", "message": "one warm sentence",
  "movements": [{ "name": "name", "seconds": 40, "how": "one sentence", "feels_like": "what it feels like to DO — effort, position, pace. Not what it does to the body" }],
  "after": "what they can do next, or nothing at all — one sentence. No claim about how they will feel" }

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.`, userLanguage);

    const parsed = await callClaudeWithRetry({
        model: MODELS.SMART,
        max_tokens: 4000,
        system: withLanguage('Gentle movement guide. 2 minutes is a win. Return ONLY valid JSON. No markdown. ' + NO_QUOTE_RULE + LWA_CONTRACT, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
        messages: [{ role: 'user', content: prompt }],
    }, { label: 'lazy-workout-adapter-micro' });
    if (!parsed.session_name) {
      return res.status(500).json({ error: 'Could not adapt your workout. Please try again.' });
    }
    res.json(validateResult(parsed));
  } catch (error) {
    console.error('[LazyWorkoutMicro]', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 3: WEEK — Weekly movement menu
// ═══════════════════════════════════════════════════
router.post('/lazy-workout-adapter-week', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { typicalEnergy, limitations, preferences, completionCount, userLanguage } = req.body;
    const progressionLevel = Math.min(Math.floor((completionCount || 0) / 10), 5);

    const prompt = withLanguage(`7-day movement menu. NOT a training program.
ENERGY: ${JSON.stringify(typicalEnergy || {})} | LIMITATIONS: ${limitations || 'None'}
${preferences?.hated?.length ? `AVOID: ${preferences.hated.join(', ')}` : ''}
PROGRESSION: ${progressionLevel}/5 (invisible)
Rules: every day has minimum (2-5 min) + feeling-it (10-15 min). 2+ rest days. Variety. Menu not mandate.

Return ONLY valid JSON:
{ "plan_name": "name", "philosophy": "one sentence",
  "days": [{ "day": "Monday", "theme": "theme", "minimum": { "name": "n", "time": "t", "description": "d" }, "feeling_it": { "name": "n", "time": "t", "description": "d" }, "skip_day_note": "alt" }],
  "weekly_note": "warm note (success != 7/7) — one sentence" }`, userLanguage);

    const parsed = await callClaudeWithRetry({
        model: MODELS.SMART,
        max_tokens: 4000,
        system: withLanguage('Low-pressure weekly planner. Menu, not mandate. Return ONLY valid JSON. No markdown. ' + NO_QUOTE_RULE + LWA_CONTRACT, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
        messages: [{ role: 'user', content: prompt }],
    }, { label: 'lazy-workout-adapter-week' });
    if (!parsed.plan_name) {
      return res.status(500).json({ error: 'Could not adapt your workout. Please try again.' });
    }
    res.json(validateResult(parsed));
  } catch (error) {
    console.error('[LazyWorkoutWeek]', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 5: SWAP — Replace exercise
// ═══════════════════════════════════════════════════
router.post('/lazy-workout-adapter-swap', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { exercise, bodyArea, energy, userLanguage } = req.body;
    if (!exercise?.trim()) return res.status(400).json({ error: 'Which exercise?' });
    const prompt = withLanguage(`Replace "${exercise}" — same area, different feel. Area: ${bodyArea || 'general'} | Energy: ${energy || '5'}/10
Return ONLY valid JSON: { "replacement": { "name": "n", "duration": "t", "seconds": 60, "how": "instructions — one sentence", "why_instead": "reason — one sentence", "do_while": "multitask — one sentence" }, "message": "no guilt — 2-4 sentences" }
("seconds" = duration in seconds, integer.)

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.`, userLanguage);
    const parsed = await callClaudeWithRetry({
        model: MODELS.SMART,
        max_tokens: 4000,
        system: withLanguage('Exercise swapper. No guilt. Return ONLY valid JSON. No markdown. ' + NO_QUOTE_RULE + LWA_CONTRACT, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
        messages: [{ role: 'user', content: prompt }],
    }, { label: 'lazy-workout-adapter-swap' });
    if (!parsed.replacement) {
      return res.status(500).json({ error: 'Could not adapt your workout. Please try again.' });
    }
    res.json(validateResult(parsed));
  } catch (error) { console.error('[LazyWorkoutSwap]', error); res.status(500).json({ error: 'Something went wrong. Please try again.' }); }
});

// ═══════════════════════════════════════════════════
// ROUTE 6: BODY — Targeted relief
// ═══════════════════════════════════════════════════
router.post('/lazy-workout-adapter-body', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { bodyArea, intensity, timeMinutes, limitations, userLanguage } = req.body;
    if (!bodyArea?.trim()) return res.status(400).json({ error: 'What needs attention?' });
    const areaDesc = BODY_AREAS[bodyArea] || bodyArea;
    const prompt = withLanguage(`Gentle movement centred on the area they named: ${areaDesc}. Intensity: ${intensity || 'gentle'}. Time: ${timeMinutes || '5'} min. Should feel easy to do, not like a workout. Do not promise it will relieve anything.
LIMITATIONS: ${limitations || 'None'} — respect these; never load or strain an injured area.
("seconds" = duration in seconds, integer.)
Return ONLY valid JSON:
{ "session_name": "n", "for": "how the session is shaped around that area — one sentence describing the plan, not a physical effect", "time": "${timeMinutes || '5'} minutes",
  "movements": [{ "name": "n", "duration": "t", "seconds": 60, "how": "gentle instructions — one sentence", "feels_like": "what it feels like to DO — effort, position, pace. Not what it does to the body", "caution": "or null — one sentence" }],
  "prevention_tip": "one small thing they could do on another day — one sentence. Do not claim it prevents anything" }

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.`, userLanguage);
    const parsed = await callClaudeWithRetry({
        model: MODELS.SMART,
        max_tokens: 4000,
        system: withLanguage('Targeted movement adapter. Adapt movement to what the visitor reported feeling; do not diagnose or treat it. Return ONLY valid JSON. No markdown. ' + NO_QUOTE_RULE + LWA_CONTRACT, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
        messages: [{ role: 'user', content: prompt }],
    }, { label: 'lazy-workout-adapter-body' });
    if (!parsed.session_name) {
      return res.status(500).json({ error: 'Could not adapt your workout. Please try again.' });
    }
    res.json(validateResult(parsed));
  } catch (error) { console.error('[LazyWorkoutBody]', error); res.status(500).json({ error: 'Something went wrong. Please try again.' }); }
});

// ═══════════════════════════════════════════════════
// ROUTE 7: COMPLETE — Log completion
// ═══════════════════════════════════════════════════
router.post('/lazy-workout-adapter-complete', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { completedExercises, totalExercises, energyBefore, energyAfter, duration, streak, totalSessions, sessionType, userLanguage } = req.body;
    const pct = totalExercises ? Math.round((completedExercises / totalExercises) * 100) : 100;
    const prompt = withLanguage(`Movement done. Celebrate warmly, not over-the-top. ${completedExercises || '?'}/${totalExercises || '?'} (${pct}%). Energy: ${energyBefore || '?'}→${energyAfter || '?'}. Duration: ${duration || '?'} min. Streak: ${streak || 1}. Total: ${totalSessions || 1}. Type: ${sessionType || 'workout'}. Milestones at 7/14/30 streak, 10/25/50 total. 2-3 sentences.
Return ONLY valid JSON: { "message": "celebration — 2-4 sentences", "energy_note": "or null — one sentence", "milestone": "or null — one sentence", "streak_status": "${streak || 1} day streak", "suggestion": "or null — one sentence" }

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.`, userLanguage);
    const parsed = await callClaudeWithRetry({
        model: MODELS.SMART,
        max_tokens: 4000,
        system: withLanguage('Movement celebration. Warm, brief, real. Return ONLY valid JSON. No markdown. ' + NO_QUOTE_RULE + LWA_CONTRACT, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
        messages: [{ role: 'user', content: prompt }],
    }, { label: 'lazy-workout-adapter-complete' });
    if (!parsed.message) {
      return res.status(500).json({ error: 'Could not adapt your workout. Please try again.' });
    }
    res.json(validateResult(parsed));
  } catch (error) { console.error('[LazyWorkoutComplete]', error); res.status(500).json({ error: 'Something went wrong. Please try again.' }); }
});

// ═══════════════════════════════════════════════════
// ROUTE 8: INSIGHTS — Pattern analysis
// ═══════════════════════════════════════════════════
router.post('/lazy-workout-adapter-insights', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { history, userLanguage } = req.body;
    if (!history?.length || history.length < 5) return res.status(400).json({ error: 'Need 5+ sessions.' });
    const recent = history.slice(-30).map(h => ({ date: h.date, day: h.day, energy_before: h.energyBefore, energy_after: h.energyAfter, duration: h.duration, completed_pct: h.completedPct, body_areas: h.bodyAreas, type: h.sessionType, contexts: h.contexts }));
    const prompt = withLanguage(`Analyze ${recent.length} movement sessions. Find helpful patterns, not judgments.
DATA: ${JSON.stringify(recent)}
Return ONLY valid JSON:
{ "summary": "warm sentence — 1-2 sentences", "energy_patterns": { "best_days": [], "movement_impact": "avg change — one sentence", "insight": "pattern — one sentence" },
  "body_patterns": { "frequent_areas": [], "suggestion": "practical note — one sentence" },
  "context_patterns": { "common_triggers": [], "insight": "what drives them to move — one sentence" },
  "consistency": { "sessions_per_week": "avg", "trend": "increasing|stable|decreasing", "wins": "positive — one sentence" },
  "personal_tip": "one actionable tip from THEIR data — one sentence" }

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.`, userLanguage);
    const parsed = await callClaudeWithRetry({
        model: MODELS.SMART,
        max_tokens: 4000,
        system: withLanguage('Movement analyst. Useful self-knowledge. Warm. Return ONLY valid JSON. No markdown. ' + NO_QUOTE_RULE + LWA_CONTRACT, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
        messages: [{ role: 'user', content: prompt }],
    }, { label: 'lazy-workout-adapter-insights' });
    if (!parsed.summary) {
      return res.status(500).json({ error: 'Could not adapt your workout. Please try again.' });
    }
    res.json(validateResult(parsed));
  } catch (error) { console.error('[LazyWorkoutInsights]', error); res.status(500).json({ error: 'Something went wrong. Please try again.' }); }
});

// ═══════════════════════════════════════════════════
// ROUTE 9: STACK — Environment stacking
// ═══════════════════════════════════════════════════
router.post('/lazy-workout-adapter-stack', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { activity, duration, bodyAreas, limitations, userLanguage } = req.body;
    if (!activity?.trim()) return res.status(400).json({ error: 'What are you about to do?' });
    const bodyContext = (bodyAreas || []).map(b => BODY_AREAS[b] || b).join(', ');

    const prompt = withLanguage(`Create micro-movements to sprinkle throughout an activity. NOT a workout — movement woven into what they're already doing.

ACTIVITY: "${activity.trim()}" | DURATION: ${duration || '60'} min
${bodyContext ? `BODY: ${bodyContext}` : ''} ${limitations ? `LIMITS: ${limitations}` : ''}

Rules: doable DURING activity. 30-60 sec each. Spaced evenly. Feel natural, not interruptions. Include a cue for each.

Return ONLY valid JSON:
{ "stack_name": "friendly name — 3-6 words", "activity": "${activity.trim()}", "frequency": "how often, e.g. every 10 min",
  "movements": [{ "name": "n", "seconds": 30, "how": "one sentence", "cue": "when to do it — one sentence", "invisible": true }],
  "total_active_time": "short total, e.g. 5 min", "message": "warm note about how this adds up — 2-4 sentences" }`, userLanguage);

    const parsed = await callClaudeWithRetry({
        model: MODELS.SMART,
        max_tokens: 4000,
        system: withLanguage('Environment stacking expert. Layer movement onto activities. Invisible, effortless. Return ONLY valid JSON. No markdown. ' + NO_QUOTE_RULE + LWA_CONTRACT, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
        messages: [{ role: 'user', content: prompt }],
    }, { label: 'lazy-workout-adapter-stack' });
    if (!parsed.stack_name) {
      return res.status(500).json({ error: 'Could not adapt your workout. Please try again.' });
    }
    res.json(validateResult(parsed));
  } catch (error) { console.error('[LazyWorkoutStack]', error); res.status(500).json({ error: 'Something went wrong. Please try again.' }); }
});

// ═══════════════════════════════════════════════════
// ROUTE 10: SLEEP — Pre-bed wind-down
// ═══════════════════════════════════════════════════
router.post('/lazy-workout-adapter-sleep', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { timeMinutes, bodyAreas, stress_level, limitations, userLanguage } = req.body;
    const bodyContext = (bodyAreas || []).map(b => BODY_AREAS[b] || b).join(', ');

    const prompt = withLanguage(`Pre-sleep wind-down. Goal is NOT movement — it's transition to sleep.
TIME: ${timeMinutes || '5'} min | ${bodyContext ? `BODY: ${bodyContext} |` : ''} STRESS: ${stress_level || 'medium'}
LIMITATIONS: ${limitations || 'None'}

Rules: progressive relaxation (each calmer than last). End lying down, eyes closed, with breathing. RELEASE tension. If stress is high, more breathing. Include setup cues. Respect LIMITATIONS — never load or strain an injured area. "seconds" = duration in seconds, integer.

Return ONLY valid JSON:
{ "session_name": "calming name — 3-6 words", "time": "${timeMinutes || '5'} minutes",
  "setup": "environmental prep (lights, temp, phone away) — one sentence",
  "movements": [{ "name": "n", "duration": "t", "seconds": 60, "how": "calming instruction — one sentence", "position": "sitting|lying|standing", "breathing": "paired pattern or null — one sentence" }],
  "final_breathing": { "name": "pattern name — 3-6 words", "inhale": 4, "hold": 7, "exhale": 8, "instruction": "gentle guide — one sentence" },
  "sleep_tip": "one thing to remember — one sentence" }`, userLanguage);

    const parsed = await callClaudeWithRetry({
        model: MODELS.SMART,
        max_tokens: 4000,
        system: withLanguage('Sleep preparation guide. Calm, gentle, progressive. Goal is sleep. Return ONLY valid JSON. No markdown. ' + NO_QUOTE_RULE + LWA_CONTRACT, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
        messages: [{ role: 'user', content: prompt }],
    }, { label: 'lazy-workout-adapter-sleep' });
    if (!parsed.session_name) {
      return res.status(500).json({ error: 'Could not adapt your workout. Please try again.' });
    }
    res.json(validateResult(parsed));
  } catch (error) { console.error('[LazyWorkoutSleep]', error); res.status(500).json({ error: 'Something went wrong. Please try again.' }); }
});

// ═══════════════════════════════════════════════════
// ROUTE 11: RECOVERY — Post-event recovery
// ═══════════════════════════════════════════════════
router.post('/lazy-workout-adapter-recovery', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { event, intensity, timeMinutes, limitations, userLanguage } = req.body;
    if (!event?.trim()) return res.status(400).json({ error: 'What do you need to recover from?' });

    const prompt = withLanguage(`Recovery protocol for: "${event.trim()}" — first aid for the body after life happens.
SEVERITY: ${intensity || 'moderate'} | TIME: ${timeMinutes || '5'} min
LIMITATIONS: ${limitations || 'None'}

Rules: address physical AND emotional residue. Start with most soothing thing. Include non-movement element (water, breathing, temp). End with "hard part is over" signal. Be warm. Respect LIMITATIONS — never load or strain an injured area. "seconds" = duration in seconds, integer.
- For medical events — surgery, accidents, injury — lead with a see-your-clinician caveat and keep movement to gentle circulation only.

Return ONLY valid JSON:
{ "protocol_name": "warm name — 3-6 words", "for": "acknowledge what happened — one sentence", "time": "${timeMinutes || '5'} minutes",
  "immediate": "very first thing (often not movement) — one sentence",
  "steps": [{ "name": "n", "duration": "t", "seconds": 60, "type": "movement|breathing|stillness|sensory|hydration", "how": "warm instruction — one sentence", "why_now": "why after THIS event — one sentence" }],
  "closing": "the hard part is over message — one sentence",
  "next_hour": "what to do in the next hour — one sentence",
  "prevention": "if recurring, one thing to try. null if one-off — one sentence" }

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.`, userLanguage);

    const parsed = await callClaudeWithRetry({
        model: MODELS.SMART,
        max_tokens: 4000,
        system: withLanguage('Recovery designer. First aid for the body after life happens. Warm, holistic. Return ONLY valid JSON. No markdown. ' + NO_QUOTE_RULE + LWA_CONTRACT, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
        messages: [{ role: 'user', content: prompt }],
    }, { label: 'lazy-workout-adapter-recovery' });
    if (!parsed.protocol_name) {
      return res.status(500).json({ error: 'Could not adapt your workout. Please try again.' });
    }
    res.json(validateResult(parsed));
  } catch (error) { console.error('[LazyWorkoutRecovery]', error); res.status(500).json({ error: 'Something went wrong. Please try again.' }); }
});

// ═══════════════════════════════════════════════════
// ROUTE 12: PROVE — Evidence dashboard
// ═══════════════════════════════════════════════════
router.post('/lazy-workout-adapter-prove', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { history, notTodayLog, userLanguage } = req.body;
    if (!history?.length || history.length < 7) return res.status(400).json({ error: 'Need 7+ sessions to prove it.' });
    const recent = history.slice(-50).map(h => ({ date: h.date, day: h.day, energy_before: h.energyBefore, energy_after: h.energyAfter, duration: h.duration, completed_pct: h.completedPct, type: h.sessionType }));

    const prompt = withLanguage(`Evidence report: does movement help this person? Use their real data. Be honest.
${recent.length} SESSIONS: ${JSON.stringify(recent)}
${notTodayLog?.length ? `OPENED-BUT-SKIPPED (${notTodayLog.length}): ${JSON.stringify(notTodayLog.slice(-20))}` : ''}

Rules: real numbers. If it doesn't help, say so. Compare session types. Warm but honest.

Return ONLY valid JSON:
{ "headline": "one sentence verdict",
  "energy_evidence": { "avg_before": "n", "avg_after": "n", "avg_change": "n", "pct_sessions_improved": "n%", "verdict": "clear|moderate|unclear" },
  "best_sessions": { "best_type": "or null — one sentence", "best_duration": "or null (number)", "best_day": "or null — one sentence", "insight": "what works for THEM — one sentence" },
  "consistency_story": { "total_sessions": "${recent.length}", "sessions_per_week": "avg", "total_minutes": "n", "trend": "trend", "reframe": "put minutes in perspective — one sentence" },
  "honest_note": "warm honest observation — one sentence" }`, userLanguage);

    const parsed = await callClaudeWithRetry({
        model: MODELS.SMART,
        max_tokens: 4000,
        system: withLanguage('Evidence analyst. Real data, warm delivery. Not cheerleading. Return ONLY valid JSON. No markdown. ' + NO_QUOTE_RULE + LWA_CONTRACT, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
        messages: [{ role: 'user', content: prompt }],
    }, { label: 'lazy-workout-adapter-prove' });
    if (!parsed.headline) {
      return res.status(500).json({ error: 'Could not adapt your workout. Please try again.' });
    }
    res.json(validateResult(parsed));
  } catch (error) { console.error('[LazyWorkoutProve]', error); res.status(500).json({ error: 'Something went wrong. Please try again.' }); }
});

// ═══════════════════════════════════════════════════
// ROUTE 13: NUDGE — Context-aware suggestion
// ═══════════════════════════════════════════════════
router.post('/lazy-workout-adapter-nudge', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { history, streak, lastSessionDate, currentDay, currentHour, userLanguage } = req.body;
    const recent = (history || []).slice(-10).map(h => ({ day: h.day, date: h.date, type: h.sessionType, duration: h.duration, name: h.workoutName }));
    const prompt = withLanguage(`Context-aware suggestion. ${currentDay || '?'}, ~${currentHour || '?'}:00. Streak: ${streak || 0}. Last: ${lastSessionDate || '?'}.
Recent: ${JSON.stringify(recent)}
Rules: if pattern exists, suggest continuing. If 3+ days gap, suggest 2 min. If streak, acknowledge casually. 1-2 sentences. Not a pitch.
Return ONLY valid JSON: { "nudge": "friendly suggestion — one sentence", "suggested_mode": "right-now|micro|body|sleep|stack|recovery", "suggested_time": "minutes, integer", "reason": "why, based on patterns — one sentence" }

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.`, userLanguage);
    const parsed = await callClaudeWithRetry({
        model: MODELS.SMART,
        max_tokens: 4000,
        system: withLanguage('Friendly nudger. Pattern-aware. Not pushy. Return ONLY valid JSON. No markdown. ' + NO_QUOTE_RULE + LWA_CONTRACT, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
        messages: [{ role: 'user', content: prompt }],
    }, { label: 'lazy-workout-adapter-nudge' });
    if (!parsed.nudge) {
      return res.status(500).json({ error: 'Could not adapt your workout. Please try again.' });
    }
    res.json(validateResult(parsed));
  } catch (error) { console.error('[LazyWorkoutNudge]', error); res.status(500).json({ error: 'Something went wrong. Please try again.' }); }
});

router.outputStandard = 'v2';
router.outputGuard = {
  prohibit: [
    'diagnoses_a_condition_from_something_the_visitor_merely_described',
    'explains_why_the_visitor_feels_tired_sore_tense_or_restless',
    'tells_the_visitor_what_their_body_or_nervous_system_needs',
    'promises_a_movement_will_relieve_release_calm_energise_or_fix_something',
    'invents_a_physiological_threshold_recovery_timeline_or_calorie_figure',
    'treats_low_energy_as_incapacity_or_fragility',
    'guilt_streak_pressure_no_excuses_or_earned_rest_framing',
    'prescribes_rehabilitation_or_post_surgical_progression',
    'loads_or_strains_an_area_the_visitor_named_as_injured',
    'fills_every_available_minute_merely_because_time_was_supplied',
  ],
  require: [
    'leads_with_the_routine_not_with_encouragement_or_analysis',
    'todays_inputs_materially_changed_the_routine',
    'every_movement_is_performable_without_expert_knowledge',
    'an_easier_path_or_a_legitimate_way_to_stop_is_offered',
    'fulfills_tool_promise',
  ],
};

module.exports = router;
