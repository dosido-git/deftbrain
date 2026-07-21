# Security & Hostile-Input Review — 2026-07-21

Authorized hardening review of the team's own code (backend Express + React
frontend). Two disjoint agent passes (backend infra; frontend output-rendering)
plus manual recon. Deployment: Railway, single Node process, Anthropic API spend
matters.

## Fixed & shipped (commit f079eee)

| Sev | Finding | Fix |
|---|---|---|
| HIGH | Rate limiter keyed on spoofable leftmost `X-Forwarded-For` → unlimited spend + unbounded-Map OOM | `app.set('trust proxy', 1)` + `req.ip` (rateLimiter/metrics/subscribe); Maps capped 50k w/ eviction; boot logs resolved client IP |
| HIGH | SSRF in `fake-review-detective` `/extract` — fetched any user URL, followed redirects | Block private/loopback/link-local/metadata (DNS-resolved + per-redirect via `redirect:manual`); 3MB body cap. Live-verified 400 on 169.254.169.254 + localhost |
| HIGH/CRIT | Model HTML/SVG rendered raw in DoctorVisitTranslator | DOMPurify (SVG profile) at sink + server-side strip in `generate-diagram`; both unit-verified |
| MEDIUM | Guide JSON-LD raw `JSON.stringify` (no `<`-escape) → latent `</script>` breakout | `jsonLd()` escapes `<`→`<` (matches prerender.js) |
| MEDIUM | `express.json({limit:'50mb'})` global — memory-exhaustion amplifier | Tiered: 2mb default + 12mb only on 14 image/PDF routes; oversized → 413 |
| MED/LOW | Model-fed `href` → `//evil.com` protocol-relative redirect | PlainTalk gated to known `SPECIALIST_TOOLS`; ToolFinder slug-validated |
| LOW | `/api/endpoints` ungated; metrics key in query string; idea `path` unbounded | endpoints gated in prod; metrics key via header + `timingSafeEqual`; path length-capped |

Cleared as **not vulnerable**: LaundroMat sinks (hardcoded SVG only), all
web_search routes (Anthropic-side fetch, not our infra), social/DNS lookups
(hardcoded hosts), no client secrets, no shell/eval, no `req.body` spread
pollution, FinalWish print/clipboard (all `esc()`'d).

## ⚠️ Post-deploy verification (trust proxy)

`trust proxy` is set to **1** (Railway's single edge hop). After deploy, check
the Railway log line:
`[trust-proxy] first client req.ip="…" xff="…"` — `req.ip` must be a **real
public client IP**, not a Railway-internal `10.x`/`100.64.x` or the same address
for every visitor. If it's internal/shared, the hop count is wrong (adjust the
number in `server.js`) — otherwise rate-limiting is mis-bucketed.

## Deferred (low severity, tracked here)

- **metrics full-file read** per `/metrics/report` (`readFileSync` whole JSONL) —
  O(filesize) on each report. Fine on Railway ephemeral FS; window/stream the
  read if a persistent volume is ever mounted.
- **buy-wise `Object.assign(merged, modelOutput)`** — theoretical proto-pollution
  if the model ever emits `__proto__`. Defensive: `Object.create(null)` / strip.
- **NODE_ENV single point** — dev-permissive branches (perf-probe bypass, CORS
  reflect, headers) all gate on `NODE_ENV==='production'`. Confirm it's set in
  Railway; consider failing closed.
- **persisted-state shape validation** — `usePersistentState` JSON.parse has no
  schema guard; no live sink today, hardening only.
- **route `error.message` in `details`** — 17 handlers echo internal last-error
  text (no stack). Genericize behind a debug flag.
