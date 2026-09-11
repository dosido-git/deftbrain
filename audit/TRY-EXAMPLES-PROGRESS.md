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
| 7 | BeforeTheCrash | inline | check-in (patterns reads the saved log — no seed) | 2 | 5 (sliding / good / marked crash / wired + wearable numbers / flat-withdrawn) | ✅ 2026-09-11 |
| 8 | BeliefStressTest | i18n | — | 8 bare beliefs | 5 rotated pairs, 3 with the optional context (3 keys ×13); 8 chips kept | ✅ 2026-09-11 |
| 9 | BikeMedic | i18n | 10 problems (loadExample seeds the interpreter or a tree) | 2 | 5 (shifting / noise / repeat flat / hydraulic brakes / 'custom' vague fault; 3 keys ×13; custom no longer routed to a tree that does not exist) | ✅ 2026-09-11 |
| 10 | BillRescue | i18n | rescue / letters (quick, triage, rehearse, tracker take no free input) | 2 (rescue) | 5 + 5 (rescue: 5 bill types × 5 statuses; letters: 5 letter types, 2 with context; 10 keys ×13; fixed dead 'dispute' reason value) | ✅ 2026-09-11 |
| 11 | Bookmark | i18n | show / book / game / sports | 1 per type, no rotation | 5 per type via pickExample('Bookmark:<type>') — precise vs vague stopping points, one per type with nothing remembered (44 keys ×13) | ✅ 2026-09-11 |
| 12 | BragSheetBuilder | inline | transform (other tabs consume results) | 2 | 5 (senior tech / mid nonprofit / entry retail / executive finance / student, 3 lines) — role, years, purposes, tone now travel with each | ✅ 2026-09-11 |
| 13 | BrainDumpBuddy | inline | freetext / rapid / voice (one rotation; each example carries its mode) | 2 | 5 (two long typed dumps, a rapid list, a short feelings-only dump, a voice transcript) | ✅ 2026-09-11 |
| 14 | BrainRoulette | inline + i18n topics | spin (debate/journey/digest consume a spin) | 4 | 5 (+ a folk belief at quick/casual; 1 key ×13) — depths quick/medium/deep, audiences casual/curious/nerd | ✅ 2026-09-11 |
| 15 | BrainStateDeejay | inline | — | 2 | 5 (overwhelmed→grounded, low_energy→energized, anxious→sleepy with no task/genres and a written taste; sensitivities and taste now travel) | ✅ 2026-09-11 |
| 16 | BreakMyPlan | i18n | 8 plan types | 2 | 5 (creative / project / career / financial / relationship; 9 keys ×13) | ✅ 2026-09-11 |
| 17 | BuyWise | inline | form / budget / calendar / quote / haul / convince (photo needs an image — shares the form's product) | 2 (form) | 5 × 6 views via pickExample('BuyWise:<view>'); impulse, gift and priority now travel with form examples | ✅ 2026-09-11 |
| 18 | CaptionMagic | i18n | 7 platforms × 3 lengths | 2 | 5 (+ twitter/short, linkedin/long, facebook/medium; 6 keys ×13) | ✅ 2026-09-11 |

(rows 13–126 are appended as each batch is inventoried — see
`scratchpad/examples/inventory.json` for the machine inventory of all 126.)

## Follow-ups

- Translate inline example sets for localized tools (13 languages) once English coverage is complete.
