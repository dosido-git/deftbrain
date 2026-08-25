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
