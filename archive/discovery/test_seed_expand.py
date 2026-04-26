"""Self-test for seed_expand.py helpers — runs without network."""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from seed_expand import (
    normalize, is_question, word_count, keep_by_length,
    filter_reddit_titles, filter_sitemap_titles, TAG_PREFIX_RE,
)


def test(name, cond):
    print(f"  {'PASS' if cond else 'FAIL'}  {name}")
    return bool(cond)

results = []

# normalize
results.append(test("normalize lowercases",
    normalize("Why Is My Cat") == "why is my cat"))
results.append(test("normalize strips smart quotes",
    normalize("\u201cwhy is my cat\u201d") == "why is my cat"))
results.append(test("normalize strips trailing ?",
    normalize("why is my cat?") == "why is my cat"))
results.append(test("normalize collapses whitespace",
    normalize("why   is\tmy  cat") == "why is my cat"))

# is_question
results.append(test("is_question accepts 'why is'",
    is_question("why is my cat throwing up")))
results.append(test("is_question accepts 'how to'",
    is_question("how to cancel a subscription")))
results.append(test("is_question rejects statement",
    not is_question("my cat is sick")))
results.append(test("is_question rejects empty",
    not is_question("")))

# keep_by_length
results.append(test("keep_by_length 5 words ok",
    keep_by_length("why is my cat sick")))
results.append(test("keep_by_length 2 words rejected",
    not keep_by_length("cat sick")))
results.append(test("keep_by_length 16 words rejected",
    not keep_by_length(" ".join(["w"] * 16))))

# Reddit filter
reddit_input = [
    "[Help] Why is my cat throwing up everywhere",   # tag prefix; question; ok
    "My cat is sick",                                 # statement; rejected
    "How do I cancel my subscription?",               # question with ?; ok
    "Why",                                            # too short; rejected
    "[Vent] " + " ".join(["word"] * 20),              # too long after tag strip
    "Why is my cat acting weird and what should I do really am worried so much",  # 16 words; reject
]
filtered = filter_reddit_titles(reddit_input)
results.append(test("reddit filter drops statements/short/long",
    len(filtered) == 2))
results.append(test("reddit filter strips [Help] prefix",
    "why is my cat throwing up everywhere" in filtered))
results.append(test("reddit filter strips ? from question",
    "how do i cancel my subscription" in filtered))

# Sitemap filter (already-normalized phrases)
sitemap_input = [
    "why is my cat throwing up",       # ok
    "best cat food brands 2024",       # not question; reject
    "how to cancel cable",             # ok
    "the",                              # too short; reject
]
filtered2 = filter_sitemap_titles(sitemap_input)
results.append(test("sitemap filter keeps questions",
    len(filtered2) == 2))

print()
passed = sum(results)
total = len(results)
print(f"{passed}/{total} passed")
sys.exit(0 if passed == total else 1)
