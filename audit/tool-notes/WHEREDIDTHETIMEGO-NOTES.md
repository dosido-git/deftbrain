# WhereDidTheTimeGo — audit lock notes (`wheredidthetimego-v2`, 2026-09-14)

Backend `where-did-the-time-go.js` — 1 endpoint `POST /where-did-the-time-go`, `MODELS.FAST`, max_tokens 3500. Reconstructs a day from the user's own account.

## 2026-09-14 owner rewrite

The v1 tool invented time. Its golden sample's DE case literally produced "3-5 Minuten um in den neuen Kontext zu schalten," "8-12 Mal nachgeschaut... jede Check dauert 2-3 Minuten," and "präfrontalen Cortex erschöpft" — pseudo-neuroscience with zero basis in what the user described. Full rewrite around one CORE RULE: **reconstruct, do not fabricate.**

**Removed entirely:**
- `the_visible_day` — the you-think/likely-actual/hidden-overhead structure invented a more precise timeline than the user supplied for every single activity.
- `the_invisible_hours` — a wholly fabricated category of "context-switching recovery," "decision fatigue," "micro-interruption accumulation," each with an invented minute estimate.
- `honest_capacity` — declared the user's "realistic capacity" with no evidence to support the specific number.
- The pre-submit Task Avalanche Breaker line and the boxed "Related tools" section (see S5.5 note below).

**New schema:** `{the_day_you_described: [{time, note}], what_made_it_feel_different[], the_biggest_mismatch, try_this_next_time, session_label, session_tags[]}`. `the_biggest_mismatch` and `try_this_next_time` are deliberately **not guard-required** — the prompt instructs the model to say honestly when the account doesn't support one ("If no useful change follows from the account, say so honestly instead of forcing one") rather than manufacture an answer. `session_label`/`session_tags` exist only to drive the Recent Days history card with a short, neutral, LLM-generated label — never the raw pasted narrative.

**Core discipline (system prompt):** an explicit list of things the model must never invent (transition minutes, recovery time, focus-block lengths, check-counts, productivity percentages, what the user's brain was doing) plus a DO NOT AUDIT NORMAL LIFE rule (showering/eating/scrolling aren't inherently "lost" time) and a DO NOT PSYCHOLOGIZE rule (no inferring decision fatigue, anxiety, motivation).

## Fixes carried forward from v1
- **Truncation risk:** v1 needed hard array caps + max_tokens 3500 after a 500 on a verbose 5-activity German day. The new schema is much smaller (no per-activity 4-field breakdown, no invisible-hours section), so headroom is real, but `the_day_you_described` still carries a soft cap (≤12 entries, "group closely-related minutes together") for very long "this week" accounts — watch this if a truncation report comes in.
- **German unescaped double-quotes:** prose fields quote the user's own words; kept the no-inner-double-quote rule at both the system-prompt and schema-field level.
- **PF-2:** `c.textMuteded` + `c.label` aliases kept.

## 2026-09-14 fixes made during the rewrite
- **Missing working "Start Over" button:** the pre-existing PF-3 "replace-mode" ternary rendered a completely separate results-phase header card with NO reset button at all — once you had results, there was no way back to a blank form except browser back. Restructured into a single always-rendered header (icon+tagline+the one reset button) with only the FORM fields swapping via `{!results && (...)}` underneath. This also fixed a PF-16 "2 reset buttons" false-trip the naive fix (two separate headers, each with its own `onClick={handleReset}`) would have introduced.
- **S5.5 pre-result cross-ref exemption:** the removed pre-submit line ("Feeling overwhelmed? Task Avalanche Breaker helps you triage what to tackle first.") sat right after the submit button, offering to reroute a visitor who came to reconstruct their day before they'd gotten a result — same pattern as the ColdOpenCraft/ComebackCooker/ConflictCoach/WhatsMyVibe precedent. Added `WhereDidTheTimeGo` to `audit_v2-3-2.py`'s `_pre_exempt` tuple with a dated rationale comment.
- **Post-result cross-ref, singular:** replaced the boxed "Related tools" section (BeforeTheCrash + WhichLife + BeliefStressTest) with one minimal line to Before the Crash — the site's own RelatedLinks algorithm already auto-surfaces BatchFlow for this tool (verified via the standalone tag/category-overlap script), so Before the Crash was picked specifically because it's not in that auto-surfaced set.
- **Session history redesign:** `wheredidthetimego-result`/`-history` bumped to `-v2` (schema changed completely). History entries now store the full `dayDescription`, `perceivedBreakdown`, `timeframe`, and `results`, not a 40-char raw-text preview — clicking a Recent Days card fully restores the reconstruction and original input, and the card label comes from the model's own `session_label`/`session_tags`, never the opening fragment of the user's private account.

## Not bugs (verified)
- No i18n-enum, no format-strict fields (all prose/arrays), no USD-anchor.
- Guard `!Array.isArray(parsed.the_day_you_described) || !parsed.the_day_you_described.length || !Array.isArray(parsed.what_made_it_feel_different) || !parsed.what_made_it_feel_different.length` keys the two always-substantive top-level fields. Correct.

## Verify
`npm run check:golden where-did-the-time-go` (1 DE verbose case). Backend must be up.
