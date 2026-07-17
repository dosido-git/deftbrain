# Per-tool Audit + Lock kit (the canonical procedure)

This is the full procedure for taking a tool to "prime-time." It has a **human approval
gate** — Claude audits and proposes fixes, you approve, then Claude fixes + locks. So it's
**two messages**, not one.

## How to invoke

**Message 1 — kick off the audit:**
> **"Run the full audit kit on `<Tool>`."**  (or "Audit `<Tool>` end-to-end")

Claude does PHASE 1 below (inspect, incl. the mobile pass), reports every finding as
✅/⚠️/🐛 with `file:line` + repro, proposes fixes, and **stops without applying them.**

**Message 2 — after you review, approve:**
> **"Approved — fix and lock."**  (or "Fix and lock", or "Lock as-is" to skip fixes)

Claude applies the approved fixes, runs PHASE 3 (regression), then PHASE 2 (lock), and
confirms all artifacts.

---

## PHASE 1 — Inspect (output quality, NOT just the 5 gates)
1. **Three-layer sync** — read frontend tab (`src/tools/<X>.js`), backend route
   (`backend/routes/<x>.js`), and the renderer. Confirm every emitted field is rendered and
   every UI input reaches the route.
2. **3 live inputs vs the real backend** — one ordinary, one large/complex (max-schema), one
   edge (empty/minimal/PDF). Show actual outputs + timings.
2a. **HEADROOM CHECK (required for every JSON endpoint).** Run the **max-schema input IN GERMAN**
   (≈+30% tokens — the truncation-prone direction) and **measure headroom**, don't just check for
   a 200: estimate output tokens `≈ output_chars / 3.3` and compare to `max_tokens`.
   - A single German 200 is **NOT** proof. If the German max-schema output exceeds **~70%** of
     `max_tokens`, the endpoint will 500 on a slightly-more-verbose real input (this is exactly
     what re-locked `beliefstresstest-v2` @ 3500→5000 and `crashpredictor-v2` @ 5000→7500 — their
     v1 German test used an input that happened to fit).
   - Fix = **bound the schema (per-array caps) + headroom, together** — and if a verbose run still
     truncates after the first bump, bump again (DifficultTalkCoach needed 10000→12000).
3. **Hunt the failure classes that have bitten us** — `max_tokens` too small (truncation →
   parse-fail/retry storm), content-array/locale concat bugs, diagram/long-output truncation,
   numbers contradicting across sections, **cross-endpoint score/verdict inconsistency**,
   guard-vs-schema mismatch (guard keys a nested/absent field → 500 on every call — test live),
   invented constraints, stale facts.
4. **Mobile pass (required)** — `preview_resize`→375px, run the lint from `audit/MOBILE-AUDIT.md`
   on the input AND results views, screenshot results. Flag 🐛 overflow / crushed columns,
   ⚠️ <44px tap targets, ⚠️ <16px inputs (iOS zoom). *Render-layer — does NOT go in the golden.*
5. **If in `LOCALIZED_TOOLS`** — verify all 4 localization layers; check dark mode.
6. Report ✅/⚠️/🐛 with `file:line` + concrete repro. **Propose fixes; don't apply until approved.**

## PHASE 2 — Lock (mirror BuyWise/DVT/SEA/NameAudit)
1. Capture a fixed representative input → full output in `audit/<tool>-golden-sample.json`
   with a `_meta` block (input, model, date, baseline/commit, how to regression-diff) and a
   `cases[]` array (`{name, endpoint, input, output}`). Include the case that guards any fix.
   **For every large or truncation-fixed endpoint, one golden case MUST be the max-schema input
   in German** (name it `<endpoint>-de-truncation-guard`) — it captures the headroom check from
   step 2a as a permanent regression guard. (`check:golden` re-runs it live, so a future
   `max_tokens` cut or schema-widening that pushes it over the ceiling fails the gate.)
2. Write `audit/tool-notes/<TOOL>-NOTES.md` — architecture, deliberate decisions, explicit
   "DO NOT silently reverse" list (model, max_tokens sizing, prompt rules).
3. Tag the commit `<tool>-v1`; push the tag.
4. Add a project-memory entry pointing to the note + golden, with the don't-undo list.
5. Confirm all four artifacts exist. Verify `npm run check:golden <tool>` passes.

## PHASE 3 — Regression (around any change to an approved tool)
Before and after the change, for every approved tool that **shares the route file,
`lib/claude.js`, shared prompt helpers, or the renderer**: run its golden input, diff for
**quality not just structure** (sections present, no new contradictions, no truncation, numbers
consistent, every "DO NOT reverse" item still holds), confirm the 5 gates pass. **A quality
regression is a hard blocker even if the gates are green** — stop and flag before pushing.
(For mobile/CSS-only changes to a shared component, also re-run the mobile pass on affected
locked tools — render regressions don't show up in the golden.)

## Naming consistency (check during Phase 1, fix during Phase 2)

Two distinct rules — don't conflate them, they carry different urgency:

**Rule 1 — display name (title) must ALWAYS match the URL/id. No exceptions, never deferred.**
`src/data/tools.js` `title` and `id` (hence the URL, `deftbrain.com/<id>`) are both
user-visible — a mismatch means someone lands on `/NoiseCanceler` and sees "Cut to the
Chase" as the H1, which reads as broken even though nothing technically is. Per explicit
user directive (2026-07-16, "definitely and always"): **whenever the display title
changes, the id/URL changes in the same pass** — same-day follow-up is not acceptable,
do it immediately. This applies regardless of lock status; unlike Rule 2, there is no
"already locked, defer it" exception. Changing the id touches: the frontend component
filename (`import(../tools/${toolId}.js)` in `ToolRenderer.js` resolves by exact id
match), the `TOOL_IDS` array in `backend/server.js`, a `LEGACY_REDIRECTS` entry (old
URL → new URL, 301), the OG slug map keys (`src/data/tool-og-slugs.json` +
`public/og/og-slug-map.json` — rekey only, keep the asset-filename value), the
`localization-audit.js` `LOCALIZED_TOOLS` allowlist path if applicable, any
`guides/**/*.js` `toolId:` cross-refs (then `npm run build:guides` to regenerate —
every guide embeds the shared `chrome.js` all-tools index, so this touches all ~550
generated pages, which is expected), and `audit/RENAMES.md`. See
`audit/tool-notes/CUTTOTHECHASE-NOTES.md` for a worked example (2026-07-16). The
backend route/endpoint and i18n prefix are NOT part of this rule — see Rule 2.

**Rule 2 — a tool's backend route filename and API endpoint should match its id, but
this one CAN be deferred on already-locked tools.** `backend/routes/<file>.js` and
`router.post('/<path>', ...)` should agree with the catalog id in kebab/PascalCase —
e.g. catalog id `QuoteCheck` ↔ route file `quote-check.js` ↔ endpoint `/quote-check`.
Route filenames don't affect mounting (`backend/routes/index.js` auto-discovers by
directory, not by name) and endpoint paths are never crawled/bookmarked (POST-only,
called from `callToolEndpoint`), so a mismatch here is invisible to users — real cost
to code-readers, but not urgent, and it's exactly the kind of drift that accumulates
silently across a multi-rename tool history (see `audit/RENAMES.md`).

**Going forward (Rule 2):** when a tool is renamed, rename its route file + endpoint path(s) +
`callToolEndpoint(...)` call sites in the same pass, unless the tool is already
locked (golden sample + tag exist) — in that case, treat the rename as a separate,
deliberate follow-up (it touches the golden sample's `endpoint` fields and the tag
lineage), not something to bundle into an unrelated fix. **Do not** rename the i18n
locale filename/key prefix or any `localStorage` key as part of a route-naming fix —
those carry real cost (a 13-language re-key, or silently wiping users' saved local
state) for zero user-facing benefit; the established, repeatedly-applied precedent
(SubSweep→SubscriptionTamer, DebateMe→ArgueBetter) is that i18n prefixes and storage
keys stay stable across a route rename even when the route itself changes.

**Known, deliberately deferred naming debt (Rule 2 only)** (as of 2026-07-16 — do not "fix" these
without a dedicated pass, since each is already locked and a rename touches its
golden sample + tag lineage):
- `WhichLife` — route/endpoint stays `contrast-report`, i18n `cr_`.
- `SocialBatteryAdvisor` — route/endpoint stays `social-energy-audit`, i18n `sea_`.
- `SixDegreesOfMe` — route/endpoint mismatch from the `callClaudeWithRetry` migration
  pass; not yet renamed.

`ArgueBetter` (`debate-me.js`/`debate-*` → `argue-better.js`/`argue-better-*`) and
`SubscriptionTamer` (`sub-sweep.js`/`sub-sweep` → `subscription-tamer.js`/
`subscription-tamer`) were fixed on 2026-07-16, during their first-ever audit-kit
lock — see `audit/tool-notes/ARGUEBETTER-NOTES.md` and
`audit/tool-notes/SUBSCRIPTIONTAMER-NOTES.md`.

## Approved set
`buywise-v1` · `dvt-v1` · `sea-v1` · `nameaudit-v1` — each golden-locked, `check:golden:all`-guarded.
