# SubscriptionTamer — architecture & lock notes (`subscriptiontamer-v1`)

First-ever audit-kit lock for this tool (built pre-audit-kit; never had a golden sample, NOTES.md, or git tag before this pass). Subscription management across 9 views: honest keep/cancel verdicts with cost-per-use math, renewal radar, price-hike detection, plan optimization, retention negotiation scripts, shared-cost splitting, free-trial tracking, category budgets, and a cancellation-savings timeline. **Frontend:** `src/tools/SubscriptionTamer.js`. **Backend:** `backend/routes/subscription-tamer.js` (1 route, 4 actions: parse/analyze/optimize/negotiate). **Golden:** `audit/subscription-tamer-golden-sample.json` (4 cases). **Catalog:** `src/data/tools.js`, category `Loot`, headerColor `#c0d8b8`.

## Shape
- **1 route, 4 actions**, all `MODELS.SMART`, all through `callClaudeWithRetry` + `withLanguage`/`withLocaleContext` (was already migrated pre-audit).
- `parse` (1500 tokens) — extracts subscriptions from pasted statement text, handles cryptic merchant names (`AMZN*Prime` → Amazon Prime).
- `analyze` (4000 tokens) — full keep/cancel/consider audit with cost-per-use, cancellation scripts, retention tactics.
- `optimize` (4000 tokens) — annual/family/student/bundle savings opportunities.
- `negotiate` (4000 tokens) — retention-department negotiation script with step-by-step dialogue.

## Phase 1 findings — no functional bugs

All 4 actions live-tested clean, English and German, including a verbose 6-subscription `analyze` call and a full `negotiate` script generation — no truncation, no unescaped-quote JSON breaks, no field-sync issues between frontend and backend. This is one of the few audit-kit passes in this campaign that found the tool already working correctly.

One **static-audit false positive**, noted but not fixed: `audit/backend_audit_v1_7.py`'s S7.13 flags the `optimize` action's guard (`if (!parsed.optimizations) ...`) as checking a key that isn't top-level, listing `['subscriptions']` as the only top-level key found. This is the script's schema detector getting confused because this one route file contains 4 separate action schemas (`parse` returns `subscriptions`, `optimize` returns `optimizations`) — it appears to be picking up the wrong schema block. Confirmed harmless via live test: `optimize` genuinely returns `{ optimizations: [...], ... }` at the top level and the guard never fires in practice. Do not "fix" this by changing the guard — the guard is correct; the static analyzer's report is the false positive.

## Naming-consistency pass (2026-07-16)

Catalog id is `SubscriptionTamer`, but the backend route file and endpoint were still `sub-sweep.js`/`sub-sweep` (an artifact of the tool's history: SubSweep → Subscription Slayer → Subscription Tamer, where the 2026-07-10 rename deliberately left the endpoint alone — see `audit/RENAMES.md`, which explicitly documented "Endpoint stays `sub-sweep`" as a considered decision at the time). Since this tool had never been locked before, the rename cost nothing extra, so as part of this first lock:
- `backend/routes/sub-sweep.js` → `backend/routes/subscription-tamer.js`.
- The endpoint path `/sub-sweep` → `/subscription-tamer`.
- All 4 `callToolEndpoint('sub-sweep', ...)` call sites in `src/tools/SubscriptionTamer.js` updated to match.
- `callClaudeWithRetry` labels renamed `sub-sweep`/`sub-sweep-2/3/4` → `SubscriptionTamerParse`/`Analyze`/`Optimize`/`Negotiate`.
- **Deliberately left alone:**
  - The i18n file (`src/i18n/locales/tools/sub-sweep.js`, exported as `subSweep`) and its `ss_*` key prefix — renaming would force touching every key × 13 languages for zero user-facing benefit.
  - localStorage keys `ss-subs`, `ss-history`, `ss-trials`, `ss-budgets` — these are internal, invisible to users, but renaming them would silently wipe every existing user's saved subscription list on their next visit (a real, avoidable regression for zero benefit).
  - The `/sub-sweep` entry in `backend/server.js`'s `LEGACY_REDIRECTS` map — that is a **page URL** redirect (`deftbrain.com/sub-sweep` → `deftbrain.com/SubscriptionTamer`, for old bookmarks/links), a completely different namespace from the `/api/*` POST endpoint that was renamed here. No relationship, no change needed.
- `audit/RENAMES.md`'s `SubSweep | SubscriptionTamer` row updated to record this.

## DO NOT silently reverse

1. The route/endpoint rename (`subscription-tamer.js` / `/api/subscription-tamer`) — do not revert to `sub-sweep` chasing "consistency with the old golden sample" or similar; the golden sample was rebuilt against the new name specifically.
2. The `ss_*` i18n prefix and `ss-*` localStorage keys staying unchanged — this is intentional, not leftover debt, and touching either has real costs (translation churn or user data loss) for no benefit.

## Known / accepted

- Golden: 4/4 cases pass — 1 English `parse`, 1 German 6-subscription `analyze`, 1 English `optimize`, 1 German `negotiate`.
- Not independently browser-verified this pass (Phase 1 inspection covered a full mobile pass — nav, form, Try Example flow, zero console errors — separately from the golden-sample API verification).
