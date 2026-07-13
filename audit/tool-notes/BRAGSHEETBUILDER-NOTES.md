# BragSheetBuilder — architecture & lock notes (`bragsheetbuilder-v1`)

Turns humble, self-deprecating accomplishment descriptions into powerful, metrics-driven achievement statements, then extends them: STAR stories, resume/LinkedIn bullets, a skills radar, a JD-tailoring pass, a behavioral-interview question matrix, a memory-jogging "excavator," and a voice-match rewrite. **Frontend:** `src/tools/BragSheetBuilder.js`. **Backend:** `backend/routes/brag-sheet-builder.js` (10 endpoints). **Golden:** `audit/brag-sheet-builder-golden-sample.json` (3 cases). Verify: `npm run check:golden brag-sheet-builder` (needs local backend; ~30–55s/case).

## Shape
- **10 endpoints**, ALL `claude-sonnet-4-6` (`MODELS.SMART`) + `callClaudeWithRetry` + `withLanguage` + `withLocaleContext`. Each has a **distinct success guard, all keying on the schema's top-level first field** (verified — no RoomReader-class nested-guard bug):
  - `/brag-sheet-builder` (main, `max_tokens 4000`) — guard `transformations||transformed||bullets||achievements||brag_sheet`
  - `/brag-sheet-refine` (2500) `upgraded_transformations` · `/brag-sheet-tweak` (4000) `improved` · `/brag-sheet-add-single` (4000) `transformation` · `/brag-sheet-star` (4000) `title` · `/brag-sheet-excavate` (**4000**) `categories` · `/brag-sheet-tailor` (3000) `jd_requirements` · `/brag-sheet-radar` (3000) `dimensions` · `/brag-sheet-interview-matrix` (**4500**) `questions` · `/brag-sheet-voice-match` (3000) `voice_profile`
- In `LOCALIZED_TOOLS` (`bsb_` prefix); mobile clean (tab bar `overflow-x-auto` scrollable, responsive `grid-cols-1 sm:grid-cols-2`). Frontend renders `improved`/`what_changed`/`why_you_deserve_this`/`title`/`name` **raw** (interpolated) — so any annotation leak would be visible.

## Audit fixes locked here (2026-07-11)

1. **🐛 German truncation 500 — `excavate` (was `max_tokens 2500`).** 6 fixed categories × **3–4** questions (up to 24) each with a verbose `exampleAccomplishment` → EN fit ~2093 tok but German (+~30%) overran 2500 → `Response truncated at max_tokens` → 500. **Fix (bound + headroom):** cap to **exactly 3 questions/category** (18 max) **and** `max_tokens` → **4000**. Re-verified German 200, 6×3.
2. **🐛 German truncation 500 — `interview-matrix` (was `max_tokens 3000`).** **10–15** behavioral questions, each with a nested `best_match{angle, opening_line}` (both long) → EN ~2194 tok / 15 Q, German overran 3000 → 500. **Fix:** cap to **10–12 questions** **and** `max_tokens` → **4500**. Re-verified German 200, 12 Q.
   - Both bugs are invisible to the gates (structure/lint only) — only surfaced on **live non-English** exercise. Same class as AlternatePath/SkillGapMap/BeliefStressTest.
3. **⚠️→cleaned: 72 annotation leaks stripped** — `— one sentence` ×59 (grew across compound fields), `— 3-6 words` ×9, `— 1-2 sentences` ×3, `— a single number` ×1. Glued onto field descriptions **and value examples** (e.g. `verb_upgrades:{"from":"helped — one sentence"}`, `title:"… — 3-6 words"`). Proven-non-deterministic leak (didn't echo in test runs here, but the BatchFlow precedent shows it can echo literally into raw-rendered fields). Stripping also shrinks output → extra truncation headroom. The compound `total_estimated_value: "… — a single number or range. — one sentence"` was rewritten to `"… as a single number or range"` (kept the useful format hint, dropped the dash-glue).

## DO NOT silently reverse
1. **excavate: "exactly 3 questions/category" + `max_tokens 4000`** — together they prevent the German truncation. Don't restore "3-4" or lower max_tokens.
2. **interview-matrix: "10-12 questions" + `max_tokens 4500`** — same; don't restore "10-15" or lower.
3. **Stripped annotations** — don't re-add `— one sentence` / `— 3-6 words` / `— 1-2 sentences` to any field; **check-golden checks STRUCTURE not content**, so a re-introduced leak won't be caught — eyeball output after prompt edits.
4. **Guards** — all 10 key on their schema's top-level first field; keep it that way (a nullable/nested guard field = always-500 or always-pass bug).

## Known / accepted
- 0 baseline `audit_v2` / backend-audit issues.
- main/refine/voice-match/radar/tailor left as-is — verified fine, incl. **main at 8 German accomplishments** (~2637 tok at 4000). Accomplishments are unbounded in the UI, so a pathological 15+ German brag sheet could still pressure main's 4000 — not fixed (unrealistic; note for future if reported).
- Golden `interview-matrix` case has `gaps` neutralized to `[]` (variable — empty when interview coverage is complete); `questions`/`categories` stay non-empty (always 10–12 / 6×3).
