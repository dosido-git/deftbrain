# Crisis Prioritizer — V2 integration (2026-08-24)

Owner supplied a matched frontend/backend pair implementing
`CRISIS_PRIORITIZER_V2`. Both files landed in the repo directly; this pass was
integration, not redesign. The design, flow and copy are the owner's and are
preserved verbatim.

## Gate 9 — the item the README left explicit

`router.outputGuard = 'crisis-prioritizer-v2'` is a **string**. It reads as a
declaration to a human and enforces nothing, and Gate 9's regex matches it
either way — which is exactly how Crash Predictor shipped with a guard that
never ran. Replaced with a profile whose terms are the V2 contract's deleted
concepts, each turned into something the validator can catch:

```
prohibit: invented_deadline_or_consequence, invented_dependency_or_commitment,
          psychological_read_of_the_visitor, objective_urgency_claim,
          risk_scoring_or_accuracy_percentage, universal_energy_curve,
          unrequested_self_care_prescription,
          overcommitment_diagnosis_without_arithmetic, no_deadline_stated_as_fact
require:  ranking_traceable_to_supplied_facts,
          unknowns_surfaced_rather_than_filled_in, fulfills_tool_promise
```

All twelve actions funnel through one `ask()`, so `runOutputGuard` is wired
there — "every LLM result", per the contract. `suppliedFrom(req.body)` gives it
the visitor's own input as the only source of truth, with the rule that silence
about a deadline is *not supplied*, never *no deadline*.

It earns its place. On the first live runs the guard caught `invented_fact` and
`unsupported_prediction` on `do_next[0].why_next` and `capacity_fit.summary` —
a model filling in why a task follows another when the visitor never said. The
`just-one-thing` action passed clean.

Also added `withLocaleContext` (localization layer 2, absent from the supplied
file) and made `follow-up` accept `lastSession` as well as `originalPlan`.

## Frontend — 32 audit findings and 53 localization issues

The file rendered the V2 schema correctly and carried none of the house layer.
Fixed without touching the design:

| | Was | Now |
| --- | --- | --- |
| Localization | none — no `useTranslation`, every string hardcoded | 88 keys × 13 languages (`cp2_*`) |
| Header | no icon, tagline or Try an example | PF-30 / PF-17c header card |
| Palette | 3 keys, `c.muted` (banned), no `card`/`border`/`btnPrimary` | full house set + PF-2 aliases + `linkStyle` |
| Copy-out | `BRAND` declared, never used; a hand-rolled `copyText` | `useRegisterActions(buildFullText())` (rule 2 and 4) |
| Results | `useState` — lost on reload | `usePersistentState` |
| Journal | written every run, never read | rendered as recent plans, with a `preview` field |
| Re-triage | `window.prompt('…separated by semicolons')` | tick the tasks already on screen |
| Keyboard | none | ⌘↵ handler + PF-31 chip |
| Cross-refs | none | pre-result (Brain Dump Buddy), post-result (Batch Flow · PEP) |

**The v1 `cp_*` catalog was orphaned.** 3,446 key lines across 13 languages
describing anxiety-vs-reality, urgency-accuracy scores and psychological
profiling — all deleted from the product. Replaced with the `cp2_*` catalog
rather than left as dead weight beside it.

**PF-25 masked itself.** The rule reports only the *first* `slice(0, N>6)`
whose preceding 150 characters mention history/journal/log. My own comment on a
headline-truncation slice contained the word "history", so that line absorbed
the single report and the real 20-session cap below it was never checked.
Reworded the comment and moved the exception note to the actual cap.

Catalog copy also carried deleted concepts — `seoDescription` promised to
"separate real urgency from anxiety urgency" and to rank by "what actually
breaks if you skip them". Rewritten; `tagline` now matches the page exactly,
since PF-30 renders it.

**Live:** generate 20.8s EN / 21.7s DE, just-one-thing 6.2s, all 200.
Browser: header, example, full result render, progress panel; Arabic RTL clean,
no tofu, no overflow at 375px.
