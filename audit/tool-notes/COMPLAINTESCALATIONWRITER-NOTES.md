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

---

## v2 re-lock (2026-07-19, complaintescalationwriter-v2)

**🐛 ~6 min worst-case on rich inputs** (after the NO_QUOTE_RULE fix took it from
DOWN to slow). Fix: split the single 7-section call (max_tokens 10000) into TWO
PARALLEL calls:
- `ComplaintEscalation-stages` (6000 tokens): escalation_stages only — the 5-stage
  letter-writing bulk.
- `ComplaintEscalation-strategy` (4000 tokens): situation_assessment, legal_leverage,
  evidence_checklist, timeline, quick_tips, call_script — with an explicit
  ALL-SIX-KEYS rule (golden caught one variance run omitting quick_tips/call_script).
Merge `{...strategyPart, ...stagesPart}` — response shape unchanged, frontend untouched.
Each call wraps its own withLanguage (S7.4 gate counts per-call).
Verified live: rich fridge-saga input 357s → **84s** (4.3×). Golden 3/3.

## DO NOT silently reverse (v2)
1. The parallel split; merging back re-creates the 6-min worst case.
2. The ALL-SIX-KEYS rule in the strategy prompt — it pins against trailing-key omission.
3. NO_QUOTE_RULE in both prompts (rich quote-heavy inputs previously broke JSON → retry loop).

## The DeftBrain treatment (2026-08-15)
PF-30 and PF-17c were already in place from the catalog sweep. Added here:
- **PF-31** ⌘↵ chip on Build — the handler existed, unadvertised.
- **PF-32** the history toggle was a chip in the HEADER, sitting beside the
  tool's own name. It now renders under the submit button, full width, with
  its count in the label (`cew_history` became `Past complaints ({{n}})`).
- **PF-33** the Plain Talk cross-ref moved from above the submit button to
  below it.
- Description replaced with the owner's copy. The old one was a feature list
  ("Builds a complete multi-stage escalation campaign… identifies…").

## Rewrite (2026-08-15)
- **Form reordered.** It opened with the company name; the story is what the
  visitor actually has. Now: What happened? → Company + Industry → Previous
  attempts → What would make this right? → Campaign Tone → Optional details
  (`<details>` holding amount at stake and documentation, which are supporting
  evidence and were sitting in the same four-up grid as the story fields,
  making them look equally required). Auto-detect on Industry kept — the review
  singled it out.
- **"Desired outcome" → "What would make this right?"**
- **Tone hint shortened** to "Your tone will carry through every stage of the
  campaign." The old one explained the mechanism (assertive uses stronger legal
  phrasing, empathetic acknowledges front-line staff) which is a thing to
  discover, not a thing to read before choosing.
- **The four feature cards became outcomes** under "You'll leave with:" — a
  step-by-step roadmap, the regulations that may protect you, letters you can
  send immediately, a timeline for following up. 📊 → 📅 on the last one.
- **Output pattern**: 💚 First, this matters ("you're not overreacting"), 🎯
  Today's only job ("send the next message, don't worry about stage five"), and
  💚 You're set. at the foot. All fixed copy.

**Owner's closing observation, not acted on.** Bill Rescue speaks to overwhelm;
this tool speaks to being ignored. Those are different emotional states and the
next pass should lean into frustration rather than anxiety. The two panels
above are a start, but the voice of the tool as a whole has not been rewritten
around it.

## Output rewrite — the strategist, not the litigator (2026-08-15)
A STANCE block now heads all seven prompts, with three rules that override
everything below them:

1. **No invented precision.** `estimated_resolution_likelihood` is deleted from
   the schema and the renderer. "82% if the full ladder is followed" implied a
   dataset, a methodology and a model, none of which exist.
2. **No legal conclusions.** "A clear, documentable violation" became "based on
   what you have described, this appears inconsistent with <rule>, which may
   strengthen your position." State the rule confidently, its application to
   this case tentatively.
3. **No attributed intent, no war.** `company_reputation` may describe process
   and typical timelines, never motive — "deliberately tiered to exhaust
   complainants" is unprovable and not ours to say. Pressure coaching is out:
   no never-soften, no never-counter-propose, no framing a phone call as a
   trap. Public and regulatory steps are options with trade-offs, described
   including the downsides.

**Output reordered** so the thing you can send comes third: First this matters
→ Today's only job → the escalation ladder (Stage 1, the letter, is the default
tab) → evidence checklist → "⚖️ Why your position may be stronger than you
think" (situation assessment + legal leverage, collapsed) → timeline → tips →
call script → You're set. Three statutes no longer stand between someone and
the email they came to send.

Verified live on an airline cancellation: zero percentages, zero violation
claims, zero attributed intent, zero never-rules, and the legal read came back
correctly hedged.
