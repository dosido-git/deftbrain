# EmailUrgencyTriager — architecture & lock notes (`emailurgencytriager-v1`)

Paste an inbox → triage into now / this_week / optional with per-email analysis (thread escalation,
cry-wolf sender profiling, category, draft replies), plus recurring-sender patterns and an
anxiety-relief block. Second action composes/refines a single reply. **Frontend:**
`src/tools/EmailUrgencyTriager.js` (in `LOCALIZED_TOOLS`, `eut_` keys). **Backend:**
`backend/routes/email-urgency-triager.js` (1 endpoint, in-body `action` dispatch). **Golden:**
`audit/email-urgency-triager-golden-sample.json` (2 cases). Verify: `npm run check:golden email-urgency-triager` (~30s triage, ~6s compose).

## Shape
- `/email-urgency-triager` (triage, **`max_tokens 8000`**) — guard `!Array.isArray(urgency_analysis)`.
- `action:'compose'` → `handleCompose` (2000) — guard `!composed_reply`.
- Both `claude-sonnet-4-6` via `callClaudeWithRetry` + `withLanguage` + `withLocaleContext`. Guards ✅.

## Audit fixes locked here (2026-07-12)
1. **🐛 Three-layer sync break — Sender Patterns section never rendered.** Frontend read
   `results.sender_profiles.always_urgent_senders / always_optional_senders / delegation_count`,
   but the backend emits those under `recurring_patterns.always_*_senders` and
   `summary.delegation_count` (no `sender_profiles` object exists). **Fix:** repointed the frontend
   (`EmailUrgencyTriager.js` ~:585-594) to the real fields. The model's sender-pattern output was
   being silently dropped.
2. **🐛 Enum-value annotation leaks.** `urgency_tier` (`"now / this_week / optional — 2-4 words"`),
   `email_category`, `for_urgency` had annotations glued to the enum values. The frontend
   normalizes `urgency_tier` and buckets emails into now/this_week/optional columns — a leaked
   `"now — 2-4 words"` matches no tier → the email vanishes from all columns. **Fix:** stripped.
3. **⚠️→cleaned: copy-paste + misc leaks.** `composed_reply`/`subject_line`/`draft_reply`
   (`— one sentence` — the reply/subject a user sends) and `estimated_time` (bogus `(number)` on a
   string). Stripped. Added a global brevity rule + kept the legit `— 2-4 sentences` on
   `response_templates`.
4. **⚠️ Truncation risk.** `urgency_analysis[]` is one object per pasted email — unbounded at
   6000. **Fix:** "analyze AT MOST 20 emails (note the rest in batch_insights)" + `max_tokens`
   6000 → **8000**. Verified live: 4-email German paste = 200, clean tiers, ~5KB.

## DO NOT silently reverse
1. Frontend reads `recurring_patterns.always_*_senders` + `summary.delegation_count` — NOT `sender_profiles`.
2. NO annotation suffixes on enum values (`urgency_tier`/`email_category`/`for_urgency`) — the
   frontend switches on them; a leak drops emails from the UI.
3. NO annotations on copy-paste output (`composed_reply`/`subject_line`/`draft_reply`).
4. Triage `max_tokens >= 8000` + the "AT MOST 20 emails" cap.
