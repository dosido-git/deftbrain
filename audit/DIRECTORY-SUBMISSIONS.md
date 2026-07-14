# Directory / launch-site submissions

Living checklist for SaaS/AI-tool directory listings — the external-link and
discovery lever GSC forensics flagged as the actual gate on indexing (see
`SEO-BACKLOG.md`). Started 2026-07-14 (SaaSHub verified). These are manual,
account-creation-required submissions — Claude can prep copy/assets and track
status here, but can't create accounts, verify ownership, or publish listings
(that's you). Update the status column as you go.

**Be honest about what this buys you:** most directory links are `nofollow`
now (G2, Capterra, BetaList) — they don't pass PageRank the way they did a
decade ago. What they DO reliably give: real discovery/referral traffic, a
citation of your brand name in a context Google associates with legitimacy,
and (for the handful of `dofollow` ones — SaaSHub, AlternativeTo, StackShare)
some direct link equity. Product Hunt is the outlier: the value is mostly the
launch-day traffic burst and real user feedback, not the link. Don't expect
any single listing to move indexing on its own — it's a numbers-and-brand-
signal game, not a silver bullet.

## Status legend
`todo` → `submitted` → `live` → `skip` (not a fit / already tried)

---

## Tier 1 — do first (best effort-to-payoff)

| Site | What it needs | Link type | Notes | Status |
|---|---|---|---|---|
| **Product Hunt** | Product page (tagline, gallery, 1st comment from maker), a "hunter" (can self-hunt), pick a launch day, be online all day to reply to comments | nofollow, but huge referral burst | Highest-leverage single action here — real users, real feedback, a Stage-1-validation event more than an SEO one. Launch ONE flagship framing ("DeftBrain — 120+ free AI tools for real-life problems"), not all 122 tools individually. Pick a Tue/Wed/Thu for best traffic. | todo |
| **There's An AI For That (TAAFT)** | Tool name, one-line description, category, screenshot, URL | dofollow | AI-tool-specific, high-traffic directory; very on-brand for DeftBrain. Can submit multiple individual tools here (not just the umbrella site) if desired — worth testing with 2-3 flagship tools (LeaseTrapDetector, ApologyCalibrator, VirtualBodyDouble) plus the main site. | todo |
| **Futurepedia** | Tool name, description, category, screenshot | mixed | Similar AI-directory audience to TAAFT; free tier submission. | todo |
| **AlternativeTo** | Create the product page, tag what it's an alternative TO (ChatGPT, Grammarly, individual niche competitors per-tool) | dofollow | The "alternative to X" framing is exactly how people search; can list DeftBrain as an alternative to several different tools depending on which feature you lead with. | todo |

## Tier 2 — free, moderate effort (claim + optimize)

| Site | What it needs | Link type | Notes | Status |
|---|---|---|---|---|
| **SaaSHub** | ✅ verified | dofollow (check for embeddable badge) | Next: full listing (screenshots, categories, alternatives-to tags), add badge to deftbrain.com footer if available, seed a few reviews once you have real users. | **verified — optimize** |
| **G2** | Claim listing, verify ownership (email/domain), fill profile | nofollow | Free tier is enough to claim + appear in category search. Review count matters for their internal ranking — worth revisiting once you have real users to ask. | todo |
| **Capterra** | Same org as G2 — claim via Gartner Digital Markets | nofollow | Do alongside G2; same account often covers both. | todo |
| **StackShare** | Add DeftBrain as a "tool," description + logo | dofollow | Lower traffic than the above but easy, dofollow, and developer-adjacent audience overlaps with your workplace/productivity tools. | todo |
| **BetaList** | Product page — but check their submission guidelines; BetaList is specifically for PRE-launch/early products | nofollow | Only worth it if you can honestly frame DeftBrain as early/beta (it may already be past their window — verify before spending time). | todo (verify fit) |

## Tier 3 — bulk AI-directory sweep (lower authority each, cheap in aggregate)

Knock these out in a single sitting once Tier 1/2 assets (logo, screenshots,
one-liner, 3-sentence description) exist — most submissions take <5 min each
once you have the assets ready:

- Toolify.ai
- FutureTools.io
- TopAI.tools
- AI Tool Guru
- AI Tools Directory (aitoolsdirectory.com)
- SaaSworthy

## Reusable asset checklist (prep once, use everywhere)

- [ ] Logo (square, transparent background, ~512px)
- [ ] 3-5 product screenshots (pick tools that screenshot well — visual output, not just text forms)
- [ ] One-liner (≤60 chars): e.g. "120+ free AI tools for real-life problems — no signup"
- [ ] Short description (2-3 sentences)
- [ ] Long description (1 paragraph, for directories that want depth)
- [ ] Category list: productivity, communication, health, finance, AI writing, consumer tools
- [ ] "Alternative to" list per major competitor angle (ChatGPT wrapper, Grammarly, generic writing assistants)

## Open questions (your call, not blocking)

- **Umbrella site vs. individual tools:** most directories expect ONE product per listing. Default to listing deftbrain.com as the umbrella product everywhere, and only submit individual flagship tools (the 18 focus tools from `tools-keep-list.json`) to directories that explicitly support multiple listings per domain (TAAFT does; most others don't).
- **Timing vs. Product Hunt:** consider doing Product Hunt LAST among Tier 1, once SaaSHub/TAAFT/AlternativeTo are live — a PH visitor who searches your name and finds you already listed elsewhere reads as more established.
