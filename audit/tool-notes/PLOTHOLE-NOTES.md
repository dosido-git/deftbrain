# Plot Hole Finder — architecture & lock notes (`plothole-v2`)

Renamed from **Plot Hole** (id `PlotHole` → `PlotHoleFinder`, `/PlotHole` → `/PlotHoleFinder`)
and given a full V2 rewrite in the same pass, 2026-09-06.

**Frontend:** `src/tools/PlotHoleFinder.js` (renamed from `PlotHole.js`).
**Backend:** `backend/routes/plot-hole.js` — filename kept, 2 endpoints (`/api/plot-hole`,
`/api/plot-hole/defend`), bumped `MODELS.FAST` → `MODELS.SMART` for both.
**i18n:** `src/i18n/locales/tools/plot-hole.js`, `plh_*` prefix kept, ~90 keys, 13 languages.
**localStorage:** `plothole-result`, `plothole-history` kept. `pickExample('PlotHole', ...)` kept
(internal rotation key, not user-facing).
**Golden:** `audit/plot-hole-golden-sample.json` (2 cases). Verify: `npm run check:golden plot-hole`
(route slug, unaffected by the id rename).

## Why this rewrite happened

The old tool forced 4-7 "holes" with a mandated mix of severities regardless of what the
evidence actually supported, and its `PERSONALITY` line told the model to defend the story
"like a skilled apologist" — which in practice meant:
- Turning **Bane's motivated choice** not to kill Bruce immediately into a "MAJOR" plot hole,
  then supplying the exact character-based explanation that makes it not a hole, in the same
  response.
- Inventing **unseen off-screen events as established fact** to defend the story — e.g. "Blake
  uses tunnels and abandoned infrastructure" for a method the film never shows.
- Attributing generated one-liners to `r/plotholes` as though they were real quotes.
- Asserting `why_nobody_cares` — claiming to know what audiences do or don't notice.

## Full rename checklist (2026-09-06)

Per `audit/REWRITE-INSTALL-KIT.md` §7, using the `BeforeTheCrash`/`PetBehaviorDecoder`
precedent from the same week:
1. `src/data/tools.js` — `id: "PlotHoleFinder"`, `title`, `tagline`, `description`, `primer`,
   `guide.*` all rewritten for the new tool.
2. `src/i18n/locales/tools/plot-hole.js` — `plh_title` updated to "Plot Hole Finder" (and its
   equivalents in all 13 languages); **prefix kept** `plh_*`.
3. `src/tools/PlotHole.js` → `src/tools/PlotHoleFinder.js` (`git mv`); component name,
   `displayName`, export all updated. `pickExample('PlotHole', ...)` **kept** — internal
   rotation-state key, not user-facing.
4. `backend/server.js` — `TOOL_IDS`: `'PlotHole'` → `'PlotHoleFinder'` (single swap, not both).
   `LEGACY_REDIRECTS`: added `/PlotHole`, `/plothole`, `/plot-hole` → `/PlotHoleFinder` (single
   hop, old id removed from `TOOL_IDS` so it doesn't redirect to itself first).
5. `src/components/ToolRenderer.js` — `TOOL_ALIASES.PlotHole = 'PlotHoleFinder'`.
6. `src/data/tool-og-slugs.json` + `public/og/og-slug-map.json` — added
   `"PlotHoleFinder": "plot-hole"` alongside the existing `"PlotHole": "plot-hole"` key (same
   slug, same `public/og/plot-hole.png` asset — deliberately did **not** repeat the
   `BeforeTheCrash` precedent's gap of leaving the new id with no og-slug entry at all).
7. `src/data/toolFinderMetadata.js` — both `toolId: "PlotHole"` handoff references (from
   `TheRunthrough` and `FanTheory`) updated to `"PlotHoleFinder"`.
8. `src/tools/WrongAnswersOnly.js` — its `/PlotHole` cross-ref link updated to
   `/PlotHoleFinder`; `diff-audit.py` confirmed this as a **fixed** S5.5 broken-link finding,
   not just a stylistic change.
9. `scripts/localization-audit.js` — `LOCALIZED_TOOLS` allowlist path updated to
   `src/tools/PlotHoleFinder.js`.
10. `node scripts/generate-llms.js` re-run (llms.txt/llms-full.txt are generated, not
    hand-edited).
11. This file, renamed in spirit (same filename, since `PLOTHOLE-NOTES.md` still matches the
    old id and nothing requires the notes filename to track a rename).

**Deliberately kept the same**: `backend/routes/plot-hole.js` filename and both endpoint
paths, the `plh_*` i18n prefix, `plothole-result`/`plothole-history` localStorage keys, and the
`pickExample` rotation key. These are internal; renaming them buys nothing and breaks saved
state for existing visitors.

**Not chased**: `src/i18n/locales/tools/wrong-answers-only.js`'s `wao_plothole` cross-ref
*label* text still says "Plot Hole" rather than "Plot Hole Finder" in all 13 languages — the
link itself is correct (`/PlotHoleFinder`), only the display label is now slightly stale. Low
priority; flagged here rather than fixed, to keep this rename's scope to the tool being renamed
rather than sweeping every downstream label across the catalog.

**Verified with real HTTP status codes** against a locally running backend
(`http://localhost:3001`): `/plothole`, `/PlotHole`, `/plot-hole` all `301` to
`/PlotHoleFinder`; hitting `/PlotHoleFinder` directly against the dev-mode backend 404s, but so
does `/PlantRescue` and `/BikeMedic` under the identical test — confirmed via a control test
that this is a dev-mode characteristic (the bare Express server on 3001 doesn't serve any SPA
route directly, prerendering only matters for the production build) and not a rename-specific
regression. The React dev server on port 3000 correctly serves `/PlotHoleFinder` directly and
redirects `/PlotHole` to it via `TOOL_ALIASES`.

## V2 rewrite — what changed

**FIND HOLES schema**, was `title_analyzed` / `overall_verdict` (plain string) /
`swiss_cheese_rating` / `holes[]{name,description,severity,why_it_matters,best_defense,
reddit_would_say}` / `biggest_hole` / `actually_clever` / `why_nobody_cares`. Now:
`title_analyzed` / `overall_verdict{label,summary}` / `swiss_cheese_rating` /
`swiss_cheese_note` / `focus_answer{show,question,verdict,explanation}` /
`findings[]{name,type,severity,what_happens,case_against,best_defense,defense_basis,verdict,
why,snarky_version}` / `strongest_case{show,finding,why}` / `what_the_story_gets_right{show,
text}` / `why_it_still_works{show,text}`.

**DEFEND schema**, was `hole_summary` / `defense_verdict` / `defense_arguments[]{argument,type,
strength,counterpoint}` / `best_defense` / `closing_statement` / `honest_take`. Now:
`hole_summary` / `defense_verdict` / `verdict_reason` / `defense_arguments[]{argument,basis,
strength,support,counterpoint}` / `best_defense` / `closing_statement` / `final_call`.

**No forced quota.** `findings`/`defense_arguments` return only what survives scrutiny —
usually 2-5 / 2-4, 1 is fine, 0 is fine (the tool says so in `overall_verdict` instead of
padding). No mandated mix of severities.

**Taxonomy before verdict.** Every finding gets exactly one `type` (REAL CONTRADICTION,
UNEXPLAINED GAP, PLOT CONVENIENCE, QUESTIONABLE DECISION, CONTINUITY ISSUE, TIMELINE PROBLEM,
RULE-BREAK, NOT ACTUALLY A HOLE) — `severity` is `null` for anything that isn't a genuine
contradiction, never inherited from the old NITPICK/MINOR/MAJOR/UNIVERSE-BREAKING scale (which
rated everything as though it were a confirmed hole).

**Focus question first.** If the visitor points to a specific scene/decision/rule
(`whatToLookAt`), it's answered directly in `focus_answer` before at most 1-3 other findings are
added — a focused question no longer produces a scan of the whole work.

**Swiss Cheese Rating kept, deliberately.** The supplied rewrite spec contradicted itself: one
prompt section said "KEEP the Swiss Cheese Rating" with a full worked calibration (1-2 solid,
9-10 total swiss cheese), but the spec's own final "Remove" list said to remove it, and its
supplied JSON schema + result-UI mock both omitted it entirely. Asked the user directly rather
than picking a side — **the user chose to keep it**, calibrated per the KEEP section's exact
rules. The old tool-notes' hard-won lesson survives into this rewrite: `swiss_cheese_rating`
MUST be a bare integer 1-10 under exactly that key name (a bare example alone once made the
model rename it to `overall_swiss_cheese_rating`, silently breaking the frontend's raw render).

**No fake Reddit.** `reddit_would_say` → `snarky_version` — an original joke, never attributed
to Reddit, a subreddit, fans, critics, or viewers.

**No claimed audience mind-reading.** `why_nobody_cares` → `why_it_still_works`, framed as
analysis of what the story accomplishes (pacing, emotional payoff, thematic coherence), never
as a claim about what viewers think or notice.

**Biggest Hole → Strongest Case**, only shown (`show: true`) when a genuine contradiction
survives scrutiny — never shown merely because it was the visitor's original complaint.

**Model bump.** Both endpoints moved `MODELS.FAST` → `MODELS.SMART`. Sorting "why didn't they
just...?" from a genuine rule contradiction, and `ESTABLISHED` from `STRETCH` in a defense
argument, is real reasoning work a fixed-quota version never had to do.

**Recent, rewritten.** Was a bare `{id, date, preview}` (a 40-char title truncation). Now stores
`title`, `mediaType`, `whatToLookAt`, `verdictLabel`, `strongestFinding`, and the **full result
object** — "View analysis" restores the stored result exactly, with no model call; "Look again"
explicitly runs a fresh analysis (which may disagree with the stored one) rather than silently
re-running and presenting a new answer as though it were the old one. The stored findings are
never fed back into a fresh run as established story facts.

## Live-verified against the exact examples the rewrite spec called out as broken

1. **Bane's delay** (`find-dark-knight-rises-bane-delay-focus-question` golden case): resolves
   as `focus_answer.verdict = "NO — EXPLAINABLE"`, citing Bane's established motive (wants Bruce
   to suffer and watch Gotham fall) — not logged as a plot hole the response then explains away.
2. **Bruce's return to blockaded Gotham** (`defend-dark-knight-rises-gotham-return-no-invented-
   tunnels` golden case): the strongest defense argument is labeled `REASONABLE INFERENCE`
   ("trusted intermediaries... likely still exist") with its own counterpoint noting the film
   never shows this; a separate argument is correctly labeled `STRETCH` and self-flags in its
   own counterpoint: "This is fan-repair, not story logic." No invented tunnels, contacts, or
   off-screen conversations stated as fact anywhere in the response.

## DO NOT silently reverse

- The full rename mechanics above (§ Full rename checklist) — reverting any one piece (e.g.
  restoring `id: "PlotHole"` without also reverting `TOOL_IDS`/redirects) creates exactly the
  broken-link/unreachable-page failure modes `REWRITE-INSTALL-KIT.md` documents.
- `swiss_cheese_rating` staying a bare integer under that exact key name — this is a decision,
  not an oversight (the supplied spec contradicted itself; the user chose to keep it).
- `focus_answer` being answered before any other findings are added — this is the actual fix
  for the Bane-delay bug class, not a stylistic reordering.
- `defense_basis`/`basis` STRETCH-labeled arguments staying visibly weaker (own counterpoint
  self-flags them) — collapsing STRETCH into ESTABLISHED-style confidence reopens the
  invented-tunnels bug class.
- No forced quota on `findings`/`defense_arguments` — reintroducing "4-7 holes" or "3-5
  arguments, at least one for laughs" defeats the entire point of this rewrite.
- MODELS.SMART on both endpoints — this is a deliberate quality decision given the added
  reasoning complexity, not an accidental cost increase to revert.
