# Deferred Decisions

A running log of architectural and infrastructure decisions that have been
consciously postponed — with enough context to pick them back up later without
having to reconstruct the reasoning from scratch.

Format: each entry is a dated section with Context, Decision, Trigger
(what should prompt action), and Notes (links, headers, state of play).

---

## Full Localization — Deferred Components

**Status:** Partially implemented (language + four-field context object locked)
**Added:** 2026-05-10
**Owner:** Bruce

### Context

CONVENTIONS.md Clarification 11 locks the four-field localization context object (`userLanguage`, `userLocale`, `userCurrency`, `userRegion`) and the `withLocaleContext` backend helper contract. The following components are explicitly out of scope for the current implementation arc and are deferred here with enough context to resume cleanly.

---

### Deferred: RTL layout (Arabic)

**What it is:** Arabic (`ar`, `ar-SA`) is a right-to-left language. The entire UI layout must mirror — flex direction, text alignment, padding/margin, icon positions, and input field direction all flip.

**Scope:** One locale across the 13 supported (assuming Arabic is among the 12 non-English). Affects `ToolPageWrapper`, every tool's card/input/button structure, and the global stylesheet.

**Approach when triggered:** Add `dir="rtl"` to the root element when `userLanguage === 'ar'`; use Tailwind's `rtl:` variant for per-element mirroring. Test with Arabic text injected into every tool category.

**Trigger:** Arabic user traffic reaches a meaningful threshold, OR a deliberate Arabic market push is planned.

---

### Deferred: Locale-aware input parsing

**What it is:** Users in German-locale environments write `1.234,56` (period = thousands separator, comma = decimal). Standard `parseFloat()` misreads this as `1.234` (truncates at the comma). Financial tools (BuyWise, SubscriptionGuiltTrip, RentersDepositSaver, BillRescue) accept numeric input and would silently mis-parse.

**Approach when triggered:** A `parseLocaleNumber(str, userLocale)` utility that normalizes separators before parsing. Applied to all `<input type="text">` fields that accept numeric values in currency-aware tools.

**Trigger:** Implementation of `withLocaleContext` in currency-aware tools — input parsing must land in the same pass.

---

### Deferred: Per-locale plural rules

**What it is:** Many languages have 3–6 grammatical plural forms (Arabic has 6; Russian has 3; Polish has 4). Any hardcoded string like `"1 result"` / `"N results"` is wrong in most non-English languages with a simple `n === 1 ? singular : plural` check.

**Approach when triggered:** `Intl.PluralRules` API handles the categorization natively. Requires auditing every hardcoded count-bearing string in all 121 tools.

**Trigger:** Complaints from non-English users about grammatically wrong count strings, OR a systematic audit of i18n string quality.

---

### Deferred: Exchange rate API (currency conversion)

**What it is:** Tier 2 currency localization — when a user explicitly requests cross-currency comparison ("what's this in USD?") or a tool needs to reason across currencies. Requires a live or daily-updated exchange rate source.

**Approach when triggered:** Single backend utility that fetches and caches exchange rates (ECB or Open Exchange Rates free tier). Sits between Claude's output and the `formatCurrency` formatter only when conversion is explicitly requested. Does not affect the baseline `withLocaleContext` prompt injection.

**Trigger:** User demand for cross-currency comparison, OR expansion into markets where multi-currency reasoning is common (e.g. expats, international business tools).

---

### Deferred: Explicit PPP data injection

**What it is:** Injecting actual purchasing-power-parity indices into the system prompt so Claude has precise economic context rather than relying on trained intuition.

**Current approach:** `withLocaleContext` names the region and trusts Claude's knowledge — "The user is in Vietnam. Reason about amounts relative to Vietnamese economic norms." This is lightweight and sufficient for most tools.

**Approach when triggered:** Per-region system prompt addendum with median wage, cost-of-living index, and a calibration example (e.g. "Median monthly wage is ~8,000,000 VND; a typical meal costs 50,000–80,000 VND"). Maintained as a static data file updated annually.

**Trigger:** Evidence that Claude's economic intuition is materially wrong for a specific region (user complaints, spot-check failures), OR expansion into regions with highly unusual purchasing power (very high: Switzerland, Norway; very low: sub-Saharan Africa, Myanmar).

---

### Deferred: Cultural content (examples, imagery, color associations)

**What it is:** Tool examples, scenario descriptions, and reference content are currently US/English-centric. Color associations (white = mourning in some East Asian cultures; red = luck not danger in China) and imagery choices vary significantly by region.

**Trigger:** Ongoing — no single trigger. Address per-tool when that tool is opened for other work and non-English traffic from that tool's primary market is evident.

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

## Search Engine Submissions — Non-Google Markets

**Status:** Deferred
**Added:** 2026-05-11
**Owner:** Bruce

### Context

DeftBrain targets 12 international language markets. Google has been submitted (sitemap + page indexing via GSC). Three additional search engines have meaningful share in these markets and warrant separate submission:

| Engine | Market | URL |
|---|---|---|
| **Baidu** | Chinese (zh / CNY) — Google blocked in mainland China | https://ziyuan.baidu.com |
| **Yandex** | Russian (ru / RUB) — ~60%+ search share | https://webmaster.yandex.com |
| **Naver** | Korean (ko / KRW) — dominant over Google in South Korea | https://searchadvisor.naver.com |

Bing covers all remaining markets as a secondary via IndexNow (Spanish, Hindi, Arabic, Portuguese, French, German, Japanese, Thai, Vietnamese). Yahoo Japan runs on Google's index — no separate submission needed.

### Submission checklist (per engine)

**Bing Webmaster Tools** (https://www.bing.com/webmasters)
- [ ] Sign in with Microsoft account
- [ ] Import sitemap directly from Google Search Console (one-click)
- [ ] Submit sitemap manually if import fails
- [ ] Enable IndexNow (Bing UI generates key + walks through setup)
- [ ] Submit key URLs via URL inspection tool

**Baidu** (https://ziyuan.baidu.com)
- [ ] Register — requires Chinese phone number for verification (borrow available)
- [ ] Verify site ownership (meta tag or DNS TXT record)
- [ ] Submit sitemap
- [ ] Enable Baidu automatic push (JS snippet added to site)
- [ ] Note: Baidu crawls slowly; allow 4–8 weeks for meaningful indexing

**Yandex** (https://webmaster.yandex.com)
- [ ] Sign in / create Yandex account
- [ ] Add site, verify ownership (meta tag or DNS)
- [ ] Submit sitemap
- [ ] Enable IndexNow (Yandex supports it — same key as Bing)

**Naver** (https://searchadvisor.naver.com)
- [ ] Sign in with Naver account (create if needed)
- [ ] Add site, verify ownership
- [ ] Submit sitemap
- [ ] Submit key URLs via URL submission tool
- [ ] Note: Naver prefers Korean-language content; lower priority until Korean-language pages exist

### Trigger

Work through this checklist when allocating a focused 2–3 hour session. Bing first (fastest, highest coverage), then Yandex, then Baidu, then Naver.

---

## Tool Evaluation — Enhancement & Retirement Review

**Status:** Deferred (evaluation complete, decisions pending)
**Added:** 2026-05-11
**Owner:** Bruce

### Context

Full 122-tool evaluation completed 2026-05-11. Scored on Usefulness (1–5) and Potential (1–5) against six criteria: AI necessity, real problem, unique angle, international relevance, repeat use, and complexity/benefit of upgrades.

Full evaluation spreadsheet: `DeftBrain_Tool_Evaluation.xlsx` (outputs folder, session 2026-05-11).

### Top-tier tools (Usefulness ≥5 or Potential ≥5 — enhancement priority)

| Tool | U | P | Top upgrade idea |
|---|---|---|---|
| ComplaintEscalationWriter | 5 | 5 | Jurisdiction-aware legal refs, regulator lookup by country/industry |
| DifficultTalkCoach | 5 | 5 | Live roleplay mode |
| DoctorVisitTranslator | 5 | 5 | Specialty-specific glossaries |
| LeaseTrapDetector | 5 | 5 | Country-specific tenant rights, jurisdiction-aware clauses |
| ProcedureProbe | 5 | 5 | Insurance-specific cost modeling |
| RentersDepositSaver | 5, | 5 | Photo documentation guide, dispute letter generator |
| BeliefStressTest | 4 | 5 | Belief evolution tracking over time |
| BrainDumpBuddy | 4 | 5 | Pattern detection across dumps over time |
| ChaosPilot | 4 | 5 | Follow-up check-in after trying disruption |
| EmailUrgencyTriager | 4 | 5 | Rule learning over time |
| FriendshipFadeAlerter | 4 | 5 | AI-drafted reconnect messages |
| JargonAssassin | 4 | 5 | Jurisdiction-aware for legal/medical docs |
| LeverageLogic | 4 | 5 | Counter-offer simulation, BATNA analysis |
| MagicMouth | 4 | 5 | Company-specific known resolution paths |
| MoneyDiplomat | 4 | 5 | Strong international potential; culturally-aware framing |
| NameThatFeeling | 4 | 5 | High emotional value; universally applicable |
| PreMortem | 4 | 5 | Plan-specific risk library |
| ResearchDecoder | 4 | 5 | High international utility |
| RulebookBreaker | 4 | 5 | Jurisdiction-aware escalation paths |
| SensoryMinefieldMapper | 4 | 5 | Crowdsourced venue notes, return visit memory |
| SignalVsNoise | 4 | 5 | Topic library, bookmark findings |
| TheAlibi | 4 | 5 | Interview Q&A simulation for the gap |
| VirtualBodyDouble | 4 | 5 | Unique AI use; high repeat use |

### Weak tools (Usefulness ≤2 + Potential ≤2 — retirement candidates)

| Tool | U | P | Notes |
|---|---|---|---|
| AwkwardSilenceFiller | 2 | 2 | Static lists would suffice; low repeat use |
| FanTheory | 2 | 2 | Entertainment only |
| LaundroMat | 3 | 2 | Timer needs no AI; stain guide marginal |
| PlotHole | 2 | 2 | Entertainment only |
| RoastMe | 2 | 2 | Entertainment only; culturally variable |
| WrongAnswersOnly | 2 | 2 | Entertainment only |

### Trigger

Review spreadsheet, make retirement decisions on weak tools, then begin enhancement work on top-tier tools — starting with whichever aligns best with current international expansion focus.

---
