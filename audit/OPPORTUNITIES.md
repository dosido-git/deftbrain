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

### 1. Locale selectors: 16px tap target — MEDIUM, every page

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

### 2. Small text below 12px — LOW/MEDIUM

| Where | Size |
|---|---|
| `deft (adj.) — skillful…` in **GlobalHeader / BrandMark** | 10–11px |
| Category badge (`Loot`) on tool pages | 10px |
| Dashboard | ~190 elements under 12px |

The tool-page instance of the *deft* line was raised to 12px on 2026-07-30
(`2da35e34`); the header/brandmark instances were not, and still render 10–11px.
Same fix, same reasoning, not yet applied.

### 3. Dashboard density — MEDIUM, mobile

At 454px: **31 controls under 40px** and ~190 text nodes under 12px. The
dashboard is the entry point for anyone arriving at the root domain, and it is
the densest page on the site at mobile width.

### 4. Static sweep — clean apart from three cosmetic items

| Check | Result |
|---|---|
| R2 tools with no cross-reference out | **0** |
| R3 tools with no copy/share/print | **0** |
| R4 guides missing the cite block | **0** (all 552) |
| R5 dead `href` | 0 |
| R6 `target=_blank` without `rel=noopener` | 0 |
| R7 `<img>` without `alt` | 0 |
| R1 `copyLabel` / `printLabel` / `resultsRef` | 0/126 each |

`resultsRef` is the only one of the three worth a second look: `PrintBtn`
accepts it to print the **rendered** results element, and with none supplied
every tool prints from the plain-text export instead. That may well be
deliberate — text prints more predictably than a React tree — but if print
output is meant to include cards and layout, it currently cannot.

---

## Not verified — do not treat as clean

- **True desktop layout.** The browser pane capped at ~450px wide; the
  "desktop" preset reported a 253px viewport. Every desktop-specific finding in
  this document is therefore untested, including the one overflow warning,
  which is an artefact of the narrow pane rather than a real defect.
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
