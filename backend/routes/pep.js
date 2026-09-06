const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, withLanguage, withLocaleContext } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

const NO_QUOTE_RULE = 'Never place a double-quote (") character inside any JSON string value — quoted phrases or example wording must be written plainly or with single quotes, or it breaks the JSON.';

// ════════════════════════════════════════════════════════════
// POST /pep — PEP, Personal Energy Planner.
//
// FOCUSED REBUILD, 2026-09-05, installed from an owner-supplied rewrite
// (see audit/tool-notes/PEP-NOTES.md). Reduces the tool from the earlier
// FULL V2 REWRITE's five modes (Right Now / Prioritize / Week / Patterns /
// Adapt, 17 actions) down to one product loop: report capacity → get a
// suggestion → try it → report what happened → PEP uses that evidence
// next time. Prioritize, Week, Patterns, Adapt, Shared menu, Match,
// Chart, and build-a-plan sequencing are REMOVED, not reworded.
//
// The supplied route (backend/routes/pep.js in the rewrite zip) omitted
// two load-bearing mechanisms present in every other v2 route in this
// codebase and restored here per audit/REWRITE-INSTALL-KIT.md §0/§5:
//   - NO_QUOTE_RULE — without it a quoted phrase in a non-English reply
//     breaks the JSON parse (this exact bug has hard-downed other tools
//     in German before).
//   - router.outputGuard + a validateResult() check. The supplied file
//     declared router.outputStandard='v2' but called no check at all,
//     which output-standard-audit.js treats as "v2 would be an
//     instruction nothing verifies" and fails outright. Follows the
//     same regex-walk pattern as the prior PEP rewrite and one-percenter.js.
// A stray `router.outputContractVersion = 2` in the supplied file matched
// no mechanism anywhere in this codebase and was dropped.
// ════════════════════════════════════════════════════════════

router.outputStandard = 'v2';
router.outputGuard = {
  checks: ['validateResult'],
  note: 'Only 3 actions on this route (generate, just-do-this, reflect) — a regex-walk validateResult() over the parsed JSON before it returns, same pattern as the fuller PEP rewrite this replaces. Categories carried forward because they target failure modes the SYSTEM prompt already argues against in prose (burnout terminology, battery/energy-cost arithmetic, nervous-system/deep-rest claims, forced encouragement, the restorative-vs-numbing binary, invented causal mechanisms / the ordinal-rating-as-quantity error, generic medical instruction) plus the three added in the RIGHT NOW FINAL CORRECTIONS pass (unsupported absolutes about effort, internal-effect claims standing in for a fit explanation, saved-menu status oversold as proven effectiveness), two from the FINAL FOCUSED TOOL CORRECTIONS pass (observed rating change converted into a caused effect, unsupported behavioral-pattern generalization from sparse history), and two from the ADDITIONAL RIGHT-NOW RULES pass: an activity described by an unearned internal-effect adjective instead of an observable characteristic ("more present," "activating," "grounding," "a step up" — the ACTIVITY CHARACTERISTICS rule asks for setup/cognitive/physical/social/sensory demand instead), and an invented hidden explanation splitting body and mind into separate diagnosed states when a general capacity score and a specific stated constraint appear to conflict ("your body is fine but your mind is exhausted" — both facts should be stated plainly, never reconciled with an invented theory). Dropped: the introvert/extrovert energy-stereotype category — it targeted the Week/Forecast mode, which no longer exists in this rebuild.',
};

const RULES = [
  ['burnout prediction or terminology',
    /\bburnout (?:approaching|risk|pattern|warning)\b|\btime[- ]until[- ]burnout\b|\b\d+(?:-\d+)? weeks? to burnout\b|\bheading toward burnout\b|\bburnout radar\b/i],
  ['battery or energy-cost arithmetic framed as a measurement',
    /\bbattery (?:drops?|falls?|remaining|percentage|drain(?:s|ed)?)\b|\benergy cost (?:percentage|of \d+%)\b|\b\d+% (?:of your )?energy\b|\brecharge debt\b|\benergy debt\b/i],
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
  ['unsupported absolute about effort',
    /\bzero (?:setup|effort|decisions?|attention|thought)\b|\bno decisions?\b|\bno attention\b|\bcompletely passive\b|\byou'?re not (?:doing|tracking|deciding) anything\b|\bnot making (?:any )?decisions\b|\bnothing (?:is )?required\b|\basks? nothing of you\b|\brequires? nothing\b/i],
  ['internal-effect claim instead of a fit explanation',
    /\bwithout demanding attention\b|\bwill (?:calm|clear|relax) your mind\b|\bkeeps? your mind (?:clear|calm|blank)\b/i],
  ['saved-menu status oversold as proven effectiveness',
    /\blikely to recharge you\b|\byour body (?:already )?responds? well\b|\byour best recovery tool\b|\bproven (?:match|recharge)\b|\breliable recharge\b/i],
  ['observed rating change converted into a caused or measured effect',
    /\bgave you \d+ points?\b|\braises? your energy\b|\brestores? \d+ points?\b|\bproduces? a reliable lift\b/i],
  ['unsupported behavioral-pattern generalization from sparse history',
    /\blow stimulation works for you\b|\bstillness is your (?:best|preferred) recharge pattern\b|\bpassive activities are (?:consistently )?effective\b/i],
  ['activity described by an unearned internal-effect or state adjective instead of an observable characteristic',
    /\bmore present\b|\bactivating\b|\bregulating\b|\bgrounding\b|\ba step up\b/i],
  ['invented hidden explanation splitting body and mind into separate diagnosed states',
    /\byour body is fine,? but your mind\b|\byou have energy,? but your brain\b|\bphysically capable,? but cognitively\b/i],
];

// Same shape as the prior PEP rewrite's validateResult / one-percenter.js:
// blank a matched leaf string (capped so a long paragraph containing an
// incidental match isn't nuked wholesale), then prune emptied array items.
// Cap raised 260/2 → 400/3 after a live-caught miss: a why_it_fits field
// ("You're at 2/10, numb, and screen-saturated. This requires zero setup,
// zero decisions, and zero physical effort. Being horizontal...") ran three
// sentences and slipped past the original 2-sentence cap despite containing
// an unambiguous, repeated "zero X" violation — not an incidental keyword
// in an otherwise-fine paragraph, exactly what the cap was meant to spare.
// "duration" renders next to the activity title in a narrow flex row — a
// full clause there (not just a time span) starves the title's share of the
// row and collapses it into a one-word-per-line column. The prompt asks for
// a short span; this is the backstop for when it doesn't comply. Cuts at the
// first natural break (comma, " - ", " leaving", " then", or a period)
// rather than a hard character truncation, so "20 minutes lying still,
// leaving 10 minutes to..." becomes "20 minutes" instead of a mid-word cut.
function shortenDuration(v) {
  if (typeof v !== 'string' || v.length <= 30) return v;
  // Prefer pulling out the leading time span itself ("20 minutes", "10-15
  // minutes") over cutting mid-clause, when the string starts with one.
  const span = v.match(/^\s*(?:up to |about |around |as long as )?\d+\s*(?:[-–to]+\s*\d+\s*)?(?:minutes?|mins?|hours?|hrs?)\b/i);
  if (span) return span[0].trim();
  const cut = v.search(/,| - |\bleaving\b|\bthen\b|\.|;/i);
  const short = cut > 0 ? v.slice(0, cut).trim() : v;
  return short.length <= 40 ? short : short.slice(0, 40).trim();
}

function validateResult(data) {
  if (!data || typeof data !== 'object') return data;
  const walk = (node) => {
    if (!node || typeof node !== 'object') return;
    for (const [k, v] of Object.entries(node)) {
      if (k === 'duration' && typeof v === 'string') {
        node[k] = shortenDuration(v);
        continue;
      }
      if (typeof v === 'string') {
        const hit = RULES.find(([, re]) => re.test(v));
        if (hit && v.length <= 400 && (v.match(/[.!?]/g) || []).length <= 3) {
          if (process.env.PEP_DEBUG) console.error(`[pep validateResult] blanked ${k} (rule: ${hit[0]}): ${JSON.stringify(v)}`);
          node[k] = '';
        }
      } else if (Array.isArray(v)) {
        for (const item of v) walk(item);
        node[k] = v.filter((item) => {
          if (typeof item === 'string') return item.trim() !== '';
          return true;
        });
      } else if (typeof v === 'object') {
        walk(v);
      }
    }
  };
  walk(data);
  return data;
}

const SYSTEM = `PEP — PERSONAL ENERGY PLANNER

Apply DEFTBRAIN_OUTPUT_STANDARD_V2.

PURPOSE
PEP helps someone decide what fits when they do not have much energy or capacity right now.

The core loop is:
1. The visitor tells PEP how much they have in them, how much time they have, where they are, and anything useful about the moment.
2. PEP recommends one manageable thing to do, plus at most two alternatives.
3. The visitor may save or try an activity.
4. If they report how it went, PEP uses that visitor-supplied evidence to make future suggestions more personal.

PEP is NOT:
- a five-mode energy management system
- a task planner
- a weekly schedule planner
- a burnout detector
- a medical or mental-health tool
- a biological energy meter
- a productivity dashboard

The visitor's 1–10 energy/capacity rating is a SELF-REPORT, not a physiological measurement.

GROUNDING
Treat only visitor-supplied information and visitor-supplied history as established.
Do not invent personality, motivation, diagnosis, nervous-system state, emotional cause, sleep quality, medical need, hidden preference, or future outcome.
Do not tell the visitor what their body, brain, or nervous system is asking for.
Do not promise that an activity will restore energy, improve mood, reduce stress, calm anything, improve sleep, or produce a particular internal state.

HISTORY
A saved activity means only that the visitor chose to save it.
A rating means only what the visitor rated.
A before/after energy score is an ordinal self-report: describe it as before-rating → after-rating (e.g. "your rating went from 5 to 8, a 3-point rise"). Never convert that into a claim about what the activity did — banned: "gave you 3 points," "raises your energy," "restores 3 points," "produces a reliable lift." The visitor's rating changed; the activity did not measurably do anything.
A single favorable attempt is not a reliable pattern.
Repeated similar visitor-reported outcomes may be described carefully and descriptively — at the ACTIVITY level first ("you rated these two lying-down activities 7/10 each"), not by inventing an abstract category the visitor never confirmed ("low stimulation works for you," "stillness is your best recharge pattern," "passive activities are consistently effective"). If two or more saved or tried activities share an obvious surface trait, you may name the trait, but say plainly that sparse history can't yet confirm whether that trait is what mattered — do not present it as an established preference.
Only surface history at all when it materially affects the current answer — it changed what you picked, what you avoided repeating, or the ranking, or it is otherwise genuinely useful context. Do not mention history, saved status, or past ratings just because they exist; if none of that applies here, leave the history field empty.

VOICE
Write directly to the visitor as 'you'.
Be practical, calm, economical, and specific.
Explain FIT, not predicted BENEFIT.
Be willing to suggest doing less.
Never moralize productivity or manufacture encouragement.
Never frame an activity as "recharging" or any other measurable physiological outcome — including in a heading, a read-out, or a recommendation's own framing. Prefer "something that fits what you have," "manageable given your capacity," or "uses the time you have" over "recharge," "restore," or "recovery."
Do not add an internal-state explanation ("your attention has been demanded continuously") when the visitor's own supplied facts are enough on their own — restate what they told you plainly ("you've been in back-to-back meetings all morning with no real breaks"), then explain the recommendation from that, rather than translating it into a claim about their internal state.

FINAL CHECK
Every recommendation should answer: Why does this fit the conditions the visitor gave me?
If an explanation instead answers: What will this do inside the visitor? rewrite it.

${NO_QUOTE_RULE}`;

function compactHistory(history) {
  if (!Array.isArray(history)) return [];
  return history.slice(0, 12).map((h) => ({
    activity: h.activity,
    rating: Number.isFinite(h.rating) ? h.rating : null,
    energy_before: Number.isFinite(h.energy_before) ? h.energy_before : null,
    energy_after: Number.isFinite(h.energy_after) ? h.energy_after : null,
    mood: h.mood || '',
    location: h.location || '',
    note: h.note || '',
    date: h.date || '',
  }));
}

router.post('/pep', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  const { action = 'generate', userLanguage } = req.body;

  try {
    if (action === 'generate' || action === 'just-do-this') {
      const {
        energy = 5,
        time_available,
        mood,
        environment,
        context,
        saved_menu,
        history,
        avoid,
      } = req.body;

      const oneOnly = action === 'just-do-this';
      const prompt = `PEP — ${oneOnly ? 'JUST TELL ME WHAT TO DO' : 'RIGHT NOW'}

CURRENT INPUT
Self-reported capacity: ${energy}/10
Time available: ${time_available || 'not specified'}
Mood: ${mood || 'not specified'}
Location: ${environment || 'not specified'}
Anything else: ${context || 'not specified'}
Saved activities: ${Array.isArray(saved_menu) && saved_menu.length ? saved_menu.join(' | ') : 'none'}
Recent visitor-reported attempts: ${JSON.stringify(compactHistory(history))}
Avoid repeating this session: ${Array.isArray(avoid) && avoid.length ? avoid.join(' | ') : 'none'}

TASK
${oneOnly
  ? 'Give exactly ONE concrete, low-friction suggestion. The visitor asked not to choose from a menu — this mode should feel noticeably simpler than the full menu: one activity, one first step, one stopping point. No alternatives, no analysis paragraph. Only include a history note if the visitor\'s own history is genuinely essential to why this particular thing was chosen — most of the time it will not be, and the field should stay empty.'
  : 'Give ONE top pick and at most TWO alternatives. Fewer is fine.'}
${Array.isArray(avoid) && avoid.length ? `\nThe visitor asked for different suggestions than before. The items above under "Avoid repeating this session" must not reappear, and a suggestion that is just a reworded version of one of them does not count as different. If the honest answer is that little else fits equally well, say so plainly rather than manufacturing false novelty.` : ''}

SELECTION RULES
- Lower self-reported capacity should generally mean fewer steps, less setup, less physical demand, fewer transitions, and less decision-making.
- Respect the stated location, time, and context.
- A saved activity can be preferred because it is familiar or intentionally saved, but do not call it effective unless actual ratings support that narrower claim.
- Relevant history may improve the choice. If there is no relevant visitor-reported history, do not pretend there is.
- Do not classify ordinary activities as universally restorative, numbing, healthy, unhealthy, productive, or unproductive.
- Do not prescribe medication, nutrition, hydration, sleep, breathing, exercise, or medical care as treatment.
- Do not invent exact clock times. Use only relative timing unless the visitor supplied an exact time in their own text.
- An activity that is genuinely low-demand still asks something of the visitor — say it takes very little setup, attention, or decision-making rather than claiming it takes none at all. Do not describe a suggestion using the word "zero" or "no" paired with setup, effort, decisions, attention, or thought, and do not say things like "you're not doing anything," "not tracking anything," "nothing is required," "asks nothing of you," or "requires nothing" — say "very little" or "barely any" instead, unless it is literally true that nothing at all is asked of the visitor.
- Do not predict how the visitor will feel afterward.
- "duration" is a SHORT time span only — "20 minutes," "10-15 minutes" — never a
  full sentence and never more than about 4 words. It renders next to the
  activity title in a narrow card; a long clause there breaks the layout.
  Anything beyond the plain time span (when to stop, how to use the time)
  belongs in "why_it_fits" or "done_when" instead.
- A concrete stopping point is required.

AUDIO/SCREEN RULE
If you recommend something audio-led specifically because the visitor wants less visual or screen demand, it must be genuinely usable without watching. Do not suggest visually oriented media — a show, a video, most streaming content — as though it were audio-only just because it happens to play sound.

ACTIVITY CHARACTERISTICS
Explain a recommendation through its observable characteristics: setup required, cognitive demand, physical demand, social demand, sensory demand, decision-making required, location compatibility, time flexibility. Do not describe the activity itself as more present, higher energy, activating, restorative, regulating, grounding, or a step up, unless the visitor explicitly asked for that quality or their own history supports that narrower description for that specific activity. Be confident about WHY an activity fits the constraints supplied. Be careful about claiming WHAT the activity will do to the person.

CONSTRAINT DIMENSIONS — the capacity score is context, not the whole picture
A visitor's overall 1-10 capacity score does not summarize every kind of capacity. Someone can report high overall capacity while separately having low tolerance for thinking, for social contact, for sensory input, for physical effort, or for making decisions — treat these as separate dimensions (cognitive, physical, social, sensory, decision-making, setup, mobility, location, time), not one number. Extract only what the visitor actually supplied for each; do not infer a dimension they never mentioned.

When a specific statement conflicts with the general score, the specific statement controls FOR THE DIMENSION IT NAMES — it does not override the rest of the score, and the rest of the score does not erase it either. Example: capacity 7/10, and the visitor says "I can't do anything that requires thinking" — overall capacity stays relatively high, but cognitive demand must stay low for this recommendation specifically. Do not average the two, do not let the higher number push a cognitively demanding activity through anyway, and do not invent a reason the two facts coexist (a bad answer invents a hidden split like "your body is fine, but your mind is exhausted" — a good answer just states both facts as given: "You rated your overall capacity 7/10 and also said you don't want anything that requires thinking"). Do not collapse the visitor into a single internal-state label ("high energy," "drained," "your head is full") unless they used that language themselves.

Match candidate activities against every constraint actually supplied, not just the overall score — a high capacity score alone does not establish physical, cognitive, social, or sensory tolerance; each needs its own supporting evidence from what the visitor said. When using history, compare on the dimension that matters today: a past low-capacity, lying-down session rated positively is evidence that lying-down activities work for this visitor, not evidence that a higher score today means a more demanding activity is warranted.

If two supplied constraints genuinely cannot both be satisfied, say so rather than silently picking one — name the conflict, offer the closest fit if one exists, and state plainly which constraint it doesn't fully meet.

Resolve conflicts in this order; a lower item may not override a higher one: (1) hard constraints — explicit "can't/must not," physical limitations, safety, an unavailable location or resource; (2) explicit preferences or exclusions the visitor stated; (3) a specific named domain limit ("nothing that requires thinking"); (4) time and location; (5) relevant visitor history; (6) the general capacity score; (7) generic activity ideas.

"read" should summarize the constraint profile the visitor actually supplied, not manufacture an interpretation of it — preserve their information rather than theorizing about them.

${oneOnly ? `Return ONLY valid JSON:
{
  "activity": "",
  "first_step": "",
  "duration": "A short time span only, e.g. '20 minutes' — never a full sentence.",
  "done_when": "",
  "history_note": "Empty unless history is genuinely essential to why this was chosen — do not include just because history exists."
}` : `Return ONLY valid JSON:
{
  "read": "One or two short sentences grounded only in current input.",
  "top_pick": {
    "activity": "",
    "why_it_fits": "",
    "first_step": "",
    "duration": "A short time span only, e.g. '20 minutes' — never a full sentence.",
    "done_when": ""
  },
  "alternatives": [
    { "activity": "", "why_it_fits": "", "duration": "A short time span only, e.g. '10-15 minutes'." }
  ],
  "history_note": "Only if relevant visitor-reported history materially affected the choice — changed what was picked, avoided a repeat, or changed the ranking. Otherwise empty. Do not mention history just because it exists."
}`}`;

      const parsed = await callClaudeWithRetry({
        model: MODELS.SMART,
        max_tokens: 1800,
        system: withLanguage(SYSTEM, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
        messages: [{ role: 'user', content: prompt }],
      }, { label: oneOnly ? 'PEP-JustDoThis' : 'PEP-RightNow' });

      if (!parsed || (oneOnly ? !parsed.activity : !parsed.top_pick?.activity)) {
        return res.status(500).json({ error: 'Could not generate a suggestion. Please try again.' });
      }
      return res.json(validateResult(parsed));
    }

    if (action === 'reflect') {
      const {
        activity,
        energy_before,
        energy_after,
        helpfulness,
        note,
        prior_same_activity,
      } = req.body;

      const prompt = `PEP — REFLECT ON AN ACTIVITY

The visitor tried:
${activity || 'activity not specified'}

Visitor report:
Energy before: ${Number.isFinite(energy_before) ? `${energy_before}/10` : 'not recorded'}
Energy after: ${Number.isFinite(energy_after) ? `${energy_after}/10` : 'not recorded'}
Helpfulness: ${Number.isFinite(helpfulness) ? `${helpfulness}/10` : 'not recorded'}
Note: ${note || 'none'}
Prior visitor-reported attempts of this same activity: ${JSON.stringify(compactHistory(prior_same_activity))}

RULES
- Report what the visitor recorded. Do not infer why it happened.
- If both before and after ratings exist, describe it as before-rating → after-rating (e.g. "went from 5 to 8, a 3-point rise"). Never convert that into what the activity did to them — banned phrasing: "gave you N points," "raised your energy," "restored N points," "produced a reliable lift."
- Never say an activity doubled energy or caused the change.
- One attempt can be worth remembering without becoming a pattern.
- If repeated ratings are genuinely similar, describe that carefully and at the activity level ("you rated this the same both times") — do not generalize into a claim about what kind of activity or trait works for the visitor.
- If repeated ratings vary, say they vary.
- Do not invent a mechanism or therapeutic explanation.
- Only include history_observation if the visitor's actual prior records genuinely add something — otherwise leave it empty. Do not fill it just because prior records exist.

Return ONLY valid JSON:
{
  "reflection": "1-2 concise sentences.",
  "history_observation": "Optional concise observation from actual prior same-activity records; empty if too little, mixed, or genuinely uninformative data."
}`;

      const parsed = await callClaudeWithRetry({
        model: MODELS.SMART,
        max_tokens: 900,
        system: withLanguage(SYSTEM, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
        messages: [{ role: 'user', content: prompt }],
      }, { label: 'PEP-Reflect' });

      if (!parsed?.reflection) return res.status(500).json({ error: 'Could not reflect on that activity. Please try again.' });
      return res.json(validateResult(parsed));
    }

    return res.status(400).json({ error: `Unknown PEP action: ${action}` });
  } catch (error) {
    console.error('[pep]', error);
    return res.status(500).json({ error: 'PEP could not complete that request. Please try again.' });
  }
});

module.exports = router;
