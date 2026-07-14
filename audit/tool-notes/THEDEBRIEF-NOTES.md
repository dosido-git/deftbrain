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
