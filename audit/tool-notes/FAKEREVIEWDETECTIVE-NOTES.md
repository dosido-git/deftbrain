# FakeReviewDetective — architecture & lock notes (`fakereviewdetective-v1`)

Paste (or URL-extract) product reviews → per-review authenticity scoring, cross-review pattern
analysis + manipulation playbook, same-author fingerprinting, and cross-platform synthesis.
**Frontend:** `src/tools/FakeReviewDetective.js` (in `LOCALIZED_TOOLS`, `frd_` keys;
`computeAggregateStats` runs client-side). **Backend:** `backend/routes/fake-review-detective.js`
(1 endpoint, 5-action dispatch). **Golden:** `audit/fake-review-detective-golden-sample.json`
(2 cases). Verify: `npm run check:golden fake-review-detective` (~28s score, ~43s analyze).

## Shape
1 endpoint, `action` dispatch, all `claude-sonnet-4-6`:
- `score` (8000, `callClaudeWithRetry`) · `analyze` (**6000**, `callClaudeWithRetry`) ·
  `fingerprint` (2000) · `synthesize` (2000) — all 4 share a permissive union guard
  (`scores`|`quick_verdict`|`author_groups`|`unified_trust_score`).
- `extract` (1250) — returns **TEXT** (star-formatted reviews), so it correctly uses raw
  `anthropic.messages.create` + a local retry loop, NOT the JSON `callClaudeWithRetry`. **Accepted**
  (not the local-529 anti-pattern — it's a legit text endpoint).

## Audit fixes locked here (2026-07-12)
1. **🐛 `daysAgoRange` dead field.** Both `score` and `analyze` prompts built the timing-cluster
   line with `` `${cl.count} reviews ${cl.daysAgoRange}` `` — but `computeAggregateStats` emits
   clusters as `{daysAgoStart, daysAgoEnd, count, indices}` (no `daysAgoRange`). So the model was
   fed literally `"3 reviews undefined"` — silently degrading a core fake-detection signal (review
   timing bursts). **Fix:** build the range from `daysAgoStart`/`daysAgoEnd`
   (`start===end ? 'N days ago' : 'start-end days ago'`) in both prompts.
2. **🐛 Annotation leak on the headline.** `quick_verdict.label` was `"Approach with Caution —
   one sentence"` and renders **raw** as the trust-card headline. Also `playbook.tactics_detected[].name`,
   `source_rankings[].source_name`, `disagreements[].topic` (`— 3-6 words`, rendered as titles/badges).
   **Fix:** stripped `— one sentence` / `— 3-6 words` (kept the legit `— 1-2 sentences` prose hints).
3. **⚠️ `analyze` truncation risk.** Richest schema (7 objects + `playbook.tactics_detected[]`) at
   `max_tokens 4000`. **Fix:** cap `tactics_detected` to 3-5 + `max_tokens` 4000 → **6000**.
   Verified live: German analyze = 200, clean label, 4 tactics, ~5.9KB.

## DO NOT silently reverse
1. Timing-cluster range built from `daysAgoStart`/`daysAgoEnd` — **NOT** `cl.daysAgoRange` (doesn't exist).
2. NO annotation suffixes on `quick_verdict.label` / playbook `name` / `source_name` / `topic`.
3. `analyze` `max_tokens >= 6000` + `tactics_detected` cap 3-5; `score` `max_tokens 8000`.
4. `extract` stays raw-`create` + local retry (text output, not JSON) — do not "fix" to callClaudeWithRetry.
