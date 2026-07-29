# Directory / launch-site submissions

Living checklist for directory listings — the external-link and discovery lever
GSC forensics flagged as the actual gate on indexing (see `SEO-BACKLOG.md`).
Started 2026-07-14. **Fully re-verified 2026-07-29** (every price, free path,
and link attribute below was checked at source on that date — the 2026
directory economy churns fast; two "free tier" entries had gone paid-only
since this file was written).

These are manual, account-required submissions — Claude can prep copy/assets
and track status here, but can't create accounts, verify ownership, or publish
listings (that's you). Update the status column as you go.

**Be honest about what this buys you:** most directory links are now `nofollow`
or redirect-cloaked — they don't pass PageRank. What they DO reliably give:
real referral traffic, a brand citation in a context Google associates with
legitimacy, and (for the few genuinely dofollow ones) some link equity.
Don't expect any single listing to move indexing — it's a numbers-and-brand-
signal game.

**2026 pattern worth knowing:** almost every remaining "free tier" costs you
something other than money — a queue (Uneed, aitoolsdirectory), a reciprocal
badge on your own site (Fazier, IndieHunt), or nofollow-only links (IndieHunt,
AlternativeTo). The DO list below is the set where the free path costs neither
an outbound link nor a badge.

## Status legend
`todo` → `submitted` → `live` → `skip` (not a fit / paid-only / dead)

---

## Tier 1 — do these (free, verified 2026-07-29, real payoff)

| Site | Free path | Link type | Notes | Status |
|---|---|---|---|---|
| **llms.txt Directory** (directory.llmstxt.cloud) | Free — Tally form | listing | **Cheapest win on this page.** `llms.txt` already shipped (commit `5f86279f`), so this is a 10-minute form. 1,600+ entries; the directory every "AI SEO" writeup cites. | todo |
| **IndexNow + Bing Webmaster** (indexnow.org) | Free | n/a (indexing) | Not a directory — the retrieval pool. ChatGPT search draws on Bing's index; 125 tool pages absent from Bing are outside it entirely. Also feeds Yandex/Naver/Seznam (relevant with 13 languages). Static key file + ping on deploy; ~1-2 h dev, Claude can wire it. | todo |
| **aitoolsdirectory.com** | Free organic queue (manual review, slow, no guarantee); $99 Fast Track optional | **dofollow** (direct link, no cloaking — verified) | **The only free path here with genuine link equity.** Consumer-oriented by policy. Two rules: description must be unique + human-written (AI-written copy is discarded), and pricing must be transparent. | todo |
| **Product Hunt** | Free, self-launch (no hunter needed) | `rel="ugc"` (not nofollow; equity uncertain) | Highest-leverage single action — real users, real feedback, a Stage-1 validation event more than an SEO one. Only ~10% of submissions get homepage-featured now. Launch ONE framing, Tue/Wed/Thu. Draft ready in `LAUNCH-DRAFTS.md`. | todo |
| ~~**AlternativeTo**~~ | — | — | **REJECTED 2026-07-29 — moved to Skip.** Their FAQ bans the category outright: *"collections of online tools, AI wrappers for LLMs…"*. Not a copy problem; no resubmission path for the umbrella. Do NOT re-submit individual tools hoping to slip past the same policy — it's the same rule and it burns the account. The alternative-to FRAMING is still valuable elsewhere (see below). | **skip — rejected** |
| **Launching Next** (launchingnext.com) | Free (form live); $99 optional 1-day review | listing | Running since 2013, 45k+ listings, aged domain, permanent listing page. Category explicitly includes "a side project". No badge, no reciprocal link, no queue games. | todo |
| **Tiny Startups** (tinystartups.com) | Free ("Submit a Startup — Free") | claims DR 70 backlink (self-reported) | Weekly leaderboard, 20k+ early adopters, genuinely consumer-mixed listings (not a dev-tools board). | todo |
| **Uneed** (uneed.best) | Free "join the line" (auto date at next slot); $29.99 skip-the-line | claims DR 75 (self-reported) | Free path costs only patience. Guaranteed homepage day. Ignore every upsell. General consumer/tech board — "125 free tools, no signup" is upvote bait. | todo |
| **SaaSHub** | ✅ already verified | dofollow | Next: complete the listing (screenshots, categories, alternative-to tags), add badge to footer if available, seed reviews once you have real users. | **verified — optimize** |
| **FutureTools.io** | Free, open, actively curated | **none** — `/go/` redirect is `Disallow`ed in robots.txt | Traffic only, zero SEO value. Still worth 10 minutes for the referral audience. Manually reviewed by Matt Wolfe; most submissions never list. | todo |

## Tier 2 — maybe (free but caveated)

| Site | Free path | Catch | Verdict |
|---|---|---|---|
| **r/InternetIsBeautiful** | Free post | One shot; needs a novel hook. Their rule bans sign-up-gated products — DeftBrain qualifies (no signup). Post ONE striking tool (Ticket Tackler or Lease Trap Detector), never "125 AI tools". Read the sidebar first. | Highest single-day traffic potential at $0 |
| **MicroLaunch** (microlaunch.net) | Free "Regular launch" | Month-long ranking window (suits a product with no launch-day audience). Claimed dofollow/DR 61 unverified — no `/pricing` page. | do if Uneed goes well |
| **ikaijua/Awesome-AITools** (GitHub PR) | Free PR | GitHub links are nofollow, but awesome-lists are over-represented in LLM training/retrieval corpora. ~20 min. | cheap, do when idle |
| **Crunchbase** | Free company profile | No link equity; pure brand/entity citation, heavily quoted by AI answers. ~30 min. | when idle |
| **Wikidata item** | Free | Real deletion risk until independent coverage exists — **do it AFTER 3-4 directory/press citations land**. Q-number is the cleanest entity signal an LLM can consume. | later |
| **Peerlist Launchpad** | Free, weekly Monday window | Only top-5-of-week get a backlink; audience is designers/devs. | weak fit |
| **StackShare** | Free, alive (FOSSA-owned) | nofollow + developer audience. | weak fit |
| **Fazier** / **IndieHunt** | Free tiers exist | Fazier free requires a reciprocal backlink to Fazier; IndieHunt free is nofollow-only (dofollow = $19). | only if you'll take a badge |
| **Mr Free Tools** (mrfreetools.com) | No self-serve form | Email pitch only. Purest consumer "free tools" directory that isn't an ad farm. English only. | pitch when idle |
| **Appvizer** (FR/DE/ES/IT) | Free, "sans engagement" | Explicitly a **B2B** software comparator for Europe — requires reframing tools as small-business utilities. The only clearly-free reputable non-English option found. | only with reframing |

## Skip — verified paid-only, dead, or wrong audience (2026-07-29)

| Site | Why |
|---|---|
| **BetaList** | **No free path, period** — their own FAQ: "All submissions are paid… BetaList used to offer free submissions." ~$39 base (login-gated, unverified). |
| **Toolify.ai** | Paid only, $99. Dofollow is the paid perk. |
| **TopAI.tools** | Paid only, $47 Fast Track / $229 Featured. |
| **Futurepedia** | Paid only: Basic $247 (listed "Sold Out") / Verified $497. Site pivoted to selling AI courses. |
| **There's An AI For That (TAAFT)** | Paid only: $49 basic / $347 "Maximum Exposure". Free path is a monthly X-thread lottery (1 winner). Multi-tool listings multiply the cost — if you ever pay, ONE umbrella listing only. |
| **G2** | Free profile claim exists, but no direct outbound anchor found → nil link value; B2B reviews platform, empty shell without business reviews. |
| **Capterra / G2 Digital Markets** | **Gartner Digital Markets no longer exists** — G2 acquired Capterra/GetApp/Software Advice Feb 2026 (~$110M). Free basic listing appears to survive but the word "free" is gone from the vendor page. B2B-only fit. |
| **SaaSworthy** | Free Standard tier exists, but base64-cloaked `nofollow` vendor links + B2B-buyer audience. |
| **AI Tool Guru** | Site up but dormant: "no recently added tools", 404 blog, four pricing tiers with identical features. |
| **Softpedia** | Downloadable software only — submission demands a PAD file, file size in MB, OS checkboxes. No hosted-web-app path. |
| **Slant.co** | Policy bans self-submission outright ("users with a professional relationship with a product may not add it"). |
| **Dev Hunt** | Developer tools only (APIs/SDKs/infra), GitHub-PR submission. Wrong audience. |
| **SourceForge** | Now a B2B software review site; a free consumer utility has nowhere to sit. |
| **"300+ free directory submission" list services** | Link farms with the exact footprint search engines discount. Avoid. |
| **Paid blast services** | Uneed auto-submit-to-100 ($249), Uneed Public Review ($147), MicroLaunch submit service (£99), Fazier Super ($149). Not venues — services. |

## Reusable asset checklist (prep once, use everywhere)

- [ ] Logo (square, transparent, ~512px)
- [ ] 3-5 screenshots (pick tools that screenshot well — visual output, not text forms)
- [ ] One-liner (≤60 chars): "120+ free AI tools for real-life problems — no signup"
- [x] Short description (≤290 chars) — drafted for AlternativeTo, reusable
- [x] Long description (2 paragraphs) — drafted for AlternativeTo, reusable
- [x] Audience / story / uniqueness answers — drafted for SaaSHub, reusable
- [ ] Category list: productivity, communication, health, finance, consumer tools
- [ ] "Alternative to" list: DoNotPay (Ticket Tackler/BillRescue), Fakespot (FakeReviewDetective — dead incumbent, orphaned demand), goblin.tools (TaskAvalancheBreaker), Focusmate (VirtualBodyDouble), Noisli/Brain.fm (FocusSoundArchitect), Rocket Money (SubscriptionTamer), SaneBox (EmailUrgencyTriager), SuperCook (RecipeChaosSolver), PictureThis (PlantRescue), Everplans (FinalWish), Forvo (PronounceItRight), RepairPal (QuoteCheck), Namelix (NameStorm)
- **NOTE:** aitoolsdirectory.com discards AI-written descriptions — hand-edit anything Claude drafts before submitting there.
- **The alternative-to list survives AlternativeTo's rejection.** Where to still use it: (a) SaaSHub's alternatives tags — already live, free, dofollow; (b) the Show HN / PH copy ("free alternative to X" is the fastest way to explain a tool); (c) **on-site comparison content** — a guide page per major incumbent is a legitimate long-tail SEO play we fully control, and Fakespot/DoNotPay-style queries have real volume with a dead-or-distrusted incumbent behind them.

## Sequencing

1. **llms.txt Directory** + **IndexNow/Bing** — free, fast, no gatekeeper.
2. **aitoolsdirectory.com**, **Launching Next**, **Tiny Startups**, **Uneed** — free listings; start the slow queues now so they mature before launch day.
3. **AlternativeTo** — create the account NOW (1-week waiting period before you can submit).
4. **Product Hunt LAST** — once the others are live, a PH visitor who searches your name finds you already listed elsewhere and reads as established.
5. **r/InternetIsBeautiful** — separate day from PH, one tool, novel hook.

## Open question

- **Umbrella vs. individual tools:** most directories expect ONE product per listing. Default to deftbrain.com as the umbrella everywhere. AlternativeTo is the exception worth splitting — per-tool pages against named incumbents (see the alternative-to list above) is exactly how people search.
