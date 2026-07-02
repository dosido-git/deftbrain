# SafeWalk — architecture & lock notes (v1, 2026-07-01)

Personal-safety companion: pre-walk route assessment (AI) + client-side walking tools (timer, fake call, GPS share, emergency). In `LOCALIZED_TOOLS`.

- **Model:** single endpoint `claude-sonnet-4-6` + `web_search`, `max_tokens 4000`, `withLanguage`.
- **Endpoint:** `/api/safe-walk` (`action:'assess'`).
- **Golden:** `audit/safe-walk-golden-sample.json` (assess case). Verify: `npm run check:golden safe-walk`.

## DO NOT silently reverse
1. **Guard keys on `checklist` && `watch_for`** (top-level always-present arrays). Correct — do not change to a nullable/nested field.
2. **`max_tokens 4000`** — the max-schema (+web_search) endpoint truncated at 2000. Do not lower.
3. **Try Example uses real option IDs + gate-passing locations.** `loadExample` must set option ids that exist in TIME_OPTIONS/DURATION_OPTIONS/AREA_OPTIONS/ROUTE_FEATURES, and `from`/`to` that satisfy `isLocationComplete` (zip or ", XX" state) — else the pills render unselected and the Assess button stays disabled after "Try Example."
4. Enum values clean: `risk_level`, `severity`, `priority` (frontend switches on them for color/badge).
5. Safety framing intact: disclaimer rendered on results; `tel:911` in the emergency overlay; prompt forbids "you'll be fine" / fabricated local certainty. No currency.
6. Error-state input styling gated on `isDark` (was hardcoded light `bg-red-50` in both themes).
