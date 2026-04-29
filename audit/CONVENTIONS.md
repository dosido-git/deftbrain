<!-- v1.3 · 2026-04-24 · removed vestigial CopyBtn-import requirement from PF-1 and PF-5; tools now import CopyBtn only when they actually use it -->
# DeftBrain Component Conventions
> **Read this file before writing or editing any tool component.**
> Copy snippets verbatim. Do not reconstruct from memory.

---
For deferred infrastructure and architecture decisions, see docs/deferred-decisions.md
---

## ⚡ MANDATORY PRE-WRITE PROTOCOL (new tools and significant edits)

Before writing the first line of any new tool component, or making structural changes to an existing one, complete ALL of the following steps in order. Do not skip or abbreviate.

1. **Read this entire file** (CONVENTIONS.md). Do not reconstruct patterns from memory.
2. **State the header pattern** you will use: persistent `<h2>` + tagline, inset `border-b`, inside padded wrapper.
3. **State the c block source**: copied verbatim from PF-2, not reconstructed.
4. **State the hook order**: useClaudeAPI → useTheme → c block → linkStyle → useState → useRef → usePersistentState → handlers → buildFullText → useRegisterActions → useEffect scroll → useEffect keyboard → render helpers → return.
5. **Confirm cross-refs are present**: 1–3 links from `cross-reference-map.md`, emoji before name, `/PascalCase` hrefs, no `target="_blank"`. Zero cross-refs is a violation.
6. **Confirm the root div** is `<div className={\`space-y-4 \${c.text}\`}>` with no background color.

Only after all six steps are confirmed may writing begin.

> This protocol exists because patterns reconstructed from memory drift. The conventions file is the only authoritative source. Reading it takes 90 seconds. Not reading it costs hours of correction.

---

## ⚡ PRE-FLIGHT CORRECTIONS
Run these checks on every file before doing anything else. Each one has a deterministic fix — no judgment required. Resolving these first eliminates the majority of recurring audit violations.

---

### PF-1 · Imports

**Scan:**
```bash
grep -n "^import" ComponentName.js
```

**Required — must all be present:**
```js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useClaudeAPI } from '../hooks/useClaudeAPI';
import { useTheme } from '../hooks/useTheme';
import { usePersistentState } from '../hooks/usePersistentState';
import { useRegisterActions } from '../components/ActionBarContext';
```

**Conditional — only when actually used (rare):**
```js
import { CopyBtn } from '../components/ActionButtons';
```
Only the ContextCollapse-style per-item copy button needs `CopyBtn`. Every other tool routes copy/share/print through `useRegisterActions` and should NOT import `CopyBtn` — an unused import is dead weight and triggers `no-unused-vars`.

**Must NOT be present:**
```bash
grep -n "lucide-react\|from 'lucide'\|ActionBar.*ActionButtons\|getToolById" ComponentName.js
# Must return zero results
```

---

### PF-2 · `c` Block, Aliases, and linkStyle

**Scan:**
```bash
grep -n "const linkStyle\|const c = {" ComponentName.js | head -3
# linkStyle line number must be GREATER than c block line number
```

**Copy this exact block:**
```js
const c = {
  card:          isDark ? 'bg-zinc-800' : 'bg-white',
  cardAlt:       isDark ? 'bg-zinc-700/50' : 'bg-slate-50',
  input:         isDark ? 'bg-zinc-900 border-zinc-600 text-zinc-100 placeholder-zinc-400 focus:border-cyan-500 focus:ring-cyan-500/20'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-cyan-500 focus:ring-cyan-100',
  text:          isDark ? 'text-zinc-50' : 'text-gray-900',
  textSecondary: isDark ? 'text-zinc-300' : 'text-gray-600',
  textMuted:     isDark ? 'text-zinc-500' : 'text-gray-400',
  labelText:     isDark ? 'text-zinc-200' : 'text-gray-700',
  accentTxt:     isDark ? 'text-cyan-400' : 'text-cyan-600',
  btnPrimary:    isDark ? 'bg-cyan-600 hover:bg-cyan-500 text-white'
                        : 'bg-cyan-600 hover:bg-cyan-700 text-white',
  btnSecondary:  isDark ? 'bg-zinc-700 hover:bg-zinc-600 text-zinc-200'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700',
  border:        isDark ? 'border-zinc-700' : 'border-gray-200',
  success:       isDark ? 'bg-emerald-900/20 border-emerald-700 text-emerald-200'
                        : 'bg-emerald-50 border-emerald-300 text-emerald-800',
  warning:       isDark ? 'bg-amber-900/20 border-amber-700 text-amber-200'
                        : 'bg-amber-50 border-amber-300 text-amber-800',
  danger:        isDark ? 'bg-red-900/20 border-red-700 text-red-200'
                        : 'bg-red-50 border-red-200 text-red-800',
  infoBox:       isDark ? 'bg-sky-900/20 border-sky-700 text-sky-200'
                        : 'bg-sky-50 border-sky-200 text-sky-800',
  successBox:    isDark ? 'bg-emerald-900/20 border-emerald-700' : 'bg-emerald-50 border-emerald-300',
  successTxt:    isDark ? 'text-emerald-300' : 'text-emerald-800',
  warningBox:    isDark ? 'bg-amber-900/20 border-amber-700' : 'bg-amber-50 border-amber-300',
  warningTxt:    isDark ? 'text-amber-300' : 'text-amber-800',
  pillActive:    isDark ? 'border-cyan-500 bg-cyan-900/30 text-cyan-200'
                        : 'border-cyan-600 bg-cyan-100 text-cyan-900',
  pillInactive:  isDark ? 'border-zinc-600 text-zinc-400 hover:border-zinc-500'
                        : 'border-gray-300 text-gray-500 hover:border-gray-400',
  required:      isDark ? 'text-amber-400' : 'text-amber-500',
};
// Always include these two alias lines immediately after the closing brace:
c.textMuteded = c.textMuted;
c.label = c.labelText;

const linkStyle = isDark
  ? 'text-cyan-400 hover:text-cyan-300 underline underline-offset-2'
  : 'text-cyan-600 hover:text-cyan-700 underline underline-offset-2';
```

**Undefined key scan — run before and after every edit:**
```bash
grep -oP 'c\.[a-zA-Z]+' ComponentName.js | sed 's/c\.//' | sort -u > /tmp/c_used.txt
grep -oP '[a-zA-Z]+(?=:\s+isDark)' ComponentName.js | sort -u > /tmp/c_defined.txt
comm -23 /tmp/c_used.txt /tmp/c_defined.txt
# Must return zero lines
```

---

### PF-3 · Input Card

The header (`<h2>` + tagline) must live **inside** the primary input card — not in its own separate card before it. One card. Header at the top, inputs below the divider. This is a single unit.

**Scan:**
```bash
grep -n "c\.card.*rounded\|rounded.*c\.card" ComponentName.js | head -5
# Every result must contain: border ${c.border} rounded-xl shadow-sm
# Flag any with shadow-lg, missing border, or missing ${c.border}

# Detect header-only card (closing tag within ~3 lines of the header divider):
grep -n "border-b border-zinc-500" ComponentName.js
# Take that line number N. Check line N+3 to N+5 — if it contains </div> with nothing
# between it and the next card open, the header is isolated in its own card. FAIL.
# The line after the closing </div> of the header section must be an input element,
# not another <div className=... card.
```

**✅ Correct pattern — header and inputs in one card:**
```jsx
<div className={`${c.card} border ${c.border} rounded-xl shadow-sm p-5 space-y-4`}>
  <div className="pb-3 border-b border-zinc-500">
    <h2 className={`text-xl font-bold ${c.text}`}>
      <span className="mr-2">{tool?.icon ?? '❓'}</span>{tool?.title ?? 'Fallback Title'}
    </h2>
    <p className={`text-sm ${c.textSecondary}`}>{tool?.tagline ?? 'Fallback tagline'}</p>
  </div>
  {/* inputs go here — inside the same card */}
  <div>
    <label ...>...</label>
    <input ... />
  </div>
  <button ...>Submit</button>
</div>
```

**❌ Wrong pattern — header-only card (discovered PronounceItRight / SensoryMinefieldMapper audit, v4.35):**
```jsx
{/* WRONG — header isolated in its own card */}
<div className={`${c.card} border ${c.border} rounded-xl shadow-sm p-5`}>
  <div className="pb-3 border-b border-zinc-500">
    <h2>...</h2>
    <p>...</p>
  </div>
</div>  {/* ← card closes with no inputs inside */}

{/* inputs in a completely separate card below */}
<div className={`${c.card} border rounded-xl p-5`}>
  <input ... />
</div>
```

This passes the gradient-blocking scan (because `<h2>` IS inside a `c.card`) but produces two cards where one belongs, creates visual redundancy, and separates the tool's identity from its action.

**Critical values:**
| Class | Rule |
|-------|------|
| `border ${c.border}` | Always present — card edge against gradient |
| `shadow-sm` | Never `shadow-lg` |
| `border-b border-zinc-500` | Always hardcoded — `${c.border}` is near-invisible in light mode |
| `{tool?.icon}` before `{tool?.title}` | Icon always left of title — never after, never hardcoded |
| `c.textSecondary` on tagline | Not `c.textMuted` |
| Inputs inside the same card | Never in a separate card below the header card |
| Header is the **first** thing inside the card | No input elements, pickers, tabs, or navigation may appear before the header — they must all follow the `border-b` divider |
| `border-b border-zinc-500` is on an **inner div**, not the outer card div | The outer card has `px-5` padding; the `border-b` div sits inside it — so the divider line is inset from the card edges, not edge-to-edge |

> ⚠️ **BUG PATTERN — Input controls rendered before the header (discovered PronounceItRight audit, v4.35)**
> A category picker strip was placed as its own element *before* the input card, making it the first visible UI inside the gradient frame — above the tool title. The fix is to move all input controls inside the card, below the `border-b border-zinc-500` divider. Nothing should precede the header inside the gradient frame.

**❌ Wrong pattern — border-b placed on the outer padded div (edge-to-edge divider):**
```jsx
{/* WRONG — border runs wall-to-wall, visually heavy */}
<div className="flex items-start justify-between px-5 pt-5 pb-3 border-b border-zinc-500">
  <h2>...</h2>
</div>
```

**✅ Correct pattern — border-b on an inner div, inside the padded container (inset divider):**
```jsx
{/* CORRECT — padding wraps both the header content and the border */}
<div className="px-5 pt-5">
  <div className="flex items-start justify-between pb-3 border-b border-zinc-500">
    <h2>...</h2>
  </div>
</div>
```

> ⚠️ **BUG PATTERN — Edge-to-edge header divider (discovered DriveHome / SafeWalk, March 2026)**
> Placing `border-b border-zinc-500` on the same div that carries `px-5` padding causes the border to run from card edge to card edge — visually heavy and inconsistent with all other tools. The `border-b` must always be on a child div, inside the padded wrapper, so the line is naturally inset.

> ⚠️ **EXCEPTION — Replace-mode tools (inputs disappear on results)**
>
> Some tools replace their entire input form with the results view — the inputs
> are conditionally rendered with `{!results && renderInput()}` and disappear
> entirely when results load. This creates a problem: if the header lives inside
> the input card, it vanishes when results appear, breaking the persistent-header
> requirement from the compliance prompt.
>
> **The two legitimate patterns are therefore:**
>
> | Pattern | When to use |
> |---------|-------------|
> | **Header + inputs unified in one card** (standard) | Inputs remain visible alongside results, OR tool uses tabs. This is the default — always prefer it. |
> | **Input-state card + results-state card** (replace-mode exception) | Inputs are fully replaced by results (`{!results && renderInput()}`). Header lives inside the input card during input phase; a separate persistent header card (with reset button) appears during the results phase. |
>
> **Replace-mode implementation:**
>
> ```jsx
> // Input phase — header inside the unified input card (MarkupDetective style):
> const renderInput = () => (
>   <div className={`${c.card} border ${c.border} rounded-xl shadow-sm p-5 space-y-4`}>
>     <div className="pb-3 border-b border-zinc-500">
>       <h2 className={`text-xl font-bold ${c.text}`}>
>         <span className="mr-2">{tool?.icon ?? '❓'}</span>{tool?.title ?? 'Fallback'}
>       </h2>
>       <p className={`text-sm ${c.textSecondary}`}>{tool?.tagline ?? 'Fallback tagline'}</p>
>     </div>
>     {/* inputs below */}
>   </div>
> );
>
> // Results phase — persistent standalone header card with reset button.
> // IMPORTANT: use a ternary (not &&) to avoid breaking the audit script's
> // S5.5 cross-ref region detection:
> return (
>   <div className={`space-y-4 ${c.text}`}>
>     {!results && renderInput()}
>     {results ? (
>       <div className={`${c.card} border ${c.border} rounded-xl shadow-sm p-5`}>
>         <div className="pb-3 border-b border-zinc-500">
>           <div className="flex items-start justify-between">
>             <div>
>               <h2 className={`text-xl font-bold ${c.text}`}>
>                 <span className="mr-2">{tool?.icon ?? '❓'}</span>{tool?.title ?? 'Fallback'}
>               </h2>
>               <p className={`text-sm ${c.textSecondary}`}>{tool?.tagline ?? 'Fallback tagline'}</p>
>             </div>
>             <button onClick={handleReset} className={`${c.btnSecondary} px-3 py-1.5 rounded-lg text-xs font-bold`}>
>               ↺ Start Over
>             </button>
>           </div>
>         </div>
>       </div>
>     ) : null}
>     {results && renderResults()}
>   </div>
> );
> ```
>
> **Critical detail — use ternary, not `&&`, for the results-phase header card.**
> `{results && (` triggers the audit script's inline-JSX split at that point,
> causing cross-refs inside `renderResults()` to land in the wrong region and
> produce a false S5.5 failure. `{results ? (...) : null}` avoids the match.
>
> *Added Session 100, April 2026. Reference tool: Bookmark.js.*

---

### PF-4 · Header Violations

There are two distinct header violations — both involve `c.card` near `<h2>`, but they are different problems with different fixes:

| Violation | Pattern | Effect | Fix |
|-----------|---------|--------|-----|
| **Gradient blocker** (v4.34) | `<h2>` in its own `c.card` with no inputs, placed as the first element | White card sits over the ToolPageWrapper gradient, category color invisible | Remove the card — make header bare `<h2>` + `<p>` |
| **Header-only card** (v4.35) | `<h2>` in a `c.card` that closes immediately before a separate input card | Two cards instead of one, identity separated from action | Fold header into the top of the input card with `border-b border-zinc-500` divider |

The PF-4 scan previously only caught the first violation. Both must now be checked:

```bash
# Violation 1 — Hardcoded text in h1/h2:
grep -n '<h[12][^>]*>[^{<]' ComponentName.js
# Must return zero results

# Violation 2 — Header card closes before inputs (header-only card):
# Find the border-b border-zinc-500 divider line:
grep -n "border-b border-zinc-500" ComponentName.js
# Read 4-6 lines after that line number in the file.
# If the pattern is: </div> → </div> → {/* inputs or next card */}
# with no input elements between the divider's parent close and the next sibling,
# the header is isolated. FAIL — fold inputs into the same card.

# Violation 3 — First c.card is a header-only card (gradient blocker):
grep -n "c\.card" ComponentName.js | head -3
# Read those lines. The first c.card must contain inputs, not just a header.
```

---

### PF-5 · ActionBar and Copy/Share/Print Buttons

The global ActionBar — rendered automatically by `ToolPageWrapper` via `useRegisterActions` — is the **only** sanctioned copy, share, and print mechanism in any tool. No inline buttons of any kind may duplicate these actions.

**Scan — all must return zero results:**
```bash
grep -n "<ActionBar" ComponentName.js
# Must return zero — inline ActionBar is forbidden

grep -n "CopyBtn\|PrintBtn\|ShareBtn" ComponentName.js | grep -v "^import"
# Must return zero — inline copy/share/print buttons are forbidden

grep -n "copyToClipboard\|navigator\.clipboard\|copiedField\|copiedIndex\|setCopied" ComponentName.js
# Must return zero — local clipboard logic is forbidden
```

**Fix:** Replace any inline `<ActionBar>`, `<CopyBtn>`, `<PrintBtn>`, or `<ShareBtn>` in JSX with `useRegisterActions(buildFullText(), tool?.title || 'Tool Name')` placed AFTER `buildFullText` is declared. Tools that previously imported `CopyBtn` solely to satisfy an audit check should remove the import entirely — `CopyBtn` is only imported by tools that actually render it inline (the ContextCollapse exception).

**Why this rule exists:** Inline copy buttons duplicate the global action bar, producing redundant UI (e.g. two Copy buttons visible at once). They also fragment the copy content — each inline button copies only a subset of results, while `useRegisterActions` copies everything via `buildFullText`. When users see inline buttons, they lose trust in the global bar and both become confusing.

**The one exception:** A tool may use `CopyBtn` inline for content that is *always independent of the main results* — e.g. a delegate message draft that users copy to send separately, where copying the whole plan would be wrong. This must be discussed and explicitly approved before implementation. All other uses are prohibited.

---

### PF-6 · Keyboard Handler

```bash
# Blocked tags — only SELECT allowed:
grep -n "tag === 'INPUT'\|tag === 'TEXTAREA'" ComponentName.js
# Must return zero results

# Stale closure check — direct function calls are violations:
grep -n "document.addEventListener.*keydown" ComponentName.js -A5 | grep -v "Ref\|current\|handler"
# Handler must call handleXxxRef.current?.() not handleXxx() directly

# canSubmit check — handler must not bypass disabled logic:
grep -n "disabled={" ComponentName.js | grep -v "loading" | head -5
# Any disabled condition beyond just loading must be mirrored as a canSubmitRef

# COVERAGE CHECK 1 — multi-view tools must wire every submit-capable view:
grep -c "setActiveTab\|setView\|activeTab ===\|view ===" ComponentName.js
# If result > 2, this is a multi-view tool. Then run:
grep -n "viewRef\|tabRef\|modeRef" ComponentName.js
# Must return at least one result — zero on a multi-view tool = FAIL (keyboard broken on secondary views)
grep -n "viewRef\.current\|tabRef\.current\|modeRef\.current" ComponentName.js | grep -v "useRef\|\.current ="
# Must appear inside the keyboard handler body, not just as assignment

# COVERAGE CHECK 2 — count async submit handlers vs wired refs:
grep -c "const handle[A-Z][a-zA-Z]* = async\|async function handle[A-Z]" ComponentName.js
# Note the count (N). Then verify N matching handleXxxRef.current?.() calls exist:
grep -n "Ref\.current?.()" ComponentName.js
# Count must equal number of distinct submit handlers exposed by the tool.
# Fewer refs than handlers = some submit action unreachable by keyboard.

# COVERAGE CHECK 3 — every submit view has its own canRef:
grep -n "canSubmitRef\|can[A-Z][a-zA-Z]*Ref" ComponentName.js
# Must have one canRef per submit-capable view.
# Each canRef must mirror that view's button's disabled condition — read and verify.
```

**Correct pattern — single mode:**
```js
const handleSubmitRef = useRef(null);
const canSubmitRef = useRef(false);

// Assigned every render, always fresh:
handleSubmitRef.current = handleSubmit;
canSubmitRef.current = !!primaryInput.trim(); // mirror the button's disabled condition exactly

useEffect(() => {
  const handler = (e) => {
    const tag = document.activeElement?.tagName;
    if (tag === 'SELECT') return;
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && !loading && canSubmitRef.current)
      handleSubmitRef.current?.();
  };
  document.addEventListener('keydown', handler);
  return () => document.removeEventListener('keydown', handler);
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [loading]);
```

**For multi-mode tools**, also track mode and per-mode validity:
```js
const modeRef = useRef(null);
modeRef.current = mode;
// canSubmitRef mirrors the disabled condition for whichever mode is active:
canSubmitRef.current = !!currentRole.trim() && (mode !== 'map' || !!targetRole.trim());

// Inside handler, route by mode:
if (modeRef.current === 'explore') handleExploreRef.current?.();
else handleAnalyzeRef.current?.();
```

> ⚠️ **BUG PATTERN — keyboard handler bypasses disabled logic**
> The submit button has `disabled={!canSubmit || loading}` but the keyboard handler only checks `!loading`. The handler fires, the function hits validation, throws an error or silently does nothing — keyboard appears broken. Always track the full disabled condition in `canSubmitRef` and check it in the handler.

---

### PF-7 · Scroll useEffect

```bash
grep -n "setTimeout" ComponentName.js | grep -v "clearTimeout"
# Any hit is a violation — every setTimeout needs clearTimeout in the return

# COVERAGE CHECK — every below-fold result needs a scroll useEffect:
grep -n "const \[.*[Rr]esult\b\|const \[results\b" ComponentName.js | grep "usePersistentState\|useState" | grep -v "Loading\|Ref"
# Note the count (N) of distinct result variables.
grep -n "scrollIntoView" ComponentName.js | wc -l
# If scroll count < result count, flag each un-scrolled result for review.
# Not every result requires scroll (e.g. results that replace the form above the fold),
# but any result that appears below existing content with no scroll = likely UX bug.
```

**Correct pattern:**
```js
const resultsRef = useRef(null);

useEffect(() => {
  if (!results || !resultsRef.current) return;
  const t = setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);
  return () => clearTimeout(t);
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [results]);
```

*Reference case: BatchFlow (scroll-to-results plus four additional scroll useEffects — one per controls-bar panel: share, progress, saveTemplate, weekly — each attached to its own `useRef` and watching its own toggle state, solving the "click does nothing visible" bug when panels render below the fold).*

**Anti-jump guidance:** The scroll anchor should live at the seam between the input card and the results area — standard placement. When that placement is adopted, any conditional content between the submit button and the anchor (pre-result cross-refs, error reservations, session-state panels) becomes visible scroll-travel distance when scroll fires. This creates a jarring "jump" effect as the user watches unrelated content whiz past. **Mitigation: hide pre-result cross-refs during loading states** by wrapping them in `{!loading && !compareLoading && (...)}`. Pre-result prompts like "Need X first? Try [Tool]" are semantically irrelevant once the user has committed to submit; hiding them collapses the vertical gap and makes the scroll-to-skeleton motion feel adjacent to the click. Same principle applies to any other pre-result-only content that sits between submit and the scroll anchor. Reference case: NameAudit (pre-result NameStorm cross-ref wrapped in `{!loading && !compareLoading && ...}` to eliminate ~130px of scroll-travel past it).

---

### PF-8 · useRegisterActions

```bash
# TDZ check — useRegisterActions must come AFTER buildFullText:
grep -n "useRegisterActions\|const buildFullText\|const buildText\|const buildCopy" ComponentName.js
# useRegisterActions line number must be GREATER than build function line number

# COVERAGE CHECK — buildFullText must include every result variable:
grep -n "const \[.*[Rr]esult\b\|const \[results\b" ComponentName.js | grep "usePersistentState\|useState" | grep -v "Loading\|Ref"
# Note each result variable name. Then verify each one appears inside the build function body:
grep -n "buildFullText\|buildText\|buildCopy\|buildFull" ComponentName.js
# Read the build function (use view tool) — any result variable absent from it
# means that content is never included in copy/export. That is a silent data loss.
```

**Correct pattern:**
```js
const buildFullText = useCallback(() => {
  if (!results) return '';
  const lines = ['Tool Name', ''];
  // ...
  lines.push(BRAND);
  return lines.join('\n');
}, [results]);

useRegisterActions(buildFullText(), tool?.title || 'Tool Name'); // AFTER buildFullText
```

---

### PF-9 · Cross-References

Cross-references are **mandatory**. Every tool must link to at least one related tool. Absence of cross-refs is a violation, not a pass. Cross-refs may appear on multiple pages/branches of a multi-page tool — each page's cross-ref group is counted independently.

```bash
# MANDATORY — must have at least 1:
grep -c 'href="/' ComponentName.js
# Zero = VIOLATION

# Per-cluster cap — max 3 links within ~5 lines of each other (one footer/sidebar/paragraph):
awk '/href="\//{c++; if (NR-p<=5) g++; else g=1; p=NR; if (g>3) print "Cluster of "g" at line "NR}' ComponentName.js
# Any output = VIOLATION — spread clusters across pages or remove extras

# No target=_blank:
grep -n 'target=' ComponentName.js
# Must return zero results

# Correct href format (/PascalCase, no /?tool=):
grep -n 'href=' ComponentName.js
# Each must be /ToolName format

# Emoji before name:
grep -n 'href="/' ComponentName.js
# Each link text must start with an emoji
```

**Cap clarified (v4.38, Session 101, April 2026):** The cap is **3 per cluster**, not 3 per tool. A "cluster" = cross-ref links appearing within ~5 source lines of each other — typically a single footer, sidebar, or inline paragraph. Separate pages/branches of the same tool each get their own cluster budget. Preferred: 1–2 links per cluster. The audit script (`audit_v2-3-2.py` S5.5) enforces this by grouping adjacent hrefs into clusters and flagging any cluster with >3.

**Placement rules:**
- **Pre-result:** one inline sentence below the submit button, inside the input card
- **Post-result:** a `🔗 Related tools` block inside the results section
- Multi-page tools: at least one cross-ref per primary page/branch
- Use `cross-reference-map.md` to find the correct tools for each cluster

**Correct pattern:**
```jsx
<div className={`${c.cardAlt} border ${c.border} rounded-xl p-4`}>
  <p className={`text-[10px] font-bold ${c.textMuted} uppercase mb-2`}>🔗 Related tools</p>
  <div className="flex flex-wrap gap-3">
    <a href="/ToolNameA" className={`text-xs ${linkStyle}`}>🔨 Tool Name A</a>
    <a href="/ToolNameB" className={`text-xs ${linkStyle}`}>📋 Tool Name B</a>
  </div>
</div>
```

*Reference case: ArgumentSimulator (pre-result `/BeliefStressTest` in the input card, conditional `/RoastMe` shown only when intensity is unhinged, post-result cluster of `/PlotTwist` + `/WrongAnswersOnly`). Three clusters, each at or under the max-3 limit, each thematically tight.*

---

### PF-10 · Hook Ordering

```bash
FIRST_EFFECT=$(grep -n "useEffect" ComponentName.js | head -1 | cut -d: -f1)
LAST_STATE=$(grep -n "useState\|usePersistentState" ComponentName.js | tail -1 | cut -d: -f1)
echo "Last state: $LAST_STATE | First effect: $FIRST_EFFECT"
# LAST_STATE must be less than FIRST_EFFECT
```

**Required order inside component:**
1. `useClaudeAPI()` + `useTheme()`
2. `const c = { ... }` + aliases + `linkStyle`
3. All `useState` declarations
4. All `useRef` declarations
5. All `usePersistentState` declarations
6. Handler functions
7. `const buildFullText = ...`
8. `useRegisterActions(...)`
9. Scroll `useEffect`
10. Keyboard `useEffect`
11. Render helpers / return

---

### PF-11 · Root Div

```bash
grep -n "min-h-screen" ComponentName.js
# Must return zero results — ToolPageWrapper provides all background/frame styling
```

**Correct root:**
```jsx
return (
  <div className={`space-y-4 ${c.text}`}>
    {/* content */}
  </div>
);
```

---

### PF-12 · Common Typos

```bash
grep -n "textSecondaryondary\|btnSecondaryondary" ComponentName.js
# Must return zero — fix: → textSecondary / btnSecondary

grep -n ";;" ComponentName.js
# Must return zero — fix: remove extra semicolon
```

---

### PF-13 · BRAND Constant

```bash
grep -n "const BRAND" ComponentName.js
# Must show: const BRAND = '\n\n— Generated by DeftBrain · deftbrain.com'

grep -n "BRAND" ComponentName.js | grep -v "const BRAND"
# Must return at least one result — BRAND must be used, not just defined

grep -n "Generated by DeftBrain" ComponentName.js | grep -v "BRAND\|const "
# Must return zero — no hardcoded branding strings
```

---

### PF-14 · Submit Button

```bash
grep -n "w-full.*btnPrimary\|btnPrimary.*w-full" ComponentName.js
# Must return at least one result

grep -n "⏳" ComponentName.js
# Must return zero — use tool?.icon with animate-spin instead
```

**Correct pattern:**
```jsx
<button
  onClick={handleSubmit}
  disabled={!canSubmit || loading}
  className={`w-full ${c.btnPrimary} disabled:opacity-40 font-bold py-3 rounded-lg flex items-center justify-center gap-2 min-h-[48px]`}
>
  {loading
    ? <><span className="inline-block animate-spin">{tool?.icon ?? '⚙️'}</span> Working...</>
    : <><span className="mr-1">{tool?.icon ?? '❓'}</span> Submit Label</>}
</button>
```

**Multi-mode exception:** In tools with multiple functional modes (tabs, views, or sub-tools) where each mode has its own submit button with a distinct semantic purpose, each mode's **idle-state** icon may use a topical emoji matching that mode's action (e.g., ⚖️ Calibrate, 🔁 Fix, 🔎 Detect, 💬 Decode). The **loading-state** icon must still spin `tool?.icon` in every mode — that consistency is what tells users "this is still the same tool, just working." The shared `<Spinner />` helper is the canonical way to enforce this:

```jsx
const Spinner = () => <span className="animate-spin inline-block mr-2">{tool?.icon ?? '⚙️'}</span>;
// …
<button onClick={handleFix} disabled={…} className={`... ${c.btnPrimary}`}>
  {loading ? <><Spinner />Fixing...</> : <><span className="mr-2">🔁</span> Diagnose & Fix</>}
</button>
```

Single-mode tools retain the strict rule: `tool?.icon` in both branches.

*Reference case: ApologyCalibrator (13 modes, each with topical submit icon, shared `Spinner` helper using `tool?.icon` for loading).*

---

### PF-15 · Required Field Asterisks

Asterisks on required fields are **mandatory**. Every required input must have a visible `*` rendered using `c.required` (amber). A tool with any unasterisked required field is a compliance failure. Muted or red asterisks are also failures.

**Scan:**
```bash
# Confirm c.required is defined in the c block:
grep -n "required:" ComponentName.js | head -3
# Must show: required: isDark ? 'text-amber-400' : 'text-amber-500'

# Confirm c.required is used:
grep -n "c\.required" ComponentName.js
# Must return at least one result

# Scan for asterisks NOT using c.required:
grep -n '"\*"\|'"'"'\*'"'" ComponentName.js | grep -v "c\.required"
# Must return zero results — all asterisks must go through c.required

# Check labels on required fields have an asterisk:
grep -n "<label" ComponentName.js | grep -v "\*" | head -20
# Review each — any label for a required input without an asterisk is a FAIL
```

**Correct pattern:**
```jsx
<label className={`block text-sm font-medium ${c.labelText} mb-1`}>
  Describe the behavior <span className={c.required}>*</span>
</label>
<textarea ... />
```

**Rules:**
| Rule | Detail |
|------|--------|
| Asterisk is mandatory | Every required field must have one — no exceptions |
| Color | `c.required` only — `text-amber-400` dark / `text-amber-500` light |
| Never `c.textMuted` | Muted asterisks are invisible and therefore useless |
| Never `text-red-500` | Red belongs to the error/danger semantic — not form marking |
| Placement | Inside the `<label>`, after the label text, in a `<span className={c.required}>*</span>` |
| Optional fields | No asterisk — silence means optional |

**⚠️ Audit false-negative — dot-nested required fields:** `audit_v2-3-2.py`'s PF-15 extractor matches `!variable.trim()` in the submit button's `disabled={...}` expression. It does **not** correctly handle dot-nested paths like `!form.whatHappened.trim()` or `!fixForm.theirReaction.trim()` — it captures only `form`/`fixForm` as the variable name, then fails to find an input with `value={form}` (because the actual binding is `value={form.whatHappened}`), and silently skips the check. Tools that collect all user input into a single form object (common pattern for multi-field tools) will pass the audit despite missing every asterisk.

During audit, manually verify required-field asterisks by listing every submit button's `disabled={}` expression and tracing each negated variable back to its input label. If the asterisk isn't on the label, add it.

*Reference case: ApologyCalibrator (13 modes, 11 required fields bound to nested form state — `calForm.whatHappened`, `detectForm.draft`, `culForm.culture`, etc. — all passed structural audit, all were missing asterisks until manually corrected).*

---

### PF-16 · Reset Button — One, Top-Right, Always

Every tool has exactly **one** reset control. It lives in the top-right corner of the input card header, on the same row as the `<h2>` title. No other reset, "New", "Clear", or "Start Over" button may appear anywhere else in the tool.

**Scan:**
```bash
grep -n "handleReset\|onClick.*reset\|Start Over\|startOver" ComponentName.js | grep -i "button\|btn"
# Must return exactly 1 result
# More than 1 = duplicate reset buttons — FAIL
# Zero = no reset button — FAIL
```

**✅ Correct pattern:**
```jsx
<div className="mb-4 pb-3 border-b border-zinc-500">
  <div className="flex items-center justify-between">
    <div>
      <h2 className={`text-xl font-bold ${c.text} flex items-center gap-2`}>
        <span className="mr-2">{tool?.icon ?? '❓'}</span>{tool?.title ?? 'Fallback'}
      </h2>
      <p className={`text-sm ${c.textSecondary}`}>{tool?.tagline ?? 'Fallback tagline'}</p>
    </div>
    {(results || input.trim()) && (
      <button onClick={handleReset} className={`${c.btnSecondary} px-3 py-1.5 rounded-lg text-xs`}>
        ↺ Start Over
      </button>
    )}
  </div>
</div>
```

**❌ Wrong — reset in the submit row:**
```jsx
<div className="flex gap-3">
  <button onClick={handleAnalyze} className={`flex-1 ${c.btnPrimary}...`}>Analyze</button>
  <button onClick={handleReset} className={`${c.btnSecondary}...`}>New</button>  {/* ← WRONG */}
</div>
```

**❌ Wrong — reset inside the results block:**
```jsx
{results && (
  <div>
    ...
    <button onClick={handleReset}>Start Over</button>  {/* ← WRONG */}
  </div>
)}
```

**Critical values:**

| Rule | Requirement |
|------|-------------|
| **Count** | Exactly 1 reset button per tool |
| **Position** | Top-right of header `flex justify-between` row |
| **Visibility** | Hidden on fresh load; shown when `results` set or primary input has content |
| **Style** | Always `c.btnSecondary` — never `c.btnPrimary` |
| **Label** | Any clear label: "↺ Start Over", "New", "Clear", "Reset" |
| **Never in submit row** | The `flex gap-3` row at the bottom of inputs is for submit only |
| **Never in results block** | No reset inside `{results && (...)}` |

*Added v4.37, Session 100, April 2026.*

*Reference case: AwkwardSilenceFiller (conditional visibility guard checks multiple input sources before showing the button — `(results || panicResult || customContext.trim() || scenario || landmines.trim()) ? <button .../> : null` — so the button only appears once the user has started interacting, not on the blank initial state).*

---

### PF-17 · Try Example Button

A "Try Example" button pre-fills the form with a realistic, high-quality input that demonstrates what the tool can do. It lowers first-use friction and sets the quality bar for what good input looks like.

**When to include:**
- Multi-field tools where filling everything in feels daunting
- Tools with non-obvious input formats (e.g. "stopped at Season 3, Episode 4")
- Tools whose output quality depends heavily on rich, specific input
- Tools where a first-time user might not know how to start

**When to skip:**
- Single-input tools where the placeholder already does the job
- Random or generative tools with no meaningful input
- Tools with highly personal inputs where a generic example feels hollow

**Scan:**
```bash
grep -n "loadExample\|Try example\|EXAMPLES\b" ComponentName.js
# If the tool qualifies (see criteria above), one of these must be present
```

**Pattern — single mode:**
```js
// Module-level constant, above the component:
const EXAMPLE = {
  topic: 'Should cities ban cars from downtown cores?',
  position: 'Yes — the benefits outweigh the disruption',
};

// Inside component, after other handlers:
const loadExample = useCallback(() => {
  setTopic(EXAMPLE.topic);
  setPosition(EXAMPLE.position);
}, []);
```

**Pattern — multi-mode tool (keyed by active mode):**
```js
// Module-level constant, above the component:
const EXAMPLES = {
  show:   { title: 'Succession', stoppedAt: 'Season 2, Episode 7' },
  book:   { title: 'Project Hail Mary', stoppedAt: 'Chapter 15' },
  game:   { title: 'Elden Ring', stoppedAt: 'Just beat Rennala' },
  sports: { title: 'Boston Celtics', stoppedAt: 'December 2024' },
};

// Inside component, after other handlers:
const loadExample = useCallback(() => {
  const ex = EXAMPLES[mode];
  if (ex) { setTitle(ex.title); setStoppedAt(ex.stoppedAt); }
}, [mode]);
```

**Button placement — always secondary, alongside the submit button:**
```jsx
<div className="flex gap-2">
  <button
    onClick={handleSubmit}
    disabled={loading || !input.trim()}
    className={'flex-1 py-4 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all ' + (loading || !input.trim() ? c.btnDisabled : c.btnPrimary)}>
    {loading ? <><span className="animate-spin inline-block">{tool?.icon ?? '❓'}</span> Working...</> : <><span>{tool?.icon ?? '❓'}</span> Submit</>}
  </button>
  <button onClick={loadExample} className={'px-4 py-4 rounded-2xl text-xs font-bold ' + c.btnSecondary}>
    Try example
  </button>
</div>
```

**Rules:**

| Rule | Detail |
|------|--------|
| Always `c.btnSecondary` | Never `c.btnPrimary` — it is a helper, not the primary action |
| Fixed label | "Try example" — lowercase, no emoji, no variation |
| No disabled state | Always clickable, even if inputs already have content (just overwrites) |
| Module-level constant | `EXAMPLE` or `EXAMPLES` defined above the component, never inline |
| Realistic content | The example must produce genuinely useful output — not a toy demo |
| `useCallback` | `loadExample` must be wrapped in `useCallback` with mode/variant in dep array if multi-mode |

*Added v4.38 (Try Example), Session 101, April 2026.*

---

## CATEGORY COLOR MAP
> Reference data for `headerColor` in `tools.js`, panel tint hex values, and the gold AI-insight panel.
> Folded in from the former `CATEGORY-COLOR-MAP-2.md` (v4.38 consolidation).

### Overview

Each of DeftBrain's 17 tool categories belongs to one of 6 color families.
Category color appears in three places:

1. **Tool card header** — solid dark background on the dashboard card
2. **Results panel tint (L3)** — light tint for notable findings (max 2–3 per page)
3. **Results panel tint (L4)** — strong tint for the single most important panel (max 1 per page)

White and sand remain the default for all other panels (L1 and L2).
Gold is reserved for DeftBrain AI insights on any tool, regardless of category.

---

### Panel Hierarchy — applies to every tool

| Level | Background | Border | Usage | Limit |
|-------|-----------|--------|-------|-------|
| L1 | `#ffffff` | `#e8e1d5` | Default — supporting info | No limit |
| L2 | `#f3efe8` sand | `#e8e1d5` | Content groups, section breaks | No limit |
| L3 | Category light tint | Category light border | Notable findings | Max 2–3 per page |
| L4 | Category strong tint | Category strong border | Top insight — most important panel | Max 1 per page |
| ★ Gold | `#fdf4e8` | `#e8c98a` | DeftBrain AI insight — any tool | Max 1 per page |

---

### The 6 Color Families

#### 1. Navy — Work, Career, Productivity, Learning
Categories: The Grind · The Office · Do It! · Go Deep!

| Level | Hex | Usage |
|-------|-----|-------|
| L3 light tint | `#eef2f7` | Notable panel background |
| L3 border | `#c0cfe0` | Notable panel border |
| L4 strong tint | `#d4dde8` | Top insight background |
| L4 border | `#a8b9ce` | Top insight border |
| L4 text | `#1e2a3a` | Text on L4 background |
| Header dark | `#1e2a3a` | The Grind, Go Deep! |
| Header mid | `#2c4a6e` | The Office |
| Header light | `#4a6a8a` | Do It! |

---

#### 2. Forest — Body, Hobbies, Travel
Categories: Body · Pursuits · Out & About

| Level | Hex | Usage |
|-------|-----|-------|
| L3 light tint | `#edf4e8` | Notable panel background |
| L3 border | `#aacca0` | Notable panel border |
| L4 strong tint | `#ccdfc4` | Top insight background |
| L4 border | `#88b078` | Top insight border |
| L4 text | `#2a3820` | Text on L4 background |
| Header dark | `#2a3820` | Body |
| Header mid | `#3d5c2a` | Pursuits |
| Header light | `#567a3a` | Out & About |

---

#### 3. Teal — Focus, Mental, Speculation
Categories: Energy · Brain Games · What If?

| Level | Hex | Usage |
|-------|-----|-------|
| L3 light tint | `#e4f2f0` | Notable panel background |
| L3 border | `#8cc8c0` | Notable panel border |
| L4 strong tint | `#b8dcd8` | Top insight background |
| L4 border | `#5aaa9e` | Top insight border |
| L4 text | `#1e3030` | Text on L4 background |
| Header dark | `#1e3030` | What If? |
| Header mid | `#2a5248` | Energy |
| Header light | `#3a6e60` | Brain Games |

---

#### 4. Crimson — People, Emotion, Identity
Categories: Humans · Discourse · Me · Read the Room

| Level | Hex | Usage |
|-------|-----|-------|
| L3 light tint | `#f5eaea` | Notable panel background |
| L3 border | `#d4a0a0` | Notable panel border |
| L4 strong tint | `#e0b8b8` | Top insight background |
| L4 border | `#b87070` | Top insight border |
| L4 text | `#4a1e1e` | Text on L4 background |
| Header dark | `#4a1e1e` | Read the Room |
| Header mid | `#7a2e2e` | Humans · Me |
| Header light | `#9a4040` | Discourse |

---

#### 5. Amber — Creativity, Spontaneity
Categories: Veer · Detour

| Level | Hex | Usage |
|-------|-----|-------|
| L3 light tint | `#fdf4e8` | Notable panel background |
| L3 border | `#e8c98a` | Notable panel border |
| L4 strong tint | `#f5e0c0` | Top insight background |
| L4 border | `#d9a04e` | Top insight border |
| L4 text | `#63391e` | Text on L4 background |
| Header dark | `#7a4010` | Detour |
| Header mid | `#93541f` | Veer |
| Header light | `#b06d22` | (hover/accent use) |

---

#### 6. Deep Green — Money
Categories: Loot

| Level | Hex | Usage |
|-------|-----|-------|
| L3 light tint | `#e8f0e4` | Notable panel background |
| L3 border | `#98c090` | Notable panel border |
| L4 strong tint | `#c0d8b8` | Top insight background |
| L4 border | `#6aa060` | Top insight border |
| L4 text | `#1e3020` | Text on L4 background |
| Header dark | `#1e3020` | Loot (primary) |
| Header mid | `#2a4a2e` | Loot (alt) |
| Header light | `#3a6040` | (hover/accent use) |

---

### Gold AI Insight Panel — all tools

Reserved for DeftBrain's own top-level AI interpretation.
Appears on any tool regardless of category.

| Level | Background | Border | Label color | Text color |
|-------|-----------|--------|-------------|------------|
| L3 insight | `#fdf4e8` | `#e8c98a` | `#c8872e` | `#5a544a` |
| L4 top insight | `#f5e0c0` | `#d9a04e` | `#93541f` | `#3d3935` |

---

### Implementation — c block keys

Add these 6 keys to the standard c block for each tool,
using the hex values for that tool's category family:

```js
const c = {
  // ... standard keys ...

  // Panel tints — use values from tool's category family above
  panelTint:         isDark ? 'bg-[DARK_EQUIV]/30'  : 'bg-[L3_HEX]',
  panelTintBorder:   isDark ? 'border-[HEADER_MID]' : 'border-[L3_BORDER]',
  panelStrong:       isDark ? 'bg-[DARK_EQUIV]/60'  : 'bg-[L4_HEX]',
  panelStrongBorder: isDark ? 'border-[HEADER_LIGHT]': 'border-[L4_BORDER]',

  // Gold AI insight — identical across all tools
  panelInsight:       isDark ? 'bg-[#93541f]/25' : 'bg-[#fdf4e8]',
  panelInsightBorder: isDark ? 'border-[#c8872e]' : 'border-[#e8c98a]',
};
```

Example for a Navy tool (The Office):
```js
panelTint:         isDark ? 'bg-[#2c4a6e]/30' : 'bg-[#eef2f7]',
panelTintBorder:   isDark ? 'border-[#4a6a8a]' : 'border-[#c0cfe0]',
panelStrong:       isDark ? 'bg-[#2c4a6e]/60' : 'bg-[#d4dde8]',
panelStrongBorder: isDark ? 'border-[#6e8aaa]' : 'border-[#a8b9ce]',
```

Usage in JSX:
```jsx
{/* Standard panel — L1 */}
<div className={`${c.card} border ${c.border} rounded-lg p-4`}>

{/* Notable finding — L3 */}
<div className={`${c.panelTint} border ${c.panelTintBorder} rounded-lg p-4`}>

{/* Top insight — L4, one per page */}
<div className={`${c.panelStrong} border ${c.panelStrongBorder} rounded-lg p-4`}>

{/* DeftBrain AI insight — gold, any tool, one per page */}
<div className={`${c.panelInsight} border ${c.panelInsightBorder} rounded-lg p-4`}>
```

---

### Rules

1. Every tool belongs to exactly one category and uses that category's tints
2. L3 panels: max 2–3 per results page
3. L4 panels: max 1 per results page
4. Gold AI insight: max 1 per results page — always the DeftBrain interpretation
5. Category tints appear only on results panels — never on input/form areas
6. Dark mode uses opacity variants of the header color (`/30` for L3, `/60` for L4)
7. Amber tints and Gold AI insight tints are similar by design — Amber tools
   (Veer, Detour) use L4 strong tint `#f5e0c0`; Gold AI insight uses L3 `#fdf4e8`
   (lighter). One per page rule prevents them appearing together.
8. Never use category tints for semantic meaning (success/warning/error/info) —
   those always use the standard semantic colors regardless of category

---

## JUDGMENT-REQUIRED ITEMS
These cannot be auto-corrected — they require reading context:

- `headerColor` in `tools.js` uses the **dark** category hex, not the L4 pale tint (see Category Color Map section above)
- Cross-ref tool IDs actually exist in `tools.js`
- `useRegisterActions` content is meaningful (not empty string)
- History `preview` field truncates the right input
- Reset function clears all relevant state
- Mode-switching clears stale results
- All API result fields accessed with `?.`
- No references to psychological/medical diagnoses in metadata or UI copy

---
## CONVENTIONS Addendum — Session 101 Clarifications

### For merge into `CONVENTIONS.md`
### Supersedes conflicting text in `tool- audit-checklist-v4_39.md` §1.1

This addendum captures rule clarifications that emerged during audits where existing documentation was ambiguous or contradictory. Merge these edits into `CONVENTIONS.md` at next doc update. Every rule here is also enforced by `audit_v2-3-2.py` (v4.41+) unless otherwise noted.

---

## Clarification 1 · `label` is NOT a banned c-block key — it is a **required alias**

**Status:** Resolves conflict between `tool- audit-checklist-v4_39.md` §1.1 and `CONVENTIONS.md` PF-2.

The checklist lists `label` among banned c-block keys. This is **stale text**. The canonical rule per CONVENTIONS.md PF-2 is:

```javascript
// Always include these two alias lines immediately after the closing brace:
c.textMuteded = c.textMuted;
c.label = c.labelText;
```

Both aliases are **required**. They exist because historical Python refactor scripts generated code with those names, and removing them would cascade-break dozens of tools. The audit script's `BANNED_KEYS` constant does not and must not include `label`.

**Action:** When next editing `tool- audit-checklist-v4_39.md`, delete `label` from the §1.1 banned-key list.

---

## Clarification 2 · Banned color families — expanded list

**Status:** Tightens existing §1.1 / PF-2 banned-color rule.

The authoritative list of **banned** Tailwind color families:

| Banned | Notes |
|--------|-------|
| `blue` | All prefixes: `bg-`, `text-`, `border-`, etc. |
| `purple` | ″ |
| `violet` | ″ |
| `indigo` | ″ |
| `teal` | ″ |
| `stone` | ″ |
| `yellow` | ″ (use `amber` instead) |
| `rose` | **Newly documented** — use `amber` for required-field asterisks, `red` for danger/error |
| `pink` | **Newly documented** |

**Approved** families: `zinc`, `slate`, `cyan`, `emerald`, `amber`, `red`, `sky`, `green`, `gray`.

**`required` color specifically:** per PF-15, `c.required` must always use `text-amber-400` (dark) / `text-amber-500` (light). Not `rose`. Not `red`. Not `textMuted`.

**Enforcement:** `audit_v2-3-2.py` (v4.40+) catches all banned families including `rose`/`pink`/`border-*` variants. v4.39 and earlier missed these.

---

## Clarification 3 · Lookup objects must use `colorKey` indirection (BrainRoulette pattern)

**Status:** Reinforces existing checklist §1.1 rule.

Lookup objects like `SEVERITY_CONFIG`, `VERDICT_COLORS`, `STATUS_MAP` may **never** store raw Tailwind color strings in a `color` property. This bypasses the `c` theme object entirely.

```javascript
// ❌ WRONG — raw strings
const VERDICT = {
  mostly_false: { color: 'text-red-500' },                    // direct string
  mostly_true:  { color: (d) => d ? 'text-green-400' : 'text-green-600' }  // dark-aware fn
};

// ✅ CORRECT — colorKey indirection
const VERDICT = {
  mostly_false: { colorKey: 'verdictFalse' },
  mostly_true:  { colorKey: 'verdictTrue' },
};
// In c block:
verdictFalse: isDark ? 'bg-red-900/20 border-red-700/50 text-red-200' : 'bg-red-50 border-red-300 text-red-800',
verdictTrue:  isDark ? 'bg-green-900/20 border-green-700/50 text-green-200' : 'bg-green-50 border-green-300 text-green-800',
// In JSX:
className={`rounded-xl border p-5 ${c[VERDICT[key]?.colorKey] || c.text}`}
```

**Rationale:** Raw color strings in lookups aren't theme-aware, can't be audited, and bypass the single-source-of-truth c block. BrainRoulette and BeliefStressTest both hit this pattern during audits.

**Enforcement:** `audit_v2-3-2.py` (v4.40+) `S1.1j`.

---

## Clarification 4 · PF-16 reset conditional must use ternary, not `&&`

**Status:** Resolves a subtle interaction between PF-16 and S5.5 audit logic. CONVENTIONS.md's replace-mode section mentions this; lifting it to a universal rule.

Any JSX conditional whose expression contains the word `results` and uses the `&&` operator will trigger `audit_v2-3-2.py`'s S5.5 cross-ref region-split logic. This is true even when the conditional is unrelated to the results block:

```jsx
// ❌ BREAKS S5.5 region detection
{(results || belief.trim()) && (
  <button onClick={handleReset}>↺ Start Over</button>
)}

// ✅ SAFE
{(results || belief.trim()) ? (
  <button onClick={handleReset}>↺ Start Over</button>
) : null}
```

**Why it matters:** S5.5 classifies cross-references as pre-submit or post-submit based on the first `{results && (` it finds. A reset-button conditional that matches this pattern splits the region at the wrong point, causing legitimate pre-submit cross-refs to be misclassified as post-submit.

**Rule:** Whenever a JSX conditional includes `results` or `result` in its expression, use ternary (`? ... : null`) not `&&`. This applies to:
- PF-16 header reset button conditionals
- Any `{(results || x) && ...}` pattern in headers, sidebars, or shared UI
- Any `{(!results || x) && ...}` pattern in the same positions

The only place `&&` is safe with `results` is the canonical results block itself: `{results && (<div>...results UI...</div>)}`.

**Enforcement:** Not directly enforced by v4.41, but symptoms (S5.5 misclassification) surface quickly if ignored. A targeted check could be added in v4.42.

---

## Clarification 5 · Icon and title fallbacks must match `tools.js`

**Status:** Formalizes a previously-implicit expectation.

The component's fallback values for `tool?.icon ?? '...'` and `tool?.title ?? '...'` must match what `tools.js` declares for that tool. Mismatches are silent drift — the component ships with `🧪` as a fallback even after the tool's canonical icon is changed to `🔬` in `tools.js`, and nothing in the build or test pipeline flags the discrepancy.

```javascript
// tools.js
{ id: "BeliefStressTest", icon: "🔬", title: "Belief Stress Test", ... }

// Component — MUST match:
<span className="mr-2">{tool?.icon ?? '🔬'}</span>{tool?.title ?? 'Belief Stress Test'}
```

**Enforcement:** `audit_v2-3-2.py` (v4.40+) `S0f` — compares every `tool?.icon ??` and `tool?.title ??` fallback in the component against `tools.js` metadata for that tool's id.

---

## Clarification 6 · History preview length ≈ 40 characters

**Status:** Tightens existing checklist §1.5.

The `preview` field of a history entry should be sliced to **~40 characters** (acceptable range: 30–60). A 6-char preview (found in BeliefStressTest pre-audit) is too short to be meaningful; a 100-char preview is too long to fit in the history panel.

```javascript
const newEntry = {
  id: Date.now(),
  timestamp: new Date().toISOString(),
  preview: belief.trim().slice(0, 40),   // ← 40 is the sweet spot
  result: data,
};
```

**Enforcement:** `audit_v2-3-2.py` (v4.41+) flags preview slices outside 20–80 characters.

---

## Clarification 7 · Global keyboard handler guards on SELECT only

**Status:** Formalizes a pattern already in PF-style tools; tightens S2.1.

The global `keydown` listener for ⌘/Ctrl+Enter submit must **not** block when the user is typing in an input or textarea. Over-broad guards defeat the purpose of the shortcut:

```javascript
// ❌ WRONG — shortcut doesn't work while user is typing in the primary input
const handler = (e) => {
  const tag = document.activeElement?.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && canSubmitRef.current) {
    e.preventDefault();
    handleSubmitRef.current?.();
  }
};

// ✅ CORRECT — only SELECT dropdowns swallow Enter
const handler = (e) => {
  const tag = document.activeElement?.tagName;
  if (tag === 'SELECT') return;
  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && canSubmitRef.current) {
    e.preventDefault();
    handleSubmitRef.current?.();
  }
};
```

**Rationale:** The whole point of ⌘/Ctrl+Enter is that it works everywhere including while typing. Input/textarea guards make it redundant with the local `onKeyDown={...}` handlers that already fire there.

**Enforcement:** `audit_v2-3-2.py` (v4.41+) flags `tag === 'INPUT'` or `tag === 'TEXTAREA'` inside a keyboard handler.

---

## Clarification 8 · Python-replace corruption typos are a detectable class

**Status:** New diagnostic category.

When a historical find/replace script ran twice by accident, it produced self-doubling class names that resolve silently to `undefined` in Tailwind:

| Corrupted name | Correct name |
|----------------|--------------|
| `btnPrimaryPrimary` | `btnPrimary` |
| `btnPrimarySecondaryondary` | `btnSecondary` |
| `btnSecondaryondary` | `btnSecondary` |
| `textSecondaryondary` | `textSecondary` |
| `textMutedMuted` | `textMuted` |
| `borderBorder` | `border` |
| `cardCard` | `card` |

These break tool styling silently. BeliefStressTest pre-audit had 5 instances across 3 typo classes.

**Enforcement:** `audit_v2-3-2.py` (v4.41+) PF-12 — flags any of the known typo patterns.

---

## Source-of-truth precedence (formalized)

When documentation conflicts:

1. **`CONVENTIONS.md`** — authoritative canonical spec
2. **`audit_v2-3-2.py` source** — source of truth for automated enforcement (especially `BANNED_KEYS`, `BANNED_COLORS`, `REQUIRED_KEYS` constants at the top)
3. **`tool- audit-checklist-v4_39.md`** — manual checklist; portions may be stale
4. **`backend-audit-section7.md`** — backend-specific addendum to the checklist

On conflict: check the audit script's constant arrays as the tiebreaker. Whatever the script actually enforces is the working rule.

---

## audit_v2-3-2.py version history (recent)

| Version | Added |
|---------|-------|
| v4.38 | S5.5 per-cluster rule (max 3 hrefs per 5-line window, replacing max-3-per-tool) |
| v4.39 | S1.4g (inline `<PrintBtn>`), S1.4h (whole-output `<CopyBtn>` helpers) |
| v4.40 | S0f (icon/title fallback vs tools.js), S1.1i (undefined c keys), S1.1j (raw Tailwind in lookups), expanded BANNED_COLORS with rose+pink+border variants |
| v4.41 | PF-12 (Python-replace typos), PF-16 (reset button placement + count + style), S2.1 (INPUT/TEXTAREA guard), S1.5 (preview slice length) |

---

*Addendum prepared 2026-04-18, merged into CONVENTIONS.md (v1.1, 2026-04-24). The script formerly named `audit_v2-3.py` is now `audit_v2-3-2.py`.*
