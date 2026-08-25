# CrowdWisdom — architecture & lock notes (`crowdwisdom-v1`)

Simulates 5 distinct "voices" (people who've lived the question) answering one question, then names the underlying tension + the question nobody asked. **Frontend:** `src/tools/CrowdWisdom.js`. **Backend:** `backend/routes/crowd-wisdom.js` (1 endpoint). **Golden:** `audit/crowd-wisdom-golden-sample.json` (2 cases). Verify: `npm run check:golden crowd-wisdom` (~25s/case).

## Shape
- **1 endpoint `/api/crowd-wisdom`.** `claude-sonnet-4-6` (`MODELS.SMART`), **`max_tokens 3500`**, `callClaudeWithRetry`, guard `!voices && !perspectives` (top-level). Output: question_reframed, voices[5]{archetype,emoji,profile,core_belief,what_they_say,the_truth_only_they_see,the_thing_they_might_miss}, the_tension, the_question_nobody_asked. In `LOCALIZED_TOOLS`.

## Audit fixes locked here (2026-07-12)
1. **⚠️→🐛 30 annotations stripped — and this exposed a trap.** The 29 `— one sentence` (+1 `— 3-4 sentences`) were per-field LENGTH constraints, not just leaks. Stripping all of them let the model write LONGER fields → German 500'd (truncation at 2500), and long fields would also cramp the compact voice cards (the SEA short-values bug). **Fix:** replaced the per-field hints with ONE global brevity instruction ("keep every field to ONE short sentence — these render in compact voice cards") + raised `max_tokens` 2500 → **3500**. Result: restored the short-values contract, fixed German, AND made it ~2× faster (26s vs 52s) since output is tighter.

## DO NOT silently reverse
1. **The global brevity instruction + `max_tokens 3500`** — without the brevity line, fields grow and German truncates + cards cramp.
2. Don't re-add per-field `— one sentence` annotations (they leak); the one global instruction does the job.

## Known / accepted
- 0 baseline audit issues. `voices` is always 5 (prompt: "five voices").
- LESSON (recorded in [[deftbrain-truncation-and-retry]]): stripping length-hint annotations can *lengthen* output → truncation; replace with a single global brevity instruction rather than just deleting them.

## Constructed viewpoints, not witnesses — 2026-08-25

Owner: the tool was implying lived testimony. Changes, and the ones that
followed from them:

| | Was | Now |
| --- | --- | --- |
| Subtitle | "Five people who've lived it. Five different answers." | "Put one choice in front of five very different points of view." |
| Card label | "What only they can see" | "What this perspective notices" |
| Copy label | "What they uniquely see:" | "What this perspective notices:" |
| Pre-result cross-ref | "Want to stress-test the belief driving this first?" → Belief Stress Test | removed |

Kept as asked: "What they say", "Blind spot", the AI/simulation disclaimer,
Recent Questions, Try an Example, Start Over, the collapsible cards, the
tension, the closing question, copy behaviour, and the post-result related
tools (Decision Coach · Belief Stress Test).

**Two places the same claim was still being made.**

`cw_tagline` — the line PF-30 actually renders — read "Five **real**
perspectives on the choice you can't stop thinking about". The owner had
already rewritten the catalog tagline to "Five different ways to look at…",
so the page and the catalog disagreed and the page was the one still saying
"real". Aligned across 13 languages.

The **prompt** asserted it at source: "Generate five distinct perspectives from
people who have lived this question — each with their own worldview,
vocabulary, and hard-won truth", with the schema field described as "the
uncomfortable specific truth this archetype is uniquely positioned to
deliver". Relabelling the output while the prompt still commissioned testimony
would have left the model writing testimony under a new heading. Both reframed
to what a perspective *notices*.

Live check afterwards: no first-person testimony phrases in the response, and
the observations are about the question rather than about a past —
"The word 'stable' in the question is doing enormous work".

**Audit.** S5.5 requires a pre-result cross-ref, so removing one fails the
gate. Added CrowdWisdom to `_pre_exempt`, the narrow list for tools that keep
their post-result refs — the same call already made for Cold Open Craft,
Comeback Cooker, Conflict Coach and Caption Magic. **Not** `NO_CROSSREF`,
which exempts both ends and would have silently stopped enforcing the
post-result links the owner kept.

Proved the exemption is what silenced the rule, not a crash: the identical
file under a non-exempt name still fires S5.5. Golden 2/2.

## Adopted V2 — 2026-08-25 (`crowd-wisdom-v2`)

Owner: the 47 frozen tools are the only ones on v1; everything else is reviewed
under V2. Crowd Wisdom was never on the frozen list, so this edit triggered
Gate 9 and the review happened.

**Reviewed against the standard.** §1 the visitor has a choice they cannot
settle; §2 the closing question is the handle they leave with; §3 five
disagreeing views *are* uncertainty made usable; §4 the tool must not decide —
that is the whole design. Nothing in the standard fights this tool. What
needed stating was where invention stops.

**The guard deliberately does not police invention.** The five perspectives,
their worldviews, priorities and what they notice are all fabricated, and that
is the product. Three boundaries only:

```
prohibit: testimony_presented_as_lived_experience, invented_fact_about_the_visitor,
          verdict_delivered_for_the_visitor, five_voices_collapsed_into_one_answer,
          professional_advice_without_standing
require:  five_genuinely_different_lenses, grounded_in_the_question_actually_asked,
          fulfills_tool_promise
```

The `supplied` block spells this out at length, because the validator never
sees the prompt and would otherwise flag every voice as an invented fact.
(Caption Magic, 2026-08: an epistemic guard applied literally to a creative
tool eats the tool.)

**Three things the first live runs exposed.**

1. **The guard flagged the cast.** `voices[2].archetype` = "The One Who Did It
   and Regretted It" came back as `testimony_presented_as_lived_experience` on
   every run. Right about the words, wrong about the target — that name is ours,
   identical every time, not a claim the model made. Telling the validator to
   ignore it in prose did not hold. The field is no longer sent:
   `archetype` and `emoji` are tool-fixed, and a guard should judge what the
   model wrote.

2. **The cast drifted.** Naming the five only inside the schema example let the
   model read them as placeholders — "The One Who Sees the Bet", "The One Who
   Stayed". Worse, my own no-biography rule fought two of the names. Fixed both
   ways: the cast is now pinned as an instruction ("these five, this order,
   these emoji, whatever the question is"), and the rule separates the label
   from the writing — the name is a stance, argue *from* it without narrating
   events. Canonical cast on 3/3 questions afterwards.

3. **`profile` commissioned the violation.** It asked for "what life experience
   gives them this view" — a field that requests a biography will get one, and
   that is what the guard kept catching. Now: the vantage in one sentence, no
   jobs held, places lived, or things that happened to it.

Also `the_question_nobody_asked` drew `mind_reading` — it asked for what the
crowd "would tell them to ask themselves". Now an adjacent question following
from the one they asked, raised without asserting what the visitor is really
thinking or avoiding.

**Verified the guard is not inert.** Three consecutive PASSes could equally
mean nothing was inspected — `runOutputGuard` returns early on an empty field
list, which logs identically to a clean pass. Walked a sample response: 8
fields per voice-block, 28 for a full response, with only `archetype` and
`emoji` excluded.

Live: cast canonical 3/3, guard PASS 3/3, no first-person testimony phrases,
golden 2/2.
