<!-- v0.1 · 2026-04-25 · matches seed_expand.py v0.1 -->
# seed_expand.py — README

Module 1 of the DeftBrain seed-discovery pipeline. Expands 3–5 root phrases per tool into ~100–200 candidate query seeds.

## What it does

- **Autocomplete cascade** — for each root, hits Google's `suggestqueries` endpoint (the same JSON Firefox uses for its address bar). Two layers: the root itself, then each layer-1 suggestion. Yields the longer, more-specific phrasings real searchers actually type.
- **Reddit pass** — pulls 100 most recent thread titles from each named subreddit via the public `/new.json` endpoint. Filters to question-shape titles (start with `why/how/what/when/can/do/is/...`), 3–15 words. Strips `[Help]`-style tag prefixes.
- **Sitemap pass (optional)** — pulls XML sitemap URLs from competitor sites, derives title-shaped phrases from URL slugs, applies the same question-shape filter.
- **Output** — two CSVs: `seeds_raw.csv` (every row, with provenance) and `seeds_ranked.csv` (deduplicated, sorted with multi-source queries first — strongest signal at the top).

## Setup

None. Pure stdlib. Just need Python 3.9+.

The Reddit endpoint requires only a non-default User-Agent (the script sends one). No API keys, no OAuth, no env vars. If Reddit starts throttling — observable as `429` errors in stderr — upgrade to PRAW; the swap is small and isolated to the `reddit_titles()` function.

## Usage

```bash
python3 seed_expand.py \
    --roots roots-pet.txt \
    --subreddits cats,dogs,AskVet,Pets \
    --output-dir ./out
```

Inputs:
- `--roots` (required) — text file, one root phrase per line. `#` comments and blank lines skipped.
- `--subreddits` (optional) — comma-separated subreddit names (no `r/` prefix).
- `--sitemaps` (optional) — comma-separated sitemap URLs (the urlset, not the index).
- `--max-per-root` — cap on autocomplete cascade per root (default 60).
- `--sleep` — seconds between requests (default 0.3, polite).

Outputs (in `--output-dir`):
- `seeds_raw.csv` — every (query, source, root) row, no dedup. Audit trail.
- `seeds_ranked.csv` — deduplicated, sorted: multi-source first, then shorter queries, then alphabetical. Work product.

## Per-tool workflow

1. Open the tool. Write the user moment in one sentence.
2. Write 3–5 roots based on the moment. *Roots are not seeds* — they're canonical phrasings real searchers start with.
3. Pick 2–4 subreddits where users in this moment hang out.
4. Save roots to `roots-<tool>.txt`.
5. Run `seed_expand.py`. Wall time: ~1–3 minutes.
6. Open `seeds_ranked.csv`. Multi-source rows are at the top. Skim, kill wrong-fits, copy keepers (one per line) into `seeds-<tool>.txt`.
7. Hand off to the Tier 1 triage script (next session).

## Time and yield expectations

| Component | Wall time | Typical yield |
|---|---|---|
| Autocomplete cascade per root | ~5 sec | 30–60 unique suggestions |
| Reddit per subreddit | ~2 sec | 30–80 question-shaped titles (out of 100 fetched) |
| Sitemap per URL | ~5–20 sec | varies (depends on site) |

Typical tool with 5 roots + 4 subreddits: **~2 min wall time, 150–300 raw candidates, 100–200 unique after dedup**.

## What it deliberately doesn't do

- **Doesn't validate volume.** That's Tier 1 (Trends, Bing SERP).
- **Doesn't score brand-wall risk.** Tier 1.
- **Doesn't score intent fit.** Always human (the 10-min review pass on `seeds_ranked.csv`).
- **Doesn't recurse into sitemap indexes.** Pass the urlset directly.
- **Doesn't fuzzy-dedupe.** Only normalized-exact matches collapse. "Why is my cat throwing up" and "why is cat throwing up" stay separate. Module 2 can add fuzzy dedup if needed.

## Subreddit suggestions by category

Starter sets. The more on-target, the higher the question-title yield.

| Category | Suggested subreddits |
|---|---|
| pets | cats, dogs, AskVet, Pets |
| workplace | jobs, managers, AskHR, careerguidance |
| conversations | relationships, AmItheAsshole, raisedbynarcissists |
| home | Renters, legaladvice, RealEstate |
| health | AskDocs, ChronicIllness, ChronicPain |
| consumer | personalfinance, Frugal, ConsumerAdvice |
| plants | houseplants, IndoorGarden, plantclinic |
| automotive | cars, MechanicAdvice, askcarsales |
| travel | travel, solotravel, onebag |

## Roadmap

- **`tier1_triage.py`** — runs Bing SERP + Trends + competitor checks on the surviving 25–30 seeds from `seeds.txt`. Outputs final Backlog-ready CSV.
- **Optional Module 1.5: `seed_dedupe.py`** — fuzzy dedupe (currently exact-match only; embeddings-based dedup could collapse near-duplicates).
- **Optional: PRAW upgrade** — if Reddit starts blocking the public JSON endpoint, swap `reddit_titles()` for a PRAW-based version.
- **Optional: Claude generation pass** — accept an `ANTHROPIC_API_KEY`, run the tool description through Sonnet to generate ~30 candidate queries. Cheap (~$0.01/tool). Skipped in v1 because Claude confabulates and autocomplete validates better.

## Eventual file layout

```
/discovery/
├── seed_expand.py
├── tier1_triage.py       (next)
├── roots/
│   ├── roots-pet.txt
│   ├── roots-plant.txt
│   └── ...
├── seeds-raw/
├── seeds-ranked/
└── triage/
```
