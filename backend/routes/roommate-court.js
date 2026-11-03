const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, withLanguage, withLocaleContext, cleanJsonResponse } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');
const { logMetric } = require('../lib/metricsSink');
const { currentIsTestClient } = require('../lib/outputStandard');
const { NO_QUOTE_RULE } = require('../lib/factCheck');

const MEDIATOR_SYSTEM = `Help this person work through a household disagreement. Give a concise, even-handed answer using the accounts provided, with these sections:

1. The Read: a short assessment and why.
2. Where the Disagreement Is: each person's stated concern, where they differ, and any important unanswered question.
3. What to Try: practical options with a brief reason for each.
4. Start With This: a short, speakable opening.
5. Ask This: one useful question to ask the other person.
6. If They Push Back: a possible objection, clearly hypothetical, and a speakable reply.
7. A Concrete Proposal: words the visitor could say to propose a way forward.
8. If That Doesn't Work: a proportionate next option and when to use it.

Add a closing perspective only if it contributes something new. Avoid repeating points across sections. Present scripts as options, preserving the visitor's stated position. If contact would be unsafe, prioritize safety and omit conversation sections that would not help.

Treat a request as an agreement only when acceptance is supplied. Put only speakable words inside scripts; keep coaching outside them. Make the fallback address what remains unresolved rather than repeat the initial advice.`;

// One Luna call with the validated brief. No shared Claude policies or model
// checker/repair: schema validation only protects the existing renderer.
const MEDIATOR_MODEL = process.env.MODEL_ROOMMATE_COURT || 'gpt-6-luna';
const READ_LABELS = [
  'YOUR REQUEST LOOKS REASONABLE', 'THEIR CONCERN LOOKS REASONABLE TOO',
  'YOU MAY BE ASKING TOO MUCH', "THEIR RESPONSE DOESN'T ADDRESS THE PROBLEM",
  "YOU'RE TALKING PAST EACH OTHER", "THE EXPECTATION ISN'T CLEAR YET",
  'THIS NEEDS A FIRMER BOUNDARY', 'NOT ENOUGH TO TELL',
];
const prose = { type: 'string', minLength: 1 };
const optionalProse = { anyOf: [prose, { type: 'null' }] };
const list = items => ({ type: 'array', items });
const record = properties => ({ type: 'object', properties, required: Object.keys(properties), additionalProperties: false });
const MEDIATOR_SCHEMA = record({
  the_read: record({ label: { type: 'string', enum: READ_LABELS }, explanation: prose }),
  where_the_disagreement_is: record({
    your_stated_concern: prose, their_reported_concern: prose,
    collision: prose, unknowns_that_matter: list(prose),
  }),
  what_to_try: { ...list(record({ action: prose, why_it_may_help: prose })), minItems: 1 },
  conversation: { anyOf: [record({
    start_with_this: optionalProse, ask_this: optionalProse,
    if_they_push_back: list(record({ possible_response: prose, you_could_say: prose })),
    proposal: optionalProse,
  }), { type: 'null' }] },
  if_that_doesnt_work: { ...list(record({ next_step: prose, when_it_makes_sense: prose })), minItems: 1 },
  one_thing_not_to_lose_sight_of: optionalProse,
});

function matchesSchema(value, schema) {
  if (schema.anyOf) return schema.anyOf.some(s => matchesSchema(value, s));
  if (schema.type === 'null') return value === null;
  if (schema.type === 'string') return typeof value === 'string'
    && (!schema.minLength || value.trim().length >= schema.minLength)
    && (!schema.enum || schema.enum.includes(value));
  if (schema.type === 'array') return Array.isArray(value)
    && value.length >= (schema.minItems || 0) && value.every(v => matchesSchema(v, schema.items));
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    && schema.required.every(k => Object.prototype.hasOwnProperty.call(value, k))
    && Object.keys(value).every(k => Object.prototype.hasOwnProperty.call(schema.properties, k)
      && matchesSchema(value[k], schema.properties[k]));
}

function validateResult(value) {
  if (!matchesSchema(value, MEDIATOR_SCHEMA)) throw new Error('Invalid mediation response shape');
  return value;
}

const parseJson = text => JSON.parse(cleanJsonResponse(text));

// Publish only complete top-level values, never guessed/partially repaired JSON.
// This makes the read visible before the rest of the single response finishes.
function mediationDrafts(publish) {
  let text = '', cursor = 0, start = 0, depth = 0, inString = false, escaped = false;
  const draft = {};
  return chunk => {
    text += chunk;
    if (text.length > 250000) throw new Error('Mediation response too large');
    for (; cursor < text.length; cursor++) {
      const ch = text[cursor];
      if (inString) {
        if (escaped) escaped = false;
        else if (ch === '\\') escaped = true;
        else if (ch === '"') inString = false;
        continue;
      }
      if (ch === '"') { inString = true; continue; }
      if (ch === '{' || ch === '[') {
        if (depth === 0) start = cursor + 1;
        depth++;
      } else if (ch === '}' || ch === ']') depth--;
      if ((ch === ',' && depth === 1) || (ch === '}' && depth === 0)) {
        const field = text.slice(start, cursor).trim();
        start = cursor + 1;
        if (!field) continue;
        const entry = parseJson(`{${field}}`);
        const [key] = Object.keys(entry);
        if (!Object.prototype.hasOwnProperty.call(MEDIATOR_SCHEMA.properties, key)
          || !matchesSchema(entry[key], MEDIATOR_SCHEMA.properties[key])) throw new Error('Invalid mediation section');
        draft[key] = entry[key];
        if (draft.the_read) publish({ ...draft });
      }
    }
  };
}

async function mediateWithLuna(req, res, caseFile, userLanguage) {
  if (!process.env.OPENAI_API_KEY) return res.status(503).json({ error: 'This experience is temporarily unavailable. Please try again later.' });
  const controller = new AbortController();
  const abort = () => controller.abort();
  const timeout = setTimeout(abort, 90000);
  const started = Date.now();
  const streaming = req.body.progressive === true;
  const fixBody = value => res.locals?.fixBody ? res.locals.fixBody(value) : value;
  let heartbeat;
  const send = frame => {
    if (res.destroyed || res.writableEnded) return;
    // fixBody can mutate, so it receives an independent snapshot.
    if (frame.draft) frame = { ...frame, draft: fixBody(structuredClone(frame.draft)) };
    res.write(`data: ${JSON.stringify(frame)}\n\n`);
  };
  res.on('close', abort);
  if (streaming) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();
    heartbeat = setInterval(() => { if (!res.destroyed && !res.writableEnded) res.write(': waiting\n\n'); }, 10000);
  }
  try {
    const instructions = withLanguage(MEDIATOR_SYSTEM, userLanguage)
      + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion)
      + '\nUse the JSON fields for the sections above. Keep the_read.label as an English identifier. Use null for optional content that would not help.';
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MEDIATOR_MODEL, instructions, input: caseFile,
        reasoning: { effort: 'low' },
        text: { verbosity: 'low', format: { type: 'json_schema', name: 'roommate_mediation', strict: true, schema: MEDIATOR_SCHEMA } },
        max_output_tokens: 4096, stream: true, store: false,
      }),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`Luna HTTP ${response.status}`);
    if (!response.body) throw new Error('Missing Luna response stream');
    let buffer = '', output = '', completed = null;
    const decoder = new TextDecoder();
    const append = mediationDrafts(draft => { if (streaming) send({ draft }); });
    const consume = raw => {
      const data = raw.split('\n').filter(line => line.startsWith('data:')).map(line => line.slice(5).trim()).join('\n');
      if (!data || data === '[DONE]') return;
      const event = parseJson(data);
      if (event.type === 'response.output_text.delta') {
        output += event.delta;
        append(event.delta);
      } else if (event.type === 'response.completed') {
        completed = event.response;
      } else if (['response.failed', 'response.incomplete', 'response.refusal.delta', 'response.refusal.done', 'error'].includes(event.type)) {
        throw new Error(`Luna ${event.type}`);
      }
    };
    for await (const chunk of response.body) {
      buffer += decoder.decode(chunk, { stream: true });
      buffer = buffer.replace(/\r\n/g, '\n');
      if (buffer.length > 1000000) throw new Error('Luna frame too large');
      let end;
      while ((end = buffer.indexOf('\n\n')) !== -1) { consume(buffer.slice(0, end)); buffer = buffer.slice(end + 2); }
    }
    buffer += decoder.decode();
    if (buffer.trim()) consume(buffer);
    if (completed?.usage) {
      const u = completed.usage;
      const cacheRead = u.input_tokens_details?.cached_tokens || 0;
      const cacheWrite = u.input_tokens_details?.cache_write_tokens || 0;
      logMetric('llm_usage', {
        route: 'roommate-court', testClient: currentIsTestClient(), label: 'roommate-court-luna',
        model: completed.model || MEDIATOR_MODEL, input: u.input_tokens, output: u.output_tokens,
        cache_read: cacheRead, cache_write: cacheWrite, ms: Date.now() - started,
        usd: MEDIATOR_MODEL === 'gpt-6-luna'
          ? ((u.input_tokens - cacheRead - cacheWrite) * 0.10 + cacheRead * 0.01 + cacheWrite * 0.125 + u.output_tokens * 0.50) / 1000000
          : null,
      });
    }
    if (completed?.status !== 'completed' || !output) throw new Error('Incomplete Luna response');
    const result = validateResult(parseJson(output));
    if (!result.the_read?.explanation) throw new Error('Missing mediation read');
    if (streaming) { send({ draft: result }); send({ done: true }); res.end(); }
    else return res.json(result);
  } catch (error) {
    // No automatic retry, alternate provider, content repair, or raw provider
    // error text. A partial answer must not be marked complete.
    console.error('Roommate Court Luna:', error.message);
    if (!res.destroyed && !res.writableEnded) {
      const errorBody = { error: "Couldn't work through this. Please try again." };
      if (streaming) { send(errorBody); res.end(); }
      else res.status(502).json(errorBody);
    }
  } finally {
    clearTimeout(timeout);
    if (heartbeat) clearInterval(heartbeat);
    res.off('close', abort);
    controller.abort();
  }
}

const ASSIGNER_SYSTEM = `ROOMMATE COURT — CHORE ROULETTE

ROLE

Divide a supplied set of household chores among supplied household members. The goal is not to prove objective fairness. The goal is to produce a reasonable rotation using only the information available.

NO UNIVERSAL CHORE WEIGHTS

Do not assume "dishes = 2, bathroom = 3, vacuum = 1" or any universal effort value. The burden of a chore depends on home size, frequency, household standards, amount of mess, equipment, mobility/access needs, travel, and personal circumstances — unless supplied. If the visitor supplies load labels (LIGHTER / MEDIUM / HEAVIER), use those labels only as household-provided relative weights. If no load information is supplied, treat chores as unweighted tasks.

NO FAKE FAIRNESS SCORE

Never generate a percentage like "78% fair" or "100% fair" — there is no defensible denominator for household fairness. Replace "effort balance" with THIS ROUND, and, when history exists, ROTATION SO FAR. Allowed factual arithmetic: "Jane: 2 chores this round, Ralph: 1 chore this round," or, when visitor-supplied weights exist, "Jane: 4 household load points, Ralph: 3 household load points" — clearly labeled as a balancing device, not an objective measure of effort or fairness.

FIRST ROUND

Without history, distribute chores as evenly as practical. If visitor-supplied load weights exist, balance those supplied weights as reasonably as possible. If no weights exist, balance chore count and randomize among similarly balanced assignments. Do not say one person "has had it easy."

HISTORY

History may establish which chores someone received, how many chores they received, visitor-supplied relative load values, and repeated assignment of the same chore. History does NOT establish who worked harder, who resented a chore, who completed it well, who had more free time, or who was overburdened in life generally.

Use history to rotate assignments. Prefer avoiding repeated assignment of the same less-desirable/heavier chore when practical IF its relative burden was supplied. Do not impose "never give the same heavy chore twice" — sometimes repetition is preferred or practical.

ASSIGNMENT LOGIC

Priority: 1. assign every supplied chore, 2. keep number/load reasonably balanced, 3. use history to rotate recurring assignments, 4. avoid unnecessary repetition, 5. randomize among similarly reasonable alternatives. Do not optimize to an invented precision.

WHY THESE ASSIGNMENTS

Explain only from actual assignment data. Good: "Jane and Ralph had Bathroom and Mopping last round, so this round rotates those chores to Jimmy and Billy." Good: "With four chores and four people, everyone receives one." Bad: "This corrects the burden Jane and Ralph carried last round" — unless burden was actually supplied. Bad: "Jimmy and Billy should get heavier chores next time" — unless the household supplied relative weights and the rotation supports it.

SPIN AGAIN

Spin Again should generate another assignment that still respects the same constraints and history. It is not permission to discard balancing logic randomly.

${NO_QUOTE_RULE}`;

const REVIEW_SYSTEM = `ROOMMATE COURT — REVIEW AN ASSIGNMENT

The visitor says the current chore assignment does not work. Treat the complaint as NEW INFORMATION, not as a claim to put on trial.

Do not return a verdict like "complaint valid," "complaint invalid," "complaint upheld," or "assignment was fair." A complaint may reveal information that was not present when the assignment was generated.

Determine:
1. What new information did the visitor provide?
2. Does it create a real constraint?
3. Does it change the balancing information?
4. Should the assignment change?

Use only: current assignments, supplied history, supplied chore-load labels, and the new visitor information. Do not decide whether someone's subjective feeling is objectively justified.

Example good response: "The history already shows that you did Bathroom last round. Rotating it away from you is reasonable, so I've reassigned it." Or: "You've said Grocery Run isn't possible for Ralph. I didn't know that before, so I've treated it as a constraint and rebalanced the remaining chores."

Never answer: "Your complaint is not valid because the score says the assignment is fair."

${NO_QUOTE_RULE}`;

function cleanString(value, max = 8000) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, max);
}

function formatChoreHistory(hist) {
  if (!hist || !hist.length) return '';
  return `\n\nASSIGNMENT HISTORY (most recent first):\n${hist.map((round, i) => {
    const assignments = round.assignments.map(a =>
      `  ${a.roommate}: ${a.chores.map(ch => `${ch.name}${ch.load && ch.load !== 'UNSPECIFIED' ? ` (${ch.load})` : ''}`).join(', ')}`
    ).join('\n');
    return `Round ${hist.length - i}${round.date ? ` (${round.date})` : ''}:\n${assignments}`;
  }).join('\n\n')}`;
}

router.post('/roommate-court', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { action } = req.body;
    const userLanguage = cleanString(req.body.userLanguage, 20) || 'en';

    // ── WORK IT OUT ──
    if (action === 'mediate') {
      const dispute = cleanString(req.body.dispute, 6000);
      const yourSide = cleanString(req.body.yourSide, 4000);
      const theirSide = cleanString(req.body.theirSide, 4000);
      const duration = cleanString(req.body.duration, 100);
      const priorCommunication = cleanString(req.body.priorCommunication, 100);
      const livingSituation = cleanString(req.body.livingSituation, 100);
      // "Ask the other person" (src/components/InviteKit.js): theirSide was
      // written by them, and on an ask link the description was too.
      const theirOwnWords = req.body.theirOwnWords === true;
      const disputeByThem = req.body.disputeByThem === true;

      if (!dispute) return res.status(400).json({ error: "Describe what's going on." });

      const caseFile = `CASE FILE:
Living situation: ${livingSituation || 'not specified'}
Duration of issue: ${duration || 'not specified'}
Prior communication attempts: ${priorCommunication || 'not specified'}

WHAT'S GOING ON (${disputeByThem ? "the other person's description, written when they asked the visitor for their side" : "the visitor's account"}):
${dispute}

YOUR ADDITIONAL ACCOUNT:
${yourSide || 'not separately provided'}

${theirOwnWords ? "THEIR SIDE (written by the other person themselves, in their own words — give it the same weight as the visitor's side)" : "WHAT WOULD THEY SAY (the visitor's understanding of the other person's perspective — may be absent; do not treat absence as evidence of anything)"}:
${theirSide || 'not provided — the visitor does not know or did not guess'}`;
      return await mediateWithLuna(req, res, caseFile, userLanguage);
    }

    // ── CHORE ROULETTE: ASSIGN ──
    if (action === 'assign') {
      const roommates = Array.isArray(req.body.roommates) ? req.body.roommates.map(r => cleanString(r, 60)).filter(Boolean) : [];
      const chores = Array.isArray(req.body.chores) ? req.body.chores : [];
      const hist = Array.isArray(req.body.history) ? req.body.history : (Array.isArray(req.body.sessionHistory) ? req.body.sessionHistory : []);

      if (roommates.length < 2) return res.status(400).json({ error: 'Need at least 2 household members.' });
      if (!chores.length) return res.status(400).json({ error: 'Add at least 1 chore.' });

      const choreLines = chores.map(ch => {
        const name = cleanString(typeof ch === 'string' ? ch : ch?.name, 80);
        const load = typeof ch === 'object' && ch?.load ? cleanString(ch.load, 20).toUpperCase() : '';
        return `${name}${load && load !== 'UNSPECIFIED' ? ` (household-supplied load: ${load})` : ''}`;
      }).filter(Boolean);

      const prompt = `HOUSEHOLD:
Members: ${roommates.join(', ')}
Chores to assign: ${choreLines.join(', ')}
${formatChoreHistory(hist)}

Assign every chore listed above to a member. ${hist.length ? 'Use the history to rotate fairly.' : 'This is the first round — no history exists yet.'}

Return ONLY valid JSON matching this schema:
{
  "assignments": [
    { "roommate": "", "chores": [ { "name": "", "load": "UNSPECIFIED|LIGHTER|MEDIUM|HEAVIER" } ] }
  ],
  "this_round": {
    "chore_counts": { "Name": 1 },
    "load_totals": null
  },
  "why_these_assignments": "",
  "rotation_note": ""
}

Each chore's "load" must echo back exactly what was supplied for it above (or UNSPECIFIED if none was supplied) — never invent your own load judgment. Only populate load_totals (an object mapping each roommate to a summed count of their LIGHTER=1/MEDIUM=2/HEAVIER=3 chores) when at least one chore had a household-supplied load; otherwise leave it null. rotation_note is optional — omit it if there is nothing worth noting about rotation.`;

      const parsed = await callClaudeWithRetry({
        model: MODELS.SMART,
        max_tokens: 2200,
        system: withLanguage(ASSIGNER_SYSTEM, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
        messages: [{ role: 'user', content: prompt }],
      }, { label: 'roommate-court-chores-v2' });

      if (!parsed?.assignments) {
        return res.status(500).json({ error: 'Could not divide the chores. Please try again.' });
      }
      return res.json(parsed);
    }

    // ── CHORE ROULETTE: REVIEW AN ASSIGNMENT ──
    if (action === 'rebalance') {
      const currentAssignments = Array.isArray(req.body.currentAssignments) ? req.body.currentAssignments : [];
      const complaint = cleanString(req.body.complaint, 2000);
      const hist = Array.isArray(req.body.history) ? req.body.history : (Array.isArray(req.body.sessionHistory) ? req.body.sessionHistory : []);

      if (!complaint) return res.status(400).json({ error: "What's wrong with this assignment?" });
      if (!currentAssignments.length) return res.status(400).json({ error: 'No current assignment to review.' });

      const prompt = `CURRENT ASSIGNMENT:
${currentAssignments.map(a => `${a.roommate}: ${a.chores.map(ch => `${ch.name}${ch.load && ch.load !== 'UNSPECIFIED' ? ` (${ch.load})` : ''}`).join(', ')}`).join('\n')}
${formatChoreHistory(hist)}

WHAT THE VISITOR SAYS DOESN'T WORK:
${complaint}

Return ONLY valid JSON matching this schema:
{
  "what_changed": "the new information the visitor's complaint actually provided",
  "adjustment_needed": true,
  "revised_assignments": [ { "roommate": "", "chores": [ { "name": "", "load": "UNSPECIFIED|LIGHTER|MEDIUM|HEAVIER" } ] } ],
  "explanation": ""
}

If no adjustment is needed, set adjustment_needed to false and revised_assignments to null — but explanation must still say what the complaint told you and why it doesn't change anything, not merely assert the assignment was fair.`;

      const parsed = await callClaudeWithRetry({
        model: MODELS.SMART,
        max_tokens: 1800,
        system: withLanguage(REVIEW_SYSTEM, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
        messages: [{ role: 'user', content: prompt }],
      }, { label: 'roommate-court-review-v2' });

      if (parsed?.adjustment_needed === undefined) {
        return res.status(500).json({ error: 'Could not review that. Please try again.' });
      }
      return res.json(parsed);
    }

    return res.status(400).json({ error: `Unknown action: ${action}` });

  } catch (error) {
    console.error('RoommateCourt error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

router.outputStandard = 'v2';
router.outputGuard = {
  prohibit: [
    'fault_percentage_assigned', 'real_conflict_or_root_cause_invented', 'fictional_conversation_scripted',
    'proposal_treated_as_accepted_agreement', 'unsourced_tenancy_or_landlord_claim', 'universal_prevention_claim',
    'chore_load_invented_without_household_input', 'fake_fairness_score', 'complaint_declared_valid_or_invalid',
  ],
  require: ['fulfills_tool_promise'],
};

module.exports = router;
