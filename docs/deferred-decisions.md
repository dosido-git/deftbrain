# Deferred Decisions

A running log of architectural and infrastructure decisions that have been
consciously postponed — with enough context to pick them back up later without
having to reconstruct the reasoning from scratch.

Format: each entry is a dated section with Context, Decision, Trigger
(what should prompt action), and Notes (links, headers, state of play).

---

## CDN / Edge caching

**Status:** Deferred
**Added:** 2026-04-22
**Owner:** Bruce

### Context

Railway does not offer a built-in CDN. The Fastly headers in deftbrain.com
responses (`x-railway-cdn-edge`, `x-served-by`, `x-cache`) come from
Railway's internal edge proxy, which handles routing and SSL termination
but does not cache application responses.

Every request to deftbrain.com currently hits the Express origin in
`us-east4` (Virginia). This is fine at current traffic but leaves the
site exposed to:

- Traffic spikes (viral post, HN front page, subreddit share) overwhelming
  a single-origin Node process
- High latency for non-US users (~200-300ms round-trip vs ~20ms from
  a regional edge)
- No resilience to short origin outages

### Current state

`backend/server.js` already sets `Cache-Control: public, max-age=300,
s-maxage=86400` on all guide HTML responses via `express.static`'s
`setHeaders` callback. This header is correctly formed and will be
respected as soon as a real CDN is placed in front of the origin —
no application-side changes needed when the CDN is added.

### Decision

When a CDN is adopted, use **Cloudflare** (free tier is sufficient
for current and projected scale; industry standard; simpler than
CloudFront for a single origin).

### Trigger — revisit when any of these happen

- A guide or tool goes viral and origin load becomes a concern
- Non-US traffic grows to a meaningful share and page-load metrics
  (or GSC Core Web Vitals) show degradation
- Railway/egress costs start mattering on the monthly bill
- A major outreach push is planned (Product Hunt launch, press coverage,
  paid campaign) that could spike traffic unpredictably

### Implementation notes for future-you

- **DNS chain today:** Porkbun → Railway
- **DNS chain after Cloudflare:** Porkbun → Cloudflare → Railway
- Estimated effort: ~45 minutes of focused work
- Do it in a dedicated session — DNS misconfiguration can take the
  site down for hours
- Main steps (rough): sign up Cloudflare → add deftbrain.com zone →
  update nameservers at Porkbun to Cloudflare's → verify proxied
  status → set SSL mode to "Full (strict)" → configure Page Rules or
  Cache Rules if default behavior needs tuning
- The existing `Cache-Control` header on guides should just work —
  Cloudflare respects origin `s-maxage`
- Verify with: `for i in 1 2 3 4 5; do curl -sI https://deftbrain.com/guides/workplace/how-to-tell-your-boss-theyre-wrong | grep -i ^cf-cache-status; done` —
  expect at least one `HIT` after the first MISS warms the edge

### Counter-argument to revisit

If the site continues to handle traffic without issue and latency is
acceptable, there's no requirement to add a CDN at all. The cost of
not having one is zero until traffic patterns change. Don't do this
on principle; do it when a real signal warrants it.

---
