# DeftBrain Tool Renames

Source of truth for tools that have been renamed. Past chats may still reference the old names; cross-refs in older code may still link to old paths. Treat this file as authoritative.

## Active renames

Rows point at the **current final name** (chains are collapsed — e.g. SubSweep → Subscription Slayer → Subscription Tamer is recorded as `SubSweep → SubscriptionTamer`). "Folded into" marks a merge (not a 1:1 rename). All `server.js` redirects are single-hop to the final URL.

| Old name | New name | Notes |
|---|---|---|
| ArgumentSimulator | ArgueBetter | Folded into Debate Me (thinking-cluster consolidation, 2026-07-06); Debate Me then renamed Argue Better 2026-07-10. 301. |
| BillGuiltEraser | BillRescue | Renamed. No `server.js` redirect (added during pre-launch when traffic was negligible — revisit before launch). |
| BrainDumpStructurer | BrainDumpBuddy | Renamed. Component file is `BrainDumpBuddy.js`. No `server.js` redirect (added pre-launch). |
| BurnoutBreadcrumbTracker | PEP | Folded into PEP. No `server.js` redirect (added pre-launch). |
| ConfrontationCoach | ConflictCoach | Consolidated with `ConflictTextCoach` into a single `ConflictCoach` tool. No `server.js` redirect (added pre-launch). |
| ConflictTextCoach | ConflictCoach | Consolidated with `ConfrontationCoach` into a single `ConflictCoach` tool. No `server.js` redirect (added pre-launch). |
| ContrastReport | WhichLife | What If? (single-path) folded into The Contrast Report (2026-07-06); survivor took the "What If?" name, then renamed **Which Life?** 2026-07-10 (collided with the "What If?" *category*). Endpoint stays `contrast-report`, i18n `cr_`. 301. |
| DebateMe | ArgueBetter | Renamed 2026-07-10 ("Debate Me" undersold a serious steelman/fallacy trainer). Endpoint stays `debate-*`, i18n `dm_`. 301. |
| DifficultTalkRehearser | DifficultTalkCoach | Renamed. Component file is `DifficultTalkCoach.js`. No `server.js` redirect (added pre-launch). |
| DopamineMenuBuilder | PEP | Stands for "Personal Energy Planner." Component file is `PEP.js`, backend is `pep.js`, tools.js id is `"PEP"`. localStorage keys migrated `dmb-*`/`dopamine-*` → `pep-*`. Tagline: "Personal Energy Planner — understand your energy, plan around it." `server.js` has a 301 redirect. |
| EgoKiller | BeliefStressTest | Folded into Belief Stress Test (same steelman-and-attack job; BST is the systematic superset), 2026-07-06. 301. |
| FoodSwap | MiseEnPlace | Folded into MiseEnPlace. `server.js` has a 301 redirect. |
| FridgeAlchemy | MiseEnPlace | Folded into MiseEnPlace. `server.js` has a 301 redirect. |
| LeftoverRoulette | MiseEnPlace | Folded into MiseEnPlace. No `server.js` redirect (added pre-launch). |
| MoneyMoves | MoneyDiplomat | Component file, route, tools.js id all renamed. `server.js` has a 301 redirect from the old path. |
| PaperDigest | ResearchDecoder | Renamed. `server.js` has a 301 redirect. |
| PlotHole | PlotTwist | Renamed. `server.js` has a 301 redirect. |
| RechargeRadar | SocialBatteryAdvisor | Folded into Social Energy Audit (its Energy Forecast mode = Recharge Radar's whole job), 2026-07-06; survivor renamed Social Battery Advisor. 301. |
| RoommateCourtroom | RoommateCourt | Renamed. `server.js` has a 301 redirect. |
| RoutineRuptureManager | PEP | Folded into PEP. No `server.js` redirect (added pre-launch). |
| SayItRight | PronounceItRight | Renamed. `server.js` has a 301 redirect. |
| SocialBatteryForecaster | SocialBatteryAdvisor | Renamed (via SocialEnergyAudit). No dedicated `server.js` redirect (added pre-launch). |
| SocialEnergyAudit | SocialBatteryAdvisor | Renamed 2026-07-06. Endpoint stays `social-energy-audit`, i18n `sea_`. 301. |
| SpoonBudgeter | PEP | Folded into PEP. No `server.js` redirect (added pre-launch). |
| SubSweep | SubscriptionTamer | Interim merge name for the Subscription Guilt Trip consolidation; renamed Subscription Slayer 2026-07-06, then **Subscription Tamer** 2026-07-10. Endpoint stays `sub-sweep`, i18n `ss_`. 301. |
| SubscriptionGuiltTrip | SubscriptionTamer | Folded into the subscription tool (cost-per-use verdicts + guilt-free framing), 2026-07-06. 301. |
| SubscriptionSlayer | SubscriptionTamer | Renamed 2026-07-10 ("Slayer" was off-brand + misrepresented a keep/cancel judgment tool). 301. |
| TimeVanishingExplainer | WhereDidTheTimeGo | Renamed. `server.js` has a 301 redirect. |
| WhatIf | WhichLife | Renamed 2026-07-10 ("What If?" collided with the same-named category; the tool wasn't in it). Endpoint stays `contrast-report`, i18n `cr_`. 301. |
| WhatIfMachine | WhichLife | Renamed (via WhatIf). `server.js` has a 301 redirect. |
| WhereDidItGo | WhereDidTheTimeGo | Renamed. `server.js` has a 301 redirect. |

## Known orphans (do not redirect, do not cross-ref)

These names appear in old code, marketing copy, or past plans. They never shipped publicly and do not have replacements in `tools.js`:

- HabitChain
- SleepDebt
- BookScout
- MoneyShameRemover
- RamenRatio
- ProfVibe
- FreezeStateUnblocker
- CriticismBuffer
- GradeGraveyard
- TheCurve
- TaskSwitchingMinimizer
- SymptomSolver

If a cross-ref to one of these is found in code, remove it (or replace with a contextually appropriate live tool — see `cross-reference-map.md`).

## When you encounter a broken cross-ref

If you find a `<a href="/SomeTool">` that doesn't match any id in `tools.js`:

1. **Check this file first** — it may be a known rename or a known orphan.
2. **If not listed, search past chats** for the old name before substituting. Don't pick a category-similar replacement and call it done.
3. **If it's truly orphaned (deleted, no rename target)**, decide whether to remove the cross-ref entirely or replace with a contextually appropriate live tool.

## Detection sweep

Quick one-liner check (catches missing tools, not full bug surface):

```bash
grep -hE 'href="/[A-Z][A-Za-z]+"' src/tools/*.js \
  | sed -E 's|.*href="/([A-Za-z]+)".*|\1|' \
  | sort -u \
  | comm -23 - <(grep -E 'id: "' src/data/tools.js | sed 's/.*"\(.*\)".*/\1/' | sort -u)
```

Output is the set of cross-ref targets that don't exist in `tools.js`. Empty output = clean.

For a more comprehensive sweep (also catches relative-href ghost URLs and respects this file's rename map), use:

```bash
RENAMES_MD=audit/RENAMES.md bash audit/crossref_sweep.sh
```

The bash version reports three failure modes separately: relative hrefs (ghost URL bugs), stale-rename hits (should match this file), and orphan hits (should match the orphan list above).

## Adding to this file

When renaming a tool, update this file in the same commit. Format: one row in the active-renames table, plus a note on what changed (component file, route, localStorage keys, redirect added, etc.). When folding a tool into another (rather than renaming), note "Folded into X" so future readers understand the rename isn't 1:1.

When deleting a tool that never shipped, add it to the "Known orphans" section. When deleting a tool that DID ship, treat it as a rename — pick a sensible target and add it to the rename table.
