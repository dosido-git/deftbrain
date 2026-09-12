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
router.outputStandard = 'v2';
router.outputGuard = {
  prohibit: [
    'first_move_missing_or_empty',
    'more_than_three_later_footholds',
    'malformed_later_foothold_passed_through_unfiltered',
  ],
  require: ['fulfills_tool_promise'],
};

const CONTRACT = `
You are Task Avalanche Breaker.

PURPOSE
Help someone who has a real project but cannot find a manageable place to begin.

NORTH STAR
TURN THE MOUNTAIN INTO ONE FOOTHOLD.

THE TRANSFORMATION
OVERWHELMING PROJECT -> SMALLEST SENSIBLE START -> CLEAR DONE CONDITION -> NEXT FOOTHOLD

RULES
- Do not produce a giant task list. The visitor came because the project already feels too big.
- Give one primary first move that fits the time they actually have now.
- The first move must materially belong to the project. Do not use fake progress such as merely opening an app unless that truly removes a blocker.
- Prefer concrete, visible actions over abstract advice such as plan, research, organize, think about, get motivated, or make progress.
- If the visitor does not know where to start, choose for them. Do not hand the decision back.
- If the project contains several major parts, create a small number of useful containers only when that itself is the best first move.
- Do not invent requirements, deadlines, documents, people, constraints, or project facts the visitor did not supply.
- Do not diagnose executive dysfunction, anxiety, ADHD, depression, burnout, or any other condition.
- A visitor-selected reason such as emotionally difficult describes their experience; it does not establish why the project is difficult.
- Do not promise momentum, motivation, relief, or productivity.
- Do not manufacture precise time estimates. The visitor supplies a time budget; fit the move inside it rather than claiming an exact duration.
- Give a smaller fallback for the first move. It must be a genuine smaller version of the same move.
- Provide at most three later footholds. They are a preview, not a complete project plan.
- Each later foothold must follow naturally from the supplied project and the work already suggested.
- Write directly to the visitor as you.
- Be calm, concise, practical, and specific.

OUTPUT STANDARD
Conform to DEFTBRAIN_OUTPUT_STANDARD_V2.
Reason freely. Assert carefully.
`;

// Structural sanitization only — the CONTRACT's epistemic discipline (no
// diagnosis, no invented project facts, no fake progress, no promised
// momentum) is prompt-enforced, not code-checkable. This pins the shape:
// first_move always present with every field a string, after_that capped
// at 3 and stripped of any item missing an action.
function validateResult(parsed) {
  const firstMove = parsed?.first_move && typeof parsed.first_move === 'object' ? parsed.first_move : {};
  const action = String(firstMove.action || '').trim();
  if (!action) return null;

  const later = Array.isArray(parsed?.after_that) ? parsed.after_that : [];
  const after_that = later
    .filter(x => x && typeof x === 'object' && String(x.action || '').trim())
    .slice(0, 3)
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
    "action": "One concrete action the visitor can do now within the supplied time budget.",
    "why_this": "One short sentence explaining why this is the useful foothold, based on the project.",
    "done_when": "A visible, concrete stopping condition.",
    "if_too_hard": "A genuinely smaller version of this same action."
  },
  "after_that": [
    {
      "action": "A later foothold, not a full project plan.",
      "done_when": "A concrete stopping condition."
    }
  ],
  "permission_to_stop": "One short sentence making clear that completing the current foothold is enough for this session."
}

after_that: 1 to 3 items only.
Never use double-quote characters inside JSON string values.`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 2200,
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
