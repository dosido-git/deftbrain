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
| T1 | Real-world facts from memory | `lib/worldFacts.js` (topic search + claim-by-claim search + Sonnet contradiction check) | 8 tools on `worldFacts`, 18 on older grounding | 0 |
| T2 | Arithmetic, counts, totals | Compute in code; else the number check | 18 tools; 2026-10-09 sweep done | 0 |
| T3 | Self-contradiction between fields | Consistency check (`outputGuard`, Sonnet) | **Built 2026-10-09**; 96 routes | 0 |
| T4 | Details the visitor never said | Output guard, or `checkConsistency` check 10 (same call) | ~99 tools; 2026-10-09 | 0 |
| T5 | Overreach (absolutes, legal/medical conclusions, false framing) | `lib/certaintyCheck.js` `calibrateClaims` (targets → starting points with basis; conditional rules name the condition); facts-mode number check, guard terms | **Shared check built 2026-10-25**; Bill Rescue | sweep open |
| T6 | Locale and wording leaks | Reply filter (`voiceFix`: markers, "visitor", US spelling) | All tools | 1 minor |
| T7 | A visitor's choice ignored | Same check, reads the form choices itself | **Built 2026-10-09**; 96 routes | 0 |
| T8 | Built-in examples stale or inconsistent | `scripts/example-dates-audit.js` (Gate 13) + `exampleDate`/`dayMonthFromToday` | Built 2026-10-09 | 0 |
| T9 | Shared-code change breaks tools | `scripts/smoke-tools.js` (pre-push Gate 12) | **Built 2026-10-09**; 295 of 357 endpoints exercised | 0 |
| T10 | Too-vague input answered in words, shown as a generic error | `lib/claude.js` stops at a words-not-JSON reply; `lib/surge.js` middleware answers 422 `unclear_input`; `useClaudeAPI` shows `err_unclear_input` | **Built 2026-10-15**; every route | 0 |
| T11 | Parts written apart drift (second-guess, overlap, thin coverage) | `lib/progressive.js` `planFirst` (one pass chooses the list or the claim, the rest build on it) + `planNote` (treat it as final); repeats that survive: `lib/repeatCheck.js` `trimRepeats` (after display) | **Built 2026-10-16**; repeat check 2026-10-25 on Bill Rescue | sweep open |
| T12 | Decorative analogy (the effect in costume, no cause) | `lib/analogyCheck.js` `reviewAnalogies` (Sonnet: mechanism / familiar / maps; rewrites failures) | **Built 2026-10-23**; Analogy Engine | 1 (Missing Link) |
| T13 | Sourced claims drift from their sources (measure, population, period, design; rules the source never tested; summary stronger than the evidence; dead links, wrong dates, mislabelled or interested publishers) | `lib/evidenceFit.js` `checkEvidenceFit` (Sonnet, after display); `lib/publicUrl.js` `checkSourceLink` (link + page date, free); research findings carry measure/population/period/excerpt | **Built 2026-10-27**; Signal vs. Noise | sweep open |

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
| PaperworkPath — Texas safety inspection, online voter registration | **fixed with shared fix** (`worldFacts`; live run now says emissions inspection only. voter line fixed by the claim-by-claim search) |
| TripRecon — Denver airport "train from the garage" | **fixed with shared fix** (live run: train runs terminal → A → B → C) |
| MicroAdventureMapper — Boston Common "at the north end" of the Freedom Trail | **wired to shared fix** (not reproduced on the live run) |
| **BuyWise** — "sold largely direct"; no price lookup | **open** |
| PlotHoleFinder — story timing errors; plot summary lacks timing | **fixed with shared fix** (claim-by-claim search + YES step-down; live Dark Knight Rises run clean). Indexed 2026-10-09 (owner) |
| PaperworkPath — fact check fixed an item's explanation (emissions-only inspection) but its title and a step still said safety inspection | **fixed with shared fix** (a world-facts repair also shows the same item's other fields and lines repeating the claim, and fixes them where they now contradict; the consistency check re-runs on the merged answer) |

**Claim-by-claim search (2026-10-09).** A topic search only catches claims it happens to cover: Paperwork Path kept saying Texas voters can register online because the "moving to Austin" research never covered voting. `checkWorldFacts` now picks the answer's 3 most consequential claims the topic research does not settle and searches each on its own (cached per question). Live: Paperwork Path now says the online tool only produces a form to print, sign and mail; Plot Hole Finder runs through the same check with its plot summary as the topic research, and a "YES — REAL HOLE" whose premise gets corrected is stepped down to MAYBE in code. Cost: ~$0.05–0.10 and up to ~45 s more on a first-time claim.

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
| NameStorm Quick — "Six syllables" flag on Penumbra (3); the flag never names the name, so the check skipped it | fixed (check now reads the card's own name; removes only claims 2+ off its estimate) |
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
| EmailUrgencyTriager — "today 17:00" read against the reader's clock, not the day the email was sent (a Thursday deadline pasted Saturday came out as due now) | **fixed in code** (`lib/relativeDates.js`: the model copies the sent date and sorts the deadline phrase; code resolves the calendar date and overdue/today/upcoming; every tool reading relative dates in pasted messages should use it) |

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
| MissingLink — an analogy that changes direction partway (new calls on top, later waiting for the one below); then a repair that made a correct picture wrong, primed by the check's own recursion example (2026-10-27) | **fixed with shared fix** (consistency check 8 covers a field contradicting itself, with a neutral example and "work the picture through before flagging") |

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
| Awkward Silence Filler — "talking to: boss, panicking", no setting chosen; the answer assumed an elevator (2026-10-23). Cause: the template's two examples were elevator scenes | **fixed with shared fix** (`checkConsistency` wired as the after-display check) + elevator examples removed + an explicit "no setting given" line |
| Bill Rescue — "Your landlord has not filed anything" (input never said); hardship letter: "I am actively applying for assistance" (only recommended) (owner, 2026-10-26) | **fixed with shared fix** (check 10 now covers a status the input does not establish and claims in the visitor's own voice inside a letter or script) + prompt: where_you_stand only as far as the input shows; letter details they must supply in [brackets] |
| MissingLink — a gap guessed from a topic name alone presented as observed ("You can follow the steps", "Nobody explicitly showed you"), "Medium confidence" (owner's review, 2026-10-27) | **fixed with shared fix** (`INVENTED_CHECK` covers what they were taught or can do and diagnoses from a topic alone; Missing Link frames the gap by how much was described — `basis` computed in code — and leads with a check that tests it) |
| CultureBriefing — "learn some Yoruba" and "you will be able to communicate" from the destination alone (owner's second review, 2026-10-27) | **fixed** (standard + guard term `hosts_language_faith_or_customs_presumed_from_place`; the briefing now opens with questions for the person who invited them — languages, greetings, events, dress, gifts, photos, arrival — written without research, so they also show in seconds) |
| PlainTalk — a four-sentence excerpt judged as the whole paper ("the authors do not reconcile…", missing error bounds) (owner's review, 2026-10-27) | **fixed with shared fix** (`INVENTED_CHECK`: what a supplied document or its authors include, beyond the text given, said as "this excerpt does not…") |

---

## T5 — Overreach

**What goes wrong.**
- Absolute claims on facts with exceptions.
- Legal or medical conclusions the tool can't support.
- A story presented as if it were a finding.
- Directive certainty the charter rules out.

**Shared fix.**
- **`lib/certaintyCheck.js` `calibrateClaims(draft)` (2026-10-25).** One Sonnet pass after display lists every legal/medical/financial rule, target amount and prediction with the condition it depends on, then rewrites only the ones that leave the condition out: a target becomes a starting point with its basis, a conditional rule names its condition, an unsupportable claim becomes "may"/"check". Skips letters (text with line breaks); a rewrite must stay within 0.7×–1.6× the original length. ~$0.05 per answer.
- The facts-mode number check flags absolutes and wrong mechanisms.
- Guard terms cover the rest per tool.

| Instance | Status |
|---|---|
| BillRescue — "30–60% discount", "kidney stone visits qualify" | fixed |
| BillRescue — precise settlement targets ("Offer $2,920. Accept up to $4,380.") and categorical legal claims ("they must stop collection activity", "you have no obligation to pay") read as authoritative (owner's review, 2026-10-25) | **fixed with shared fix** (`calibrateClaims` after the repeat check; live: the FDCPA pause now names the 30-day written-dispute condition, targets framed as starting points; plus an on-page caveat under the plan figures) |
| **Sweep (open):** tools that state legal, medical or money rules — Lease Trap Detector, Contract Decoder, Renter's Deposit Saver, Ticket Tackler, Money Diplomat, Leverage Logic, Quote Check, Not So Fast!, Complaint Escalation Writer, Procedure Probe, Doctor Visit Translator, Paperwork Path | open |
| DocumentDetective — "removes any argument" | fixed |
| NameAudit — "likely trademark infringement" | fixed (rule in its update step) |
| AnalogyEngine — "nothing capable of causing disease" | **fixed with shared fix** |
| BreakMyPlan — opens with an imagined failure story | **fixed** (owner decision 2026-10-09: story no longer shown; results open with the assumption to test first) |
| DecisionCoach — page promise "One answer. Not options." vs charter | **fixed** (owner decision 2026-10-09: "A clear recommendation, and what would change it", 13 languages) |
| TicketTackler — the reverse: under-reach. The visitor's own account (sign hours, park time) read as "unknown", so the verdict hedged to NOT_ENOUGH_INFORMATION_YET (2026-10-16 blind comparison) | **fixed** (rule check gains `met_per_account` / `yes_per_account`: the account is evidence, stated conditionally, never a reason to withhold the verdict) |
| MissingLink — technical rules stated as universal ("a fresh, independent copy", "if the argument is not shrinking the base case is never reached") | **fixed with shared fix** (`calibrateClaims` covers technical and scientific rules; wired into Missing Link) |
| PlainTalk — motives stated as fact ("What They Buried", "designed to make it urgent", "we find" called a hedge) and "internal contradictions" that can both be true | **fixed with shared fix** (`calibrateClaims` rule 3: intent → possible effect on a reader; a contradiction that is not one → open question; `skip` option keeps it off faithful restatements) |
| CultureBriefing — courtesies from general etiquette guides made obligations ("accept at least a small portion", "right hand only", "bring a gift to any home", "never use black or white wrapping", Ramadan city-wide); photographing government sites and motorcycle taxis labelled "Common courtesy" (owner's second review, 2026-10-27) | **fixed in code** (`customsResearch.capStrength`: only an official page can make a rule, a commercial page cannot make something offensive — at most "varies"; law and safety findings labelled Law / Safety, never courtesy; research takes safety and law from national travel advisories) + standard and guard terms (`courtesy_stated_as_obligation`, `safety_or_law_framed_as_courtesy`) |
| PlainTalk — model-guessed grade levels and an undefined "high confidence" shown as measurements | **fixed** (Flesch-Kincaid in code, `lib/readingLevel.js`, English only, labelled an estimate; confidence removed) |

---

## T6 — Locale and wording leaks

**What goes wrong.**
- British spelling for US visitors.
- Internal words reaching the page: "the visitor", "INFERRED:", "the confirmed notes", a bare "null".
- Typos.

**Shared fix.** The reply filter on every English `/api` reply (`lib/voiceFix.js` + `lib/usSpelling.js`). Add new leak patterns there, not in prompts.

| Instance | Status |
|---|---|
| "the visitor" in replies | **fixed with shared fix** |
| Giftology / BreakMyPlan / FutureProof British spellings | **fixed with shared fix** |
| DateNight repair wrote "the confirmed notes describe…" | fixed per tool (repair wording) |
| FutureProof — "INFERRED:" marker in prose | **fixed with shared fix** (reply filter strips prompt markers in every language; a bare enum value is kept) |
| NameStorm Quick — "⚠️ null" under every name (nullable field filled with the word null) | **fixed with shared fix** (reply filter turns a null/undefined-only string into a real null in every language; drops it from arrays) |
| Bill Rescue — "Propose this: Use todays_job and payment_plan.strategy": a repair pointed at sections by their JSON keys (owner, 2026-10-26) | **fixed with shared fix** (`outputGuard` `namesAField`: guard, repeat and certainty repairs that name a key are refused; `planNote` tells every later pass to refer to sections by what they say, never by key or step number) |
| UpsellShield — "out-of-door price" | open, minor |
| MissingLink — "described in likely_gap": an answer's own field name in its prose; progressive answers also skipped the reply filter on 27 tools | **fixed with shared fix** (`voiceFix.stripFieldNames`, every reply and every streamed frame) |

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
| Bill Rescue — the printed "Before You Go" caveat (fixed per tool, `src/data/tools.js`) read "If a collector has the bill…" at the end of a landlord plan (owner, 2026-10-26) | **fixed** (caveat now holds for every bill; rule written beside the field: it prints on every answer, so it must hold for every answer — the other nine checked, all hold) |

---

## T9 — Shared-code change breaks tools

**What goes wrong.** A change in `backend/lib/` breaks tools whose own files didn't change, so their saved test cases never run.

**Shared fix: built 2026-10-09.** `scripts/smoke-tools.js` (`npm run smoke:tools`, pre-push Gate 12 when `backend/lib/`, `server.js` or `routes/index.js` changed). It starts the real backend with the real SDK pointed at a stand-in API server, so it costs nothing and sends nothing out. Each endpoint gets a golden input (its own, a sibling's, or a listed one) and a canned answer, and the outcome is compared with `scripts/smoke-tools-baseline.json`. Proven: putting the Oct 5 async-wrapper bug back fails the run with the same error the site had.

Limits: it checks that tools run, not that answers are right. 62 endpoints never reach the model (follow-up steps needing an earlier result, uploads, cold research 503s); each one added to `INPUTS` in the script raises coverage. After a deliberate route change that alters an endpoint's outcome, rerun with `--update`.

| Instance | Status |
|---|---|
| Surge wrapper broke all streaming (Small Change, Which Life?) for 3 days | fixed (6d4030c5) |

---

## T10 — Too-vague input answered in words

**What goes wrong.** On an input too vague to work with ("my", "?"), the model replies in words ("I need more detail about…") instead of the JSON asked for. The shared retry tried the same input three times, so the visitor waited ~13s for "Something went wrong" (Name Storm quick mode, 2026-10-15).

**Shared fix: built 2026-10-15.** `callClaudeWithRetry` stops at the first reply with no JSON in it and marks the request; the `/api` middleware in `lib/surge.js` turns the route's 500 into 422 `{ code: 'unclear_input' }`, and `useClaudeAPI` shows `err_unclear_input` in the visitor's language. A sub-call a route survives (a check, a pre-pass) changes nothing. Reproduced and verified: "my" → 422 in 3.4s.

| Instance | Status |
|---|---|
| Name Storm quick mode, vague input | **fixed with shared fix** |

---

## T11 — Parts written apart drift

**What goes wrong.** A progressive answer is written by passes that run apart (lib/progressive.js). A pass that cannot see the others may question or redo their choices, repeat their points, or cover less ground than one pass weighing the whole answer would. Blind comparison, 2026-10-16: Ghost Writer's tips pass, handed the finished letters, questioned the pronouns they used; Break My Plan's split prevention half came back thinner and missed a distinct risk the single call had found.

**Shared fix: built 2026-10-16.** `planFirst` — one small pass chooses what the others must agree on (the list of failure modes, the verdict, the four gift ideas) and is shown first; the other groups start the moment it lands and are handed it. `planNote` quotes it as final: build on it, never contradict, replace or question its choices. A pass that writes after others (an `after` part) quotes them through `planNote` too.

| Instance | Status |
|---|---|
| Ghost Writer — tips pass questioned the letters' pronouns | **fixed with shared fix** (`planNote` on the extras pass) |
| Break My Plan — split prevention half thinner, missed a risk | **fixed with shared fix** (failure modes planned first, details filled by passes handed the list) |
| Scam Radar, Money Diplomat (lend), Complaint Escalation — the same reason restated across sections written by separate passes (same-day blind comparison, 2026-10-17) | **shared fix built**: `onlyKeys` names the sections the other passes carry and asks for each point once (`noOverlap`); Complaint's strategy passes use it directly. Letters stay self-contained — each goes to a different reader |
| Bill Rescue — debt in collections: "send a validation letter" in 7 sections and the letter itself written three times, worded differently (owner, 2026-10-25). `noOverlap` was already in every pass, so the prompt rule alone did not hold | **fixed with shared fix**: `lib/repeatCheck.js` `trimRepeats(draft, {order})` — one Sonnet pass after display reads prose fields in page order, shortens each later repeat to what it adds plus a pointer back (only ever shorter, never empty). Live: 8 fields trimmed, letter kept once; ~$0.05, ~30s in the check phase |
| **Sweep (open):** every multi-pass progressive tool is exposed — wire `trimRepeats` with its page order and check one live case each | open |

---

## T12 — Decorative analogy

**What goes wrong.** An analogy can be accurate and well written and still teach nothing: it re-describes the effect in a new setting and carries none of the cause. Live, 2026-10-23, Analogy Engine, inflation for a crossword fan: "the squares get a little smaller each year … inflation is just the name for those squares getting smaller." Nobody has seen crossword squares shrink, nothing in the scene says why they shrink, and the closing line restates the concept instead of mapping it.

**Shared fix: built 2026-10-23.** `lib/analogyCheck.js` `reviewAnalogies(items, {concept, audience})` — one Sonnet pass tests each analogy: MECHANISM (the scene contains the same causal story), FAMILIAR (a scene the audience has really seen, as it really happens), MAPS (each element stands for a real part of the concept, named at the end). Failures are rewritten in the same type and domain; passes are left alone. Runs with the other checks, after the answer is on screen; fail-open.

| Instance | Status |
|---|---|
| Analogy Engine — main answer and "Show more" | **fixed with shared fix** (runs before the number and consistency checks, so they read the replacement) |
| Missing Link — `visual_or_analogy` in `/the-gap/dig` and the trace refresher | **open** — exposed; that endpoint answers in one piece, so the check would add its time before the answer shows |

---

## T13 — Sourced claims drift from their sources

**What goes wrong.** Every figure is in the research, so the figure check passes — but the answer says something the source does not. Owner's review of Signal vs. Noise, 2026-10-27 (job-switching, passion, an MBA):
- a pay-growth gap read as a pay level ("job-changers have outearned stayers"), and switching as its cause;
- base-pay and gross-pay growth used interchangeably; a January finding labelled August;
- a salary rise among graduates of the FT's top 100 schools read as MBA graduates in general;
- a study of beliefs about interests turned into a competence-first career rule it never tested; "five studies" became "five experiments";
- "often the faster path" in a kernel of truth with no source; "longitudinal studies, not experiments";
- the summary sections firmer than the evidence sections, and the same qualification in five sections;
- sources: a link redirecting to a general page, a page dated April listed as October, a company commentary labelled "official dataset", three ADP pages counted as three lines of evidence, an industry body's figure with no note of its interest.

**Why prompts can't fix it.** Signal vs. Noise's prompt already had rules 13–24 against each of these. The research pass also summarised findings without their scope, so the synthesis could not keep what it was never given.

**Shared fix.**
- `lib/claimResearch.js`: each finding carries `measure`, `population`, `period`, `excerpt`; each source a `publisher_stake`; the page's own date; `official_dataset` defined; specific pages only.
- `lib/publicUrl.js` `checkSourceLink`: drops a source whose link is dead, is a site's home page, or now redirects to a shallower page; takes the date the page shows. Free (plain fetch, SSRF-guarded), once per cached packet.
- Same fetch: a finding's figures must appear on a page it cites (`figures_not_on_page`, `claimResearch.verifySources`); a marked figure is "not in the evidence" for the synthesis and `checkEvidenceFit`. On the stored career example it caught the "10 to 20 percentage points" claim, the moved Payscale link, the ADP home-page source and the GMAC date (April 15, not October 9).
- `lib/evidenceFit.js` `checkEvidenceFit(draft, { evidence, summary })`: lists every figure and conclusion with what its source says (measure, population, period, comparison), repairs the ones that do not fit — narrowed, scope named, or the unsupported clause removed; SUMMARY fields may not be stronger than the evidence. ~$0.05–0.10 per answer.
- Then `trimRepeats` (T11) in page order.
- Display: sources numbered in reading order; "from N organizations" when fewer than the sources; a note on publishers with a stake.

| Instance | Status |
|---|---|
| SignalVsNoise — career advice review (owner, 2026-10-27), all items above | **fixed with shared fix** (fresh live run: growth not level, one measure, consistent dates, "five studies", no untested rule, sources S1–S5 in order; a run on the stored pre-fix research still showed "experiments" and "fixed passion or an undeveloped one" — the stored research refreshes itself on first use) |
| Progressive (streamed) answers skipped the reply filter (`voiceFix`): "the visitor", prompt markers and US spelling were never fixed on 27 tools | **fixed** (`res.locals.fixBody`, applied to every frame in `lib/progressive.js`) |
| **Sweep (open):** tools that state researched figures — BuyWise, Someone Said It Better (quote attribution), Plain Talk, Ticket Tackler, Plot Hole Finder, any `worldFacts` tool whose answer restates a finding | open |
| PlainTalk — simplifications that changed strength, scope or owner ("get smarter", "without warning", "should change", "absent") | **fixed with shared fix** (`checkEvidenceFit` rule 8; Plain Talk checks each translation against the original; originals restored verbatim after checks). Live: most slips caught, not all — "basically absent" survived one run |
| CultureBriefing — a source listed as June 2026 whose page shows 30 April; two articles from one publisher indistinguishable in the source list (owner's second review, 2026-10-27) | **fixed with shared fix** (`publicUrl.checkSourceLink` returns the page's own title; `customsResearch` keeps no date or title the writer supplied — page values only, re-checked once on every stored pack) |
| SomeoneSaidItBetter — Our Town's Act III line placed "at a wedding" and reworded ("Does anyone…"); an Eliot sentence cut mid-way shown as complete; a Seneca line about ending one's life offered for quitting; context taken from the research pass's own note (owner's review, 2026-10-27) | **fixed with shared fix** (`quoteResearch.checkOnPage`: each cited page fetched — wording must be on a readable page or the quote is dropped; mid-sentence cuts marked as excerpts and shown with …; the text around the quote is the only context the matching stage and its check may use; capped at 4s, once per packet). Page shows "Wording checked on this page" / "Attribution found; wording not checked", "View source", situation labels |

---

## Order of work

1. ~~**T9 smoke test.**~~ Done 2026-10-09.
2. ~~**T3 + T7**~~ Done 2026-10-09: 96 routes, 25 short-output tools skipped on purpose.
3. ~~**T4**~~ Done 2026-10-09 (check 10 in `checkConsistency`).
4. ~~**T1**~~ PaperworkPath, TripRecon, MicroAdventureMapper done 2026-10-09 (`lib/worldFacts.js`). Still to sweep: the candidate list above.
5. ~~**T2**~~ Done 2026-10-09.
6. ~~**T6, T8**~~ Done 2026-10-09.
