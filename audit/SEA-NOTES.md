# Social Energy Audit (SEA) — Architecture & Decision Record

Known-good baseline: **tag `sea-v1`**, golden **`audit/sea-golden-sample.json`** (3 of 6
endpoints). Approved for Prime Time after a full polish pass (logic + output + interface).
The 5 gates check structure, not output quality or layout — this note + the golden sample
do. **Read before changing SEA.**

## Shape (`backend/routes/social-energy-audit.js`)

Six endpoints, all on **`claude-haiku-4-5`** via `callClaudeWithRetry` + `withLanguage`
(no `withLocaleContext` — correct, there is no currency/economic reasoning). All prompts
pass a plain string `content` (no array/PDF — the DVT content-coercion bug class can't occur).
Frontend `src/tools/SocialEnergyAudit.js` has matching views: Log/Audit, Week Planner,
Recharge, Quick Check, Daily Check-In, Energy Forecast, Ideal Week, Journal.

## DO NOT silently reverse

1. **`max_tokens`: main = 8000, all others = 4000.** The main schema's `drains`/`rechargers`
   arrays grow **one entry per interaction**, so a 14-interaction week truncated at the old
   3000 (JSON parse-fail → retry storm → 500 for the heaviest users — this tool's core
   audience). Don't lower without re-running `check:golden`.
2. **SHORT VALUES vs PROSE — the layout contract.** The renderer shows many fields in tight
   number **cards/badges**: `energy_score.total_energy_spent` (big number), `net_energy_change`
   (badge), `drains[].energy_cost` / `performance_tax` (badges), `recovery_time.estimated_hours`,
   `weekly_budget.total_capacity/spent/remaining` (3-col cards), plan `predicted_total_cost` /
   `day.predicted_cost`, forecast `weekly_energy_budget`, ideal-week `energy_budget`. These MUST
   stay **short values** ("47/100", "-10", "6/10"). Specifying them as "one sentence" crams
   123–173-char paragraphs into narrow columns — the awkward-layout bug that was fixed. Prose
   lives in the dedicated prose fields (`one_liner`, `verdict`, `why_costly`, `why_good`).
3. **CONSISTENT NUMBERS rule** (main system prompt): `weekly_budget.spent` == `total_energy_spent`;
   `remaining` == `total_capacity` − `spent`. Keep it.
4. **Model = `claude-haiku-4-5`.** Right fast/cheap tier; quality is genuinely specific and
   data-referencing here. If ever changed, re-test output quality.
5. **Frontend render guards** — `estimated_hours` and `net_energy_change` are gated with
   `!= null && !== ''` (NOT truthiness) so a numeric `0` doesn't make React print a bare "0";
   the `net_energy_change` sign check is wrapped in `String(...)`; the forecast bar width uses
   `Number(...) || 5` clamped 0–100. Don't revert to bare-truthiness guards.
6. **Recharge handles sparse input.** `topDrains`/`preferences` are OPTIONAL — the UI's common
   path sends only `currentEnergy`. The recharge system prompt has a hard directive: infer
   advice from energy alone, NEVER ask for more info or reply with prose, ALWAYS return JSON.
   Without it, Haiku returned a clarifying question on energy-only input → 3 parse-fail retries
   → 500 (a ship-blocker found in the browser finish pass). Keep that directive. The
   `recharge-minimal` golden case (energy-only input) guards it.

## Verifying a SEA change

1. Run the 5 gates (necessary, **not sufficient**).
2. With the dev backend up: **`npm run check:golden sea`** — re-runs the 3 golden cases and
   asserts no error / all sections present / non-empty stays non-empty. Catches the truncation
   and missing-section regressions the gates miss.
3. Eyeball one main-audit output: budget cards must be short numbers, not sentences.
   (Forecast and Ideal Week share the short-value contract but aren't in the golden set —
   spot-check them if you touch their schemas.)
