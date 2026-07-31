# DeftBrain link map

Generated 2026-07-31 from the working tree (`public/guides/**`, `public/*.html`,
`src/tools/*.js`, `src/data/tools.js`). Reflects the **uncommitted** guide-link
change: all 552 guides now serve as standalone pages, 440 of them `noindex`,
with the consolidated-guide 301 middleware disabled.

## Page inventory

| Kind | Count | Indexable | Noindexed |
|---|---:|---:|---:|
| Tool pages (`/<ToolId>`) | 125 | 37 | 88 |
| Guides (`/guides/<cat>/<slug>`) | 552 | 112 | 440 |
| Category hubs (`/guides/<cat>`) | 18 | 18 | — |
| Guide indexes (`/guides`, `/guides/by-tool`) | 2 | 2 | — |
| Static (`/`, `/about`, `/privacy`, `/terms`) | 4 | 4 | — |
| **Total addressable pages** | **701** | **173** | **528** |

## Link totals

**107,454 links · 105,114 unique edges**

| By protocol | Count |
|---|---:|
| Internal | 106,886 |
| `mailto:` | 564 |
| External | 4 |

| By source page | Count | Note |
|---|---:|---|
| Guides | 106,986 | ~194 links/page — every guide carries the full tool index in its chrome |
| Tool pages | 426 | cross-references between tools |
| Static | 42 | |

| Internal target status | Count |
|---|---:|
| ok → indexable page | 27,416 |
| ok → noindexed page | 75,570 |
| ok → hub / index / static | 3,890 |
| **BROKEN** | **10** |

## Edge types

| Edge | Count |
|---|---:|
| Guide → tool | 71,760 |
| Guide → guide | 33,018 |
| Tool → tool | 426 |

The guide→tool figure is dominated by the shared tool index in guide chrome,
not by editorial links. Editorial CTAs are one per guide (`spec.cta.toolId`).

## External links (only 4 sitewide)

| Domain | Where |
|---|---|
| `saashub.com` | footer badge (React footer, not in the static scan) |
| `tinystartups.com` | `/about` |
| `anthropic.com`, `railway.com`, `buttondown.com` | colophon / infrastructure credits |

This is the backlink problem seen from the inside: the site is almost entirely
self-referential, which is correct for internal linking but means there is
nothing here that earns authority.

---

## Defects found

### 1. `/Recall` — 404 in production, linked from 5 live guides

`Recall` is not in `src/data/tools.js` and has no redirect. Verified live:
`https://deftbrain.com/Recall` → **404**.

Five learning guides carry it as their editorial CTA (`spec.cta.toolId`), so
each renders a call-to-action for a tool that does not exist:

- `/guides/learning/how-to-extract-the-important-parts-from-a-long-lecture`
- `/guides/learning/how-to-know-whats-going-to-be-on-the-test`
- `/guides/learning/how-to-study-when-you-have-hours-of-recorded-content`
- `/guides/learning/how-to-take-notes-from-a-lecture-you-missed`
- `/guides/learning/how-to-turn-a-transcript-into-a-study-guide`

The CTA copy describes a real product ("four modes: Distill, Study Guide, Test
Prep, Connect"), so this reads as a tool that was specced and either renamed or
never shipped. Needs a decision: repoint to an existing tool, add a redirect, or
build it.

### 2. `/RoomReader` — stale, 301s

Five conversation guides link to `/RoomReader`, which `backend/server.js:205`
redirects to `/ReadTheRoom`. Users get there, but every visit costs a redirect
hop and the guide sources still carry the pre-rename id. Cosmetic; fix at the
source when convenient.

---

## Structural note: guide output is split across two directories

- `build-guides.js` → `public/guides/**` (the 552 guide pages)
- `build-guides-indexes.js` → `build/guides/**` (`index.html`, `by-tool.html`, 18 hubs)

This works only because of ordering — `prebuild` and `build` run first, CRA
copies `public/` into `build/`, and `postbuild` then writes the indexes directly
into `build/`. Running `build-guides-indexes.js` on its own updates `build/`,
which the next `react-scripts build` wipes. Worth knowing before debugging a
"my index change didn't appear" symptom.

## Method / limits

- Tool-page links are extracted from JSX `href="..."` literals in
  `src/tools/*.js`; dynamically-constructed hrefs are not captured.
- The React app shell (header, footer, DashBoard) is not in the static scan, so
  the SaaSHub footer badge and in-app nav are under-counted.
- Anchor fragments are resolved to their page, not verified against the `id`
  present on that page.
