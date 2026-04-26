<!-- v1.0 · 2026-04-25 · initial draft -->
# Guide Discovery Process

## Goal

Up to 5 guides per tool. Define each guide's purpose: what query it targets, what the searcher gets, what tool it converts to. Some tools won't support 5 guides — or any. Some will suggest 10+; record extras as next-wave candidates.

## Pre-pass: does the tool support guides at all?

A guide ranks because it answers a real searched question. If the tool's premise is abstract, meta, or self-reflective ("calculate your luck surface area"), no one Googles for it.

Test: can you state the tool as *"people who Google [phrase] need this tool"*? If you can't fill in the phrase with a real searcher's words, skip the tool. Mark Tool Fitness as **"no guides — abstract premise"** and move on. The current `NONE` tier in `Tool Fitness` is mostly this category, correctly identified.

## The funnel, per tool

1. **Seed list (15–30 queries, ~15 min)** — brainstorm every phrase a user with this need would type. Real language, not internal taxonomy. "Why is my cat throwing up" not "feline GI symptom triage."
2. **Tier 1 triage (~5 min per query)** — autocomplete, Trends, SERP inspection, PAA. Tag each seed: **OK / brand-walled / low-volume / split-into-variants / drop**.
3. **Select up to 5** — by intent fit × tractability. Drop walled and low-volume; keep tractable + on-mission. If fewer than 5 survive, ship fewer; don't pad.
4. **Define each guide's purpose** — one sentence per guide: *"Targets [query] for users who [moment]; converts to [tool] via [bridge]."*
5. **Record to Backlog** — full row with Tier 1 notes attached.

## Per-query Tier 1 checks

Run in an **incognito window**, signed out, so personalization doesn't skew results.

- **Autocomplete scan.** Type the seed; note Google's dropdown. Adds 5–15 real variants. The variant is often more searched than your guess. Document the top 3–5 suggestions.
- **Google Trends** (`trends.google.com`). Drop in the seed. Check: 5-year curve (rising? dying? seasonal?), regional concentration (US-only? global?), "related queries" panel (rising risers are gold). If two seeds compete, run them in the comparison view — the taller line wins.
- **SERP inspection.** Search the seed. Look at the top 10. **Brand-walled** if 8+ are top-tier (WebMD, Healthline, NerdWallet, Forbes, NYT, Indeed). **Penetrable** if the mix includes Reddit, smaller blogs, niche forums, or no clear authority. Note the #1 domain. 30 seconds.
- **People Also Ask (PAA).** Scroll past the top results to the PAA accordion. Each question is a candidate sub-guide. Note the 4–6 visible. Clicking one expands more — endless rabbit hole; cap at 10.
- **Post-launch: GSC.** Once Search Console has 90 days of data, look up impressions/clicks/avg position for related queries. This replaces every other signal as ground truth — but only after launch.

## Decision rules

**Pursue if**: specific multi-word phrase + non-empty autocomplete + non-flat Trends + at least one non-brand result in the top 5.

**Drop if**: top 3 are all top-tier brand sites with optimized content; Trends is flat near zero; autocomplete doesn't surface the phrase (Google's signal that real people don't type it); the bridge to the tool is strained.

**Defer (tag `watch`)** if: rising trend but currently low; PAA shows demand but the tool doesn't yet fit; brand-walled now but the SERP shape (e.g. lots of forum threads ranking) suggests an opening.

## Backlog row schema (extended)

Existing columns: `Tool · Cluster · Query · Slug · Category · Priority · Status · Notes`.

Add for the discovery pass:
- **Purpose** — one-sentence bridge from user moment to tool
- **Pre-write check** — `OK / brand-walled / split / watch / drop`
- **Top competitor** — domain ranking #1 on the bare query
- **Trends signal** — `rising / steady / seasonal / flat / unknown`
- **Autocomplete variants** — short list of suggestions worth knowing

Add post-launch (when GSC is connected):
- `GSC impressions 90d`, `GSC clicks 90d`, `GSC avg position`

## Outcome per tool, recorded in Tool Fitness

After the pass, every tool ends in one of four states:

- **Confirmed guide-bearing** — 1–5 guides selected, purposes defined, ready to draft
- **Confirmed beyond 5** — extras logged as next-wave; pursue cluster fully later
- **Confirmed sparse** — 1–2 viable guides only; not a content priority
- **Confirmed dry** — no viable guides; mark `Status: Skip` and Notes `"no guides — [reason]"`

Update `Tool Fitness` Status (`Done / Queue / Skip`) and Notes after every tool's pass. The sheet becomes the running record of the full catalog audit.

## Cadence

One tool per discovery session. ~90 min per tool: 15 min seeding, 60 min Tier 1 (5 min × ~12 queries), 15 min selection + Backlog write-up. Three tools a week is sustainable; ten in a sprint week is the upper bound. Don't batch — fatigue produces brand-wall blindness.
