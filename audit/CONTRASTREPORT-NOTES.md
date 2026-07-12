# ContrastReport (Which Life?) — architecture & lock notes (`contrastreport-v1`)

Two-path life-decision contrast: frames the decision, narrates a vivid "day in each life" (path_a / path_b with best moment + honest cost), then what-you're-trading reflection. **Display name "Which Life?"** (renamed from What If?); **route stays `/contrast-report`**, frontend file `src/tools/WhichLife.js`. **Backend:** `backend/routes/contrast-report.js` (2 endpoints). **Golden:** `audit/contrast-report-golden-sample.json` (2 cases). Verify: `npm run check:golden contrast-report` (~28–35s/case).

## Shape
- **Main `/contrast-report`** (used by frontend) — `claude-sonnet-4-6` (`MODELS.SMART`), `max_tokens 2000`, `callClaudeWithRetry`, guard `!path_a || !path_b` (top-level). Output: decision_framed, path_a{label,narrative,the_good_moment,the_honest_cost}, path_b{…}, what_i_noticed{the_pull,what_youre_trading,the_question_underneath}. **No arrays.**
- **`/contrast-report/stream`** — documented raw `anthropic.messages.stream` SSE endpoint (`max_tokens 4000`). **Currently unused by the frontend** (it calls the non-streaming main; line 419 "Streaming Progress" is just a UI progress indicator). Kept — uses the correct two-arg `withLanguage(PERSONALITY, userLanguage)` (no bug), harmless.
- In `LOCALIZED_TOOLS` (`WhichLife` keys).

## Audit fixes locked here (2026-07-12)
1. **⚠️→cleaned: 3 annotations stripped** — `— one sentence` ×2 + a stray `(number)` that was wrongly glued onto a **prose** field (`the_honest_cost: "The single hardest moment. (number)"` — it's not a number).

## DO NOT silently reverse
1. **Stripped annotations** — check-golden checks STRUCTURE not content.
2. Route stays `/contrast-report` despite the display rename to "Which Life?".

## Known / accepted
- 0 baseline audit issues (was clean). No truncation at 2000 (modest schema, DE ~35s).
- No golden neutralization — no arrays; all fields are objects/strings.
- This tool was earlier repaired for a dead-model 500 (lib/claude default) + a silent handleSubmit fail — those predate this lock; verified working here.
