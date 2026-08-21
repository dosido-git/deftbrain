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

## 2026-08-20 — grounding the vividness

The risk in this tool is structural: the more vivid a scene is, the more an
invented detail reads as insight. The form asked for two path labels and a bio,
then wrote two 300-word Tuesdays, so nearly everything in them was invented and
nothing said so.

- **`whatsHard`** — one new optional field, "What's making this choice hard?"
  "Stay married" / "Leave" describes two paths and says nothing about the
  conflict. This is where the decision lives, and it becomes the centre of
  gravity both days are written around (present, not discussed, not resolved).
- **"About you" -> "What matters here?"** The old label invited biography
  ("I love cooking"); the new one asks for what should shape the futures
  (parents ten minutes away). Also less intrusive for a field asking for
  something personal.
- **Path A/B carry a helper line** — "and what would change or stay the same?"
  — which grounds the input without adding a field.
- **GROUNDING block in the prompt.** Supplied facts are fixed and never
  quietly resolved; invention is allowed but must be light (weather, a queue)
  and never load-bearing (salary, diagnosis, a named person); where it IS
  load-bearing the sentence hedges visibly, because a reader who thinks "no,
  it wouldn't be like that" has learned something and a reader who cannot tell
  what was invented has not.
- **`how_to_read`** renders above both narratives: these are not predictions,
  here is what came from you, and the parts that feel wrong are data too.
- **Two example controls merged into one.** The header button loaded one fixed
  decision; a second ✕ button below rotated through six but filled only the two
  paths. `loadExample` (the audit-protected name) now rotates AND fills the
  optional context, so an example demonstrates the whole form.
- **Cross-link moved below the form.** Good routing in front of an empty form
  is an exit ramp before the entrance.
- **CTA** "Show me both futures" -> "Show me both lives", `data-print-keep` so
  the destination survives on paper while disabled.

