# RecipeChaosSolver — architecture & lock notes

**Known-good:** tag `recipechaossolver-v1` · golden `audit/recipe-chaos-solver-golden-sample.json`
**Verify:** `npm run check:golden recipe-chaos-solver` (backend up: `npm run dev:backend`)

## What it is
A mid-cook "kitchen 911" rescue tool. Frontend `src/tools/RecipeChaosSolver.js` (~2940 lines):
7 feature tabs (Rescue, Pre-Flight, Flavor Fix, Swap, Multi-Swap, Scale) + Wins journal, Saved,
History, and a hands-free Kitchen Companion mode. Backend `backend/routes/recipe-chaos-solver.js`
— **7 endpoints**, all `claude-sonnet-4-6` via `callClaudeWithRetry`. The main endpoint is
multi-modal (recipe / pantry / disaster photos → vision).

| Endpoint | guard field | max_tokens |
|---|---|---|
| `/recipe-chaos-solver` (rescue, multi-modal) | `recipes \|\| immediate_action` | 4000 |
| `/swap` | `ingredient` | 2000 |
| `/multi-swap` | `missing_count` | 2500 |
| `/scale` | `original_servings` | 2000 |
| `/preflight` | `recipe_name` | 2500 |
| `/flavor-fix` | `diagnosis` | 4000 |
| `/teach` | `lesson_title` | 4000 |

## DO NOT silently reverse (the locked fix)
1. **The main guard must accept a null `immediate_action`.** The schema explicitly allows
   `"immediate_action": "..." or null` — it's null for calm/planning/prevention queries (no
   "do this RIGHT NOW" step). The guard was `if (!parsed.immediate_action)` → it returned **500
   on valid no-crisis responses** (confirmed live: a "how do I make this dairy-free next time?"
   query 500'd with the guard message, no parse error — the model had returned recipes with a
   null immediate_action). Now `if (!parsed.recipes && !parsed.immediate_action)`. The golden's
   `main-calm-null-immediate-action` case guards this — if the guard regresses, it returns 500
   and the case fails. The frontend already renders null `immediate_action` conditionally
   (null-safe in both copy and the result card).
2. **All 7 endpoints on `claude-sonnet-4-6`.** The other 6 guards key on always-present fields —
   don't change them to nullable ones.

## Frontend
`buildFullText` covers all 7 result types (teach appends to whichever result is active). Mobile
clean at 375px (home + form; result renderers use responsive grids — `grid-cols-2 sm:grid-cols-3`
and short 3-col stat tiles — no overflow/crush). Fully localized (`rcs_*`, 13 languages; Spanish
verified). The PF-2 `c.textMuteded`/`c.label` aliases exist (had non-canonical double-space that
the audit's literal matcher missed — normalized to single-space so the frontend audit is CLEAN).

## 2026-09-07 — recipe-invention fix + output-standard review

**Bug fixed:** the model was silently inventing a complete recipe (flour,
sugar, leavening, oven temp, bake time) from just a dish name ("chocolate chip
cookies") instead of treating the visitor's own recipe as the source of truth.
Added a shared `PRESERVE_THE_RECIPE` rule (backend/routes/recipe-chaos-solver.js)
to rescue/swap/multi-swap/scale: give substitution amounts as rules relative to
the visitor's own recipe, never restate untouched ingredients/temps/times,
never borrow a mechanism from the original ingredient (egg biology applied to
a flax substitute), never state a total time that wasn't established. Also
tightened `recipes[].time` to a short duration/addition instead of a sentence
that could assert an invented, internally-inconsistent total. Verified live.

**Output-standard review (opening this file for the first time since v2
existed):** deliberately added to `FROZEN_V1` rather than declared v2 — see
the comment in `backend/lib/outputStandard.js`. Reason: `success_probability`
(top-level and per-recipe) trips the schema-congruence check as false
precision, correctly. Removing it is a real fix but a separate, larger one —
it's the main result-card visual and needs a frontend change alongside the
schema change. Flagged to the owner as a candidate for a fuller rewrite
(dropping success_probability/difficulty scoring, and possibly the Wins/
Saved/History/Multi gamification surface, per owner feedback the same day)
rather than bundled into this fix.

## Gotchas
- **Backend rate limit = 4 req/min.** `check:golden` runs the 3 cases sequentially and fits.
- **Golden robustness:** `ingredients_not_used` is a naturally-variable optional array — it's set
  to `[]` in the golden so the structural diff only gates on the stable `recipes` array (don't
  re-capture it as non-empty, or the calm case flaps).
- **Restart the backend after route edits** (started via `node`, not nodemon).
