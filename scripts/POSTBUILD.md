# Postbuild Chain

The order in `package.json`'s `postbuild` is **load-bearing**. Each step depends on artifacts produced by the previous one. Removing any step silently breaks production crawlability and indexing — sometimes for months before GSC notices.

## Order

```
react-scripts build
  && node scripts/prerender.js
  && node scripts/build-guides-indexes.js
  && node scripts/generate-guides-sitemap.js
  && node scripts/generate-sitemap-index.js
  && node scripts/verify-build.js
```

## What each step produces

### 1. `react-scripts build`
Standard CRA build. Produces `build/index.html`, JS/CSS bundles, static assets.

### 2. `prerender.js`
Walks `TOOL_IDS` and writes one flat HTML file per tool: `build/{ToolName}.html`. Required because the tool pages are SPA routes Google can't crawl without a static fallback.

**If dropped:** every `/ToolName` URL serves the SPA shell with no meta content. Soft-404s in GSC within ~30 days.

**Note:** must write flat files (`build/ToolName.html`), not directories.

### 3. `build-guides-indexes.js`
Reads `guides/{category}/*.js` specs and writes:
- `build/guides/index.html` — main hub
- `build/guides/by-tool/index.html` — alphabetical tool list
- `build/guides/{category}/index.html` — per-category indexes (×18)
- `build/guides/{category}/{slug}.html` — one per spec file (~551 total)

**If dropped:** every `/guides/*` URL 404s. **This actually happened** — refactor commit silently removed it months ago, GSC eventually flagged 5xx errors. Fixed 2026-05-07.

**Hard rule:** the empty-specs case must `throw`, not `console.warn() + return`. A silent skip on this script is worse than no script at all because it lets the rest of the chain proceed with phantom URLs.

### 4. `generate-guides-sitemap.js`
Reads spec files, writes `build/guides-sitemap.xml`.

**Coupled to reality (2026-05-07):** the script `existsSync`-checks each URL's backing build file before adding it to the sitemap. If `build-guides-indexes.js` didn't run, this step throws — the sitemap will not be generated with phantom URLs.

### 5. `generate-sitemap-index.js`
Combines tool sitemap + guides sitemap into `build/sitemap-index.xml`.

### 6. `verify-build.js` (final guard)
Asserts all expected files exist:
- Hub pages, per-category indexes, per-spec pages
- All sitemaps
- One prerendered HTML per top-level entry in `tools.js`

Exits nonzero if anything is missing → Railway build fails → broken deploy never ships. **This is the last line of defense. Do not remove.**

## How to add a new step

1. Pick its position in the chain — does it consume artifacts from earlier steps, or produce artifacts later steps need?
2. Add it to `package.json` postbuild.
3. Update this file with what it produces and what fails if dropped.
4. If it produces files, add them to `verify-build.js`'s checklist.

## How to add a new guide category

1. Create `guides/{newcategory}/` and add `.js` specs.
2. `build-guides-indexes.js` discovers categories by reading the directory — no code change needed.
3. `verify-build.js` discovers categories the same way — no code change needed.
4. Run a local build and check the new category index renders.
5. Commit specs, deploy.

## How to add a new tool

1. Add the entry to `src/data/tools.js` with a top-level `id: 'ToolName',` line.
2. `prerender.js` picks it up via `TOOL_IDS`; `verify-build.js` picks it up via the same regex pattern in tools.js.
3. Backend: add to `TOOL_IDS` array in `server.js` for case-insensitive routing.

## Historical breakage

| Date | What | Cause | Fix |
|------|------|-------|-----|
| ~2026-01 | `/guides/*` returned 5xx for months | Refactor dropped `build-guides-indexes.js` from postbuild | Restored 2026-05-07 |
| 2026-05-07 | (preventive) | Sitemap could advertise URLs with no backing file | Added `existsSync` coupling + `verify-build.js` gate |

## Operating principle

If a sitemap URL is generated, the file behind it must exist. If a tool is in `tools.js`, its prerendered HTML must exist. If a guide spec is in `guides/`, its built page must exist.

The chain enforces all three at build time. If any of these invariants ever ship broken to production again, it means a step in this chain was removed or weakened. Restore the gate first, fix the symptom second.
