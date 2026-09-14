# TheRunthrough — architecture & lock notes (v1, 2026-07-02)

3-mode presentation coach: **Cut** (trim to a time limit at ~130 wpm), **Anticipate** (tough Q&A), **Hook** (openings/closings/transitions). All `claude-sonnet-4-6` via `callClaudeWithRetry` + `withLanguage` + `withLocaleContext`. In `LOCALIZED_TOOLS`.

- **Golden:** `audit/the-runthrough-golden-sample.json` (cut, ~1,280-word varied input @ 5-min target). Verify: `npm run check:golden the-runthrough`.

## DO NOT silently reverse
1. **Cut's `max_tokens` is dynamic: `Math.min(8000, 1200 + timeMinutes * 220)`** — a fixed ceiling can't serve both a 3-minute and a 30-minute target. Truncation (`stop_reason === 'max_tokens'`) returns a clean error via the shared fail-fast.
2. **Cut's guard keys on `trimmed_content`** (always-present string). It once guarded `!parsed.original_word_count && !parsed.hooks` — a numeric (falsy at 0, and the exemplar IS 0) plus a phantom field from another tool's schema.
3. Note: highly repetitive input legitimately trims to very few words (dedup is correct behavior) — judge sizing with varied content, like the golden's.
4. `difficulty` enum (`hard | very_hard | killer`) stays clean — frontend maps it to badges.

## 2026-09-14 owner rewrite — Cut mode philosophy changed, floor added after live testing
The original fill-the-time rule (land within ~15% of `timeMinutes × 130`
words, never far under — added after the model over-cut to ~36% of target
without it) was deliberately replaced by this rewrite, owner-confirmed,
with a looser "ceiling, not a quota" framing: if the source already fits,
return it essentially unchanged rather than padding; if it's too long, cut
it down. As FIRST supplied this had no explicit floor at all, and live
testing against the golden's 1,284-word/5-min case (target 650 words)
produced 295, then 372, then 94 words across three identical runs — 94 is
14% of target, worse than the original 36% bug the fill rule was built to
fix, and one run 500'd from truncation. Reported to the owner with those
numbers; the fix that shipped is RULE 3 in the Cut prompt: cut freely, but
**not below ~70% of the target word count** (computed inline per request:
`Math.round(timeMinutes * 130 * 0.7)`), framed as "cutting further hands
back a summary instead of a run-through" rather than as an arbitrary
minimum. This keeps the new "don't pad if it already fits" behavior while
preventing the collapse a bare ceiling allowed. **Guard/verify this floor
specifically if this route is ever touched again** — it is now the
load-bearing rule protecting against under-cutting, replacing the old
fill-the-time rule in that role.

Also changed (PERSONALITY + all three modes' RULES text, no schema/field
changes — same JSON keys and shapes throughout): Anticipate now generates
4-6 tough_questions (was 5-7) ordered by prep importance rather than
likelihood, and answers no longer specify a 40-80 word count. Hook now
generates 0-3 transitions (was 2-4, so a talk with no useful transition
gets none rather than a forced 2-minimum), and both mode's RULES add
explicit "do not invent" guardrails (no fabricated stats, quotes, results,
audience reactions) not present in the prior version. Frontend
(TheRunthrough.js) is byte-identical to before — this was a backend-only
prompt rewrite.
