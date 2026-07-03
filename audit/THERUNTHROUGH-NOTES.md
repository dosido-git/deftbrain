# TheRunthrough — architecture & lock notes (v1, 2026-07-02)

3-mode presentation coach: **Cut** (trim to a time limit at ~130 wpm), **Anticipate** (tough Q&A), **Hook** (openings/closings/transitions). All `claude-sonnet-4-6` via `callClaudeWithRetry` + `withLanguage` + `withLocaleContext`. In `LOCALIZED_TOOLS`.

- **Golden:** `audit/the-runthrough-golden-sample.json` (cut, ~1,280-word varied input @ 5-min target). Verify: `npm run check:golden the-runthrough`.

## DO NOT silently reverse
1. **Cut's `trimmed_content` is the FULL deliverable, sized to the target time at ~130 words/minute, with the FILL-THE-TIME rule** (land within ~15% of `timeMinutes × 130` words; if the source is shorter than the target, keep everything and say so in pacing_notes). It once said "— 2-4 sentences" (60-word stub), and without the fill rule the model over-cut to ~36% of target. Observed with the rule: ~76% of target on formulaic synthetic input, `trimmed_est_minutes` honestly reported — real prose should land closer. `what_was_cut` capped at 3-6 items.
2. **Cut's `max_tokens` is dynamic: `Math.min(8000, 1200 + timeMinutes * 220)`** — a fixed ceiling can't serve both a 3-minute and a 30-minute target. Truncation (`stop_reason === 'max_tokens'`) returns a clean error via the shared fail-fast.
3. **Cut's guard keys on `trimmed_content`** (always-present string). It once guarded `!parsed.original_word_count && !parsed.hooks` — a numeric (falsy at 0, and the exemplar IS 0) plus a phantom field from another tool's schema.
4. Note: highly repetitive input legitimately trims to very few words (dedup is correct behavior) — judge sizing with varied content, like the golden's.
5. `difficulty` enum (`hard | very_hard | killer`) stays clean — frontend maps it to badges.
