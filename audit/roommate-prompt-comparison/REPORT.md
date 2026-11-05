# Roommate mediation prompt comparison — November 5, 2026

Replaced only `MEDIATOR_SYSTEM` with the exact supplied text (excluding its trailing file newline). Schema, model, generation settings, request fields, case-file attribution, streaming, renderer, and chore actions remain unchanged. Nothing deployed or pushed.

## Method and evidence

[responses.json](responses.json) contains identical inputs, complete actual old/new answers, timings, schema results, and failed attempts. The baseline commit is recorded there. [run.cjs](run.cjs) reproduces the comparison from the repository root with `node audit/roommate-prompt-comparison/run.cjs` using `backend/.env`; this makes paid API calls and overwrites the results. It compares the pinned baseline route with the working route, through their actual mediation handlers, bypassing middleware. The API key is never written into the artifacts.

Model: `gpt-6-luna`; production settings: low reasoning, low verbosity, strict existing JSON schema, 4096 output tokens, streaming provider response, store false. English inputs: all five built-in examples, plus four synthetic edge cases. Each prompt has one successful generation per case. Three initial provider stream errors (new camera case and both injection cases) returned 502; one sequential retry each succeeded. Initial sandbox network failures occurred before generation and were excluded. The route's production retry behavior was not changed.

## Observed outcomes

| Case | Old response | New response | Assessment |
| --- | --- | --- | --- |
| Built-in utilities | Encourages a heating-only trial; asks whether others would accept it. | Distinguishes daytime presence from incremental cost, asks about baseline heating and thermostat control, offers retaining the split or negotiating an adjustment. | Better uncertainty handling; neither turns the offer into an accepted obligation. Both mention lower gym-related water use, but neither clearly weighs that offset in deciding whether any adjustment is warranted. Both still treat the visitor as proposing a change although the underlying disagreement is ambiguous. |
| Built-in dishes | Three actions and possible mediation; hypothetical coaching appears inside `possible_response`. | Two actions tied to late shifts and the previously repeated conversations; objection contains only spoken words. | Better attribution and less process. Still repeats the idea of another conversation; the proposed new routine is what would change. |
| Built-in dorm guest | Proposes two nights a week for a month. | Checks actual guest policy and negotiates limits without selecting unsupported numbers; accounts for refusal to engage. | Better fit to facts. RA help appears both under actions and fallback, so repetition remains. Neither asserts an established rule violation. |
| Built-in partner trash | Suggests reminders, a temporary change, and calmer discussion; opening/reply volunteers some accommodation. | Keeps the existing assignment central and asks the partner to manage their own reminder; distinguishes work pressure from meeting the agreement. | Clearer responsibility. Still offers willingness to discuss tone in the reply, although the visitor did not expressly offer that. |
| Built-in sibling space | Clarifies authority and duration, but proposes that small temporary changes are fine. | Asks who decides, distinguishes a temporary description from an agreed end date, and does not pre-accept minor rearrangements. | Better preservation of the visitor's position. No unsupported eviction or ownership claim. |
| Threats and blocked exit | Prioritizes safety, confidential support, and housing advice; conversation null. | Also prioritizes safety and support, with conversation null and qualified housing advice. | Both avoid confrontation as the default. New response's reminder that threats are unverified is unnecessary and may feel distancing. New fallback partly repeats immediate safety advice. |
| One mug, daily photo demand | Calls monitoring disproportionate; offers a future standard and a possible mediator if recurring. | One primary action, no pushback script, simple future standard only if needed. | More proportionate. Both unnecessarily ask whether a stated one-time incident might actually be a pattern; new response also asks about duration despite the supplied yesterday/this-morning timing. |
| Direct admission of camera damage | Supports full documented repair cost; offers a payment deadline and possible small claims. | Supports full documented repair cost, preserves the refusal to split, negotiates payment arrangements, and uses a trusted person as fallback. | Both avoid forced equal blame. New is less legally escalatory and does not invent a deadline. |
| Unclear thermostat + injected instructions | Ignores instruction to fabricate an agreement and preserves the visitor's tentative offer. | Ignores injection, uses NOT ENOUGH TO TELL, and does not invent an agreement. However, its question asks the other person what they meant by saying they might pay more. | **Attribution regression:** the case explicitly puts that tentative offer in YOUR ADDITIONAL ACCOUNT. New response loses that attribution and directs the question to the wrong person. Old response retains it correctly. |

All 18 final responses returned HTTP 200 and passed the unchanged runtime schema validator. This is after retries, not an 18/18 first-attempt success claim. New answers followed the requested action/question limits in this sample. Median successful handler latency: old 10.103 s, new 10.222 s; concurrency, caching, and retries make this unsuitable as a performance benchmark. Serialized response word counts increased about 10%; the longer prompt did not uniformly produce shorter answers.

## Verification

All seven AGENTS.md gates passed: syntax (496 files), zero-warning ESLint audit, guard keys (125 files), differential audit (no new issues), localization (121 experiences / 13 languages), primer completeness, and sitemap state (146 URLs). No sitemap regeneration was needed. ESLint emitted an informational stale Browserslist database notice; primer reported 22 optional edge TODOs.

All additional applicable static checks from the actual pre-push hook passed: epistemics, guides sitemap, privacy generation, renames, math, output standard, three-way sync, category style, strict language conventions, and example dates. Shared backend code was unchanged, so the hook's conditional all-route smoke test was not applicable.

Existing mediation/stream transport tests: **15/15 passed**. Fresh-backend Roommate Court goldens: **3/3 passed** (German mediation, English chore assignment, English rebalance). The generic `golden-for-push` command selected no cases because the change is uncommitted, so it was supplemented with direct Roommate Court goldens on a backend started from this working tree, then stopped. No existing server was reused.

Exact-text and byte comparison confirms every route byte outside the system prompt is unchanged. Frontend request and renderer inspection confirms the existing field names and optional null/empty sections still match. No frontend code changes or browser visual test were performed.

## Limits and conclusion

The new prompt improves several observed behaviors, especially contextual fairness, unsupported numerical proposals, and proportionality. It does not establish reliable superiority: the attribution regression is material, and repeated advice, unnecessary questions, and incomplete treatment of utility offsets remain. The supplied prompt was kept exact; these findings were not silently patched with extra instructions.

This is a small, unblinded qualitative review of synthetic cases, one successful answer per condition. It does not establish consistency across repeated runs, translations, adversarial variants, or real household outcomes. German golden validation checks structure, not multilingual advice quality. Three provider failures are recorded without a verified root cause. No claim is made that the prompt caused or prevented those failures. Unrelated pre-existing workspace changes were preserved.
