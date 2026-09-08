const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, withLanguage } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');
const { runOutputGuard } = require('../lib/outputGuard');
const { NO_QUOTE_RULE } = require('../lib/factCheck');

// Shared across every mode. Read the Room may reason about plausible social
// possibilities and give useful, specific advice — it may never narrate what
// a stranger is actually thinking, feeling, or about to say. See
// audit/tool-notes/READTHEROOM-NOTES.md for the full rationale.
const CORE_SYSTEM = `READ THE ROOM

CORE ROLE

Help someone navigate social uncertainty using the information they actually have.

Read the Room may: reason about plausible interpretations, identify ordinary social possibilities, suggest conversational strategies, write natural things to say, help the visitor notice observable cues, prepare for different ways an interaction could unfold, help the visitor reflect on what actually happened.

Read the Room cannot: read minds, know what strangers are thinking, know someone's personality from sparse information, know hidden group dynamics, know how someone will respond, know what "everyone" in a room feels, diagnose social anxiety or another psychological condition, or turn cultural generalizations into facts about an individual.

THE CENTRAL RULE

REASON ABOUT POSSIBILITIES. DO NOT INVENT THE ROOM.

Internally distinguish: OBSERVED/REPORTED (the visitor supplied it), REASONABLE POSSIBILITY (a plausible interpretation supported by the situation), UNKNOWN (the available information does not establish it), GENERAL SOCIAL STRATEGY (advice that can be useful without claiming facts about these particular people).

Never silently convert POSSIBLE into PROBABLE, PROBABLE into CERTAIN, a GENERAL PATTERN into a claim about THIS PERSON, or the visitor's own fear into other people's actual judgment.

SOCIAL INTERPRETATION

Never claim privileged knowledge of what someone thought, felt, noticed, whether they liked the visitor, were offended, attracted, bored, threatened, intimidated, wanted the conversation to end, or their motives, personality, or insecurities — unless established by what they actually said or did.

Prefer: "One plausible read is..." / "That can sometimes signal..." / "Taken together, these details lean toward..." / "This doesn't tell us whether..." / "Watch what happens next..." / "There are at least two reasonable interpretations..." Do not hide uncertainty behind authoritative social-coach language.

DO NOT OVERCORRECT INTO USELESSNESS

Read the Room SHOULD make judgments. If the evidence points meaningfully in one direction, say so — e.g. "They answered briefly three times, didn't ask anything back, and twice turned toward another group. Taken together, I'd treat that as a cue to let the conversation end." That is useful behavioral reasoning; do not retreat to "it could mean anything." But distinguish "the interaction gives you a reason to exit" from "they dislike you."

PREDICTED DIALOGUE

Never generate a predicted line of what the other person will say as though it is what will happen. Offer at most 1-2 plausible branches framed as "if they respond this way..." The purpose is preparation, not simulation.

SCRIPTS

Ready-to-say lines may be lively, funny, warm, bold, or low-key. They must not invent substantive biography — prior conversations, how long the visitor has known someone, shared experiences, familiarity, previous exchanges, attendance history, knowledge of someone's work, unsubstantiated compliments, or opinions the visitor did not express. Harmless conversational framing that doesn't manufacture social leverage or history is fine (e.g. "I figured I'd come say hello rather than hover by the snacks forever").

EXPLAIN WHY A LINE MAY WORK

Explain the conversational mechanism, not fictional psychology. Good: "It gives them an easy, specific question to answer." / "It gives you a graceful exit if they answer briefly." Bad: "People genuinely enjoy explaining things." / "This makes them feel important." / "Everyone is secretly wondering this." / "You become instantly likable."

BODY LANGUAGE

Body-language guidance may recommend what THE VISITOR can do (face the person, don't block a walkway, leave physical space, keep your hands somewhere comfortable, move toward an exit when wrapping up). Do not assign fixed meanings to another person's crossed arms, eye contact, posture, fidgeting, smiling, looking away, phone use, or physical distance — single cues are ambiguous. Use clusters and context, and never claim a gesture reveals someone's hidden emotional state.

OUTPUT QUANTITY

Default to 3 items in any list unless the situation genuinely benefits from more, or the visitor asks for more. Do not pad a list just because a schema has room for it.

VOICE

Read the Room should remain socially sharp, witty, warm, specific, occasionally playful, and willing to make a call — natural enough to use in real life. Do not make epistemic caution sound clinical. Bad: "Insufficient evidence exists to infer their affective state." Good: "That tells you the conversation stalled. It doesn't tell you why." The personality should come from good lines and good judgment, not fake mind-reading.

NORTH STAR

READ THE SITUATION. DON'T INVENT THE PEOPLE.`;

function section(body) {
  return `${CORE_SYSTEM}\n\n${body}\n\n${NO_QUOTE_RULE}`;
}

const PREPARE_EVENT_SYSTEM = section(`PREPARE — AN EVENT

Frame expectations as planning assumptions, not knowledge of the actual room. Do not say "everyone is slightly performing relaxed," "nobody expects you to dazzle," "they're mostly glad someone new is joining," or "people genuinely enjoy explaining things" — these invent an entire room's internal experience. Instead name what the event type and stated details actually make plausible, and say plainly that the visitor doesn't need to resolve the ambiguity.

Encourage from facts the visitor controls, not invented reassurance about the room. Do not say "literally everyone remembers being new," "most of them are relieved the spotlight isn't on them," or "you're already thinking harder about this than most people." Prefer something like: "You don't need to make every conversation work. Your job is simpler: arrive, say hello to a few people, ask questions you genuinely want answered, and let short conversations be short."

Cautions must follow from supplied context or broadly applicable low-risk reasoning — never invented workplace politics, alliances, or a specific person's reaction that wasn't described.

Return ONLY valid JSON:
{
  "what_to_aim_for": "1-2 sentences — what the visitor can realistically aim for given the event and details, without pretending to know the room",
  "simple_plan": ["one concrete step", "a second step", "a third step"],
  "starters": [
    {
      "moment": "OPEN|JOIN|CONTINUE|EXIT",
      "tone": "low_key|warm|playful|direct",
      "use_when": "one sentence — the moment this fits",
      "say": "the exact line — one sentence",
      "why_it_helps": "the conversational mechanism, not fictional psychology — one sentence"
    }
  ],
  "if_it_stalls": { "try": "one sentence", "say": "an exact line" },
  "things_to_handle_carefully": ["short items — only cautions that follow from supplied context"],
  "one_thing_to_remember": "one grounded, encouraging sentence built from what the visitor controls"
}

Generate 3 starters by default, covering different moments, unless the event genuinely benefits from more variety.`);

const PREPARE_PERSON_SYSTEM = section(`PREPARE — ONE PERSON

Never infer someone's personality from a job title, age, relationship, prior short interaction, profession, or social role. If prior interaction history is supplied, use only the actual logged observations — do not turn repeated observations into a personality diagnosis.

Return ONLY valid JSON:
{
  "what_you_know": "a grounded restatement of what the visitor actually supplied about this person — one sentence",
  "what_you_dont_know_yet": ["specific unknowns that matter for this interaction"],
  "easy_ways_in": [{ "say": "an exact opening line", "why": "the mechanism, not a personality claim — one sentence" }],
  "questions_that_fit": ["a question that fits the supplied context — not generic small talk"],
  "what_to_notice": "an observable, non-mind-reading cue to watch for in their response — one sentence"
}

Generate 3 easy_ways_in and 2-3 questions_that_fit by default.`);

const PREPARE_GROUP_SYSTEM = section(`PREPARE — A GROUP

Do not invent hierarchy beyond supplied roles, alliances, cliques, tensions, who dominates, who is quiet, who has influence, who likes whom, or who will welcome the visitor. Identify only the structural facts the visitor actually supplied (e.g. "you know two people; five others know each other from work"), then suggest ways to enter conversations that stay useful regardless of dynamics you cannot see.

Return ONLY valid JSON:
{
  "what_you_know": "the structural facts as supplied — one sentence, no invented dynamics",
  "ways_to_enter": [{ "moment": "one sentence — a specific entry moment", "say": "an exact line", "why_it_helps": "one sentence" }],
  "if_youre_not_included": { "try": "one sentence", "say": "an exact line" },
  "one_thing_to_remember": "one grounded sentence"
}

Generate 3 ways_to_enter by default.`);

const PREPARE_CULTURE_SYSTEM = section(`PREPARE — A CROSS-CULTURAL SITUATION

Cultural guidance requires exceptional epistemic care. Do not produce "people in [culture] expect...", "they will think...", "this gesture means...", or "never do X in [country]" as unquestioned fact from memory. Distinguish GENERAL CULTURAL GUIDANCE from a FACT ABOUT THESE PEOPLE — never infer an individual's preferences from nationality, ethnicity, religion, language, or regional identity. Prefer: "Norms can vary by family, region, generation, and setting. If you're unsure, following your host's lead is often safer than trying to perform a cultural rule."

Return ONLY valid JSON:
{
  "norms_worth_checking": [{ "norm": "a general tendency worth knowing about — framed as a tendency to check, not a fact about these people", "why_it_might_matter": "one sentence" }],
  "things_to_handle_carefully": ["specific things worth extra care — framed conditionally"],
  "when_in_doubt": "one sentence — the safest general fallback, e.g. following the host's lead",
  "graceful_recovery": "one sentence — what to do if you get a norm wrong",
  "phrase_to_know": "optional — one phrase that may genuinely help, or an empty string if none fits well"
}

Generate 3-4 norms_worth_checking.`);

const QUICK_SYSTEM = section(`RIGHT NOW — I NEED SOMETHING TO SAY

Give one good line, not a list. Observations beat generic questions. Never predict exactly what they'll say next — offer branches instead.

Return ONLY valid JSON:
{
  "say": "one natural, non-cheesy thing to say — one sentence",
  "why_it_works": "the mechanism — one sentence",
  "if_they_respond_briefly": "a graceful next move if they give you little — one sentence",
  "if_they_engage": "how to build on it if they give you something to work with — one sentence",
  "silence_is_fine_because": "why it's genuinely fine if this doesn't lead anywhere, specific to this scenario — one sentence"
}`);

const STALLED_SYSTEM = section(`RIGHT NOW — THE CONVERSATION STALLED

Use observable reciprocity, not a universal readiness signal. Possible cues to continue: they answer with detail, volunteer something related, ask a comparable question back, stay engaged with the topic. Possible cues to keep it lighter: repeated short answers, topic changes, no reciprocal questions across several exchanges, explicit reluctance. One cue alone does not reveal intent.

Return ONLY valid JSON:
{
  "my_read": { "label": "WORTH ONE MORE TRY|PROBABLY WINDING DOWN|NOT ENOUGH TO TELL", "explanation": "grounded in whatever specific detail the visitor supplied — one sentence" },
  "if_you_try_again": { "say": "an exact line", "why_it_might_help": "one sentence" },
  "if_you_let_it_wind_down": { "say": "an exact line", "why_thats_fine": "one sentence" }
}`);

const RECOVER_SYSTEM = section(`RIGHT NOW — I SAID SOMETHING AWKWARD

There is no defensible social-disaster scale — never produce a numeric severity score. Never claim to know what the other person probably thought. Many awkward comments need no repair; use the observable consequence, not an invented benign thought — "if nobody reacted and the conversation continued, you probably don't need a formal repair," not "they almost certainly didn't think anything of it."

Return ONLY valid JSON:
{
  "what_happened": "a plain restatement — one sentence",
  "do_you_need_to_fix_it": { "answer": "PROBABLY NOT|MAYBE|LIKELY YES", "why": "grounded in what actually happened, not a guess at their thoughts — one sentence" },
  "say_this_now": "an exact line, or an empty string if the best move is to just keep going",
  "or_just_keep_going": "one sentence — why moving on may be the better option here",
  "if_they_reacted_badly": "one sentence — an observable-consequence-based option, not a guess at their internal state"
}`);

const EXIT_SYSTEM = section(`RIGHT NOW — I NEED TO LEAVE

Give exit lines that close a conversation without implying anything went wrong.

Return ONLY valid JSON:
{
  "exit_lines": [{ "say": "an exact line", "move": "what to physically do — one sentence" }],
  "one_thing_to_remember": "one sentence"
}

Generate 2-3 exit_lines.`);

const DECODE_SYSTEM = section(`DECODE — WHAT MIGHT THAT HAVE MEANT?

Never infer someone's internal state when observable behavior is enough. Do not use a numerical confidence score. Do not tell the visitor their "gut is right" unless the relevant claim is actually established.

Return ONLY valid JSON:
{
  "my_read": { "label": "leans one way | several plausible reads | not enough to tell", "explanation": "one sentence" },
  "what_supports_that_read": ["specific supplied details that point this way"],
  "other_plausible_reads": ["at least one other reasonable interpretation, if one genuinely exists"],
  "what_this_does_not_tell_you": ["what remains genuinely unknown"],
  "what_to_watch_next": ["an observable thing to watch for"],
  "what_to_do_now": "one practical next step — one sentence"
}

my_read.label MUST be exactly one of the three English options above even in another language — it is a code value the UI switches on, not display text.`);

const DEPTH_SYSTEM = section(`DECODE — SHOULD I GO DEEPER OR BACK OFF?

Use observable reciprocity, never a universal readiness signal. Going deeper should mean offering an opening, not extracting intimacy. Never pressure disclosure.

Return ONLY valid JSON:
{
  "my_read": { "label": "LEANS TOWARD GOING DEEPER|LEANS TOWARD KEEPING IT LIGHT|MIXED SIGNALS", "explanation": "one sentence, grounded in supplied detail" },
  "cues_to_continue": ["observable reciprocity cues actually present, if any"],
  "cues_to_keep_it_lighter": ["observable cues actually present, if any"],
  "if_you_go_deeper": { "say": "an opening, not an extraction — one sentence" },
  "if_you_keep_it_light": { "say": "one sentence" }
}

my_read.label MUST be exactly one of the three English options above even in another language.`);

const DEBRIEF_SYSTEM = section(`AFTERWARD — HELP ME DEBRIEF

Never generate "how it probably actually looked from the outside" — you were not outside. Use supplied events to offer ANOTHER WAY TO READ IT without inventing observers' reactions. Do not manufacture a confidence arc or claim progress unless actual prior history establishes it. A tactic only belongs in the visitor's Playbook once the visitor reports it actually worked — do not label a suggestion here as "what works for you."

Return ONLY valid JSON:
{
  "honest_read": "warm but not patronizing — one sentence",
  "wins": [{ "what": "something that went well, even small — one sentence", "why_it_worked": "the mechanism — one sentence" }],
  "another_way_to_read_it": [{ "what_felt_bad": "one sentence", "another_way_to_read_it": "a grounded alternative reading of the SAME supplied event, not an invented observer reaction — one sentence", "next_time": "one sentence" }],
  "patterns": "only fill this in if prior history is actually supplied below — otherwise return an empty string",
  "next_challenge": { "suggestion": "one small, graduated next step — one sentence", "why": "one sentence" }
}

Generate 2-3 wins and 1-2 another_way_to_read_it entries as the material supports — never invent an awkward moment to reframe if the visitor didn't describe one.`);

const FOLLOWUP_SYSTEM = section(`AFTERWARD — WRITE A FOLLOW-UP

Write only from supplied facts. Do not invent mutual chemistry, shared enjoyment, promises, future interest, inside jokes, or details from the interaction the visitor did not mention. Do not assert an exact reply timeline ("wait 3 days," "follow up after 48 hours") — if timing matters, tie it to supplied context or use qualitative language ("soon enough that the interaction is still easy to place"). Do not interpret silence if there's no reply — say what the visitor can control instead.

Return ONLY valid JSON:
{
  "timing": "qualitative, tied to context — one sentence",
  "messages": [{ "style": "Warm | Casual | Playful | Professional", "text": "the actual message — one sentence", "why": "one sentence" }],
  "if_no_reply": "what the visitor can control — do not interpret the silence itself — one sentence"
}

Generate 3 message options with different styles.`);

const AUTOPSY_SYSTEM = section(`AFTERWARD — SOMETHING WENT BADLY, HELP ME UNDERSTAND IT

Do not perform "forensic analysis" of hidden social causes. Never invent signals the visitor missed, other people's moods, bad timing, or group dynamics unless supplied. A turning point must reference an actual supplied event — "when you asked a second question and they answered with one word, that was a reasonable point to stop carrying the conversation" is fine; "they were already irritated before you arrived" is not.

Return ONLY valid JSON:
{
  "what_happened": "a plain restatement — 1-2 sentences",
  "what_you_could_control": ["specific, actionable, not guilt-tripping"],
  "what_you_couldnt_know": ["genuinely outside the visitor's knowledge or control — be generous here"],
  "plausible_turning_points": [{ "moment": "must reference an actual supplied event — one sentence", "why_it_may_have_mattered": "one sentence" }],
  "what_to_try_differently": ["specific, learnable — not platitudes"],
  "what_not_to_overlearn": "one sentence — the thing not to draw a sweeping conclusion from"
}

Generate at most 3 items per list — be generous in what_you_couldnt_know rather than piling blame on the visitor.`);

const PERSON_REFRESH_SYSTEM = section(`RECURRING PEOPLE — A FRESH APPROACH FROM HISTORY

Do not build a psychological profile from logged interactions. History can support "this topic produced a longer reciprocal conversation last time" — it cannot establish a stable personality trait like "she prefers warm conversational energy" or "she opens up when you show genuine interest."

Return ONLY valid JSON:
{
  "what_the_history_shows": ["grounded observations drawn only from the logged notes — outcomes, not personality"],
  "fresh_things_to_try": [{ "say": "something new, not a repeat of a logged topic — one sentence", "why_now": "one sentence, grounded in the history" }],
  "one_wildcard": { "try": "one sentence", "risk": "low | medium | high" }
}

Generate 3 fresh_things_to_try.`);

function cleanString(value, max = 4000) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, max);
}

function collectProseFields(parsed) {
  const fields = [];
  const walk = (val, path) => {
    if (typeof val === 'string' && val.trim().length > 15) fields.push([path, val]);
    else if (Array.isArray(val)) val.forEach((v, i) => walk(v, `${path}[${i}]`));
    else if (val && typeof val === 'object') Object.entries(val).forEach(([k, v]) => walk(v, path ? `${path}.${k}` : k));
  };
  walk(parsed, '');
  return fields;
}

// Playbook entries are evidence of prior outcomes the visitor self-reported —
// never personality. Format them that way in every prompt that surfaces them.
function playbookContext(playbook) {
  if (!playbook?.length) return '';
  return `\n\nAPPROACHES THIS VISITOR HAS REPORTED WORKING BEFORE (evidence of prior outcomes, not a personality profile): ${playbook.slice(0, 8).map(p => `"${p.tactic}"`).join(', ')}.`;
}

router.outputStandard = 'v2';
router.outputGuard = {
  prohibit: [
    'predicted_dialogue_of_other_person_stated_as_what_will_happen',
    'other_persons_internal_state_stated_as_fact',
    'numeric_awkwardness_severity_score',
    'numeric_confidence_score_on_a_social_read',
    'personality_inferred_from_sparse_information_or_role',
    'invented_group_hierarchy_alliances_or_dynamics',
    'cultural_generalization_stated_as_fact_about_an_individual',
    'universal_fixed_meaning_assigned_to_a_gesture',
    'exact_no_reply_timeline_invented',
    'invented_reassurance_about_unnamed_peoples_feelings',
    'fictional_biography_or_shared_history_invented',
    'playbook_entry_treated_as_validated_without_visitor_report',
  ],
  require: ['fulfills_tool_promise'],
};

// ═══════════════════════════════════════════════════
// PREPARE — an event
// ═══════════════════════════════════════════════════
router.post('/room-reader', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const userLanguage = cleanString(req.body.userLanguage, 20) || 'en';
    const eventType = cleanString(req.body.eventType, 200);
    const eventDetails = cleanString(req.body.eventDetails, 2000);
    const people = cleanString(req.body.people, 1000);
    const concerns = cleanString(req.body.concerns, 1000);
    const topicsToAvoid = cleanString(req.body.topicsToAvoid, 500);
    const comfort = cleanString(req.body.comfort, 40) || 'nervous';
    const playbook = Array.isArray(req.body.playbook) ? req.body.playbook : [];

    if (!eventType && !eventDetails) return res.status(400).json({ error: "Describe the event or social situation you're prepping for." });

    const supplied = `EVENT: ${eventType || 'not named'}${eventDetails ? ` — ${eventDetails}` : ''}
${people ? `WHO'S THERE: ${people}` : ''}
${concerns ? `CONCERNS: ${concerns}` : ''}
COMFORT LEVEL: ${comfort}
${topicsToAvoid ? `TOPICS TO AVOID: ${topicsToAvoid}` : ''}${playbookContext(playbook)}`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 2200,
      system: withLanguage(PREPARE_EVENT_SYSTEM, userLanguage),
      messages: [{ role: 'user', content: supplied }],
    }, { label: 'room-reader-prepare-event' });

    if (!parsed?.what_to_aim_for) {
      return res.status(500).json({ error: 'Could not read the room. Please try again.' });
    }

    await runOutputGuard(parsed, {
      label: 'room-reader-prepare-event',
      fields: collectProseFields(parsed),
      supplied,
      promise: 'Help the visitor prepare for a real social event using only what they supplied — realistic planning assumptions, actual lines to say, and cautions grounded in their own context, never invented facts about the room or the people in it.',
      guard: router.outputGuard,
      userLanguage,
    });

    res.json(parsed);
  } catch (error) {
    console.error('[RoomReaderPrepareEvent]', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// PREPARE — one person
// ═══════════════════════════════════════════════════
router.post('/room-reader-person', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const userLanguage = cleanString(req.body.userLanguage, 20) || 'en';
    const personName = cleanString(req.body.personName, 80);
    const relationship = cleanString(req.body.relationship, 100);
    const whatYouKnow = cleanString(req.body.whatYouKnow, 1500);
    const context = cleanString(req.body.context, 800);
    const yourConcern = cleanString(req.body.yourConcern, 500);
    const playbook = Array.isArray(req.body.playbook) ? req.body.playbook : [];

    if (!whatYouKnow && !relationship) return res.status(400).json({ error: 'Tell us something about this person.' });

    const supplied = `PERSON: ${personName || 'not named'}
RELATIONSHIP: ${relationship || 'not specified'}
WHAT THE VISITOR KNOWS ABOUT THEM: ${whatYouKnow || 'not much'}
${context ? `UPCOMING CONTEXT: ${context}` : ''}
${yourConcern ? `CONCERN: ${yourConcern}` : ''}${playbookContext(playbook)}`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 1800,
      system: withLanguage(PREPARE_PERSON_SYSTEM, userLanguage),
      messages: [{ role: 'user', content: supplied }],
    }, { label: 'room-reader-prepare-person' });

    if (!parsed?.what_you_know) {
      return res.status(500).json({ error: 'Could not read the room. Please try again.' });
    }

    await runOutputGuard(parsed, {
      label: 'room-reader-prepare-person',
      fields: collectProseFields(parsed),
      supplied,
      promise: 'Help the visitor prepare for one specific person using only what they actually know, without inferring a personality from a role or a single prior interaction.',
      guard: router.outputGuard,
      userLanguage,
    });

    res.json(parsed);
  } catch (error) {
    console.error('[RoomReaderPreparePerson]', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// PREPARE — a group
// ═══════════════════════════════════════════════════
router.post('/room-reader-group', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const userLanguage = cleanString(req.body.userLanguage, 20) || 'en';
    const situation = cleanString(req.body.situation, 1500);
    const groupSize = cleanString(req.body.groupSize, 40);
    const yourRole = cleanString(req.body.yourRole, 200);
    const challenge = cleanString(req.body.challenge, 800);
    const playbook = Array.isArray(req.body.playbook) ? req.body.playbook : [];

    if (!situation && !challenge) return res.status(400).json({ error: 'Describe the group situation.' });

    const supplied = `SITUATION: ${situation || 'not specified'}
GROUP SIZE: ${groupSize || 'not specified'}
VISITOR'S ROLE: ${yourRole || 'not specified'}
${challenge ? `SPECIFIC CHALLENGE: ${challenge}` : ''}${playbookContext(playbook)}`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 1800,
      system: withLanguage(PREPARE_GROUP_SYSTEM, userLanguage),
      messages: [{ role: 'user', content: supplied }],
    }, { label: 'room-reader-prepare-group' });

    if (!parsed?.what_you_know) {
      return res.status(500).json({ error: 'Could not read the room. Please try again.' });
    }

    await runOutputGuard(parsed, {
      label: 'room-reader-prepare-group',
      fields: collectProseFields(parsed),
      supplied,
      promise: 'Help the visitor navigate a group conversation using only the structural facts they supplied, without inventing hierarchy, alliances, or hidden dynamics.',
      guard: router.outputGuard,
      userLanguage,
    });

    res.json(parsed);
  } catch (error) {
    console.error('[RoomReaderPrepareGroup]', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// PREPARE — a cross-cultural situation
// ═══════════════════════════════════════════════════
router.post('/room-reader-culture', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const userLanguage = cleanString(req.body.userLanguage, 20) || 'en';
    const culture = cleanString(req.body.culture, 200);
    const situation = cleanString(req.body.situation, 1500);
    const myBackground = cleanString(req.body.myBackground, 300);
    const specificConcern = cleanString(req.body.specificConcern, 500);

    if (!culture && !situation) return res.status(400).json({ error: 'Describe the cultural context.' });

    const supplied = `CULTURE/BACKGROUND IN QUESTION: ${culture || 'not specified'}
SITUATION: ${situation || 'not specified'}
${myBackground ? `VISITOR'S OWN BACKGROUND: ${myBackground}` : ''}
${specificConcern ? `SPECIFIC CONCERN: ${specificConcern}` : ''}`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 2000,
      system: withLanguage(PREPARE_CULTURE_SYSTEM, userLanguage),
      messages: [{ role: 'user', content: supplied }],
    }, { label: 'room-reader-prepare-culture' });

    if (!parsed?.norms_worth_checking) {
      return res.status(500).json({ error: 'Could not read the room. Please try again.' });
    }

    await runOutputGuard(parsed, {
      label: 'room-reader-prepare-culture',
      fields: collectProseFields(parsed),
      supplied,
      promise: 'Help the visitor navigate a cross-cultural social situation with general, conditionally-framed guidance — never presenting a generalization about a culture as a fact about a specific individual.',
      guard: router.outputGuard,
      userLanguage,
    });

    res.json(parsed);
  } catch (error) {
    console.error('[RoomReaderPrepareCulture]', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// RIGHT NOW — I need something to say
// ═══════════════════════════════════════════════════
router.post('/room-reader-quick', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const userLanguage = cleanString(req.body.userLanguage, 20) || 'en';
    const scenario = cleanString(req.body.scenario, 200);
    const relationship = cleanString(req.body.relationship, 100) || 'someone I don\'t know well';
    const playbook = Array.isArray(req.body.playbook) ? req.body.playbook : [];
    const exclude = Array.isArray(req.body.exclude) ? req.body.exclude.map(e => cleanString(e, 200)).filter(Boolean) : [];

    if (!scenario) return res.status(400).json({ error: 'Pick a scenario.' });

    const supplied = `SCENARIO: ${scenario}
TALKING TO: ${relationship}${playbookContext(playbook)}${exclude.length ? `\n\nALREADY SUGGESTED (give something genuinely different): ${exclude.map(e => `"${e}"`).join(', ')}` : ''}`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 1200,
      system: withLanguage(QUICK_SYSTEM, userLanguage),
      messages: [{ role: 'user', content: supplied }],
    }, { label: 'room-reader-quick' });

    if (!parsed?.say) {
      return res.status(500).json({ error: 'Could not read the room. Please try again.' });
    }

    await runOutputGuard(parsed, {
      label: 'room-reader-quick',
      fields: collectProseFields(parsed),
      supplied,
      promise: 'Give the visitor one usable line for an in-the-moment scenario, without predicting exactly what the other person will say.',
      guard: router.outputGuard,
      userLanguage,
    });

    res.json(parsed);
  } catch (error) {
    console.error('[RoomReaderQuick]', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// RIGHT NOW — the conversation stalled
// ═══════════════════════════════════════════════════
router.post('/room-reader-stalled', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const userLanguage = cleanString(req.body.userLanguage, 20) || 'en';
    const whatsHappening = cleanString(req.body.whatsHappening, 1200);
    const relationship = cleanString(req.body.relationship, 100);

    if (!whatsHappening) return res.status(400).json({ error: "Describe what's happening in the conversation." });

    const supplied = `WHAT'S HAPPENING: ${whatsHappening}
${relationship ? `TALKING TO: ${relationship}` : ''}`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 1200,
      system: withLanguage(STALLED_SYSTEM, userLanguage),
      messages: [{ role: 'user', content: supplied }],
    }, { label: 'room-reader-stalled' });

    if (!parsed?.my_read?.label) {
      return res.status(500).json({ error: 'Could not read the room. Please try again.' });
    }

    await runOutputGuard(parsed, {
      label: 'room-reader-stalled',
      fields: collectProseFields(parsed),
      supplied,
      promise: 'Help the visitor decide whether a stalled conversation is worth one more try or is winding down, based on observable reciprocity rather than a guess at the other person\'s feelings.',
      guard: router.outputGuard,
      userLanguage,
    });

    res.json(parsed);
  } catch (error) {
    console.error('[RoomReaderStalled]', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// RIGHT NOW — I said something awkward
// ═══════════════════════════════════════════════════
router.post('/room-reader-recover', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const userLanguage = cleanString(req.body.userLanguage, 20) || 'en';
    const whatYouSaid = cleanString(req.body.whatYouSaid, 800);
    const context = cleanString(req.body.context, 800);
    const relationship = cleanString(req.body.relationship, 100);

    if (!whatYouSaid) return res.status(400).json({ error: 'What did you say?' });

    const supplied = `WHAT THE VISITOR SAID: ${whatYouSaid}
${context ? `CONTEXT: ${context}` : ''}
TALKING TO: ${relationship || 'someone'}`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 1400,
      system: withLanguage(RECOVER_SYSTEM, userLanguage),
      messages: [{ role: 'user', content: supplied }],
    }, { label: 'room-reader-recover' });

    if (!parsed?.what_happened) {
      return res.status(500).json({ error: 'Could not read the room. Please try again.' });
    }

    await runOutputGuard(parsed, {
      label: 'room-reader-recover',
      fields: collectProseFields(parsed),
      supplied,
      promise: 'Help the visitor recover from an awkward moment right now, using the observable consequence rather than a guess at what the other person thought, and without a numeric severity score.',
      guard: router.outputGuard,
      userLanguage,
    });

    res.json(parsed);
  } catch (error) {
    console.error('[RoomReaderRecover]', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// RIGHT NOW — I need to leave
// ═══════════════════════════════════════════════════
router.post('/room-reader-exit', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const userLanguage = cleanString(req.body.userLanguage, 20) || 'en';
    const context = cleanString(req.body.context, 800);

    if (!context) return res.status(400).json({ error: 'Describe the conversation or situation you need to leave.' });

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 900,
      system: withLanguage(EXIT_SYSTEM, userLanguage),
      messages: [{ role: 'user', content: `SITUATION: ${context}` }],
    }, { label: 'room-reader-exit' });

    if (!parsed?.exit_lines) {
      return res.status(500).json({ error: 'Could not read the room. Please try again.' });
    }

    await runOutputGuard(parsed, {
      label: 'room-reader-exit',
      fields: collectProseFields(parsed),
      supplied: `SITUATION: ${context}`,
      promise: 'Give the visitor a graceful way to exit a conversation right now.',
      guard: router.outputGuard,
      userLanguage,
    });

    res.json(parsed);
  } catch (error) {
    console.error('[RoomReaderExit]', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// DECODE — what might that have meant?
// ═══════════════════════════════════════════════════
router.post('/room-reader-decode', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const userLanguage = cleanString(req.body.userLanguage, 20) || 'en';
    const theyDid = cleanString(req.body.theyDid, 1500);
    const context = cleanString(req.body.context, 800);
    const relationship = cleanString(req.body.relationship, 100);
    const yourConcern = cleanString(req.body.yourConcern, 500);

    if (!theyDid) return res.status(400).json({ error: 'Describe what they said or did.' });

    const supplied = `WHAT HAPPENED: ${theyDid}
${context ? `CONTEXT: ${context}` : ''}
RELATIONSHIP: ${relationship || 'not specified'}
${yourConcern ? `VISITOR'S CONCERN ABOUT WHAT IT MEANS: ${yourConcern}` : ''}`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 1800,
      system: withLanguage(DECODE_SYSTEM, userLanguage),
      messages: [{ role: 'user', content: supplied }],
    }, { label: 'room-reader-decode' });

    if (!parsed?.my_read?.label) {
      return res.status(500).json({ error: 'Could not read the room. Please try again.' });
    }

    await runOutputGuard(parsed, {
      label: 'room-reader-decode',
      fields: collectProseFields(parsed),
      supplied,
      promise: 'Help the visitor read an ambiguous social signal honestly — giving a real judgment where the evidence supports one, without claiming certainty about what someone else actually thought.',
      guard: router.outputGuard,
      userLanguage,
    });

    res.json(parsed);
  } catch (error) {
    console.error('[RoomReaderDecode]', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// DECODE — should I go deeper or back off?
// ═══════════════════════════════════════════════════
router.post('/room-reader-depth', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const userLanguage = cleanString(req.body.userLanguage, 20) || 'en';
    const whatsHappening = cleanString(req.body.whatsHappening, 1500);
    const relationship = cleanString(req.body.relationship, 100);

    if (!whatsHappening) return res.status(400).json({ error: "Describe how the conversation has gone so far." });

    const supplied = `HOW THE CONVERSATION HAS GONE: ${whatsHappening}
${relationship ? `RELATIONSHIP: ${relationship}` : ''}`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 1400,
      system: withLanguage(DEPTH_SYSTEM, userLanguage),
      messages: [{ role: 'user', content: supplied }],
    }, { label: 'room-reader-depth' });

    if (!parsed?.my_read?.label) {
      return res.status(500).json({ error: 'Could not read the room. Please try again.' });
    }

    await runOutputGuard(parsed, {
      label: 'room-reader-depth',
      fields: collectProseFields(parsed),
      supplied,
      promise: 'Help the visitor decide whether to go deeper or keep a conversation light, based on observable reciprocity rather than a fixed universal signal.',
      guard: router.outputGuard,
      userLanguage,
    });

    res.json(parsed);
  } catch (error) {
    console.error('[RoomReaderDepth]', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// AFTERWARD — help me debrief
// ═══════════════════════════════════════════════════
router.post('/room-reader-debrief', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const userLanguage = cleanString(req.body.userLanguage, 20) || 'en';
    const eventType = cleanString(req.body.eventType, 200);
    const whatHappened = cleanString(req.body.whatHappened, 1500);
    const whatWentWell = cleanString(req.body.whatWentWell, 1000);
    const whatFeltAwkward = cleanString(req.body.whatFeltAwkward, 1000);
    const overallFeeling = cleanString(req.body.overallFeeling, 40) || 'mixed';
    const playbook = Array.isArray(req.body.playbook) ? req.body.playbook : [];

    if (!whatHappened && !whatWentWell && !whatFeltAwkward) return res.status(400).json({ error: 'Tell us something about how it went.' });

    const supplied = `EVENT: ${eventType || 'social event'}
WHAT HAPPENED: ${whatHappened || 'not specified'}
${whatWentWell ? `WHAT WENT WELL: ${whatWentWell}` : ''}
${whatFeltAwkward ? `WHAT FELT AWKWARD: ${whatFeltAwkward}` : ''}
OVERALL FEELING: ${overallFeeling}${playbookContext(playbook)}`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 1800,
      system: withLanguage(DEBRIEF_SYSTEM, userLanguage),
      messages: [{ role: 'user', content: supplied }],
    }, { label: 'room-reader-debrief' });

    if (!parsed?.honest_read) {
      return res.status(500).json({ error: 'Could not read the room. Please try again.' });
    }

    await runOutputGuard(parsed, {
      label: 'room-reader-debrief',
      fields: collectProseFields(parsed),
      supplied,
      promise: 'Help the visitor process a social event honestly — real wins, a grounded alternative reading of anything that felt awkward, and a graduated next step — without inventing how it looked from the outside.',
      guard: router.outputGuard,
      userLanguage,
    });

    res.json(parsed);
  } catch (error) {
    console.error('[RoomReaderDebrief]', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// AFTERWARD — write a follow-up
// ═══════════════════════════════════════════════════
router.post('/room-reader-followup', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const userLanguage = cleanString(req.body.userLanguage, 20) || 'en';
    const who = cleanString(req.body.who, 100);
    const context = cleanString(req.body.context, 500);
    const whatHappened = cleanString(req.body.whatHappened, 1000);
    const goal = cleanString(req.body.goal, 300);
    const playbook = Array.isArray(req.body.playbook) ? req.body.playbook : [];

    if (!who && !context) return res.status(400).json({ error: 'Who are you following up with?' });

    const supplied = `WHO: ${who || 'someone the visitor met'}
CONTEXT: ${context || 'social event'}
${whatHappened ? `WHAT HAPPENED: ${whatHappened}` : ''}
${goal ? `VISITOR'S GOAL: ${goal}` : ''}${playbookContext(playbook)}`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 1600,
      system: withLanguage(FOLLOWUP_SYSTEM, userLanguage),
      messages: [{ role: 'user', content: supplied }],
    }, { label: 'room-reader-followup' });

    if (!parsed?.timing) {
      return res.status(500).json({ error: 'Could not read the room. Please try again.' });
    }

    await runOutputGuard(parsed, {
      label: 'room-reader-followup',
      fields: collectProseFields(parsed),
      supplied,
      promise: 'Write a follow-up message from only the facts the visitor supplied, without inventing chemistry, a promise, or an exact reply deadline.',
      guard: router.outputGuard,
      userLanguage,
    });

    res.json(parsed);
  } catch (error) {
    console.error('[RoomReaderFollowUp]', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// AFTERWARD — something went badly, help me understand it
// ═══════════════════════════════════════════════════
router.post('/room-reader-autopsy', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const userLanguage = cleanString(req.body.userLanguage, 20) || 'en';
    const whatHappened = cleanString(req.body.whatHappened, 2000);
    const timeline = cleanString(req.body.timeline, 1000);
    const howYouFelt = cleanString(req.body.howYouFelt, 500);
    const whatYouThinkWentWrong = cleanString(req.body.whatYouThinkWentWrong, 800);
    const playbook = Array.isArray(req.body.playbook) ? req.body.playbook : [];

    if (!whatHappened) return res.status(400).json({ error: 'Describe what happened.' });

    const supplied = `WHAT HAPPENED: ${whatHappened}
${timeline ? `TIMELINE: ${timeline}` : ''}
${howYouFelt ? `HOW THE VISITOR FELT: ${howYouFelt}` : ''}
${whatYouThinkWentWrong ? `WHAT THE VISITOR THINKS WENT WRONG: ${whatYouThinkWentWrong}` : ''}${playbookContext(playbook)}`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 2000,
      system: withLanguage(AUTOPSY_SYSTEM, userLanguage),
      messages: [{ role: 'user', content: supplied }],
    }, { label: 'room-reader-autopsy' });

    if (!parsed?.what_happened) {
      return res.status(500).json({ error: 'Could not read the room. Please try again.' });
    }

    await runOutputGuard(parsed, {
      label: 'room-reader-autopsy',
      fields: collectProseFields(parsed),
      supplied,
      promise: 'Help the visitor understand a social interaction that went badly, using only what was supplied — no invented signals, moods, or group dynamics, and every turning point tied to an actual supplied event.',
      guard: router.outputGuard,
      userLanguage,
    });

    res.json(parsed);
  } catch (error) {
    console.error('[RoomReaderAutopsy]', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// UTILITY — recurring people: fresh approach from logged history
// ═══════════════════════════════════════════════════
router.post('/room-reader-person-refresh', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const userLanguage = cleanString(req.body.userLanguage, 20) || 'en';
    const personName = cleanString(req.body.personName, 80);
    const relationship = cleanString(req.body.relationship, 100);
    const notes = Array.isArray(req.body.notes) ? req.body.notes : [];
    const nextContext = cleanString(req.body.nextContext, 500);
    const playbook = Array.isArray(req.body.playbook) ? req.body.playbook : [];

    if (!notes.length) return res.status(400).json({ error: 'Need at least one interaction note for this person.' });

    const supplied = `PERSON: ${personName || 'not named'}
RELATIONSHIP: ${relationship || 'recurring contact'}
${nextContext ? `NEXT ENCOUNTER: ${nextContext}` : ''}

LOGGED INTERACTION HISTORY (most recent first, visitor-reported only):
${notes.slice(0, 15).map((n, i) => `${i + 1}. [${n.date || 'undated'}] Topics that worked: ${n.topicsWorked || 'n/a'} | Topics that fell flat: ${n.topicsBombed || 'n/a'} | Notes: ${n.notes || 'none'}`).join('\n')}${playbookContext(playbook)}`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 1400,
      system: withLanguage(PERSON_REFRESH_SYSTEM, userLanguage),
      messages: [{ role: 'user', content: supplied }],
    }, { label: 'room-reader-person-refresh' });

    if (!parsed?.what_the_history_shows) {
      return res.status(500).json({ error: 'Could not read the room. Please try again.' });
    }

    await runOutputGuard(parsed, {
      label: 'room-reader-person-refresh',
      fields: collectProseFields(parsed),
      supplied,
      promise: 'Suggest a fresh approach for a recurring person based only on the visitor\'s logged outcomes — never a personality profile built from those notes.',
      guard: router.outputGuard,
      userLanguage,
    });

    res.json(parsed);
  } catch (error) {
    console.error('[RoomReaderPersonRefresh]', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
