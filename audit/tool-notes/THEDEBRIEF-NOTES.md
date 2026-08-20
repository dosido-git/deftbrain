# TheDebrief — architecture & lock notes (`thedebrief-v1`)

Meeting-transcript analyzer — distill decisions/actions/questions (distill), draft follow-up messages
(followup), and find patterns across a series (series). **Frontend:** `src/tools/TheDebrief.js`.
**Backend:** `backend/routes/the-debrief.js` (3 endpoints, `MODELS.SMART`; distill **4000**, followup
3000, series **3500**). **Golden:** `audit/the-debrief-golden-sample.json` (2 DE cases). Verify:
`npm run check:golden the-debrief`.

## Audit fixes locked here (2026-07-14)
All 3 guards correct (meeting_summary / group_email / series_summary top-level); no endpoint down.
1. **🐛 Truncation.** distill + series both at `max_tokens 2500` with uncapped arrays over large
   transcripts (up to 30k chars). **Fix:** distill 4000 (decisions ≤8, action_items ≤12,
   open_questions ≤6, parking_lot ≤6, tensions ≤5); series 3500 (recurring_topics/accountability_gaps/
   decisions_revisited/next_meeting_agenda ≤6); followup individual_nudges ≤8 / calendar_invites ≤6.
   Verified DE.
2. **🐛 German quotes.** Email/message body fields → unescaped quotes in German → 500. **Fix:** the
   no-inner-double-quote rule on all 3.
3. **🐛 near-empty series copy.** `buildCopy` routed the series mode → `buildDistillCopy` (which reads
   meeting_summary/decisions — fields the series response doesn't emit) → copy/export was header+brand
   only. **Fix:** added `buildSeriesCopy` and wired it into `buildCopy`.
4. **⚠️→cleaned:** 43 annotation leaks (incl a `(number)` on series `frequency` prose); PF-2 aliases +
   `labelText` added.

## DO NOT silently reverse
- Array caps + distill 4000 / series 3500; the no-inner-double-quote rule ×3; `buildSeriesCopy` wired
  into `buildCopy`; PF-2 aliases; no annotation suffixes.

## The line this tool lives on (2026-08-19) — read before touching any prompt here

The Debrief earns its place by noticing **ambiguity, ownership gaps, unanswered
questions, communication risk and organisational tension**. The moment it starts
scoring people, diagnosing motives, or ruling on whether a meeting deserved to
happen, it becomes Meeting BS Detector with a worse name — and those are two
different products that should stay different.

`OBSERVE_NOT_ACCUSE` in `backend/routes/the-debrief.js` holds that line, on both
the distill and series prompts. It carries worked pairs, not a banned-word list,
because a list of forbidden words has never moved a voice in this codebase:

| Prosecutorial | Observational |
| --- | --- |
| This meeting delivered almost no usable information — it could have been a one-line message. | This meeting was primarily informational rather than decision-oriented. |
| A meeting with no agenda and no decisions is a known pattern in organisations managing difficult news. | Meetings like this often occur when organisations are still working through sensitive or unresolved issues. |
| Nobody took responsibility for the dashboard. | The dashboard has no named owner. |
| Mike keeps dodging the deadline question. | The deadline question was raised twice and not answered. |

**Structural facts stay blunt.** An action with no owner has no owner, and
saying so is not an accusation. What softens is the *reading laid over* the
facts — motive, competence, whether the meeting was worth holding.

Two related decisions from the same pass:

- **No numeric scoring anywhere.** `meeting_health.efficiency` used to return
  "~90%". The number came from nowhere and the precision implied a measurement.
  Percentages, scores, grades and one-word ratings are all forbidden in the
  schema. Do not reintroduce a score because it "reads cleaner".
- **The section is `td_meeting_health` but it is titled "What this meeting
  revealed".** It is not evaluating the meeting; it is reading the
  communication. The key name is historical — do not rename the visible label
  back to anything that grades.

## DO NOT silently reverse (continued)
- `OBSERVE_NOT_ACCUSE` on both prompts; the no-numbers rule in `meeting_health`;
  the "What this meeting revealed" heading.
