# BeliefStressTest — architecture & lock notes (`beliefstresstest-v1`)

Pressure-tests a stated belief across dimensions (steelman → attack → rebuild). The **Ego Killer** merge survivor. **Frontend:** `src/tools/BeliefStressTest.js`. **Backend:** `backend/routes/belief-stress-test.js` (1 endpoint, 1 action). **Golden:** `audit/belief-stress-test-golden-sample.json` (3 cases). Verify: `npm run check:golden belief-stress-test` (needs local backend; ~30–45s/case).

## Shape
- **1 endpoint `/api/belief-stress-test`.** `claude-sonnet-4-6` (`MODELS.SMART`), `max_tokens: 3500`, `callClaudeWithRetry`, `withLanguage` + `withLocaleContext`. Guard on always-present `belief_as_understood`.
- Output: `belief_as_understood`, `belief_type` (enum), `where_it_holds{3}`, `stress_tests[]{test_label,the_test,what_it_reveals,severity}` (3-6, ordered by severity), `the_hidden_structure{3}`, `the_nuanced_version{4}`, `verdict{rating,rating_label,one_line}`. Three-layer sync clean — every field renders (raw interpolation).
- Enums: `belief_type` (empirical|moral|strategic|psychological|social), `severity` (fatal|significant|minor), `verdict.rating` (mostly_true|context_dependent|useful_simplification|mostly_false|it_depends) — all clean; the frontend switches on `verdict.rating` → `VERDICT_CONFIG` (color+icon) and `severity` → `SEVERITY_CONFIG` (badge). Verified across strategic/moral/psychological + all severities live.
- In `LOCALIZED_TOOLS`; mobile clean at 375px (verdict card, collapsible stress-tests, sections — no overflow/crush).

## Audit fixes locked here (2026-07-11)
1. **🐛 German truncation.** The ~25-field schema — with a variable `stress_tests[]` that hit **7** for a rich belief — overran `max_tokens: 2000` in German → 500. Fixed with **bound + headroom**: capped `stress_tests` to **3-6 (ordered by severity)** *and* raised `max_tokens` to **3500**. Re-verified: German 200 / 6 tests.
2. **⚠️→cleaned: 13 `— one sentence` annotations stripped.** Same pattern that leaked badly in BatchFlow (echoed literally into hero stats). Here the model did NOT echo them in any tested run — but it's a proven-non-deterministic risk and the annotations inflated output (worsening the truncation). Stripped as hygiene; also gave the truncation fix headroom. Output verified annotation-free EN + DE.

## DO NOT silently reverse
1. **`max_tokens: 3500` + the `stress_tests` 3-6 cap** — together they prevent the German truncation. Don't remove the cap or lower max_tokens.
2. **Stripped annotations** — don't re-add `— one sentence` to any field; **check-golden checks structure, NOT content**, so it won't catch a re-introduced leak — eyeball output after prompt edits.
3. **Clean enum values** (`belief_type` / `severity` / `verdict.rating`) — frontend `VERDICT_CONFIG`/`SEVERITY_CONFIG` switch on them for color/icon; a distorted value falls to the default styling.

## Known / accepted
- 0 baseline `audit_v2` / backend-audit issues.
- Golden: `stress_tests` is NOT neutralized — it's always non-empty (capped 3-6), so check-golden's non-empty-array assertion is always satisfied. (Unlike BatchFlow's genuinely-optional `unbatchable`.)

## v2 (2026-07-12) — German-truncation residual fix
A post-batch headroom spot-check (re-running a near-ceiling case forced to German) found the
main endpoint still **truncated at `max_tokens 3500`** on a realistic German input — the v1
German test happened to use a shorter input that fit. **Fix:** `max_tokens` 3500 → **5000**.
Golden gains a `de-truncation-guard` case. Tag → `beliefstresstest-v2`.
