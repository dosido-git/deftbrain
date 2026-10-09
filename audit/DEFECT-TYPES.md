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
| T1 | Real-world facts from memory | Web search + compare against what it found | Exists; 18 of ~120 tools use it | 4 |
| T2 | Arithmetic, counts, totals | Compute in code; else the number check | Exists; 15 tools use the number check | 4 |
| T3 | Self-contradiction between fields | **None generic** | To build | 3 |
| T4 | Details the visitor never said | Output guard / supplied-facts check | Exists, but 43 frozen tools have neither | 5 |
| T5 | Overreach (absolutes, legal/medical conclusions, false framing) | Facts-mode number check, guard terms | Partial | 2 |
| T6 | Locale and wording leaks | Reply filter (`voiceFix` + `usSpelling`) | Exists, all tools | 1 |
| T7 | A visitor's choice ignored | **None** | To build | 1 |
| T8 | Built-in examples stale or inconsistent | **None** | To build | 2 |
| T9 | Shared-code change breaks tools | **None** | To build | 0 open (1 outage, fixed) |

---

## T1 — Real-world facts from memory

**What goes wrong.** The tool states a fact about the world — a place, a law, a plot, a price, a date, a product, a person — from the model's memory, and it's wrong or out of date.

**Why prompts can't fix it.** The model doesn't know it's wrong. Telling it to be careful doesn't change what it remembers. A second model checking from memory made one error worse (Plot Hole Finder).

**Shared fix.** Fetch the facts with web search (`lib/groundedFacts.js`, cached, stale-while-revalidate). Then compare the answer against what was found, a reading job rather than a memory job (`factCheck.checkAgainstSupplied`, `model: MODELS.SMART`). Related: `lib/venues.js`, `lib/airportPlaces.js`, `lib/claimResearch.js`, `attachSourceUrls`.

**Tools using it (18):** bill-rescue, bookmark, bike-medic, buy-wise, brain-roulette, contract-decoder, date-night, future-proof, lease-trap-detector, layover-maximizer, name-audit, plain-talk, procedure-probe, plot-hole-finder, renters-deposit-saver, signal-vs-noise, someone-said-it-better, ticket-tackler.

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
| **PaperworkPath** — Texas safety inspection, online voter registration | **open** |
| **TripRecon** — Denver airport "train from the garage" | **open** |
| **MicroAdventureMapper** — Boston Common "at the north end" of the Freedom Trail | **open** |
| **BuyWise** — "sold largely direct"; no price lookup | **open** |
| **PlotHoleFinder** — story timing errors; plot summary lacks timing | **open (held from search)** |

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
| **MoneyDiplomat** — "Social Split" explanation vs its amounts | **open** (code rescales amounts without checking the explanation) |
| **LaundroMat** — "three loads" vs four in its own list | **open** |
| **SmallChangeBigDifference** — weekday rate × 365 days | **open** |
| **BatchFlow** — padded batch time exceeds its own window | **open** (computable in code) |
| ToastWriter — asked for 2 minutes, writes about 1 | **open** (length is computable: words ÷ ~130/min) |

**Sweep needed.** Every tool whose output contains numbers it derived itself (totals, durations, counts, per-year figures) and doesn't run the number check.

---

## T3 — Self-contradiction between fields

**What goes wrong.** Two parts of one answer say incompatible things. Each part looks fine on its own.

**Shared fix: to build.** Add a generic `contradicts_another_field` check to the shared output guard's own prompt (`lib/outputGuard.js`). The guard already reads every field of every v2 answer, so this costs almost nothing extra. Done per tool so far:
- Document Detective has its own term.
- The guard repair now sees each field's sibling text.

| Instance | Status |
|---|---|
| DocumentDetective — break clause read two ways | fixed per tool (guard term + SMART) |
| FocusSoundArchitect — "rain at 35" after rain was removed | fixed (menu filtered before writing) |
| PlotHoleFinder — guard repair attached arguments to the wrong finding | **fixed with shared fix** (repair sees the owning item) |
| **SocialBatteryAdvisor** — "differed sharply" / "align rather than contrast" | **open** |
| **LeverageLogic** — explanation reverses which way an exception cuts | **open** |
| **DateNight** — a repair left "every night" beside "Thu–Sat" | **open** |

---

## T4 — Details the visitor never said

**What goes wrong.** The answer adds facts about the visitor or their situation that they never gave, or attributes their words to someone else.

**Shared fix.** `runOutputGuard` (`invented_fact`, `mind_reading`) and `checkAgainstSupplied`.

**The gap.** 43 routes on the FROZEN_V1 list run neither check:

> alternate-path, analogy-engine, argue-smarter, awkward-silence-filler, batch-flow, belief-stress-test, bike-medic, bill-rescue, bookmark, brain-dump-buddy, brain-roulette, brainstate-deejay, buy-wise, complaint-escalation-writer, context-collapse, decoder-ring, doctor-visit-prep, fake-review-detective, final-wish, ghost-writer, history-today, layover-maximizer, lease-trap-detector, markup-detective, mental-health-navigator, mise-en-place, name-storm, plain-talk, procedure-probe, pronounce-it-right, renters-deposit-saver, roast-me, not-so-fast, six-degrees-of-me, the-whole-story, the-debrief, missing-link, tip-of-tongue, tool-finder, virtual-body-double, waiting-mode-liberator, wrong-answers-only

Some have their own checks (several are grounded or number-checked), but none checks for this type.

| Instance | Status |
|---|---|
| BragSheetBuilder — résumé bullets with facts not supplied | fixed (supplied-facts check) |
| **ToastWriter** — "the night before" | **open** |
| **CaptionMagic** — sand "on my face", rescue backstory | **open** |
| **LazyWorkoutAdapter** — "you mentioned stiff shoulders" | **open** |
| **TheRunthrough** — Cut mode adds a sentence | **open** |
| **LeverageLogic** — visitor's own assessment recast as "your employer indicated" | **open** |

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
| **BreakMyPlan** — opens with an imagined failure story | **open** (design question) |
| **DecisionCoach** — page promise "One answer. Not options." vs charter | **open (owner decision)** |

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
| **FutureProof** — "INFERRED:" marker in prose | **open** (add marker-stripping to the reply filter) |
| UpsellShield — "out-of-door price" | open, minor |

---

## T7 — A visitor's choice ignored

**What goes wrong.** The visitor picks a setting or supplies a field, and the answer behaves as if they hadn't.

**Shared fix: to build.** A guard `require` term every v2 tool inherits: "every option the visitor explicitly chose is reflected". Or, better where possible, enforce the choice in code (as Focus Sound Architect now does).

| Instance | Status |
|---|---|
| FocusSoundArchitect — "avoid sudden sounds" vs rain | fixed (enforced in code) |
| JustifyMyMeeting — "weekly" not used for yearly cost | fixed (read in code) |
| **MeetingHijackStopper** — "Disagree & commit" ignored | **open** |

---

## T8 — Built-in examples stale or inconsistent

**What goes wrong.** The tool's own "Try an example" content has passed dates, or fields that contradict each other.

**Shared fix: to build.** A lint script over every tool's EXAMPLES and its 13 locale strings:
- flag month names, dates and years;
- flag example fields that disagree with each other (type vs description), for a person to review.

| Instance | Status |
|---|---|
| ConceptCoach — example 3 stage/churn | fixed |
| **EmailUrgencyTriager** — "Sept 12 instead of Oct 1" | **open** |
| **ReadTheRoom** — "Work Happy Hour" type, offsite description | **open** |

---

## T9 — Shared-code change breaks tools

**What goes wrong.** A change in `backend/lib/` breaks tools whose own files didn't change, so their saved test cases never run.

**Shared fix: to build.** A smoke test that calls every endpoint once (JSON, streaming, upload) whenever `backend/lib/` or `server.js` changes, and fails the push on any error.

| Instance | Status |
|---|---|
| Surge wrapper broke all streaming (Small Change, Which Life?) for 3 days | fixed (6d4030c5) |

---

## Order of work

1. **T9 smoke test.** Cheapest, and prevents outages.
2. **T3** generic contradiction term in the shared guard, plus **T7** require term. Every v2 tool gains both at once.
3. **T4** for the 43 frozen tools: wire in the supplied-facts check (the shared fix), rather than converting each to v2 by hand.
4. **T1 sweep:** grounding for PaperworkPath, TripRecon, MicroAdventureMapper first (place/law facts).
5. **T2 sweep:** number check or code math for MoneyDiplomat, LaundroMat, SmallChange, BatchFlow, ToastWriter.
6. **T6** marker stripping in the reply filter; **T8** example lint.
