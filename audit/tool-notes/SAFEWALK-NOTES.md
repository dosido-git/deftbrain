# SafeWalk — architecture & lock notes (`safewalk-v1`)

Personal-safety companion for walking alone: pre-walk route assessment (AI) + client-side walking tools (check-in timer, fake call, GPS share, two-tier emergency, flashlight, contacts). In `LOCALIZED_TOOLS`. **Frontend:** `src/tools/SafeWalk.js` (large — 2 tabs + several full-screen overlays). **Backend:** `backend/routes/safe-walk.js` (1 endpoint, 1 action). **Golden:** `audit/safe-walk-golden-sample.json` (3 cases). Verify: `npm run check:golden safe-walk` (needs local backend; ~50–60s/case due to web_search → ~3min for 3; rate limit ~12/min).

> **History:** a Jul-1 pass wrote a lock note but never landed the golden/tag (half-landed — see `deftbrain-audit-batch3-fixes`). This is the real lock: golden captured, 3/3 passing, tagged.

## Shape
- **1 endpoint `/api/safe-walk`, 1 action `assess`.** `claude-sonnet-4-6` + `web_search_20250305`, `max_tokens: 4000`, 3-attempt retry, `withLanguage` (no `withLocaleContext` — safety tool, no economics).
- Output: `safety_overview{risk_level,summary,local_context}`, `watch_for[]{concern,detail,severity}`, `checklist[]{item,why,priority}`, `route_suggestions[]{suggestion,reasoning}`, `before_you_go{eta_message,reminders[]}`. Three-layer sync clean — every field renders; every UI input reaches the route.
- Success guard keys on **always-present arrays** (`checklist` + `watch_for`) — no nullable-field false-500.
- `<cite>` tags stripped **twice** (backend `stripCites` + frontend `stripCitesDeep`) — web_search wraps phrases in citation markup inside JSON strings.

## Audit fixes locked here (2026-07-10)
1. **🐛 Deterministic 500 on vague input.** Sub-minimal routes ("downtown"/"home") made the model answer in **prose** ("I need more information…") instead of JSON → `JSON.parse` failed all 3 retries → generic 500. Fixed two ways: (a) **system-prompt rule 12** + a user-prompt line force it to ALWAYS return the schema, never prose — if it wants detail it puts the ask inside `safety_overview.summary`; (b) a persistent `SyntaxError` now returns a **graceful 422** ("Add a bit more detail about your route…") instead of a bare 500. The `vague-guard` golden case locks this (must be 200 + full schema). *Mitigating: the frontend `isLocationComplete` gate already blocks this in the UI — but the endpoint is public and the model can break format on borderline input, so the fix matters for robustness.*
2. **⚠️ Fragile emoji-strip in `optLabel`.** Old `t(label).replace(/^..\s/, '')` assumed "2-code-units + space"; it only worked because durations ("5-10 min") have no space at index 2. Replaced with: pass through if the label starts with `[A-Za-z0-9]`, else strip a leading `\S+\s+` token. Correct for astral emoji + variation selectors and RTL/CJK labels; durations pass through untouched.
3. **Bumped `sessionHistory` cap 6 → 25.** "Recent routes" quick-reload; no cross-tool contract (unlike `fp-history`); well under the audit's ≤50 ceiling.

## Also verified (no change needed)
- **Emergency number is locale-correct** (fixed in `b3ce451`): the always-visible call button uses `getEmergencyNumber(userRegion)` (911 US/CA, 112 EU, etc.) via `emergencyHref`, and `sw_call_911` interpolates `{{num}}` in all 13 languages. The **GB live test confirmed the AI text does not inject "911"** — the model stays general on emergency numbers. `locale-gb` golden case guards this.
- **Mobile pass (375px): clean** on input, walking, and results views — no overflow, no crushed columns. Only <44px taps are app chrome + the shared FeedbackTap; only <16px inputs are the chrome locale `<select>`s. (Render-layer — not in the golden.)
- **Localization:** all 4 layers hold (`withLanguage`; no economics; times via `toLocaleTimeString`; every string `t()`).

## DO NOT silently reverse
1. **Guard keys on `checklist` && `watch_for`** (top-level always-present arrays) — do not change to a nullable/nested field.
2. **`max_tokens: 4000`** — the max-schema (+web_search) endpoint truncated at 2000. Do not lower.
3. **Prompt rule 12** ("always return JSON, never prose") + the **422 graceful parse-fail** path — together they kill the vague-input 500 class.
4. **Client-side emergency number** via `getEmergencyNumber(userRegion)` + `{{num}}` label interpolation — do NOT re-hardcode 911. *(Supersedes the old note's "tel:911" item.)*
5. **`Try Example` uses real option IDs + gate-passing locations.** `loadExample` must set ids that exist in TIME/DURATION/AREA/ROUTE_FEATURES, and `from`/`to` that satisfy `isLocationComplete` (zip or ", XX" state) — else the pills render unselected and Assess stays disabled after "Try Example."
6. **Enum values clean** — `risk_level`, `severity`, `priority` (frontend switches on them for color/badge). No length annotations.
7. **`web_search` tool** — the value prop (real street/neighborhood knowledge); removing it guts the tool and is why latency is ~50–60s/assessment (expected, not a bug).
8. **The double `<cite>` strip** (backend + frontend) — both needed.
9. **Error-state input styling gated on `isDark`** (was hardcoded light `bg-red-50` in both themes).

## Known / accepted (pre-existing `audit_v2` flags — NOT bugs for this tool class)
10 baseline `audit_v2-3-2.py` flags; the diff-audit gate confirms edits add none. False-positives / deliberate for a full-screen safety app:
- **S1.2 "root div sets background"** — the fake-call/emergency/flashlight overlays are legitimately `fixed inset-0` full-screen and MUST set their own background.
- **S5.5 `tel:${primary.phone}` "missing leading slash"** — `tel:` is a URI scheme, not a relative href; no ghost URL. Same pattern the locked DriveHome uses.
- **S1.4e `window.open`** — the "Open in Maps" walking-directions convenience, not a print bypass.
- **S1.1 `btnPrimary` not cyan / `dangerText`/`dangerBg` keys** — emerald/red is the deliberate safety palette.
- **PF-2 missing `c.textMuteded`/`c.label` aliases** — cosmetic alias-naming nits; not behavior.
