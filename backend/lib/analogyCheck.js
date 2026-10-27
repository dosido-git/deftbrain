// analogyCheck.js — T12 (audit/DEFECT-TYPES.md): the decorative analogy.
//
// An analogy can be accurate, well written and still teach nothing: it
// re-describes the effect in costume and carries none of the cause. Live,
// 2026-10-23, inflation for a crossword fan: "the squares get a little smaller
// each year … inflation is just the name for those squares getting smaller."
// Nobody has seen crossword squares shrink, nothing in the scene says WHY they
// shrink, and the last line restates the concept instead of mapping it.
//
// One Sonnet pass reviews every analogy against three tests and rewrites the
// ones that fail, keeping their type and domain. Runs with the other checks,
// after the answer is on screen. Fail-open: any error leaves the draft as is.
const { callClaudeWithRetry, withLanguage } = require('./claude');
const { MODELS } = require('./models');

const SYSTEM = `You review analogies written to explain one concept to one audience. An analogy earns its place only if it passes all three tests:

1. MECHANISM — it carries the cause, not just the effect. The scene contains the same causal story as the concept (what drives the change), so reasoning inside the scene gives the right answer about the concept. Re-describing the outcome in costume fails.
2. FAMILIAR — the scene is something this audience has actually seen or done, as it really happens. An invented or impossible scene fails, because the listener has no intuition for it.
3. MAPS — each main element of the scene stands for a real element of the concept, and the analogy ends by naming that mapping in the concept's own terms. "X is just the name for…" restates; it does not map.

For each analogy return pass true or false. For a fail, give a one-sentence reason and a full replacement of the SAME type and domain that passes all three, the same length and in the same fields. Keep the replacement in the original's setting (its game, place or activity) — fix the mapping, not the scene. Leave passing analogies alone — do not polish them.

Return ONLY valid JSON: {"reviews":[{"index":0,"pass":true},{"index":1,"pass":false,"reason":"...","replacement":{ same keys as that item's fields }}]}
Never place a double-quote (") character inside any JSON string value.`;

// items: [{ fields: { title, analogy, … } }] — the replacement uses the same keys.
async function reviewAnalogies(items, { concept, audience, label = 'analogy', userLanguage } = {}) {
  if (!items.length) return [];
  // Speed (2026-10-27): one analogy per call, all at once — the whole set in
  // one call took 21s. Each review stands alone anyway.
  if (items.length > 1) {
    const outs = await Promise.all(items.map((it, i) => reviewAnalogies([it], { concept, audience, label: `${label}-${i + 1}`, userLanguage })));
    return outs.flatMap((out, i) => out.map(r => ({ ...r, index: i })));
  }
  const list = items.map((it, index) => ({ index, ...it.fields }));
  try {
    const out = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 600 + 500 * items.length,
      system: withLanguage(SYSTEM, userLanguage),
      messages: [{ role: 'user', content: `CONCEPT: ${concept}\nAUDIENCE: ${audience || 'a general adult'}\n\nANALOGIES:\n${JSON.stringify(list, null, 2)}` }],
    }, { label: `${label}-analogy-check` });
    return (Array.isArray(out?.reviews) ? out.reviews : [])
      .filter(r => r && r.pass === false && r.replacement && Number.isInteger(r.index) && items[r.index])
      .map(r => ({ index: r.index, reason: r.reason, fields: r.replacement }));
  } catch (err) {
    console.warn(`[${label}-analogy-check] skipped:`, err.message);
    return [];
  }
}

module.exports = { reviewAnalogies };
