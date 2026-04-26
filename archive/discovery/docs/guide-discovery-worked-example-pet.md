<!-- v1.0 · 2026-04-25 · companion to guide-discovery-process.md -->
# Worked Example: PetWeirdnessDecoder

This is the full discovery pass for one tool. The Tier 1 results below are **predictions**, not run data — Bruce will run the actual checks in incognito and update. The example shows the workflow shape, the decisions, and the Backlog output.

**Tool premise:** *"Is it quirky or concerning?"* — a worried owner notices odd pet behavior and wants triage: reassure, watch-and-wait, or vet-now.

---

## Step 1: seed list (~15 min)

Brainstorm what a worried owner Googles at 11pm. Group by animal × symptom shape.

**Cats** — `why is my cat throwing up`, `why is my cat sneezing`, `why is my cat hiding`, `why is my cat not eating`, `why is my cat panting`, `why does my cat stare at the wall`, `is my cat sick or just being weird`, `why is my cat acting weird all of a sudden`

**Dogs** — `why is my dog shaking`, `why is my dog limping`, `why is my dog eating grass`, `why is my dog scared of nothing`, `why won't my dog eat`, `why is my dog drinking so much water`, `why is my dog acting weird`

**Triage / cross-species** — `when to take a pet to the vet`, `is this an emergency for my pet`, `pet symptoms that need a vet`, `how to tell if my dog is in pain`, `how to tell if my cat is in pain`, `weird things my cat does that aren't normal`

22 seeds. Move to Tier 1.

---

## Step 2: Tier 1 triage (selected illustrative entries)

### `why is my cat throwing up`
- **Autocomplete (predicted):** "...white foam", "...after eating", "...everyday", "...but acting normal", "...yellow"
- **Trends:** steady, very high; mild winter peak (hairball season correlate?)
- **SERP top 3:** PetMD · ASPCA · Cornell College of Veterinary Medicine — **brand-walled**
- **PAA:** "When should I worry...", "What does the color mean...", "Is it serious if my cat throws up daily..."
- **Verdict:** brand-walled on the bare query. The variant *"...but acting normal"* is the triage question — exactly PWD's premise. Pursue the variant; drop the bare.
- **Tag:** **split** → variant `why is my cat throwing up but acting normal`

### `is my cat sick or just being weird`
- **Autocomplete:** thin (Google may not autocomplete this exact phrasing)
- **Trends:** lower volume, but on-brand
- **SERP top 3:** likely Reddit r/CatAdvice + smaller pet blogs + Quora — **penetrable**
- **PAA:** thin
- **Verdict:** lower absolute volume but the phrase is the tool's exact promise; SERP is open.
- **Tag:** **OK**

### `when to take a cat to the vet`
- **Autocomplete:** strong list
- **Trends:** steady high
- **SERP top 3:** VCA · PetMD · The Spruce Pets — **brand-walled**
- **Verdict:** brand-walled, on-mission, but no opening on this exact phrase.
- **Tag:** **drop** (revisit if the SERP shape changes)

### `why is my dog shaking`
- **Autocomplete:** "...for no reason", "...and acting weird", "...uncontrollably", "...but acting normal"
- **Trends:** steady, high
- **SERP top 3:** AKC · PetMD · Rover — **brand-walled**
- **Verdict:** parallel to the cat-vomiting case — variant *"and acting normal"* opens space.
- **Tag:** **split** → variant `why is my dog shaking but acting normal`

### `weird things my cat does that aren't normal`
- **Autocomplete:** moderate
- **Trends:** rising mildly over 5 years
- **SERP top 3:** mixed — Reader's Digest, smaller blogs, Reddit — **penetrable**
- **PAA:** rich; cross-references the tool's promise directly
- **Verdict:** long-tail, exact tool match.
- **Tag:** **OK**

### `how to tell if my dog is in pain`
- **Autocomplete:** strong
- **Trends:** steady
- **SERP top 3:** AKC · PetMD · VCA — **brand-walled**
- **PAA:** "Signs of pain in dogs", "Do dogs hide pain", "How do I know if my dog is suffering"
- **Verdict:** brand-walled. PAA shows the second-order question *"do dogs hide pain"* which is more on-brand for PWD (it's literally about decoding hidden weirdness) and likely less competitive.
- **Tag:** **split** → variant `do dogs hide pain` or `signs my dog is hiding pain`

(Repeat for remaining 16 seeds. Estimated outcomes: ~4 OK, ~6 split, ~10 drop.)

---

## Step 3: select up to 5

Surviving candidates ranked by *intent fit × tractability*:

1. **`why is my cat throwing up but acting normal`** — High. Variant surfaced via autocomplete; brand sites mostly answer the bare query, not the qualifier. Pure triage moment.
2. **`why is my dog shaking but acting normal`** — High. Same pattern. Two variants of the same play across the two species; consistent voice possible.
3. **`is my cat sick or just being weird`** — Medium. Lower volume, but the tool's exact promise; SERP penetrable.
4. **`weird things my cat does that aren't normal`** — Medium. Long-tail; matches PWD's *"quirky or concerning"* frame; rising trend.
5. **`signs my dog is hiding pain`** — High. PAA-surfaced; second-order phrasing; matches PWD's hidden-weirdness premise more than the bare *"is in pain"* query does.

5 selected. Cluster suggests at least 5 more candidates worth holding (the split variants from `sneezing`, `not eating`, `hiding`, etc.) — record those as next-wave.

---

## Step 4: define each guide's purpose

| # | Query | Purpose | Bridge |
|---|---|---|---|
| 1 | why is my cat throwing up but acting normal | Pattern-match vomiting frequency × cat behavior to reassure-or-escalate | "Run your cat's pattern through PetWeirdnessDecoder for a personalized read →" |
| 2 | why is my dog shaking but acting normal | Pattern-match shaking triggers × dog state to reassure-or-escalate | (parallel to #1) |
| 3 | is my cat sick or just being weird | Decode the difference between quirky and concerning behaviors | "Decode your cat's specific weirdness →" |
| 4 | weird things my cat does that aren't normal | Catalog of common-but-actually-concerning cat behaviors with triage notes | "Get a personalized read on your cat's specific behavior →" |
| 5 | signs my dog is hiding pain | Reading subtle pain signals; decoding silence as a symptom | "Run your dog's behavior through the decoder →" |

---

## Step 5: Tool Fitness update

| Field | Value |
|---|---|
| Tool | PetWeirdnessDecoder |
| Tagline | Is it quirky or concerning? |
| SEO Fit | **HIGH** (confirmed via Tier 1) |
| Est. Queries | 30+ (5 selected + ~10 next-wave + PAA tail) |
| Status | **Drafting** (was Queue) |
| Notes | "5 launch guides selected. SERP penetrable on `acting normal` variants and PAA second-order phrasings; brand-walled on bare `why is my [pet] X` queries. Next-wave: sneezing/not-eating/hiding variants." |

---

## Backlog rows to write

Five new rows on the Backlog sheet, with the extended schema:

```
Tool                  Cluster        Query                                              Priority  Pre-write  Top competitor  Trends    Purpose
PetWeirdnessDecoder   Cat triage     why is my cat throwing up but acting normal        High      OK         PetMD           steady    Reassure-or-escalate based on pattern
PetWeirdnessDecoder   Dog triage     why is my dog shaking but acting normal            High      OK         AKC             steady    Reassure-or-escalate based on pattern
PetWeirdnessDecoder   Cat behavior   is my cat sick or just being weird                 Medium    OK         (Reddit-mix)    low       Decode quirky vs concerning
PetWeirdnessDecoder   Cat behavior   weird things my cat does that aren't normal        Medium    OK         (mixed)         rising    Catalog of concerning behaviors
PetWeirdnessDecoder   Dog triage     signs my dog is hiding pain                        High      OK         (PAA-derived)   steady    Reading subtle pain signals
```

Cluster names (`Cat triage`, `Dog triage`, `Cat behavior`) get added to the Cluster taxonomy for this tool.

---

## Notes for actually running this

- All Tier 1 results above are **predicted**, not measured. Real numbers may shift the picks.
- Predictions tend to be wrong about: (a) which exact phrase Google autocompletes (often a sibling phrase wins), (b) whether a SERP is brand-walled or penetrable (changes faster than expected), (c) Trends absolute volume (the eye-test is unreliable; check the comparison view).
- Time budget: this whole pass should take ~90 minutes. If it takes longer, the seed list was too long; cap at 25 seeds and accept that the cluster's full long tail will surface in later passes once GSC is live.
