# WaitingModeLiberator — architecture & lock notes (v1, 2026-07-02)

ADHD "waiting mode" tool: appointments → free-window plan + prep-alarm countdown, guided block launch, anxiety-vs-reality debrief, pattern review. View state machine, 6 `claude-sonnet-4-6` actions on one route. In `LOCALIZED_TOOLS`.

- **Golden:** `audit/waiting-mode-liberator-golden-sample.json` (liberate + review). Verify: `npm run check:golden waiting-mode-liberator`.

## DO NOT silently reverse
1. **Prep alarms are PRECOMPUTED client-side and echoed by the model.** The frontend sends per-event `prepAlarm` + top-level `firstPrepAlarm`; the prompt says "echo EXACTLY — never recompute." Model arithmetic previously sat beside client math on the hero (contradiction class). The liberate golden asserts the echo.
2. **Guards must not truthiness-test numerics:** liberate guards `total_free_minutes == null && !time_blocks && !events_summary` (0 free minutes is a VALID answer — back-to-back events used to 500); review guards `trigger_patterns` (the schema exemplar for `total_sessions` is literally `0`). The review golden guards this.
3. **Timers are target-timestamp based** (`countdownTargetRef`/`blockTargetRef` + `visibilitychange` re-sync) — decrement `setInterval` counters fire the prep alarm minutes-to-hours late in throttled background tabs, which is the tool's core promise for ADHD users. Mid-check fires on `<= halfway` threshold (exact `===` skips when ticks jump).
4. **Time parsing strips `h`/`Uhr`/`時` suffixes** and the 12 non-English `wml_time_ph`/`wml_time_hint`/`wml_err_bad_time` (+_short) strings advertise ONLY parseable formats. Localized hints previously advertised "mediodía"/named words the English-only parser rejected → **non-English users could not add an event at all** — a class no localization gate catches (key parity ≠ behavior).
5. Day labels (badge + model payload) derive from `parsedDayOffset(parsed date)`, not the stored dayOffset — a past "Today" time silently auto-advances to tomorrow and all three representations must agree.
6. Keyboard handler uses the ref pattern and excludes TEXTAREA/BUTTON from plain-Enter (stale closure once submitted OLD events; Enter in the tasks textarea hijacked submit).
7. `events_summary[].type` echoes the input type exactly (clean token — frontend keys icon lookup on it); time exemplars are bare ("2:00 PM"). Liberate arrays capped (≤8 blocks, ≤4 steps) + CONSISTENT NUMBERS rule.
8. Try Example events carry `prepMinutes/travelMinutes` (missing ones rendered a literal `{{prep}}m`) and `dayOffset: 1` (immune to the past-time trap at any hour).

## 2026-08-20 — the plan stopped being a timetable

- **`time_blocks` -> `windows`.** The old schema gave every task a start and an end
  time; the output said "you're free" and then accounted for every minute of the
  evening. One owner of the day swapped for another. Windows carry the times
  (that arithmetic is the point); the 2-4 suggestions inside them do not.
  Three-way sync: backend schema, frontend renderer, golden case, copy-to-clipboard.
- **Start-with-me is now per WINDOW, after a pick.** It was under every task, which
  made the plan a set of commands. Picking a suggestion reveals "Want help getting
  started?" — help with a decision already made.
- **GROUNDING block in the liberate prompt.** The model was narrating the user's
  psychology ("a phone call is socially engaging but not mentally demanding",
  "after the walk your head will be clearer") and inventing logistics ("you have
  exactly 35 minutes built in for travel", "open your video app"). Rules: explain
  fit against TIME or STATED energy only; never predict feelings; never invent
  logistics; the prep buffer is the number THEY entered. Same anti-verbatim and
  contractions clauses as VirtualBodyDouble — see [[deftbrain-voice-prompt-traps]].
- **`reframe`** describes the situation, not the person (keep the metaphor, drop the
  diagnosis). **`worst_case`** is grounded in the plan, never in a promised state.
- **`clock_freedom`** elevated into the hero, under the countdown — it is the sentence
  that makes the rest of the page believable.
- **Debrief closes the loop**: `clockBefore` (predicted) vs `clockAfter` (reported)
  -> `clock_check`. The finding worth surfacing is "I didn't have to hold it in my
  head all day", not "the appointment was fine".
- **Removed**: `reframe` backend action + More reframes button (turned relief into
  content consumption).

### Same day, subtraction pass

The first version of `windows` swung the other way: five windows for one
dentist appointment three days out, an open day split into morning/afternoon/
evening, and an explanatory paragraph under each card.

- **At most 3-4 windows, and a free day is ONE window.** Splitting an open day
  into thirds hands the clock back the authority the tool exists to take from it.
- **`bounded`**. Clock times only where the clock actually binds (a gap between
  two commitments). A free day gets `time_label` in words — "Wide open",
  "Until 10:40 AM" — and no start/end. The output was saying "stop watching the
  clock" directly above a clock-map of the whole day.
- **The day-of window is mandatory** when the event is not today: "Appointment
  morning · Until 10:40 AM" is the whole argument in one line.
- **`fit_note` -> `note`, usually null.** "At energy 2, short physical tasks like
  moving laundry ... are exactly what this window holds" explains the recommender,
  not the recommendation. Also banned: totting up how much would still fit, which
  contradicts "one thing is enough".
- **time_label must agree with its own start/end** — a window labelled "about an
  hour and forty minutes" beside 8:20 PM - 11:00 PM costs the reader's trust in
  the arithmetic, which is the one thing this tool sells.
- **Countdown**: `62h 23m` -> `2d 14h`, and `3d` rather than `3d 0h`.

### Debrief: measures the tool's job, not the user's productivity

- **Q1 rewritten.** "Did you use your free time?" with "Crushed it" as the best
  answer contradicted the entire output, which spends its length saying the time
  is yours and doing nothing is a real option. Someone who deliberately did
  nothing had to file it under "Stayed frozen". Now: "How much of your day did
  you get back?" — Most of it / A good chunk / A little / Still felt stuck.
- **The blue "how did that compare?" callout is gone.** It asked a question with
  no answer field, below the field it would have used. The form collects; the
  output interprets. The debrief prompt now leads with the comparison.
- **Note placeholder was leading the witness** ("I worried for no reason").
  Neutral now, and the label asks what they want to remember.
- **"Skip debrief and save" saved nothing they had just answered** — the entry
  only stored a debrief if the AI call had run. Renamed "Save without debrief",
  and it stores the three answers plus clockBefore/clockAfter, which is the part
  that compounds into the history.
- **CALIBRATION rules** in the debrief prompt: one session is one data point and
  may not be described as a pattern; `trend` is null with no history; a pattern
  claim must name how many sessions; and when the dread was justified, say so
  without spin — a tool that only reports good news stops being worth reading.
  Verified both directions live.
- **Block completion removed.** The tick-box died with the timetable; the counter
  survived at a permanent zero and fed the debrief, which produced "you only
  completed 1 of 3 blocks" — exactly the scoring this pass removes, from a number
  nothing sets. Payload is `windowCount` now, with an explicit "never score them
  on it" note.

### Final subtraction

- **"Can't do the whole plan? Just pick one thing" removed** end to end (banner,
  handler, state, `one-thing` backend branch). It made sense when the output WAS
  a plan; now the page has already said you don't need to do all of this, so a
  banner asking what to do if you can't finish reintroduces the thing to fail at.
- **Weekday, not arithmetic.** "In 3 days" -> "Sunday", in the payload, the
  committed event row and the entry preview. The schema exemplars were time-only
  (`"time": "2:00 PM"`), so the model was dropping the day word it had been given
  — both now say "echo EXACTLY as given, day word included".
- **The buffer is a start time, not a journey time.** "Head out with the 35-minute
  buffer you set" still read as "the trip takes 35 minutes". Rule + NO/YES pairs:
  the alarm is the cue to start, the buffer covers getting ready AND getting there,
  and how it splits is unknown.
- **Dread language is conditioned on the number.** The slider asks how they FEEL;
  at 1-4 they are not worried and must not be written to as if they were.
- **One contextual transition instead of a link row.** The results view had no
  cross-reference at all (the two that existed were on the form and the insights
  view). Now one line where someone who picked something and still can't start is
  actually standing. The six-name "Related tools" block on the printout is the
  SITEWIDE `RelatedLinks` SEO layer, not this tool's — left alone deliberately.

### Debrief output: ordered by what was learned

- **Reordered.** The questionnaire runs time -> event -> clock, and the output walked
  back through it in that order, reaching the one genuinely new fact third. Now:
  time as a one-line headline, expectation-vs-reality as the hero card, clock as a
  small supporting line, takeaway. The discovery leads.
- **Praise card deleted** (`encouragement` -> null in the schema, render removed).
  Congratulating someone for attending an appointment this tool had no part in is
  an AI-therapist tic. New rule: NEVER end on praise.
- **The before is a number, the after is a word.** They are not one scale — "the gap
  between an 8 and okay" implies arithmetic that does not exist. Each is named in
  its own terms now.
- **No-history language**: "a few more will show WHETHER a pattern is emerging",
  not "the pattern will show itself". History is real — `wml-session-log` in
  localStorage, filtered to the same appointment type and posted as `pastDebriefs` —
  so the claim is honest, but it is per-browser, not per-account.
- **`takeaway`** stopped quoting the energy scale back at the reader ("something that
  works at a 2, not a 5").
- **`clock_check` capped at one sentence** — a supporting note, not a finding.
- **CTA**: "Save and start over" -> "Save for next time", which is what saving is for.

