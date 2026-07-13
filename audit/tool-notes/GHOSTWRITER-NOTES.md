# GhostWriter — architecture & lock notes (`ghostwriter-v1`)

Turns rough bullet points into 3 polished recommendation-letter versions (narrative / structured /
concise) with writing tips, placeholders-to-fill, and power phrases; plus a refine endpoint.
**Frontend:** `src/tools/GhostWriter.js` (in `LOCALIZED_TOOLS`, `ghw_` keys; tab label masked via
`v.label.split('—')[0]`, but `buildAllCopy` emits the FULL label). **Backend:**
`backend/routes/ghost-writer.js` (2 endpoints). **Golden:** `audit/ghost-writer-golden-sample.json`
(2 cases). Verify: `npm run check:golden ghost-writer` (~70-90s generate — 3 full letters; ~16s refine).

## Shape
- `/ghost-writer` (main, **`max_tokens 7000`**) — guard `!parsed.versions` ✅.
- `/ghost-writer/refine` (2000) — guard `!parsed.refined_letter` ✅.
- Both `claude-sonnet-4-6` (`MODELS.SMART`) via `callClaudeWithRetry` + `withLanguage` + `withLocaleContext`.

## Audit fixes locked here (2026-07-12)
1. **🐛 The primary deliverable was capped to a stub.** `versions[].letter` (×3) and
   `refined_letter` were schema-exampled as `"The full letter text — 2-4 sentences"` while
   `word_count` said 350/450/200 — a direct contradiction that produced tiny letters. **Fix:**
   rewrote the field to "a complete, multi-paragraph recommendation letter of roughly the
   word_count shown below (NOT 2-3 sentences)". Verified live: letters now 337/389/171 words.
2. **🐛 Label leaked into the copied deliverable.** `versions[].label` was
   `"Narrative — Personal & Memorable — one sentence"`; the tab masks it (`split('—')[0]`) but
   `buildAllCopy` emits the **full** label into the copied text (`══ … — one sentence ══`).
   Stripped `— one sentence` (kept the intended `Narrative — Personal & Memorable`). Also stripped
   `best_for`, `placeholder`, `suggestion`, `what_changed` leaks.
3. **⚠️ Truncation risk.** With letters now real length, 3 German letters + arrays could exceed the
   old 5000. **Fix:** `max_tokens` 5000 → **7000** + array caps (writing_tips ≤4, power_phrases /
   placeholders ≤5, strengths / customize_prompts ≤3). Verified: German = 200, ~11.4KB.
4. **🧹 Removed the dead `/ghost-writer/stream` endpoint** — no frontend caller, raw
   `anthropic.messages.stream` (no retry), under-tokened at 3000 (would truncate the full schema).
   Removed the now-unused `anthropic` import too.

## DO NOT silently reverse
1. `versions[].letter` + `refined_letter` are FULL multi-paragraph letters — never "2-4 sentences".
2. NO annotation suffixes on `label` (leaks into copy), `best_for`, `placeholder`, `suggestion`, `what_changed`.
3. main `max_tokens >= 7000` + the array caps.
4. `/stream` stays deleted; don't re-add the `anthropic` import unless a real streaming caller returns.

## Known / accepted
- Quote-heavy letter prose occasionally makes attempt 1-2 parse-fail → `callClaudeWithRetry`
  recovers (expected; adds latency variance on the generate call).
