# Quality Audit — 2026-07-23 (multi-language round: de / ar / zh)

First non-English wave (the 2026-07-19 full-catalog sweep was English-only).
Scope: priority safety loop (grief-guide, drive-home, safe-walk, lease-trap-detector,
bill-rescue) + document cohort (plaintalk, jargon-assassin, contract-decoder,
research-decoder, quote-check, scam-radar), each judged in German (de-DE/EUR),
Arabic (ar-SA/SAR), and Mandarin (zh-CN/CNY) with native-language inputs,
planted checkable details, and quote-heavy dialogue. 6 agents, ~30 endpoint runs.

**Method note:** two agents' payload files collided in the shared scratchpad, so the
German run of grief-guide/drive-home/safe-walk became a duplicate Arabic run —
those three tools have ar+zh coverage but no de datapoint this wave. Next wave:
per-agent scratchpad subdirectories.

## Headline

5 tools were HARD DOWN in at least one language; 2 more failed ~50% of requests.
Every outage reduces to two known bug classes:

1. **max_tokens budgets tuned for English (or the German-era fix)** — Arabic/Chinese
   token inflation blows them deterministically. Truncation fails fast → 500 every call.
2. **Missing NO_QUOTE_RULE** — grep count of `double-quote` per route file was a
   PERFECT predictor of which tools survived quote-heavy native input (0 occurrences
   → parse-fail 500/422; ≥1 → survived).

| Tool | de | ar | zh | Root cause |
|---|---|---|---|---|
| lease-trap-detector | 500 (2/2) | 500 (2/2) | 500 (2/2) | main 7000 + facts pre-pass 1500 truncate |
| jargon-assassin | 500 (2/2) | 500 (3/3) | 500 (3/3) | extract leg 4000 truncates + no quote rule anywhere (12 endpoints) |
| contract-decoder | ok (90s, retry burn) | 500 (3/3) | 500 (3/3) | 6000 truncates (ar); verbatim `quote` field + no quote rule (zh) |
| bill-rescue | ok (161s) | 500 (2/2) | ok (130s) | 6000 truncates when all conditional sections stack (paste-bill path) |
| plain-talk /compare | 500 (2/2) | 500 (2/2) | ok (46s) | 4000 vs 15 changes × verbatim text_a/text_b |
| safe-walk | — | ok | 1/2 fail (422!) | no quote rule; SyntaxError misclassified as user's fault (422) |
| drive-home | — | ok | 1/2 fail (500) | no quote rule |
| grief-guide | — | GOOD | GOOD | — |
| scam-radar | GOOD | minor | GOOD | — |
| quote-check | minor | GOOD | GOOD | — |
| research-decoder | GOOD | GOOD | GOOD | best of round, all 3 languages |
| plain-talk main | minor | ok (188s) | minor | arithmetic slips; wrong DE legal advice (see judgment calls) |

## Confirmed defects fixed same-day (all in one push)

- **lease-trap-detector**: main 7000→10000, facts pre-pass 1500→2500, array caps
  tightened (red_flags ≤4 etc.), truncation error copy no longer blames input length.
- **jargon-assassin**: NO_QUOTE_RULE appended to all 12 endpoints' system strings
  (via the shared "No markdown." tail); extract leg 4000→6000.
- **bill-rescue**: main 6000→8000; new OUTPUT LIMITS caps (arrays were uncapped);
  CONSISTENCY RULES (total_potential_savings = Σ flagged_charges; payment-plan
  arithmetic must reconcile; no invented company phone/email — de run had
  457,24 vs 482,24 self-contradiction, zh run had 800×10=8000 vs 7400 base).
- **contract-decoder**: no-quote rule in system prompt + quote-field single-quote
  instruction; clauses cap 10→8; 6000→9000.
- **plain-talk**: /compare 4000→6000 + changes cap 15→8 + merge-duplicates rule
  (zh triple-counted one clause); recompute-sums rule in main + compare (de:
  49,90×24 stated as 1.430,40; zh: 26,750 matching nothing); native-orthography
  rule in followup (ASCII-German drift).
- **safe-walk**: NO_QUOTE_RULE in system prompt; SyntaxError no longer mapped to
  the 422 "add more detail" (was blaming the user for our parse failure);
  reminders-must-not-repeat-checklist rule (battery advice appeared ×3–5).
- **drive-home**: NO_QUOTE_RULE in SYSTEM_PROMPT; withLocaleContext wired
  (was the only priority tool without it).
- **grief-guide**: crisis exemplars locale-neutralized (were 988/Samaritans/911 —
  model overrode correctly in ar+zh runs, but the anchor is the USD-anchor bug
  class; now country-conditional incl. DE 0800 111 0 111, CN 12356, SA 920033360);
  no-invented-URLs rule in support_resources.
- **quote-check**: native-orthography rule (umlaut→ASCII drift infected the
  copy-paste negotiation script from mid-response onward).
- **scam-radar**: no-invented-reporting-channels rule (de: wrong Sparkasse email;
  ar: named Nitaqat — a labor program — as a fraud-reporting app).

## Verified strengths (no action)

- Crisis-resource localization WORKS: ar runs gave real Saudi lines (920033360),
  zh runs gave real mainland lines (010-82951332, 希望24热线) — no US 988/911 leak
  in any safety output.
- Enum integrity held everywhere: zero translated enums across ~25 successful runs.
- Zero annotation leaks across the whole round.
- research-decoder recomputed every planted statistic correctly in all 3 languages.
- bill-rescue caught the planted duplicate charge in both languages that ran.

## Judgment calls (NOT fixed — logged for decision)

- **plain-talk de: stale German law** — treated a 12-month gym auto-renewal as
  binding; § 309 Nr. 9 lit. b BGB (since 2022-03) makes it monthly-cancellable
  after the minimum term. Followup contradicted main and invented a "3-month"
  variant. This is the open legal-grounding decision (see 2026-07-19 report):
  a grounded pre-pass for plain-talk, per-jurisdiction prompt notes, or accept
  hedging. Not patched piecemeal.
- **contract-decoder de**: missed the one outright illegal planted clause
  (1-week Probezeit notice vs § 622 Abs. 3 BGB's 2-week floor) while correctly
  flagging 8/9 — same legal-grounding bucket.
- **Latency**: plain-talk main at 188s (ar) and 150s (de) exceeds/nears the 180s
  bar; bill-rescue 161s (de). Parallel-split candidates if metrics show real
  users on non-English paths.
- **grief-guide zh**: hotlines given were real but omitted 12356 (national line
  since 2025) — exemplar list now mentions it; deeper fix would be grounding.

## New failure modes for the kit checklist

- **Native-orthography drift**: long German responses degrade to ASCII (ae/oe/ue)
  in later fields — hits copy-paste deliverables. No gate can see it (gate 5 checks
  UI strings, not model output). Watch in every future de run.
- **Mixed-script glitch**: "Studiолeiters" (Cyrillic inside German) observed once.
- **422-blames-user**: retry-exhaustion catches that map parse failures to
  "improve your input" messages gaslight users — audit catch blocks when adding
  quote rules.
- **Language-aware budgets**: any max_tokens sized on English/German runs is
  suspect for ar/zh (≈1.3–1.5× needed). When fixing a "German truncation" bug,
  re-verify in Arabic before calling it closed.

## Re-verification (post-fix, same payloads that failed)

All five previously-dead paths re-run after the fixes: lease ar 200/199s,
bill ar 200/163s, jargon de 200/71s, contract ar 200/354s, compare ar 200/77s —
complete, correctly-shaped JSON each. Goldens 10/10 tools green.

## DE gap closure (same day, follow-up agent)

The three safety tools got their missing German datapoint + fix regression test:
- grief-guide GOOD — crisis path → Telefonseelsorge 0800 111 0 111 in 3 fields,
  no US numbers; 8/8 recall.
- drive-home GOOD — NO_QUOTE_RULE holds on quote-heavy input; risk=high with
  sleep-first advice; real A3 Rastplätze.
- safe-walk MINOR — parses clean (previous ~50% fail class gone); reminders now
  condensed; BUT battery concern still in 4 fields (2-cap only partially honored;
  competes with rule 3 "reference throughout" — logged, not re-patched), and one
  hallucinated-precision transit fact ("eine Station" that is 3 stops on the U7)
  → DIRECTIONS rule extended to ban unverified stop counts / park-border streets
  (safe-walk.js:29, pushed same day).
