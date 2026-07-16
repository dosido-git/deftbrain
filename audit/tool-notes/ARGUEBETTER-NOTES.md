# ArgueBetter — architecture & lock notes (`arguebetter-v1`)

First-ever audit-kit lock for this tool (built pre-audit-kit; never had a golden sample, NOTES.md, or git tag before this pass). Complete intellectual sparring system: state a position, face a steelman opponent across 5 debate formats (Freeform, Lincoln-Douglas, Cross-Exam, Oxford, Socratic), get coached, fact-checked, scored, judged by an undecided audience, and mapped into an argument tree. Plus 4 standalone modes: Quick Spar, Devil's Advocate Prep, Fallacy Gym, and cross-debate Highlight Reel. **Frontend:** `src/tools/ArgueBetter.js`. **Backend:** `backend/routes/argue-better.js` (13 endpoints). **Golden:** `audit/argue-better-golden-sample.json` (14 cases). **Catalog:** `src/data/tools.js`, category `Diversions`/`What If?`, headerColor `#b8dcd8`.

## Shape
- **13 endpoints**, all `MODELS.SMART`, all through `callClaudeWithRetry` + `withLanguage`/`withLocaleContext` (was already migrated pre-audit — not part of the callClaudeWithRetry sweep).
- `/argue-better-open`, `/argue-better-respond`, `/argue-better-switch`, `/argue-better-scorecard`, `/argue-better-quick`, `/argue-better-coach`, `/argue-better-audience-judge`, `/argue-better-argument-map`, `/argue-better-prep`, `/argue-better-fallacy-train`, `/argue-better-source-check`, `/argue-better-rematch`, `/argue-better-highlight-reel`.
- `debate-fallacy-train` (now `argue-better-fallacy-train`) is a dual-schema endpoint: no `userAnswer` → generates a new exercise (`{ exercise, topic }`); `userAnswer` present → evaluates it (`{ correct, feedback, the_fallacy, explanation, how_to_fix, streak }`).

## Bugs found and fixed (Phase 1 → Phase 2, 2026-07-16)

1. **Fallacy Gym was completely down — both branches 500'd on every call.** `backend/routes/debate-me.js:516` (old) had `if (!parsed.correct) return res.status(500)...`. The "new exercise" branch never returns a `correct` field at all (it returns `exercise`), so this guard fired on literally every "Start Training" click — reproduced live as an **uncaught-promise crash to the CRA red error overlay**, not even a graceful error banner. Second failure mode in the same guard: even the evaluate branch 500'd whenever the model correctly judged the user's answer wrong, because `correct: false` is falsy. **Fix:** the guard now branches on whether `userAnswer` was sent (`if (userAnswer) { if (parsed.correct === undefined) ... } else if (!parsed.exercise) ...`) — checking `undefined`, not falsy.
2. **Fallacy Gym's evaluate call never sent back the exercise it was grading.** `handleFallacyCheck` (frontend) called `/debate-fallacy-train` with `userAnswer` but no reference to the argument the user was shown — so even with the guard fixed, the model would be grading blind. **Fix:** `ftExercise.argument` is now threaded through as `exerciseArgument` in the request, and the backend prompt explicitly evaluates "against the fallacy actually embedded in the argument above." Verified live: a deliberately wrong answer ("Appeal to nature") on a correlation/causation exercise came back `correct: false` with an explanation naming the actual fallacy — not a guess.
3. **Source Check button was fully built in the UI but never called the backend — zero API calls, ever.** The `🔍 Fact-check` button's `onClick` only did `setShowSource(!showSource); setSourceData(null)` — it toggled a panel that could only ever render its empty state, because nothing populated `sourceData`. **Fix:** added `handleSourceCheck()`, which takes the last AI turn's text as the claim and calls `argue-better-source-check`; wired to fire when the panel opens, with a loading indicator (reusing the existing `dm_loading` key) while it's in flight.
4. **`debate-prep` (now `argue-better-prep`) hit 88% of its 2500 `max_tokens`** on a realistic verbose German input (dense audience/context/stakes) — one input away from a truncation 500, the recurring headroom bug class in this codebase. **Fix:** bumped to 3500. Same German input now lands at ~57% of budget.
5. **3 enum fields risked the i18n-enum-vs-English-literals bug** (the class that broke RoommateCourt/TipOfTongue/VelvetHammer): `audience-judge.verdict.more_persuasive` (`"Side A" | "Side B" | "Too close to call"`), `argument-map.branches[].status` (`"defended" | "abandoned" | "weakened" | "strengthened"`), `source-check.evidence_rating.score` (5-way enum) — all exact-string-compared in the frontend (color/label lookups) but flowing through `withLanguage()`, which could translate them in any non-English response. Live-tested in German and the model already happened to return them in English — so this was defense-in-depth, not a fix for an observed break — but each prompt now has an explicit `IMPORTANT: ... must be exactly one of these English strings, unchanged` instruction, matching the established fix pattern elsewhere in the codebase.
6. **5 response fields were fetched but never rendered anywhere:**
   - `debate-respond`'s `momentum.note` and `pressure_point` — now shown per AI turn (`📈`/`🎯` lines).
   - `key_challenges[].why_strong` (used by both `debate-open` and `debate-rematch`, the latter via `targeted_weaknesses[].how`) — now appended inline to the existing challenge bullet, reusing AI-generated (already-localized) text, so no new i18n key was needed.
   - `debate-rematch`'s `fallacy_traps[]` — previously only its `.length` gated a generic "targeting N blind spots" system message; the actual trap text is now rendered as a bulleted list on the AI's opening turn (🪤 icon).
   - `debate-highlight-reel`'s `top_strengths[].evidence` — now shown as a sub-line under each strength pattern, also reusing AI-generated text (no new key).
   - New i18n keys added for the 2 fields needing static UI labels: `dm_pressure_point`, `dm_momentum`, `dm_fallacy_traps` — all 13 languages, in `src/i18n/locales/tools/debate-me.js`.

## Naming-consistency pass (2026-07-16)

Catalog id is `ArgueBetter`, but the backend route file and every endpoint path were still `debate-me.js`/`debate-*` (an artifact of the tool's history: ArgumentSimulator → Debate Me → Argue Better, where the 2026-07-10 rename deliberately left the endpoint alone — see `audit/RENAMES.md`). Since this tool had never been locked before, the rename cost nothing extra (no golden sample or tag to migrate), so as part of this first lock:
- `backend/routes/debate-me.js` → `backend/routes/argue-better.js`.
- All 13 endpoint paths `/debate-*` → `/argue-better-*`.
- All 13 `callToolEndpoint('debate-*', ...)` call sites in `src/tools/ArgueBetter.js` updated to match.
- **Deliberately left alone:** the i18n file (`src/i18n/locales/tools/debate-me.js`) and its `dm_*` key prefix — renaming either would force touching every one of ~150 keys × 13 languages for zero user-facing benefit, and matches the established precedent (see SubSweep/SubscriptionTamer below) that i18n prefixes stay stable across a route rename.
- `audit/RENAMES.md`'s `DebateMe | ArgueBetter` row updated to record this.

## DO NOT silently reverse

1. The `userAnswer !== undefined` branch split on the fallacy-train guard — do not go back to `if (!parsed.correct)`, it will re-break both branches.
2. `exerciseArgument` threading — removing it silently makes evaluate grade against nothing again (no error, just wrong/hallucinated feedback).
3. The enum-pin `IMPORTANT:` instructions in `audience-judge`, `argument-map`, `source-check` — currently unexercised (the bug hasn't been observed to trigger), but this is exactly the class of bug that hard-broke 3 other tools in this codebase.
4. `dm_*` i18n prefix and `debate-me.js` i18n filename staying unchanged — this is intentional, not leftover debt.

## Known / accepted

- 0 pre-existing diff-audit issues on either file before this pass; both files clean after (S7.13 does NOT apply here — `argue-better.js` has one schema per endpoint except fallacy-train's intentional dual-schema, which diff-audit correctly can't statically resolve and flags as a "current issue" on the new-file baseline; confirmed harmless live, both branches tested).
- Golden: 14/14 cases pass, covering all 13 endpoints (fallacy-train covered twice, once per branch) — includes 4 German cases (2 targeting the enum-pin fix, 1 targeting the prep headroom fix, 1 quoted-speech JSON-safety spot-check via source-check).
- Browser-verified live (not just curl): Fallacy Gym full cycle (New Exercise → Check → Correct verdict) with zero console errors and zero crashes, on a fresh tab at mobile viewport (375×812) — the exact flow that previously crashed to the CRA error overlay on every attempt.
