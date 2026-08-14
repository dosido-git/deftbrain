# AlternatePath — architecture & lock notes (`alternatepath-v1`)

Alt-history "change one detail, trace the ripples" tool. **Frontend:** `src/tools/AlternatePath.js`. **Backend:** `backend/routes/alternate-path.js` (1 endpoint, 3 depth modes). **Golden:** `audit/alternate-path-golden-sample.json` (3 cases). Verify: `npm run check:golden alternate-path` (needs local backend; ~35–55s/case).

## Shape
- **1 endpoint `/api/alternate-path`.** `claude-sonnet-4-6`, `max_tokens: 7000`, `callClaudeWithRetry`, `withLanguage` + `withLocaleContext` (locale ctx harmless here — no economics, no `$` exemplars).
- **Two controls, not one** (2026-08-14): `reach` = `decades` (exactly 5, ~50 yrs) | `today` (exactly 8, 100+ yrs); `tone` = `plausible` | `weird`. The old single `depth` mixed the two questions — quick/deep was scope, absurd was realism, so picking Absurd silently also picked a length and a short weird timeline was unreachable. `depth` is still accepted and mapped (quick→decades+plausible, deep→today+plausible, absurd→today+weird) for browsers holding a cached bundle across a deploy; locked by the `legacy-depth-param` golden case.
- Output: `divergence_point`, `real_history`, `timeline[]{year_range,event,because,real_world_contrast}`, `today_looks_like`, `biggest_surprise`, `butterfly_moment`, `plausibility` (integer 1-10). Three-layer sync clean — every field renders; every input reaches the route.
- Guard keys on always-present `divergence_point` — non-nullable, no false-500.
- In `LOCALIZED_TOOLS`; dark mode clean.

## Audit fixes locked here (2026-07-10)
1. **🐛 CRITICAL — `deep` mode deterministic 500.** "Generate 8-10 consequences tracing 100+ years, go deep on cascading effects" produced long-form output that truncated at `max_tokens=3000` → `callClaudeWithRetry` throws → 500 on **every** deep run (a third of the tool's modes dead in prod; the gates/happy-path never saw it — only a live deep run does). Fixed with **bound + headroom together**: deep capped to "exactly 8 consequences … keep EACH field to one tight sentence" **and** `max_tokens` 3000 → **6000**. Re-tested: deep now 200 / 8 items / ~50s. The `deep-truncation-guard` golden case locks it (a returning 500 fails HTTP≠200).
2. **🐛 `plausibility` type contract broken.** Schema said `"1-10 … — one sentence"`, so the model returned a **discursive string that embedded its own "5/10"**. The banner rendered `{plausibility}/10` → a full sentence + a trailing `/10` (double), and the low-plausibility cross-ref (`typeof === 'number'`, was `:375`) was **dead code**. Fixed: schema now forces `"plausibility"` to a **single integer 1-10 (digits only, no text, no "/10")**. Frontend also hardened with a module-level `plausInt()` normalizer used by the banner, the `< 4` cross-ref, and the copy text — bulletproof even if the model ever regresses to a string. `minimal-low-plaus` golden case lands plausibility 3, exercising the cross-ref path.
3. **⚠️ Stripped stray `— one sentence` artifacts** on `today_looks_like` (which contradicted its own "2-3 vivid sentences") and `plausibility` (folded into fix 2).

## DO NOT silently reverse
1. **The `today` cap "exactly 8 … one tight sentence" + `max_tokens: 7000`** — together they prevent the deep-mode truncation 500. Don't restore "8-10" or lower max_tokens.
2. **`plausibility` integer contract** (backend digits-only instruction + frontend `plausInt()`). Don't reintroduce a prose plausibility — it breaks the banner and the low-plaus cross-ref.
3. **Guard on `divergence_point`** (top-level always-present) — don't move to a nullable/nested field.
4. Enum-ish values clean; timeline `year_range` short (rendered as a `whitespace-nowrap` badge).

## Form rewrite (2026-08-14)
Per the owner's review: this is the one tool that should not be made more
practical — the charter's "spark wonder and discovery" line is its whole job.
- `Depth` → **How far should we follow it?** + **How realistic should we be?**
- `Year or context` → **Set the scene**, placeholder now three scenes rather
  than a syntax hint ("During World War I · In ancient Rome · Before the
  Industrial Revolution").
- Added an invitation under the one required field — "Serious, silly,
  impossible — try anything." What stops people typing there is the suspicion
  that their idea is too silly to submit.
- "Plausible → hilariously extreme" → "Start plausible. End wherever history
  takes us." A promise instead of a disclaimer.
- Fan Theory cross-ref kept word for word (the review singled it out) but moved
  below the submit button per PF-33, and gated on `!results`.
- ⌘↵ chip added (PF-31 — the handler already existed).
- `edge` primer line added; "AI traces cascading consequences" removed from the
  guide example (Charter Appendix A).
- Descs used to claim "10 consequences" for deep while the route asked for 8.
  They now say what the route actually does.

## The DeftBrain treatment (2026-08-14)
PF-30 (in-card `<h2>` deleted — the name was printed twice before the first
input; icon moved onto the tagline), PF-17c (larger Try-an-example pill, dark
ink in both themes), PF-31 + PF-33 (landed with the form rewrite), PF-32 via
its single-ask exception: Recent stays at the foot but is now a collapsed
`<details>` labelled `Recent timelines (n)` with a shared `<Caret>`.

## Known / accepted
- 0 `audit_v2` baseline issues (clean tool).
- Depth buttons carry a `flex-1` with no flex parent (they stack full-width by design — label + desc). Cosmetic dead class; left as-is.
- Mobile pass (375px): input + results clean — no overflow/crush; tool inputs ≥16px, only chrome locale `<select>`s <16px. (Render-layer — not in the golden.)
