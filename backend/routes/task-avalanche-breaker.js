const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, withLanguage, withLocaleContext } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

// Ground-up rebuild (2026-09-12), installed from an owner-supplied rewrite
// per audit/REWRITE-INSTALL-KIT.md. Replaces a nine-plus-field micro-task
// generator (quick modes, an energy-level slider driving task count/
// complexity, habit stacking, an accountability partner, a reorder action,
// a raw anthropic.messages.create call with hand-rolled JSON repair/manual
// regex parsing, and 25-task gamified lists with points and momentum
// checkpoints) with one job: find ONE useful foothold in an overwhelming
// project, sized to the time the visitor actually has right now — the
// tool exists because the visitor already has too much list, not because
// they need a longer one.
//
// CORE REASONING rewrite (2026-09-13, owner-supplied): the v2 CONTRACT above
// still reasoned from "make it small" — a first move that fit the time
// budget and wasn't fake progress, but nothing forced the model to ask
// what is actually blocking the visitor before picking a move. That let it
// devolve into a plain task-size-reducer no different from the old design's
// premise, just with fewer tasks. The replacement CONTRACT below reasons
// explicitly about the blocker (missing information / an unresolved
// decision / unclear scope / too many simultaneous choices / an
// irreversible decision faced too early / lack of usable structure /
// excessive size) before choosing a foothold, and requires the foothold to
// pass a "so what is now better" test — completing it must leave a
// specific, statable thing easier, not just "the visitor has started" or
// "the project feels smaller." Old language about micro-tasks, five-minute
// actions, momentum, and quick wins is deliberately gone — it's exactly
// the framing that let the model default to ceremonial busywork (open the
// document, write the title, set a timer) over real progress.
//
// PATH AHEAD addition (2026-09-13, owner-supplied): after_that was
// previously just "meet the same standard as first_move" with no
// requirement that the items relate to EACH OTHER — three individually
// fine footholds could still be a disconnected grab-bag rather than a
// sequence. Now capped at 2 (was 3) and required to be one coherent
// sequence: each later foothold must follow from completing the prior one
// and keep addressing the SAME blocker identified in step 1, not drift to
// a different aspect of the project. Also explicit: the whole sequence is
// generated in one shot before the visitor does anything, so later
// footholds must not be phrased as if the model observed how the first
// one went — "once this is done" framing, never "since you finished
// that...". The frontend already only reveals after_that behind "See the
// path ahead" and advances through it via "I did it — what's next?"
// without a second API call, so no frontend change was needed for either
// of those two behaviors.
//
// GROUND THE FOOTHOLD correction (2026-09-13, owner-supplied, after three
// live tests): PATH AHEAD's coherent-sequence requirement fixed
// disconnected footholds, but surfaced a sharper failure — the model
// invents project STRUCTURE (stakeholder positions, which variables
// "actually constrain everything else," that categorizing is "what makes
// the task feel endless") in order to make its foothold sound like it
// follows from a chain of reasoning, when nothing the visitor supplied
// established that structure. The wedding example was the clearest case:
// "guest count and budget are the two variables that actually constrain
// everything else... available dates all flow from them" is a plausible
// EVENT-PLANNING MODEL, not a fact about this couple's wedding — nothing
// in "venue, date, guest list, budget, and caterer all depend on each
// other" establishes that those two specifically are the root variables.
// Added a GROUND THE FOOTHOLD section requiring every dependency,
// stakeholder position, and cause claimed in the reasoning to trace back
// to something the visitor actually said, with an explicit test ("what in
// the visitor's input establishes this?") and the fallback that the
// foothold itself may be the act of DISCOVERING the missing structure
// rather than asserting a guess at it. Also removed the time-budget
// concept entirely (frontend no longer asks for or sends it) and added an
// AVOID FALSE PRECISION rule against inventing durations/quantities the
// visitor never supplied — the receipts example's unprompted "Spend the
// next 5 minutes" was this same failure mode applied to time instead of
// structure.
router.outputStandard = 'v2';
router.outputGuard = {
  prohibit: [
    'first_move_missing_or_empty',
    'more_than_two_later_footholds',
    'malformed_later_foothold_passed_through_unfiltered',
    // Prompt-enforced, not code-checkable — see CORE REASONING steps 1-6,
    // PATH AHEAD, and GROUND THE FOOTHOLD: a foothold whose why_this could
    // accompany almost any project (too generic), a blocker the visitor
    // never implied, a later foothold that drifts from the blocker the
    // first move addressed, one phrased as if it were written after
    // observing the first move's outcome, an invented dependency/
    // stakeholder-position/cause the visitor's input does not establish,
    // or a fabricated duration/quantity the visitor never supplied.
    'ceremonial_action_disguised_as_meaningful_progress',
    'invented_blocker_not_implied_by_visitor',
    'later_foothold_disconnected_from_the_same_blocker',
    'invented_project_structure_stated_as_fact',
    'false_precision_not_supplied_by_visitor',
  ],
  require: ['fulfills_tool_promise'],
};

const CONTRACT = `
You are Task Avalanche Breaker.

PURPOSE
Help someone who has a real project but cannot find a manageable place to begin.

NORTH STAR
FIND THE FIRST MOVE THAT MAKES THE REST EASIER —
WITHOUT INVENTING WHY THE PROJECT WORKS THE WAY IT DOES.

CORE REASONING
Your job is NOT to make a large task arbitrarily smaller.
Your job is to determine the most useful place to begin.

Before producing the answer, reason about the visitor's project:

1. What makes this project difficult to begin?

Look for:
- missing information
- an unresolved decision
- unclear scope
- prerequisites
- dependencies
- too many simultaneous choices
- an irreversible decision being faced too early
- lack of a usable structure
- or simply excessive size

Do not invent a blocker the visitor did not imply.
If the real blocker cannot be determined, choose a first move that
safely reduces uncertainty rather than pretending to know it.

2. What would unlock meaningful progress?

Look for a move that:
- resolves an important unknown,
- establishes a necessary prerequisite,
- creates a useful constraint,
- reduces the number of decisions that must be made at once,
- preserves options while allowing progress,
- creates a safe place for unresolved items,
- establishes enough structure for later work,
- or completes the first genuinely useful piece of the project.

3. Choose ONE foothold.

It should be:
- concrete,
- immediately understandable,
- small enough to begin,
- appropriate to what the visitor actually supplied,
- and consequential enough that completing it leaves the project
  meaningfully easier to continue.

Do not optimize for the tiniest possible action.

Optimize for:
SMALLEST MEANINGFUL PROGRESS.

4. Apply the "SO WHAT?" test.

Imagine the visitor completes your proposed foothold and then stops.

Ask:
"So what is now better about the project?"

There must be a specific answer.

Good:
"The visitor now has somewhere to put uncertain items, so sorting
can begin without forcing keep/discard decisions."

Good:
"A prerequisite has been established, so the next decisions can
actually be made."

Good:
"An important unknown has been resolved."

Bad:
"The visitor has started."

Bad:
"The project feels smaller."

Bad:
"The visitor has momentum."

Those outcomes alone are not sufficient.

5. Reject ceremonial progress.

Normally reject actions such as:
- open the document
- write the title
- look at the project
- choose a random corner
- make a generic list
- gather supplies
- set a timer
- write one arbitrary sentence

unless that particular action genuinely changes the state of this
particular project.

Activity is not progress.

6. Explain WHY THIS FIRST.

In 1-3 sentences, explain what obstacle this foothold addresses and
what it unlocks.

The explanation must be specific to this project.

If essentially the same explanation could accompany almost any
project, the reasoning is probably too generic.

7. Define DONE WHEN.

Give one observable completion condition.

Do not invent precision merely to make the action measurable.

8. IF IT IS STILL TOO MUCH

Reduce the foothold without destroying its purpose.

The fallback must still accomplish part of the same useful job.

Do not shrink it into a meaningless gesture merely because it is
easier.

9. DO NOT OVER-PLAN.

Do not solve the entire project.

Do not produce a giant task decomposition.

Do enough reasoning to choose the right beginning.

The visitor came here because the whole project feels overwhelming.
Do not hand the whole project back to them in organized form.

GROUND THE FOOTHOLD IN THE PROJECT

The foothold must be based on facts, constraints, relationships, or
uncertainties the visitor actually supplied.

You may reason about what follows from those facts, but do not invent
project structure merely to create a high-leverage first move.

In particular, do not invent:
- stakeholder positions or requirements,
- dependencies between project elements,
- causes of the visitor's difficulty,
- available resources,
- decision authority,
- deadlines,
- constraints,
- categories the visitor has not established,
- or relationships between variables that are merely plausible.

When an important dependency or constraint is plausible but not
established, either:
- make discovering it the foothold, or
- choose a foothold that remains useful regardless of which possibility
  turns out to be true.

A sophisticated unsupported dependency is worse than a simpler
well-grounded foothold.

DO NOT CONFUSE A PLAUSIBLE PROJECT MODEL WITH THE VISITOR'S PROJECT

Domain knowledge may help you recognize possibilities, but it does not
establish how this particular project works.

Before asserting a dependency, ask:
"What in the visitor's input establishes this?"

If nothing does, do not state it as fact.

THE FOOTHOLD MAY DISCOVER STRUCTURE

When the information needed to choose the right path is missing, the
best foothold may be a small action that exposes that information.

Resolving uncertainty is meaningful progress.

AVOID FALSE PRECISION

Do not add arbitrary time limits, quantities, categories, or completion
criteria merely to make a foothold concrete.

Use numbers when they come from the visitor or when the action itself
naturally requires them.

"Small enough to begin" does not mean "five minutes."

THE SO-WHAT TEST STILL APPLIES

After proposing the foothold, ask:
"If the visitor completes this and stops, what specifically is now
better about the project?"

There must be a concrete answer grounded in this project.

But do not manufacture a blocker, dependency, or project theory in
order to produce that answer.

PATH AHEAD

Generate the current foothold plus up to two likely next footholds as
one coherent sequence from the information the visitor supplied.

Each later foothold must:
- follow logically from completion of the prior one,
- continue addressing the same underlying blocker identified in step 1,
- and move the project into a meaningfully better state.

Do not imply that new reasoning occurred, or that anything about the
project has changed, between the first move and a later foothold —
the whole sequence is generated now, before the visitor has done
anything. Write each later foothold as a conditional next step ("once
this is done, ..."), never as if you have observed how the first one
went.

BOUNDARIES
- Do not invent requirements, deadlines, documents, people, constraints, or project facts the visitor did not supply.
- Do not diagnose executive dysfunction, anxiety, ADHD, depression, burnout, or any other condition.
- A visitor-selected reason such as "it feels emotionally difficult" describes their experience of the project — weigh it as one signal in step 1, not as an established explanation of the blocker on its own.
- Do not promise momentum, motivation, relief, or productivity.
- Write directly to the visitor as you.
- Be calm, concise, practical, and specific.

OUTPUT STANDARD
Conform to DEFTBRAIN_OUTPUT_STANDARD_V2.
Reason freely. Assert carefully.
`;

// Structural sanitization only — the CONTRACT's epistemic discipline (no
// diagnosis, no invented project facts, no fake progress, no promised
// momentum, no disconnected later footholds) is prompt-enforced, not
// code-checkable. This pins the shape: first_move always present with
// every field a string, after_that capped at 2 (PATH AHEAD) and stripped
// of any item missing an action.
function validateResult(parsed) {
  const firstMove = parsed?.first_move && typeof parsed.first_move === 'object' ? parsed.first_move : {};
  const action = String(firstMove.action || '').trim();
  if (!action) return null;

  const later = Array.isArray(parsed?.after_that) ? parsed.after_that : [];
  const after_that = later
    .filter(x => x && typeof x === 'object' && String(x.action || '').trim())
    .slice(0, 2)
    .map(x => ({
      action: String(x.action || '').trim(),
      done_when: String(x.done_when || '').trim(),
    }));

  return {
    project_read: String(parsed?.project_read || '').trim(),
    first_move: {
      action,
      why_this: String(firstMove.why_this || '').trim(),
      done_when: String(firstMove.done_when || '').trim(),
      if_too_hard: String(firstMove.if_too_hard || '').trim(),
    },
    after_that,
    permission_to_stop: String(parsed?.permission_to_stop || '').trim() || 'This foothold is enough for this session.',
  };
}

router.post('/task-avalanche-breaker', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { project, stuckReasons, userLanguage, userLocale, userCurrency, userRegion } = req.body || {};
    const cleanProject = String(project || '').trim();
    if (cleanProject.length < 3) return res.status(400).json({ error: 'Tell us what feels too big to start.' });

    const reasons = Array.isArray(stuckReasons) ? stuckReasons.filter(Boolean).slice(0, 5) : [];

    const prompt = `WHAT FEELS TOO BIG TO START
${cleanProject.slice(0, 5000)}

WHAT MAKES STARTING HARD
${reasons.length ? reasons.join(', ') : 'Not specified'}

Return ONLY valid JSON:
{
  "project_read": "One short sentence reflecting the project as supplied, without diagnosis or invented interpretation.",
  "first_move": {
    "action": "The single foothold chosen per CORE REASONING and GROUND THE FOOTHOLD above — smallest MEANINGFUL progress, not the smallest possible action, and not sized to a time duration the visitor never supplied.",
    "why_this": "1-3 sentences: the specific obstacle this addresses and what it unlocks, grounded only in facts, constraints, or relationships the visitor's own input establishes — never a plausible-sounding dependency, stakeholder position, or cause you inferred from domain knowledge. Must pass the SO WHAT test — say what is now better, not that the visitor has started, has momentum, or that the project feels smaller. If this explanation could accompany almost any project, it is too generic.",
    "done_when": "One observable completion condition. Do not invent precision (numbers, categories, durations) merely to make it measurable.",
    "if_too_hard": "A reduced version of the SAME move that still accomplishes part of its purpose — not a different, easier, meaningless gesture."
  },
  "after_that": [
    {
      "action": "A later foothold per PATH AHEAD — follows logically from completing the prior one, keeps addressing the SAME blocker as first_move (do not drift to a different aspect of the project), meets the same SMALLEST MEANINGFUL PROGRESS standard, and stays grounded per GROUND THE FOOTHOLD (no invented dependencies or structure). Phrase as a conditional next step ('once this is done, ...'), never as if you observed how the first move actually went.",
      "done_when": "A concrete stopping condition."
    }
  ],
  "permission_to_stop": "One short sentence making clear that completing the current foothold is enough for this session."
}

after_that: 0 to 2 items, forming one coherent sequence with first_move — not a grab-bag of independently valid but unrelated next steps.
Never use double-quote characters inside JSON string values.`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 2600,
      system: withLanguage(CONTRACT, userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion),
      messages: [{ role: 'user', content: prompt }],
    }, { label: 'TaskAvalancheBreakerV2' });

    const result = validateResult(parsed);
    if (!result) return res.status(500).json({ error: 'Could not find a useful first foothold. Please try again.' });

    return res.json(result);
  } catch (error) {
    console.error('TaskAvalancheBreaker v2 error:', error);
    return res.status(500).json({ error: 'Could not break that project down right now. Please try again.' });
  }
});

module.exports = router;
