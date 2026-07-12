# DateNight — architecture & lock notes (`datenight-v1`)

Plans a full date-night itinerary (stops, dress, plan_b, costs) + 9 follow-up modes. **Frontend:** `src/tools/DateNight.js`. **Backend:** `backend/routes/date-night.js` (1 endpoint, **10-mode `action=` dispatch**). **Golden:** `audit/date-night-golden-sample.json` (5 cases). Verify: `npm run check:golden date-night`.

## Shape
- **1 dispatch endpoint `/api/date-night`**, `action` ∈ {generate, regenerate, swap, rate, share, similar, anniversary-deep, date-jar, rut-detect, checklist} — all frontend-used. All `claude-haiku-4-5` (`MODELS.FAST`) via `callClaudeWithRetry` (no robustness gap), each mode with its own max_tokens (1000–4000) + distinct guard (itinerary/summary/stop/message/location/pattern_summary/checklist/etc.).
- **generate** (primary): `max_tokens 3000`, shared `RESPONSE_SCHEMA`, guard `!itinerary`. Currency-aware (`sym`/withLocaleContext). In `LOCALIZED_TOOLS`.

## Audit fixes locked here (2026-07-12)
1. **⚠️→🐛 38 annotations stripped — exposed the CrowdWisdom trap again.** 27 of them lived in the shared `RESPONSE_SCHEMA` as per-field LENGTH hints. Stripping them lengthened fields → **generate 500'd in German** (truncation at 2000). **Fix:** added ONE global brevity line to `SYSTEM_PROMPT` (shared by all 10 modes) + raised `generate` `max_tokens` 2000 → **3000**. Re-verified generate/checklist/anniversary-deep/date-jar all 200 in German.

## DO NOT silently reverse
1. **The `SYSTEM_PROMPT` brevity line + generate `max_tokens 3000`** — without the brevity line, fields grow and generate truncates in German (+ cramps itinerary cards).
2. Don't re-add per-field `— one sentence`/`— 3-6 words` annotations.

## Known / accepted
- 0 baseline audit issues. All 10 guards are distinct + top-level.
- Golden covers generate (en + de-truncation-guard), checklist, anniversary-deep, date-jar. Other modes (regenerate/swap/rate/share/similar/rut-detect) are follow-ups on an existing plan — verified structurally similar; not in the golden to keep runtime down.
- Same brevity-instruction fix as [[deftbrain-crowdwisdom-architecture]].
