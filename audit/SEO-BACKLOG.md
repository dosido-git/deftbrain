# SEO Backlog

Living list of SEO issues, what's fixed, and what's open. Born from the **May 29, 2026
indexing flip**: Google Search Console went from 582 indexed / 130 not-indexed to
160 / 552 overnight — all "Crawled – currently not indexed." Root cause: a large
programmatic footprint (~129 tool pages + ~569 guide pages ≈ 700 URLs) on a domain
still building authority, with the **guides orphaned** (homepage + tool pages linked
to zero of them). Google rationed indexing.

---

## ✅ Fixed (June 2026)

- **Guides internal-linking (orphan fix)** — `29baa81`. Tool pages now show a "Related
  guides" block (their own guides via `cta.toolId`); homepage links the `/guides` hub +
  a topic-varied sample. All 697 sitemap URLs now reachable from the homepage (depth:
  137 @1 click, 410 @2, 150 @3). Both blocks live in the persistent footer (crawlable +
  user-visible, doesn't touch the React tool UI).
- **Orphan guard in build** — `2e55d2d`. `scripts/check-orphans.js` BFS-crawls the
  prerendered build from the homepage and **fails the build** if any sitemap URL is
  unreachable. Wired into `postbuild`. Prevents a whole content type silently orphaning
  again. (`--max-depth N` also warns on pages drifting too deep.)

## ✅ Verified healthy (don't spend effort here)

- Tool `<title>` tags: 129/129 unique.
- Sitemap `lastmod`: real per-guide dates from `spec.modified` (not build-date).
- Guides carry proper `HowTo` + `BreadcrumbList` structured data.
- Tool pages have real prerendered body content (overview + how-to + example + tips);
  127/127 have a substantial overview. The duplicate signal is the shared footer index,
  not the bodies.
- **Soft-404:** `backend/server.js` returns HTTP 404 for unknown routes (`:315`, `:167`).
  Not the "200 for everything" SPA trap.
- **Code-splitting:** `ToolRenderer` lazy-loads each tool (`lazy(() => import(...))`) —
  tools are separate chunks, not one bundle.

---

## 🔴 Open — strategic (the important ones)

### 1. International search visibility — localization is invisible to Google  *(highest strategic impact; needs a product decision)*
We localized ~81 tools into 13 languages, but: **0 hreflang tags, 0 per-language URLs**,
and translated text is **not in the prerendered HTML** — it's injected client-side from
`localStorage`, which Googlebot never sets. So Google only sees English; the localization
helps in-app users but earns **zero** search traffic in other languages.
- **To actually rank internationally:** per-language URLs (e.g. `/es/PlantRescue`),
  localized prerendered HTML per language, and `hreflang` alternates across all versions.
- **Decision needed first:** is non-English organic search even a goal? If not, leave as-is
  (it's a valid client-side-i18n choice) and treat localization as a pure UX feature.

### 2. Scaled-content / "helpful content" scrutiny  *(the deeper cause behind the flip)*
569 templated guides + 129 templated tools on a young-authority domain is exactly what
Google's scaled-content systems ration. The orphan fix removed the *technical* blocker;
the *quality/authority* judgment remains.
- Prune or consolidate the weakest/near-duplicate guides; fewer-but-stronger > more.
- Deepen differentiation (unique data/POV a crawler won't find on 50 other sites).
- Earn external authority (the most decisive "index this deeply" signal).
- Reset the success metric: 160–300 of ~700 indexed is normal, not failure.

### 3. E-E-A-T / YMYL trust signals  *(caps rankings for advice tools)*
Several tools give "Your Money or Your Life" advice — MentalHealthNavigator, ContractDecoder,
GriefGuide, finance tools. Google holds these to a higher trust bar. Add visible
author/organization info, an About page, credentials, and sourcing, or rankings stay capped
regardless of page quality.

### 4. Near-duplicate guides → self-cannibalization
Clusters of close variants (e.g. "how to write a recommendation letter" + "...for a coworker"
+ "...when you don't know them well") can split signals and compete for the same query.
Audit for over-fragmented topics; consolidate where they target one intent.

## 🟡 Open — minor / nice-to-have

- **Main JS bundle ~835 KB** (core/vendor; tools already lazy). Trim vendor / audit shared
  deps to improve mobile LCP/INP. Low priority.
- **Soft-404 edge case:** confirm non-prerendered *valid-looking* routes return the right
  status (`server.js:303–308`), not an accidental 200. 1-line check.

## 🔧 Pending (non-SEO, already flagged elsewhere)

- **HistoryToday broken endpoints** — frontend calls `sessionHistory-today*` but routes are
  `history-today*` (bad find/replace). Tool is non-functional. (Spawned task chip.)

---

## Process lesson (why #1 of the flip slipped)
Internal linking was solved *per-silo* (tools de-orphaned via the all-tools footer; guides
cross-linked to each other) but never *across* silos — a self-referential cluster feels
"linked" but has no inbound authority. The 30-second check that would have caught it:
**"From the homepage, how do you click to a guide?"** Now automated by `check-orphans.js`.
