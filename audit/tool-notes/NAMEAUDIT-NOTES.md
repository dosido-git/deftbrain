# NameAudit — Architecture & Decision Record

Known-good baseline: **tag `nameaudit-v1`**, golden **`audit/nameaudit-golden-sample.json`**
(2 of 6 endpoints: main audit + compare). Approved for Prime Time after a full end-to-end
audit (logic + output quality + 3-layer sync + localization + dark mode). The 5 gates check
structure, not output quality or cross-endpoint consistency — this note + the golden do.
**Read before changing NameAudit.**

## Shape (`backend/routes/name-audit.js`, ~610 lines)

Six endpoints, all **`claude-sonnet-4-6`** via `callClaudeWithRetry` + `withLanguage`
(no `withLocaleContext` — correct, naming has no currency/economic reasoning). All prompts
pass a plain string `content` (no array/PDF — the content-coercion bug class can't occur).

| endpoint | max_tokens | purpose |
|---|---|---|
| `/nameaudit` | 2500 | main 12-dimension deep audit (+ live domain/social checks) |
| `/nameaudit/compare` | 4000 | 2–4 names head-to-head, declares a winner |
| `/nameaudit/fix` | 2500 | suggest improvements |
| `/nameaudit/reactions` | 2500 | audience reactions |
| `/nameaudit/deepdive` | 3000 | deeper analysis |
| `/nameaudit/second-opinion` | 2500 | alternate take |

Frontend `src/tools/NameAudit.js` (~2115 lines): all 22 main-schema fields rendered
(`results.X`), inputs reach the route, `userLanguage`/locale auto-injected by `useClaudeAPI`.

## DO NOT silently reverse

1. **Model = `claude-sonnet-4-6`** (all endpoints). Mid-tier is deliberate — the analysis is
   reasoning-heavy but the short-field schema keeps it tractable. Re-test quality if changed.
2. **`max_tokens` main = 2500 is ADEQUATE *only because* the schema enforces short fields.**
   Verified: full 12-dimension output is ~1900 tokens (~7 KB), 0 retries. The main schema's
   **"One sentence" / short-value field descriptions are load-bearing** — they keep output under
   2500 AND keep the card/badge layout tight. Do NOT expand fields to paragraphs without raising
   max_tokens, or you reintroduce the truncation → parse-fail → retry-storm class.
3. **Compare red-flag scoring (THE FIX, 2026-06-25).** The `/compare` prompt MUST instruct the
   model to **cap a candidate's score (~55) when it has a disqualifying real-world conflict**
   (an existing well-known company/trademark already owns the name, unwinnable SEO crowding, or a
   serious negative meaning in a major language) and **name the conflict in `biggest_risk`**.
   Without this, compare over-scored conflicted names — e.g. "Lumen" scored STRONG/78 and *won*
   despite Lumen Technologies (NYSE: LUMN) owning it, while the deep audit (correctly) gave it
   FAIR/58 with a deal-breaker. A naming tool that crowns an un-ownable name fails at its one job.
   The **`compare-redflag` golden case guards this**: Lumen must NOT score STRONG/win.
4. **Live availability are best-effort HEURISTICS — intentional, do not "fix" into false
   precision.** `checkDomains` uses DNS resolution (a registered-but-unconfigured domain reads as
   `likely_available`); `checkSocials` uses HEAD requests (platforms block/redirect → noisy). Both
   hedged with `likely_` prefixes and robust (degrade to `unknown`, never 500). The UI disclaims
   "confirm with a registrar." Don't replace with a paid registrar/API expecting "free."
5. **`withLanguage` only, no `withLocaleContext`** (no currency). Localization layers 2/3 are N/A
   (scores are plain integers — no `formatLocale`). Layer 1 (output language) + Layer 4 (336
   `nau_` UI keys) are the live layers; keep both.
6. **Date-awareness** — `lib/claude.js` injects the current date; the prompt references "TODAY"
   and `currentYear + 10` for longevity. Keeps recency/aging claims current. Don't remove.

## Known-and-accepted

- **Latency ~40s on the main audit** (deep generation + parallel live domain/social checks).
  Acceptable for a deep-analysis tool; the frontend shows a loading state. Not a regression.

## Verifying a NameAudit change

1. Run the 5 gates (necessary, **not sufficient**).
2. With the dev backend up: **`npm run check:golden nameaudit`** — re-runs both golden cases and
   asserts no error / all sections present / non-empty stays non-empty / no truncation.
3. Eyeball: (a) main-audit numbers reconcile (section_scores avg ~ overall_score/10; grade↔score);
   (b) **the compare case still penalizes a trademark-conflicted name** (run the Lumen 4-name
   compare; Lumen must not be STRONG or the winner, and `biggest_risk` must name the conflict).
