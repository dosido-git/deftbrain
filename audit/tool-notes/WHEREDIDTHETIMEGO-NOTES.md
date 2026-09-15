# WhereDidTheTimeGo — audit lock notes (`wheredidthetimego-v2.2`, 2026-09-14)

## 2026-09-14 v2.2 correction round

Five more prompt rules: **NO UNSUPPORTED DURATIONS** (never estimate a vague
period like "two afternoons" into a specific number of hours), **NO VALUE
JUDGMENTS** (don't equate activity with productivity/output, don't adopt the
user's own word like "wasted" as the tool's fact rather than their framing),
**DON'T INVENT THE YARDSTICK** (never infer what the user thinks they should
have accomplished or what would have made the period worthwhile), **ALLOW
UNEXPLAINED GAPS** (say plainly when the account doesn't explain where time
went — a truthful gap beats an invented explanation), and **NEUTRAL
OBSERVATION** (try_this_next_time describes what to notice without priming
the user with speculative possibilities about what they might find).

Also made `session_label`/`session_tags` explicitly facts-only — factual
anchors in the user's own language, never a value judgment like
"unproductive" unless the user used that exact word.

**Interface-only:** removed the sole remaining post-result cross-ref
("Check your burnout risk" → Before the Crash). The tool now carries zero
manual cross-refs by design — added to `audit_v2-3-2.py`'s `NO_CROSSREF` set
(same pattern as WhatsMyVibe the same day). `linkStyle` removed as dead code.

Verified live on a "wasted afternoon" / "week disappeared" account — the
closest real-world trigger for value-judgment and yardstick-invention
failures (golden sample case 3): no invented hour estimate for the vague
"two afternoons," the word "wasted" is attributed to the user rather than
adopted as the tool's own conclusion, and try_this_next_time stays neutral.
**Two soft residuals disclosed, not chased further:** `session_label` used
the word "disengaged" (echoes the DON'T INFER ATTENTION OR CONTROL banned-
state list from v2.1, even though the user never used that word), and
`the_biggest_mismatch`'s closing line introduced "personal projects" as
something the user "normally measures against" — a yardstick the user never
actually stated. Both are subtle enough that a fourth round wasn't obviously
warranted before further live testing surfaces a clearer pattern.

## 2026-09-14 v2.1 correction round

Four new prompt rules, all reinforcing the existing "reconstruct, don't
fabricate" governing rule:
- **PRESERVE NUMERICAL RELATIONSHIPS** — a live v2 result had produced
  "cutting the intended 3–5pm deep-work window from 2 hours to 3 hours,"
  a comparison that doesn't parse as a cut. Calculations from the user's own
  numbers must stay arithmetically correct.
- **DON'T INFER ATTENTION OR CONTROL** — extends DO NOT PSYCHOLOGIZE with an
  explicit list: no inferring divided attention, lack of control,
  disengagement, avoidance, or "forward motion" unless the user said so.
- **DON'T CLAIM COMPLETE ACCOUNTING** — a reconstructed timeline is only
  what the user reported; never imply every hour is accounted for or that
  an undescribed period contained nothing.
- **EXPLAIN ONLY WHAT THE ACCOUNT SUPPORTS** — don't manufacture a
  psychological or productivity explanation just to make the day form a
  satisfying story.

**Behavior change to `try_this_next_time`:** previously "say honestly when
none applies" (always a string); now the model outputs JSON `null` and the
section is omitted entirely when no low-effort, directly-supported
experiment follows. Also tightened: at most one, requires little/no extra
tracking, never a productivity system or reflection exercise. **This is not
a schema/guard change** — `try_this_next_time` was already not
guard-required, and the frontend's `{results?.try_this_next_time && (...)}`
truthy check already hides `null`/absent values correctly. Verified live:
a thin, well-structured "nothing to fix" day correctly returned `null`
rather than forcing a suggestion (golden sample case 2).

**Interface-only:** both textareas (day description, felt discrepancy) are
now vertically resizable (`resize-y`, was `resize-none`). The sole
post-result cross-ref ("Check your burnout risk" → Before the Crash) moved
from directly under the results to below the Recent Days history section.

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
