# Two-stage mediation — November 5, 2026

This document records the initial two-stage implementation and its original timings. The subsequent position-fidelity and decision-dependent uncertainty additions are reviewed in [PROMPT-REVIEW.md](PROMPT-REVIEW.md), including current checks and observed costs.

The route now defaults to GPT-6.1 Sol (still overridable with MODEL_ROOMMATE_COURT). Assessment/extraction uses low reasoning; advice uses medium; both use low verbosity. Public response fields and chore actions are unchanged.

The first call returns a compact typed case record, then Understanding the Situation. Source IDs, authorship and direct/reported status originate in code. Each record excerpt must occur verbatim in its designated source. Code assigns IDs after validation. Guidance starts as soon as that record is complete, overlapping the end of the first call. Only the public assessment is sent to the browser.

The second call receives both the original source accounts and the checked record. Each recorded concern, request, conditional offer, accepted agreement, safety risk, and decisive uncertainty requires exactly one coverage entry citing a verbatim passage in its public guidance. Guidance is released only after schema, coverage and recorded-safety checks pass. Recorded safety risks require conversation advice to be null. Both calls share cancellation and the existing 90-second total deadline; neither retries or repairs content automatically. Failure after an early assessment emits an error, never done; the existing frontend clears the partial result.

## Observed latency

One successful generation per condition, same synthetic examples, actual provider streams:

| Case | Initial two-stage, medium throughout: first / total | Tuned extraction low, guidance medium: first / total |
| --- | --- | --- |
| Utilities | 17.5 / 39.5 seconds | 6.5 / 25.8 seconds |
| Boyfriend | 15.3 / 31.9 seconds | 6.9 / 20.3 seconds |
| Safety | 14.4 / 27.0 seconds | 4.0 / 16.7 seconds |

The initial record also included a redundant detail sentence per entry. Tuning removed that sentence and lowered first-stage reasoning. This is not a controlled attribution of the improvement to either change. Caching, service conditions and concurrent golden checks affect timings. First text means a complete validated assessment, not a loading message or a partial word. The tuned approach exposes useful text earlier than the previous single-call medium runs completed (utilities 15.8 s; boyfriend 16.8 s), but takes longer to finish. Those previous runs did not record their first-text times, so this does not establish an exact first-text improvement over them.

Utilities now explicitly weighs water use, thermostat control and the conditional offer, and asks whether anyone wants change before proposing allocation. The boyfriend result separates crowding, privacy and costs, uses housing support after non-engagement, and does not invent a payment demand. It still prioritizes costs as secondary. Safety omits conversation advice and prioritizes safe support. These are observations of three answers, not proof of reliable superiority.

Evidence: stages-results.json (tuned), stages-medium-baseline.json (initial), stages-run.cjs (reproducible paid calls). Both records include synthetic sources and the internal case record sent to guidance, but no credentials. The runner writes files in this directory; it does not change application settings.

## Checks and limitations

All seven required gates and the additional applicable static pre-push checks passed. Twenty-two transport/schema/provenance/coverage tests passed, including proof of overlapping calls and rejection of unsupported evidence, missing/duplicate/ungrounded coverage, and scripts despite recorded safety risk. Three fresh-backend golden cases passed (German mediation and both English chore actions). The public response contract is unchanged.

Exact excerpts establish support in the supplied text, not truth. Code cannot prove that an excerpt supports its assigned kind, that all material concerns were extracted, or that a cited advice passage adequately addresses the concern. Original sources remain in the second call to reduce dependency on extraction. The early assessment is not independently semantically reviewed and could differ in emphasis from later advice. Final guidance is held for validation rather than streamed unchecked. No claim is made that the two-stage design eliminates interpretation errors, guarantees a latency target, or adds a semantic correctness check. Usage metrics are per-stage; dollar cost is left null rather than guessed.

No deployment or push.
