# OnePercenter — architecture & lock notes (`onepercenter-v1`)

Finds the single highest-leverage 1% change in a daily routine. **Frontend:** `src/tools/OnePercenter.js`.
**Backend:** `backend/routes/one-percenter.js` (1 endpoint, `MODELS.SMART`, **SSE streaming** via
`anthropic.messages.stream` — the client accumulates `chunk` events and parses the final JSON; no
server-side guard). **Golden:** `audit/one-percenter-golden-sample.json`. Verify: `npm run check:golden one-percenter`.

## Audit fixes locked here (2026-07-14)
1. **🐛 phantom `when_to_start` → literal "undefined" in copy.** `buildText()` emitted
   `${t('op_copy_start')} ${ch?.when_to_start}`, but the schema never emits `when_to_start` → every
   copied/shared result contained "Start: undefined". **Fix:** dropped the clause — the "when to start"
   info already lives in `implementation`. Verified DE: implementation = "Heute Abend, vor dem
   Schlafengehen…".
2. **⚠️ PF-2 missing alias.** Added `c.label = c.labelText`.
3. **⚠️→cleaned:** 8 `— one sentence` leaks on the primary render/copy fields; added a global brevity
   line to PERSONALITY.

Schema is all scalar strings (zero arrays) at `max_tokens 4000` → no truncation risk. Streaming is
intentional — keep it.

## DO NOT silently reverse
- Keep SSE streaming; NO `when_to_start` reference in `buildText()`; the `c.label` alias; the global
  brevity line in PERSONALITY; no annotation suffixes.

## Rename + full rewrite, 2026-09-05 (`OnePercenter` → `SmallChangeBigDifference`)

**Rename.** "One Percenter" → "Small Change, Big Difference," alongside the
rewrite below. Component file, `tools.js` id/title/tagline/description/guide,
`TOOL_IDS`, OG slug map (added a `SmallChangeBigDifference` key pointing at
the same `one-percenter` slug value; the old `OnePercenter` key stays, per
the `CrashPredictor` precedent), `TOOL_ALIASES`, and `localization-audit.js`
allowlist all updated. `server.js` 301s from `/OnePercenter`, `/onepercenter`,
`/one-percenter`, single-hop to `/SmallChangeBigDifference`.
**Deliberately left unchanged, per the established i18n-stability precedent
(SubSweep/DebateMe) — this tool was already locked (`onepercenter-v1` +
golden sample) before this pass:** backend route file/endpoint
(`one-percenter.js` / `/api/one-percenter`) and i18n filename/prefix
(`one-percenter.js` / `op_`). No separate request to move those was made
this time — contrast Document Detective, where the user asked for the
backend rename explicitly in a follow-up.

**SSE streaming architecture preserved unchanged.** This route predates the
v2 output standard's `callClaudeWithRetry` + `runOutputGuard` convention and
streams raw via `anthropic.messages.stream` (old tool-notes: "Streaming is
intentional — keep it"). The new schema is smaller than the old one (no more
multi-sentence "how the system works" essay or "a year from now" paragraph),
so there was no truncation-risk argument to convert it either way, and
converting to a synchronous call purely to gain the LLM-adversarial guard
was a bigger architectural change than the rewrite asked for. Instead,
`router.outputStandard = 'v2'` and `router.outputGuard = {checks:
['validateResult'], note}` are declared as metadata (matching NerveCheck's
pattern, which similarly doesn't call the imported `runOutputGuard`), and a
local regex `validateResult` — same walk/blank/prune shape as NerveCheck's —
runs once on the fully-assembled object right before the SSE `done` event.

**Why rewrite, not just rename.** "One Percenter" promised a mathematically
optimal "1%" intervention and the "largest compound effect" from nothing but
a self-described routine, then invented cortisol, melatonin, a
"threat-detection mode," fabricated compound math it had no basis for, and a
vivid one-year future the visitor supplied no evidence for.

**Five `validateResult` rule categories**, chosen to match the exact
fabrication classes named in the live bug report: invented physiology/
neuroscience (cortisol, melatonin, dopamine, nervous system,
threat-detection mode, stress debt, cognitive depletion/fuel/load,
circadian, reactive mode), claimed mathematical/scientific optimality
(mathematically optimal, highest-leverage intervention, the true
bottleneck, largest compound effect, objectively second-order), predicting
the visitor's future without evidence ("a year from now," identity
transformation — a backstop even though the schema no longer asks for this
field at all), armchair psychology about why the visitor hasn't already
made the change (resistance, discipline, blind spots), and invented
downstream time/energy/productivity savings not derivable from a supplied
quantity (hours recovered, earlier sleep onset, productivity gained).
**Math itself is NOT regex-validated** — arithmetic correctness from a
supplied quantity is a judgment call code can't make; the prompt's own MATH
section rules are the only guard there, and they held up in both live tests
(one derived "20 minutes × 5 weekdays," the other correctly omitted math
entirely since no defensible calculation existed).

**Schema replaced**: `routine_diagnosis`/`the_one_change`/
`why_not_other_things`/`the_year_from_now` → `what_i_notice`/
`change_to_try`/`why_not_start_elsewhere`/`what_to_watch_for`.
"A Year From Now" is gone with nothing replacing its promise of a
transformed future — `what_to_watch_for` replaces it with observable,
checkable signs the visitor can judge for themselves
(`signs_it_is_helping[]` / `signs_to_rethink_it[]`).

**Live-verified on two fresh routines** (the tool's own built-in examples):
neither response contained any of the banned physiology/optimality/
future-prediction/psychology language, `validateResult` found nothing to
blank on either run (a clean first draft, not a caught-and-fixed one), math
was correctly grounded in one case and correctly omitted in the other, and
"why not start elsewhere" named exactly two alternatives without claiming
either would fail. Both are now the golden sample's two cases.

**i18n.** 20 changed + 10 new + 1 title-only key (31 total) translated
across 12 languages directly (not Workflow — short, formulaic UI labels, not
long prose); 19 unchanged keys carried over as-is (the two built-in example
routines needed no changes — they're pure input text, independent of the
output schema); 12 dead keys removed, including 3 (`op_chaospilot`,
`op_premortem`, `op_futureproof`) that were already unused before this pass
(the cross-ref links use `op_xref_chaospilot` etc., a naming near-miss from
whenever those were first added). `localization-audit` and
`i18n-convention-audit` both came back clean, 0 new findings.

**localStorage**: result key bumped to `onepercenter-result-v2` (result
shape changed completely); history key (`onepercenter-history`) untouched —
it only ever stored a preview string, unaffected by the schema change.

## FULL LLM INSTRUCTIONS pass, same day, second round

The 2026-09-05 grounding rewrite above still let real fabrications through
in live testing — cortisol-adjacent physiology and "upstream of all three
problems" bottleneck-certainty language, per the follow-up bug report. This
pass is a complete CORE_PROMPT replacement, not an addition to the first
one, built around three things the first pass didn't have:

1. **A much longer named-phrase forbidden list**, close to verbatim from
   the actual bad output that prompted it ("243 hours recovered per year,"
   "protecting an empty tank," "the morning phone check is upstream of all
   three problems," a habit "losing its companion behavior," etc.) — naming
   the exact bad sentences a model produced is a stronger signal than a
   category description, the same lesson already learned on NerveCheck and
   Document Detective's own correction passes.
2. **A literal FINAL SELF-CHECK** (10 questions) the prompt asks the model
   to run against its own draft before returning — did the user actually
   say this, am I predicting certainty, did I invent a number, etc.
3. **A full WORKED EXAMPLE** embedded in the prompt (the exact phone-in-bed
   scenario from the bug report), labeled "the desired reasoning standard"
   — proven pattern in this codebase (GOOD/BAD pairs), scaled up to a
   complete worked case.

**Schema restructured**, not just the prompt:
- `math` moved from a string nested under `change_to_try` to its own
  top-level `{show, calculation, meaning}` object — the explicit boolean
  flag replaces an implicit empty-string convention, and splitting
  `calculation` from `meaning` forces the model to state what a number does
  and does not mean (the worked example's own math ends "That does NOT mean
  the change automatically creates 122 productive hours") rather than
  leaving that disclaimer to chance.
- `why_not_start_elsewhere` gained the same explicit `show` flag, and
  `alternatives` changed from a single combined string to an array of up to
  2 `{alternative, why_not_first}` objects — each alternative now carries
  its own reasoning instead of one shared paragraph trying to cover up to
  two alternatives at once. Capped at 2 in code (`capAlternatives`) as a
  structural backstop matching the prompt's own limit, same reasoning as
  Document Detective's `capArrays`.
- `what_to_watch_for.signs_it_is_helping` renamed to
  `signs_it_may_be_helping` — matches the more hedged language used
  throughout this pass.

**RULES expanded** with a new "false bottleneck certainty" category
("the chokepoint," "is the engine," "upstream of," "determines the rest of
your day") that didn't exist in the first pass at all, and the physiology
category widened to catch "threat-detecting" (not just "threat-detection"),
"ambient anxiety," "passive numbing," "doom-scrolling as compensation," and
the brain-training/rewiring/resetting verb family. The future/identity
category widened to catch "describing yourself as someone who" and
"accumulated a genuine body of" — the specific year-ahead storytelling
phrasing named in the bug report, not just the generic "a year from now."

**Frontend**: added a "WHY IT MATTERS" sub-label under What I Notice (was
unlabeled plain text); moved THE MATH out of the hero card into its own
top-level section, shown only when `math.show` is true, rendering
`calculation` (mono) and `meaning` (prose) as two distinct lines instead of
one combined string; restructured Why Not Start Elsewhere to loop over the
alternatives array, each rendering its own alternative + why-not-first pair
rather than one shared block. **localStorage result key bumped again**,
`-v2` → `-v3` — the schema changed a second time same-day, and a `-v2`
cached result would crash calling `.map()` on `why_not_start_elsewhere
.alternatives`, which used to be a string.

**i18n**: 2 new keys (`op_stage_math`, `op_why_it_matters_label`) and one
value update (`op_watch_helping` → the more hedged "Signs It May Be
Helping," matching the schema key rename) translated across all 13
languages directly. `localization-audit` and `i18n-convention-audit` both
clean.

**Live-verified on two fresh routines**: the phone-in-bed case (matching
the bug report's own scenario) came back with zero forbidden-language hits,
`math.show: true` with a correctly calibrated `meaning` field ("not a
promised saving... your actual experience will tell you"), and one
correctly-reasoned alternative; the freelance/no-boundary case came back
with `math.show` correctly omitted (no useful calculation existed) and TWO
alternatives, each with its own non-dismissive reasoning ("is a larger
adjustment," "depends on... already being under control" — never "would
fail"). Neither run triggered `validateResult` — both first drafts were
already clean.

## FINAL CORRECTIONS pass, same day, third round

The subtlest failure mode yet, and the hardest to catch with a keyword ban:
not fabricated physiology (already fixed) but ORDINARY language quietly
converting a chronological fact into a causal claim, or "creates room for a
goal" into "directly produces the goal." Live bug report gave 5 verbatim
bad quotes, all from the same underlying pattern:

- "The late endpoint of your day is the one part of the routine most
  directly connected to how rested you feel the next morning" — invents
  that the visitor established how rested they feel, and that a late
  bedtime causes morning tiredness, from nothing but a stated end-of-day
  time.
- "This is the only change... that directly addresses both the evening
  creative energy problem and the compressed, already-behind feeling" —
  claims the change PRODUCES creative energy and fixes a morning feeling,
  when at most it creates room for the former and says nothing about the
  latter.
- "Stopping screens earlier removes the main thing currently EXTENDING your
  night" — the routine established "TV or scrolling continues until
  midnight" (a sequence fact); the model silently upgraded it to "screens
  cause you to stay up" (a causal claim).
- Watch-for signals ("you get to sleep noticeably earlier," "the alarm
  feels less abrupt") that open with a presupposed downstream effect
  instead of testing what the change actually, mechanically does first.
- "The morning-phone change does nothing to address what is currently
  ENDING your night at midnight" — same causal-upgrade pattern, applied to
  dismissing an alternative.

**This is mostly a prompt-discipline fix, not a regex fix** — there's no
banned vocabulary here, it's a reasoning pattern (chronology → causation,
opportunity → production) that a keyword list can't reliably distinguish
from legitimate description without over-blocking. Three new CORE_PROMPT
sections carry the actual weight: CHRONOLOGY IS NOT CAUSATION, KEEP
MECHANICAL CLAIMS ACTUALLY MECHANICAL, and CREATES ROOM, DOES NOT PRODUCE
THE GOAL — each with the user's own BAD/GOOD pair verbatim. Two narrow
RULES entries backstop only the exact reported phrasings ("keeps you up,"
"extending/ending your night," "does nothing to address," "directly
connected to how rested/tired/energized/awake you feel," and the "is the
only change... directly addresses" pattern) — tested both directions
before shipping (5 bad quotes all matched, 4 legitimate GOOD-pattern
sentences all passed clean).

**WHAT TO WATCH FOR restructured** into an explicit 4-step ordered
template, both in the CORE_PROMPT's FUTURE PROJECTION section and in the
userPrompt's schema hint itself (reinforcement at generation time, not just
in the system prompt): (1) the direct mechanical effect happens, (2) the
visitor uses the resulting room as they'd prefer, (3) the visitor sometimes
reaches the specific goal-connected activity, (4) an open catch-all for any
other improvement — explicitly never opening with a presupposed downstream
feeling (sleep, energy, mood) the change doesn't directly produce. Same
ordering for signs_to_rethink_it.

**FINAL SELF-CHECK gained two questions** (11: did I turn a chronological
fact into a causal claim; 12: did I say the change directly produces a
stated goal it only creates room for), and a new **FINAL SELECTION RULE**
section states explicitly that the recommendation doesn't need to be proven
correct — grounded, small, goal-connected, controllable, and
observable-evidence-capable is the bar, not a strengthened causal story.
NORTH STAR gained the user's exact framing: "You may say 'This is where I'd
start.' You do not need to say 'This is why the rest of your day is going
wrong.'"

**Live-verified** on the exact scenario the bug report's quotes came from
(the phone-in-bed/evening-creative-work routine): the fresh response
described the evening purely by sequence and stated goal ("your evening
currently runs from dinner through TV or scrolling until midnight, while
you said you want to do creative work in that window"), explicitly said
"the change creates the opening, it does not fill it," ordered watch-for
signals exactly per the new template starting with "the screen-free window
exists," and described the alternative as "a reasonable experiment" rather
than dismissing it. Neither this run nor the freelance-routine companion
case triggered `validateResult` — both first drafts were already clean.
Golden re-recorded with this exact case as the reference example for all
three new corrections at once (`smallchangebigdifference-v3`).

## FINAL POLISH pass, same day, fourth round

Three more narrow phrasings, all found live testing a genuinely good
recommendation (the user explicitly said "I would not change the
recommendation. It's a very good one" — these were pure wording fixes, not
a content problem):

1. **"Entirely within your control"** — said of a freelancer whose day
   involves clients. The visitor's own routine establishes other parties
   affect the day; "entirely" overclaims. Fixed to "largely" + naming what
   actually makes it easy (no new equipment, easy to reverse).
2. **"That is useful information about what is pulling you there"** — the
   same armchair-psychology problem as `NO "WHY YOU HAVEN'T DONE THIS
   ALREADY"`, but applied mid-experiment to a relapse. Fixed to "notice
   what was happening at the time" — observe, don't presume a hidden force.
3. **"A bedtime target sits at the end of the chain"** — constructs an
   unearned causal hierarchy between alternatives instead of justifying the
   choice from supplied facts directly.

New RULES entries for all three, tested both directions. The "pulling"
regex needed a follow-up widening the same day: a live response used "pull
you back" (base verb) rather than "pulling you back" (gerund), which the
first version of the pattern didn't match — broadened to
`pull(?:s|ing)? you (?:back|there)`, re-verified both directions.

## RECENT SMALL CHANGES — experiment memory, same day, fifth addition

The biggest addition of the day: replaced the plain "Recent" history
(routine preview + date only) with an experiment-memory system. Core
principle, stated in the prompt itself: **evidence accumulates, psychology
does not** — the tool remembers what was tried and what the visitor
reported, never builds a behavioral profile.

**Data model** (`onepercenter-experiments`, a NEW store — not a version
bump of `onepercenter-history`, which is left alone and read-only as the
legacy migration path): each entry carries `originalInput`, `recommendation`
(change/whyThisOne/howToTryIt/whatItMayChange, extracted from the result),
`experimentContext.routineArea`, `checkIn` (`status` one of
unreviewed/helped/helped_a_little/not_really/not_tried,
`visitorReport`, `reviewedAt`), and the full `storedResult` for reopening
without regenerating. Capped at 15.

**The explicit product choice the user called out**: the check-in prompt
("How did it go?") is NEVER an interstitial after generating a result — it
only ever appears as a passive row in the Recent Small Changes panel below,
which a visitor sees when they return later. No code path shows it
immediately after `onDone`.

**Backend additions**:
- `routine_area` — new top-level output field, pinned to exact English
  (Morning/Daytime/Work/Evening/Sleep/Other) regardless of response
  language, same enum-pinning discipline as Document Detective's `status`
  field (a translated value would render unlabeled on the frontend, which
  matches literally).
- `previous_experiments` — new optional top-level `{used, summary,
  how_it_affected_this_choice}`. Relevance selection happens on the
  FRONTEND, not the backend (`relevantPreviousExperiments()`): only
  reviewed experiments (status != unreviewed) count as evidence, most
  recent 3. The route just formats whatever it's handed into a "PREVIOUS
  EXPERIMENT EVIDENCE" block.
- New CORE_PROMPT section, EXPERIMENT HISTORY: the recommendation from a
  prior run is historical context, never evidence of what happened — only
  the visitor's own reported outcome is evidence. An unreviewed experiment
  tells you what was recommended and when, never an outcome. A single
  experiment establishes only what was reported about that one experiment
  — never generalized into a trait or category verdict ("isn't your real
  problem," "you've discovered that," "you're becoming more disciplined,"
  all backstopped). A dedicated HISTORY SELF-CHECK (6 questions) runs
  alongside the main FINAL SELF-CHECK when evidence is supplied.
- One new RULES category for the overgeneralization phrases; the
  distinction between a prior PREDICTION and an observed RESULT is
  prompt-only — too contextual for a keyword ban.

**Frontend**: check-in UI lives entirely inside the history panel — 4
neutral-toned pill buttons (🟢/🟡/⚪/⬜, deliberately no red/trophy —
the North Star states all four outcomes are "useful evidence") plus an
optional text field with a check-in-status-dependent placeholder (helped/
helped_a_little get one example set, not_really/not_tried get another,
matching the spec). Viewing a reviewed experiment (`viewExperiment`) shows
the STORED result directly — never regenerates — and also repopulates the
input fields so "Start Over" doesn't leave them empty. Legacy
`onepercenter-history` entries render in a visually muted, non-interactive
row below the rich ones — no fabricated recommendation or check-in, per the
explicit migration rule; they're only ever read, never written to again.

**Two diff-audit findings fixed during this pass**: `bg-purple-*` is a
banned color family in this codebase (blue/purple/violet/indigo/teal/
stone/yellow/rose/pink) — the "From Your Recent Experiments" callout was
recolored to cyan (`memoryBg`/`memoryText`), reusing the tool's own brand
accent rather than introducing a new palette color. And the S1.5 name-keyed
history-preview check (`preview\s*:` must appear somewhere in the file) —
satisfied by adding a genuine `preview` field to each experiment record
(40-char truncation of the recommended change, same PF-25 convention as
every other tool's history entry), even though the row itself normally
renders `recommendation.change` directly.

**Live-verified end-to-end through the actual UI**, not just the API:
generated a result → confirmed it auto-saved as `unreviewed` → expanded
Recent Small Changes → clicked "How did it go?" → selected "Helped a
little" (confirmed the correct contextual placeholder text appeared) →
typed a report → saved → confirmed the row updated to show the emoji,
label, and quoted report with a "View →" button → clicked Start Over,
resubmitted the same routine → confirmed the resulting analysis rendered a
genuine "🧪 From Your Recent Experiments" section that correctly summarized
the prior report and reasoned from it into a meaningfully different next
experiment (moving the boundary earlier in the day) without generalizing
into a trait. Golden re-recorded with 3 cases (`smallchangebigdifference-v4`)
— the third is this exact previous-experiment-evidence scenario, the new
regression reference for the whole history feature.

**Also live-verified in production** (deftbrain.com, not just localhost),
same day: generate → auto-save as unreviewed → expand panel → check in
("Helped" + written report) → save → row updates correctly. Confirmed via
`localStorage.getItem('onepercenter-experiments')` at every step. No defect
found — this was in response to a user question ("what happened to the
Recent Small Changes implementation?") that turned out to have no bug
behind it on this specific point.

## HISTORY FINAL CORRECTIONS pass, same day, sixth addition

A live test surfaced two subtler failures in the EXPERIMENT HISTORY
reasoning itself (not the UI):

1. **A bare check-in status was read as a detailed report.** Given a
   previous experiment marked "Helped" with an EMPTY `visitorReport`, the
   model said "the evening boundary is already working" / "already helped
   with the evening" — treating the status alone as confirmation that the
   ORIGINAL recommendation's predicted effect actually occurred. A status
   is the visitor's overall rating; it is not a description of what
   changed or why. Fixed with a new prompt section (A BARE STATUS IS NOT A
   DETAILED REPORT) plus a regex backstop for the exact reported phrasing
   (`already working/helped with/resolved/fixed/solved`).

2. **Two unrelated experiments got narrated into a deliberate strategy.**
   The model produced "you've now tested both ends of the day" / "this
   targets the other bookend" — turning two independently-chosen
   experiments into a constructed cross-session plan. Nothing in the
   supplied evidence supports a "strategy" framing; each recommendation is
   chosen from the CURRENT routine and goals, not from a narrative about
   progress across visits. Fixed with a new prompt section (DO NOT
   CONSTRUCT A STRATEGY OUT OF SEPARATE EXPERIMENTS) plus a regex backstop
   for the exact reported phrasing (`tested both ends` / `other bookend` /
   `natural next place to experiment`).

The WHAT I NOTICE worked-example line was also rewritten — it had
literally been modeling the "two obvious places to intervene" framing that
caused failure #2, so the fix included cleaning up the example that was
teaching the bad pattern.

Both fixes are backstopped the same way as every prior pass: a prompt-only
section for the general judgment call (too varied/contextual for a keyword
ban) plus a narrow regex matching only the exact reported wording. Neither
rule fired on any of the 4 golden cases or on 3 additional live test calls
built specifically to exercise a bare "Helped"-with-no-report scenario —
the model got it right without needing the backstop, which is the
intended outcome (the backstop is a net, not the primary mechanism).

Also added: an explicit "Not checked in yet" label on unreviewed rows in
the Recent Small Changes list (`op_not_checked_in`, 13 languages), so an
unreviewed experiment's status is never ambiguous even without reading the
CTA button text. Verified the underlying invariant (new experiments are
always created with `checkIn.status = 'unreviewed'`, and `reviewed` is
computed as `status && status !== 'unreviewed'`) was already correct in
code — no rendering bug was actually found; this was a belt-and-suspenders
clarity addition, made defensively rather than because a defect was
reproduced.

Golden re-recorded as `smallchangebigdifference-v5`, 4 cases — the new
`freelance-bare-helped-status-no-report` case is the regression reference
for the bare-status-overclaim fix, using the exact scenario from this
pass's live testing.

**Flagged, then applied on explicit confirmation:** the correction
message's illustrative check-in list used 🔴 for "Not really" and ⚪ for
"Didn't try it," which reverses the deliberate no-red/no-trophy North Star
("all four outcomes are useful evidence") from the original Recent Small
Changes spec. Asked rather than silently changing a previously locked
design decision; user confirmed ("Yes, make the swap"). CHECK_IN_META is
now 🟢 helped / 🟡 helped_a_little / 🔴 not_really / ⚪ not_tried.
