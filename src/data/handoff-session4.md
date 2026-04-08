# DeftBrain Audit Handoff — Session 4

## Project Files (read-only, always available)
- `/mnt/project/CONVENTIONS.md` — full PF-1 through PF-15 checklist
- `/mnt/project/COMPLIANCE_PROMPT.md` — concise rule summary
- `/mnt/project/audit_v2-3.py` — automated audit script (updated this session)
- `/mnt/project/tools.js` — tool metadata registry
- `/mnt/project/cross-reference-map.md` — valid cross-ref IDs
- `/mnt/project/tool-audit-checklist-v4_36.md` — full manual checklist (backend section added this session)

## Project Instructions (paste into Project Instructions field)
See CONVENTIONS.md and COMPLIANCE_PROMPT.md. Key rules:
1. No lucide-react. Icons = emoji in `<span>` tags.
2. No inline CopyBtn/ActionBar anywhere — `grep -n "<CopyBtn\|<ActionBar" file.js` must return 0.
3. All tools use `useTheme()` → `isDark` with `c = {}` color config.
4. BRAND constant at module level. No hardcoded brand strings.
5. Always run `python3 /mnt/user-data/outputs/audit_v2-3.py /path/to/ComponentName.js` after every edit. **The script now accepts a direct file path — always pass it explicitly.**
6. After any fix, check for TDZ: all `useRef` after all `useState`; `usePersistentState` after all `useRef`; `useRegisterActions` after all `useCallback`/`useMemo`.
7. Nested template literals in JSX props break Babel → use array join or string concat.
8. `const BRAND = BRAND` self-reference breaks load → always verify BRAND declaration after Python replacements.
9. `c.textMuteded = c.textMuted;` alias must be explicitly set after the c block — it is never auto-defined.

---

## Completed This Session

### ✅ audit_v2-3.py (major updates)
- **argv support added:** script now correctly audits a specific file when called as `python3 audit_v2-3.py /path/to/File.js`. Previously the path argument was silently ignored — zero tools were audited when the project file pairing check failed.
- **PF-15 check added:** three sub-rules: (1) `c.required` must be defined in c block; (2) all `*` spans must use `c.required`; (3) required fields detected from `disabled={}` condition must have a `c.required` asterisk on their label, with line number in failure message.
- **S5.5 render-function split fixed:** prior regex matched `results &&` in `useEffect` bodies, placing all hrefs in post-region. Fix: scope search to after last `return (` in file. Now handles two patterns: inline `{results && (` tools (single split), and render-function tools (`const renderResults`) using dual separate search regions.
- **S5.5 conditional call detection:** broadened `{renderResults()}` match to `renderResults()` anywhere after last `return (`, catching conditional invocations like `{decideMode === 'standard' && renderResults()}`.

### ✅ DecoderRing.js
- PF-15: added `<span className={c.required}>*</span>` to "Paste the message" label (the only required field; gated by `!message.trim()` in submit disabled).
- Four pre-existing violations revealed once argv bug was fixed: `c.required` missing from c block, `CopyBtn` import missing (PF-1), `mr-2` missing from header icon span, no pre-result cross-ref. All fixed.

### ✅ DecisionCoach.js + decision-coach.js
**Frontend (9 issues → 0):**
- Imports: removed `ActionBar` from ActionButtons import; added `useRegisterActions` from ActionBarContext.
- Hook order corrected: `linkStyle` and `useRef` were declared BEFORE `const c = {}` (wrong); `usePersistentState` was declared BEFORE `useState` (wrong). Fixed to: c block → alias → linkStyle → useState → useRef → usePersistentState.
- `c.textMuteded = c.textMuted;` alias added — was silently broken, causing text color to render as the string `"undefined"` in className.
- `c.required` key added to c block.
- All 6 inline `<ActionBar>` instances removed (renderResults, renderProsResult, renderDevilsResult, renderChainResult, renderGroupTab, renderInsightsTab).
- `buildFullText` useCallback added (routes to appropriate content per active tab/mode); `useRegisterActions` wired after it.
- Global keyboard handler added with `handleRef`/`canSubmitRef` pattern. Render-time assignments placed before TABS constant.
- Hardcoded `"Decision Coach"` title → `{tool?.title ?? 'Decision Coach'}`; tagline made dynamic.
- Root `<div>` → `<div className={\`space-y-4 ${c.text}\`}>`.
- Cross-refs: `target="_blank"` removed from all 4 links; trimmed to 3 (dropped CrowdWisdom); relative ghost URLs in second "You might also like" block removed (entire block cut); pre-result href placed in main return before `renderResults()` call; post-result `🔗 Related tools` block added inside `renderResults()` body.
- PF-15: added `c.required` asterisks to 4 required field labels: "What needs deciding?", "Your gut instinct", "Options (2-4)", "Group decision".

**Backend (4 issues → 0):**
- Removed unused `DEFAULT_LIMITS` and `DIVERSION_LIMITS` from rateLimiter import (imported but never referenced).
- Added `!decisionNeeded?.trim()` validation to `/devils-advocate` route (only `gutInstinct` was guarded; empty decision silently passed through).
- Added `!originalDecision || !outcome` validation to `/followup` route (no validation existed; missing `outcome` broke all three conditional prompt blocks silently).
- Cleaned template comment anti-pattern: `${/* did_it, didnt_do_it, changed */''}` → proper `// outcome values:` comment above the prompt line.

---

## Critical Rules Reinforced This Session

**Hook order — full correct sequence:**
```
useClaudeAPI() + useTheme()
const c = { ... }
c.textMuteded = c.textMuted;   ← alias, always explicit
const linkStyle = ...
useState (all)
useRef (all)
usePersistentState (all)
handler functions
const buildFullText = useCallback(...)
useRegisterActions(buildFullText(), tool?.title || 'Tool Name')
scroll useEffect
keyboard useEffect
render helpers
// render-time: handleRef.current = ...; canSubmitRef.current = ...
const TABS = [...]  ← or equivalent pre-return constants
return (...)
```

**c.textMuteded alias is never auto-defined.** If `c.textMuteded` appears in JSX and `c.textMuteded = c.textMuted` is absent after the c block, every usage silently renders as the string `"undefined"` in the className — invisible crash, no console error. Always add the alias line.

**argv was silently ignored.** The old audit script always globbed `/mnt/user-data/outputs/*.js` regardless of arguments. A file that had no pairing in `/mnt/project/` reported "✅ CLEAN" while auditing nothing. Always use the updated script from outputs: `python3 /mnt/user-data/outputs/audit_v2-3.py /path/to/File.js`.

**S5.5 with render-function tools:** The audit splits content into pre-result and post-result regions to check href placement. For tools using `const renderResults = () => ...`:
- **post-region** = the `renderResults` function body (must contain at least one href)
- **pre-region** = the main `return (` up to the first `renderResults()` call (must contain at least one href)
- Hrefs placed AFTER all tab content in the main return fall outside both regions and are invisible to the count. Place the pre-result href between the header/tabs and the first `renderResults()` call.

**ActionBar removal in multi-mode tools:** A tool can have many `<ActionBar>` instances across different render helpers. Grep for ALL of them before starting: `grep -n "<ActionBar" ComponentName.js`. Each one must be removed. Replace with a single `useRegisterActions(buildFullText(), ...)` call that routes to the appropriate content by checking active tab/mode state.

**Backend: three recurring issues to check on every route file:**
1. **Unused destructured imports** — `DEFAULT_LIMITS`, `DIVERSION_LIMITS`, or any other rateLimiter exports that appear in the `require()` destructure but are never referenced. Remove them.
2. **Missing input validation** — every route that uses `req.body` fields in a prompt must guard against missing/empty values before building the prompt. No field should reach `${field}` in a template literal as `undefined`.
3. **Template comment anti-pattern** — `${/* comment */''}` inside template literals is valid JS but a code smell. Use a real comment above the line instead.

**CopyBtn rule (restated):** Import is required by PF-1 (`import { CopyBtn } from '../components/ActionButtons'`) but `<CopyBtn` must never appear in JSX. `grep -n "<CopyBtn\|<ActionBar" ComponentName.js` must return zero.

---

## Audit Script Improvements (this session)
The updated `audit_v2-3.py` is in `/mnt/user-data/outputs/`. Copy it to the project before the next session. Changes:
- **argv support:** `python3 audit_v2-3.py /path/to/File.js` now works correctly
- **PF-15 check:** detects missing `c.required` in c block and unlabelled required fields from `disabled={}` condition
- **S5.5 split:** anchored to last `return (` to avoid matching `results &&` in useEffect bodies
- **S5.5 render-function pattern:** dual-region detection; call match broadened from `{renderResults()}` to `renderResults()` anywhere in return

---

## Files Currently Clean in /home/claude/ and /mnt/user-data/outputs/
All files from Session 3, plus:
- DecoderRing.js ✅
- DecisionCoach.js ✅
- decision-coach.js ✅
- audit_v2-3.py ✅ (updated)

### Full clean list (Sessions 1–4):
- FanTheory.js ✅
- FakeReviewDetective.js ✅ + fake-review-detective.js ✅
- EmailUrgencyTriager.js ✅
- EgoKiller.js ✅
- DriveHome.js ✅ + drive-home.js ✅
- DreamPatternSpotter.js ✅
- PEP.js ✅ + pep.js ✅
- DoctorVisitTranslator.js ✅
- DifficultTalkCoach.js ✅
- DecoderRing.js ✅ + decoder-ring.js ✅
- DecisionCoach.js ✅ + decision-coach.js ✅

---

## Tools Not Yet Cleared (audit order)
Work through these roughly alphabetically. Each is a full frontend + backend audit.

- AlternatePath.js
- AnalogyEngine.js
- ApologyCalibrator.js
- ArgumentSimulator.js
- AwkwardSilenceFiller.js
- BatchFlow.js
- BeliefStressTest.js
- BikeMedic.js
- BillRescue.js
- Bookmark.js
- BragSheetBuilder.js
- BrainDumpBuddy.js
- BrainRoulette.js
- BrainStateDeejay.js
- BuyWise.js
- CaptionMagic.js
- ChaosPilot.js
- ColdOpenCraft.js
- ComebackCooker.js
- ComplaintEscalationWriter.js
- ConflictCoach.js
- ContextCollapse.js
- ContrastReport.js
- CrashPredictor.js
- CrisisPrioritizer.js
- CrowdWisdom.js
- DateNight.js
- DebateMe.js

---

## Recommended First Command in New Session
```bash
cp /mnt/user-data/outputs/audit_v2-3.py /home/claude/audit_v2-3.py
cp /mnt/user-data/uploads/TargetTool.js /home/claude/TargetTool.js
python3 /home/claude/audit_v2-3.py /home/claude/TargetTool.js 2>&1
```
Then run the full manual checklist from CONVENTIONS.md and tool-audit-checklist-v4_36.md (including the new Section 7 for backend files).
