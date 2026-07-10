# AnalogyEngine — architecture & lock notes (`analogyengine-v1`)

"Explain anything to anyone" — generates audience-tailored analogies. **Frontend:** `src/tools/AnalogyEngine.js`. **Backend:** `backend/routes/analogy-engine.js` (1 endpoint, 3 depth modes). **Golden:** `audit/analogy-engine-golden-sample.json` (3 cases). Verify: `npm run check:golden analogy-engine` (needs local backend; ~20–55s/case).

## Shape
- **1 endpoint `/api/analogy-engine`.** `claude-haiku-4-5`, `max_tokens: 4000`, `callClaudeWithRetry`, `withLanguage` + `withLocaleContext` (locale ctx harmless — no economics).
- Depth modes → analogy count: `quick_grasp` (2-3), `solid_understanding` (3-5), `deep_understanding` (5-6).
- Output: `concept_name`, `one_liner`, `analogies[]{title,type,analogy,why_it_works,where_it_breaks,accuracy,memorability}`, `the_key_insight`, `common_misconceptions[]`, `go_deeper`, `teaching_tip`. Three-layer sync clean — every field renders; every input reaches the route.
- Guard keys on always-present `concept_name` — non-nullable.
- Enums: `type` (Visual|Experiential|Narrative|Structural|Emotional|Mechanical), `accuracy` (high|medium), `memorability` (high|medium) — all clean; the frontend renders them as badges and gates the accuracy cross-ref on `accuracy==='medium'`.
- In `LOCALIZED_TOOLS`; dark mode clean.

## Audit fixes locked here (2026-07-10)
1. **🐛 deep-mode truncation 500 in verbose languages.** Deep mode (6 analogies × 3-5 sentences) fills ~78% of the old `max_tokens=2500` in English — but German expands ~30% and truncated → **deterministic 500** (a German user picking "Deep dive" always errored). Invisible to all 5 gates and every English test; only a live deep run in a verbose language exposes it (WML-class localization-functionality bug). Fixed: `max_tokens` 2500 → **4000** (schema already bounded at 6 analogies — pure i18n headroom; German deep now ~62%). The `deep-de-truncation-guard` golden case locks it (HTTP≠200 fails).
2. **🐛 depth-selector layout broken.** The three depth buttons carried `flex-1` + `flex flex-col` but had **no flex parent**, so they rendered as three mismatched-width boxes stacked on the left instead of an equal 3-across row. Fixed by wrapping them in a `<div className="flex gap-2">`.

## DO NOT silently reverse
1. **`max_tokens: 4000`** — headroom for verbose-language deep mode. Lowering it re-breaks deep for German et al.
2. **Depth buttons wrapped in `flex gap-2`** — the row layout depends on it (`flex-1` needs a flex parent).
3. **Guard on `concept_name`** (top-level always-present).
4. **Enum values clean** (`type`/`accuracy`/`memorability`) — the frontend badges + the `accuracy==='medium'` cross-ref switch on them.

## Known / accepted
- 0 `audit_v2` baseline issues.
- Mobile pass (375px): input + results clean post-fix — no overflow/crush; tool inputs ≥16px, only chrome locale `<select>`s <16px. (Render-layer — not in the golden.)
- Sibling note: AlternatePath has the same "no flex parent" pattern on its depth buttons, but they're block-level (stack full-width, look intentional) — deliberately left as-is there.
