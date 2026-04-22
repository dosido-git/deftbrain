<!-- v1.0 · 2026-04-20 · ground-zero baseline -->
# DeftBrain Category Color Map

**Version:** 2.0 — March 2026
**Status:** Approved for implementation in Phase 2 color migration

---

## Overview

Each of DeftBrain's 17 tool categories belongs to one of 6 color families.
Category color appears in three places:

1. **Tool card header** — solid dark background on the dashboard card
2. **Results panel tint (L3)** — light tint for notable findings (max 2–3 per page)
3. **Results panel tint (L4)** — strong tint for the single most important panel (max 1 per page)

White and sand remain the default for all other panels (L1 and L2).
Gold is reserved for DeftBrain AI insights on any tool, regardless of category.

---

## Panel Hierarchy — applies to every tool

| Level | Background | Border | Usage | Limit |
|-------|-----------|--------|-------|-------|
| L1 | `#ffffff` | `#e8e1d5` | Default — supporting info | No limit |
| L2 | `#f3efe8` sand | `#e8e1d5` | Content groups, section breaks | No limit |
| L3 | Category light tint | Category light border | Notable findings | Max 2–3 per page |
| L4 | Category strong tint | Category strong border | Top insight — most important panel | Max 1 per page |
| ★ Gold | `#fdf4e8` | `#e8c98a` | DeftBrain AI insight — any tool | Max 1 per page |

---

## The 6 Color Families

### 1. Navy — Work, Career, Productivity, Learning
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

### 2. Forest — Body, Hobbies, Travel
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

### 3. Teal — Focus, Mental, Speculation
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

### 4. Crimson — People, Emotion, Identity
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

### 5. Amber — Creativity, Spontaneity
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

### 6. Deep Green — Money
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

## Gold AI Insight Panel — all tools

Reserved for DeftBrain's own top-level AI interpretation.
Appears on any tool regardless of category.

| Level | Background | Border | Label color | Text color |
|-------|-----------|--------|-------------|------------|
| L3 insight | `#fdf4e8` | `#e8c98a` | `#c8872e` | `#5a544a` |
| L4 top insight | `#f5e0c0` | `#d9a04e` | `#93541f` | `#3d3935` |

---

## Implementation — c block keys

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

## Rules

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
