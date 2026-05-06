<!-- v2.0 · 2026-05-04 · post-rename rewrite (batch 14 close-out) -->
# DeftBrain Cross-Reference Map
### Internal Marketing: Which Tools Should Link to Which

> **Principle**: Every cross-ref should answer "what would a user naturally want to do next?" Links should use `<a href="/ToolId" className={linkStyle}>Tool Name</a>`.

---

## HOW TO READ THIS MAP

Each entry shows:
- **→ Pre-result**: Mention BEFORE the user submits (helps set up the tool)
- **← Post-result**: Mention AFTER results load (natural next step)
- **⚡ Conditional**: Only show when a specific result condition is met

Tools are grouped by natural relationship clusters, not categories.

---

## CLUSTER 1: NAMING
> NameAudit ↔ NameStorm — The tightest pair on the site

| Tool | Cross-Ref | Placement | Copy |
|------|-----------|-----------|------|
| **NameAudit** | → NameStorm | Pre-result | "Need name ideas first? Try [NameStorm](/NameStorm) to generate names, then bring your favorites here." |
| **NameAudit** | ← NameStorm | Post-result | "Want alternatives? Use [NameStorm](/NameStorm) to generate names, then bring your favorites back here." |
| **NameAudit** | ⚡ NameStorm | Conditional | If grade is WEAK/RECONSIDER: "This name scored low — try [NameStorm](/NameStorm) to generate stronger alternatives." |
| **NameStorm** | → NameAudit | Pre-result | "Already have a name? Run it through [NameAudit](/NameAudit) for a 12-dimension deep analysis." |
| **NameStorm** | ← NameAudit | Post-result | "Found a favorite? Stress-test it with [NameAudit](/NameAudit) before you commit." |

---

## CLUSTER 2: FOOD & KITCHEN
> MiseEnPlace ↔ RecipeChaosSolver — Cooking flow + crisis recovery

*Note: FridgeAlchemy and LeftoverRoulette were folded into MiseEnPlace; refs to those names should now go to `/MiseEnPlace`.*

| Tool | Cross-Ref | Placement | Copy |
|------|-----------|-----------|------|
| **MiseEnPlace** | ← RecipeChaosSolver | Conditional | If recipe step goes sideways: "Hit a wall? [Recipe Chaos Solver](/RecipeChaosSolver) rescues kitchen disasters in seconds." |
| **RecipeChaosSolver** | ← MiseEnPlace | Post-result | "Ready to actually cook this? [Mise en Place](/MiseEnPlace) walks you through prep and timing." |

---

## CLUSTER 3: MONEY & SPENDING
> SubSweep ↔ BillRescue ↔ BuyWise ↔ FakeReviewDetective ↔ MoneyDiplomat

*Note: BillGuiltEraser was renamed to BillRescue. MoneyShameRemover and RamenRatio no longer exist.*

| Tool | Cross-Ref | Placement | Copy |
|------|-----------|-----------|------|
| **SubSweep** | ← BillRescue | Post-result | "Found subscriptions to cancel but worried about ones you actually need? [Bill Rescue](/BillRescue) helps you negotiate the rest." |
| **BillRescue** | → SubSweep | Pre-result | "Not sure which bills to tackle? Run [SubSweep](/SubSweep) first to find hidden subscriptions." |
| **BuyWise** | ← FakeReviewDetective | Post-result | "Before you buy, check the reviews with [Fake Review Detective](/FakeReviewDetective)." |
| **FakeReviewDetective** | ← BuyWise | Post-result | "Reviews check out? Run the purchase through [BuyWise](/BuyWise) to see if it's worth your money." |
| **MoneyDiplomat** | ← BillRescue | Conditional | If user mentions struggling to pay: "Need to negotiate the bill itself? [Bill Rescue](/BillRescue) helps draft the conversation." |

---

## CLUSTER 4: CONFRONTATION & COMMUNICATION
> DifficultTalkCoach ↔ ConflictCoach ↔ ApologyCalibrator ↔ VelvetHammer

*Note: ConfrontationCoach + ConflictTextCoach consolidated into ConflictCoach. DifficultTalkRehearser renamed to DifficultTalkCoach.*

| Tool | Cross-Ref | Placement | Copy |
|------|-----------|-----------|------|
| **DifficultTalkCoach** | ← VelvetHammer | Post-result | "Need to say it firmly but diplomatically? [Velvet Hammer](/VelvetHammer) crafts the words." |
| **DifficultTalkCoach** | ← ApologyCalibrator | Conditional | If conversation calls for an apology: "[Apology Calibrator](/ApologyCalibrator) helps you get the tone right." |
| **ConflictCoach** | → DifficultTalkCoach | Pre-result | "Need to practice what you'll say? [Difficult Talk Coach](/DifficultTalkCoach) lets you run through it first." |
| **ConflictCoach** | ← VelvetHammer | Post-result | "Want it in writing instead? [Velvet Hammer](/VelvetHammer) writes tough messages with tact." |
| **ConflictCoach** | ⚡ ApologyCalibrator | Conditional | If conflict analysis suggests user is in the wrong: "Might be time for [Apology Calibrator](/ApologyCalibrator)." |
| **ApologyCalibrator** | ← DifficultTalkCoach | Post-result | "Need to rehearse delivering this apology? Try [Difficult Talk Coach](/DifficultTalkCoach)." |
| **VelvetHammer** | → ConflictCoach | Pre-result | "Dealing with an existing text conflict? [Conflict Coach](/ConflictCoach) analyzes the thread." |

---

## CLUSTER 5: WORK & PRODUCTIVITY
> TaskAvalancheBreaker ↔ BrainDumpBuddy ↔ CrisisPrioritizer ↔ EmailUrgencyTriager ↔ BragSheetBuilder ↔ LeverageLogic

*Note: BrainDumpStructurer renamed to BrainDumpBuddy.*

| Tool | Cross-Ref | Placement | Copy |
|------|-----------|-----------|------|
| **TaskAvalancheBreaker** | → BrainDumpBuddy | Pre-result | "Tasks still jumbled in your head? Dump them into [Brain Dump Buddy](/BrainDumpBuddy) first, then bring the list here." |
| **TaskAvalancheBreaker** | ⚡ CrisisPrioritizer | Conditional | If overwhelm level is critical: "Feeling like everything is on fire? [Crisis Prioritizer](/CrisisPrioritizer) helps when it's truly urgent." |
| **BrainDumpBuddy** | ← TaskAvalancheBreaker | Post-result | "Now that it's organized, feeling overwhelmed? [Task Avalanche Breaker](/TaskAvalancheBreaker) breaks it into tiny steps." |
| **CrisisPrioritizer** | ← TaskAvalancheBreaker | Post-result | "Crisis handled? Move the remaining tasks to [Task Avalanche Breaker](/TaskAvalancheBreaker) to keep momentum." |
| **EmailUrgencyTriager** | ← VelvetHammer | Post-result | "Need to write a tough reply? [Velvet Hammer](/VelvetHammer) helps with diplomatic responses." |
| **BragSheetBuilder** | → LeverageLogic | Post-result | "Ready to use these wins? [Leverage Logic](/LeverageLogic) helps you negotiate with evidence." |
| **LeverageLogic** | → BragSheetBuilder | Pre-result | "Need ammunition first? Build your case with [Brag Sheet Builder](/BragSheetBuilder)." |
| **MeetingHijackPreventer** | ← MeetingBSDetector | Post-result | "Want to decode what was actually said? Run meeting notes through [Meeting BS Detector](/MeetingBSDetector)." |
| **MeetingBSDetector** | ← MeetingHijackPreventer | Post-result | "Meeting getting derailed? Next time, prep with [Meeting Hijack Preventer](/MeetingHijackPreventer)." |

---

## CLUSTER 6: ENERGY & WELLNESS
> PEP ↔ SpiralStopper ↔ BrainStateDeejay ↔ SocialEnergyAudit

*Note: PEP absorbed DopamineMenuBuilder, BurnoutBreadcrumbTracker, SpoonBudgeter, and RoutineRuptureManager. FreezeStateUnblocker and CriticismBuffer no longer exist. SocialBatteryForecaster renamed to SocialEnergyAudit.*

| Tool | Cross-Ref | Placement | Copy |
|------|-----------|-----------|------|
| **PEP** | ← BrainStateDeejay | Post-result | "Want music to match your energy state? [Brain State Deejay](/BrainStateDeejay) builds a soundtrack for what you're about to do." |
| **PEP** | ⚡ SpiralStopper | Conditional | If energy plan reveals high overwhelm: "Thoughts spiraling? [Spiral Stopper](/SpiralStopper) breaks the loop first." |
| **SpiralStopper** | ← PEP | Post-result | "Spiral stopped? [PEP](/PEP) helps you map your energy and plan the rest of the day." |
| **BrainStateDeejay** | ← PEP | Post-result | "Need to plan the actual block? [PEP](/PEP) maps your energy across the day." |
| **SocialEnergyAudit** | ← PEP | Post-result | "Factor this into your full energy plan with [PEP](/PEP)." |
| **SocialEnergyAudit** | → AwkwardSilenceFiller | Pre-result | "Heading into a specific event? [Awkward Silence Filler](/AwkwardSilenceFiller) preps the conversation moves." |

---

## CLUSTER 7: FOCUS & CONCENTRATION
> FocusPocus ↔ FocusSoundArchitect ↔ WaitingModeLiberator ↔ VirtualBodyDouble

*Note: TaskSwitchingMinimizer no longer exists. Cluster heading deliberately neutral — no maladies references per the codebase rule.*

| Tool | Cross-Ref | Placement | Copy |
|------|-----------|-----------|------|
| **FocusPocus** | ← FocusSoundArchitect | Post-result | "Need focus sounds? [Focus Sound Architect](/FocusSoundArchitect) builds a custom soundscape." |
| **FocusPocus** | ← VirtualBodyDouble | Post-result | "Need accountability for the session? [Virtual Body Double](/VirtualBodyDouble) sits with you." |
| **FocusSoundArchitect** | ← FocusPocus | Pre-result | "Need a focus strategy first? [Focus Pocus](/FocusPocus) builds your session plan." |
| **WaitingModeLiberator** | ← TaskAvalancheBreaker | Post-result | "Got things to do while waiting? [Task Avalanche Breaker](/TaskAvalancheBreaker) finds micro-tasks that fit." |
| **VirtualBodyDouble** | ← BrainStateDeejay | Post-result | "Lining up the next session? [Brain State Deejay](/BrainStateDeejay) picks the right soundtrack." |
| **VirtualBodyDouble** | ← FocusSoundArchitect | Post-result | "Need background sound too? [Focus Sound Architect](/FocusSoundArchitect) builds your soundscape." |

---

## CLUSTER 8: HOUSING & ROOMMATES
> LeaseTrapDetector ↔ RentersDepositSaver ↔ RoommateCourt ↔ ComplaintEscalationWriter

| Tool | Cross-Ref | Placement | Copy |
|------|-----------|-----------|------|
| **LeaseTrapDetector** | ← RentersDepositSaver | Post-result | "Moving in? [Renter's Deposit Saver](/RentersDepositSaver) protects your deposit from day one." |
| **RentersDepositSaver** | → LeaseTrapDetector | Pre-result | "Haven't signed yet? Run your lease through [Lease Trap Detector](/LeaseTrapDetector) first." |
| **RoommateCourt** | ← VelvetHammer | Post-result | "Need to deliver the verdict diplomatically? [Velvet Hammer](/VelvetHammer) writes the message." |
| **ComplaintEscalationWriter** | → LeaseTrapDetector | Pre-result | "Need ammo for your complaint? [Lease Trap Detector](/LeaseTrapDetector) can identify specific violations." |

---

## CLUSTER 9: SOCIAL & DATING
> DateNight ↔ AwkwardSilenceFiller ↔ CaptionMagic ↔ SixDegreesOfMe ↔ PronounceItRight

*Note: SayItRight renamed to PronounceItRight.*

| Tool | Cross-Ref | Placement | Copy |
|------|-----------|-----------|------|
| **DateNight** | ← AwkwardSilenceFiller | Post-result | "Nervous about conversation? [Awkward Silence Filler](/AwkwardSilenceFiller) has you covered." |
| **AwkwardSilenceFiller** | ← DateNight | Pre-result | "Planning a date? [DateNight](/DateNight) finds the perfect spot first." |
| **AwkwardSilenceFiller** | ← PronounceItRight | Post-result | "About to say a name you're unsure of? [Pronounce It Right](/PronounceItRight) handles tricky names." |
| **CaptionMagic** | ← SixDegreesOfMe | Post-result | "Want to explore more connections? [Six Degrees of Me](/SixDegreesOfMe) maps how you connect to anything." |

---

## CLUSTER 10: HEALTH & BODY
> LazyWorkoutAdapter ↔ DoctorVisitTranslator ↔ CrashPredictor ↔ PEP

*Note: SleepDebt, SpoonBudgeter, and SymptomSolver no longer exist. SpoonBudgeter folded into PEP.*

| Tool | Cross-Ref | Placement | Copy |
|------|-----------|-----------|------|
| **LazyWorkoutAdapter** | ← PEP | Pre-result | "Low on energy? [PEP](/PEP) helps you decide if a workout fits today." |
| **LazyWorkoutAdapter** | ← CrashPredictor | Post-result | "Wondering if today's workout will tank you tomorrow? [Crash Predictor](/CrashPredictor) forecasts your energy." |
| **CrashPredictor** | ← PEP | Post-result | "Build the rest of the day around this with [PEP](/PEP)." |
| **DoctorVisitTranslator** | ← PEP | Post-result | "Recovering from a heavy appointment? [PEP](/PEP) helps you plan what's left of the day." |

---

## UNIVERSAL CROSS-REFS
> These tools have broad applicability and can be referenced from many places

| Tool | When to Reference | Suggested Copy |
|------|-------------------|----------------|
| **DecisionCoach** | Any tool where user faces a choice in results | "Stuck between options? [Decision Coach](/DecisionCoach) helps you think it through." |
| **SpiralStopper** | Any tool dealing with stress/anxiety output | "Thoughts racing? [Spiral Stopper](/SpiralStopper) can help." |
| **BrainDumpBuddy** | Any tool where input is messy/unstructured | "Thoughts jumbled? Organize them with [Brain Dump Buddy](/BrainDumpBuddy) first." |
| **PEP** | Any tool where user mentions feeling drained, low energy, or burnt out | "Energy running low? [PEP](/PEP) helps you plan around it." |
| **WhereDidTheTimeGo** | Any tool dealing with calendars, schedules, time tracking | "Lost track of where time went? [Where Did The Time Go](/WhereDidTheTimeGo) maps it out." |

---

## CURRENT STATE: CROSS-REFS ARE NOW IMPLEMENTED ACROSS THE CATALOG

As of the batch 14 close-out (May 2026), the audit checklist enforces both pre-result and post-result cross-refs (rule **S5.5**) on every tool. The compliance audit campaign has added cross-refs to ~28 tools across batches 7-14. The bidirectional NameAudit ↔ NameStorm pair is live, the BragSheetBuilder ↔ LeverageLogic pair is live, and most clusters above have at least partial coverage.

**Remaining gaps** are the tools that haven't yet been through the audit (mostly in the early-letter alphabet — see audit-backlog.md). Adding cross-refs is now part of the standard audit pass; this map exists to ensure they're consistent, not to track which tools have any at all.

---

## IMPLEMENTATION PRIORITY

### Phase 1 (LIVE): Audit-driven cross-ref insertion
As each tool goes through the audit checklist, add its cross-refs from this map. Happens naturally as part of S5.5 enforcement. Closed for batches 7–14; ongoing.

### Phase 2 (NEXT): Backfill universal cross-refs
For tools already audit-clean but predating heavy universal-ref usage:
1. Add `/PEP` references to any tool whose results mention energy/burnout/overwhelm
2. Add `/BrainDumpBuddy` references to any tool whose input is messy/unstructured
3. Add `/WhereDidTheTimeGo` references to any tool dealing with calendars/schedules
4. Add `/DecisionCoach` references to any tool whose results present multiple options

### Phase 3 (FUTURE): Conditional cross-refs
The ⚡ Conditional rows above are aspirational — most aren't implemented yet. These require result-aware logic (showing the cross-ref only when a specific result condition is met). Worth adding once base cross-refs are stable across the catalog.

---

## KNOWN ORPHANS (do not cross-ref to these)

These names appear in old code, marketing copy, or past plans. They no longer exist in `tools.js`:

- **HabitChain**, **SleepDebt**, **BookScout** — never shipped
- **MoneyShameRemover**, **RamenRatio**, **ProfVibe**, **FreezeStateUnblocker**, **CriticismBuffer**, **GradeGraveyard**, **TheCurve**, **TaskSwitchingMinimizer**, **SymptomSolver** — removed from catalog (no replacement)

These names are renamed/folded — use the new target instead:

| Old | New |
|-----|-----|
| MoneyMoves | MoneyDiplomat |
| DopamineMenuBuilder | PEP |
| BurnoutBreadcrumbTracker | PEP |
| SpoonBudgeter | PEP |
| RoutineRuptureManager | PEP |
| BrainDumpStructurer | BrainDumpBuddy |
| DifficultTalkRehearser | DifficultTalkCoach |
| ConfrontationCoach | ConflictCoach |
| ConflictTextCoach | ConflictCoach |
| TimeVanishingExplainer | WhereDidTheTimeGo |
| WhereDidItGo | WhereDidTheTimeGo |
| SayItRight | PronounceItRight |
| FridgeAlchemy | MiseEnPlace |
| LeftoverRoulette | MiseEnPlace |
| FoodSwap | MiseEnPlace |
| WhatIfMachine | WhatIf |
| PlotHole | PlotTwist |
| RoommateCourtroom | RoommateCourt |
| PaperDigest | ResearchDecoder |
| SocialBatteryForecaster | SocialEnergyAudit |
| BillGuiltEraser | BillRescue |

`server.js` redirects exist for most of these. RENAMES.md is the source of truth for ones with localStorage migration notes.

---

*Last updated: May 4, 2026 — Update as new tools are added, renamed, or clusters evolve. When you rename a tool, update RENAMES.md and re-run `bash audit/crossref_sweep.sh` before committing.*
