# DecisionCoach — architecture & lock notes (`decisioncoach-v1`)

Makes ONE decisive answer (not options) across 10 modes: decide, pros-cons, quick, patterns, group, followup, dna, devils-advocate, batch, chain. **Frontend:** `src/tools/DecisionCoach.js`. **Backend:** `backend/routes/decision-coach.js` (10 endpoints). **Golden:** `audit/decision-coach-golden-sample.json` (5 cases). Verify: `npm run check:golden decision-coach`.

## Shape
- **10 endpoints**, all `claude-sonnet-4-6` (`MODELS.SMART`) via `callClaudeWithRetry` (max_tokens 4000, except followup 800). `lang = withLanguage('', userLanguage) + withLocaleContext(...)` appended to each prompt (no `system` field). **No per-endpoint success guards** by design (frontend null-safe; callClaudeWithRetry guarantees valid JSON). In `LOCALIZED_TOOLS`.

## Audit fixes locked here (2026-07-12)
1. **🛡️ Robustness — all 10 endpoints used raw `anthropic.messages.create` inside a local retry-loop (API-errors only) + an unguarded `JSON.parse` OUTSIDE the loop** (no parse-retry, no truncation fail-fast). **Fix: switched all 10 to `callClaudeWithRetry`** (parse-retry + `stop_reason==='max_tokens'` fail-fast + API-error retry). Removed the dead `anthropic`/`cleanJsonResponse` imports.
   - **Inlined** as `res.json(await callClaudeWithRetry(...))` rather than `const parsed = …; res.json(parsed)` — the bare-variable form trips backend audit **S7.4f** (unvalidated var); the inline call matches the original's audit-clean posture (the tool has no shape-guards by design).
2. **⚠️→cleaned: 37 annotations stripped** (`— one sentence` ×35, `— 3-6 words` ×2). No truncation resulted — the 4000 budget absorbed the (slightly longer) fields, unlike CrowdWisdom/DateNight at 2000-2500. Verified 8/10 modes 200 in German.
3. **⚠️ PF-2 alias** — added `labelText` to the `c` block + `c.label = c.labelText;` (the tool followed the alias-block pattern via `c.textMuteded` but was missing the label alias).

## DO NOT silently reverse
1. **`callClaudeWithRetry` (inlined into `res.json`)** — don't revert to raw `create`; and keep it inline (bare `res.json(parsed)` re-trips S7.4f).
2. **Stripped annotations** — check-golden checks STRUCTURE not content.

## Known / accepted
- 0 baseline audit issues after fixes. No guards by design (frontend null-safe).
- Golden covers 5 modes (decide en/de, pros-cons, chain, devils-advocate). dna + patterns need sessionHistory (analysis modes) — not in golden; verified structurally same class.
- No truncation at 4000 across all tested modes (the annotation strip did NOT trigger truncation here — enough headroom).

## Simplified the path in, not the capabilities — 2026-08-25

Owner: the form exposed the tool's internal feature architecture to the
visitor. Someone already too stuck to choose had to make several interface
choices — Decide/Group/Insights/History, then Quick Decide, then
Decide/Compare/Gut check/Chain, then Category — before saying what they were
stuck on. Nothing was removed from what the tool can do; the order changed.

**Before → after**

| | |
| --- | --- |
| 4-tab strip at the top | gone. Deciding is the default view and does not need a tab announcing it |
| Group, History | quiet pill controls beside Try an example; History appears only once there is history |
| Insights tab | folded into History. With Decision DNA and the profiling gone it no longer carries a top-level tab |
| Mode picker **before** the question | small optional pill row **after** it, "How should I tackle it? (optional)", defaulting to Just decide |
| Category selector | removed. The sentence already contains it; `category` survives as state for templates, history and the payload, and `DECISION_CATEGORIES` is still used for the label lookup so nothing orphaned |
| Saved preferences, a full block below the submit button | inside More options, above the button |
| Which Life? link above the question, BuyWise below the form | both at the foot of the **result**, where there is finally something to hand off from |

Kept exactly as they were: Quick Decide and its five one-tap choices, Try an
example in the header, Start over, and the Decide For Me button.

**Three things the change surfaced.**

1. Removing the tab strip left `c.tabActive`, `c.tabInactive` and
   `c.tabBorderColor` dead in the palette — caught by S1.1k, removed by key
   line only (the documented hazard is cutting a multi-line palette entry at
   its key and leaving `: '…'` dangling).
2. The preamble still said **"YOU GIVE: The category and what needs
   deciding"** — an input the visitor is no longer asked for. Now "A sentence
   saying what you are stuck on. Constraints and preferences are optional."
3. `src/data/tools.js` carried three stray paste-instruction comments from an
   earlier entry replacement — "Replace the existing entry (search for id:
   …)", "Changes: modified date added, tags expanded from 7 → 9". Valid JS
   comments, so nothing broke, but they describe an edit rather than the
   catalog. Removed.

Verified end to end: question typed → submit enabled → answer returned with
the important-decision disclaimer intact → both cross-refs appear only at that
point. Golden 5/5.

## Grounding leaks — 2026-08-25 (`decision-coach-v2`)

**Owner asked whether three things were supplied. Traced the payload: no.**

The route receives `decisionNeeded`, `category`, `preferences` (the constraint
pills plus the free-text box), `capacityLevel`, `rejectedChoices`, and
`recentDecisions` — which is `sessionHistory.slice(0,5).map(h => h.choice)`.
Bare choice strings. No dates, no times of day, no frequency.

| Claim | Verdict |
| --- | --- |
| "You have every ingredient already" | **Fabricated.** There is no pantry, fridge or cupboard field anywhere in the payload. |
| "your last three nights" | **Inflated.** It had a list of previous *choices* with no dates attached, and turned it into a record of nights. "Three" was invented precision on top. |
| The ruled-out alternatives | **Model's own.** `alternatives_eliminated` is generated, not supplied. Presenting them as ruled out implies the visitor had them in hand. Only `rejectedChoices` is real. |

**The narrow rule**, owner's wording, as a shared `GROUNDING_RULE` constant
applied to the seven endpoints that make or execute a choice — one text rather
than a rule drifting between ten prompts:

> When explaining or executing a decision, never convert an assumed resource,
> possession, ingredient, past behaviour, preference, constraint or future
> reaction into a supplied fact. Optional additions must be explicitly
> conditional.

**`no_second_guessing` was asking for the leak.** It requested a "firm,
encouraging message", and encouragement is what produced "Future you will be
pleased". Now: emphatic, closing on the supplied constraints, pointing at the
first action, never a claim about how they will feel. Live: *"Decision is
closed. Garlic butter pasta tonight. It takes under 20 minutes and needs no
plan. Go put the water on."*

**One over-correction, caught and fixed.** The first pass produced "Add shrimp
(if you have it, fresh or thawed)" — the tool hedging the dish it had just
chosen, which hands the decision back and is the failure mode the owner named
from Crowd Wisdom. The rule is about *additions*: the chosen thing is the
decision, not an assumption to qualify. Both the prompt and the guard framing
now say so. Second pass commits to the pasta and conditionalises only the
butter, oil and parmesan.

Adopted **v2** (not among the 47 frozen). The guard leaves decisiveness alone —
choosing firmly, and choosing something the visitor never named, is the product
— and covers five things: assumed possession, unsupplied resource stated
unconditionally, past behaviour invented from the choice list, an alternative
attributed to the visitor, and a predicted future reaction. It fires: 6 fields
on the reproduction run, including `past_behaviour_invented_from_history` twice
inside `alternatives_eliminated`.

Golden 5/5.

## All-purpose decision helper, not a meal picker — 2026-08-25

Quick Decide opened the page, so the first thing a visitor met was Eat · Do ·
Tonight · Buy. The description promises an all-purpose decision helper; the
form promised dinner.

**The page now opens on the promise:**

```
WHAT NEEDS DECIDING?   Tell me what you're trying to decide. A sentence or two is enough.
                       e.g. 'Should I renew my lease or look for another apartment?'
WHAT MATTERS MOST?     (optional) — priorities, concerns, constraints, anything I should know
HOW SHOULD I HELP?     Decide for me · Compare my options · Gut check · Work through a chain
MORE OPTIONS ▾         constraints · capacity · saved preferences
🎯 DECIDE FOR ME
...then, at the foot:
DON'T EVEN WANT TO THINK ABOUT IT?  ⚡ Quick Decide — Eat · Do · Tonight · Buy · Surprise me
```

`extraContext` was promoted out of More Options, where it had been asking for
the most decision-relevant input in the quietest way available — a box labelled
"Anything else?" behind a toggle. Mode labels became jobs rather than nouns.

**Ask only what could change the answer.** The route now returns
`one_thing_that_could_change_this` beside the decision — never instead of it.
The call is always made; one question is offered when an answer would genuinely
move it, with a box to answer and re-decide (the answer is folded into the
supplied context, not sent as a fresh question). "Should I renew my lease?"
draws a question about the notice deadline; the prompt says most decisions need
none.

**No second-guessing reframed.** It now means taking responsibility for the
call, not claiming the call is objectively correct. Live: *"You are done
deciding. Start the apartment search. The two constraints you gave — a big rent
hike and a commute that is already too long — both point the same direction.
That is a clean signal, and I am taking the call."*

### Two defects the testing found, one of them in the shared library

**The repair could contradict the rest of the response.** A run chose "Go to
the party tonight" and closed with "Stay in. Turn off the group chat." Both in
one response. Cause: `outputGuard`'s repair prompt showed the flagged field and
the visitor's input and *nothing else in the response* — so a field whose
meaning depends on a sibling gets rewritten into a different decision. The
repair now receives the fields that passed, with an instruction not to
contradict a conclusion stated in them. **This affected every v2 route**, not
just this one; anything with a headline plus a dependent closing line was
exposed.

**A promised deliverable came back empty.** The guard called
`no_second_guessing` an `unnecessary_section` and the repair removed it.
`requiredNonEmpty` exists in `outputGuard` and this route was not passing it;
`decision_made_for_you.choice` and `no_second_guessing` are now protected.

### Not done

**Context-sensitive constraints.** The owner noted the presets (No cooking,
Don't leave house, Low stimulation) suit everyday decisions better than a job
change, and "should probably be context-sensitive". Doing that on keyword
matching would be fragile and wrong often enough to be worse than the current
universal list. Left as-is deliberately.

**Quick Decide's backend** still makes self-contained suggestions from a
category alone. That matches the owner's constraint, but it has not been
re-reviewed under v2.

Golden 5/5. Note: after fixing a locale string post-`build:locales`, the page
rendered raw key names until the bundle was rebuilt — the documented gotcha,
hit again.

## Four rotating examples — 2026-08-25

Three added, and the rotation fixed on the way.

**It was inert.** `EXAMPLES` held two entries that varied `category`,
`constraints` and `capacity` — but `loadExample` always set the same two locale
keys, so every click produced "What should I make for dinner tonight?" whatever
the counter said. The second example had been written and translated into
thirteen languages and was never visible. Each example now carries its own
`qk`/`ck` text keys.

| | Question | Kind |
| --- | --- | --- |
| 1 | What should I make for dinner tonight? | everyday (kept) |
| 2 | Should I take on the extra project my manager offered? | work commitment |
| 3 | Should I repair my laptop or replace it? | money / repair-or-replace |
| 4 | Should I go to my friend's birthday dinner or stay home? | social, low capacity |

Chosen to show the range now that the tool leads with the general case rather
than with dinner, and each fills "What matters most?" too — the field the
decision actually turns on. None duplicates the lease example in the
placeholder, so a visitor who reads both sees five different kinds of decision.

Verified the counter cycles (ex1 → ex2 → ex3 → ex4 → ex1, first four distinct)
and then confirmed the same in the browser: four clicks gave four different
questions and the fifth wrapped to dinner.

## "What I based this on" — 2026-08-25

A summary of the visitor's own input, under the decision.

**Rendered from form state, not asked of the model.** Every other field in this
output is generated and therefore guarded; this one can be guaranteed faithful
because the frontend already holds the exact inputs. A model-written summary of
what the visitor typed would be free to paraphrase, compress or drift — the
failure class this tool has been chasing all week — and there is no reason to
take that risk for text we already have verbatim.

Shows only what is actually present: the question, what matters most, the
constraint pills (translated labels), capacity, and anything already ruled out.
Placed directly under the decision card, before the steps — and appended to
the copy-out so the basis travels with the decision.

**First placement was wrong.** I put it after the no-second-guessing card,
reasoning that the answer should lead. That reasoning was right and the
placement was not: it landed second-to-last, past the steps and the ruled-out
list, at character 2,875 of 3,267. The owner asked "where is the summary?",
which is the only review that matters — it was rendering perfectly and could
not be found. The decision still leads either way, because it is the first
thing on the page; "based on what?" is a question the reader has while the
answer is still in front of them, so that is where it belongs.

### A label collision worth knowing about

The mode pill reads **"Decide for me"** and the primary button reads **"🎯
Decide For Me"** — the same words, on the same screen, doing different things.
Both are the owner's wording from the spec, so they are left as they are, but
the collision is real: clicking the pill calls `setResults(null)` and silently
clears the answer, which reads as the button having done nothing. It cost
several attempts here before I noticed my own selector was hitting the pill and
not the button. Worth differentiating if it confuses a visitor the same way.

Also dropped an `order-last` I had briefly used to position the block: the
parent is `space-y-4`, not a flex container, so the class does nothing — the
same inert-utility mistake as the submit button's `flex-1`.

## The decision boundary — 2026-08-25

Owner: the tool said "Repair the laptop", asked whether the battery was
included, and then told the visitor to approve the repair — three steps after
naming the fact that could reverse the call. Formalised in the schema rather
than argued for in prose, as asked.

**Rule 4a, the decision boundary.** When `one_thing_that_could_change_this` is
not null, three things follow:

1. `choice` carries the condition it rests on.
2. `execution_instructions` **stop at the point of finding out**. They may
   gather the fact, and the last step is to come back with the answer. Nothing
   committing or hard to undo — no approving, paying, signing, dropping off,
   cancelling — while the answer that could reverse the call is unknown.
3. `if_answer_confirms` and `if_answer_changes_it` say what happens either way.
   They must name **different** outcomes; if both land on the same answer, the
   question could not have changed anything and the field should be null.

Steps now read: ask whether the battery is included → get the quote in writing
→ *"Come back to this decision once you have that number — the next step
depends on what they say."* And a question that genuinely needs nothing ("Should
I go to the party tonight?") returns null and runs its steps to done.

**Point 1 would not hold in prose.** Stated in the approach block and then
again on the `choice` field itself, the model still returned a bare "Repair the
laptop." Whether a call is provisional is knowable from the response *shape*,
so the UI now states it rather than hoping the string does: the header reads
**"Your decision — for now"** with *"Provisional until you answer the question
below"* beneath it. Deterministic, and it cannot drift.

**The overreaching sentence, generically.** "A four-year-old machine with a
working repair quote is not at end of life" — a quote establishes that
something can be repaired and roughly for how much, not the condition or
remaining life of the thing. Rule: never infer overall condition, lifespan,
reliability or future performance from the existence or cost of a quote, and
the same for any valuation. Guard terms `condition_inferred_from_a_quote` and
`committing_step_before_the_open_question`.

**Scorecard removed.** 🔥 streak, ⚡ 100% first-try and 🏆 1/8 sat under the
tagline saying nothing about the decision in front of the visitor, competing
with the two controls that do. Removing it orphaned `followThroughStreak`,
`firstTryRate` and the `streakFire` palette key — all removed in the same pass,
which is the documented second-wave-of-warnings trap.
`earnedAchievements` stays: the Insights panel inside History still lists them.

**"What I based this on" is standard**, as asked — it renders whenever there is
a decision, since the question is required and always populates a row.
