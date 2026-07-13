# AwkwardSilenceFiller — architecture & lock notes (`awkwardsilencefiller-v1`)

Conversation-rescue tool for awkward silences. **Frontend:** `src/tools/AwkwardSilenceFiller.js`. **Backend:** `backend/routes/awkward-silence-filler.js` (1 endpoint, 2 actions). **Golden:** `audit/awkward-silence-filler-golden-sample.json` (3 cases). Verify: `npm run check:golden awkward-silence-filler` (needs local backend; ~5–25s/case).

## Shape
- **1 endpoint `/api/awkward-silence-filler`, 2 actions:**
  - **`panic`** — one-line rescue + next 2 exchanges. `haiku-4-5`, `max_tokens: 1500`. Guard on always-present `line`. Fields: `line`, `they_say`, `follow_up`, `silence_ok`.
  - **`full`** — full toolkit. `haiku-4-5`, `max_tokens: 4000`. Guard on `conversation_chains || silence_reframe` (both always present). Fields: `silence_reframe`, `read_the_room`, `conversation_chains[]{category,opener,likely_response,your_follow_up,where_it_leads,risk_level}`, `body_language[]`, `exit_strategies[]{scenario,script}`, `what_not_to_say[]`, `encouragement`.
- Both `withLanguage` + `withLocaleContext` (locale ctx harmless — no economics).
- Enums: `category` (Observation|Shared experience|Humor|Genuine curiosity|Self-deprecating|Compliment), `risk_level` (low|medium|high) — clean; the frontend renders `category` as a label and switches the risk badge color on `risk_level`.
- Three-layer sync clean — every field of both actions renders; all inputs reach the route.
- In `LOCALIZED_TOOLS`; dark mode clean.

## Audit fixes locked here (2026-07-10)
Frontend-only (backend was already solid):
1. **🐛 Dead empty seed button** — a `<button>` (was `:447–460`) that seeded a "networking" example but had **no text content**, rendering as an invisible ~32px-tall / 0-width clickable strip. Removed (the header's "Try Example" already covers seeding).
2. **🧹 Two empty dead `<div>`s** (`:323` in the panic result, `:569` in the expanded chain) — removed.

## Verified (no change needed)
- **`full` mode does NOT truncate in verbose languages** — English ~51% and German ~46% of `max_tokens=4000` (checked live). No i18n truncation trap here (unlike AnalogyEngine).
- Mobile (375px): input + results clean — no overflow/crush; the comfort-level buttons correctly use a `flex gap-2` parent (proper 4-across row). Panic + full both render cleanly.

## DO NOT silently reverse
1. **Guards** — panic on `line`, full on `conversation_chains || silence_reframe` (top-level always-present). Don't switch to nullable fields.
2. **`max_tokens`** — full 4000, panic 1500. Full has comfortable i18n headroom at 4000; don't lower.
3. **Clean enum values** `category` / `risk_level` — the frontend switches the risk badge color on `risk_level` and shows `category` as a label.

## Known / accepted
- **1 pre-existing `audit_v2` PF-2 flag** ("missing alias `c.label = c.labelText`"): the tool defines `c.label` directly (and uses it) instead of the canonical `c.labelText` + alias. Functionally correct; normalizing would rename the key + touch ~6 usages for zero behavior change. Left as-is; diff-audit confirms edits add none.
