# CultureBriefing — architecture & lock notes (`culturebriefing-v1`)

Travel culture briefing for a destination: overview + risk_level + ~11 sections (greetings, taboos, dining, dress, tipping, business, religion, transport, safety, phrases) each with dos/donts/notes + insider_tips. **Frontend:** `src/tools/CultureBriefing.js`. **Backend:** `backend/routes/culture-briefing.js` (1 endpoint). **Golden:** `audit/culture-briefing-golden-sample.json` (2 cases). Verify: `npm run check:golden culture-briefing`.

## Shape
- **1 endpoint `/api/culture-briefing`.** `claude-sonnet-4-6` (`MODELS.SMART`), **`max_tokens 5000`**, `callClaudeWithRetry` (no robustness gap), guard `!sections || !Array.isArray(sections) || !overview` (top-level). Section titles are HARDCODED in the schema; the model fills dos/donts/notes (allowed empty []). In `LOCALIZED_TOOLS`.

## Audit fixes locked here (2026-07-12)
1. **⚠️→cleaned: 11 annotations stripped** (`— 3-6 words` ×10 on the HARDCODED section titles — harmless, model doesn't generate them; `— 1-2 sentences` ×1 on `overview`, redundant with its "2–3 sentence" text). No behavior change.
2. **🐢 Bounded output for latency + scannability.** This is a HEAVY tool — sonnet at 5000 tokens generating ~11 sections runs slow (~145s EN, longer DE; observed spikes to 400s+ under API load). Added a rule: **dos/donts/notes ≤3 items each, insider_tips 3-4, each string ONE short phrase**. Keeps the briefing scannable and reduces generation time. (Did NOT switch model to haiku — that's a quality call left to the owner.)

## DO NOT silently reverse
1. **The array-cap rule** — without it the model writes long paragraphs → very slow + near the 5000 ceiling.
2. **Stripped annotations** — check-golden checks STRUCTURE not content.

## Known / accepted
- 0 baseline audit issues (was already clean — callClaudeWithRetry, guard correct).
- **SLOW tool** (~145s+/call). Golden's DE case can approach the 300s per-case timeout under API load — re-run when latency is normal if it flags.
- Golden neutralizes per-section `dos`/`donts`/`notes` to `[]` (the schema explicitly allows them empty); asserts on `sections` (~10-11), `insider_tips`, `overview`, `risk_level`.
