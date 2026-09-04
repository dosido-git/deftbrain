# Money Diplomat — tool notes

Grounding rewrite, 2026-09-04. The tool was good at sounding like a friend with
opinions about your friendships, and that was the problem.

## North star

Money Diplomat is strongest when it answers **"what is fair or prudent here,
given what I actually know, and what can I say?"** It is weakest answering
"what is this person secretly thinking?", "what will happen?", "what does this
say about my relationship?", "what does my culture require?" or "what number is
objectively correct?".

**Reason about the money. Help with the conversation. Do not invent the people.**

## What it was doing

The lending probe is the clearest case. From "$600 lent eight months ago, unpaid,
never discussed, they just booked a holiday" it produced a repayment likelihood,
a resentment risk, a prediction that the friendship would suffer, and a reading
of the holiday as evidence about their finances. Exactly one of those inputs was
load-bearing — the loan is overdue and undiscussed — and the output buried it.

Elsewhere: a confidence percentage on a Venmo request, "the real issue isn't the
money" under every family question, "what splitting signals" on a date, a
culture-clash risk score, an invented market salary, and a money-personality
archetype with a health score and blind spots.

## What changed

`MONEY_DIPLOMAT_V2` prepends every route: the ESTABLISHED / REASONABLE
IMPLICATION / UNKNOWN split, no predictions, no motive-from-spending, no
"real issue underneath", no universal norms, no invented rates or tax law.
`FAIRNESS_RULE` adds to the four allocation routes: arithmetic only from
supplied figures, and where several allocations are defensible, show them with
the assumption behind each.

| Route | Then | Now |
| --- | --- | --- |
| Lending | verdict + repayment likelihood + resentment | `recommendation` pinned English, `what_is_known` / `what_is_not_known`, `existing_debt.next_step` |
| Venmo | `confidence`, `resentment_risk` | `verdict` pinned, `unknowns` |
| Gift | one correct amount | `range`, budget as the strongest constraint |
| Tip | "knows every context" | arithmetic separated from the unverified norm, which moves to `check_first` |
| Family | `the_real_issue`, `emotional_stakes`, `if_guilt_trip` | `practical_issue`, `what_needs_clarifying` |
| Date | `what_splitting_signals` | `how_each_option_may_feel_or_function`, conditional |
| Salary | market salary, likely outcome, counteroffer | `ask.amount` empty unless supplied; verify comp data instead |
| Afford | "you can afford it" | `gut_check` pinned; `what_is_missing` is rarely empty |
| Inheritance | grief dynamics | principles in tension + `needs_professional_confirmation` |
| Travel / Culture | "the unspoken rules in every culture" | only expectations each person described |
| Donations | deductibility | jurisdiction-and-status caveat only |
| Practice | role-play as prediction | one plausible response, coaching on the WORDS |
| **Profile / Recap** | archetype, health score, blind spots, next-problem prediction | **deleted** |

## The things that will bite the next person

**Ten guards keyed fields the new schemas do not emit.** Every route I rewrote
kept its old `if (!parsed.verdict)` and 500'd on the first call. This is the
codebase's most reliable bug and it fired ten times in one pass — after any
schema change, run the guard-vs-schema sweep before probing.

**Three enums are pinned in code** (`recommendation`, `verdict`, `gut_check`).
`withLanguage` translates JSON string values, so a frontend switching on a
translated one is wrong in twelve languages. `pinEnums` runs before
`validateResult`.

**`SPENDING_AS_MOTIVE` was too loose on the first draft.** It matched any
spending noun within fifty characters of an inference verb, and blanked "a quick
conversation before the dinner tells you what they actually expect" — a sentence
containing no claim about anyone. The inference now has to land on money,
ability or priorities. Widen carefully; test both directions.

**The i18n purge over-reached.** Scenario labels are referenced as string
literals inside `SITUATIONS` (`labelKey: 'md_sit_tip_label'`), not as `t()`
calls, so a key scan that only reads `t('…')` misses 112 live keys and the
picker renders raw key names. Collect every `'md_…'` literal in the file, not
just the calls.

**Twelve result blocks share one renderer.** `GroundedResult` plus a `SECTIONS`
map, declared ABOVE the main component — the S5.5 cross-ref check anchors on the
last `return (` in the file, and a helper below the component moves that anchor
past the `{renderResults()}` call, collapsing the post-result region to nothing.

**Results live in `renderResults()`, not inline**, for the same check: rendering
inline gives it nothing to split on and the post-result half can never pass.

**Storage key is `money-diplomat-results-v2`** — twelve result shapes changed.

## Endpoints

20 routes on `MODELS.SMART`, v2 output standard with `validateResult` declared.
`/money-diplomat-profile` and `/money-diplomat-recap` are gone.

## Goldens

Eleven cases, re-recorded 2026-09-04; the v1 golden was discarded rather than
ported. The thin-result metric reads expected shape from these files, so a stale
golden makes every live call look half-empty in the dashboard.
