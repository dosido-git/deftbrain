<!-- v1.0 · 2026-04-20 · ground-zero baseline -->
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
> FridgeAlchemy ↔ RecipeChaosSolver ↔ LeftoverRoulette — Three tools, one fridge

| Tool | Cross-Ref | Placement | Copy |
|------|-----------|-----------|------|
| **FridgeAlchemy** | ← RecipeChaosSolver | Post-result | "Recipe too complex? Simplify it with [Recipe Chaos Solver](/RecipeChaosSolver)." |
| **FridgeAlchemy** | ← LeftoverRoulette | Post-result | "Got leftovers from this meal? [Leftover Roulette](/LeftoverRoulette) will reinvent them." |
| **RecipeChaosSolver** | → FridgeAlchemy | Pre-result | "Don't have a recipe yet? [Fridge Alchemy](/FridgeAlchemy) builds one from what you have." |
| **LeftoverRoulette** | → FridgeAlchemy | Pre-result | "Starting from scratch? [Fridge Alchemy](/FridgeAlchemy) makes meals from your ingredients." |

---

## CLUSTER 3: MONEY & SPENDING
> SubSweep ↔ BillGuiltEraser ↔ MoneyShameRemover ↔ RamenRatio ↔ BuyWise

| Tool | Cross-Ref | Placement | Copy |
|------|-----------|-----------|------|
| **SubSweep** | ← BillGuiltEraser | Post-result | "Found subscriptions to cancel but feeling guilty? [Bill Guilt Eraser](/BillGuiltEraser) helps you let go." |
| **SubSweep** | ← RamenRatio | Post-result | "See what those savings mean for your budget with [Ramen Ratio](/RamenRatio)." |
| **BillGuiltEraser** | → SubSweep | Pre-result | "Not sure which bills to cut? Run [SubSweep](/SubSweep) first to find hidden subscriptions." |
| **BillGuiltEraser** | ← MoneyShameRemover | Post-result | "Still feeling bad about money? [Money Shame Remover](/MoneyShameRemover) goes deeper." |
| **MoneyShameRemover** | ← BillGuiltEraser | Post-result | "Have a specific bill stressing you out? [Bill Guilt Eraser](/BillGuiltEraser) can help with that." |
| **RamenRatio** | ← BuyWise | Post-result | "Considering a purchase? [BuyWise](/BuyWise) breaks down whether it's worth it." |
| **BuyWise** | ← RamenRatio | Post-result | "Want to see this in terms of meals and hours? [Ramen Ratio](/RamenRatio) puts it in perspective." |
| **BuyWise** | ← FakeReviewDetective | Post-result | "Before you buy, check the reviews with [Fake Review Detective](/FakeReviewDetective)." |
| **FakeReviewDetective** | ← BuyWise | Post-result | "Reviews check out? Run the purchase through [BuyWise](/BuyWise) to see if it's worth your money." |

---

## CLUSTER 4: CONFRONTATION & COMMUNICATION
> DifficultTalkRehearser ↔ ConfrontationCoach ↔ ApologyCalibrator ↔ VelvetHammer ↔ ConflictTextCoach

| Tool | Cross-Ref | Placement | Copy |
|------|-----------|-----------|------|
| **DifficultTalkRehearser** | ← VelvetHammer | Post-result | "Need to say it firmly but diplomatically? [Velvet Hammer](/VelvetHammer) crafts the words." |
| **DifficultTalkRehearser** | ← ApologyCalibrator | Post-result | "If the conversation calls for an apology, [Apology Calibrator](/ApologyCalibrator) helps you get the tone right." |
| **ConfrontationCoach** | → DifficultTalkRehearser | Pre-result | "Need to practice what you'll say? [Difficult Talk Rehearser](/DifficultTalkRehearser) lets you run through it first." |
| **ConfrontationCoach** | ← VelvetHammer | Post-result | "Want it in writing instead? [Velvet Hammer](/VelvetHammer) writes tough messages with tact." |
| **ApologyCalibrator** | ← DifficultTalkRehearser | Post-result | "Need to rehearse delivering this apology? Try [Difficult Talk Rehearser](/DifficultTalkRehearser)." |
| **VelvetHammer** | → ConflictTextCoach | Pre-result | "Dealing with an existing text conflict? [Conflict Text Coach](/ConflictTextCoach) analyzes the thread." |
| **ConflictTextCoach** | ← VelvetHammer | Post-result | "Need to write a firm response? [Velvet Hammer](/VelvetHammer) crafts it for you." |
| **ConflictTextCoach** | ← ApologyCalibrator | Conditional | If conflict analysis suggests user is in the wrong: "Might be time for [Apology Calibrator](/ApologyCalibrator)." |

---

## CLUSTER 5: WORK & PRODUCTIVITY
> TaskAvalancheBreaker ↔ BrainDumpStructurer ↔ CrisisPrioritizer ↔ EmailUrgencyTriager ↔ BragSheetBuilder

| Tool | Cross-Ref | Placement | Copy |
|------|-----------|-----------|------|
| **TaskAvalancheBreaker** | → BrainDumpStructurer | Pre-result | "Tasks still jumbled in your head? Dump them into [Brain Dump Structurer](/BrainDumpStructurer) first, then bring the list here." |
| **TaskAvalancheBreaker** | ← CrisisPrioritizer | Conditional | If overwhelm level is critical: "Feeling like everything is on fire? [Crisis Prioritizer](/CrisisPrioritizer) helps when it's truly urgent." |
| **BrainDumpStructurer** | ← TaskAvalancheBreaker | Post-result | "Now that it's organized, feeling overwhelmed? [Task Avalanche Breaker](/TaskAvalancheBreaker) breaks it into tiny steps." |
| **CrisisPrioritizer** | ← TaskAvalancheBreaker | Post-result | "Crisis handled? Move the remaining tasks to [Task Avalanche Breaker](/TaskAvalancheBreaker) to keep momentum." |
| **EmailUrgencyTriager** | ← VelvetHammer | Post-result | "Need to write a tough reply? [Velvet Hammer](/VelvetHammer) helps with diplomatic responses." |
| **BragSheetBuilder** | → LeverageLogic | Post-result | "Ready to use these wins? [Leverage Logic](/LeverageLogic) helps you negotiate with evidence." |
| **LeverageLogic** | → BragSheetBuilder | Pre-result | "Need ammunition first? Build your case with [Brag Sheet Builder](/BragSheetBuilder)." |
| **MeetingHijackPreventer** | ← MeetingBSDetector | Post-result | "Want to decode what was actually said? Run meeting notes through [Meeting BS Detector](/MeetingBSDetector)." |
| **MeetingBSDetector** | ← MeetingHijackPreventer | Post-result | "Meeting getting derailed? Next time, prep with [Meeting Hijack Preventer](/MeetingHijackPreventer)." |

---

## CLUSTER 6: MENTAL HEALTH & ENERGY
> SpiralStopper ↔ FreezeStateUnblocker ↔ CriticismBuffer ↔ BurnoutBreadcrumbTracker ↔ SpoonBudgeter ↔ DopamineMenuBuilder

| Tool | Cross-Ref | Placement | Copy |
|------|-----------|-----------|------|
| **SpiralStopper** | ← FreezeStateUnblocker | Post-result | "Spiral stopped but still frozen? [Freeze State Unblocker](/FreezeStateUnblocker) helps you move again." |
| **FreezeStateUnblocker** | ← SpiralStopper | Pre-result | "Thoughts spiraling first? [Spiral Stopper](/SpiralStopper) breaks the loop so you can think clearly." |
| **FreezeStateUnblocker** | ← DopamineMenuBuilder | Post-result | "Need a gentle activity to get started? Check your [Dopamine Menu](/DopamineMenuBuilder)." |
| **BurnoutBreadcrumbTracker** | ← SpoonBudgeter | Post-result | "Tracking energy? [Spoon Budgeter](/SpoonBudgeter) helps you allocate what you have left." |
| **SpoonBudgeter** | ← BurnoutBreadcrumbTracker | Pre-result | "Noticing burnout patterns? [Burnout Breadcrumb Tracker](/BurnoutBreadcrumbTracker) catches them early." |
| **CriticismBuffer** | ← SpiralStopper | Conditional | If result shows high emotional impact: "Thoughts spiraling from this? [Spiral Stopper](/SpiralStopper) can help." |
| **DopamineMenuBuilder** | ← BrainStateDeejay | Post-result | "Want music to match your energy state? Try [Brain State Deejay](/BrainStateDeejay)." |
| **BrainStateDeejay** | ← DopamineMenuBuilder | Post-result | "Need more than music? Build a full [Dopamine Menu](/DopamineMenuBuilder) of feel-good activities." |
| **SocialBatteryForecaster** | ← SpoonBudgeter | Post-result | "Factor this into your energy plan with [Spoon Budgeter](/SpoonBudgeter)." |

---

## CLUSTER 7: FOCUS & NEURODIVERGENT SUPPORT
> FocusPocus ↔ FocusSoundArchitect ↔ TaskSwitchingMinimizer ↔ WaitingModeLiberator ↔ VirtualBodyDouble

| Tool | Cross-Ref | Placement | Copy |
|------|-----------|-----------|------|
| **FocusPocus** | ← FocusSoundArchitect | Post-result | "Need focus sounds? [Focus Sound Architect](/FocusSoundArchitect) builds a custom soundscape." |
| **FocusSoundArchitect** | ← FocusPocus | Pre-result | "Need a focus strategy first? [Focus Pocus](/FocusPocus) builds your session plan." |
| **TaskSwitchingMinimizer** | ← FocusPocus | Post-result | "Ready to focus? Set up a session with [Focus Pocus](/FocusPocus)." |
| **WaitingModeLiberator** | ← TaskAvalancheBreaker | Post-result | "Got things to do while waiting? [Task Avalanche Breaker](/TaskAvalancheBreaker) finds micro-tasks that fit." |
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
> DateNight ↔ AwkwardSilenceFiller ↔ CaptionMagic ↔ SixDegreesOfMe

| Tool | Cross-Ref | Placement | Copy |
|------|-----------|-----------|------|
| **DateNight** | ← AwkwardSilenceFiller | Post-result | "Nervous about conversation? [Awkward Silence Filler](/AwkwardSilenceFiller) has you covered." |
| **AwkwardSilenceFiller** | ← DateNight | Pre-result | "Planning a date? [DateNight](/DateNight) finds the perfect spot first." |
| **CaptionMagic** | ← SixDegreesOfMe | Post-result | "Want to explore more connections? [Six Degrees of Me](/SixDegreesOfMe) maps how you connect to anything." |

---

## CLUSTER 10: HEALTH & BODY
> SleepDebt ↔ LazyWorkoutAdapter ↔ DoctorVisitTranslator ↔ CrashPredictor

| Tool | Cross-Ref | Placement | Copy |
|------|-----------|-----------|------|
| **SleepDebt** | ← CrashPredictor | Post-result | "Want to predict when you'll hit a wall? [Crash Predictor](/CrashPredictor) forecasts your energy." |
| **CrashPredictor** | ← SleepDebt | Pre-result | "Sleep affecting your energy? Check [Sleep Debt](/SleepDebt) to see where you stand." |
| **LazyWorkoutAdapter** | ← SpoonBudgeter | Pre-result | "Low on energy? [Spoon Budgeter](/SpoonBudgeter) helps you decide if a workout fits today." |
| **DoctorVisitTranslator** | ← SymptomSolver | Pre-result | "Not sure what to tell the doctor? [Symptom Solver](/SymptomSolver) helps you describe what's going on." |

---

## CLUSTER 11: ACADEMIC
> GradeGraveyard ↔ TheCurve ↔ ProfVibe ↔ BragSheetBuilder

| Tool | Cross-Ref | Placement | Copy |
|------|-----------|-----------|------|
| **GradeGraveyard** | ← TheCurve | Post-result | "Want to see where you'd fall on the curve? Try [The Curve](/TheCurve)." |
| **ProfVibe** | ← AwkwardSilenceFiller | Post-result | "Nervous about office hours? [Awkward Silence Filler](/AwkwardSilenceFiller) helps with conversation starters." |
| **GradeGraveyard** | ← BragSheetBuilder | Conditional | If GPA recovery plan includes accomplishments: "Document your wins with [Brag Sheet Builder](/BragSheetBuilder) for grad school apps." |

---

## CLUSTER 12: DAILY ROUTINES
> HabitChain ↔ RoutineRuptureManager ↔ TimeVanishingExplainer

| Tool | Cross-Ref | Placement | Copy |
|------|-----------|-----------|------|
| **HabitChain** | ← RoutineRuptureManager | Conditional | If chain breaks: "Routine disrupted? [Routine Rupture Manager](/RoutineRuptureManager) helps you adapt." |
| **RoutineRuptureManager** | ← HabitChain | Post-result | "Ready to rebuild? [Habit Chain](/HabitChain) helps you stack new habits sustainably." |
| **TimeVanishingExplainer** | ← HabitChain | Post-result | "Know where the time goes? Build better habits with [Habit Chain](/HabitChain)." |

---

## UNIVERSAL CROSS-REFS
> These tools have broad applicability and can be referenced from many places

| Tool | When to Reference | Suggested Copy |
|------|-------------------|----------------|
| **DecisionCoach** | Any tool where user faces a choice in results | "Stuck between options? [Decision Coach](/DecisionCoach) helps you think it through." |
| **SpiralStopper** | Any tool dealing with stress/anxiety output | "Thoughts racing? [Spiral Stopper](/SpiralStopper) can help." |
| **BrainDumpStructurer** | Any tool where input is messy/unstructured | "Thoughts jumbled? Organize them with [Brain Dump Structurer](/BrainDumpStructurer) first." |

---

## CURRENT STATE: ALMOST NO CROSS-REFS EXIST

Scanned all 83 built components. Only **1 bidirectional link** exists today:
- NameAudit → NameStorm (✅ but uses `<strong>` not `<a href>`)
- NameStorm → NameAudit (❌ missing — not bidirectional yet)

**Every other tool has zero cross-references.** This is the single biggest internal marketing opportunity on the site.

---

## IMPLEMENTATION PRIORITY

### Phase 1: Fix existing + add to tools being audited
As each tool goes through the audit checklist, add its cross-refs from this map. This happens naturally as part of the audit.

### Phase 2: Batch the tightest clusters
These clusters have the strongest natural connections and should be linked first:
1. NameAudit ↔ NameStorm (already partially done)
2. SubSweep ↔ BillGuiltEraser ↔ RamenRatio ↔ BuyWise
3. TaskAvalancheBreaker ↔ BrainDumpStructurer ↔ CrisisPrioritizer
4. SpiralStopper ↔ FreezeStateUnblocker ↔ DopamineMenuBuilder
5. FridgeAlchemy ↔ RecipeChaosSolver ↔ LeftoverRoulette

### Phase 3: Universal connectors
Add DecisionCoach, SpiralStopper, and BrainDumpStructurer references where contextually appropriate across the broader tool set.

---

*Last updated: Feb 21, 2026 — Update as new tools are added or clusters evolve*
