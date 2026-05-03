The textMuteded / btnPrimarySecondaryondary / btnPrimaryPrimary typos in this tool match the same Python-script-corruption class as the deleteHover bug from BikeMedic. That bug was a dead value (broke hover state). These are dead class names (broke button styling). Worth a targeted grep across the codebase:
bashgrep -rnE "btnPrimarySecondaryondary|btnPrimaryPrimary|textMuteded" src/tools/
If more than a few tools hit, we can handle them in a dedicated sweep rather than tool-by-tool. The fixes are mechanical (sed -i). Worth running when you get back to the bug hunt.

---

# DeftBrain Cross-Tool Bug Sweep — Handoff

**Paused:** 2026-04-18, 7 tools remaining in alphabetical audit queue
**Resume when:** Full audit pass is complete
**Status:** 2 of 6 sweeps run; 1 sweep identified violations but fixes deferred; 3 sweeps not yet run

---

## TL;DR

Two of six bug-class sweeps came back clean. One sweep found ~18 real violations across 14 tools (PF-5: whole-output `<CopyBtn>` and inline `<PrintBtn>`). The audit script was upgraded to catch these automatically on future runs, which means they'll be flagged during the normal alphabetical audit flow — no separate fix sprint needed. Three remaining sweeps still need to run.

---

## Completed sweeps

### ✅ Bug A — c-block self-reference corruption

**Hypothesis:** The `deleteHover: '${c.deleteHover}'` bug found in BikeMedic (Python replacement script corruption) may have affected other tools.

**Command:**
```bash
grep -rnE "('|\")\\\$\{c\.[a-zA-Z_]+\}\\1" src/tools/ src/components/ | grep -v '`'
```

**Result:** 0 hits. BikeMedic was a one-off.

**Close:** No action needed.

---

### ✅ Bug B — backend `withLanguage(..., req)` typo

**Hypothesis:** The BikeMedic backend bug where `withLanguage(prompt, req)` was called with the whole Express `req` object instead of `req.body.userLanguage` (caused `locale.toLowerCase is not a function` errors) may exist in other route files.

**Command:**
```bash
grep -rnE "withLanguage\s*\([^)]*,\s*req\s*[,)]" routes/
```

**Result:** 0 hits. All other routes correctly pass `req.body.userLanguage`.

**Close:** No action needed.

---

## Incomplete — violations identified, fixes deferred

### ⏸ Bug C — inline `<CopyBtn>` / `<PrintBtn>` (PF-5 violations)

**Hypothesis:** Per-tool audits enforce PF-5 (copy/print go through `useRegisterActions` + global ActionBar), but a mass-grep may reveal tools that predate the rule or slipped through.

**Initial sweep:** 176 lines matched — mostly false positives (per-item `<CopyBtn>` on individual list items is the legitimate "ContextCollapse exception" pattern).

**Sharpened sweep:**
```bash
grep -rnE "<CopyBtn[^>]*(buildFullText|buildAllScripts|buildCopyText|buildChain|buildReminderText)" tools/
grep -rnE "<CopyBtn[^>]*label=\"(Copy All|Copy Report|Copy Plan|Copy Verdict|Copy everything)" tools/
grep -rnE "<PrintBtn\b" tools/
```

**Confirmed violations — 18 total across 14 tools:**

| File | Line(s) | Pattern | Severity |
|---|---|---|---|
| NameAudit.js | 1196, 1197, 1285, 2062 | `buildCompareText()`, `buildFullText()` × 3 | 4 violations — worth a structural look |
| SubscriptionGuiltTrip.js | 771, 911 | `buildAllScriptsContent()` × 2 | Same helper used twice |
| FocusPocus.js | 2313, 2314 | `breakPlanTextWithBrand` + inline `<PrintBtn>` | Only inline PrintBtn in codebase |
| TaskAvalancheBreaker.js | 824 | `buildFullText()` | — |
| GentlePushGenerator.js | 848 | `buildReminderText()` | — |
| PetWeirdnessDecoder.js | 649 | `buildFullText()` | — |
| RoommateCourt.js | 562 | `buildFullText()` — "Copy Verdict" | — |
| PlainTalk.js | 549 | `buildFullText()` | — |
| LedeBuilder.js | 249 | `buildFullText()` | — |
| FriendshipFadeAlerter.js | 1157 | `buildFullText()` | — |
| CrashPredictor.js | 716 | `buildFullText()` | — |
| RulebookBreaker.js | 438 | `buildFullText()` | — |
| RentersDepositSaver.js | 1074 | `buildFullText()` | — |
| TipOfTongue.js | 435 | `buildCopy()` — "Copy All Matches" | — |
| TheFinalWord.js | 1489 | Inline multi-line string (not a helper call) | Falls through audit regex |

**Legitimate — NOT violations, do NOT "fix":**

| File | Line | Why legit |
|---|---|---|
| VelvetHammer.js | 217 | `buildCopyText(variant)` — takes param, per-item |
| SixDegreesOfMe.js | 1097 | `buildChainText(h, h.thingA, h.thingB)` — per-chain |
| AwkwardSilenceFiller.js | 510 | `buildChainText(chain)` — per-chain |

**Resolution plan:**
1. **Audit script upgraded** (see next section) — will auto-catch these in the normal alphabetical audit flow
2. **Most tools in the 14-file list will be reached** via the existing reverse-alphabetical queue — fix as encountered
3. **NameAudit deserves a fresh look** — 4 violations in one file suggests structural issue (possibly multiple tabs each rebuilding their own "Copy All" instead of routing through single ActionBar)
4. **FocusPocus line 2314 is the only inline `<PrintBtn>` in the codebase** — unique bug class, one-line fix when pulled into audit

---

## Audit script improvements (already shipped)

`audit_v2-3.py` v4.39 in `/mnt/user-data/outputs/audit_v2-3.py`. Changes:

- **S1.4g** — flags inline `<PrintBtn>` (always a violation — print has no per-item use case)
- **S1.4h** — flags `<CopyBtn content={buildFullText()}>` and similar whole-output helpers. Allowlist: any helper called with a parameter is treated as per-item and allowed (preserves the ContextCollapse exception)
- **S5.5 per-cluster rule** — restored (the `/mnt/project/` copy had the old "max 3 total per tool" rule; v4.38's per-cluster logic was reinstated)

**Known limitation of S1.4h:** matches helper calls, not precomputed variables. FocusPocus line 2313 (`breakPlanTextWithBrand`) won't trigger S1.4h but FocusPocus will still be flagged via S1.4g (its inline `<PrintBtn>`).

---

## Not yet run

### ⏳ Bug D — `lucide-react` imports

**Hypothesis:** Project rule forbids lucide-react (emoji-only icons). Check nothing slipped through.

**Command:**
```bash
grep -rn "lucide-react" src/
```

**Expected:** 0 hits. Any hit is an immediate violation and zero-tolerance.

---

### ⏳ Bug E — mass audit of all tools

**Hypothesis:** Running the updated audit script across every tool will surface violations in tools audited before recent PF updates (PF-15 required asterisks, S1.4g/h, S5.5 per-cluster).

**Command:**
```bash
python3 audit_v2-3.py src/tools/*.js 2>&1 | tee audit-sweep.log
tail -20 audit-sweep.log
grep "S1.4[gh]:" audit-sweep.log  # just the PF-5 upgrades' hits
```

**Expected:** Every tool in the Bug C list (minus the 3 legit exceptions) should flag under S1.4g/h, plus likely additional hook-ordering, keyboard-handler, and cross-ref violations from pre-v4.39 tools.

---

### ⏳ Bug F — frontend/backend mode contract

**Hypothesis:** The `mode: 'custom_check'` bug in BikeMedic (frontend sent a mode the backend didn't handle → silent 500) may exist in other tool pairs.

**Command:**
```bash
for tool in src/tools/*.js; do
  name=$(basename "$tool" .js | sed 's/\([a-z0-9]\)\([A-Z]\)/\1-\2/g' | tr '[:upper:]' '[:lower:]')
  route="routes/${name}.js"
  [ ! -f "$route" ] && continue
  fe_modes=$(grep -oE "mode:\s*['\"][a-z_]+['\"]" "$tool" | grep -oE "'[^']+'" | sort -u)
  be_modes=$(grep -oE "mode\s*===\s*['\"][a-z_]+['\"]" "$route" | grep -oE "'[^']+'" | sort -u)
  for m in $fe_modes; do
    echo "$be_modes" | grep -q "^$m$" || echo "MISMATCH: $tool sends $m — $route doesn't handle it"
  done
done
```

**Expected:** Any `MISMATCH:` line is a silent 500 waiting to fire.

---

## When you resume — suggested order

1. **Finish the 7 remaining alphabetical audits.** Most of the 14 tools flagged by Bug C will naturally come up in queue order and get fixed with full file context.

2. **Run Bug D** (`lucide-react`) — fastest, zero-tolerance rule, any hit is immediately actionable.

3. **Run Bug E** (mass audit) — single command, consolidates everything the audit knows. Will re-flag any Bug C violations not yet fixed from the alphabetical pass.

4. **Run Bug F** (mode contract) — the silent-500 class. This one has no automated audit coverage today; mass-grep is the only way.

5. **Triage NameAudit.js separately** — 4 PF-5 violations in one file suggests the tool has multiple result views each with their own inline Copy buttons. Likely a refactor rather than 4 isolated fixes.

6. **Fix FocusPocus.js line 2314** — inline `<PrintBtn>` is unique in the codebase. One-line fix.

---

## Commands reference (copy-paste ready)

```bash
# Re-verify already-clean sweeps (should stay at 0)
grep -rnE "('|\")\\\$\{c\.[a-zA-Z_]+\}\\1" src/tools/ src/components/ | grep -v '`'
grep -rnE "withLanguage\s*\([^)]*,\s*req\s*[,)]" routes/

# Bug D — lucide-react
grep -rn "lucide-react" src/

# Bug E — mass audit (needs updated audit_v2-3.py v4.39)
python3 audit_v2-3.py src/tools/*.js 2>&1 | tee audit-sweep.log
grep "S1.4[gh]:" audit-sweep.log

# Bug F — mode contract
for tool in src/tools/*.js; do
  name=$(basename "$tool" .js | sed 's/\([a-z0-9]\)\([A-Z]\)/\1-\2/g' | tr '[:upper:]' '[:lower:]')
  route="routes/${name}.js"
  [ ! -f "$route" ] && continue
  fe_modes=$(grep -oE "mode:\s*['\"][a-z_]+['\"]" "$tool" | grep -oE "'[^']+'" | sort -u)
  be_modes=$(grep -oE "mode\s*===\s*['\"][a-z_]+['\"]" "$route" | grep -oE "'[^']+'" | sort -u)
  for m in $fe_modes; do
    echo "$be_modes" | grep -q "^$m$" || echo "MISMATCH: $tool sends $m — $route doesn't handle it"
  done
done
```

---

## Dependencies / prerequisites

- Updated `audit_v2-3.py` (v4.39 or later — includes S1.4g, S1.4h, S5.5 per-cluster)
- Alphabetical audit queue complete (7 tools remaining as of pause date)

---

*Document prepared 2026-04-18. Resume anytime — all context is captured here.*
