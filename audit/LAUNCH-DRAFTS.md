# Launch drafts — Show HN + Product Hunt (2026-07-27)

Strategy: one sharp tool as the door, the catalog as the surprise inside.
Ticket Tackler is the door — universal pain, honest verdict, zero signup,
demo-able in 60 seconds. NOTHING here is posted by Claude; these are drafts
for the operator to post from their own accounts.

---

## Show HN (news.ycombinator.com/submit)

**Title options (≤80 chars, pick one):**

1. `Show HN: A tool that builds your parking-ticket appeal – or tells you to just pay`
2. `Show HN: Paste your parking ticket, get an honest "fight it or pay it" verdict`
3. `Show HN: Free parking-ticket appeal builder that sometimes says "just pay it"`

Recommendation: #1. The em-dash clause is the hook — HN loves tools that
argue *against* their own use.

**URL:** `https://deftbrain.com/TicketTackler`

**First comment (post immediately after submitting — this is where the Show HN
story lives, plain voice, no marketing):**

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
- *"DoNotPay comparison?"* → They promised outcomes and got FTC'd; this
  deliberately does the opposite — writes YOUR appeal, promises nothing.
- *"Why 120 tools?"* → Same engine, different prompts+schemas; each tool is a
  hypothesis about a real-life problem. The catalog is the experiment.

**Mechanics:** post a weekday, 9–11am ET. Stay in the thread for the first
2–3 hours. Never ask anyone to upvote (HN detects voting rings). If it
doesn't land, one re-submit weeks later is acceptable HN etiquette.

---

## Product Hunt

**Name:** Ticket Tackler (by DeftBrain)
**Tagline (≤60):** `Fight your parking ticket — or learn it's not worth it`
**Description:** Paste or photograph a parking/camera ticket. Get an honest
FIGHT / BORDERLINE / JUST PAY verdict, defense angles ranked by strength, an
evidence checklist, a ready-to-send appeal letter, and verified filing info
for your city. Free, no signup, 13 languages.

**Maker's first comment:** same story as the HN comment, lightly warmed up
(PH tolerates more enthusiasm than HN; keep the "sometimes says just pay"
honesty front and center — it's the differentiator on both venues).

**Mechanics:** PH launches reset daily at 12:01am PT; Tue–Thu are the
competitive-but-highest-traffic days. Gallery: 3–4 screenshots (verdict card,
appeal letter, evidence checklist, the JUST PAY case — show the honesty).

---

## Sequencing

Day 1: Show HN (morning ET). Let it breathe.
Week later: Product Hunt (needs the screenshot gallery prepped).
Both: the traffic spike doubles as validation data — watch tool_run +
interactive sessions in metrics, not just referrers. Flag your own browsers
with ?operator=1 BEFORE launch day so the spike is clean.
