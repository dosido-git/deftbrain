| Venue | Lead with | Why |
|---|---|---|
| **Directories** | The suite | You are being *filed*. Breadth is the product, and a listing gives you a paragraph, not a scroll-past. |
| **Show HN / Product Hunt** | One tool | A feed gives you one sentence. Breadth reads as unfocused there — not because the catalog is weak, but because a hook has to be singular. |

Either way the other half appears — as the example inside the breadth pitch, or
as the surprise inside the single-tool pitch. Never omit it.

## The competitive story (use this everywhere)

The competitor for any single tool is **not** Grammarly, Wirecutter, or Otter.
For each one there will always be a specialist that does that one job better.
The real competitor is *the user opening a blank chatbot box and working out the
prompt themselves.*

Against that, breadth **is** the product: someone already did the prompt
engineering, the output schema, the jurisdiction grounding and the formatting —
125 times over. That story only works at catalog scale. A single tool cannot
tell it.

## The anti-farm proof (non-negotiable in any suite pitch)

In 2026, "over 100 AI tools" pattern-matches to a content farm, and curators
scan defensively for exactly that. Never lead with the count. Lead with the
problem class, then earn it with these three — they are things a farm never
does:

1. **13 languages with jurisdictional and currency reasoning.** Not translation:
   local-context adaptation. Prices, customs, and legal parameters change with
   the reader.
2. **Tools that argue against their own use.** Ticket Tackler says *just pay*.
   BuyWise says *buy the $30 generic instead*. A farm never talks you out of a
   click.
3. **Grounded against live sources** for legal and regulatory facts, with an
   explicit staleness policy — not model memory.

---

# Directory listings (breadth-first)

**One-liner:** Personal AI problem solvers for moments too specific or personal
for search engines.

**Short (≈290 chars):** Most AI tools are generic chatbots trying to do
everything. DeftBrain is the opposite: small, focused tools each built for one
real problem — not "write me an email," but "how do I get my deposit back" or
"is this lease going to screw me." Free, no signup, 13 languages.

**Long:** use `audit/long description.txt`, with one change — cut the closing
"over 100 tools" line and end on the anti-farm proof instead. The count is the
weakest sentence in that copy.

**Link target:** `https://deftbrain.com` — **not** a tool page, unless that tool
is on the keep-list. 88 of the tool pages are noindexed, and a backlink to a
long-term noindexed page passes little or no authority. With only ~2 backlinks
sitewide, that distinction is most of the value of the submission.

**Naming a demo tool inside the listing:** pick by venue audience.
- General/productivity → **Velvet Hammer** (universally relatable; everyone has
  drafted an email in anger). Lead on the *three calibrated stances* —
  Collaborative / Balanced / Firm — not on "rewrites your email," which is table
  stakes and instantly commoditized.
- News/legal/consumer → **Ticket Tackler**.
- Accessibility/neurodivergent → **Virtual Body Double**, **Sensory Minefield
  Mapper**.

---

# Show HN (news.ycombinator.com/submit)

**Title options (≤80 chars, pick one):**

1. `Show HN: A tool that builds your parking-ticket appeal – or tells you to just pay`
2. `Show HN: Paste your parking ticket, get an honest "fight it or pay it" verdict`
3. `Show HN: Free parking-ticket appeal builder that sometimes says "just pay it"`

Recommendation: #1. The em-dash clause is the hook — HN loves tools that argue
*against* their own use.

**URL:** `https://deftbrain.com/TicketTackler`

**First comment (post immediately after submitting — plain voice, no marketing):**

> I kept seeing two failure modes with tickets: people paying $60 tickets they
> could beat with one photo, and people burning an evening fighting tickets
> with zero legal substance. So the tool leads with an honest verdict —
> FIGHT / BORDERLINE / JUST PAY — before it writes anything. About a third of
> my test cases come back "just pay it."
>
> If it says fight, you get: defense angles ranked by strength, an evidence
> checklist ordered by what disappears first (photograph the signage today),
> a factual appeal letter in the tone hearing officers actually respond to,
> and where to file. Filing details are web-verified per city at request time
> and cached — where verification comes up empty it tells you how to find the
> official channel instead of inventing a portal, which is the failure mode I
> was most worried about with an LLM in the loop.
>
> No signup, no cookies, works in 13 languages. It's one of ~120 small
> single-purpose tools I've been building on the same chassis (deftbrain.com)
> — the parking one is just the most fun to demo.
>
> Not legal advice, no outcome promises — it helps you write your own appeal.
> Happy to answer anything about the stack or the honest-verdict design.

**Anticipated questions — prep (answer honestly, concede fast):**

- *"Isn't this legal advice?"* → It's a writing and evidence tool; it never
  predicts outcomes, and the weak-case path actively tells you to pay. Same
  category as a letter template, with better drafting.
- *"LLMs hallucinate — what about fake deadlines/portals?"* → Filing facts go
  through a web-verification pre-pass pinned to official sources; unverified =
  the tool says "check the ticket / find the official channel," never a
  specific claim. Deadlines only appear if verified or user-provided.
- *"Business model?"* → Honest answer: none yet. Validation stage; costs are
  API calls; deciding what it becomes after seeing what people actually use.
- *"Privacy?"* → No accounts, no cookies, first-party beacon analytics only
  (path + event, no identifiers); ticket photos go to the model API and are
  not stored server-side.
- *"DoNotPay comparison?"* → **Corrected 2026-07-31 — the old wording here
  ("promised outcomes and got FTC'd") was inaccurate, and misstating a
  regulatory action about a named company in public is a bad look.** What
  actually happened: DoNotPay marketed itself as "the world's first robot
  lawyer," and the FTC's order (finalized Feb 2025, part of Operation AI
  Comply) turned on claims it could **substitute for a lawyer** with no
  evidence — they never tested output against a human lawyer's and never
  retained an attorney to check the legal features. $193K plus notice to
  2021–2023 subscribers. Say: *"They sold themselves as a robot lawyer and the
  FTC's order turned on claiming it replaced one without evidence. This never
  claims to be a lawyer — it writes YOUR appeal, tells you when to just pay,
  and guarantees nothing."* Keep every capability claim to something you could
  actually evidence.
- *"Why 120 tools?"* → Same engine, different prompts+schemas; each tool is a
  hypothesis about a real-life problem. The catalog is the experiment. The
  alternative isn't a better single tool — it's the user writing the prompt
  themselves.

**Mechanics:** post a weekday, 9–11am ET. Stay in the thread for the first
2–3 hours. Never ask anyone to upvote (HN detects voting rings). If it
doesn't land, one re-submit weeks later is acceptable HN etiquette.

---

# Product Hunt

**Name:** Ticket Tackler (by DeftBrain)
**Tagline (≤60):** `Fight your parking ticket — or learn it's not worth it`
**Description:** Paste or photograph a parking/camera ticket. Get an honest
FIGHT / BORDERLINE / JUST PAY verdict, defense angles ranked by strength, an
evidence checklist, a ready-to-send appeal letter, and verified filing info
for your city. Free, no signup, 13 languages.

**Maker's first comment:** same story as the HN comment, lightly warmed up
(PH tolerates more enthusiasm than HN; keep the "sometimes says just pay"
honesty front and center — it's the differentiator on both venues). Close by
naming the catalog: the tool is one of ~120, and PH readers who like the
honest-verdict design are exactly the audience for the rest.

**Mechanics**
- Publish a **Coming Soon page 1–2 weeks ahead.** Followers get auto-notified
  at launch, and ranking is momentum-weighted on the first 2–3 hours. This is
  the only way to manufacture first-hour momentum without an existing audience,
  and it is the step solo makers skip.
- **Go live 12:01am PT** for the full 24-hour window. Launching at 9am forfeits
  a third of the day.
- **Tue–Thu** for traffic, weekend for an easier top-5. Validation is the goal,
  so take the weekday traffic.
- **Never ask for upvotes** — penalized and detectable. "I'd love your feedback"
  is the accepted phrasing and gets better comments anyway.
- **Comments are weighted heavily** and are the part you control. Reply to every
  one, fast, all day.
- **Gallery:** 3–4 screenshots. Make image one the **JUST PAY verdict** — a tool
  that talks you out of using it stops the scroll in a feed of AI hype. Then
  appeal letter, evidence checklist, verdict card.
- PH changes its mechanics regularly — **verify current rules before committing
  to a date.**

**Expectations, honestly:** PH rewards distribution you already have. With ~2
backlinks and no list, top-5 is unlikely, and only ~10% of submissions get
homepage-featured. Realistic outcome: a few hundred visitors, a `rel="ugc"`
link from a high-authority domain, and the first real feedback from strangers.
Worth doing — but a modest result is not a verdict on the product.

---

# Sequencing

1. **Directories first** (breadth pitch, homepage link). A PH or HN visitor who
   searches your name then finds you already listed elsewhere reads as
   established.
2. **Show HN** (weekday morning ET). Let it breathe.
3. **Product Hunt** a week later — needs the gallery prepped and the Coming Soon
   page live 1–2 weeks before *that*, so start it during step 1.

**Before any of it — two blockers:**

- **API billing auto-reload must be ON.** On 2026-07-30 the credit balance hit
  zero and every tool on the site returned 500 while `/api/health` still
  reported `ok`. During a launch window that burns the one shot. Consider making
  the health check fail loudly when the models are unreachable.
- **Flag your own browsers with `?operator=1`** so the traffic spike is clean.

**Measure the right thing:** watch `tool_run` and interactive sessions in
metrics, not referrers. A returning visitor is worth more validation signal than
a hundred bouncing ones — which is also why the *frequently needed* tools
(MiseEnPlace, VirtualBodyDouble, ContextCollapse, TheDebrief, DecoderRing) are
the retention instruments, while Ticket Tackler is the demo.
