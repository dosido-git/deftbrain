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
| Party Architect | **old kept**: lean invented an end time, food "creating a shared moment", cleanup as a hint to leave (guard flags 32-35 vs 19) | its rules encode real, tool-specific distinctions; its six parallel passes were already fast (9s) |

So:
- **Never assume shorter is better. Run the old and new prompt on the same case and keep the better answer** (fewer guard flags, nothing invented, complete), then compare speed.
- **Name the tool's own traps** as short bullets; the route's `router.outputGuard` terms are the list.
- **Keep length rules.** Dropping "3 items per list" nearly doubled an answer; the house rules now carry a general length rule, and a tool keeps its own counts.
- **Flag counts vary ±2 run to run.** The bar is "not clearly worse", read alongside the answer itself.
- **Plan-first only when sections must agree** (advice, scripts, a verdict the rest builds on). Independent sections run as parallel disjoint passes: faster.

## Done means

- The route declares `router.outputStandard = 'lean'`, with its `router.outputGuard` kept.
- Gates pass; the golden case runs live on BOTH the old and new prompt; the new one ships only if
  its answer is at least as good (complete, no repeats, nothing invented) and not slower to first part.
