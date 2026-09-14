# WardrobeChaosHelper — audit lock notes (`wardrobechaoshelper-v2-rewrite`, 2026-09-14)

Ground-up rewrite of the `wardrobechaoshelper-v1` lock (2026-07-14, notes preserved below). Backend `wardrobe-chaos-helper.js` — 3 endpoints, all `MODELS.FAST`.

## Why: the AI's job is not to judge style — it's to reduce the search space

v1 fabricated confidence: numeric comfort/style scores the model has no real basis for, a "Sensory OK"/"Weather OK" badge asserted even when most items had no sensory data to support it, `confidence_boost` affirmations ("You'll look professional..."), mandatory `color_coordination` commentary, automatic shopping suggestions (`capsule_wardrobe_suggestions`) despite almost no evidence the user needed them, and generic tips. Governing rule: the tool should not tell the user what is stylish — it should use what the user already knows about their clothes to make getting dressed require less thinking.

## New response shape (all 3 endpoints)

- **Main gen**: `outfit_combinations[]` → `outfits[]` (`role`: `best_fit`/`easiest`/`alternative`, `items`, `why_today`, `check`) + top-level `just_dress_me` (one line, no alternatives — "the heart of the tool"). `alternative` is genuinely optional — the prompt says omit it rather than force a weak third option; a thin wardrobe can return only 2 outfits, and `best_fit`/`easiest` can legitimately be identical (verified live).
- **Regenerate/swap**: same fact/style discipline; `outfit.items`/`why_today`/`check`, no rating fields. A single-piece swap keeps everything else fixed and only explains the tradeoff when material.
- **Pack**: `packing_list[]`/`outfit_plan[]`/`tips[]` → `pack_these[]` (bare item names)/`wear_plan[]`/`uncertainty` (singular). Must never invent destination climate — required to flag unverified weather in `uncertainty` instead (verified live: "Berlin im Winter" produced a genuine uncertainty note, not an invented climate assumption).

## Frontend changes

- Removed: comfort/style number badges, "Sensory OK"/"Weather OK" badges, `confidence_boost` decoration, mandatory color-coordination block, generic tips block, automatic "Consider Adding" shopping section.
- Added: role-based card headings (Best fit / Easiest / Another option), a `check` note rendered only when the model actually returns one, a prominent "Don't make me choose" card for `just_dress_me`.
- **Just Dress Me promoted to the dominant path**: a large hero button/card at the top of the wardrobe step (once ≥3 items), with the exact copy "Give me one workable outfit using today's defaults. No alternatives unless I ask." "Continue to Today" (the fuller customize flow) demoted to a secondary button below it.
- **Mood is now optional** everywhere (frontend validation and backend both) — the tool has a much stronger job with weather/activity/comfort/sensory constraints than interpreting an abstract desired feeling.
- **Analytics rewritten as descriptive facts**: Most worn, Not worn yet, Recently worn, Comfort standouts, Color mix, Category counts. No versatility percentage (no transparent deterministic formula for one) and no "you need more tops" gap suggestions (a wardrobe of three tops may be perfectly adequate). The user-invoked "what feels hard to dress for?" follow-up feature from the spec was **not implemented** in this pass — flagged as a possible follow-up, not silently dropped.
- **New optional per-item fields**: `warmth` (light/medium/warm) and `fitFeel` (close/regular/loose) — only mentioned to the model when actually supplied, never inferred from the item name.
- `accessories` in every `items` object is now an **array**, not a string/null like the other slots — `flatItems()` and the render loop handle both shapes; do not collapse it back to a bare string.

## Bugs found and fixed during this rewrite (carried a v1 lesson forward)

- The old `markWorn`/wear-tracking logic assumed every `items` value was a bare string; with `accessories` now an array, the old `Object.values(o.items).forEach(n=>sg.add(n.toLowerCase()))` pattern would have crashed on `.toLowerCase()` of an array. Replaced with a `markWorn()` helper that branches on `Array.isArray`.
- Not re-litigated (already fixed in v1, still true): the phantom secondary guard that took down regenerate+pack on every call is gone and was not reintroduced; no-inner-double-quote rule is still in all 3 prompts; PF-2 aliases still present.

## Verify

`npm run check:golden wardrobe-chaos-helper` (3 cases, all German, including the previously-DOWN endpoints). Watch for `alternative` being legitimately absent and `best_fit`/`easiest` being legitimately identical on a thin wardrobe — neither is a regression. Backend must be up.
