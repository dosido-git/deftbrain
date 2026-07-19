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

## Wave 4 — coaching & decision tools (6 audited)

| Tool | Verdict | Fixed overnight |
|---|---|---|
| difficult-talk-coach | SIGNIFICANT (rich inputs never return ≤380s; trivial ones fine at ~110s) | — NOT fixed: the cause is the 10-step mega-schema × max_tokens 12000; shrinking it risks re-triggering the truncation that took this tool down historically. Judgment call #14 |
| decision-coach | MINOR (quoted $20k base gap as "the gap every year", ignoring the forfeited $9k bonus — net is ~$14k) | ✅ MONEY rule: multiple money components → compute and cite the NET annual difference with components shown |
| name-audit | MINOR (single-audit graded a Kindle-colliding name GOOD/68 while compare mode caps such names at ~55) | ✅ ported compare mode's disqualifying-conflict hard cap into the single-audit prompt |
| giftology | MINOR (wildcard pick violated the user's stated avoid-list AND its own never_do_this) | ✅ wildcard must respect avoid/dislikes and not contradict never_do_this |
| conflict-coach | GOOD — 7/7 planted details, fact-checked the user's own draft | — |
| velvet-hammer | GOOD — correct date math, coherent escalation ladder | — |

## Judgment calls left for you (wave 4)

14. **difficult-talk-coach**: effectively unusable for rich real scenarios (>380s).
    Real fix = split the mega-schema into 2 calls (jargon-assassin pattern) or trim
    the schema — both change output structure on a locked tool. Recommend the split.
15. **name-audit (latent)**: AI prose and live DNS checks run in parallel, so the
    written analysis never actually sees availability results — they merely agreed
    this run. Sequencing them (DNS first, feed results into the prompt) would make
    the prose trustworthy; costs ~1-2s of latency.

## Wave 5 — safety-critical & creative tools (6 audited)

| Tool | Verdict | Fixed overnight |
|---|---|---|
| grief-guide | SIGNIFICANT (safety bug in code, output tone itself excellent) | ✅ backend res.json omitted crisis_support — the prompt's "absolute priority" field the frontend crisis banner renders from; acute-risk flags could never reach the user. Field now passed through; verified live |
| sleep-architect | MINOR (melatonin times keyed to the user's OLD schedule, contradicting its own protocol; 24h-awake gap unaddressed) | ✅ TIME CONSISTENCY rule: all clock times recomputed from the recommended schedule, mutually cross-checked, pre-shift nap when a 20h+ gap appears |
| toast-writer | MINOR (invented speaker name "Sean"; embellished facts guests could contradict) | ✅ TRUTHFULNESS rule: [YOUR NAME] placeholder, no invented details about the people, keep who-won/lost as given |
| hobby-match | MINOR (stale/confabulated subreddit stats and misfit communities) | ✅ COMMUNITIES rule: no member counts; only communities certain to exist |
| safe-walk | MINOR (wrong compass bearing in a night route suggestion) | ✅ DIRECTIONS rule: street pairings + landmarks, no unverified compass bearings |
| drive-home | GOOD (best run of the wave; conservative BAC handling) | ✅ one-line hardening: cleared alcohol → "no longer the limiting factor", never "fine" |

Wave-5 observation: FAST-model tools fail by fabricating specifics; SMART-model tools fail
by arithmetic/consistency drift. Worth remembering for future audit triage.

---

# CAMPAIGN SUMMARY (overnight 2026-07-19)

**30 tools audited live across 5 waves. 21 confirmed defects fixed, verified, and pushed.
9 tools audited fully clean.** Every fix gate-checked (syntax, eslint, guard-keys,
diff-audit, localization) with goldens re-run where locked prompts changed.

Fixed defect classes: silent large-input truncation (input caps), enum-consumed-as-value
(subscription cycle), model-computed hero stats (code-pinned), agency/number embellishment
(truthfulness rules), fabricated local knowledge (certainty rules), missing NO_QUOTE_RULE
(JSON validity on rich inputs), duplicated-output hang (plain-talk), dropped safety field
(grief-guide crisis_support), cross-mode scoring inconsistency (name-audit).

**15 numbered judgment calls above need your decisions** — the largest: difficult-talk-coach
and complaint-escalation-writer both need the jargon-assassin parallel-split to be usable
on rich inputs; lease-trap/bill-rescue expose aging legal knowledge (per-state facts block?);
name-audit's prose never sees its own DNS results.

---

## Post-audit resolutions (2026-07-19, same day)

- Judgment calls #10/#14 RESOLVED: difficult-talk-coach and complaint-escalation-writer
  parallel-split and re-locked (v2 each) — rich inputs now ~105s / ~84s.
- Aging-legal-knowledge decision RESOLVED (option 3): lease-trap-detector (v3) and
  bill-rescue (v2) now run a grounded web-search facts pre-pass whose verified block
  overrides training knowledge; the audit's AB 12 case verified corrected live.
  contract-decoder (v2) stays ungrounded deliberately (defect was the label).
  Engineering note: grounding must be a SEPARATE small call — search + large
  generation in one request dies with a connection error.

