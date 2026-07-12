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

## Re-lock `culturebriefing-v2` (2026-07-12) — Haiku + prompt levers + code-computed risk
Switched model **Sonnet → Haiku** (`MODELS.FAST`) after an A/B showed Haiku+prompt ≈ Sonnet quality at ~⅛ latency (~20s vs ~145s). Added 4 prompt levers: (1) **name local-language concepts** with a gloss (Haiku now surfaces *meishi/nemawashi/wasta* — the exact Sonnet advantage), (2) **weight depth by tripPurpose** (business → meetings/hierarchy/**gift-giving**), (3) **contrast against `homeCountry`** (deltas from home, not absolutes — this input was collected but unused), (4) **realistic numbers, no inflation** (killed the "carry 200 cards" overstatement). **`risk_level` is now CODE-COMPUTED**: the model returns a `cultural_gap` 0-100 (anchored rubric: US↔Canada minimal, US↔Japan-business significant, secular-West↔Gulf major, "round up when unsure"); code buckets it (`<25 low / 25-54 medium / 55+ high`) and deletes `cultural_gap` — fixes the stubborn under-rating (Haiku alone kept saying "low"). Verified across the spectrum: US→Japan=high, US→Canada=low, US→Saudi=high. Array caps + annotation strip from v1 retained. `check:golden` 2/2, gates clean. Frontend contract unchanged (`risk_level` still present).

## Re-lock `culturebriefing-v3` (2026-07-12) — richer inputs + output
Added the input/schema ideas from the v2 review. **New inputs:** `region` (city/region — sharpens advice for large countries) + `context` (free-text catch-all for who-you're-meeting + constraints: dietary/religious/alcohol/kids/accessibility). Both threaded into the prompt with a "HONOR these" rule — verified honored (dining tailored to vegetarian, region → Osaka/Kansai). **New output:** (1) a `gift_giving` section (🎁, model-translated title, renders via the existing sections loop — empty arrays when N/A); (2) `forgiveness{forgiven[], serious[]}` — minor slips locals overlook vs. mistakes that damage trust (rendered as green/red chip lists + in copy); (3) `confidence` (high/medium/low — model self-rates knowledge depth; **low → a subtle UI banner** so obscure destinations get hedged instead of hallucinated; verified Japan=high, Bhutan=medium). **i18n:** 8 new `cb_` keys × 13 languages (cb_region[_ph], cb_context[_ph], cb_forgiveness_title, cb_forgiven_label, cb_serious_label, cb_confidence_low) — localization gate green. Haiku + code-computed risk_level (v2) retained. Frontend verified in preview (inputs render, forgiveness/gift blocks render, constraints honored). `check:golden` 2/2, all gates + backend audit clean. Golden neutralizes per-section dos/donts/notes; keeps forgiveness non-empty.
