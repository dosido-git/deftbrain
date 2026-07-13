# LeverageLogic — architecture & lock notes (v1, 2026-07-02)

6-view negotiation strategist: full game plan (leverage map, scripts, concession ladder, BATNA) + Counter / Prep Check / Simulator / Email Drafter / Debrief, plus a client-side anchoring calculator and round timeline. 6 `claude-sonnet-4-6` endpoints. In `LOCALIZED_TOOLS`.

- **Golden:** `audit/leverage-logic-golden-sample.json` (strategy + debrief). Verify: `npm run check:golden leverage-logic`.

## DO NOT silently reverse
1. **tools.js metadata describes THIS tool** (negotiation strategist — tagline "Win any negotiation with the right strategy"). It previously described a nonexistent opportunity-ROI calculator, and since the header renders `tool?.tagline ?? …`, the wrong tagline was LIVE on every view (plus wrong SEO + guide).
2. **Enum values are bare tokens** — the frontend ===-switches them: `outcome_grade` (`A | B | C | D`, rendered text-6xl with grade colors), `value_left_on_table.likely` (`yes | no | maybe` — an annotated "yes — …" fell to the green "solid deal" branch: an **inverted verdict**), `danger_level`, `strength` ×2. The debrief golden guards the clean values.
3. **"Log this round & ask again" writes the exchange directly to the timeline** (`setTimeline([...prev, {who:'them', what: theyJustSaid…}])`) — calling `addTimelineEntry()` reads the results-view draft fields (empty in the counter flow) and silently logged nothing.
4. **Results restore on reload**: `results` and `timeline` are persisted, and a mount effect sets `view('results')` when results exist — otherwise the saved strategy is unreachable (view state resets to 'form') while the copy bar serves invisible content.
5. prep-check guard is `parsed.readiness_score == null` (numeric — a legitimate score of 0 must not 500).
