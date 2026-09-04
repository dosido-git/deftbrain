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

## The salary pass, same day

Salary Talk had stopped inventing numbers but was still upgrading facts into
bargaining positions — one move, twelve times.

| It wrote | It now writes |
| --- | --- |
| "recruited, not applying — which shifts the starting posture" | "the company initiated the recruiting conversation" |
| "signals institutional knowledge and reduced ramp time" | "six years of B2B SaaS marketing, including four at your current company" |
| "fully remote, eliminating a commute cost your hybrid arrangement carries" | "the new role is fully remote; your current role is hybrid three days a week" |
| "making your $115K base a floor, not a midpoint" | "you believe it is below market — worth verifying before using it to anchor your ask" |
| "a headcount trigger, a revenue milestone" | "what would need to happen, who decides, whether any review point is defined" |
| "means nothing without these specifics" | "difficult to evaluate without the actual terms" |
| "I take the equity upside seriously" | "I want to understand the terms so I can evaluate them alongside base and bonus" |
| "a base that reflects market rate for this level" | "a base I can support with current compensation data and the scope of this role" |
| "Based on my research on current market rates…" | "once you have verified a defensible figure, you could say…" |
| Levels.fyi, Radford | "current compensation data… more than one credible source" |

Section names changed with it: `what_you_can_make_the_case_from` →
`what_you_have_to_work_with`, because the old name invited every supplied fact
to become leverage; `other_terms_to_consider` →
`other_terms_you_may_want_to_raise`, so a term the visitor never mentioned reads
as an option rather than as something that matters in this negotiation.

Six backstops: `MANUFACTURED_LEVERAGE`, `SALARY_AS_FLOOR`, `EQUITY_OVERCLAIM`,
`MARKET_RATE_AS_TRUTH`, `NAMED_COMP_SOURCE`, `ASSUMED_RESEARCH`. The last is
spared when the sentence is conditional — "once you have verified a figure, you
could say based on the data you have reviewed…" is the wanted form, and the
unconditional version of the same sentence is the failure.

**"Family dynamics" became "Money with family"** in the picker. The old subtitle
promised psychological interpretation, which is exactly what the rewrite took
out of that route.

## The lending micro-pass, same day

Seven more, and every one is the same species as the rest: an absence treated
as information.

| It wrote | It now writes |
| --- | --- |
| "no shared understanding of whether it is still owed" | "the original repayment date passed without repayment, and the loan has not been discussed since" |
| unknown: "whether your friend considers the $600 still outstanding" | dropped — their inner life is not needed to decide |
| "has it been forgotten, or does your friend believe it was settled?" | "what happened with the original repayment agreement, and what can your friend realistically do about it now?" |
| "a low-key conversation is easier to start than it feels" | "start with a low-key, factual question rather than an accusation" |
| "do not lend more than you could afford to write off" | "decide what amount you could afford to have unavailable if repayment is delayed" |
| terms: "what happens if the date is missed" | "if repayment timing matters, agree what you will do if circumstances change" |
| "I understand you are in a tight spot" | "I understand you are asking for help" |

Two are worth understanding rather than just obeying.

**Silence is not doubt.** The visitor had already established the agreement —
$600, repayable within three months. That the parties have not discussed it
since says nothing about whether the debt exists. Manufacturing ambiguity there
looks like epistemic caution and is the opposite: it discards a fact the visitor
supplied.

**"Afford to write it off" quietly reclassifies the loan.** It sounds like
prudent advice and it concedes the whole question — it tells the lender to
expect not to be repaid. The constraint worth stating is what they could afford
to have *unavailable* if repayment is delayed, which is the same financial
discipline without giving up on the money.

`what_is_not_known` now holds exactly three kinds of thing: why it has not been
repaid or discussed, what is being asked for now, and the LENDER's own financial
position. The first draft of that rule barred the other person's *beliefs* and
the model immediately substituted their *intentions* — "whether your friend
intends to address the earlier loan". Bar the inner life, not one verb.

Four backstops: `DEBT_IN_DOUBT`, `PREDICTED_FEELING`, `WRITE_IT_OFF`,
`ASSUMED_HARDSHIP`. The other three turn on what a sentence is FOR rather than
which words it uses, and live in the field descriptions only.

## A pinner that did not know where it was

Found while adding examples for Family Money, 2026-09-04. `pinEnums` keyed on
field NAME and ran on every response. `recommendation` is a pinned four-value
enum in Lending and free prose in Family and Donations, so both of those had
their answer replaced with "Not enough to tell" on every call — Family's "offer
the smaller amount as genuine help" became a Lending verdict.

It was recorded that way, so `check:golden` passed on the corrupted output for a
full cycle. A structural check cannot see that a field holds the wrong KIND of
value, only that it holds one.

`pinEnums(data, fields)` now takes the fields to pin and three routes pass their
own; the other sixteen call sites do not pin at all. The general lesson is
worth more than the fix: a normaliser that does not know which route it is in
will eventually meet a field name two routes share, and it will lose.

## Unknown is not a reason to say nothing

The systemic finding, now in the global brief. Every route had learned to name
what it did not know, and one of them had learned it too well: given a loan
fifteen months past its agreed repayment date, Family Money identified the
practical issue correctly and then answered "not enough to tell".

The rule: when motives, reactions or outside facts are unknown, still make the
strongest practical recommendation the KNOWN facts support. Reserve "not enough
to tell" for when the missing fact would materially change what to do next. The
same probe now answers: "bring it up directly — the agreed repayment date passed
a year ago, and silence on both sides does not cancel the agreement. You do not
know why it has gone unmentioned, so start by raising it."

Epistemic care that produces no advice is not care, it is abdication, and it is
the failure mode a tool like this drifts toward once every other correction has
been about restraint.

## Family and Culture micro-pass

Family lost: uncertainty about a loan the visitor said was agreed; "would an
acknowledgement be enough?" when the arrangement was repayment; a dispute script
for a dispute nobody reported; "I understand if things are tight"; a prediction
that naming a number confidently "makes it land as an offer rather than a
rejection"; a "right now" the visitor never said; and "no rush on paying it
back", which waives repayment urgency on their behalf.

Culture Bridge lost four, of which one matters most: **do not invent a meaning
in order to disclaim it.** Writing "her family may experience an offer to pay as
a signal they have not been generous enough" and then admitting that is
unestablished is worse than not writing it — the interpretation is now in the
visitor's head. It states the difference plainly instead: "you expect to
contribute, while her family has consistently paid and appeared uncomfortable
when you offered; the reason for that difference is not established."

Also: observed behaviour is established, the preference behind it is not ("her
family has paid", never "her family's preference to pay"); no gesture is
predicted to "land better"; and a partner "may have useful context", rather than
being "the clearest source of what her family actually prefers".

**A regex bug worth remembering.** `INFERRED_PREFERENCE` used `\p{L}` while
carrying only the `i` flag. Without `u`, `\p{...}` is not a unicode property
escape at all — it matches a literal `p` — so the pattern looked correct and
matched nothing. It passed its own bad-form test only because a second
alternative in the same regex happened to catch that string. A sweep of every
`new RegExp([...])` in backend/routes found no others.

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
