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
router.outputStandard = 'v2';
router.outputGuard = {
  prohibit: [
    'first_move_missing_or_empty',
    'more_than_two_later_footholds',
    'malformed_later_foothold_passed_through_unfiltered',
    // Prompt-enforced, not code-checkable — see CONTRACT's steps 1-6 and
    // PATH AHEAD: a foothold whose why_this could accompany almost any
    // project (too generic), a blocker the visitor never implied, a later
    // foothold that drifts from the blocker the first move addressed, or
    // one phrased as if it were written after observing the first move's
    // outcome rather than alongside it.
    'ceremonial_action_disguised_as_meaningful_progress',
    'invented_blocker_not_implied_by_visitor',
    'later_foothold_disconnected_from_the_same_blocker',
  ],
  require: ['fulfills_tool_promise'],
};

const CONTRACT = `
You are Task Avalanche Breaker.

PURPOSE
Help someone who has a real project but cannot find a manageable place to begin.

NORTH STAR
DON'T JUST MAKE IT SMALLER.
FIND THE FIRST MOVE THAT MAKES THE REST EASIER.

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
- The visitor's time budget is real and should be respected, but it does not override SMALLEST MEANINGFUL PROGRESS. When the consequential first move takes longer than a trivially tiny action, prefer a genuine partial step toward it over an arbitrarily small unrelated one. Do not manufacture a precise duration either way.
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
    const { project, stuckReasons, availableTime, userLanguage, userLocale, userCurrency, userRegion } = req.body || {};
    const cleanProject = String(project || '').trim();
    if (cleanProject.length < 3) return res.status(400).json({ error: 'Tell us what feels too big to start.' });

    const time = ['2', '5', '10', '20'].includes(String(availableTime)) ? String(availableTime) : '5';
    const reasons = Array.isArray(stuckReasons) ? stuckReasons.filter(Boolean).slice(0, 5) : [];

    const prompt = `WHAT FEELS TOO BIG TO START
${cleanProject.slice(0, 5000)}

WHAT MAKES STARTING HARD
${reasons.length ? reasons.join(', ') : 'Not specified'}

TIME AVAILABLE RIGHT NOW
About ${time} minutes

Return ONLY valid JSON:
{
  "project_read": "One short sentence reflecting the project as supplied, without diagnosis or invented interpretation.",
  "first_move": {
    "action": "The single foothold chosen per CORE REASONING above — smallest MEANINGFUL progress, not the smallest possible action, sized to fit the time budget where that's compatible with real progress.",
    "why_this": "1-3 sentences: the specific obstacle this addresses and what it unlocks. Must pass the SO WHAT test from CORE REASONING — say what is now better, not that the visitor has started, has momentum, or that the project feels smaller. If this explanation could accompany almost any project, it is too generic.",
    "done_when": "One observable completion condition. Do not invent precision merely to make it measurable.",
    "if_too_hard": "A reduced version of the SAME move that still accomplishes part of its purpose — not a different, easier, meaningless gesture."
  },
  "after_that": [
    {
      "action": "A later foothold per PATH AHEAD — follows logically from completing the prior one, keeps addressing the SAME blocker as first_move (do not drift to a different aspect of the project), and meets the same SMALLEST MEANINGFUL PROGRESS standard. Phrase as a conditional next step ('once this is done, ...'), never as if you observed how the first move actually went.",
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
