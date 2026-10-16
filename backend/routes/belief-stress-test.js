const express = require('express');
const { answer, onlyKeys } = require('../lib/progressive');
const router = express.Router();
const { callClaudeWithRetry, withLanguage, withLocaleContext } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

const { checkConsistency } = require('../lib/outputGuard');
const PERSONALITY = `Rigorous belief stress-tester. Find the breaking points, exceptions, and hidden assumptions in any belief — then upgrade it into something more defensible.

METHOD: Steelman first. Attack with the most damaging counterexamples and edge cases you can find. Look for cultural variations, historical failures, and internal contradictions. Then rebuild a more precise version that survives the attack. Always honest about what genuinely survives and what doesn't.`;

router.post('/belief-stress-test', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { belief, context, userLanguage } = req.body;
  if (!belief?.trim()) return res.status(400).json({ error: 'Name a belief to stress-test.' });

    // One 6-key schema at max_tokens 5000 measured 60-70s — past the ~60s where
    // Safari abandons the fetch. Breaking the belief and rebuilding it are two
    // jobs over the same statement, with no shared keys; they run in parallel
    // and merge back to the original response shape (frontend untouched).
    const brief = `BELIEF STRESS TEST

THE BELIEF: "${belief.trim()}"
${context?.trim() ? `THEIR CONTEXT: ${context.trim()}` : ''}

Stress-test this belief across multiple dimensions. Find where it holds and where it breaks.

PERCENTAGES: recompute every percentage from its actual numerator and denominator before stating it, and name both inline (e.g. '45k of the 95k lower salary = 47%').

You are producing ONE PART of the analysis. Another analyst is producing the other part — return only your own keys.`;

    // ── Part A: where it holds, and where it breaks ──
    const testPrompt = `${brief}

YOUR PART: state the belief fairly, then find the cases that break it.

Return ONLY valid JSON with EXACTLY these four top-level keys:
{
  "belief_as_understood": "The belief restated clearly and charitably",
  "belief_type": "empirical | moral | strategic | psychological | social",

  "where_it_holds": {
    "the_conditions": "The specific circumstances where this belief is genuinely true and useful",
    "the_evidence_for": "The strongest evidence or examples that support it",
    "why_people_hold_it": "The legitimate reason this became a widely-held belief"
  },

  "stress_tests": [
    {
      "test_label": "Human-readable label — 2-4 words",
      "the_test": "The specific case, example, or logical scenario that challenges the belief",
      "what_it_reveals": "What this test specifically reveals about the belief's limits or hidden assumptions",
      "severity": "fatal | significant | minor"
    }
  ]
}

Generate 3-6 stress tests, ordered by severity (fatal first). belief_type and severity must be the exact English values listed.`;

    // ── Part B: what is underneath it, and what survives ──
    const rebuildPrompt = `${brief}

YOUR PART: what the belief is really doing, the version that survives scrutiny, and the verdict.

Assume the other analyst is finding the cases where this belief breaks — write the upgrade and the verdict as though those failure cases exist, without listing them yourself.

Return ONLY valid JSON with EXACTLY these three top-level keys:
{
  "the_hidden_structure": {
    "what_its_really_saying": "The deeper claim underneath the surface statement of the belief",
    "the_psychological_function": "What function this belief serves for the person who holds it — separate from whether it's true",
    "when_it_becomes_harmful": "The specific conditions where holding this belief as an absolute rule produces bad outcomes"
  },

  "the_nuanced_version": {
    "the_upgrade": "The more precise version of this belief that survives the stress tests",
    "the_key_conditions": "The 'when' and 'under what circumstances' that make it accurate",
    "still_useful_because": "Why even the upgraded version is worth keeping",
    "example_of_upgrade_in_action": "A concrete example of how the upgraded belief would change a real decision"
  },

  "verdict": {
    "rating": "mostly_true | context_dependent | useful_simplification | mostly_false | it_depends",
    "rating_label": "MOSTLY TRUE | CONTEXT-DEPENDENT | USEFUL SIMPLIFICATION | MOSTLY FALSE | IT DEPENDS",
    "one_line": "One sentence verdict"
  }
}

verdict.rating must be one of the exact English values listed — the interface switches on it.`;

    const systemSuffix = withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion) + ' Never place a double-quote (") character inside any JSON string value — write quoted phrases or restated beliefs plainly or with single quotes, or it breaks the JSON.';
    const ask = (content, label, maxTokens) => callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: maxTokens,
      system: withLanguage(PERSONALITY, userLanguage) + systemSuffix,
      messages: [{ role: 'user', content }],
    }, { label });
    // Speed (2026-10-16): the tests call wrote ~1,700 tokens (~40s). The
    // restatement now comes from its own small pass (shown in seconds), and
    // the stress tests are split by KIND, not by count, so the two passes
    // can't write the same test (lib/progressive.js; parallel-split rules).
    const KIND = {
      real: 'THIS PASS writes 2-3 stress tests drawn from REAL cases — documented examples, history, data or well-known situations. Another pass writes logical and hypothetical edge cases at the same time; do not write those.',
      logic: 'THIS PASS writes 1-3 stress tests that are LOGICAL or HYPOTHETICAL — edge cases, thought experiments, or where the belief contradicts itself. Another pass writes real-world counterexamples at the same time; do not write those.',
    };
    const tests = [null, null];
    const SEVERITY = { fatal: 0, significant: 1, minor: 2 };
    const ORDER = ['belief_as_understood', 'belief_type', 'where_it_holds', 'stress_tests', 'the_hidden_structure', 'the_nuanced_version', 'verdict'];

    return await answer(req, res, {
      label: 'belief-stress-test',
      parts: [
        { required: true, run: () => ask(onlyKeys(testPrompt, ['belief_as_understood', 'belief_type']), 'belief-stress-test:frame', 800),
          apply: (d, o) => { d.belief_as_understood = o?.belief_as_understood; d.belief_type = o?.belief_type; } },
        { run: () => ask(onlyKeys(testPrompt, ['where_it_holds']), 'belief-stress-test:holds', 1500),
          apply: (d, o) => { d.where_it_holds = o?.where_it_holds; } },
        ...['real', 'logic'].map((kind, i) => ({
          run: () => ask(`${onlyKeys(testPrompt, ['stress_tests'])}\n${KIND[kind]}`, `belief-stress-test:tests-${kind}`, 2500),
          apply: (d, o) => {
            tests[i] = Array.isArray(o?.stress_tests) ? o.stress_tests : [];
            // Ordered by severity, fatal first, as the one-call answer was.
            d.stress_tests = tests.flatMap(t => t || []).sort((x, y) => (SEVERITY[x?.severity] ?? 3) - (SEVERITY[y?.severity] ?? 3)).slice(0, 6);
          },
        })),
        { run: () => ask(rebuildPrompt, 'belief-stress-test:rebuild', 2500),
          apply: (d, o) => { ['the_hidden_structure', 'the_nuanced_version', 'verdict'].forEach(k => { if (o?.[k] !== undefined) d[k] = o[k]; }); } },
      ],
      finish: d => Object.fromEntries(ORDER.filter(k => d[k] !== undefined).map(k => [k, d[k]])),
      ready: d => Boolean(d.belief_as_understood),
      complete: d => Boolean(d.belief_as_understood),
      // T3/T7 (audit/DEFECT-TYPES.md): contradictions and ignored choices.
      check: d => checkConsistency(d, { label: 'belief-stress-test', userLanguage: req.body?.userLanguage }),
    });

  } catch (error) {
    console.error('BeliefStressTest error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
