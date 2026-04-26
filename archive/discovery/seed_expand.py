#!/usr/bin/env python3
"""
seed_expand.py v0.1 — expand root phrases into raw seed candidates.

Sources:
  - Google autocomplete (cascading, free, no auth)
  - Reddit thread titles (public JSON endpoint, free, User-Agent required)
  - Competitor sitemaps (XML, free)

Inputs:
  --roots roots.txt          (required) one root phrase per line
  --subreddits cats,dogs     (optional) comma-separated subreddit names
  --sitemaps url1,url2       (optional) comma-separated sitemap.xml URLs
  --output-dir ./out         (default ./out)
  --max-per-root N           (default 60)
  --sleep S                  (default 0.3) seconds between requests

Outputs (both written to --output-dir):
  seeds_raw.csv     every (query, source, root) row, before dedup
  seeds_ranked.csv  deduplicated, ranked by source-overlap (multi-source first)

No external Python deps. All stdlib (urllib, json, csv, xml).
Run:
  echo "why is my cat" > roots.txt
  echo "why is my dog" >> roots.txt
  python3 seed_expand.py --roots roots.txt --subreddits cats,dogs,AskVet
"""

import argparse
import csv
import json
import os
import re
import sys
import time
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET

USER_AGENT = "DeftBrain seed_expand/0.1 (+https://deftbrain.com)"

QUESTION_STARTS = (
    "how ", "why ", "what ", "when ", "where ", "who ",
    "can ", "could ", "should ", "will ", "would ",
    "do ", "does ", "did ",
    "is ", "are ", "was ", "were ",
)


# ---------- HTTP ----------

def fetch(url, timeout=10.0):
    req = urllib.request.Request(
        url,
        headers={"User-Agent": USER_AGENT, "Accept": "*/*"},
    )
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()


# ---------- normalization ----------

def normalize(q):
    """Lowercase, strip quotes, collapse whitespace, drop trailing punctuation."""
    q = q.lower().strip()
    q = re.sub(r"[\u2018\u2019\u201c\u201d\"']", "", q)
    q = re.sub(r"\s+", " ", q)
    q = re.sub(r"[?!.]+$", "", q)
    return q


def is_question(q):
    return q.lower().lstrip().startswith(QUESTION_STARTS)


def word_count(q):
    return len(q.split())


def keep_by_length(q, lo=3, hi=15):
    wc = word_count(q)
    return lo <= wc <= hi


# ---------- Google autocomplete ----------

AUTOCOMPLETE_URL = "https://suggestqueries.google.com/complete/search?client=firefox&q={q}"


def autocomplete(query):
    """One autocomplete call. Returns up to 10 suggestions. Empty list on error."""
    try:
        url = AUTOCOMPLETE_URL.format(q=urllib.parse.quote(query))
        data = json.loads(fetch(url))
        # Format: [echo_string, [suggestion, suggestion, ...], ...]
        if isinstance(data, list) and len(data) >= 2 and isinstance(data[1], list):
            return [s for s in data[1] if isinstance(s, str)]
    except Exception as e:
        print(f"  autocomplete error for {query!r}: {e}", file=sys.stderr)
    return []


def cascade_autocomplete(root, max_total=60, sleep=0.3):
    """
    Two-layer cascade:
      L1: query the root directly        → up to 10 suggestions
      L2: query each L1 suggestion       → longer continuations
    Stops at max_total unique suggestions. Returns list of (query, root).
    """
    seen = set()
    out = []

    layer1 = autocomplete(root)
    time.sleep(sleep)
    for s in layer1:
        n = normalize(s)
        if n and n not in seen:
            seen.add(n)
            out.append((n, root))

    for q in layer1:
        if len(out) >= max_total:
            break
        layer2 = autocomplete(q)
        time.sleep(sleep)
        for s in layer2:
            n = normalize(s)
            if n and n not in seen:
                seen.add(n)
                out.append((n, root))
                if len(out) >= max_total:
                    break

    return out


# ---------- Reddit ----------

REDDIT_URL = "https://www.reddit.com/r/{sub}/new.json?limit=100"


def reddit_titles(subreddit):
    """Fetch up to 100 recent thread titles from a subreddit. Empty on error."""
    try:
        url = REDDIT_URL.format(sub=urllib.parse.quote(subreddit))
        data = json.loads(fetch(url))
        children = data.get("data", {}).get("children", [])
        return [c.get("data", {}).get("title", "") for c in children]
    except Exception as e:
        print(f"  reddit error for r/{subreddit}: {e}", file=sys.stderr)
        return []


TAG_PREFIX_RE = re.compile(r"^\s*\[[^\]]+\]\s*")


def filter_reddit_titles(titles):
    """Keep question-shaped titles, 3-15 words, after stripping [tag] prefixes."""
    out = []
    for t in titles:
        cleaned = TAG_PREFIX_RE.sub("", t).strip()
        cleaned = normalize(cleaned)
        if not cleaned or not is_question(cleaned):
            continue
        if not keep_by_length(cleaned):
            continue
        out.append(cleaned)
    return out


# ---------- Sitemaps ----------

SITEMAP_NS = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9"}


def fetch_sitemap_titles(sitemap_url, max_urls=500):
    """
    Pull URLs from a sitemap, derive title-shaped phrases from the slug.
    NOTE: does not recurse into sitemap indexes. Pass the urlset sitemap directly.
    """
    try:
        xml_bytes = fetch(sitemap_url, timeout=20.0)
        root = ET.fromstring(xml_bytes)
    except Exception as e:
        print(f"  sitemap error for {sitemap_url}: {e}", file=sys.stderr)
        return []

    titles = []
    locs = root.findall(".//s:loc", SITEMAP_NS) or root.findall(".//loc")
    for el in locs[:max_urls]:
        url = (el.text or "").strip()
        if not url or url.endswith(".xml"):
            continue
        slug = url.rstrip("/").rsplit("/", 1)[-1]
        slug = re.sub(r"\.html?$", "", slug, flags=re.IGNORECASE)
        phrase = slug.replace("-", " ").replace("_", " ")
        phrase = normalize(phrase)
        if phrase:
            titles.append(phrase)
    return titles


def filter_sitemap_titles(titles):
    out = []
    for t in titles:
        if not is_question(t):
            continue
        if not keep_by_length(t):
            continue
        out.append(t)
    return out


# ---------- main ----------

def main():
    ap = argparse.ArgumentParser(
        description="Expand root phrases into seed candidates.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    ap.add_argument("--roots", required=True, help="Path to roots.txt (one per line)")
    ap.add_argument("--subreddits", default="", help="Comma-separated subreddit names")
    ap.add_argument("--sitemaps", default="", help="Comma-separated sitemap URLs")
    ap.add_argument("--output-dir", default="./out", help="Output directory")
    ap.add_argument("--max-per-root", type=int, default=60)
    ap.add_argument("--sleep", type=float, default=0.3)
    args = ap.parse_args()

    try:
        with open(args.roots, "r", encoding="utf-8") as f:
            roots = [
                line.strip() for line in f
                if line.strip() and not line.lstrip().startswith("#")
            ]
    except FileNotFoundError:
        print(f"roots file not found: {args.roots}", file=sys.stderr)
        return 1

    if not roots:
        print(f"no roots in {args.roots}", file=sys.stderr)
        return 1

    os.makedirs(args.output_dir, exist_ok=True)
    raw_path = os.path.join(args.output_dir, "seeds_raw.csv")
    ranked_path = os.path.join(args.output_dir, "seeds_ranked.csv")

    rows = []

    # 1. Autocomplete cascade
    print(f"== Autocomplete cascade ({len(roots)} roots) ==")
    for root in roots:
        print(f"  root: {root}")
        results = cascade_autocomplete(root, max_total=args.max_per_root, sleep=args.sleep)
        print(f"    {len(results)} suggestions")
        for query, source_root in results:
            rows.append({
                "query": query,
                "source": "autocomplete",
                "root": source_root,
                "length_words": word_count(query),
            })

    # 2. Reddit
    subreddits = [s.strip() for s in args.subreddits.split(",") if s.strip()]
    if subreddits:
        print(f"== Reddit ({len(subreddits)} subreddits) ==")
        for sub in subreddits:
            print(f"  r/{sub}")
            titles = reddit_titles(sub)
            time.sleep(args.sleep)
            kept = filter_reddit_titles(titles)
            print(f"    {len(titles)} titles → {len(kept)} question-shaped")
            for t in kept:
                rows.append({
                    "query": t,
                    "source": f"reddit:r/{sub}",
                    "root": "",
                    "length_words": word_count(t),
                })

    # 3. Sitemaps
    sitemap_urls = [s.strip() for s in args.sitemaps.split(",") if s.strip()]
    if sitemap_urls:
        print(f"== Sitemaps ({len(sitemap_urls)}) ==")
        for sm_url in sitemap_urls:
            print(f"  {sm_url}")
            titles = fetch_sitemap_titles(sm_url)
            time.sleep(args.sleep)
            kept = filter_sitemap_titles(titles)
            print(f"    {len(titles)} URLs → {len(kept)} question-shaped")
            domain = re.sub(r"^https?://", "", sm_url).split("/")[0]
            for t in kept:
                rows.append({
                    "query": t,
                    "source": f"sitemap:{domain}",
                    "root": "",
                    "length_words": word_count(t),
                })

    # Write raw
    with open(raw_path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["query", "source", "root", "length_words"])
        w.writeheader()
        w.writerows(rows)

    # Dedupe by query, accumulating sources
    by_query = {}
    for r in rows:
        q = r["query"]
        if q in by_query:
            existing = by_query[q]
            srcs = set(existing["source"].split("|"))
            srcs.add(r["source"])
            existing["source"] = "|".join(sorted(srcs))
            existing["source_count"] = len(srcs)
            if r["root"] and not existing["root"]:
                existing["root"] = r["root"]
        else:
            by_query[q] = {
                "query": q,
                "source": r["source"],
                "source_count": 1,
                "root": r["root"],
                "length_words": r["length_words"],
            }

    ranked = list(by_query.values())
    ranked.sort(key=lambda x: (-x["source_count"], x["length_words"], x["query"]))

    with open(ranked_path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(
            f,
            fieldnames=["query", "source_count", "source", "root", "length_words"],
        )
        w.writeheader()
        w.writerows(ranked)

    print()
    print("== Done ==")
    print(f"  Total raw rows: {len(rows)}")
    print(f"  Unique queries: {len(ranked)}")
    print(f"  Multi-source:   {sum(1 for r in ranked if r['source_count'] > 1)}")
    print(f"  Wrote {raw_path}")
    print(f"  Wrote {ranked_path}")
    print()
    print("Next: review seeds_ranked.csv, copy keepers (1 per line) into seeds.txt,")
    print("then feed seeds.txt to the Tier 1 script (next session).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
