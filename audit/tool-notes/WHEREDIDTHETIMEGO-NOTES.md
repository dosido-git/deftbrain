# WhereDidTheTimeGo — audit lock notes (`wheredidthetimego-v3.1`, 2026-09-14)

Backend `where-did-the-time-go.js` — 1 endpoint `POST /where-did-the-time-go`, `MODELS.FAST`, max_tokens 3500. Reconstructs a day or short period from the user's own account.

## 2026-09-14 v3.1 correction round

v3 (the ground-up rewrite) still let three subtler distortions through: it silently
**reclassified** activities into categories the user never used (deciding what counts as
"work," "productive," or "remaining time"); it **upgraded wording** into something stronger
than the user actually said ("checked Slack" risked becoming "interrupted/fractured the work,"
"planned deep work" risked becoming "protected time"); and it could **invent causation** —
explaining or designing a next-time experiment around a cause the user never supplied.

Added a top-level **GOVERNING RULE** right after YOUR JOB: "Reconstruct how the time was spent;
do not evaluate how well it was spent or explain why events unfolded as they did." Added three
named rules in INFERENCE DISCIPLINE: **DON'T RECLASSIFY TIME**, **DON'T UPGRADE WORDING**, and
**DON'T INVENT CAUSATION**. Added a third FINAL CHECK question naming all three so the model
audits for them explicitly before answering. Also reinforced this directly on the schema fields
most likely to drift: `the_day_you_described`'s `note` (use the user's own words for each
activity and category), `what_stands_out` (no stronger synonyms, no unstated categories), and
`try_this_next_time` (tie the suggestion to what happened, not an assumed why).

Verified live on a case built specifically to trigger these (three meetings, then a "free"
afternoon spent on email, user's own framing: "I feel like I had a free afternoon but somehow
got nothing done" — golden sample case 4): "free" stays the user's own word throughout, never
upgraded to "wasted" or "unproductive" despite the user's own dissatisfied framing; "checked
Slack" and "planned deep work" stayed verbatim in a separate test case; `try_this_next_time` was
framed as an open test ("you'll know whether X or whether Y") rather than assuming which one
caused the outcome; and `whats_still_unclear` explicitly declined to guess at causation it
couldn't support rather than inventing an answer.

## 2026-09-14 v3 — full ground-up prompt replacement (owner-authored)

Three prior correction rounds (v2, v2.1, v2.2— see git history for the full detail on each) iteratively added rules on top of the original v1→v2 rewrite: PRESERVE NUMERICAL RELATIONSHIPS, DON'T INFER ATTENTION OR CONTROL, DON'T CLAIM COMPLETE ACCOUNTING, EXPLAIN ONLY WHAT THE ACCOUNT SUPPORTS, NO UNSUPPORTED DURATIONS, NO VALUE JUDGMENTS, DON'T INVENT THE YARDSTICK, ALLOW UNEXPLAINED GAPS, NEUTRAL OBSERVATION, and the null-allowed contract on `try_this_next_time`.

This round replaces the entire prompt with one consolidated, owner-authored spec, organized around:
- **CORE EVIDENCE RULE** — use only what the user reports, times/durations they supply, chronology that follows directly, explicitly stated expectations/feelings/judgments, and direct arithmetic. Never fill gaps with what's typical, likely, or plausible.
- **TIME DISCIPLINE** — preserve the user's own level of precision; never convert "two afternoons" into hours, never assign a clock time to "after lunch," never estimate frequency for "kept checking Slack." An unaccounted stretch stays unaccounted for.
- **INFERENCE DISCIPLINE** — an explicit list of things never to infer (motive, priorities, mental state, attention, energy, anxiety, avoidance, decision fatigue, productivity, sense of control, need for recovery, definition of accomplishment, reason for switching activities). No causation from mere sequence. Value-laden words ("wasted," "lost," "unproductive") are preserved as the user's characterization, never adopted as fact.
- **PATTERN DISCIPLINE** — describe structure that's directly visible; don't manufacture an explanation for it.
- **FINAL CHECK** — two standing questions run against every field: "Did the user tell me this, can I calculate it directly, or is it an organizational observation that necessarily follows?" and "Have I turned sequence into causation, activity into psychology, an unfinished task into an intention, or missing information into an estimate?"

### Schema/section renames
- **"What Made It Feel Different" → "What Stands Out."** The owner's own diagnosis: the old name subtly instructed the model to explain WHY the period felt a certain way — exactly the failure mode driving the last unsupported "recovery/cleaning" story it produced. The new schema field (`what_stands_out`, was `what_made_it_feel_different`) asks only for organizational observations, with explicit good/bad examples baked into the prompt itself (e.g. "The calls depleted your ability to focus" is marked BAD directly in the system prompt).
- **New section: "What's Still Unclear"** (`whats_still_unclear`, new field). Genuinely optional — `null` when the account is complete enough that nothing meaningful is left uncertain (see golden case 2, a mostly-complete day). Gives the model a legitimate, named place to put uncertainty instead of manufacturing a psychological or productivity explanation to fill a gap. This is the single highest-value addition in this round.
- `the_biggest_mismatch` and `try_this_next_time` keep their v2.1 null-when-unsupported contract, now reinforced by the owner's own explicit "if no supported mismatch exists, omit this section" / "if no clearly justified suggestion exists, omit this section" language.

### Bug caught and fixed in this same round
`session_label`/`session_tags` — needed for the Recent Days history feature (added in the v2 rewrite) — are **not mentioned in the owner's supplied prompt text** (it only specifies the 5 numbered OUTPUT sections). Doing a literal replacement without adding them back would have silently broken Recent Days: the first live test after the swap showed a bare "Session" placeholder instead of a real label. Caught immediately via live verification (not by reading the diff) and fixed by adding `session_label`/`session_tags` back into the JSON schema block (kept factual/neutral, matching the v2.2 "never a value judgment unless the user used that exact word" convention) before committing. **Lesson for future full-prompt-replacement work on any tool: always check what supporting UI features (history labels, session tags, etc.) depend on fields the new prompt doesn't mention, and re-add them to the schema — a supplied rewrite covers the analytical content, not necessarily every field the surrounding UI needs.**

### Also in this round
Fixed a real frontend bug reported independently of the prompt rewrite: the submit button's loading-state text ("Tracing the hours...") was reported as disappearing on click. Extensive live testing (mutation observers catching the exact loading frame, mobile viewport, dark mode) could not reliably reproduce a color/contrast defect in the code — one anomalous reading in ~6 attempts, not reproducible again, most likely a test-harness timing artifact or a transient hot-reload glitch from concurrent locale-file edits at that exact moment. Applied a defensive fix regardless: the button's className ternary was rewritten to key off `loading || dayDescription.trim()` instead of just `dayDescription.trim()` (functionally identical today, since loading can only be true when dayDescription is already non-empty, but removes any ambiguity), and the loading-state icon/text spans got explicit `!text-white` to guarantee visibility regardless of any inherited or overridden color.

## Fixes carried forward from earlier rounds
- **Truncation risk:** the schema is much smaller than v1's (no per-activity 4-field breakdown, no invisible-hours section), so max_tokens 3500 has real headroom, but `the_day_you_described` still carries a soft cap (≤12 entries) for very long "this week" accounts.
- **German unescaped double-quotes:** prose fields quote the user's own words; the no-inner-double-quote rule is kept at both the system-prompt and schema-field level.
- **PF-2:** `c.textMuteded` + `c.label` aliases kept.

## Interface (accumulated across rounds, unchanged this round unless noted)
- Both textareas (day description, felt discrepancy) are vertically resizable.
- Zero manual cross-refs by design — `WhereDidTheTimeGo` is in `audit_v2-3-2.py`'s `NO_CROSSREF` set (the "Check your burnout risk" link was removed in v2.2).
- Recent Sessions → Recent Days; cards show the model's own `session_label`/`session_tags` and restore the complete reconstruction + original input on click.
- `wheredidthetimego-result`/`-history` are on `-v2` (bumped when the schema changed completely in the original v2 rewrite; not bumped again in v3 since the persisted shape — `{dayDescription, perceivedBreakdown, timeframe, results}` — is unchanged, only the contents of `results` differ, which every render already treats as an opaque blob keyed by field presence).

## Not bugs (verified)
- No i18n-enum, no format-strict fields (all prose/arrays), no USD-anchor.
- Guard `!Array.isArray(parsed.the_day_you_described) || !parsed.the_day_you_described.length || !Array.isArray(parsed.what_stands_out) || !parsed.what_stands_out.length` keys the two always-substantive top-level fields. `the_biggest_mismatch`, `whats_still_unclear`, and `try_this_next_time` are each independently nullable by design — do not add guards for them.

## Verify
`npm run check:golden where-did-the-time-go` (3 cases: DE verbose, mostly-complete EN day with two nulls, wasted-afternoon EN week). Backend must be up.
