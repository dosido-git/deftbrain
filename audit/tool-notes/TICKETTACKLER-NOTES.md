# TicketTackler — lock notes (ticket-tackler-v2, 2026-09-15 rewrite)

## 2026-09-15 — owner rewrite: build the case the facts support, not the case the AI can imagine

Owner-authored spec covering description/tagline, input, the full LLM prompt, output
tone, and interface. Full replacement, not a patch — see `audit/REWRITE-INSTALL-KIT.md`
pattern (structural change over iterative prose patching); the previous session's
FocusSoundArchitect rewrite the same day established the same pattern for a different
tool.

**Copy.** Catalog `description`/`tagline`/`seoTitle`/`seoDescription`/`guide` in
`src/data/tools.js` replaced — dropped "complete appeal package" and the promise of
one before the tool has even seen the ticket. New tagline: "Got a ticket? See what kind
of case you actually have." Button label "Build my appeal" → "Review my ticket",
because the correct result may be don't appeal.

**Architecture — structural change, not just prompt text.** The old route ran TWO
**unconditional parallel calls**: a case-assessment call and an appeal-drafting call,
merged with `{...appeal, ...case}`. This meant a full appeal letter was drafted for
*every* ticket regardless of verdict — even a hopeless one — because the appeal call
had no visibility into the case call's verdict (a probe at the original 2026-07-26 lock
had already caught this producing a contradictory "worth attempting" appeal under a
JUST PAY banner). The new prompt makes drafting an appeal **conditional on the
assessment** ("draft an appeal only when there is at least one plausible supported
basis"), which those two calls structurally can't express — you can't condition on an
answer you don't have yet. Fix: collapsed to **one call**, `system` = the owner's full
rule doc (identity, evidence discipline, output philosophy), `user` message = ticket
context + one JSON schema covering everything. `MODELS.SMART`, `max_tokens` 4000
(single call, but the schema is smaller than the old case+appeal combined — no
numeric score, no strength enum, no decision-math cost fields). The `groundedFacts`
pre-pass (`ticket-appeal:{city}:{type}`, 14d cache) is unchanged — it's exactly the
"VERIFIED RULES" evidence category the new prompt names.

**Schema.** `{assessment: {verdict, reason}, what_may_matter[], what_to_verify[],
evidence_to_get[], appeal_letter, how_to_file{}, pay_or_contest: {recommendation,
reasoning}, dont_say}`. Verdict tokens renamed **FIGHT/BORDERLINE/JUST PAY →
WORTH_CONTESTING/VERIFY_FIRST/PROBABLY_PAY** (reused for `pay_or_contest.recommendation`
too, for consistent UI styling). Gone entirely: `case_assessment.fight_worthiness`
(the 1-10 numeric score — "implies predictive precision you do not have"),
`defense_angles[].strength` (strong/moderate/weak — same objection), `description`
(the old case-call summary field, folded into `assessment.reason`),
`decision_math.cost_of_paying`/`cost_of_fighting` (routinely invented "$10-20
reduction", "20-30 minutes", "roughly 15-30 minutes online" — exactly the manufactured
decision math the new PAY VS. CONTEST rule forbids; `pay_or_contest.reasoning` replaces
it with prose that weighs strength/evidence/amount-at-stake/procedural-burden using
**only** the user-supplied fine amount, no invented figures). `defense_angles` renamed
`what_may_matter`, each item gaining a `needs_verification` field (previously
implicit) alongside `issue`/`supports_it` (was `how_to_argue`)/`evidence_that_would_help`
(was `evidence_needed`). `evidence_checklist` renamed `evidence_to_get` — same shape,
`item`/`why`/`urgency` unchanged. New: `what_to_verify[]` — genuine uncertainties with
nowhere else to go before this (facts, rules, deadlines); this was the same missing-slot
problem the WhereDidTheTimeGo `whats_still_unclear` addition solved for that tool.

**Nullability is load-bearing, not incidental.** `what_may_matter` and `what_to_verify`
may legitimately be empty arrays — a hopeless case (see the fire-hydrant-style probe
below) returns `[]` for both, and that's correct, not a broken response. `appeal_letter`
is `null` when there's no supported basis to contest. `dont_say` must be `null` (never
an empty-array placeholder or invented filler) unless the user's own account actually
contains something that could hurt their case. Verified live: a knowingly-parked-in-
front-of-a-fire-hydrant account correctly returned empty `what_may_matter`/
`what_to_verify`, `appeal_letter: null`, and a `PROBABLY_PAY` verdict whose reasoning
explained why — no manufactured angle to fill the schema.

**Binaural-style temptation avoided.** Nothing here needed a FocusSoundArchitect-style
"remove capability X" decision — the removed fields (numeric score, strength enum,
decision math) were pure invented-precision, not a real feature anyone used them for.

**Interface.** Removed the pre-submit "Fighting a bigger bill? BillRescue" line and the
post-result BillRescue + ComplaintEscalationWriter cross-ref pair — both ends, like
FocusSoundArchitect's same-day rewrite. Added `TicketTackler` to
`audit/audit_v2-3-2.py`'s `NO_CROSSREF` set **and** its `_pre_exempt` tuple (both are
needed for a tool with zero links at either end — see the FocusSoundArchitect entry in
that file for why one alone isn't enough). Removed the now-unused `linkStyle` const and
two now-dead `c` keys (`meterBar`/`meterTrack` — the case-strength meter bar they
styled is gone with the numeric score). The verdict banner in the results view lost its
strength meter for the same reason.

**Localization.** All 13 languages patched in one script-based pass (exact-line
replace, verified every anchor existed before writing): 6 fields retexted per language
(tagline, submit, building-spinner, evidence_title, letter_title, disclaimer), the
8-line verdict+strength block renamed/retexted (13×), the 4-line decision-math block
collapsed to 1 line (13×), and the 3 cross-ref keys deleted (13×). Caught and fixed by
the i18n-convention-audit gate (not by translation review): Korean `tt_letter_title`
used the banned pronoun 당신 (dangsin) and Japanese used あなた (anata) — both
dropped, matching the existing convention already followed by every neighboring key in
those two languages ("~할 만함", "요確認" etc. never carry the pronoun either).

**Golden sample rewritten**, not just relabeled — the pre-rewrite fixture's
`decision_math` fields contained exactly the invented time/cost figures the new rule
forbids ("20-30 minutes", "$10-20 reduction"), so a field-rename-only migration would
have preserved the anti-pattern the rewrite exists to fix. Rewrote all 4 main-endpoint
cases' `output` substantively: verdict tokens mapped 1:1 (FIGHT→WORTH_CONTESTING,
JUST PAY→PROBABLY_PAY), `pay_or_contest.reasoning` rewritten to drop every invented
number, the weak case (`weak-case-must-say-probably-pay-en`) now correctly has
`appeal_letter: null` and empty `what_may_matter`/`what_to_verify` instead of a
"no-contest mercy plea" letter (that concept doesn't exist in the new prompt — it never
argues for leniency, only for or against contesting), and the Chicago camera case was
reclassified `VERIFY_FIRST` (renamed `camera-chicago-verify-first`) rather than kept as
a weak `JUST PAY` with one throwaway defense angle — the duplicate-paper-citation
question is a genuine unresolved fact, not a supported issue, so it now lives in
`what_to_verify` rather than a padded `what_may_matter` entry.

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
