# Crisis Prioritizer — V2 integration (2026-08-24)

Owner supplied a matched frontend/backend pair implementing
`CRISIS_PRIORITIZER_V2`. Both files landed in the repo directly; this pass was
integration, not redesign. The design, flow and copy are the owner's and are
preserved verbatim.

## Gate 9 — the item the README left explicit

`router.outputGuard = 'crisis-prioritizer-v2'` is a **string**. It reads as a
declaration to a human and enforces nothing, and Gate 9's regex matches it
either way — which is exactly how Crash Predictor shipped with a guard that
never ran. Replaced with a profile whose terms are the V2 contract's deleted
concepts, each turned into something the validator can catch:

```
prohibit: invented_deadline_or_consequence, invented_dependency_or_commitment,
          psychological_read_of_the_visitor, objective_urgency_claim,
          risk_scoring_or_accuracy_percentage, universal_energy_curve,
          unrequested_self_care_prescription,
          overcommitment_diagnosis_without_arithmetic, no_deadline_stated_as_fact
require:  ranking_traceable_to_supplied_facts,
          unknowns_surfaced_rather_than_filled_in, fulfills_tool_promise
```

All twelve actions funnel through one `ask()`, so `runOutputGuard` is wired
there — "every LLM result", per the contract. `suppliedFrom(req.body)` gives it
the visitor's own input as the only source of truth, with the rule that silence
about a deadline is *not supplied*, never *no deadline*.

It earns its place. On the first live runs the guard caught `invented_fact` and
`unsupported_prediction` on `do_next[0].why_next` and `capacity_fit.summary` —
a model filling in why a task follows another when the visitor never said. The
`just-one-thing` action passed clean.

Also added `withLocaleContext` (localization layer 2, absent from the supplied
file) and made `follow-up` accept `lastSession` as well as `originalPlan`.

## Frontend — 32 audit findings and 53 localization issues

The file rendered the V2 schema correctly and carried none of the house layer.
Fixed without touching the design:

| | Was | Now |
| --- | --- | --- |
| Localization | none — no `useTranslation`, every string hardcoded | 88 keys × 13 languages (`cp2_*`) |
| Header | no icon, tagline or Try an example | PF-30 / PF-17c header card |
| Palette | 3 keys, `c.muted` (banned), no `card`/`border`/`btnPrimary` | full house set + PF-2 aliases + `linkStyle` |
| Copy-out | `BRAND` declared, never used; a hand-rolled `copyText` | `useRegisterActions(buildFullText())` (rule 2 and 4) |
| Results | `useState` — lost on reload | `usePersistentState` |
| Journal | written every run, never read | rendered as recent plans, with a `preview` field |
| Re-triage | `window.prompt('…separated by semicolons')` | tick the tasks already on screen |
| Keyboard | none | ⌘↵ handler + PF-31 chip |
| Cross-refs | none | pre-result (Brain Dump Buddy), post-result (Batch Flow · PEP) |

**The v1 `cp_*` catalog was orphaned.** 3,446 key lines across 13 languages
describing anxiety-vs-reality, urgency-accuracy scores and psychological
profiling — all deleted from the product. Replaced with the `cp2_*` catalog
rather than left as dead weight beside it.

**PF-25 masked itself.** The rule reports only the *first* `slice(0, N>6)`
whose preceding 150 characters mention history/journal/log. My own comment on a
headline-truncation slice contained the word "history", so that line absorbed
the single report and the real 20-session cap below it was never checked.
Reworded the comment and moved the exception note to the actual cap.

Catalog copy also carried deleted concepts — `seoDescription` promised to
"separate real urgency from anxiety urgency" and to rank by "what actually
breaks if you skip them". Rewritten; `tagline` now matches the page exactly,
since PF-30 renders it.

**Live:** generate 20.8s EN / 21.7s DE, just-one-thing 6.2s, all 200.
Browser: header, example, full result render, progress panel; Arabic RTL clean,
no tofu, no overflow at 375px.

## Button hierarchy — 2026-08-24

The two bottom actions sat in a 50/50 grid at the same height and text size,
so they read as a choice between equals. Experience guidelines: "If a visitor
is unsure what to do next, the screen has failed."

Prioritize These Tasks now owns the full width at 56px and 16px/700 in filled
cyan. Just Tell Me ONE Thing sits beneath it, centred, as an underlined ghost
control at 44px and 14px/600 — still obviously pressable, no longer competing.
Measured 697×56 against 197×44: 4.5× the area.

## "Safe to defer" + answerable facts — 2026-08-24

**The defer rule lived in the wrong place.** "Do not claim delay is
consequence-free" sat in the *generate* action's instructions, so `re-triage`
and `plan-period` — which also produce `can_probably_wait` — never saw it.
Promoted to system-prompt rule 9a, where all twelve actions get it, and stated
as what it actually is: *can probably wait* is a claim about the evidence, not
a reassurance. The visitor not supplying a consequence is not evidence there
isn't one.

Prose alone doesn't hold, so the adversarial half went in too —
`safe_to_defer_claim` and `reassurance_not_supported_by_input` in the guard
profile, plus a line in the guard's source-of-truth framing. **It fired on its
first real run**, on `can_probably_wait[0].why`, alongside three
`unsupported_prediction` hits. The shipped text after repair reads "No deadline
or person waiting was supplied. You did not provide consequences of further
delay" — a statement about the evidence, which is the whole point.

**`need_one_fact` is answerable.** Each question gets an input; answering one
reveals a control that re-runs the ranking. The answer travels *attached to the
task it is about* — merged into that task's `context` alongside the question —
rather than as loose prose the model has to re-associate. An answer whose task
the visitor has since edited out still counts as something they told us, so it
goes to the shared context instead of being dropped.

`generate` was refactored to `runGenerate(tasks, context)` so both paths share
one call rather than duplicating it.

Verified end to end: a registration with no supplied expiry sits in
`need_one_fact`; answering "it expired two weeks ago" moves it to `do_first`,
and the answer box clears.

## Three distinctions — 2026-08-24

Each got the full escalation: a system-prompt rule (all twelve actions), a
change to the schema field that commissions the violation, and a guard term for
when prose doesn't hold.

| Distinction | Rule | Schema | Guard term |
| --- | --- | --- | --- |
| Supplied fact ≠ recommended action | 9b — a deadline, a person waiting, or the visitor's own intention establishes that fact and nothing more; the ranking is our claim, not theirs handed back as advice | `why_now`: cite the evidence, don't restate their stated intention as your reason | `supplied_intention_restated_as_recommendation` |
| Expected event ≠ confirmed event | 9c — "renews next month", "the round closes on the 30th", "they said they would reply" have not happened; never past tense, never a future date treated as reached | `why_now`: keep expected events in the future tense | `expected_event_written_as_confirmed` |
| Unknown deferral date ≠ permission to invent one | 9d — no supplied deadline, revisit point or billing cycle means no date exists to report; not "next week", not "end of month" | `revisit`: **only** a date the visitor supplied or one that follows necessarily from it — "never a date you chose" | `invented_revisit_date` |

**A fourth rule the testing produced.** Provoking 9c, the model wrote into
`why_now` that "the visitor did not specify whether renewal must be completed
by that date" — correctly refusing to resolve it — and then left
`need_one_fact` empty. The unknown was named and never asked. That was
tolerable when the section was read-only; now that answering a question redraws
the ranking, an unknown buried in a justification is a dead end the visitor
cannot act on. Rule **6a**: an unknown you name is an unknown you must ask
about. Guard term `unknown_named_but_not_asked`.

With 6a active, the same input produced two questions — including one that asks
the first distinction outright: "Is there an external consequence tied to a
specific date, or is the timing based on your own preference to handle it
tomorrow?"

**Verified against inputs built to provoke each:** an intention ("I should
really do this tomorrow morning") came back as "establishes personal timing
rather than a confirmed external deadline"; a future date stayed six days away
rather than passed; three tasks with no dates at all returned `revisit: null`
three times, with none of *next week / end of month / in a few days* anywhere
in the response.

**Note:** the first restart hit `EADDRINUSE` and the old process kept serving —
the documented trap where a test reads a stale build. Confirmed
`started PID == listening PID` before trusting any of the above.

## One bucket per task — 2026-08-24

Owner: the model was still sneaking assumptions into careful-sounding language,
and the landlord task was ranked Do next *and* listed under Need one fact —
two contradictory claims about the same task on one screen.

**My rule 6a caused it.** It said an unknown you name "must also appear in
need_one_fact". *Also* is the word that produced the double placement: the
model dutifully ranked the task and questioned it. An unknown does not
annotate a ranking — it replaces one. Rewritten: if a missing fact could
materially change where a task belongs, the task goes in need_one_fact **and
nowhere else**. A task you cannot place is not placed.

**Enforced in code, because the prose rule already existed and was already
being broken.** The generate prompt has said "every task must appear exactly
once" since the owner wrote it. `enforceSingleBucket()` runs after parsing on
generate and re-triage: anything named in `need_one_fact` is removed from the
ranked buckets, and a `just_one_thing` pointing at an unplaceable task is
nulled with the blocking question kept as its `why`. Match is
trim + lowercase, so a whitespace or capitalisation difference cannot smuggle a
duplicate through.

Proved it fires rather than assuming — a hand-built draft with the landlord in
`do_next`, in `can_probably_wait` as `'  reply to the LANDLORD  '`, in
`need_one_fact`, and as `just_one_thing`: three placements removed, the
question preserved.

Three more rules for the specific leaks:

- **6b** — no speculation about anyone else's situation. "May have their own
  timeline operating in the background" is a claim about a person the visitor
  mentioned once.
- **6c** — `why_it_matters` says how the answer moves the task in the ranking,
  full stop. What an expired registration "leads to" is outside knowledge, and
  stating it is inventing a consequence. Schema field rewritten to match.
- **headline** — states what the evidence shows; does not recommend an action,
  and never claims a benefit for one ("reduces the cost of that deferral").

Guard terms added: `task_ranked_and_questioned`,
`speculation_about_another_persons_situation`,
`outside_knowledge_about_consequences`,
`benefit_claim_for_a_recommended_action`, `countdown_instead_of_supplied_date`.

**On the date.** "Roughly two days to that deadline" is not an unsupported
inference — `lib/claude.js:52` injects the current date into every request, so
the model does have today. But the countdown is still wrong, for a different
reason: results are persisted now, so a plan reopened three days later still
says two days. Rule 17 prefers the supplied date over a countdown — "due on
the 30th", not "two days away".

**Verified on the owner's exact scenario** (landlord waiting/no deadline,
undated registration, Q3 due the 30th): every task in exactly one bucket;
landlord reads "The landlord is supplied as waiting. No deadline was supplied";
registration's why_it_matters is purely positional — "a deadline on or before
the 30th would move this into do_first"; headline states the evidence and
recommends nothing.
