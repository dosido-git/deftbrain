# Approved prompt consolidation — November 5, 2026

Only MEDIATOR_SYSTEM, EXTRACTION_SYSTEM and GUIDANCE_SYSTEM changed. A byte comparison with the pre-pruning route confirms all code outside those three constants is unchanged. Schemas, evidence/position/uncertainty validation, source construction, response rendering, cancellation, model, reasoning, verbosity, timeout and chore actions retain their previous implementation.

## What was applied

| Approved recommendation | Implementation |
| --- | --- |
| Remove assessment output instructions from guidance | MEDIATOR_SYSTEM is now shared policy only. Assessment and guidance each specify only their own fields. |
| Consolidate position and uncertainty rules | Extraction owns evidence types, ownership and decision dependencies. Guidance owns public position preservation, script review and actionable uncertainty coverage. Each contract appears once per responsible call. |
| Retain a short final check | Guidance ends with attribution, position fidelity and actionable uncertainty checks. It no longer repeats a seven-item policy checklist. Assessment has a short attribution/position check appropriate to early delivery. |
| Merge approach menus and no-recap rules | One menu remains in guidance. Relevant facts may explain an approach; retelling the accounts is discouraged. No claim is made that guidance can compare itself with assessment text it never receives. |
| Preserve distinct reasoning safeguards | Shared policy explicitly retains agreements, access, privacy, control, benefits, burdens, constraints, offsets, feelings versus demands, explanations versus remedies, presence versus demonstrated additional use/cost, equal shares versus fairness, and isolated incidents versus patterns. These are relevant considerations, not mandatory output topics. |
| Clarify p versus q treatment | p IDs use addresses/clarifies/unresolved/secondary. q IDs use clarifies/conditional/defers and cite actual action fields. This matches the existing validation contract without changing its implementation. |
| Keep safeguards in both public stages | Both calls receive the shared grounding, attribution, contextual fairness, qualified responsibility, no-diagnosis, safety and unsupported-authority boundaries. Safety restrictions on confrontation/compromise are explicitly scoped to risk cases. |
| Defer unrelated design changes | Extraction minimum/maximum sizes, economic localization and all other structural choices remain unchanged. |

## Prompt size

Whitespace word counts, not token counts; localization is additional:

| Actual call instructions | Before | After |
| --- | ---: | ---: |
| Assessment, including shared policy | 328 | 420 |
| Guidance, including shared policy | 1,289 | 658 |
| Total across both calls | 1,617 | 1,078 |

The total is about 33% shorter. Assessment grows because the separately visible assessment now receives the explicit shared reasoning safeguards instead of leaving them only in the guidance call. No speed or quality improvement follows automatically from these counts.

[pruning-snapshot.json](pruning-snapshot.json) preserves before/after prompt text, route hashes, counts, and the verified non-prompt-code invariant. The earlier [instruction review](PROMPT-REVIEW.md) is preserved as an audit of the prior wording rather than rewritten as though the new text had always existed.

## Live verification and a corrected regression

The initial consolidated wording allowed the early assessment to prescribe actions and grow into several paragraphs. That violated the stage separation even though the structural checks passed. The final prompt restores an explicit assessment-only boundary and one brief paragraph. It preserves urgent safety priorities while leaving practical recommendations and scripts to guidance. The rejected initial draft's actual responses remain in pruned-results.json; the final responses are in pruned-final-results.json.

All required gates, the applicable additional static checks and 28 existing transport/contract tests passed. All three fresh-backend goldens passed on the initial pruned version. After the boundary correction, the affected German mediation golden passed again (first section 10.8 s, complete 32 s); the already-passing unchanged chore cases were explicitly skipped on that second run.

The English live runs are one generation per case, without retries. They are a conformance spot-check, not evidence of consistent quality or improved latency. The final utilities and boyfriend assessments are single paragraphs without practical recommendations. The advice still requires judgment; passing evidence, position and uncertainty contracts does not establish semantic correctness. Model, effort, output limits, coverage requirements and UI were not changed to obtain the results.

No deployment or push.

Final English spot-check timings:

| Case | First text | Complete | Result |
| --- | ---: | ---: | --- |
| Utilities | 9.4 s | 27.7 s | Complete; assessment stays descriptive. |
| Boyfriend | 11.5 s | 28.2 s | Complete; assessment stays descriptive. |
| Safety | 5.4 s | 18.0 s | Complete; safety priority stated, conversation omitted. |
