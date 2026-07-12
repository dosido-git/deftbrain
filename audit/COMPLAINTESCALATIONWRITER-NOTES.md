# ComplaintEscalationWriter — architecture & lock notes (`complaintescalationwriter-v1`)

Builds a complete multi-stage consumer-escalation campaign: situation assessment, legal leverage, evidence checklist, 5 escalation stages (direct → regulatory → executive → public → financial/legal, each with ready-to-send letters), timeline, quick tips, call script. Plus a company-response analyzer and per-stage regenerator. **Frontend:** `src/tools/ComplaintEscalationWriter.js`. **Backend:** `backend/routes/complaint-escalation-writer.js` (3 endpoints). **Golden:** `audit/complaint-escalation-writer-golden-sample.json` (3 cases). Verify: `npm run check:golden complaint-escalation-writer` (needs local backend; **main is slow ~100–130s/case** — the 300s per-case timeout matters here).

## Shape
- **3 endpoints**, all `claude-sonnet-4-6` (`MODELS.SMART`) via `callClaudeWithRetry` + `withLanguage('', userLanguage)` + `withLocaleContext` (appended to the user content as `${prompt}\n\n${lang}`):
  - `/complaint-escalation-writer` (main, **`max_tokens 10000`**) — guard `!situation_assessment` (top-level).
  - `/analyze-response` (2500) — guard `!response_type` (top-level enum).
  - `/regenerate-stage` (2500) — guard `!title` (top-level).
- In `LOCALIZED_TOOLS` (`cew_` prefix); mobile clean (stage tabs `overflow-x-auto`).

## Audit fixes locked here (2026-07-12) — this tool was DOWN
1. **🐛 CRITICAL — main endpoint 500'd on EVERY input (truncation).** The 5-stage schema (with full letter bodies) always generated ~6000+ tokens → truncated at `max_tokens: 6000` → JSON parse failed at ~position 23020 → 500 after ~125s. Confirmed with rich-EN, rich-DE, AND a lean $40-blender input — all 500. **Fix (bound + headroom + fail-fast):** cap the variable arrays (**legal_leverage ≤3, evidence_checklist ≤4, quick_tips ≤3** + "keep every letter body to 2-4 sentences") **and** raise `max_tokens` to **10000** (German runs ~30% longer and truncated even at 8000) **and** switch to `callClaudeWithRetry` (so any future overflow is a fast, clear `stop_reason==='max_tokens'` error, not a 2-minute mystery parse-500). Re-verified: main EN 200 (~100s), main DE 200 (~127s).
2. **🛡️ Robustness** — the 3 endpoints ran a local 529-only `withRetry` + manual `JSON.parse` (no parse-retry, no truncation fail-fast — which is *why* the truncation surfaced as a confusing parse-500). Switched all 3 to `callClaudeWithRetry`.
3. **⚠️→cleaned: 91 annotations stripped** — `— one sentence` ×73, `— 3-6 words` ×12, `— 2-4 sentences` ×3, `— 1-2 sentences` ×2, `— 2-4 words` ×1, plus a stray `(number)`. Glued onto `letter_body` (**the actual letters users send**), subject lines, titles. Also shrinks output → truncation headroom.
4. **🧹 Removed the dead `/stream` endpoint.** Unused (frontend calls the non-streaming main) and carried a real bug: `withLanguage(userLanguage)` (one-arg) never added the language directive → its German output would have been English. Removing it let us drop the `anthropic`/`cleanJsonResponse` imports entirely.
5. **⚠️ Frontend PF-26** — `useRegisterActions(buildFullText)` passed a function *reference* (always truthy → ActionBar always shown). Fixed to `buildFullText()` (returns `''` with no results → ActionBar hides correctly).

## DO NOT silently reverse
1. **main `max_tokens: 10000` + the array caps** (legal 3 / evidence 4 / quick_tips 3) — together they prevent the German truncation. Lowering either re-breaks it (English needed ≥8000; German needed 10000).
2. **`callClaudeWithRetry` on all 3** — don't revert to bare `create` + local `withRetry`.
3. **Stripped annotations** — don't re-add; **check-golden checks STRUCTURE not content** — eyeball output after prompt edits.
4. **Don't re-add a `/stream` route with `withLanguage(userLanguage)`** — that one-arg call is a no-op for localization.

## Known / accepted
- 0 baseline `audit_v2` / backend-audit issues after the PF-26 fix.
- Golden `analyze-response` case has `red_flags` + `things_to_get_in_writing` neutralized to `[]` (variable — empty for a genuinely fair company response); `legal_leverage`/`evidence_checklist`/`quick_tips` stay non-empty (capped, always populated).
- `regenerate-stage` verified live (EN 200, `title` present) but not in the golden (keeps golden runtime down; it's structurally a single main stage).
- main is inherently slow (~100–130s) — it's a full campaign in one shot. Acceptable; was already ~125s before (just broken).
