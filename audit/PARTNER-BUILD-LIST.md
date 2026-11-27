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
- [ ] C2. Tool-local `BRAND` constants (119 tools): move to the shared helper so
  copy text gets the partner line too. Mechanical codemod, gated.

## D. Reports partners can open themselves (perks 2, 3; consortia 5)
- [x] D1. Per-partner report access: a report code per partner (hashed, same
  scheme as pricing codes) and a `/partners/report` page that shows that
  partner's report without the admin key.
- [x] D2. "What your people are struggling with": topics by category, busiest days
  (shipped: topics + weekdays; month-over-month rising/falling and hours still to do). Aggregate only, same
  fewer-than-20 suppression as today.
- [ ] D3. Grant/evidence export: the report as a printable one-pager framed for
  funders (reach, completions, topics, period), with method notes.

## E. Consortia and branded editions (consortia 1, 2)
- [ ] E1. Consortium records: a parent with members; every member gets its own
  `/for/<parent>/<member>` page, contacts and report, inheriting the parent's
  tools and branding unless it overrides them. Members added from a list.
- [ ] E2. Consortium roll-up report: all members together plus a per-member
  table.
- [ ] E3. Edition branding: edition name ("<Consortium> Life Navigator"),
  colours/logo on the partner bar, its own launch kit.
- [ ] E4. Own address: `<partner>.deftbrain.com` or a path on the partner's
  site (needs DNS/Railway domains; owner step).
- [ ] E5. Embed: a small script/iframe so a partner can put its edition inside
  its own site or app.
- [ ] E6. Revenue share tracking: pricing codes carry a consortium; sales and
  member counts roll up per consortium for royalty statements.

## F. Promotion kit (perk 6; consortia 10)
- [ ] F1. Co-branded printable all-tools list (PDF) per partner.
- [ ] F2. Poster/flier templates with QR to the partner page (extends the
  launch-kit handout).
- [ ] F3. Monthly newsletter blurbs for partners to paste.

## G. Procurement paperwork (perk 9; consortia 9)
- [ ] G1. Accessibility statement page.
- [ ] G2. Security summary page (hosting, data handled, retention, no accounts).
- [ ] G3. Partner Center privacy/data page review against what the code does.
- [ ] G4. Enterprise terms outline (uptime, response times, peak capacity):
  owner decisions.

## H. Bigger builds (need owner decisions or outside accounts)
- [ ] H1. Staff mode: front-line staff using tools while helping someone.
- [ ] H2. Phone and text access (needs a telephony account).
- [ ] H3. Partner-exclusive tools (unions, health plans, state libraries, credit
  unions): each is a full tool build; pick with the partner.
- [ ] H4. Large-print and paper kits.
- [ ] H5. Early access / partner tool requests (process + a flag).

## Order
A1, A2 → B1, B2 → C1 → D1, D2 → E1, E2 → D3, F1, F2 → G1, G2, G3 → C2 → E3 →
the rest. Items needing the owner (E4, G4, H*) wait.
