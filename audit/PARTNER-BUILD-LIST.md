# Partner and consortium build list

From the perks in `docs/marketing/consortia-shortlist.md` (owner, 2026-11-27).
What exists today: one partner registry (`src/data/partners.json`), a
co-branded start page per partner (`/for/<id>`, curated tools + help line),
Partner Center with launch kit, handout and QR codes, an admin-only per-partner
usage report (`backend/lib/partnerReport.js`, `/api/metrics/partner-report`),
partner rate-limit budgets, and the access-code pricing page.

Status: [ ] not started · [~] in progress · [x] done (commit)

## A. Foundation: the partner travels with the visitor
- [x] A1. Partner context: a visit that starts at `/for/<id>` (or carries
  `?partner=<id>`) remembers the partner for the session; one hook,
  `usePartner()`, gives any component the partner record. Ends on retired
  partners. No cookies; sessionStorage like the existing attribution.
- [x] A2. Registry fields for what the perks need: `contacts` (one or more
  people to reach: label, phone, url, hours), `providedBy` line, `parent`
  (consortium id) and `members` (for consortia). Validated by a gate script so
  a typo fails the push, not the page.

## B. Their help inside our answers (perk 1)
- [x] B1. Shared "Talk to a person at <partner>" block at the end of every tool's
  results, from `contacts`, rendered once in ToolPageWrapper (no per-tool
  edits). Calm, one line per contact, tel:/url links, print-visible.
- [x] B2. Same contacts on the partner start page (replaces the single `help`).

## C. Co-branding (perk 5)
- [x] C1. "Provided by <partner>" in the print header/footer and the shared copy
  footer (printBranding.js, ActionButtons.js) when a partner is in context.
- [x] C2. Covered by C1: every whole-result copy goes through ActionButtons, which adds the
  partner line after the tool's own BRAND footer. Exact-copy snippets (captions, letters) stay unbranded by design.

## D. Reports partners can open themselves (perks 2, 3; consortia 5)
- [x] D1. Per-partner report access: a report code per partner (hashed, same
  scheme as pricing codes) and a `/partners/report` page that shows that
  partner's report without the admin key.
- [x] D2. "What your people are struggling with": topics by category, busiest days
  (shipped: topics with rising/falling, weekdays; hours of day left out on purpose: too identifying for small partners). Aggregate only, same
  fewer-than-20 suppression as today.
- [x] D3. Grant/evidence export: the report as a printable one-pager framed for
  funders (reach, completions, topics, period), with method notes.

## E. Consortia and branded editions (consortia 1, 2)
- [x] E1. Consortium records: a parent with members; every member gets its own
  `/for/<parent>/<member>` page, contacts and report, inheriting the parent's
  tools and branding unless it overrides them. Members added from a list.
- [x] E2. Consortium roll-up report: all members together plus a per-member
  table.
- [x] E3. Edition branding: edition name ("<Consortium> Life Navigator"),
  colours/logo on the partner bar, its own launch kit (Partner Center launch kit takes ?partner=<consortium>/<member>).
- [ ] E4. Own address: `<partner>.deftbrain.com` or a path on the partner's
  site (needs DNS/Railway domains; owner step).
- [x] E5. Embed (snippet has a fallback "open in a new tab" link): `embedOrigins` in partners.json (https origins, checked by check-partners.js) → production sends
  `frame-ancestors <those sites>` instead of X-Frame-Options DENY; none listed = DENY as before. Launch kit has the iframe
  snippet (tracked ?ref=<id>-embed). Switching a partner on = add its site, push, deploy (owner OK per partner).
- [~] E6. Revenue share tracking: pricing codes carry a consortium; sales and
  member counts roll up per consortium for royalty statements.
  Shipped: pricing codes take --consortium; pricing views show "(via <consortium>)" in metrics;
  scripts/royalty-statement.js <ledger.csv> <consortium> --from --to → printable statement (sample ledger in scripts/samples/).
  Left: the owner keeps the real ledger (untracked) and sets each deal's rate. No public sample until a rate is chosen.

## F. Promotion kit (perk 6; consortia 10)
- [x] F1. Co-branded printable all-tools list (PDF) per partner: scripts/partner-all-tools.mjs <id> → output/partners/ (QR = tracked print link).
- [x] F2. Poster/flier: launch-kit handout has a Format picker (Handout / Large print / Poster), poster has its own tracked link (?ref=<id>-poster).
- [x] F3. Monthly newsletter blurbs in the launch kit: one tool a month from the package, tracked link ?ref=<id>-newsletter.

## G. Procurement paperwork (perk 9; consortia 9)
- [~] G1. Accessibility statement page. Draft in docs/marketing/procurement-drafts.md; owner review before publishing.
- [~] G2. Security summary page (hosting, data handled, retention, no accounts). Draft in docs/marketing/procurement-drafts.md; owner review.
- [x] G3. Partner Center privacy/data page review against what the code does.
- [ ] G4. Enterprise terms outline (uptime, response times, peak capacity):
  owner decisions.

## H. Bigger builds (need owner decisions or outside accounts)
- [~] H1. Staff mode: Partner Center guidelines "Using it with someone at your desk" (start from the partner page, let them answer, private window on shared computers, print/copy home, point to contacts). A separate staff view in the tools waits on a partner asking for one.
- [ ] H2. Phone and text access (needs a telephony account).
- [ ] H3. Partner-exclusive tools (unions, health plans, state libraries, credit
  unions): each is a full tool build; pick with the partner.
- [x] H4. Large print: launch-kit handout format, plus public/all-tools-large.pdf (built with the regular list by build-all-tools.mjs) and partner copies via partner-all-tools.mjs <id> --large.
- [~] H5. Early access / partner tool requests. Requests: the sample consortium's "Request a tool" form. Flag: not built; no tool is hidden from the catalog today, and hiding one touches every catalog list (home, Toolbox, search, sitemap, prerender, guides). Build it with the first early-access tool.

## Added 2026-11-27 (from the implementation plan's gaps)
- [x] Model cost per partner: X-DB-Partner header → llm_usage.partner → owner report "Model cost by partner".
- [x] Pilot midpoint/final reports by exact days (owner partner report: fromDay/toDay).

## Order
A1, A2 → B1, B2 → C1 → D1, D2 → E1, E2 → D3, F1, F2 → G1, G2, G3 → C2 → E3 →
the rest. Items needing the owner (E4, G4, H*) wait.

## I. Sample consortium (owner, 2026-11-27)
- [x] I1. /partners/sample-consortium: Example Union + two locals — edition and
  member pages, contacts inside experiences, sample reports from fictional
  usage (GET /api/partner-report/sample, sample partners only), co-branded PDFs
  (public/partners/example-union*-all-tools.pdf; regenerate with
  scripts/partner-all-tools.mjs after catalog changes), launch kits, letter to
  members, setup checklist, board summary, and mailto forms (add/update a
  member, request an experience, request report codes).
- [x] I2. Organizations page: point "See a sample report" at the live sample
  report and add a "See a sample consortium" link (sales-page copy: owner).
