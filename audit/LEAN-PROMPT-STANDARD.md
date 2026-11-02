# Lean prompt standard

**Started 2026-11-01** after a blind test: a 450-word prompt in a plain chat app wrote a better
Roommate Court answer than the tool's ~7,000 words per call (its own 3,300 + the two global
contracts). Every tool is rebuilt to this standard. Judged on accuracy and speed together
(CLAUDE.md, "First priorities").

## What a rebuilt tool sends

| Layer | Size | Where |
|---|---|---|
| House rules (truth, usefulness, voice) | ~330 words, shared | `backend/lib/houseRules.js`, added by `lib/claude.js` when the route declares `router.outputStandard = 'lean'` |
| Tool system prompt | **≤ 350 words** | the route file |
| Task prompt | the visitor's input + the JSON shape | the route file |

The lean standard replaces `lib/epistemics.js` and `lib/outputStandard.js` for that tool. Tools not
yet rebuilt keep both until their turn.

## Writing the tool system prompt

1. **One paragraph: who it's for and what a finished answer gives them.** Take it from the tool's
   primer in `src/data/tools.js` (when / you give / you get / the edge).
2. **What a good answer contains, section by section,** in reading order. Say what each part is
   *for*, not a list of things it must never do.
3. **Only rules unique to this tool,** e.g. the meaning of its labels, or "housing law varies, never
   state it". Anything already in the house rules is not repeated.
4. **No wrong/right example pairs.** The model copies them (memory: voice-prompt traps). Describe
   the shape instead.
5. **No defect history in the prompt.** Defects are fixed by type in shared code
   (`audit/DEFECT-TYPES.md`); the prompt says what good looks like.

## The JSON shape

- Keep the keys the page already renders (three-way sync). Change a key only when the page
  changes with it.
- Field descriptions are a few words. Enum fields that the page switches on stay pinned to exact
  English.
- Caps on lists (`at most 4`) stay; they protect speed and German/Arabic length.
- A field the page frames ("If they respond along the lines of: …") is described as the bare
  content, so the frame is not written twice.

## Speed shape

- **Plan first** (`planFirst` in `lib/progressive.js`): a small pass writes the headline the
  visitor reads first (the read, the verdict, the recommendation): on screen in under 5s.
- **Follow-up passes are handed the plan** (`planNote`) and each writes ≤ 1,200 tokens.
- **Sections that cover the same ground go in the same pass** (options and "if that doesn't
  work"), so they cannot repeat each other. Split only along lines that don't overlap.
- Checks run after the answer shows (existing `check:`). Keep the tool's guard; drop nothing
  that catches a real defect.

## Lessons from the first tools (2026-11-01)

| Tool | Result | Why |
|---|---|---|
| Roommate Court | **lean kept**: better answer (recommendation, confidence, costs), 13s vs 18.5s | sections must agree, so plan-first fixed drift; the rules were mostly generic |
| Skill Gap Map | **lean kept**: first part 4.8s vs 15.5s, whole answer 16s vs 95s, grounded | one ~1,000-word block was repeated three times |
| Future Proof | **lean kept**: same flags (13/13), first part 6.6s vs 14.1s, whole 24.5s vs 51.5s | ~650 lines of owner rules condensed to 10 bullets |
| Read the Room | **lean kept** after adding a length rule: flags 4 vs 5, 6.3s vs 8.2s | first try ran 82% longer: the old "3 items per list" rule had been dropped |
| Pet Behavior Decoder | **lean kept**: flags 5 vs 14 and 4 vs 4 (medication case, same vet-contact level), 15.5s vs 21.6s | 45-section rulebook condensed to 9 bullets |
| Research Decoder | **lean kept**: flags 6 vs 6, 12.8s vs 20.5s; longer, but the saved answer is from Sonnet 4.6 | modes kept as one line each |
| Break My Plan | **lean kept** after naming "even with could": flags 9 vs 10, first part 5.5s vs 20.1s | first try predicted the passed-over manager "could be less engaged" |
| Quote Check | **switch only** (own prompt kept, house rules instead of the global blocks): flags 0 vs 3, 9.3s | dense one-paragraph rules, each a real distinction |
| Party Architect | **old kept**: lean invented an end time, food "creating a shared moment", cleanup as a hint to leave (guard flags 32-35 vs 19) | its rules encode real, tool-specific distinctions; its six parallel passes were already fast (9s) |

So:
- **Never assume shorter is better. Run the old and new prompt on the same case and keep the better answer** (fewer guard flags, nothing invented, complete), then compare speed.
- **Name the tool's own traps** as short bullets; the route's `router.outputGuard` terms are the list.
- **Keep length rules.** Dropping "3 items per list" nearly doubled an answer; the house rules now carry a general length rule, and a tool keeps its own counts.
- **Flag counts vary ±2 run to run.** The bar is "not clearly worse", read alongside the answer itself.
- **Switch-only is a valid result.** Where the tool's own prompt is dense with real distinctions, keep it and just declare `lean`; most of the per-call waste was the two global blocks.
- **Plan-first only when sections must agree** (advice, scripts, a verdict the rest builds on). Independent sections run as parallel disjoint passes: faster.

## Switch-only batch (2026-11-01)

60 tools on the v2 standard were switched to the house rules with their own prompts unchanged, one
saved case each, the same report-only check on old and new. Where a result looked worse, the old
prompt was rerun on today's model (a second backend serving the previous commit) so model drift
did not count against the prompt.

- **Reverted (old prompt kept):** Before the Crash (2 vs 7 flags), Dream Pattern Spotter (0 vs 7),
  Document Detective (3 vs 6), Conflict Coach (68% longer, no gain), Heckler Prep (14 vs 22),
  Meeting Hijack Stopper (3 vs 6), Plot Hole Finder (3 vs 19), Grief Guide (5 vs 7, a sensitive
  tool), Party Architect (5 vs 12), Which Life (13 vs 18). These are the tools whose global contracts were doing real work.
- **Kept:** the rest, at equal or fewer flags. Most of the extra length seen against saved answers
  was the newer model: today's-model reruns of the old prompts were as long.
- **Cost:** the switch roughly halves the cost of a run (Before the Crash $0.42 → $0.18, Plot Hole
  Finder $0.96 → $0.58), because ~4,000 words of instructions no longer go with every call.

## Older (frozen) tools, first pass (2026-11-01)

Switched with their own prompts kept, leaving `FROZEN_V1`: Alternate Path (18→5 flags), Analogy
Engine, Argue Smarter, Batch Flow, Belief Stress Test, Bill Rescue, Bookmark, Brain Dump Buddy — each
equal or fewer flags. Their existing consistency/number check satisfies the audit.

Not switched yet:
- **Bike Medic**: more flags (14→18), a safety tool; stays.
- **Awkward Silence Filler, BuyWise, Complaint Escalation Writer**: schemas ask for a guess
  (`likely_response`, `risk_level`, `success_likelihood`); redesign the field first.
- **Brag Sheet Builder, Date Night, Difficult Talk Coach**: need a `router.outputGuard` defect list
  before they can leave the frozen list (Difficult Talk Coach also ran 60% longer).
- **Decoder Ring (`primary_emotion`), Fake Review Detective (`manipulation_detected`), Doctor Visit
  Translator (`expected_results_timeline`, `likely_coverage`, no guard)**: fewer flags on the
  switch, but their schemas ask for a guess; redesign the field first.
- Switched in the second pass: Doctor Visit Prep (10→3 flags), History Today (18→19), Markup
  Detective (20→13), Mental Health Navigator (19→11).
- **Layover Maximizer (33→26), Lease Trap Detector (26→21)**: fewer flags, but `risk_level` in the
  schema; redesign the field first.
- Not run: the local API workspace hit its monthly limit on 2026-11-01 (back 2026-12-01):
  mise-en-place, plain-talk, procedure-probe, renters-deposit-saver, not-so-fast, the-debrief,
  missing-link, waiting-mode-liberator; and the 15 frozen tools with no post-check.

## Done means

- The route declares `router.outputStandard = 'lean'`, with its `router.outputGuard` kept.
- Gates pass; the golden case runs live on BOTH the old and new prompt; the new one ships only if
  its answer is at least as good (complete, no repeats, nothing invented) and not slower to first part.
