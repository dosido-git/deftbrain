# ColdOpenCraft — architecture & lock notes (`coldopencraft-v1`)

Cold-outreach opener generator: 3 openers ranked by boldness (safe/medium/bold) with psychology, a subject line, what-not-to-say, a follow-up plan, and a high-risk "power move". Channel-aware (email/LinkedIn/DM/in-person). **Frontend:** `src/tools/ColdOpenCraft.js`. **Backend:** `backend/routes/cold-open-craft.js` (1 endpoint). **Golden:** `audit/cold-open-craft-golden-sample.json` (2 cases: en, de). Verify: `npm run check:golden cold-open-craft` (needs local backend; sonnet ~35–50s/case).

## Shape
- **1 endpoint `/api/cold-open-craft`.** `claude-sonnet-4-6` (`MODELS.SMART`), `max_tokens 4000`, **already on `callClaudeWithRetry`** (no robustness gap) + `withLanguage(systemPrompt)` + `withLocaleContext`.
- Output: `situation_read`, `openers[3]{boldness (enum safe|medium|bold), label, message, why_it_works, response_rate (enum low|moderate|high), best_if}`, `subject_line` (null if not email), `what_not_to_say[4-5]`, `follow_up_plan{when, message, when_to_stop}`, `power_move`. Three-layer sync clean (all fields render).
- Guard `if (!parsed.openers && !parsed.situation_read)` — both **top-level, always-present** (correct AND-fallback).
- In `LOCALIZED_TOOLS` (`coc_` prefix); mobile clean (`text-[9px]` only on the short boldness/response_rate enum badges, not audit-flagged). No truncation at 4000 (DE ~49s).

## Audit fixes locked here (2026-07-12)
1. **⚠️→cleaned: 7 annotations stripped** — `— one sentence` ×5, `— 2-4 sentences` ×2 — glued onto the **primary copy-paste output**: opener `message`, `subject_line`, `follow_up_plan.message`, `power_move`, `label`. A leak here would land in the message the user actually sends. Latent (didn't echo in tests); BatchFlow class.
2. **PF-2 alias** (pre-existing frontend flag) — `c.label = c.labelText` had double-space alignment (`c.label       = c.labelText;`) so the audit's single-space PF-2 regex couldn't detect it → 1 baseline `audit_v2` flag. Normalized to single space (same gotcha as RecipeChaosSolver/MoneyDiplomat).

## DO NOT silently reverse
1. **Stripped annotations** — don't re-add `— one sentence` / `— 2-4 sentences`; **check-golden checks STRUCTURE not content** — eyeball output after prompt edits.
2. **The guard** — keep on top-level `openers`/`situation_read`.
3. **PF-2 alias single-space** — don't re-align with padding spaces; the audit regex needs `c.label = c.labelText`.

## Known / accepted
- 0 baseline issues after the PF-2 fix (both audits clean).
- No arrays neutralized — `openers` (always 3) and `what_not_to_say` (4-5) are always populated; `subject_line` is a nullable scalar (null for non-email channels — not an array, so check-golden doesn't assert it).
- Enum values (`boldness`, `response_rate`) are clean pipe-lists — the frontend `boldnessColor`/`responseColor`/`boldnessEmoji` switch on them; kept annotation-free.
