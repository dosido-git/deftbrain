<!-- v1.0 · 2026-04-20 · ground-zero baseline -->
# DeftBrain Launch Checklist
Readiness for a real audience.

**Current state (as of ground-zero baseline):**
- Deployed on Railway behind Fastly CDN
- ~125 pages indexed by Google, ~75 not yet indexed (these may not exist but Google thinks they do)
- Just beginning to appear in search results
- 3 click-throughs recorded in Google Search Console
- Structural compliance campaign nearing completion (reverse-alphabetical A–Z pass done)
- No formal monetization, legal, or analytics infrastructure yet

**Status markers:** `[ ]` open · `[x]` done · `[~]` in progress · `[-]` deferred / wontfix · `[?]` needs investigation

**Phase categories:**
1. **Stop-the-bleeding** — things already creating exposure, need resolution even if launch is months away
2. **Before sustained promotion** — blockers for actively driving traffic (PH launch, HN post, ad spend, social push)
3. **Within 30 days of promotion** — things that need to be solid before momentum builds
4. **Continuous / post-promotion** — always-on improvements

---

## Phase 1 — Stop-the-bleeding (every visitor accrues risk until done)

The site is live and receiving (minimal) traffic from real humans in real jurisdictions. The legal clock is already running.

### Legal & compliance

- [ ] **Privacy policy (worldwide)** — non-negotiable. GDPR, CCPA, and the EU DSA apply the moment someone from those regions loads the site. Even 3 click-throughs could have come from anywhere. Options: Termly/Iubenda auto-generator ($10-30/month, passable for solo), or one-time lawyer review of a template ($500-1500, better). Whichever you choose, do it this month.
- [ ] **Terms of service** — limits your liability when someone misuses a tool or disputes output quality. Less urgent than privacy policy but same cost profile; bundle the review.
- [ ] **AI content disclaimer** — surface on tool pages and in the TOS: outputs are AI-generated, may be inaccurate, not professional advice (especially critical for Lease Trap Detector, Apology Calibrator, and anything else that could be mistaken for legal/medical/financial guidance). Add a footer line like "AI-generated guidance, not legal/medical/financial advice. Consult a professional for your specific situation."
- [ ] **Cookie consent banner** — required if running any non-essential cookies (analytics, ads, third-party widgets). Even if you're not yet, add the scaffolding now so it's ready when you do.

### Domain & identity

- [ ] **Domain name decision** — you've flagged this as "better domain name!" in your notes. Decide: keep `deftbrain.com` and stop second-guessing, or migrate now before SEO momentum makes migration painful. With only 125 indexed pages and 3 clicks so far, the cost of migration is at its lowest. Every month that passes raises the cost. A one-hour timeboxed decision, then commit.
- [ ] **Trademark check for "DeftBrain"** — USPTO search (free) to confirm nobody else holds it in your class. If clear, file ($250-350 per class for basic filing). If taken, this forces the domain decision above.

---

## Phase 2 — Before sustained promotion (must be decided before Product Hunt / Hacker News / social push)

These are the decisions that shape everything downstream. Launching first and deciding later means re-architecting for 6 months.

### Monetization model (decide and document)

- [ ] **Business model written down** — freemium with paid tier? Subscription? Ads? One-time purchase bundle? Donation-supported? Sponsorship-supported? Even a one-paragraph commitment is enough. The model isn't the decision — the *writing it down* is. Until it's written, every downstream decision is ambiguous.
- [ ] **Rate limiting per tier (if tiered)** — you already have `rateLimiter.js`. Wire it to account status once accounts exist, or to IP-based anonymous throttling if you're staying anonymous.
- [ ] **Payment infrastructure (if paid)** — Stripe for most flexibility, LemonSqueezy / Paddle for merchant-of-record simplicity (they handle sales tax / VAT globally, huge for a solo dev).
- [ ] **Account system (if required)** — Supabase, Clerk, Auth0 for auth. Simplest: start without accounts, add them only when the monetization model requires.
- [ ] **Usage analytics to support billing** — only if metered. Mixpanel / PostHog for event-level, Stripe meters if Stripe-native.

### Analytics baseline

- [?] **Inventory what's currently running** — GSC is confirmed (3 click-throughs). Anything else? GA4? Anonymous server logs via Railway? Confirm before adding more.
- [ ] **Install privacy-first analytics if nothing there** — Plausible ($9/month) or Fathom ($15/month) are ideal: no cookies, GDPR-compliant by default, don't trigger the cookie banner requirement, no Google account needed. Setup takes 20 minutes.
- [ ] **Goal funnel per tool** — what does success look like? User completes a tool? User copies the output? User returns within 7 days? Each tool might have a different answer. Write down the top 3 success signals for the catalog.

---

## Phase 3 — Within 30 days of promotion (solid before momentum builds)

### SEO infrastructure

- [~] **Resolve unindexed pages (75 of 200)** — active work. Key suspects: prerender vs flat-file vs directory conflicts (noted in your memory), canonical tag issues, stale Fastly cache. GSC's "Pages" report flags specific reasons — work through each bucket.
- [ ] **Schema.org markup on tool pages** — add `WebApplication` or `SoftwareApplication` JSON-LD to each tool page. Dramatically improves rich-result eligibility. Generic template, one-time add, huge long-term SEO win.
- [ ] **Open Graph + Twitter Card tags** — every tool page should have `og:title`, `og:description`, `og:image`, `twitter:card`. Makes the site shareable on social media without looking broken. Can be per-tool-auto-generated from `tools.js` metadata.
- [ ] **Canonical tags on every page** — especially critical given your prerender/flat-file/directory conflicts. Each tool page should declare its canonical URL explicitly.
- [ ] **Sitemap submitted to Bing Webmaster Tools** — you have GSC; Bing Webmaster is free and catches ~5-8% of search traffic that GSC doesn't.
- [ ] **Core Web Vitals audit** — PageSpeed Insights on 5-10 representative tools. LCP, INP, CLS all green? If not, LCP is usually the one to fix first.
- [ ] **Keyword strategy document** — which tools are competing for which queries? Which tools have no realistic SEO upside and should deprioritize? A one-page document keeps you from optimizing for the wrong things.

### Monitoring & ops

- [ ] **Error tracking (Sentry)** — free tier is fine for solo. Catches frontend JS errors, API failures, and tool-level crashes in production. Saves debugging time hugely once real traffic arrives.
- [ ] **Uptime monitoring (Better Uptime / UptimeRobot)** — free tier sufficient. Alerts you if Railway or Fastly has an outage before users report it.
- [ ] **Deployment runbook** — one-page doc describing how to deploy, rollback, and check logs. For future-you as much as anyone.
- [ ] **Rate limiting tuned to reality** — whatever `rateLimiter.js` is currently set to probably wasn't picked based on anything. Once you have week-over-week usage data, tune to fit.

---

## Phase 4 — Continuous / post-promotion

### Product polish

- [~] **"Try example" buttons** — PF-17 in CONVENTIONS.md covers the pattern. Incremental; add during catalog-wide UX pass.
- [ ] **Accessibility audit (WCAG AA baseline)** — focus order, keyboard nav, screen reader labels, color contrast. Many of these are already in the audit script's scope; an `axe` browser-extension sweep on representative tools catches the rest in an afternoon.
- [ ] **Mobile UX review** — the catalog-wide UX pass picks this up. Tools built desktop-first often have margin / input / modal issues at mobile widths.
- [ ] **Dark mode consistency sweep** — audit script enforces the c-block pattern structurally, but doesn't verify the actual colors look balanced in dark mode. Eyeball sweep during UX pass.

### Internationalization

- [-] **Defer until evidence of non-English demand** — biggest lift on the list, smallest short-term ROI. You have backend `withLanguage()` plumbing already (every route supports `userLanguage`), so the scaffolding exists. Don't extract frontend strings until analytics show meaningful non-English traffic AND you've decided it's worth the ongoing maintenance cost per new tool.

### Branding & positioning

- [ ] **Brand voice document** — how do the tools talk to users? What's the tone? What never to say? One page, reviewed once, enforces itself via reading future output.
- [ ] **Logo finalized** — you have `pBrainr.png` / `Pbrainl.png` in the project. If those are final, archive somewhere canonical; if not, finalize.
- [ ] **Favicon audit** — every device resolution covered, `apple-touch-icon.png`, `manifest.json` if PWA-adjacent.

---

## Open questions / decisions parked

Things that showed up in notes or sessions but don't yet have enough information to act on.

- **Public roadmap?** — do users see what's coming next, or is it private? Public builds trust but constrains pivots.
- **Tool deprecation policy** — some of the 120+ tools may underperform. What's the process for removing them? Does a removed tool's URL 301 somewhere, return 410 Gone, or show a "this tool was retired" page?
- **Embed / API / partner strategy** — do other sites get to embed tools? Is there an API? What if a big site wants to integrate?

---

## Launch-week checklist (unfreeze once Phase 1–3 complete)

- [ ] Product Hunt launch prep (teaser assets, hunter with a following, launch text, response templates for common questions)
- [ ] Hacker News "Show HN" draft (factual title, first comment ready, timing Tuesday–Thursday morning US time)
- [ ] Social media accounts claimed (even if unused — just hold the handles)
- [ ] Launch announcement written
- [ ] Support channel live (email alias at minimum; Discord/forum optional)
- [ ] Status page (even a minimal one — StatusPal, Atlassian Statuspage free tier)
- [ ] "We got slammed" load-test run (simulate 100 concurrent requests, see what breaks)

---

## Update discipline

When an item resolves, check the box and leave a one-line note of what actually happened. That becomes the decision record. Example:

```
- [x] Privacy policy (worldwide) — deployed 2026-05-15. Termly-generated, reviewed by [lawyer], footer link on every tool page. Cookie consent triggered only if GA4 added.
```

Periodic prune: keep done items forever (they're the trail). Wontfix / deferred items stay visible so the thinking isn't lost.
