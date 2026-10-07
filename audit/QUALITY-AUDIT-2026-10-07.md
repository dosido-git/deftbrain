# Quality Audit — 2026-10-07 (cohort 3: coaching + rebuilt tools + priority safety loop)

Scheduled wave (unattended). Rotation advances to **cohort 3 — coaching**
(conflict-coach, difficult-talk-coach, velvet-hammer, decision-coach, money-diplomat,
mend — apology-calibrator's route was renamed to `mend.js` on 2026-09-08). Three
tools rebuilt since the last wave jumped the queue: **someone-said-it-better** (new,
edited today), **ticket-tackler** (two-stage investigator/reviewer + live search),
**analogy-engine** (fact-check pass + number rule). Plus the standing priority loop
(grief-guide, drive-home, safe-walk, lease-trap-detector, bill-rescue).

English only, one realistic run each of the primary endpoint, planted checkable
details, quoted dialogue in two+ inputs as the NO_QUOTE_RULE probe. 14/14 returned
HTTP 200 in 10–116s — **no truncation, no latency finding, no annotation leak, every
quote probe parsed clean.** Secondary endpoints of multi-endpoint routes were not run.

**Run ended on a backend-wide failure:** after the wave, every model call on the local
backend started returning 500 (English goldens that had passed minutes earlier, on
untouched endpoints, all failed). Same signature as the 2026-08-29 credit exhaustion;
server logs were not readable from this run, so the cause is unconfirmed. See Fixed.

## Verdicts

| Tool | Verdict | Time | Headline |
|---|---|---|---|
| ticket-tackler | **SIGNIFICANT** | 106s | read the "sweeper already passed" exemption as covering a car parked *before* the sweep → STRONG_REASON_TO_CONTEST + appeal letter on a misread rule |
| lease-trap-detector | **SIGNIFICANT — REGRESSED** | 53s | Boston late fee before day 30 (c.186 §15B(1)(c)) and $75/$300/$400 upfront fees (§15B(1)(b)) not flagged; heat statute cited 3 different ways |
| money-diplomat (split) | **SIGNIFICANT** | 116s | equal split $91.68 vs true $89.61; proportional shares sum to $401.18 of $448.05; itemised orders sum to $390 not $412, nobody noticed |
| conflict-coach | **SIGNIFICANT** | 32s / 37s | the visitor's key fact (deadline moved Mon→Fri, told Wednesday) dropped in run 1, misstated as "Thursday" in run 2 |
| decision-coach | MINOR | 36s | two empty `execution_instructions` render as empty numbered circles; overstated "a promotion on record" |
| bill-rescue | MINOR — HOLDS | 70s | dates now consistent; missed the statement's own arithmetic ($3,394 − $1,060.50 ≠ $3,184.50); 365-day credit-bureau policy called "law" |
| safe-walk | MINOR — IMPROVED | 45s | no invented borders/outage, real park hours cited; battery concern still in 7 fields; invented "platform USB port" |
| drive-home | MINOR — IMPROVED | 20s | banned factors_in_favor line gone; `main_concern` cut mid-word ("...flagged your") by a bare 260-char slice |
| mend | MINOR | 40s | mind-reads the friend; string `"N/A"` under `applies:false`; "call, don't text" vs a text template first; no output guard |
| difficult-talk-coach | MINOR | 39s | Very Firm message invents "I'm going to call your doctor"; same 3 anticipated responses across all 3 approaches |
| someone-said-it-better | MINOR | 13s* | every quote real and correctly attributed, no origin claim beyond the packet; one quote sourced from kwize.com (banned aggregator) |
| grief-guide | **GOOD** — HOLDS | 19s | resources fit spousal loss (Compassionate Friends issue gone); 911 from the table; named 988 despite the no-hotline-names rule |
| velvet-hammer | **GOOD** | 10s | every planted detail recalled, nothing invented |
| analogy-engine | **GOOD** | 73s | all arithmetic correct |

\* someone-said-it-better: the first research attempt failed and was negative-cached; a forced retry succeeded.

Priority loop: **lease-trap-detector REGRESSED** (GOOD → SIGNIFICANT); safe-walk and
drive-home IMPROVED; bill-rescue and grief-guide HOLD.

## Confirmed defects

**ticket-tackler** — invented legal reasoning in the reviewer stage
(`ticket-tackler.js:70-113`): quoted TRC 7.2.22 text covering a car "parked after the
sweeper has already passed", applied it to a car parked the night before. Also: "was
Sept 22 the 4th Tuesday?" handed to the user (computable — it was); "payment before
filing waives the right to contest under California law" stated with no verified
source; 2 of 4 VERIFIED findings matched a retrieved source; told the user footage of
the car in frame "strengthens the claim".

**lease-trap-detector** — the 4-item `red_flags` cap (`:136`) filled with deposit /
return / entry / heat, crowding out two illegal fee structures, although a
"Massachusetts Late Fees" page was among its own verified sources. `noticed` repeated
a question the tenant had already asked. The code-pinned `major_concerns_count`
held (4 = 4) — but the number check ran *after* the pin (`:398`) and could rewrite it.

**money-diplomat /split** — wrong arithmetic throughout (above). The number checker
sees each context field cut to 600 chars (`lib/factCheck.js:318`) so most line items
never reached it, and it fixes one field at a time so it can't rebalance a breakdown.

**conflict-coach** — the guard's `supplied` text (`:100-103`) omitted `actualGoal`
("in their own words"), so facts the visitor typed there read to the guard as
invented and were stripped/rewritten. `/followup` read `message_analysis` /
`response_strategies` (`:135-140`), keys the route stopped returning — follow-ups got
no strategy context.

**decision-coach** — `requiredNonEmpty` covers only `choice` (`:86`); empty step
strings reach `DecisionCoach.js:468`.

**drive-home** — `compactString` (`:322`) was a bare `slice`.

**mend** — string `"N/A"` (same class as 2026-08-29's string `"null"`).

**someone-said-it-better** — `cleanPacket` (`lib/quoteResearch.js:23-44`) never
filters domains, so an aggregator the research prompt bans can source a quote.

## Fixed this wave (commit 28b738b5)

- `conflict-coach.js` — `actualGoal` added to the guard's supplied text; `/followup`
  reads `message_read` / `strategies[].title`.
- `decision-coach.js` — empty `execution_instructions` dropped after the guard.
- `drive-home.js` — `compactString` backs off to a sentence end, else a word boundary
  + "…", else hard-cut (languages without spaces).
- `lease-trap-detector.js` — `major_concerns_count` re-pinned after the number check.

Gates 1–5 pass. **Goldens could not verify these changes:** the shared local backend
had been running 2.5h (no reload of the edits), and then every model call began
returning 500 mid-golden (see top). The pre-push golden step therefore failed and
**the fix commit was not pushed** — it is on local branch
`audit-fixes-2026-10-07` (see the run summary); push it once the backend is healthy
and goldens pass on a restarted server.

## Deferred (prompt edits / redesign — need goldens)

1. **ticket-tackler** — reviewer must test each condition of a cited rule against
   the facts before calling a case strong; compute calendar facts (nth weekday) in code.
2. **lease-trap-detector** — fee legality must be checked in the money section, not
   compete for the 4 red-flag slots; one statute per fact across parallel groups.
3. **money-diplomat /split** — compute equal/proportional splits in code from the line
   items; flag when line items don't sum to the stated subtotal.
4. **mend** — ground claims about the other person; coerce `"N/A"` to null; add a guard.
5. **difficult-talk-coach** — forbid inventing a consequence the visitor hasn't
   decided on; `:251` lists 3 of 4 level values (`persistent` missing).
6. **safe-walk** — enforce one mention per supplied concern in code.
7. **bill-rescue** — have the autopsy check the statement's own totals
   (`factCheck.js:251` treats visitor input as given).
8. **someone-said-it-better** — domain filter in `cleanPacket`; don't negative-cache a
   first research failure so aggressively.

## Judgment calls for you

- **grief-guide named 988** (correct for the US) although the prompt forbids naming
  hotlines; the schema line at `:199` ("real, relevant support option") pulls against
  `:152`. Crisis text skips the guard (`:31`) and `more_support` is never guarded.
  Allow 988 via the emergency-number table, or hold the line? Outside the US the
  same behaviour could produce a wrong number.
- **drive-home** recommended "pause" for 16h40m awake with yawning — defensible.
- **bill-rescue** did not mention California's hospital rule against early collections
  referral — omission, or out of scope?
- **decision-coach** ignored a planted $14k card debt at 24% when choosing between
  two job offers — relevant constraint or not the question asked?

## New for the kit checklist

- **Guard `supplied` must include every free-text input.** A field the visitor typed
  but the guard never sees turns the guard into the thing that deletes their facts
  (conflict-coach `actualGoal`). Grep each route's `supplied:` against its
  destructured `req.body`.
- **A post-pass after a code pin can undo the pin.** Anything code-computed must be
  set after the last model-touching pass (number check, guard).
- **A bounded list can hide the most important finding.** A red-flag cap is a
  priority decision; legality-class findings need a slot that isn't contested.
- **Wave logistics:** running goldens on a shared backend you didn't start tests the
  old code — check `/api/health` uptime against your edit time first.
