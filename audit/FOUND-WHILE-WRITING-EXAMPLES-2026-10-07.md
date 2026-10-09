# Output defects found while capturing real examples for tool pages (2026-10-07)

Each tool was run once on its own built-in example against production, to
take real output for its page. These were seen in those runs and kept OFF
the pages. They are candidates for the quality-audit queue (see
audit/QUALITY-AUDIT-KIT.md) — none has been fixed yet.

| Tool | Defect | Class |
|---|---|---|
| TipOfTongue | Pasta example (pecorino + pepper + crispy pork, no cream, no egg) answered **cacio e pepe "with guanciale"** — wrong dish (that is gricia) and wrong recipe; gricia ranked low and described as "sometimes includes tomato". Same in 3 of 3 runs. Movie example called Coraline's lead "his" (echoing the visitor) and missed that this is likely why they "remember it differently". | wrong recall facts |
| RentersDepositSaver (/rights) | California: leads with the old 2-month / 3-month deposit cap and mentions the 2024 one-month cap (AB 12) only as a hedge. Also asserts a general "receipt requirement". | stale law |
| HistoryToday | Rome parallel: Pompey's 67 BCE command placed as a grain-supply fix (it was the anti-piracy lex Gabinia; the grain command was 57 BCE); Caesar's cut of the grain rolls dated 59 BCE (it was 46 BCE). Hearst: "roughly 30 papers by 1917" (his peak chain came in the 1920s–30s). | invented/shifted history |
| NameStorm | Says "Forkful" and "Plateful" are three syllables (both two); "Nouri … works as a .com without argument" — availability asserted, not checked. | wrong count; unverified claim |
| BragSheetBuilder | Bullets add facts not supplied: "without additional headcount", "structured weekly 1:1 curriculum", "zero-disruption reliability", "cross-team". | invention (résumé risk) |
| BillRescue | "Self-pay discount … 30 to 60 percent even if you have insurance"; "kidney stone ER visits qualify" for financial assistance (eligibility is income-based). | overclaim |
| WaitingModeLiberator | "After the interview" window given `minutes: 5` while its note says evening minutes are not counted; total_free_minutes includes those 5. | internal inconsistency |
| WrongAnswersOnly | Fake findings attributed to real institutions (Max Planck Institute, "Copenhagen Institute"). By design a joke, but real-institution attribution is worth a rule. | judgment call |
| LayoverMaximizer | Named specific airport restaurants ("Rijsttafel Schiphol") that may not exist. | possible invention |
| ComplaintEscalationWriter | Suggests concrete email addresses (customerrelations@…) — hedged "confirm", but still invented. | invented contact |

Earlier the same day: SomeoneSaidItBetter placed Wilder's Act III Our Town
line "at a wedding" — fixed in 6b7bbc3b (origin rule + supplied-facts check).

## 2026-10-08 (index-review example runs)

| Tool | Defect | Class |
|---|---|---|
| MoneyDiplomat /split | The "Social Split" (custom) option's reasoning describes the itemised rule ("her main plus half the wine and dessert, plus proportional tax and tip") but its amounts differ from the itemised option (Ana $56.26 vs $69.39). Code rescales custom amounts to the total without checking the reasoning matches. Kept off the page. | reasoning/number mismatch |
| LaundroMat /advise | Mixed load (whites, wool sweater, dark jeans, down jacket): load_assessment says "three separate loads" while its own lists add up to four (whites, sweater, jacket, jeans each alone), and recommended_settings gives one Delicate/Cold/Low setting for every load including the whites. Assessment and settings kept off the page. | count/consistency |
| ToastWriter | Asked for 2 minutes; versions estimate 0:50–1:15. The story-led version adds "the night before" the presentation (input only said she stayed late). Shown: the straightforward version only. | length shortfall; small invention |
| Giftology | US visitor (en-US, USD) got British spellings ('centres', 'favourite', 'organisations'). | locale spelling |
| LeverageLogic | 'not short of applicants' (the visitor's own assessment, in yourSide) recast as 'Your employer indicated…'; an unknown's explanation reverses which way an existing exception cuts. Kept off the page. | misattribution; logic |
| PaperworkPath | Austin move: says a Texas vehicle safety inspection is needed before registration (Texas dropped safety inspections for most passenger vehicles from 2025; emissions testing remains in Travis County); says to register to vote 'online at vote.texas.gov' (Texas has no general online registration). Both kept off the page. Grounded research would catch these. | stale/wrong law |
| NameAudit | **Not indexed.** Its own built-in example 'Loomly' (B2B social-media-management SaaS) gets verdict GOOD FIT, but Loomly is an existing social-media-management product (loomly.com). The tool never checks for existing businesses or domains — it only says 'worth verifying'. Needs a cheap existence check (DNS, as NameStorm's /check does, plus a web search) before a verdict; the example should also be replaced. | missing real-world check |

## Batches 6–7 (2026-10-08)

- **UpsellShield** — `your_plan` wrote "out-of-door price" (should be out-the-door). Line left out of the example.
- **CaptionMagic** — misspelled hashtag `#maxthefrizbee`; two captions invent things not in the input ("my face" covered in sand; a rescue-backstory sentiment). Left out of the example.
- **BuyWise** — `verify_before_buying` asserted "these two brands are sold largely direct" (FlexiSpot sells widely through Amazon). Left out. Most price fields said "could not verify" — honest, but the tool has no price grounding.
- **SignalVsNoise** — some figures not checked against the cited papers (90% polyphasic dropout attributed to S6; "12,637 adults" catch-up study). Left out of the example; consider a number check against source text.
- **SafeWalk** — verified facts are date-bound (Chicago Marathon, station hours), so left out of a permanent example.
- **TheRunthrough** — Cut mode added a sentence not in the original ("Flagging that now so there are no surprises"). Minor; shown as-is.

## Batch 8 (2026-10-08)

- **DocumentDetective** — contradicts itself on the break clause: bottom line and `needs_attention` say notice can only be *given* after month 12; `also_relevant` correctly says notice can be served by end of month 10 to expire at end of month 12. Also overstates that "regardless" wording "removes any argument" (deposit schemes / unfair-terms rules may not agree). Example shows only the consistent parts.
- **BreakMyPlan / FutureProof** — British spellings in an en-US run (utilisation, signalling, optimised, specialise, favourable); same class as Giftology. FutureProof also leaked an `INFERRED:` marker into `the_pattern`. Affected fields left out of the examples.
- **BreakMyPlan** — still opens with a fictional post-mortem narrative ("The two clients did follow…"). Left out.
- **ConceptCoach** — built-in example 3 is tagged stage `idea` but describes a live product with 40 paying teams, and says "3 teams lost … both cited". Fix the example data.

## Batch 9 (2026-10-08)

- **DateNight — NOT indexed.** Austin anniversary run marked every venue `venue_confirmed: true` but invented details: a burnt-ends "sold out by evening" tip, the Lady Bird Lake trail as "well-lit" for a 10:45 PM walk, Elephant Room "jazz Thu–Sat" (it runs nightly), and a "Restaurant Francois at The Driskill" backup that I couldn't find. Needs grounding for venue facts, and shouldn't send people onto an unlit trail at night.
- **AnalogyEngine** — one "where it breaks" line says vaccines get updated because live weakened germs "change a tiny bit" (updates follow the circulating virus, e.g. flu). The misconception line says no vaccine can cause the disease "in a healthy person" (live vaccines can, rarely). Both left out.
- **JustifyMyMeeting** — `time_footprint.occurrences_per_year` came back null for a meeting described as weekly, so the annual cost (~1,144 person-hours) never shows. Should be computed in code from "weekly/daily/monthly".
- **MeetingHijackStopper** — the user picked "Disagree & commit", but `decision_plan` ignored it. Left out.

## Fixed 2026-10-08 (same day)

- **British spelling (all tools)** — `lib/usSpelling.js`, applied in the voiceFix middleware to every English reply for a US (or region-less) visitor. Fixed word list (not a suffix rule), skips URLs, mid-sentence capitalized names, and any British form the visitor typed.
- **JustifyMyMeeting** — judge view reads how often the meeting happens from the visitor's own words (`perYearFromText`, English only); weekly all-hands now shows 1,144 person-hours a year.
- **AnalogyEngine** (shared `factCheck.js`, facts mode) — checker now flags absolute words on facts with known exceptions and wrong reasons/mechanisms, including inside "where it breaks" lines. Re-run on the saved vaccine output: the wrong reason was caught and corrected.
- **DocumentDetective** — reading rule (keep a time condition on the event the document attaches it to) + two guard terms; guard check/repair moved to SMART (`runOutputGuard` gained `opts.model`). Re-run: every field now says serve notice so it expires at end of month 12.
- **SignalVsNoise** — `dropUnsourcedFigures`: any figure (>12 or non-integer) not found in the research packet or the visitor's input drops its sentence/clause. Note: "12,637 adults" was in fact sourced (S14's title); the 90% dropout figure is what this now catches.
- **ConceptCoach** — example 3 now `launched`, churn "2 teams … both" in all 13 languages.

## All-tools indexing, batch 1 (2026-10-08)

- **FanTheory — FIXED.** Severance run invented scenes as "canonical" evidence (innies finishing each other's sentences, Irving painting Lumon as a god) and promoted one to Smoking Gun. The FAST canon check passed them, and the keep-rule kept every claim whenever cuts left fewer than two. Canon check → SMART; cut evidence is always removed (500 if nothing real survives). Re-run was accurate. Still open: the `counterargument` field isn't canon-checked (it named a nonexistent "Dan").
- **BeforeTheCrash — FIXED.** Pattern counts were wrong ("3 of the 5" for a combination on 2 days; "trended down continuously" for 4 → 5 → 2). Added the shared number check (all prose fields, recount rule) after the guard on both endpoints. Re-run accurate.
- **FocusSoundArchitect — FIXED.** "Avoid sudden sounds" + rain preference: code stripped the rain layer but start_here still said "rain at 35". Excluded layer types are now removed from the menu before the model writes.
- **BatchFlow** — batch 1's own padded sum (170 min) exceeds its time window (165 min); it says so in why_batched. Left out of the example.
- **WhereDidTheTimeGo — FIXED.** "Roughly 4 hours available" over blocks summing to 5 in a day leaving 6. Added the shared number check (durations recomputed from the account). Re-run correct.
- **Guard repair (all v2 tools) — FIXED.** Plot Hole Finder's repair rewrote two findings' case_against with the focus question's argument (it saw only the field path). `runOutputGuard` repair now shows each flagged field's sibling text ("belongs to: …"). Re-run: every argument matched its finding.
- **PlotHoleFinder — HELD, not indexed.** Dark Knight Rises run: says Gordon chose not to deliver his speech (Bane reads it aloud), "five months unaccounted for" after the pit climb, Bane as Ra's "lieutenant" (he was excommunicated). Tried the shared facts-mode check: it missed Gordon and "corrected" the reactor detail INTO an error (core detonates as it decays; it said becomes inert). Reverted. Needs grounded story facts (e.g. a plot-summary source), not a second model's memory.
- **SocialBatteryAdvisor** — a contrast titled "differed sharply" whose own text says the two "align rather than contrast". Left out.

## All-tools indexing, batches 4–7 (2026-10-08)

- **SmallChangeBigDifference + Which Life? — FIXED, were DOWN in production since 2026-10-05.** `withSurge` (lib/surge.js) was an `async` wrapper, so `messages.stream()` got a plain Promise with no `.withResponse()` and every streaming call threw. Wrapper now returns the SDK's APIPromise untouched for stream calls (6d4030c5).
- **LazyWorkoutAdapter** — a "why" says "you mentioned stiff shoulders" (input: stiff neck, lower back) and one "why" is blank. Left out.
- **TripRecon** — says DIA has "a train connection from the garage to the terminal" (garages adjoin the terminal; the train runs to the concourses). Left out. Same risk class as Date Night: place facts from model memory.
- **MicroAdventureMapper** — calls Boston Common "at the north end of the Freedom Trail" (it is the start, at the south). Left out.
- **SmallChangeBigDifference** — "20 min x 5 weekdays = 100 min/week" then "x 365 days = ~122 hours/year" (mixes weekday and daily rates). Left out.
- **EmailUrgencyTriager** — built-in example 1 asks to move a deadline to "Sept 12 instead of Oct 1": both dates are now past. Example text should be date-free.
- **ReadTheRoom** — built-in example 1 is typed "Work Happy Hour" but describes a team offsite.
