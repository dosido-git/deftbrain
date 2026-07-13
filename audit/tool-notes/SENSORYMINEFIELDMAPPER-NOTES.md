# SensoryMinefieldMapper — architecture & lock notes (v1, 2026-07-01)

Sensory-planning tool for neurodivergent/sensory-sensitive users: scouts a place before a visit (crowd/noise/light/intensity), game plan, comfort kit, route, live rescan. In `LOCALIZED_TOOLS`.

- **Model:** all 6 endpoints `claude-sonnet-4-6`, `withLanguage` (no currency — correct).
- **Endpoints:** `/api/sensory-minefield-mapper` (main), `/alternatives`, `/companion-summary`, `/rescan`, `/route`, `/comfort-kit`.
- **Golden:** `audit/sensory-minefield-mapper-golden-sample.json` (grocery scout). Verify: `npm run check:golden sensory-minefield-mapper`.

## DO NOT silently reverse
1. **Enum values stay clean** (frontend does exact `===` matching):
   - `intensity_rating` (low|moderate|high|intense) — drives the summary-card color + saved favorites/history.
   - `priority` (must_have|nice_to_have) — the comfort-kit "MUST" badge.
   - `stay_or_go` (stay_with_adjustments|take_a_break|consider_leaving) — the live rescan verdict; a leaked annotation silently flipped a "leave" verdict to the green "doable" branch (safety-relevant).
2. **Main `max_tokens 8000`** — max-schema (7-concern) analysis truncation headroom.
3. **All 6 guards key on top-level fields** (location_summary, better_times, message_casual, quick_assessment, route_summary, essentials) — correct.
4. Required-field labels carry a single asterisk (baked into the i18n strings — do NOT add a `c.required` span on top; that produced a double asterisk).
5. Medical framing: "practical planning, not medical advice"; predictions framed as estimates.
