const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, withLanguage, withLocaleContext } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');
const { runOutputGuard } = require('../lib/outputGuard');
// ════════════════════════════════════════════════════════════
// DECISION COACH v3 — Backend
// v1: decide
// v2: pros-cons, quick-decide, patterns, group-decide, followup
// v3: dna, devils-advocate, batch, chain
// ════════════════════════════════════════════════════════════

const NO_QUOTE_RULE = 'Never place a double-quote (") character inside any JSON string value — write quoted choices or phrases plainly or with single quotes, or it breaks the JSON.';

const CAPACITY = {
  overwhelmed: 'The user is TOTALLY STUCK. Simplest possible answer, minimal steps. No choices — just tell them what to do.',
  low: 'The user has LOW ENERGY. Low-effort, comfort-first. Steps require minimal willpower.',
  medium: 'The user has SOME BANDWIDTH. Moderate effort is fine. 3-4 steps ok.',
};

// ── v1: Main decide ──
// Everything the route was given, so the guard can tell a supplied constraint
// from an invented one. RECENT DECISIONS is spelled out because that is the
// field the model kept inflating into "your last three nights".
function suppliedFrom(body) {
  const { decisionNeeded, category, preferences, capacityLevel, recentDecisions, rejectedChoices } = body;
  return `WHAT THE VISITOR SUPPLIED, IN FULL:
The decision: ${decisionNeeded || '(none)'}
${category ? `Category: ${category}` : 'No category.'}
${preferences ? `Constraints and preferences they typed: ${preferences}` : 'They gave NO constraints or preferences.'}
${capacityLevel ? `Capacity they selected: ${capacityLevel}` : ''}
${recentDecisions?.length ? `Their previous CHOICES, as bare strings with no dates, no times of day and no frequency: ${recentDecisions.join(', ')}` : 'No previous choices on record.'}
${rejectedChoices?.length ? `Answers they already rejected: ${rejectedChoices.join(', ')}` : ''}

THAT IS THE WHOLE OF IT. There is no pantry, no fridge, no cupboard, no calendar, no record of what they ate or did on any night, no budget, no household, no schedule.

WHAT THIS TOOL IS. It commits to ONE answer and tells them how to start. Being decisive is the product — do NOT flag an answer for being firm, for choosing without hedging, or for recommending something the visitor did not name. Choosing is the job.

WHAT FAILS — the one rule: an assumed resource, possession, ingredient, past behaviour, preference, constraint or future reaction written as a supplied fact.
1. 'You have every ingredient already', 'you already own one' — possessions they never mentioned. A step needing an INCIDENTAL extra must be conditional: 'if you have soy sauce'. NOTE: the chosen thing itself is the decision, not an assumption — a step may name it outright. Do not flag 'cook the shrimp' in an answer whose choice is shrimp; that is the tool committing, which is what it is for.
2. 'Your last three nights', 'you have had pasta twice this week' — a record inflated out of a bare list of previous choices.
3. Alternatives written as though the visitor proposed them or had them available.
4. 'Future you will be pleased', 'you will not regret this' — a satisfaction that has not happened.`;
}

// STATE B means "I have not decided yet". Steps, ruled-out and a closing line
// all assert that the decision is settled, so if the model returns them
// alongside an open question it has contradicted itself. The question wins:
// it is the thing that says the call could still reverse.
function enforceOutputState(parsed) {
  if (!parsed || typeof parsed !== 'object') return parsed;
  const open = parsed.one_thing_that_could_change_this;
  const hasQuestion = !!(open && typeof open === 'object' && String(open.question || '').trim());
  if (!hasQuestion) {
    parsed.one_thing_that_could_change_this = null;
    return parsed;
  }
  const dropped = [];
  if (Array.isArray(parsed.execution_instructions) && parsed.execution_instructions.length) dropped.push('execution_instructions');
  if (Array.isArray(parsed.decision_made_for_you?.alternatives_eliminated) && parsed.decision_made_for_you.alternatives_eliminated.length) dropped.push('alternatives_eliminated');
  if (String(parsed.no_second_guessing || '').trim()) dropped.push('no_second_guessing');
  parsed.execution_instructions = [];
  if (parsed.decision_made_for_you) parsed.decision_made_for_you.alternatives_eliminated = [];
  parsed.no_second_guessing = '';
  if (dropped.length) console.log(`[DecisionCoach1] state B with an open question — dropped ${dropped.join(', ')}`);
  return parsed;
}

async function guardResult(parsed, body, label) {
  const fields = [];
  const walk = (val, path) => {
    if (typeof val === 'string' && val.trim().length > 15) fields.push([path, val]);
    else if (Array.isArray(val)) val.forEach((v, i) => walk(v, `${path}[${i}]`));
    else if (val && typeof val === 'object') Object.entries(val).forEach(([k, v]) => walk(v, path ? `${path}.${k}` : k));
  };
  walk(parsed, '');
  await runOutputGuard(parsed, {
    label,
    fields,
    supplied: suppliedFrom(body),
    promise: 'One specific decision, briefly justified against the constraints the visitor gave, with concrete steps to start it now.',
    guard: router.outputGuard,
    // no_second_guessing is deliberately empty in state B, so it cannot be
    // required here — the restore would undo enforceOutputState.
    requiredNonEmpty: ['decision_made_for_you.choice'],
    userLanguage: body.userLanguage,
    locale: withLocaleContext(body.userLocale, body.userCurrency, body.userRegion),
  });
  return parsed;
}

// The one grounding rule (owner, 2026-08-25). Everything this route knows
// arrives in the payload: the question, constraints/preferences, a capacity
// level, and up to five PREVIOUS CHOICE STRINGS. There is no pantry, no
// calendar, no record of nights. A stir-fry answer that said "you have every
// ingredient already" and "your last three nights" had invented both.
const GROUNDING_RULE = `GROUNDING — THE ONE RULE:
When explaining or executing a decision, never convert an assumed resource, possession, ingredient, past behaviour, preference, constraint or future reaction into a supplied fact. Optional additions must be explicitly conditional.

In practice:
- You do NOT know what they own or have in the house. Never write 'you have every ingredient already', 'you already own one', 'it is in your cupboard'. If a step needs something that was not supplied, mark it conditional: 'if you have soy sauce', 'assuming you have oil — otherwise dry-fry it'.
- RECENT DECISIONS is a list of previous choices and nothing else. It carries no dates, no nights, no frequency. 'Your last three nights', 'you have had pasta twice this week', 'you always pick the easy option' all invent a record you were not given.
- Alternatives you eliminate are your own reasoning, not things they were considering. Say why one loses against the supplied constraints; never imply they proposed it or had it to hand.
- Never predict how they will feel afterwards. 'Future you will be pleased', 'you will not regret this', 'you will thank yourself' claim a satisfaction that has not happened.
- Do not infer the overall condition, remaining lifespan, reliability or future performance of an item from the existence or the cost of a repair quote. A quote establishes that something can be repaired and roughly for how much. It does not establish that the item is sound, that it has years left, or that this is its only fault. The same holds for anything else priced: a valuation is not a verdict on quality.
- Being decisive requires none of this. A firm answer grounded only in what they typed is more convincing than a warm one built on invented detail.
- Do NOT hedge the decision itself. Choosing a dish means the main ingredient is part of the choice, not an assumption to qualify — 'garlic butter shrimp (if you have shrimp)' hands the decision back. Commit to the answer; make only the INCIDENTAL additions conditional: the oil, the acid, the garnish, the side.`;

router.post('/decision-coach', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { decisionNeeded, category, preferences, capacityLevel, recentDecisions, rejectedChoices, rejectionReason, userLanguage } = req.body;
    const lang = withLanguage('', userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion);
    if (!decisionNeeded) return res.status(400).json({ error: 'Describe the decision you need made' });

    const prompt = `You are Decision Coach — decisive, confident, warm. You MAKE the decision. ONE answer, not options.

DECISION NEEDED: ${decisionNeeded}
${category ? `CATEGORY: ${category}` : ''}
${preferences ? `CONSTRAINTS/PREFERENCES: ${preferences}` : ''}

CAPACITY: ${CAPACITY[capacityLevel] || CAPACITY.overwhelmed}

${recentDecisions?.length > 0 ? `RECENT DECISIONS (avoid repeating): ${recentDecisions.join(', ')}` : ''}
${rejectedChoices?.length > 0 ? `REJECTED (do NOT suggest these or similar): ${rejectedChoices.join(', ')}
${rejectionReason ? `REASON FOR LAST REJECTION: "${rejectionReason}" — factor this heavily into your new suggestion.` : ''}
IMPORTANT: New answer must be CLEARLY DIFFERENT — not a variation.` : ''}

${GROUNDING_RULE}

YOUR APPROACH:
1. Consider ALL constraints
2. Pick ONE SPECIFIC answer (not "pasta" but "spaghetti carbonara")
3. Give 2-4 concrete execution steps (what to do RIGHT NOW)
4. Explain why you eliminated alternatives
4a. TWO OUTPUT STATES. There are exactly two, and you must pick one.

   STATE A — DECISION IS READY. No missing fact could reasonably reverse your recommendation. Set one_thing_that_could_change_this to null and return the full output: choice, why, execution_instructions, alternatives_eliminated, no_second_guessing. This is the normal case.

   STATE B — ONE FACT COULD CHANGE THE CALL. A single specific, answerable fact could plausibly REVERSE your recommendation. Then:
     - choice is your call right now, stated plainly.
     - why is your reasoning from what was supplied.
     - one_thing_that_could_change_this holds the question, why_it_matters, if_answer_confirms and if_answer_changes_it.
     - AND YOU STOP. execution_instructions MUST be an empty array []. alternatives_eliminated MUST be an empty array []. no_second_guessing MUST be an empty string "".
   Telling someone to text their friend now, and in the same breath asking whether this is her only birthday, is a contradiction — the steps assume an answer you have just said you do not have. There is no closure to give until they answer, so give none.

4b. WHEN TO ASK AT ALL. Ask a follow-up ONLY when one specific, answerable missing fact could plausibly REVERSE the recommendation. Ask ONE fact at a time — never two joined by 'and'. It must be something the visitor can look up or already knows, not something they would have to guess: 'Is this her only birthday celebration, with no realistic opportunity to celebrate together another time?' is answerable. 'Would missing it matter to her in a lasting way?' asks them to predict another person's feelings, which is not a decision variable and not a fact. If nothing meets that bar — and most of the time nothing does — set the field to null and return the full output. Never manufacture a question to look thorough, and never ask for something already supplied. 'Should I renew my lease or move?' may hinge on the rent difference or the commute; 'should I go to the party tonight?' usually does not hinge on anything. Most decisions need no question at all — leave it null rather than manufacturing one, and never ask for something they already told you.
5. Add a "no second-guessing" message — emphatic and final, never a prediction about their future feelings

TONE: Confident, warm, slightly playful. Like a friend who is great at decisions.

WHAT NO-SECOND-GUESSING MEANS. You are taking responsibility for the call, not claiming the call is objectively correct. The register is: here is the call, here is why, here is what to do next, stop reopening it unless something important changes. It is NOT: I am certain this is right. Own the decision; do not dress it as a fact.

MONEY: when the input contains multiple money components (salary, bonus, match, equity), compute and cite the NET annual difference — never quote a single base-salary delta as the whole gap. Show the components inline so the reader can check the arithmetic.

OUTPUT (JSON only):
{
  "decision_made_for_you": {
    "choice": "The ONE specific answer. If one_thing_that_could_change_this is NOT null, this MUST carry the condition it rests on, in the same sentence — 'Repair the laptop — assuming the battery is included in or does not substantially increase the quoted cost', never a bare 'Repair the laptop'. A provisional call that reads as final is the failure this field exists to avoid. When there is no open question, state it plainly with no hedge.",
    "why": "1-2 sentences why this is right",
    "alternatives_eliminated": [] when one_thing_that_could_change_this is set — otherwise ["Alt 1 — why it lost", "Alt 2 — why it lost", "Alt 3 — why it lost"]
  },
  "execution_instructions": [] when one_thing_that_could_change_this is set — otherwise ["Step 1: ... — anything a step needs that was not supplied is named conditionally (if you have X), never assumed into their possession", "Step 2: ...", "Step 3: ..."],
  "one_thing_that_could_change_this": {
    "question": "ONE specific, answerable missing fact that could plausibly reverse the call, as a single plain question. Never two questions joined by and. Never a request to predict how another person will feel.",
    "why_it_matters": "one sentence on how the answer would change the call",
    "if_answer_confirms": "The call stands: <the same decision, in a few words>",
    "if_answer_changes_it": "That changes the call: <the OTHER decision, in a few words>. This must name a DIFFERENT outcome from if_answer_confirms — if both branches end at the same answer, the question could not have changed anything and does not belong in this field at all. Set the whole object to null instead."
  } | null,
  "no_second_guessing": "" when one_thing_that_could_change_this is set — there is nothing to close until they answer. Otherwise: emphatic, not predictive, and taking responsibility rather than claiming certainty. Close on the supplied constraints and point at the first action. Model: 'You are done deciding. Stir-fry tonight is the call. It fits the constraints you gave us. Go start the rice.' Never a claim about how they will feel later, and never a claim that the answer is objectively right."
}

CRITICAL: Return ONLY valid JSON. ${NO_QUOTE_RULE}${lang}`;

    const parsed = enforceOutputState(await callClaudeWithRetry({ model: MODELS.SMART, max_tokens: 4000, messages: [{ role: 'user', content: prompt }] }, { label: 'DecisionCoach1' }));
    res.json(await guardResult(parsed, req.body, 'DecisionCoach1'));
  } catch (e) { console.error('DecisionCoach decide:', e); res.status(500).json({ error: 'Something went wrong. Please try again.' }); }
});

// ════════════════════════════════════════════════════════════
// v2: PROS & CONS — Compare specific options
// ════════════════════════════════════════════════════════════
router.post('/decision-coach/pros-cons', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { options, context, preferences, capacityLevel, userLanguage } = req.body;
    const lang = withLanguage('', userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion);
    if (!options?.length || options.length < 2) return res.status(400).json({ error: 'Need at least 2 options' });

    const prompt = `You are Decision Coach — Pros & Cons mode. The user is stuck between specific options. Evaluate each, then PICK A WINNER. Be decisive.

OPTIONS TO COMPARE:
${options.map((o, i) => `${i + 1}. ${o}`).join('\n')}

${context ? `CONTEXT: ${context}` : ''}
${preferences ? `CONSTRAINTS: ${preferences}` : ''}
CAPACITY: ${CAPACITY[capacityLevel] || CAPACITY.overwhelmed}

For each option, evaluate:
- How well it fits their constraints
- Effort required
- Likely satisfaction
- Hidden downsides

Then PICK ONE WINNER. Be confident.


${GROUNDING_RULE}

OUTPUT (JSON only):
{
  "comparison": [
    {
      "option": "Option name",
      "score": 85,
      "pros": ["Pro 1", "Pro 2"],
      "cons": ["Con 1"],
      "fit_summary": "One sentence on constraint fit"
    }
  ],
  "winner": {
    "choice": "The winning option (exact text)",
    "why": "2-3 sentences on why this wins",
    "margin": "close" | "clear" | "landslide"
  },
  "tie_breaker": "If close: the one factor that tips it",
  "execution_instructions": ["Step 1: ...", "Step 2: ..."],
  "no_second_guessing": "Firm message about why the winner is right"
}

CRITICAL: Return ONLY valid JSON. ${NO_QUOTE_RULE}${lang}`;

    res.json(await callClaudeWithRetry({ model: MODELS.SMART, max_tokens: 4000, messages: [{ role: 'user', content: prompt }] }, { label: 'DecisionCoach2' }));
  } catch (e) { console.error('DecisionCoach pros-cons:', e); res.status(500).json({ error: 'Failed to compare' }); }
});

// ════════════════════════════════════════════════════════════
// v2: QUICK DECIDE — Instant one-tap decision
// ════════════════════════════════════════════════════════════
router.post('/decision-coach/quick', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { category, savedPreferences, recentDecisions, userLanguage } = req.body;
    const lang = withLanguage('', userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion);

    const prompt = `You are Decision Coach — QUICK MODE. The user tapped ONE button. Give them an instant, specific decision.

CATEGORY: ${category || 'anything'}
${savedPreferences ? `SAVED PREFERENCES: ${savedPreferences}` : ''}
${recentDecisions?.length > 0 ? `RECENT (avoid these): ${recentDecisions.join(', ')}` : ''}

Rules:
- Be HYPER-SPECIFIC (not "watch a movie" but "watch The Grand Budapest Hotel")
- Maximum 2 execution steps
- Assume lowest possible effort tolerance
- Surprise them — don't be predictable


${GROUNDING_RULE}

OUTPUT (JSON only):
{
  "decision_made_for_you": {
    "choice": "One hyper-specific answer",
    "why": "One punchy sentence"
  },
  "execution_instructions": ["Step 1: ...", "Step 2: ..."],
  "no_second_guessing": "One confident sentence"
}

CRITICAL: Return ONLY valid JSON. ${NO_QUOTE_RULE}${lang}`;

    res.json(await callClaudeWithRetry({ model: MODELS.SMART, max_tokens: 4000, messages: [{ role: 'user', content: prompt }] }, { label: 'DecisionCoach3' }));
  } catch (e) { console.error('DecisionCoach quick:', e); res.status(500).json({ error: 'Quick decide failed' }); }
});

// ════════════════════════════════════════════════════════════
// v2: PATTERNS — Analyze decision history
// ════════════════════════════════════════════════════════════
router.post('/decision-coach/patterns', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { userLanguage } = req.body;
    const raw = req.body.history || req.body.sessionHistory;
    const lang = withLanguage('', userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion);
    if (!Array.isArray(raw) || raw.length < 3) return res.status(400).json({ error: 'Need at least 3 decisions to look for patterns' });

    // Duplicates arrive from re-decides and from a re-render saving the same
    // result twice; counting one decision three times would invent a pattern.
    const seen = new Set();
    const history = raw.filter(h => {
      const k = `${String(h.question || '').trim().toLowerCase()}|${String(h.choice || '').trim().toLowerCase()}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });

    // Quick Decide answers were generated FOR the visitor from a category and
    // nothing else. They are decisions that happened; they are not evidence of
    // what this person prefers, and must never be read as such.
    const userEntered = history.filter(h => h.source !== 'quick');
    const quickCount = history.length - userEntered.length;

    const line = h => {
      const parts = [`"${h.question}" → "${h.choice}"`];
      if (h.category) parts.push(`[area: ${h.category}]`);
      if (Array.isArray(h.constraints) && h.constraints.length) parts.push(`(constraints they set: ${h.constraints.join(', ')})`);
      if (h.capacity) parts.push(`(capacity: ${h.capacity})`);
      return parts.join(' ');
    };

    const prompt = `Report what this decision history establishes. Nothing more.

DECISIONS THE VISITOR ENTERED THEMSELVES (${userEntered.length}) — the only ones that say anything about what they choose:
${userEntered.map((h, i) => `${i + 1}. ${line(h)}`).join('\n') || '(none)'}

QUICK DECIDE RESULTS (${quickCount}) — generated by the tool from a category alone. Do NOT use these as evidence of preference, personality or tendency. They are excluded on purpose.

WHAT YOU MAY SAY:
- What was chosen in the decisions above, described one at a time and attributed to the situation: "In the work decision, you chose not to add another commitment." "In the laptop decision, you chose repair over replacement."
- Which constraints the visitor actually set, and in how many decisions each appeared. Count only what is listed above.
- That there is not enough independent history to tell whether any of this is an enduring preference or simply what made sense in the situations they happened to bring here. Say that plainly, always, however much history there is.

WHAT YOU MAY NOT SAY:
- Any personality, archetype, type or trait. No "you are a X decider".
- Any claim about what they struggle with, avoid, fear, secretly want, or "really" think.
- Any gap between what they say and what they do.
- Any advice about how to decide better, any blind spot, any prescription, anything shareable.
- Any pattern drawn from fewer than two decisions. One instance is an instance.
- Anything about timing, speed or rejections as a character trait. Rejecting a suggestion is using the tool, not a flaw.

OUTPUT (JSON only):
{
  "tended_to_choose": ["one sentence per decision or per genuine repeat, each naming the situation it came from"],
  "recurring_constraints": ["'<constraint>' appeared in N decisions — only where N is 2 or more and the constraint is listed above"],
  "limits": "One or two sentences saying what this history cannot establish yet."
}

CRITICAL: Return ONLY valid JSON. ${NO_QUOTE_RULE}${lang}`;

    res.json(await callClaudeWithRetry({ model: MODELS.SMART, max_tokens: 2000, messages: [{ role: 'user', content: prompt }] }, { label: 'DecisionCoachPatterns' }));
  } catch (e) { console.error('DecisionCoach patterns:', e); res.status(500).json({ error: 'Pattern analysis failed' }); }
});

router.post('/decision-coach/group', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { decisionNeeded, people, extraContext, userLanguage } = req.body;
    const lang = withLanguage('', userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion);
    if (!decisionNeeded?.trim()) return res.status(400).json({ error: 'Describe the decision' });
    if (!people?.length || people.length < 2) return res.status(400).json({ error: 'Need at least 2 people' });

    const peopleSummary = people.map((p, i) =>
      `${i + 1}. ${p.name || `Person ${i + 1}`}: ${p.constraints || 'no specific constraints'}`
    ).join('\n');

    const prompt = `You are Decision Coach — GROUP MODE. Multiple people need to agree on one decision. Find the optimal compromise.

DECISION: ${decisionNeeded}
${extraContext ? `CONTEXT: ${extraContext}` : ''}

PEOPLE:
${peopleSummary}

YOUR APPROACH:
1. Map each person's constraints
2. Find the answer that satisfies the MOST constraints
3. Be specific about which constraints are satisfied vs compromised
4. If perfect consensus is impossible, say who compromises and why it's fair

TONE: Diplomatic but decisive. You're the friend who ends the 30-minute restaurant debate.


${GROUNDING_RULE}

OUTPUT (JSON only):
{
  "group_decision": {
    "choice": "The ONE specific answer for the group",
    "why": "2-3 sentences on why this is the best compromise"
  },
  "person_fit": [
    {
      "name": "Person name",
      "satisfied": ["Constraint met", "Another met"],
      "compromised": ["Constraint they bend on"],
      "happiness": 85
    }
  ],
  "overall_satisfaction": 80,
  "execution_instructions": ["Step 1: ...", "Step 2: ..."],
  "diplomatic_pitch": "How to present this to the group so everyone feels heard (2-3 sentences)",
  "no_second_guessing": "Firm message to the group"
}

CRITICAL: Return ONLY valid JSON. ${NO_QUOTE_RULE}${lang}`;

    res.json(await callClaudeWithRetry({ model: MODELS.SMART, max_tokens: 4000, messages: [{ role: 'user', content: prompt }] }, { label: 'DecisionCoach5' }));
  } catch (e) { console.error('DecisionCoach group:', e); res.status(500).json({ error: 'Group decide failed' }); }
});

// ════════════════════════════════════════════════════════════
// v2: FOLLOW-UP — Did you do it? What happened?
// ════════════════════════════════════════════════════════════
router.post('/decision-coach/followup', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { originalDecision, outcome, actualChoice, satisfaction, userLanguage } = req.body;
    const lang = withLanguage('', userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion);
    if (!originalDecision || !outcome) return res.status(400).json({ error: 'Missing decision or outcome' });

    // outcome values: did_it | didnt_do_it | changed
    const prompt = `You are Decision Coach — FOLLOW-UP mode. Check in on a past decision.

ORIGINAL DECISION: ${originalDecision}
OUTCOME: ${outcome}
${outcome === 'changed' && actualChoice ? `WHAT THEY DID INSTEAD: ${actualChoice}` : ''}
${satisfaction ? `SATISFACTION: ${satisfaction}/5` : ''}

${outcome === 'did_it' ? `
They followed through! Respond with:
- Validation (they made a good call)
- What this tells them about their preferences (useful for future decisions)
- One-sentence encouragement for next time` : ''}

${outcome === 'didnt_do_it' ? `
They didn't follow through. DON'T shame them. Instead:
- Gently explore what got in the way (decision fatigue? social pressure? secretly didn't want it?)
- What this reveals about their real preferences
- One small thing they could do differently next time` : ''}

${outcome === 'changed' ? `
They did something different! This is GOLD DATA. Analyze:
- Why the pivot? What does the actual choice reveal about what they really wanted?
- Gap between what they asked for and what they chose — what does that mean?
- How to use this insight for better future decisions` : ''}

OUTPUT (JSON only):
{
  "response": "2-4 sentences. Personal, warm, insightful. Not generic.",
  "insight": "One sentence about what this reveals about their decision-making",
  "preference_learned": "One specific preference to remember for future decisions (e.g. 'You prefer familiar comfort over adventure when tired')",
  "encouragement": "One sentence for next time"
}

CRITICAL: Return ONLY valid JSON. ${NO_QUOTE_RULE}${lang}`;

    res.json(await callClaudeWithRetry({ model: MODELS.SMART, max_tokens: 800, messages: [{ role: 'user', content: prompt }] }, { label: 'DecisionCoach6' }));
  } catch (e) { console.error('DecisionCoach followup:', e); res.status(500).json({ error: 'Follow-up failed' }); }
});

// ════════════════════════════════════════════════════════════
// v3: DECISION DNA — Deep psychological profile
// ════════════════════════════════════════════════════════════
router.post('/decision-coach/devils-advocate', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { decisionNeeded, gutInstinct, preferences, userLanguage } = req.body;
    const lang = withLanguage('', userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion);
    if (!decisionNeeded?.trim()) return res.status(400).json({ error: 'Describe the decision' });
    if (!gutInstinct?.trim()) return res.status(400).json({ error: 'Share your gut instinct first' });

    const prompt = `You are Decision Coach — DEVIL'S ADVOCATE mode.

The user is deciding: "${decisionNeeded}"
Their gut says: "${gutInstinct}"
${preferences ? `Their constraints: ${preferences}` : ''}

Your job:
1. Play devil's advocate AGAINST their gut instinct. Give 2-3 genuine reasons their gut might be wrong.
2. Then VALIDATE their gut. Explain why, despite those counterarguments, their instinct is probably right (or wrong, if it genuinely is).
3. Give a final verdict: should they trust their gut or override it?

Be honest. If their gut is actually wrong given their constraints, say so. If it's right, validate it powerfully.

The insight: "You already knew the answer. You just needed someone to say it's okay." — OR — "Your gut is leading you astray this time. Here's why."


${GROUNDING_RULE}

OUTPUT (JSON only):
{
  "case_against": ["Reason 1 against their gut", "Reason 2", "Reason 3"],
  "case_for": ["Reason 1 for their gut", "Reason 2"],
  "verdict": "trust_gut" | "override_gut",
  "verdict_explanation": "2-3 sentences. Personal, direct.",
  "the_real_answer": "The specific answer they should go with (either their gut or an override)",
  "permission_slip": "One sentence of permission/validation. The thing they need to hear.",
  "execution_instructions": ["Step 1: ...", "Step 2: ..."]
}

CRITICAL: Return ONLY valid JSON. ${NO_QUOTE_RULE}${lang}`;

    res.json(await callClaudeWithRetry({ model: MODELS.SMART, max_tokens: 4000, messages: [{ role: 'user', content: prompt }] }, { label: 'DecisionCoach8' }));
  } catch (e) { console.error('DecisionCoach devils-advocate:', e); res.status(500).json({ error: "Devil's advocate failed" }); }
});

// ════════════════════════════════════════════════════════════
// v3: BATCH DECIDE — Pre-decide multiple at once
// ════════════════════════════════════════════════════════════
router.post('/decision-coach/batch', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { category, count, preferences, recentDecisions, userLanguage } = req.body;
    const lang = withLanguage('', userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion);
    const n = Math.min(count || 5, 7);

    const prompt = `You are Decision Coach — BATCH MODE. Pre-decide ${n} separate answers for the same category so the user doesn't have to think about it all week.

CATEGORY: ${category || 'dinner'}
${preferences ? `CONSTRAINTS: ${preferences}` : ''}
${recentDecisions?.length > 0 ? `RECENT (avoid these): ${recentDecisions.join(', ')}` : ''}

Rules:
- Generate each choice independently enough to give real variety. ${n} answers that are variations on one idea are one answer repeated.
- Each must be specific enough to act on without further thought.
- Mix it up: some easy, some slightly adventurous.
- 1 execution step each (keep it fast).
- Label each for the day (Day 1, Day 2, etc.).
- Use ONLY the supplied preferences and constraints as facts. Do not invent available ingredients, possessions, schedule commitments, facilities, weather or any other circumstance. If a choice needs something that was not supplied, say so conditionally in the step rather than assuming they have it.

DECLINE WHEN PRE-DECIDING IS THE WRONG THING TO DO. This feature delegates low-stakes recurring choices. Some requests must not be pre-decided at all — anything medical or involving medication or dosage, anything financial with real consequences, anything legal, anything about another person's care, and anything where the right answer depends on information only available on the day. Do not force such a request into a schedule. Return an empty decisions array and put one plain sentence in decline_reason saying why this is not something to decide a week ahead, and what to use instead.


${GROUNDING_RULE}

OUTPUT (JSON only):
{
  "decline_reason": "null normally. One plain sentence ONLY when this request should not be pre-decided at all — in that case decisions is [].",
  "decisions": [
    {
      "day": 1,
      "label": "Monday" (or just "Day 1"),
      "choice": "Hyper-specific answer",
      "why": "One sentence",
      "step": "One execution step"
    }
  ],
  "variety_note": "One sentence about the variety mix"
}

CRITICAL: Return ONLY valid JSON. ${NO_QUOTE_RULE}${lang}`;

    const batch = await callClaudeWithRetry({ model: MODELS.SMART, max_tokens: 4000, messages: [{ role: 'user', content: prompt }] }, { label: 'DecisionCoachBatch' });
    // The model writes the WORD "null" into this field, and every such word is
    // truthy in JS, so a decline banner rendered under five good suggestions.
    const blank = v => !v || ['null', 'none', 'n/a', 'na', '-', 'undefined'].includes(String(v).trim().toLowerCase());
    if (batch && blank(batch.decline_reason)) batch.decline_reason = null;
    res.json(batch);
  } catch (e) { console.error('DecisionCoach batch:', e); res.status(500).json({ error: 'Batch decide failed' }); }
});

// ════════════════════════════════════════════════════════════
// v3: DECISION CHAIN — Linked cascading decisions
// ════════════════════════════════════════════════════════════
router.post('/decision-coach/chain', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { primaryDecision, preferences, capacityLevel, userLanguage } = req.body;
    const lang = withLanguage('', userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion);
    if (!primaryDecision?.trim()) return res.status(400).json({ error: 'Describe the primary decision' });

    const prompt = `You are Decision Coach — CHAIN MODE. One decision triggers others. Solve the WHOLE chain.

PRIMARY DECISION: "${primaryDecision}"
${preferences ? `CONSTRAINTS: ${preferences}` : ''}
CAPACITY: ${CAPACITY[capacityLevel] || CAPACITY.overwhelmed}

Your job:
1. Make the primary decision (be specific)
2. Identify 1-3 DOWNSTREAM decisions that depend on the primary choice
3. Solve each downstream decision too
4. Present as a decision tree: if primary = X, then downstream 1 = Y, downstream 2 = Z

This eliminates cascading paralysis — solve it all at once.


${GROUNDING_RULE}

OUTPUT (JSON only):
{
  "primary": {
    "choice": "The primary decision answer",
    "why": "1 sentence"
  },
  "downstream": [
    {
      "question": "The downstream decision that follows",
      "depends_on": "What about the primary decision triggers this",
      "choice": "The answer",
      "step": "One execution step"
    }
  ],
  "full_plan": "2-3 sentences describing the complete chain as a coherent plan",
  "execution_instructions": ["Step 1: Primary action", "Step 2: First downstream", "Step 3: Next downstream"],
  "no_second_guessing": "Firm message about trusting the whole chain"
}

CRITICAL: Return ONLY valid JSON. ${NO_QUOTE_RULE}${lang}`;

    res.json(await callClaudeWithRetry({ model: MODELS.SMART, max_tokens: 4000, messages: [{ role: 'user', content: prompt }] }, { label: 'DecisionCoach10' }));
  } catch (e) { console.error('DecisionCoach chain:', e); res.status(500).json({ error: 'Decision chain failed' }); }
});

router.outputStandard = 'v2';
// decision-coach-v2. Reviewed 2026-08-25. Deciding firmly is the product and
// is not guarded. The guard covers one thing: an assumption written as a fact
// the visitor supplied.
router.outputGuard = {
  prohibit: [
    'assumed_possession_stated_as_fact',      // 'you have every ingredient already'
    'unsupplied_ingredient_or_resource',      // a step needing something never mentioned, unconditionally
    'past_behaviour_invented_from_history',   // 'your last three nights' from a bare list of choices
    'alternative_attributed_to_the_visitor',
    'predicted_future_reaction',              // 'future you will be pleased'
    'condition_inferred_from_a_quote',        // 'not at end of life' from a repair price
    'committing_step_before_the_open_question',
  ],
  require: [
    'one_specific_answer',
    'reasoning_traceable_to_supplied_constraints',
    'fulfills_tool_promise',
  ],
};

module.exports = router;
