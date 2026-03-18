# DeftBrain Session 81 Handoff

## Session Focus
Color system design, panel hierarchy, tool re-audit workflow, and critical bug fixes.

---

## Color System — FINALIZED

### Category Color Map (v2.0)
File: `src/data/CATEGORY-COLOR-MAP.md`
Visual reference: `src/data/deftbrain_category_color_map_visual.html`

**6 families, 17 categories:**

| Family | headerColor | Categories |
|--------|------------|-----------|
| Navy | `#d4dde8` | The Grind, The Office, Do It!, Go Deep! |
| Forest | `#ccdfc4` | Body, Pursuits, Out & About |
| Teal | `#b8dcd8` | Energy, Brain Games/Diversions, What If?, Mind |
| Crimson | `#e0b8b8` | Humans, Discourse, Me, Read the Room |
| Amber | `#f5e0c0` | Veer, Detour |
| Deep Green | `#c0d8b8` | Loot |

### Panel Hierarchy (per tool results page)
| Level | Background | Usage | Limit |
|-------|-----------|-------|-------|
| L1 | `#ffffff` white | Default panels | No limit |
| L2 | `#f3efe8` sand | Content groups | No limit |
| Light tint | Category light tint | Notable findings | Max 2–3/page |
| Strong tint | Category strong tint | Top insight | Max 1/page |
| ★ Gold | `#fdf4e8` | DeftBrain AI insight | Max 1/page |

**Panel tint rule:** Panels should be noticeably lighter than the header color.
For teal example: header `#b8dcd8` → strong panel `#f0f8f6` → light panel `#fafefe`

### Semantic Colors (Direction A — messages)
```js
success: isDark ? 'border-emerald-600 text-emerald-300' : 'border-emerald-600 text-emerald-700',
warning: isDark ? 'border-amber-500 text-amber-300'    : 'border-amber-500 text-amber-700',
danger:  isDark ? 'border-red-600 text-red-300'        : 'border-red-600 text-red-700',
infoBox: isDark ? 'border-sky-500 text-sky-300'        : 'border-sky-600 text-sky-700',
```
Used as: `<div className={`${c.card} ${c.danger} border border-l-4 rounded-lg p-4`}>`

### Banned Pale Fills
These are BANNED as backgrounds everywhere:
`bg-green-50`, `bg-emerald-50`, `bg-teal-50`, `bg-amber-50`, `bg-yellow-50`,
`bg-red-50`, `bg-rose-50`, `bg-pink-50`, `bg-blue-50`, `bg-sky-50`, `bg-cyan-50`, `bg-indigo-50`

**Note:** `-100` variants ARE allowed for small badges/pills. Only `-50` is banned.

---

## Header Color System — WIRED UP

### tools.js
Every tool now has `headerColor` field based on primary category.
All 120 tools updated. Example:
```js
{
  id: "WrongAnswersOnly",
  categories: ['What If?', 'Detour'],
  headerColor: "#b8dcd8",
  ...
}
```

### ToolPageWrapper.js
- Restored to original structure: category badge, title, description above card
- Colored gradient band added at top of tool card using `detectedTool?.headerColor`
- Auto-detects light vs dark headerColor and switches text color accordingly
- Gradient fades from headerColor at top to transparent at ~260px

### DashBoard.js
- Icon badge background uses `tool.headerColor + '22'` (13% opacity tint)
- Falls back to `CLR.navy50` for tools without headerColor

---

## Audit Script — audit_v2.py
Two false positives fixed this session:
1. `bg-cyan-50` was matching `bg-cyan-500` — added `(?![0-9])` lookahead
2. Tailwind arbitrary hex `bg-[#hex]` was flagged — added `[` prefix check to skip

Current banned fills check uses word boundary to avoid false positives.

---

## Re-Audit Workflow

### Process (one tool at a time)
1. User uploads file from `src/tools/`
2. Run audit script manually (tool must be in `/home/claude/` working dir)
3. Fix all failures in one pass
4. Add/update `headerColor` in `tools.js` based on primary category
5. Output fixed tool file + updated tools.js
6. User deploys

### Audit scope per tool
- All audit script failures
- Runtime crashes (TDZ, missing export, wrong component name)
- Banned pale fills → replace with category tint equivalents
- Category assignment confirmed in tools.js
- headerColor set in tools.js

### Tools completed this session
| Tool | Status | Notes |
|------|--------|-------|
| WrongAnswersOnly | ✅ Clean | Reference implementation for teal family |
| RulebookBreaker | ✅ Fixed | TDZ: useClaudeAPI before useEffect, typos fixed |
| LayoverMaximizer | ✅ Fixed | TDZ: useEffect after all useCallbacks |
| PetWeirdnessDecoder | ✅ Fixed | Missing export default |
| SafeWalk | ✅ Fixed | 24 lucide icons → emoji, { tool } prop added |
| PlantRescue | ✅ Fixed | Import order, pale fills, semantic colors |

### Re-audit order
Reverse alphabetical. Next up after WrongAnswersOnly: **VirtualBodyDouble**, then **VelvetHammer**, etc.

---

## WrongAnswersOnly — Reference Implementation (Teal Family)

Final approved values:
```js
// In c block:
success: isDark ? 'bg-[#2a5248]/30 border-[#3a6e60] text-[#e4f2f0]' : 'bg-[#fafefe] border-[#b8dcd8] text-[#1e3030]',
warning: isDark ? 'bg-[#2a5248]/60 border-[#5aaa9e] text-[#e4f2f0]' : 'bg-[#f0f8f6] border-[#8cc8c0] text-[#1e3030]',
danger:  isDark ? 'bg-[#2a5248]/30 border-[#3a6e60] text-[#e4f2f0]' : 'bg-[#fafefe] border-[#b8dcd8] text-[#1e3030]',
infoBox: isDark ? 'bg-[#1e3030]/60 border-[#3a6e60] text-[#e4f2f0]' : 'bg-[#f0f8f6] border-[#8cc8c0] text-[#1e3030]',
```

In tools.js: `headerColor: "#b8dcd8"`

---

## Files Updated This Session

| File | Location | Status |
|------|----------|--------|
| WrongAnswersOnly.js | src/tools/ | ✅ Clean |
| RulebookBreaker.js | src/tools/ | ✅ Fixed |
| LayoverMaximizer.js | src/tools/ | ✅ Fixed |
| PetWeirdnessDecoder.js | src/tools/ | ✅ Fixed |
| SafeWalk.js (frontend) | src/tools/ | ✅ Fixed |
| PlantRescue.js | src/tools/ | ✅ Fixed |
| tools.js | src/data/ | ✅ headerColor added to all 120 tools |
| ToolPageWrapper.js | src/components/ | ✅ Header gradient wired up |
| DashBoard.js | src/components/ | ✅ Icon tint wired up |
| audit_v2.py | src/data/ | ✅ False positives fixed |
| COLOR-STYLE-GUIDE.md | src/data/ | ✅ Updated with banned fills rule |
| CATEGORY-COLOR-MAP.md | src/data/ | ✅ v2.0 finalized |
| deftbrain_category_color_map_visual.html | src/data/ | ✅ Visual reference with swatches |

---

## Key Rules (Always Follow)

1. **No lucide-react** — all icons are emoji in `<span>` tags
2. **ActionButtons** from `'../components/ActionButtons'`: CopyBtn, PrintBtn, ShareBtn, ActionBar
3. **Dark mode** via `useTheme()` → `isDark` with `c = {}` color config
4. **BRAND** = `'\n\n— Generated by DeftBrain · deftbrain.com'`
5. **No banned pale fills** (`-50` variants of green/amber/red/blue families)
6. **`{ tool }` prop** in component signature
7. **useClaudeAPI before useEffect** — never reference loading/handlers before declaration
8. **Panel colors** use category family tints, always lighter than header
9. **headerColor** in tools.js drives both DashBoard icon tint and ToolPageWrapper gradient
10. **No references to psychological maladies**
11. **Provide metadata only for the tool in question**, not the whole tools.js

---

## Outstanding Work

### Re-audit (reverse alpha, one at a time)
Completed: WrongAnswersOnly
Remaining: ~115 tools starting from VirtualBodyDouble

### Phase 2 (after re-audit complete)
- Apply category panel tints to all tool result panels
- Migrate remaining tools to warm sand color system (where still using cool grays)
- Full dark mode QA pass

### Known Issues
- SafeWalk backend Express router still lives in src/tools/ — needs moving to server routes
- Some tools may still have duplicate title/tagline headers now that ToolPageWrapper shows its own header
