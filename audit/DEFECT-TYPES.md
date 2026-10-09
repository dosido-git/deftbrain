# Defect types — fix the type, not the instance

Started 2026-10-08. Every output defect is filed here under a **type**, not under a tool.
Each type has (or needs) **one shared fix** in `backend/lib/` that every tool can use.

**The rule.** Before fixing a defect:
1. Name its type in this file.
2. If the type's shared fix exists and the tool doesn't use it, wire it in. That's the fix.
3. If no shared fix exists, build it in `backend/lib/`, not in the route.
4. Then sweep: list every tool exposed to the type and record which ones use the fix.

A prompt-only change is not a fix for any type below. It can sit alongside a check, never replace one.

Sources: `audit/FOUND-WHILE-WRITING-EXAMPLES-2026-10-07.md` and `…-2026-10-08-grounding.md`.
Instances marked *fixed* were fixed per tool (before this file existed) unless the shared fix is named.

---

## Summary

| # | Type | Shared fix | Status | Open instances |
|---|---|---|---|---|
| T1 | Real-world facts from memory | `lib/worldFacts.js` (cached search + Sonnet contradiction check) | 25 tools; built 2026-10-09 | 2 (PaperworkPath voter line, PlotHoleFinder) |
| T2 | Arithmetic, counts, totals | Compute in code; else the number check | 18 tools; 2026-10-09 sweep done | 0 |
| T3 | Self-contradiction between fields | Consistency check (`outputGuard`, Sonnet) | **Built 2026-10-09**; 96 routes | 0 |
| T4 | Details the visitor never said | Output guard, or `checkConsistency` check 10 (same call) | ~99 tools; 2026-10-09 | 0 |
| T5 | Overreach (absolutes, legal/medical conclusions, false framing) | Facts-mode number check, guard terms | Partial | 2 |
| T6 | Locale and wording leaks | Reply filter (`voiceFix`: markers, "visitor", US spelling) | All tools | 1 minor |
| T7 | A visitor's choice ignored | Same check, reads the form choices itself | **Built 2026-10-09**; 96 routes | 0 |
| T8 | Built-in examples stale or inconsistent | `scripts/example-dates-audit.js` (Gate 13) + `exampleDate`/`dayMonthFromToday` | Built 2026-10-09 | 0 |
| T9 | Shared-code change breaks tools | `scripts/smoke-tools.js` (pre-push Gate 12) | **Built 2026-10-09**; 295 of 357 endpoints exercised | 0 |

---

## T1 — Real-world facts from memory

**What goes wrong.** The tool states a fact about the world — a place, a law, a plot, a price, a date, a product, a person — from the model's memory, and it's wrong or out of date.

**Why prompts can't fix it.** The model doesn't know it's wrong. Telling it to be careful doesn't change what it remembers. A second model checking from memory made one error worse (Plot Hole Finder).

**Shared fix.** Fetch the facts with web search (`lib/groundedFacts.js`, cached, stale-while-revalidate). Then compare the answer against what was found, a reading job rather than a memory job (`factCheck.checkAgainstSupplied`, `model: MODELS.SMART`). Related: `lib/venues.js`, `lib/airportPlaces.js`, `lib/claimResearch.js`, `attachSourceUrls`.

**Tools using it (25; `lib/worldFacts.js` added 2026-10-09 for paperwork-path, sensory-minefield-mapper, micro-adventure-mapper, culture-briefing, mental-health-navigator, pronounce-it-right, laundro-mat stain):** bill-rescue, bookmark, bike-medic, buy-wise, brain-roulette, contract-decoder, date-night, future-proof, lease-trap-detector, layover-maximizer, name-audit, plain-talk, procedure-probe, plot-hole-finder, renters-deposit-saver, signal-vs-noise, someone-said-it-better, ticket-tackler.

| Instance | Status |
|---|---|
| TipOfTongue — "cacio e pepe with guanciale" (that's gricia) | fixed (SMART + clue check) |
| RentersDepositSaver — old California deposit cap | fixed (grounded /rights) |
| HistoryToday — Pompey/Caesar dates, Hearst count | fixed (facts check) |
| LayoverMaximizer — invented airport restaurants | fixed (`airportPlaces`) |
| ComplaintEscalationWriter — invented contact emails | fixed |
| WrongAnswersOnly — fake findings by real institutions | fixed (no real institutions) |
| NameAudit — "Loomly" GOOD FIT though Loomly exists | **fixed with shared fix** (search) |
| DateNight — venue details beyond what was verified | **fixed with shared fix** |
| FanTheory — invented Severance scenes | fixed (SMART canon check) |
| AnalogyEngine — wrong reason vaccines get updated | fixed (facts-mode check) |
| SignalVsNoise — figures not in the sources | fixed (`dropUnsourcedFigures`) |
| PaperworkPath — Texas safety inspection, online voter registration | **fixed with shared fix** (`worldFacts`; live run now says emissions inspection only. Voter line now names Texas.gov, which offers registration only alongside a DPS licence transaction — watch) |
| TripRecon — Denver airport "train from the garage" | **fixed with shared fix** (live run: train runs terminal → A → B → C) |
| MicroAdventureMapper — Boston Common "at the north end" of the Freedom Trail | **wired to shared fix** (not reproduced on the live run) |
| **BuyWise** — "sold largely direct"; no price lookup | **open** |
| **PlotHoleFinder** — story timing errors; plot summary lacks timing | **open (held from search)** |

**Known limit (2026-10-09).** A topic search only catches claims it happens to cover: Paperwork Path still said Texas voters can register online (they can't, except during a DPS licence transaction; verified by search) because the research never covered voting. Brief widened for that tool; the type-level fix is claim-by-claim verification (search each specific high-stakes claim the answer makes), the same mechanism Plot Hole Finder's timing errors need. Not built yet.

**Deliberately not grounded:** DoctorVisitPrep / DoctorVisitTranslator (claims are per-visit, research would run every time), Giftology, PartyArchitect, HobbyMatch (low-stakes, per-request). BuyWise already says it could not verify a price rather than guessing.

**Sweep needed.** List every tool that states place, law, price, health, product or story facts without a search step. Likely candidates: PaperworkPath, TripRecon, MicroAdventureMapper, CultureBriefing, DoctorVisitPrep/Translator, MentalHealthNavigator, PronounceItRight, LaundroMat, Giftology, PartyArchitect, HobbyMatch.

---

## T2 — Arithmetic, counts, totals, durations

**What goes wrong.** Sums, counts, rates or time totals don't add up, or don't match the tool's own lists.

**Shared fix, in order of preference:**
1. **Compute it in code** whenever the numbers have structure (`payMath`, `splitMath`, `statementMath`, `timeFootprint`).
2. Otherwise run the **number check** (`factCheck.withNumberCheck`) on every prose field, not only fields with digits, with a recount rule naming the data.

**Tools using the number check (15):** analogy-engine, before-the-crash, bill-rescue, buy-wise, decision-coach, doctor-visit-translator, history-today, layover-maximizer, markup-detective, justify-my-meeting, lease-trap-detector, money-diplomat, recipe-chaos-solver, quote-check, where-did-the-time-go.

| Instance | Status |
|---|---|
| NameStorm — syllable counts | fixed |
| WaitingModeLiberator — minutes counted against its own note | fixed |
| DecisionCoach — pay gap direction | fixed (`payMath`) |
| JustifyMyMeeting — no yearly cost for a weekly meeting | fixed (computed in code) |
| BeforeTheCrash — "3 of the 5" (was 2) | **fixed with shared fix** |
| WhereDidTheTimeGo — free time added up wrong | **fixed with shared fix** |
| MoneyDiplomat — "Social Split" explanation vs its amounts | **fixed with shared fix** (number check now sees the final rescaled amounts and every prose field) |
| LaundroMat — "three loads" vs four in its own list | **fixed with shared fix** (number check + consistency check, every mode) |
| SmallChangeBigDifference — weekday rate × 365 days | **fixed with shared fix** (number check before the stream's done event) |
| BatchFlow — padded batch time exceeds its own window | **fixed with shared fix** (number check, all 13 modes) |
| ToastWriter — asked for 2 minutes, writes about 1 | **fixed in code** (estimated_time = words ÷ 130/min; length stays a ceiling by design) |

**Sweep needed.** Every tool whose output contains numbers it derived itself (totals, durations, counts, per-year figures) and doesn't run the number check.

---

## T3 — Self-contradiction between fields

**What goes wrong.** Two parts of one answer say incompatible things. Each part looks fine on its own.

**Shared fix: built 2026-10-09.** A consistency check in `lib/outputGuard.js` (checks 8 and 9, `CONSISTENCY_CHECKS`):
- Every route that calls `runOutputGuard` (43) gets it automatically, run **in parallel** with its v2 check, so it adds cost (~$0.03 a run), not wait.
- Any other route wires it in one line: `await checkConsistency(parsed, { label, promise, userLanguage })`. It reads every string field itself.
- It runs on **Sonnet**: on the logged cases Haiku caught an ignored choice one run in two, Sonnet every time.
- **Both sides of a contradiction are repaired together**, settled against what the visitor typed. With one side flagged, the checker kept the wrong side 2 times in 3. If the input doesn't settle it, the disputed claim comes out of both.
- Short label fields (enums, chips, numbers, all-caps verdicts) are shown to the check but never rewritten.
- It reads the WHOLE answer, not only the fields the route guards (2026-10-09): Plot Hole Finder's summary said "two confirmed problems" while every verdict enum said MAYBE. A contradiction flagged on a label is repaired on its prose side.

**Coverage (2026-10-09 sweep):** 43 guarded routes + 53 wired with `checkConsistency` on their main endpoint (every mode for money-diplomat) = 96.

**Deliberately not covered (25)** — one short output, nothing to contradict, few form choices; the check would cost ~$0.03 and ~12s per visit for nothing: awkward-silence-filler, brain-roulette, brainstate-deejay, caption-magic, cold-open-craft, comeback-cooker, context-collapse, ghost-writer, heart-of-the-matter, magic-mouth, mend, missing-link, name-storm, pronounce-it-right, roast-me, six-degrees-of-me, someone-said-it-better, the-whole-story, time-warp, tip-of-tongue, tool-finder, toast-writer, truth-bomb, whats-my-vibe, wrong-answers-only. Also skipped: final-wish (translation), small-change-big-difference and the-runthrough (stream, no JSON reply to check). Follow-up endpoints (refine, regenerate, deeper…) are not covered.

| Instance | Status |
|---|---|
| DocumentDetective — break clause read two ways | fixed per tool (guard term + SMART) |
| FocusSoundArchitect — "rain at 35" after rain was removed | fixed (menu filtered before writing) |
| PlotHoleFinder — guard repair attached arguments to the wrong finding | **fixed with shared fix** (repair sees the owning item) |
| SocialBatteryAdvisor — "differed sharply" / "align rather than contrast" | **fixed with shared fix** (both sides rewritten to match the logs) |
| LeverageLogic — explanation reverses which way an exception cuts | **wired to shared fix** (not reproduced; real run also caught an ignored urgency/relationship choice) |
| DateNight — a repair left "every night" beside "Thu–Sat" | **fixed with shared fix** (claim removed from both) |

---

## T4 — Details the visitor never said

**What goes wrong.** The answer adds facts about the visitor or their situation that they never gave, or attributes their words to someone else.

**Shared fix.** `runOutputGuard` (`invented_fact`, `mind_reading`) and `checkAgainstSupplied`.

**Closed 2026-10-09.** `checkConsistency` gained check 10 (a detail about the visitor they never gave), in the same Sonnet call, so every route wired for T3/T7 got T4 at no extra cost. Before that, 43 routes on the FROZEN_V1 list ran neither check:

> alternate-path, analogy-engine, argue-smarter, awkward-silence-filler, batch-flow, belief-stress-test, bike-medic, bill-rescue, bookmark, brain-dump-buddy, brain-roulette, brainstate-deejay, buy-wise, complaint-escalation-writer, context-collapse, decoder-ring, doctor-visit-prep, fake-review-detective, final-wish, ghost-writer, history-today, layover-maximizer, lease-trap-detector, markup-detective, mental-health-navigator, mise-en-place, name-storm, plain-talk, procedure-probe, pronounce-it-right, renters-deposit-saver, roast-me, not-so-fast, six-degrees-of-me, the-whole-story, the-debrief, missing-link, tip-of-tongue, tool-finder, virtual-body-double, waiting-mode-liberator, wrong-answers-only

Some have their own checks (several are grounded or number-checked), but none checks for this type.

| Instance | Status |
|---|---|
| BragSheetBuilder — résumé bullets with facts not supplied | fixed (supplied-facts check) |
| ToastWriter — "the night before" | **fixed with shared fix** (check 10) |
| CaptionMagic — sand "on my face", rescue backstory | **fixed** (its own evidence check moved to Sonnet) |
| LazyWorkoutAdapter — "you mentioned stiff shoulders" | **fixed with shared fix** (check 10) |
| TheRunthrough — Cut mode adds a sentence | **fixed with shared fix** (check 10) |
| LeverageLogic — visitor's own assessment recast as "your employer indicated" | **fixed with shared fix** (check 10) |

---

## T5 — Overreach

**What goes wrong.**
- Absolute claims on facts with exceptions.
- Legal or medical conclusions the tool can't support.
- A story presented as if it were a finding.
- Directive certainty the charter rules out.

**Shared fix.**
- The facts-mode number check flags absolutes and wrong mechanisms.
- Guard terms cover the rest per tool.
- Not yet a single shared rule set.

| Instance | Status |
|---|---|
| BillRescue — "30–60% discount", "kidney stone visits qualify" | fixed |
| DocumentDetective — "removes any argument" | fixed |
| NameAudit — "likely trademark infringement" | fixed (rule in its update step) |
| AnalogyEngine — "nothing capable of causing disease" | **fixed with shared fix** |
| BreakMyPlan — opens with an imagined failure story | **fixed** (owner decision 2026-10-09: story no longer shown; results open with the assumption to test first) |
| DecisionCoach — page promise "One answer. Not options." vs charter | **fixed** (owner decision 2026-10-09: "A clear recommendation, and what would change it", 13 languages) |

---

## T6 — Locale and wording leaks

**What goes wrong.**
- British spelling for US visitors.
- Internal words reaching the page: "the visitor", "INFERRED:", "the confirmed notes".
- Typos.

**Shared fix.** The reply filter on every English `/api` reply (`lib/voiceFix.js` + `lib/usSpelling.js`). Add new leak patterns there, not in prompts.

| Instance | Status |
|---|---|
| "the visitor" in replies | **fixed with shared fix** |
| Giftology / BreakMyPlan / FutureProof British spellings | **fixed with shared fix** |
| DateNight repair wrote "the confirmed notes describe…" | fixed per tool (repair wording) |
| FutureProof — "INFERRED:" marker in prose | **fixed with shared fix** (reply filter strips prompt markers in every language; a bare enum value is kept) |
| UpsellShield — "out-of-door price" | open, minor |

---

## T7 — A visitor's choice ignored

**What goes wrong.** The visitor picks a setting or supplies a field, and the answer behaves as if they hadn't.

**Shared fix: built 2026-10-09** (same check as T3). The request body now travels with the route context (`lib/outputStandard.js` `currentRequestBody`), so the check lists the visitor's short form choices itself — no route passes them. The checker must account for each choice and name the field that carries it out, or NONE. Enforcing a choice in code (as Focus Sound Architect does) is still better where possible.

| Instance | Status |
|---|---|
| FocusSoundArchitect — "avoid sudden sounds" vs rain | fixed (enforced in code) |
| JustifyMyMeeting — "weekly" not used for yearly cost | fixed (read in code) |
| MeetingHijackStopper — "Disagree & commit" ignored | **fixed with shared fix** (reproduced, caught, plan now uses it) |

---

## T8 — Built-in examples stale or inconsistent

**What goes wrong.** The tool's own "Try an example" content has passed dates, or fields that contradict each other.

**Shared fix: built 2026-10-09.** `scripts/example-dates-audit.js` (Gate 13) fails on any NEW fixed date in an example (18 historical years baselined in `src/data/example-dates.json`). Dates are computed with `exampleDate` / `dayMonthFromToday` (`src/utils/formatLocale.js`); also fixed TicketTackler (tickets dated weeks ago, response windows closed) and LeaseTrapDetector (a lease that had already ended). Still by eye: example fields that disagree with each other. Original plan:
- flag month names, dates and years;
- flag example fields that disagree with each other (type vs description), for a person to review.

| Instance | Status |
|---|---|
| ConceptCoach — example 3 stage/churn | fixed |
| EmailUrgencyTriager — "Sept 12 instead of Oct 1" | **fixed** (dates computed from today, 13 languages) |
| ReadTheRoom — "Work Happy Hour" type, offsite description | **fixed** (description now a happy hour, 13 languages) |

---

## T9 — Shared-code change breaks tools

**What goes wrong.** A change in `backend/lib/` breaks tools whose own files didn't change, so their saved test cases never run.

**Shared fix: built 2026-10-09.** `scripts/smoke-tools.js` (`npm run smoke:tools`, pre-push Gate 12 when `backend/lib/`, `server.js` or `routes/index.js` changed). It starts the real backend with the real SDK pointed at a stand-in API server, so it costs nothing and sends nothing out. Each endpoint gets a golden input (its own, a sibling's, or a listed one) and a canned answer, and the outcome is compared with `scripts/smoke-tools-baseline.json`. Proven: putting the Oct 5 async-wrapper bug back fails the run with the same error the site had.

Limits: it checks that tools run, not that answers are right. 62 endpoints never reach the model (follow-up steps needing an earlier result, uploads, cold research 503s); each one added to `INPUTS` in the script raises coverage. After a deliberate route change that alters an endpoint's outcome, rerun with `--update`.

| Instance | Status |
|---|---|
| Surge wrapper broke all streaming (Small Change, Which Life?) for 3 days | fixed (6d4030c5) |

---

## Order of work

1. ~~**T9 smoke test.**~~ Done 2026-10-09.
2. ~~**T3 + T7**~~ Done 2026-10-09: 96 routes, 25 short-output tools skipped on purpose.
3. ~~**T4**~~ Done 2026-10-09 (check 10 in `checkConsistency`).
4. ~~**T1**~~ PaperworkPath, TripRecon, MicroAdventureMapper done 2026-10-09 (`lib/worldFacts.js`). Still to sweep: the candidate list above.
5. ~~**T2**~~ Done 2026-10-09.
6. ~~**T6, T8**~~ Done 2026-10-09.
