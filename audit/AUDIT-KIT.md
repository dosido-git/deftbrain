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
3. **Hunt the failure classes that have bitten us** — `max_tokens` too small (truncation →
   parse-fail/retry storm), content-array/locale concat bugs, diagram/long-output truncation,
   numbers contradicting across sections, **cross-endpoint score/verdict inconsistency**,
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
2. Write `audit/<TOOL>-NOTES.md` — architecture, deliberate decisions, explicit
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

## Approved set
`buywise-v1` · `dvt-v1` · `sea-v1` · `nameaudit-v1` — each golden-locked, `check:golden:all`-guarded.
