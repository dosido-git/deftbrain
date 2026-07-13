# BillRescue — architecture & lock notes (`billrescue-v1`)

Turns a scary bill into a concrete rescue plan: shame-to-action reframe, know-your-rights, action steps, phone scripts, payment-plan strategy, escalation ladder, a ready-to-send hardship letter, assistance programs, and a worst-case reality check. **Frontend:** `src/tools/BillRescue.js`. **Backend:** `backend/routes/bill-rescue.js` (5 endpoints). **Golden:** `audit/bill-rescue-golden-sample.json` (3 cases). Verify: `npm run check:golden bill-rescue` (needs local backend; main ~80–95s/case, rehearse ~15s).

## Shape
- **5 endpoints**, all `claude-sonnet-4-6` (`MODELS.SMART`) + `withLanguage` + `withLocaleContext`:
  - `/api/bill-rescue` (main, `max_tokens: 6000`) — the full rescue plan; multipart-capable (pasted bill / bill photo) so it uses a **direct `anthropic.messages.create`**, not the string-only `callClaudeWithRetry`.
  - `/api/bill-rescue/rehearse` (`max_tokens: 1000`) — multi-turn negotiation role-play; also direct `create` (conversation array).
  - `/api/bill-rescue/triage`, `/quick-check`, `/letter` — use `callClaudeWithRetry` (resilient, retry built in).
- Main output (13 sections): `shame_to_action`, `know_your_rights[]`, `action_steps[]`, `phone_script`, `payment_plan`, `escalation_ladder[]`, `hardship_letter`, `what_they_wont_tell_you[]`, `assistance_programs[]`, `worst_case`, `worst_case_reassurance`, `follow_up`, `permission`. The 5 arrays are always populated for a real bill.
- Money is locale-correct: **en-GB used £, 0 `$`, surfaced real UK "Warm Home Discount Scheme" with no US programs leaking** (verified Phase 1). `withLocaleContext` on all endpoints; no hardcoded `$` exemplars.
- In `LOCALIZED_TOOLS`; mobile clean at 375px.

## Audit fixes locked here (2026-07-11)

1. **🐛 CRITICAL — German (and other non-English) main/rehearse 500 / retry-storm from invalid JSON escapes.** The main + rehearse endpoints `JSON.parse` directly (multipart/multi-turn can't use the string-only retry helper). In German, the model renders quoted phone-script speech as **`\'Guten Tag...\'`** — an **escaped single-quote**, which **JSON forbids** (`\'` is never a valid escape) → `SyntaxError` → 500. Intermittent-looking but frequent (~½–⅔ of German generations).
   - **Root-cause fix (shared, deterministic):** `repairJsonStrings` in `backend/lib/claude.js` now **drops a stray backslash before any invalid JSON escape char** (`\'` → `'`, and any non-`"\/bfnrtu` escape). **Provably a no-op on valid JSON** (well-formed output never contains an invalid escape) — unit-tested that valid `\n \" \\ \t` and plain apostrophes survive untouched. This benefits **every** tool's parse path, not just BillRescue.
   - **Belt-and-suspenders:** added `createParseRetry(params, attempts=3)` local helper (wraps `create` + `cleanJsonResponse` + `JSON.parse`, retries only on `SyntaxError`, bubbles API/network errors) and swapped the two direct-`create` endpoints (main, rehearse) onto it. With the shared repair in place this now essentially never fires — before the repair it "worked" but at **~262s** (two 90s retries) which would time out at the prod gateway, i.e. not actually a fix. The repair is the fix; the retry is the safety net.
   - **Prompt steer (kept):** all 6 system prompts carry a "STRICTLY valid JSON — use single quotes for quoted speech" line. This deliberately steers the model toward single-quotes (whose only failure mode, `\'`, is deterministically repairable) and **away** from unescaped **double**-quotes (which are much harder to repair). English already writes `'...'` unescaped (valid) so it's unaffected.
   - Re-verified: German main **200 first-try in ~93s, 0 retries**; EN main 200 ~81s; German rehearse 200.

2. **⚠️→cleaned: 39 `— one sentence` annotations stripped** from the prompts (same leak class as BatchFlow/BeliefStressTest — model can echo them literally into rendered fields). Output verified annotation-free EN + DE.

3. **PF root-div spacing.** `src/tools/BillRescue.js` root return `space-y-3` → `space-y-4` (CONVENTIONS.md root-div pattern; cleared the S1.2 `audit_v2` flag).

## DO NOT silently reverse
1. **The `repairJsonStrings` invalid-escape repair** (`backend/lib/claude.js`) — it's shared; removing it re-breaks German/quoted-speech JSON across tools. It's a no-op on valid JSON, so it can only help.
2. **`createParseRetry` on main + rehearse** — the other 3 endpoints get retry via `callClaudeWithRetry`; these two can't (multipart/multi-turn), so they need this wrapper.
3. **Main `max_tokens: 6000`** — the 13-section schema needs it; lowering truncates.
4. **Stripped annotations** — don't re-add `— one sentence`; **check-golden checks STRUCTURE not content**, so a re-introduced leak won't be caught — eyeball output after prompt edits.

## Known / accepted
- 0 baseline `audit_v2` / backend-audit issues after the space-y fix.
- Golden `main-de-escape-guard` case specifically exists to catch regressions of fix #1 — its input contains German imperative speech ("sagen Sie …") that reliably provokes the `\'` pattern.
- Golden inputs put the bill narrative in the `reason` field (frontend splits `reason` category + `details` free-text); backend interpolates either — the structural golden is faithful for replay.
- `check:golden bill-rescue` runs long (2 main cases at ~90s each); the runner's per-case timeout is 300s.
