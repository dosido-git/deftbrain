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
- **SPA-nav footer leak (per-route link blocks)** — June 2026. The Related-tools /
  Related-guides (tool pages) and Guides sample (homepage) blocks used to live OUTSIDE
  `#root`, so the first-loaded page's footer persisted (stale) across in-app navigation
  — e.g. the homepage's 10-guide sample showing on every tool page. Fix: those blocks
  now render INSIDE `#root` in the prerender, and `src/components/RelatedLinks.js`
  renders the equivalent crawlable links **per route** (reads `/guides-manifest.json` +
  `tools.js`). React (`createRoot`) replaces the static blocks on mount and updates them
  on every navigation. The global all-tools index stays outside `#root` (identical on
  every page). Verified end-to-end: local prod build + `check-orphans` still **0 orphaned**
  (697/697 reachable); static HTML keeps every crawlable guide link (BuyWise 4, homepage
  10, DVT 4); preview confirms per-route blocks differ and no leak on real SPA nav.

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

---

## 📊 July 3, 2026 — coverage forensics (second deindexing wave)

**The data** (GSC exports, `~/Desktop/deftbrain-*`): a second wave on **June 12** cut
indexed 150 → 75 (not-indexed → 728) and impressions flatlined to ~0. No manual action.
Crawl stats healthy (85% OK, <1% 5xx, no June anomaly) → **algorithmic quality rationing**,
not a technical event. External links: **1** (a scraper) — authority is the gate.

**Keep-list math** (indexed-now ∪ clicks≥1 ∪ impressions≥10, 6-mo window): **157 URLs**
(111 guides + 46 tools/other). Google's revealed preference is specific question-shaped
guides. Full lists: `deftbrain-2` (indexed 75), `deftbrain-3` (performance), `deftbrain-4`
(crawled-not-indexed 547).

**Defect categories — probed live 7/3, mostly already healthy:**
- `/BillRescue/` (redirect-error class) → single-hop 301 → 200 ✓ (stale GSC data; validate)
- `/ego-killer` (soft-404 class) → 301 ✓ · `/guides/meetings` (5xx class) → 200 ✓ (validate)
- Page-with-redirect (34) / alternate-canonical (7) / 404s (11) = correct-by-design states.
- **Real live defects found & fixed in `4bf3b9d`:** ghost assets 404ing on every render
  (favicon.ico, logo192.png, manifest.json never existed; twemoji.min.js referenced but
  never deployed — tag removed, icons come from CDN) + the http://www 2-hop redirect chain
  (now one hop). Crawler stdout logging + `check-sitemap-urls.js` postbuild guard added
  (all 698 sitemap URLs verified resolving to real build files).
- URL Inspection anomaly: a guide showed "No referring sitemaps detected" though discovered
  VIA guides-sitemap.xml → check GSC ▸ Sitemaps lists sitemap.xml + both children; resubmit
  if not.

**SHIPPED July 3 (`43f69bb`/`ee52523`) — prune+consolidation migration:**
- `guides/keep-list.json` = 170 signal guides (indexed-now ∪ June-indexed ∪ clicks≥1 ∪
  imp≥10). All 129 tool pages keep their URLs.
- The 18 `/guides/{category}` pages are now HUBS: kept guides linked, the 381
  consolidated guides rendered as anchored sections (deck + step names + tool CTA).
- Old article URLs (and .html variants) 301 → `/guides/{cat}#{slug}` (middleware before
  static). **Drip re-release:** add a slug back to keep-list.json + rebuild — the 301
  lifts and the page returns to the sitemap automatically.
- Sitemap 698 → 317 URLs; guards verify every sitemap URL resolves (check-sitemap-urls)
  and 0 orphans; click-depth improved to 131/149/36 @1/2/3 clicks.
- guides-manifest.json (RelatedLinks pool) filtered to kept guides.

**GSC actions (user):** validate redirect-error / soft-404 / 5xx (probed healthy);
do NOT re-validate crawled-not-indexed; resubmit sitemap.xml after the deploy (it
shrank 698→317); check Sitemaps report lists both children. Success metrics: indexed
count *on the 317-URL set* + impressions off zero by weeks 4–8; the gating variable
remains external links (currently 1).
