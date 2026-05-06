# DeftBrain Tool Renames

Source of truth for tools that have been renamed. Past chats may still reference the old names; cross-refs in older code may still link to old paths. Treat this file as authoritative.

## Active renames

| Old name | New name | Notes |
|---|---|---|
| BillGuiltEraser | BillRescue | Renamed. No `server.js` redirect (added during pre-launch when traffic was negligible — revisit before launch). |
| BrainDumpStructurer | BrainDumpBuddy | Renamed. Component file is `BrainDumpBuddy.js`. No `server.js` redirect (added pre-launch). |
| BurnoutBreadcrumbTracker | PEP | Folded into PEP. No `server.js` redirect (added pre-launch). |
| ConfrontationCoach | ConflictCoach | Consolidated with `ConflictTextCoach` into a single `ConflictCoach` tool. No `server.js` redirect (added pre-launch). |
| ConflictTextCoach | ConflictCoach | Consolidated with `ConfrontationCoach` into a single `ConflictCoach` tool. No `server.js` redirect (added pre-launch). |
| DifficultTalkRehearser | DifficultTalkCoach | Renamed. Component file is `DifficultTalkCoach.js`. No `server.js` redirect (added pre-launch). |
| DopamineMenuBuilder | PEP | Stands for "Personal Energy Planner." Component file is `PEP.js`, backend is `pep.js`, tools.js id is `"PEP"`. localStorage keys migrated `dmb-*`/`dopamine-*` → `pep-*`. Tagline: "Personal Energy Planner — understand your energy, plan around it." `server.js` has a 301 redirect. |
| FoodSwap | MiseEnPlace | Folded into MiseEnPlace. `server.js` has a 301 redirect. |
| FridgeAlchemy | MiseEnPlace | Folded into MiseEnPlace. `server.js` has a 301 redirect. |
| LeftoverRoulette | MiseEnPlace | Folded into MiseEnPlace. No `server.js` redirect (added pre-launch). |
| MoneyMoves | MoneyDiplomat | Component file, route, tools.js id all renamed. `server.js` has a 301 redirect from the old path. |
| PaperDigest | ResearchDecoder | Renamed. `server.js` has a 301 redirect. |
| PlotHole | PlotTwist | Renamed. `server.js` has a 301 redirect. |
| RoommateCourtroom | RoommateCourt | Renamed. `server.js` has a 301 redirect. |
| RoutineRuptureManager | PEP | Folded into PEP. No `server.js` redirect (added pre-launch). |
| SayItRight | PronounceItRight | Renamed. `server.js` has a 301 redirect. |
| SocialBatteryForecaster | SocialEnergyAudit | Renamed. No `server.js` redirect (added pre-launch). |
| SpoonBudgeter | PEP | Folded into PEP. No `server.js` redirect (added pre-launch). |
| TimeVanishingExplainer | WhereDidTheTimeGo | Renamed. `server.js` has a 301 redirect. |
| WhatIfMachine | WhatIf | Renamed. `server.js` has a 301 redirect. |
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
