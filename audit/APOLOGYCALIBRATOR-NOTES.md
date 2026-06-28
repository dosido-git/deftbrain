# ApologyCalibrator — architecture & lock notes

**Known-good:** tag `apologycalibrator-v1` · golden `audit/apology-calibrator-golden-sample.json`
**Verify:** `npm run check:golden apology-calibrator` (backend up: `npm run dev:backend`)

## What it is
A full-spectrum apology coach (sensitive domain — apology / forgiveness / manipulation
detection, handled with a never-shame, validate-without-catastrophizing tone). Frontend
`src/tools/ApologyCalibrator.js` (~2660 lines, 11 feature tabs). Backend
`backend/routes/apology-calibrator.js` — **11 endpoints**, all `claude-sonnet-4-6`, all via
`callClaudeWithRetry`, each with a **distinct, correct** success guard:

| Endpoint | guard field | max_tokens |
|---|---|---|
| `/apology-calibrator` (calibrate) | `level_name` | 2500 |
| `/detect` | `overall_grade` | 2000 |
| `/delivery` | `when` | 2000 |
| `/audit` | `pattern` | 2500 |
| `/cultural` | `culture_context` | 2000 |
| `/decode` | `verdict` | 2500 |
| `/practice` | `in_character_response` (both branches) | 4000 |
| `/forgive` | `situation_read` | 2500 |
| `/roadmap` | `damage_assessment` | **4500** |
| `/letter` | `letter_approach` | **4000** |
| `/fix` | `diagnosis` | 2500 |

## DO NOT silently reverse (the locked fixes)
1. **`roadmap` max_tokens ≥ 4500.** It was 3000 — the 5-phase nested schema (each phase has
   actions[], say/avoid/milestone, plus trust_rebuilding_signals[], red_flags, etc.) **truncated
   mid-array** → deterministic JSON parse-fail on all 3 retries → **500 for any serious scenario**.
   4500 clears the ~4000 it needs; generation runs ~70s (well under the 180s golden timeout). The
   golden's `roadmap-betrayed-trust` case guards this (it 500'd before the fix).
2. **`letter` max_tokens ≥ 4000.** It generates multiple complete letters — borderline at 3000;
   bumped to 4000 for defensive headroom.
3. **No `(number)` / `(true/false)` annotations on string fields.** Three schema fields had stray
   type annotations while being rendered as plain text:
   `delivery.after_the_apology.next_24_hours` and `letter.structure_guide.impact` (`(number)`),
   and `roadmap.damage_assessment.can_this_be_fully_repaired` (`(true/false)` — the worst: the
   frontend renders it as `{val && <p>{val}</p>}`, so a literal boolean would render a blank `<p>`).
   All three are now "— one sentence". Keep them as sentences.
4. **All 11 endpoints on `claude-sonnet-4-6`.** Guards are correct per-schema — don't copy-paste
   a guard from one endpoint to another (that's the MeetingBSDetector failure class).

## Frontend
`buildFullText` is view-aware and covers 10 views; **`practice` is intentionally excluded** (it's
an interactive multi-turn role-play, not a static result — nothing to copy). All 11 endpoints are
wired. Mobile clean at 375px (home + calibrate result — no overflow/crush). Fully localized
(`apc_*`, 13 languages; Spanish verified).

## Gotchas
- **Backend rate limit = 4 req/min.** `check:golden` runs 3 cases sequentially and fits.
- **`roadmap` is slow (~70s)** by nature (comprehensive multi-week plan). The golden runner's
  180s per-case timeout covers it; capture it with a long-timeout fetch, not a short `curl -m`.
- **Restart the backend after route edits** (started via `node`, not nodemon).
- Phase-1 lesson: test the **max-schema** endpoints (roadmap, letter), not just the small ones —
  the truncation bug only surfaced on roadmap.
