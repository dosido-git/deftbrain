# TicketTackler — lock notes (ticket-tackler-v1, 2026-07-26)

Parking/camera-ticket appeal builder. Built 2026-07-25 (ad7682a), locked next
day after a 5-case edge probe + fixes. Route `backend/routes/ticket-tackler.js`,
frontend `src/tools/TicketTackler.js`, fully localized (13 langs, allowlisted).

## Architecture (current standards from day one)

- **Parallel split** (latency): case call (case_assessment + defense_angles +
  evidence_checklist, 3500) ∥ appeal call (appeal_letter + how_to_file +
  decision_math + dont_say, 3500). Disjoint keys, merged `{...appeal, ...case}`.
  Guard: `parsed.case_assessment` (top-level, always present). Measured: 39-62s
  cold (incl. grounding), followup 5-6s.
- **Grounded pre-pass** via lib/groundedFacts: cacheKey
  `ticket-appeal:{city}:{type}` (14d TTL). Hyper-local → low hit-rate expected;
  empty result degrades to the generic-channel rule, never invention.
- **Vision**: ticket photo as image content block in BOTH split calls.
- **Positioning guardrail** (DoNotPay FTC lesson): "helps you write your own
  appeal" — no outcome promises in prompts; disclaimer key in UI.

## Probe findings fixed before lock (2026-07-26)

1. **Cross-call verdict contradiction**: appeal call recommended "worth
   attempting" under a JUST PAY banner (it can't see the case call's verdict —
   structural, parallel split). Fix = bottom_line rule: no-defense account →
   recommend paying. Passing the verdict across calls would serialize the
   split; don't.
2. **Hypothetical defenses ranked strong** (stolen/leased-vehicle boilerplate
   the user never claimed) → angles must be grounded in the user's account.
3. **Unverified day-count** ("within 60 days") → day-counts only if VERIFIED
   or user-provided.
4. **Statute cited slightly wrong as certain** (§ 45 StVO variant) → cite
   sections only when certain, else describe the rule.

Verified impressive: grounding produced REAL small-city specifics (Pocatello
blue payment boxes, Schwäbisch Gmünd Ordnungsamt address+email — all
web-checked by the probe agent); honest JUST PAY (fight_worthiness 1) on the
clear-cut case, no sycophancy.

## Recurring bug classes to watch (from catalog memory)

- Enum translation (verdict/strength/urgency badges) — pinned English, guarded
  in golden meta.
- fight_worthiness consumed as `{n}/10` + meter width — bare integer pinned.
- German quote-heavy input — NO_QUOTE_RULE in both split prompts + followup.
- Invented-procedure risk in ungroundable cities — the generic-channel rule is
  the load-bearing defense; probe it in every quality wave.

## Verify

`npm run check:golden ticket-tackler` — 5 cases (small-city EN, quote-heavy DE,
weak-case JUST PAY, camera consistency, followup). Structure only — eyeball
wording after prompt edits.
