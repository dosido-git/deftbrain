# BuyWise — Architecture & Decision Record

Known-good baseline: **commit `e0ceddf`, tag `buywise-v1`** (June 2026).
This documents the *why* behind BuyWise's current shape so a future edit
doesn't unknowingly undo a deliberate decision. The five pre-push gates
check structure, not output quality — BuyWise is prompt-driven, so a
prompt/model change can degrade results while every gate stays green.
Treat this file as the guardrail.

## Current shape (`backend/routes/buy-wise.js`)

- **`POST /buy-wise/fast`** is the primary analysis path. It runs as a
  **balanced fan-out**:
  1. **Decision pre-pass** — one tiny call that locks the `verdict`,
     `verdict_emoji`, `verdict_summary`, `product_category`, plus the
     `fair_price` and `timing` **badges**. These are injected verbatim
     into the groups so sections can't contradict the headline.
  2. **Three weighted groups run concurrently** (`Promise.allSettled`):
     - **A — presentation:** fair_price, where_to_buy, followups,
       bottom_line, + conditional impulse_check / gift_analysis / comparison
     - **B — cost:** total_cost, cheaper_alternative, used_refurb_deep_dive,
       buy_vs_subscribe, quality_tier
     - **C — risk & timing:** timing, warranty_returns, regret_predictor,
       watch_out, negotiation
  3. **Merge** into one JSON object (same shape as the single-shot route).
  A failed group is omitted (its panels don't render); a failed pre-pass
  500s and the **frontend falls back to `POST /buy-wise`**.
- **`POST /buy-wise` (single-shot)** is retained unchanged as the fallback.
- **Model: `claude-opus-4-8` on ALL analysis calls** (every mode).
- **`PERSONALITY`** carries the behavioural rules: CONSISTENT NUMBERS,
  CHALLENGE THE PREMISE, ESTIMATES ARE ESTIMATES, **NO INVENTED LIMITS**
  (don't fabricate a budget/ceiling the user never gave), **FINANCING
  REALITY** (dealer reserve can make in-house financing discount *more*).
- Frontend (`src/tools/BuyWise.js`) calls `/buy-wise/fast` as plain JSON.

## Why these choices (do not silently reverse)

- **Fan-out, not one big call** — splits ~8K tokens of sequential JSON into
  3 concurrent groups → wall-clock ≈ slowest group, not the sum (~35–50s
  vs ~75s). The win is the *parallelism*, not streaming.
- **Decision pre-pass** — fixes cross-section contradictions (verdict says
  "WAIT" while timing says "BUY NOW"). The groups can't see each other, so
  the locked stance is the only thing keeping them coherent. Don't remove it.
- **Opus 4.8 over Sonnet 4.6** — measurably better recall + calibration
  (e.g. a used-BMW price range that *contained* the real street price where
  Sonnet's ran ~$8K high), and in testing it was also *faster*. Worth the
  ~1.7× token cost. Don't downgrade to Sonnet without re-testing quality.
- **No SSE streaming** — an earlier `/buy-wise/stream` (SSE, panels popping
  in) was removed. It only improved *perceived* latency and added a frontend
  reader + spinner for no real wall-clock gain. Don't reintroduce it.

## Grounding (web search) — TRIED AND REJECTED

A two-stage live-web-grounding design was built and tested, then removed.
Do not reintroduce **synchronous, in-request** grounding expecting it to work.

- **Latency wall (structural):** web search is an agentic loop — research
  alone was ~56s on Sonnet, **>75s on Opus + adaptive thinking**. Stacked on
  the fan-out, a grounded request landed at **110–140s**. Not tunable away.
- **Quality didn't pay off:** generic web search returns *asking / listing /
  MSRP* prices, which skew **high** vs real transaction prices; Opus over-
  anchored on new MSRP. Even when grounding ran, a warranty term came back
  wrong. So it was slower *and* not reliably more accurate.
- **If revisited:** it needs an **async architecture** — return the fast
  ungrounded result immediately, run research in the background, update the
  result when it lands. That's a separate project, not a flag flip.
- Full exploration is in the session history around tag `buywise-v1`.

## Known residual limitation (inherent, not a bug)

No live data → **price/tier calibration can skew**, usually *low* for
high-value items (e.g. recommending a lock cheaper than the security a
$2,500 carbon bike actually warrants). This is the model reasoning from
training-era market knowledge. Only real grounding fixes it, and grounding
isn't viable synchronously (above). Accept it, or pursue async grounding.

## When you change BuyWise

1. Run all five gates (`npm run check:syntax`, `audit`, `scan-guard-keys`,
   `diff-audit.py`, `localization-audit`) — necessary but **not sufficient**.
2. Run a real analysis and compare against a known-good output (keep a
   golden sample). Gates won't catch quality regression.
3. If you touch the model string, the audit allowlist is in
   `audit/backend_audit_v1_7.py` (`ALLOWED_MODELS`).
