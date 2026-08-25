# DecisionCoach — architecture & lock notes (`decisioncoach-v1`)

Makes ONE decisive answer (not options) across 10 modes: decide, pros-cons, quick, patterns, group, followup, dna, devils-advocate, batch, chain. **Frontend:** `src/tools/DecisionCoach.js`. **Backend:** `backend/routes/decision-coach.js` (10 endpoints). **Golden:** `audit/decision-coach-golden-sample.json` (5 cases). Verify: `npm run check:golden decision-coach`.

## Shape
- **10 endpoints**, all `claude-sonnet-4-6` (`MODELS.SMART`) via `callClaudeWithRetry` (max_tokens 4000, except followup 800). `lang = withLanguage('', userLanguage) + withLocaleContext(...)` appended to each prompt (no `system` field). **No per-endpoint success guards** by design (frontend null-safe; callClaudeWithRetry guarantees valid JSON). In `LOCALIZED_TOOLS`.

## Audit fixes locked here (2026-07-12)
1. **🛡️ Robustness — all 10 endpoints used raw `anthropic.messages.create` inside a local retry-loop (API-errors only) + an unguarded `JSON.parse` OUTSIDE the loop** (no parse-retry, no truncation fail-fast). **Fix: switched all 10 to `callClaudeWithRetry`** (parse-retry + `stop_reason==='max_tokens'` fail-fast + API-error retry). Removed the dead `anthropic`/`cleanJsonResponse` imports.
   - **Inlined** as `res.json(await callClaudeWithRetry(...))` rather than `const parsed = …; res.json(parsed)` — the bare-variable form trips backend audit **S7.4f** (unvalidated var); the inline call matches the original's audit-clean posture (the tool has no shape-guards by design).
2. **⚠️→cleaned: 37 annotations stripped** (`— one sentence` ×35, `— 3-6 words` ×2). No truncation resulted — the 4000 budget absorbed the (slightly longer) fields, unlike CrowdWisdom/DateNight at 2000-2500. Verified 8/10 modes 200 in German.
3. **⚠️ PF-2 alias** — added `labelText` to the `c` block + `c.label = c.labelText;` (the tool followed the alias-block pattern via `c.textMuteded` but was missing the label alias).

## DO NOT silently reverse
1. **`callClaudeWithRetry` (inlined into `res.json`)** — don't revert to raw `create`; and keep it inline (bare `res.json(parsed)` re-trips S7.4f).
2. **Stripped annotations** — check-golden checks STRUCTURE not content.

## Known / accepted
- 0 baseline audit issues after fixes. No guards by design (frontend null-safe).
- Golden covers 5 modes (decide en/de, pros-cons, chain, devils-advocate). dna + patterns need sessionHistory (analysis modes) — not in golden; verified structurally same class.
- No truncation at 4000 across all tested modes (the annotation strip did NOT trigger truncation here — enough headroom).

## Simplified the path in, not the capabilities — 2026-08-25

Owner: the form exposed the tool's internal feature architecture to the
visitor. Someone already too stuck to choose had to make several interface
choices — Decide/Group/Insights/History, then Quick Decide, then
Decide/Compare/Gut check/Chain, then Category — before saying what they were
stuck on. Nothing was removed from what the tool can do; the order changed.

**Before → after**

| | |
| --- | --- |
| 4-tab strip at the top | gone. Deciding is the default view and does not need a tab announcing it |
| Group, History | quiet pill controls beside Try an example; History appears only once there is history |
| Insights tab | folded into History. With Decision DNA and the profiling gone it no longer carries a top-level tab |
| Mode picker **before** the question | small optional pill row **after** it, "How should I tackle it? (optional)", defaulting to Just decide |
| Category selector | removed. The sentence already contains it; `category` survives as state for templates, history and the payload, and `DECISION_CATEGORIES` is still used for the label lookup so nothing orphaned |
| Saved preferences, a full block below the submit button | inside More options, above the button |
| Which Life? link above the question, BuyWise below the form | both at the foot of the **result**, where there is finally something to hand off from |

Kept exactly as they were: Quick Decide and its five one-tap choices, Try an
example in the header, Start over, and the Decide For Me button.

**Three things the change surfaced.**

1. Removing the tab strip left `c.tabActive`, `c.tabInactive` and
   `c.tabBorderColor` dead in the palette — caught by S1.1k, removed by key
   line only (the documented hazard is cutting a multi-line palette entry at
   its key and leaving `: '…'` dangling).
2. The preamble still said **"YOU GIVE: The category and what needs
   deciding"** — an input the visitor is no longer asked for. Now "A sentence
   saying what you are stuck on. Constraints and preferences are optional."
3. `src/data/tools.js` carried three stray paste-instruction comments from an
   earlier entry replacement — "Replace the existing entry (search for id:
   …)", "Changes: modified date added, tags expanded from 7 → 9". Valid JS
   comments, so nothing broke, but they describe an edit rather than the
   catalog. Removed.

Verified end to end: question typed → submit enabled → answer returned with
the important-decision disclaimer intact → both cross-refs appear only at that
point. Golden 5/5.
