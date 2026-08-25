# 502s: why they happen and what now prevents them

**2026-08-25.** A 502 is the worst outcome the catalog can produce: the visitor
waits minutes and receives nothing — no result, no error they can act on, no
reason. It is worse than a slow answer and worse than a partial one.

## The arithmetic that caused it

Nothing bounded a request end to end.

| | |
| --- | --- |
| SDK timeout per attempt | 300s |
| SDK `maxRetries` | 1 → 2 attempts |
| `callClaudeWithRetry` `maxRetries` | 2 → 3 attempts |
| These multiply | up to **6 attempts × 300s = 30 min for one call** |
| A guarded route makes | generate + check + repair = **3 calls** |

No edge proxy waits for that. Long before the retries are exhausted the
gateway gives up and answers 502, and the backend is still working on a
response nobody will ever receive. Culture Briefing made this reachable: it is
the heaviest tool in the catalog (~11 sections, historically 145s and observed
spiking past 400s under API load) and adopting v2 added two more calls on top.

## What now bounds it

**1. A wall-clock budget on the retry sequence** (`lib/claude.js`,
`CLAUDE_CALL_BUDGET_MS`, default 150s). Both retry paths — API error and parse
error — check elapsed time before sleeping and trying again. Past the budget it
stops and lets the route's own handler answer, so the visitor gets a real error
instead of a dead gateway.

**2. Deadlines on both guard stages** (`lib/outputGuard.js`,
`OUTPUT_GUARD_CHECK_MS` / `OUTPUT_GUARD_REPAIR_MS`, default 45s each). If the
check overruns, the unguarded result ships. If the repair overruns, the flagged
fields ship as written. Both log a line saying so.

**3. The guard no longer retries** (`maxRetries: 0`). A check that failed once
has already cost the visitor time, and retrying it buys a nicety rather than
the answer.

**The principle: the guard is a quality pass and is never worth the whole
response.** A slightly less polished briefing beats a 502 every time. All three
mechanisms fail open, and all three announce themselves in the log so a
degraded response is visible rather than silent.

## Verified

- `withDeadline` exercised directly: bails at 305ms on a 3s promise, passes a
  fast result through untouched, swallows a rejection without throwing. A
  deadline that never fires looks exactly like one that passes.
- Guard forced to time out (`OUTPUT_GUARD_CHECK_MS=1200`): Culture Briefing
  returned **200 with 11 sections and 3 tips in 48.7s**, log line recorded.
- Defaults unchanged elsewhere: Crisis Prioritizer 200 in 10.8s, guard ran
  normally.

## Still open

These bound the failure; they do not make the tool fast. Culture Briefing is
~50–65s end to end on a good day, and the notes record spikes past 400s under
API load — which the 150s budget now converts into an error rather than a 502,
but an error is still a failure. The real fix for that tool is the
parallel-split pattern (`audit/` notes on slow mega-schema routes): generate
the eleven sections in parallel calls instead of one large one. That is a
larger change and has not been done.
