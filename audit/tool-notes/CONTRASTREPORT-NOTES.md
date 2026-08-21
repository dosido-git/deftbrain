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

### 2026-08-21 — the analysis stopped reading its own fiction as evidence

Two rules now govern the post-narrative section, and they are the point of the
whole tool:

> The narrative may imagine a future. The analysis may not pretend the imagined
> future is evidence.
> The user's reaction to the stories is the material. The model's reaction to
> its OWN stories is not.

- **`the_pull` DELETED.** It reported which narrative had "more aliveness" —
  which is a fact about storytelling (novelty dramatises more easily than
  continuity), served under a heading that invites the reader to take it as
  psychological evidence. "That is not an endorsement" does not unsay it.
- **`what_i_noticed` -> `what_to_notice`**: `the_tradeoff` (their own words only),
  `watch_your_reaction` (points at the reader, never guesses what they felt),
  `a_question_to_sit_with` (derived neutrally, balanced so it leans neither way).
  The old `the_question_underneath` produced beautiful sentences that could be
  written to push either direction — the eloquence itself was the bias.
- **`the_good_moment`/`the_honest_cost` -> `a_moment_to_notice`/`a_cost_to_imagine`.**
  The model invented those costs; nobody "warned" anyone about them.
- **TEXTURE IS FREE; INTERIOR LIFE IS NOT.** Invent weather, a commute, a queue.
  Never invent motivations, values, fears, psychological tendencies, relationship
  dynamics or outcomes.
- Bottom disclaimer: "your gut reaction is the data" promoted a first feeling to
  evidence of the right answer. Now it points at the noticing.
- Golden recaptured (schema keys changed), 3/3.

### Four more, all the same shape

Each of these is the model supplying something the user did not:

- **No motive they did not state.** An uncertainty is not a motive. "I cannot
  tell whether I want this or whether I am just bored" is wondering, not
  fleeing — so "the boredom you were running from" becomes "the boredom you are
  wondering about".
- **Describe the meaningful moment; do not explain it.** "The work came from
  you, which means something" tells the reader what to feel and takes away the
  only thing that made the line worth writing. "The work came from you." Note
  the contrast with "That is not nothing", which pushes back against dismissal
  rather than assigning significance — that one is fine.
- **No invented consequence to make a cost land harder.** "Calcifies", "harder
  to reverse", "a door quietly closing" are predictions dressed as description.
  A cost can simply be the thing they already named, still there in two years.
- **`a_question_to_sit_with` illuminates the dilemma they named** rather than
  finding a deeper one underneath it. Best form isolates a variable in their own
  uncertainty. Live: "If nothing about your current job got worse — same
  manager, same hours, same work — would you still want to leave?"
- **`the_tradeoff` names the specifics** (good manager, predictable hours, two
  clients, eight months of savings) instead of gesturing at "something real",
  and does not add an inference to round it out — someone with savings and
  clients lined up is not simply giving up security.
- **`watch_your_reaction` stops at the pointing.** A scene can pull because it
  is frightening, not because it is wanted.
- Anti-verbatim line added (the NO/YES pairs are shape, not wording) — see
  [[deftbrain-voice-prompt-traps]].

