# TheAlibi — architecture & lock notes (`thealibi-v1`)

Frames an awkward truth for a specific audience — reframe + 2-3 strategic script versions + follow-up
prep + delivery tips. **Frontend:** `src/tools/TheAlibi.js`. **Backend:** `backend/routes/the-alibi.js`
(1 endpoint, `MODELS.FAST`, max_tokens 4000). **Golden:** `audit/the-alibi-golden-sample.json`.
Verify: `npm run check:golden the-alibi`.

## Audit fixes locked here (2026-07-14)
Guard `!reframe || !Array.isArray(versions)` correct; no endpoint down.
1. **🐛 German quotes (highest risk).** The output is quotable first-person scripts (`script`, `answer`,
   `question`, `nuclear_option`) and the frontend wraps them in literal quotes → unescaped `"` in
   German → invalid JSON → 500. **Fix:** the no-inner-double-quote rule (write scripts in first person,
   no quote marks). Verified DE: clean first-person script.
2. **⚠️ truncation.** `follow_up_prep` + `common_mistakes` uncapped at 4000. **Fix:** ≤4 each (versions
   already 2-3). Verified DE: ~1658 tok.
3. **⚠️→cleaned:** 6 leaks + brevity; the frontend c block was **missing** the PF-2 aliases — added
   `labelText` + `c.label`/`c.textMuteded`.

## DO NOT silently reverse
- The no-inner-double-quote rule; `follow_up_prep`/`common_mistakes` ≤4; the PF-2 aliases + `labelText`;
  no annotation suffixes.
