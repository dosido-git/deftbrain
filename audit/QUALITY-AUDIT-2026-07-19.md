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

## Wave 3 — high-stakes life tools (6 audited)

| Tool | Verdict | Fixed overnight |
|---|---|---|
| complaint-escalation-writer | SIGNIFICANT (no response ≤590s on rich inputs) | ✅ added the NO_QUOTE_RULE its main prompt was missing (quote-heavy inputs → invalid JSON → 3× retry loop). Verified: rich fridge-saga input now 200 with all details (was 0 bytes) — but still SLOW (~357s worst case; see judgment call #10) |
| culture-briefing | SIGNIFICANT (fabricated Japanese phrases + inverted Osaka escalator fact, at confidence:high) | ✅ prompt rule: local-language phrases only when CERTAIN, else describe in English; physical customs only if certain, never invert regional variations |
| lease-trap-detector | MINOR (perfect 8/8 trap recall but stated pre-2024 CA deposit cap as hard law) | ✅ prompt rule: statute figures need effective dates; flag rules changed since ~2023 (AB 12 example baked in); say "verify current cap" when unsure |
| bill-rescue | MINOR (caught both planted billing errors; invented a county program + URL) | ✅ no-invented-specifics rule extended to program names/URLs/phone numbers; laws cited only when certain of the bill number |
| mental-health-navigator | GOOD (exemplary safety calibration) | ✅ cosmetic: never reference JSON field names in prose (leaked "what_to_say") |
| money-diplomat (nudge) | GOOD | — nothing needed |

## Judgment calls left for you (wave 3)

10. **complaint-escalation-writer**: fixed from DOWN to functional, but the richest inputs
    still run ~6 min (single giant 5-stage response, 21KB). The real fix is the
    jargon-assassin parallel-split pattern — schema restructure on a locked tool, your call.
11. **lease-trap-detector**: model legal knowledge ages (AB 12 case) — the prompt rule
    mitigates but the durable fix would be a small per-state facts block injected into the
    prompt, maintained in code. Worth building?
12. **culture-briefing**: phrase fabrication is a FAST/haiku-model artifact — if phrases
    matter, routing just the phrase fields through SMART is the stronger fix.
13. **bill-rescue**: cited SB 1152 where AB 774/AB 1020 was meant (HSC cite was right) —
    same aging-knowledge class as #11.

## Cross-cutting (all 18 tools audited)

- Zero annotation leaks anywhere — the enum-annotation sweep is holding.
- Zero localization leaks (GBP/EUR/German all clean).
- The live failure modes have shifted to: (1) model-knowledge accuracy — stale laws and
  invented specifics delivered confidently; (2) rich-input JSON validity (quote-heavy
  inputs breaking parsing where the NO_QUOTE_RULE was missing). Neither is visible to
  any existing gate; both are what this audit format catches.
