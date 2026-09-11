# Try-Example coverage — five per tool, five per mode

Owner request (2026-09-11): every tool, and every input mode a tool has, gets **five** "Try an
example" entries designed to exercise the full range of the tool's possible outputs — not five
variations of the happy path. English first; tools whose examples already live in the i18n catalog
get all 13 languages at once (Gate 5 requires it).

## Conventions

- **Keep each tool's existing mechanism.** 76 tools carry an inline `EXAMPLES` array read through
  `pickExample('<Tool>', EXAMPLES)` (`src/utils/exampleRotation.js` — a per-tool localStorage counter,
  so five examples rotate deterministically across clicks and visits). Tools already on `_exN_`
  i18n keys stay on keys. No cross-catalog refactor.
- **Modes rotate independently.** A tool with input modes keeps one example list per mode and picks
  with `pickExample('<Tool>:<mode>', EXAMPLES[mode])`, so switching mode does not skip an example.
- **Range, not repetition.** The five should differ on the dimensions that change the OUTPUT: the
  enum inputs (tone, depth, level, format, type), the length/richness of free text, the domain
  (health / money / work / family / tech / civic), edge conditions (missing optional fields, an
  input that should produce a "can't tell" or "mixed" result), and at least one that is not the
  obvious first guess.
- **An example is a promise.** It must be something the tool genuinely handles well end-to-end;
  never an input that reliably 500s, truncates, or produces a thin result. Spot-check one live when
  in doubt.
- Inline examples are English in every language (pre-existing behaviour for those 76 tools);
  translating them is a separate follow-up, tracked at the bottom.

## Status

| # | Tool | Mechanism | Modes | Before | After | Done |
|---|------|-----------|-------|--------|-------|------|
| 1 | AlternatePath | inline | — | 2 | 5 | ✅ 2026-09-11 |
| 2 | AnalogyEngine | inline | — | 2 | 5 | ✅ 2026-09-11 |
| 3 | ArgueSmarter | inline | setup / quick / prep (fallacy is a quiz — no input to seed) | 2 (setup only) | 5 + 5 + 5 | ✅ 2026-09-11 |
| 4 | AwkwardSilenceFiller | inline | 8 scenarios | 2 | 5 (5 scenarios, 5 comfort levels; 2 new i18n keys ×13) | ✅ 2026-09-11 |
| 5 | BatchFlow | i18n | — | 2 sets | 5 sets (4 energy curves, 5 day types, time 2h→unknown; 17 keys ×13) | ✅ 2026-09-11 |
| 6 | BeforeHello | i18n | 7 target types | 2 | 5 (investor/mentor/employer/client/connector; 9 keys ×13) | ✅ 2026-09-11 |
| 7 | BeforeTheCrash | inline | log / patterns | ? | | |
| 8 | BeliefStressTest | inline (strings) | — | 9 | | |
| 9 | BikeMedic | inline | 8 problems × tabs | 2 | | |
| 10 | BillRescue | inline | 8 bill types / 7 letter types | ? | | |
| 11 | Bookmark | none | 4 media types | 0 | | |
| 12 | BragSheetBuilder | inline | tabs | 2 | | |

(rows 13–126 are appended as each batch is inventoried — see
`scratchpad/examples/inventory.json` for the machine inventory of all 126.)

## Follow-ups

- Translate inline example sets for localized tools (13 languages) once English coverage is complete.
