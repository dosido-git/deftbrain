# Site-wide opportunity audit

2026-08-01. Two halves: a static sweep (`scripts/audit-opportunities.js`, whole
site) and a browser sweep at mobile width (sampled).

**Why this exists.** The five gates verify code is *correct and conventional*.
They cannot see a capability that exists but is never *reached*. Three bugs in
two days came from that blind spot — `shareUrl` accepted by every tool and
passed by none, PlainTalk's PDF handler that had never once worked, and 440
guide links labelled as guides that led to summaries. None is a lint error, a
schema mismatch, or a golden regression.

---

## Verified findings

### 1. Locale selectors: 16px tap target — FIXED 2026-08-01

Resolved in `LocaleSelectors.js`. Original finding kept below for the record.

The select is now absolutely positioned over the whole pill at opacity 0 with
`-inset-px` (an absolutely positioned box lays out against the ancestor's
PADDING box, so `inset-0` would leave the 1px border ring uncovered), and the
chosen value renders as ordinary text beside the glyph. Verified by
`elementFromPoint` at the caret, both far corners and the centre — every probe
returns the select. Pill height 26px → 32px, which clears WCAG 2.2 AA's 24px
floor but is still under Apple's 44px guidance; going further would change
header density, so it was left as a separate decision.

Side effect worth having: the pills got NARROWER, 305px combined → 165px,
because the value renders as truncated text rather than the native select
sizing to its widest option.

#### Original finding — 16px tap target, every page

`src/components/LocaleSelectors.js`. The `<select>` carries no vertical
padding, so the actual hit area is **16px tall** inside a 26px decorative pill.

- Apple's touch-target guidance: 44×44pt
- WCAG 2.2 AA minimum: 24×24 CSS px

The pill *looks* tappable at 26px but the pill is not the control — tapping its
padding does nothing. This is on every page of the site, in the header, and it
is the single most-used control by anyone who wants a language other than
English. Given 13 languages are a headline claim, a 16px language switcher is
the worst place on the site to have this.

Fix is a judgment call on header density, so it is not applied here: either
stretch the select to fill the pill, or overlay a transparent full-bleed select
and render the current value as text.

### 2. Small text below 12px — FIXED 2026-08-01 (deft line)

| Where | Size |
|---|---|
| `deft (adj.) — skillful…` in **GlobalHeader / BrandMark** | 10–11px |
| Category badge (`Loot`) on tool pages | 10px |
| Dashboard | ~190 elements under 12px |

The tool-page instance was raised to 12px on 2026-07-30 (`2da35e34`); the
`BrandMark` (all three sizes) and `GlobalHeader` (scrolled and unscrolled)
instances were missed and still rendered 10–11px. Now 12px everywhere.
The ~190 dashboard elements under 12px are labels and metadata, not the brand
line, and are left as-is.

### 3. Dashboard header collides with the brandmark at 390px — FIXED 2026-08-01

At 390px the locale pills sit on top of the "DeftBrain" wordmark on the
dashboard: the brand block and the pills compete for one row and neither wraps.
Pre-existing, and improved rather than caused by the tap-target fix (pills went
305px → 165px combined), but still visibly overlapping.

Fixed by stacking below `sm`: brand on its own row, pills right-aligned on the
next — which is what `ToolPageWrapper` already did on mobile, so the dashboard
was the only surface with the bug. Verified at 390px (overlap NONE, no
horizontal scroll) and at 900px (still one row, pills right, overlap NONE).

### 4. Dashboard controls under 40px — TRIAGED 2026-08-01

31 controls measured under 40px at 390px. Broken down, most are fine:

| Count | Height | What |
|---:|---:|---|
| 21 | 35px | tool-list links in the catalog grid |
| 6 | 32px | footer nav (Find a Tool, Guides, About) |
| 2 | 32px | locale pills (raised from 26px) |
| 1 | **20px** | "or describe your problem" CTA, on the fold |
| 1 | **13px** | "browse all N →" guides-hub link |

Apple's 44px is guidance for standalone targets; WCAG 2.2 AA's binding floor is
24px. The 35px and 32px groups clear it comfortably and sit in list contexts
with separated neighbours — left alone deliberately.

The last two did NOT clear it and are fixed: both got padding with a
compensating negative margin, so the hit box grows without changing type size
or layout. The CTA is now 44px. Controls under 24px on the dashboard: **0**.

### 5. Static sweep — clean apart from three cosmetic items

| Check | Result |
|---|---|
| R2 tools with no cross-reference out | **0** |
| R3 tools with no copy/share/print | **0** |
| R4 guides missing the cite block | **0** (all 552) |
| R5 dead `href` | 0 |
| R6 `target=_blank` without `rel=noopener` | 0 |
| R7 `<img>` without `alt` | 0 |
| R1 `copyLabel` / `printLabel` / `resultsRef` | 0/126 each |

**Correction (2026-08-01).** An earlier version of this section claimed
`resultsRef` at 0/126 meant print never showed rendered results. That was
wrong. `PrintBtn`'s signature is `({ label })` — it never accepted a ref. It
prints the **rendered page** via `window.print()` plus the print CSS in
`ToolPageWrapper`: `data-print-hide` drops the chrome, `data-print-main`
expands the tool's output to full width, backgrounds go white. Printing has
always done exactly what it is meant to do.

What was actually there: `ActionBar` declared `resultsRef` and forwarded
`content`, `resultsRef` and `title` to a component that accepts none of them.
Three dead props — harmless at runtime, and precisely what produced the false
finding. Removed.

Lesson for the audit: a prop being *declared* is not evidence a capability
*exists*. The R1 check now reads the consumer's signature, and the `resultsRef`
probe is deleted rather than left to re-manufacture the same error.

`copyLabel` and `printLabel` remain unsupplied at 0/126 — genuinely cosmetic,
the buttons read "Copy" and "Print" rather than naming their content.

---

## Not verified — do not treat as clean

- **Wide-viewport coverage is thin, not absent.** An earlier note here claimed
  the browser pane could not exceed ~450px. That was wrong — it resizes to
  1440px fine; the 253px reading came from the "desktop" preset, which restores
  the pane's own width rather than setting a desktop one. Checked at 1440px:
  no horizontal overflow, deft line 12px. But only the dashboard was checked
  there, so tool and guide pages remain unverified at desktop width.
- **Real-device behaviour.** Tap targets were measured geometrically, not by
  tapping. iOS Safari in particular applies its own minimum hit-slop that can
  rescue a small control.
- **Coverage.** The browser half sampled the dashboard and two tool pages, not
  125 tools and 552 guides.

## Cheapest durable fix for the underlying blind spot

None of the three recent bugs would have been caught by more static analysis;
each needed someone to use the feature. The audit kit already has a MOBILE
phase — adding two lines to it closes most of the gap:

1. Tap **Share** and confirm what actually arrives (link present? preview card?).
2. Upload the file type the tool accepts and confirm the content was read, not
   just accepted.
