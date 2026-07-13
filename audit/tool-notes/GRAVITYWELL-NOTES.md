# GravityWell — architecture & lock notes (`gravitywell-v1`)

90-day "orbit strategy" for building genuine influence with a specific person: target profile,
a current→target gravity score, a 3-phase plan, first-contact scripting, and a value offer.
**Frontend:** `src/tools/GravityWell.js` (in `LOCALIZED_TOOLS`, `gw_` keys). **Backend:**
`backend/routes/gravity-well.js` (single endpoint). **Golden:** `audit/gravity-well-golden-sample.json`
(1 case). Verify: `npm run check:golden gravity-well` (~40-90s; sonnet).

## Shape
1 endpoint `/gravity-well`, `claude-sonnet-4-6` (`MODELS.SMART`), **`max_tokens 3500`**, via
`callClaudeWithRetry` + `withLanguage` + `withLocaleContext`. Guard `!target_profile`
(top-level, always-present) ✅.

## Audit fixes locked here (2026-07-12)
1. **🐛 Leak on a field used as raw CSS width.** `your_gravity_score.current` and
   `gravity_score_target` are rendered BOTH as a displayed score AND as a raw
   `style={{ width: value }}` progress-bar width. Their schema examples were verbose instructions
   ending `— one sentence` (`"A percentage … e.g. '3%' — one sentence"`), so the model could return
   prose → broken progress bar + garbled score. **Fix:** schema example is now a **bare percentage**
   (`"current": "3%"`, `"gravity_score_target": "71%"`) + an explicit rule: "must each be a BARE
   percentage string ONLY — they render as progress-bar widths." Verified live: `'3%'` / `'71%'`,
   both match `/^\d{1,3}%$/`.
2. **⚠️→cleaned: 31 annotation leaks** — `— one sentence` ×28, `— 3-6 words` ×3. Notable: phase
   `name` (rendered as the phase header, e.g. `"Weeks 1-3: Become Findable — 3-6 words"`) and
   `the_first_contact.what_to_say` (copy-paste). Stripped + one global brevity/RULE line.
3. **⚠️ Truncation risk.** Only endpoint at `max_tokens 2000` with **unbounded** `actions[]` per
   phase (×3). **Fix:** cap actions to 2-3 per phase + `max_tokens` 2000 → **3500**. Verified live:
   German = 200, actions 3/3/3, ~6.5KB.

## DO NOT silently reverse
1. `your_gravity_score.current` + `gravity_score_target` are **bare percentage strings** — the
   frontend uses them as CSS `width:`. Never a sentence.
2. `actions` 2-3 per phase + `max_tokens >= 3500`.
3. NO annotation suffixes on phase `name` (header) or `what_to_say` (copy).
