# Output-Quality Audit — 2026-07-19 (overnight campaign)

Live runs against the local backend, judged on: repetitiveness, generic-vs-specific,
truncation, annotation leaks, contradictions, accuracy-vs-input. Structural gates
can't see these — this is the layer they miss. FIXED items were committed the same
night; JUDGMENT CALLS need your eyes.

## Wave 1 — life tools (6 audited)

| Tool | Verdict | Fixed overnight |
|---|---|---|
| subscription-tamer | MINOR (latent SIGNIFICANT) | ✅ `cycle` enum-pinned (prose cycles silently inflated annual subs 12× in monthly totals); annotations stripped from cycle/usage_guess; golden re-verified |
| brain-dump-buddy | MINOR | ✅ overwhelm-meter counts now CODE-COMPUTED from array lengths (summary/counts/arrays gave 3 different numbers); CONSISTENT NUMBERS prompt rule added |
| brag-sheet-builder | MINOR | ✅ TRUTHFULNESS prompt rules: no agency upgrades ("I noticed X, we fixed it" must not become "drove the fix"); `original` quoted verbatim |
| skill-gap-map | GOOD− | ✅ NUMBERS prompt rule: user figures verbatim; derived percentages show inputs (caught "14%→9%" reported as "38% reduction" — correct is ~36%) |
| crisis-prioritizer | GOOD | — nothing needed (airtight internal consistency; correct Sunday-awareness) |
| spiral-stopper | GOOD | — nothing needed (best output of batch) |

## Judgment calls left for you (wave 1)

1. **brain-dump-buddy**: items get filed into 2-3 buckets at once (sister in decisions +
   tell_someone + not_your_problem) — arguably thorough, arguably padding. Also prose
   summary can still count "noise" loosely (meter widget itself is now code-pinned).
2. **subscription-tamer**: included a phone plan as a "subscription" while correctly
   excluding utilities — where's the line? Also usage_guess wording is boilerplate-ish.
3. **brag-sheet-builder**: raise-ammo invents hedged market anchors ("industry average
   4-6 weeks") — useful or dangerous?
4. **skill-gap-map**: gap list isn't strictly sorted by ROI despite prompt saying so —
   harmless if frontend sorts; check whether it renders in order.
5. **crisis-prioritizer**: anxiety_vs_reality is formulaic ×10 ("Anxiety says X — reality
   says Y") — schema-driven; vary or keep?

## Wave 2 — document tools (6 audited)

| Tool | Verdict | Fixed overnight |
|---|---|---|
| plain-talk | SIGNIFICANT (effectively down for real docs) | ✅ full_translation removed from model output (it fully duplicated the per-section translations, ~3× output → hang/timeout on any contract-sized doc) and synthesized server-side from sections; verbatim-vs-no-quotes contradiction resolved (originals convert " to '); max_tokens 8000→12000. Verified: 3K-char contract now 200 in ~117s (was 0 bytes at 5-9 min) |
| contract-decoder | GOOD (1 small defect) | ✅ 'Freelance / NDA agreement' type label seeded false claims ("the NDA referenced in the title is absent" — no NDA was referenced); label now instructs the model to infer, not assert |
| doctor-visit-prep | GOOD | ✅ added no-repeat-across-fields rule (same family-history advice appeared in 4 fields) |
| upsell-shield | GOOD | — occasional garbled sentence, not systemic; no change |
| quote-check | GOOD | — reference quality (GBP localization clean, computed quote-gap math correct) |
| scam-radar | GOOD | — reference quality (German run: enums pinned, prose fluent, cited actual artifacts) |

## Judgment calls left for you (wave 2)

6. **plain-talk**: at ~117s for a 3K doc it works but is slow; if you want it faster the
   next lever is splitting sections/analysis into parallel calls (jargon-assassin pattern).
7. **upsell-shield**: model ignores the "one tight sentence" rule (fields run 2-3
   sentences) — reads fine; tighten or let it be?
8. **contract-decoder + scam-radar**: route paths end in /stream but return plain JSON —
   misleading name only, works fine. Rename (breaking) or leave?
9. **scam-radar**: the 1,99 € low-amount appears as both red flag and green flag —
   coherent framing, but skim-readers may see contradiction.

