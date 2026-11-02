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

## Done means

- The route declares `router.outputStandard = 'lean'`, with its `router.outputGuard` kept.
- Gates pass; the golden case runs once live; the answer is compared with the old one on the same
  input (complete, no repeats, nothing invented, first part < 5s).
