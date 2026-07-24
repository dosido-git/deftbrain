# Staleness Audit + Tiered Grounding Build — 2026-07-24

Closes the "legal-grounding decision" left open by the 2026-07-19 campaign.
Follow-on from QUALITY-AUDIT-2026-07-23.md (which caught plain-talk stating
pre-2022 German auto-renewal law as binding).

## The decision (now policy)

Tiered mitigation for model-knowledge staleness:

- **Tier 1 — volatile facts ARE the product:** grounded web-search pre-pass
  (lease-trap-detector, bill-rescue — pre-existing; renters-deposit-saver,
  plain-talk, contract-decoder — added today).
- **Tier 2 — legal claims incidental:** staleness-hedge prompt rules ("state
  the effective date, advise verifying, never present remembered law as
  settled") — swept into all probed files.
- **Tier 3 — specific contact points (hotlines, reporting channels):**
  never-invent rules; name the org, not the number (shipped 07-23).

## Shared infrastructure: backend/lib/groundedFacts.js

One implementation of the pre-pass (BuyWise pattern) + a jurisdiction-keyed
in-memory TTL cache (default 14 days, 500-entry bound, in-flight dedup,
5-min negative cache). Facts fetched in ENGLISH regardless of userLanguage —
the block is prompt input; the main call renders the user's language — so one
cache entry serves all 13 languages. Cache empties on deploy (accepted at
Stage 1; first user re-warms). lease-trap-detector + bill-rescue refactored
onto it (behavior identical, cache gained).

## Probe results (5 suspect tools, planted post-2022 law traps, 8 runs)

| Tool | Verdict | Detail |
|---|---|---|
| renters-deposit-saver | CONFIRMED STALE | /stream called an illegal CA 2-month deposit "the legal maximum" (AB 12 → 1 month since 2024-07) — while its own /rights endpoint answered the same question correctly |
| complaint-escalation-writer | CONFIRMED STALE | cited the vacated (8th Cir. 2025) FTC Click-to-Cancel amendments as "strong" in-force leverage in a send-verbatim letter |
| subscription-tamer | PARTIAL | right statute (§ 309 Nr. 9 BGB), wrong confidence ("könnte unwirksam sein"), strategized as if bound; confabulated a hotline + BGH case number |
| jargon-assassin | CLEAN | enforceability notes correct |
| roommate-court | CLEAN | AB 12 applied correctly |

## Fixes shipped

- **renters-deposit-saver:** grounded deposit-law pre-pass injected into all
  /stream groups + staleness hedge; group-3 truncation 2000→3000 (DE);
  stripCites on stream output.
- **plain-talk:** consumer-contract-law pre-pass, gated by a LEGALISH regex on
  textType/document text (poems don't trigger a web search); hedge line rides
  along whenever legal-ish.
- **contract-decoder:** per-(region × contractType) verified-law pre-pass ahead
  of the existing hedge.
- **complaint-escalation-writer:** REGULATORY CURRENCY rule in BOTH parallel
  prompts (first attempt fixed only promptStages; legal_leverage comes from
  promptStrategy — re-verified after adding to both: 15 ROSCA citations, zero
  dead-rule references).
- **subscription-tamer:** pinned the settled post-2022 German rule (monthly
  cancellation after minimum term, § 312k button duty) + never-invent
  case-numbers/hotlines rule.
- **jargon-assassin / roommate-court:** legal-currency hedge lines.

## Re-verification (same payloads that failed)

- RDS /stream CA: now states the ONE-month AB 12 cap with effective date AND
  the natural-person ≤2-properties exception; the landlord letter challenges
  the $4,600. Cache hit confirmed (2nd call 82s→58s, no pre-pass).
- subscription-tamer DE: "§ 309 Nr. 9 lit. b BGB in der seit dem 1. März 2022
  geltenden Fassung … ist geltendes Recht" — settled, not hedged-to-uselessness.
- CEW US: ROSCA/state-ARL leverage only.

## Maintenance contract

TTLs set once (14d default). When a tool's prompt starts making a new claim
class, its grounding topics must follow (three-way-sync discipline). Quarterly
multi-language audit waves (QUALITY-AUDIT-KIT.md) are the verification layer —
they catch both broken pre-passes and wrong search results. Pre-pass budgets:
2500 tokens minimum (1500 truncated in Arabic, 07-23). Degrades gracefully:
pre-pass failure → empty block → hedge rules take over.

## Known-stale pins to revisit

- CEW's vacated-FTC-rule pin: if the 2024 amendments are revived on appeal,
  the pin itself goes stale. It is deliberately phrased to prefer generic
  rights when unsure; revisit at the next audit wave.
