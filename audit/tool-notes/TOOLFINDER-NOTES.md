# ToolFinder — architecture & lock notes (v1, 2026-07-01)

Meta-tool: recommends other DeftBrain tools for a described problem. In `LOCALIZED_TOOLS`.

- **Model:** single endpoint `claude-haiku-4-5`, `max_tokens 2000`, `withLanguage`. Catalog built at startup by line-scraping `src/data/tools.js`; recommendations grounded (catalog injected in the system prompt) + filtered to real tool ids.
- **Endpoint:** `/api/tool-finder`.
- **Golden:** `audit/tool-finder-golden-sample.json` (batch-tasks case — should surface BatchFlow, a previously-dropped tool). Verify: `npm run check:golden tool-finder`.

## DO NOT silently reverse
1. **Catalog parser regexes are quote-agnostic** (`/^\s*title:\s*['"]([^'"]+)['"]/`, same for description/tagline/icon). Double-quote-only regexes dropped the 5 single-quoted-title tools (BatchFlow, PlainTalk, BrainRoulette, WardrobeChaosHelper, PlantRescue) → they could never be recommended (loaded 122/128). Backend log should say `Loaded 127 tools`.
2. **Parser reads `categories: [...]` (array)**, not `category:` (singular) — the singular form matched nothing, injecting `[undefined]` as every tool's category (model then hallucinated the badge).
3. `max_tokens 2000` (was 900 → truncation→retry→500 risk in verbose languages).
4. Guard `!parsed.recommendations` (top-level; empty array is truthy and handled).
5. No currency.

## 2026-08-21 — the page that removes taxonomy was asking for taxonomy

- **"Start Here" -> "Tool Finder"** (display only; id and route have always been
  /ToolFinder, so no redirect). The 2026-08-05 rename argued that users want to
  solve problems rather than find tools — true of every OTHER tool, backwards
  here, where finding the tool IS the service.
- **Eight category chips deleted.** "Tell me what's happening and I'll work out
  which tool you need", followed immediately by Writing / Money / Decisions /
  Conversation / Repair / Learning / Planning / Cooking. Replaced by FOUR example
  situations written the way a person would say them, none naming a tool or a
  category. Same fix as the Wrong Answers Only CATEGORY control.
- **Skill Gap Map line removed.** The page for people who don't know what they
  need was telling them to go and find out what they need. If the description
  warrants Skill Gap Map, the OUTPUT should say so — that is the whole job.
- **"Related tools" box removed.** Two hand-picked links under the page whose
  entire output is picked links, chosen by nobody who read the problem.
- **History -> "Things you've asked about", collapsed** behind the shared Caret.
  It belongs here (a past recommendation is worth returning to) but it was
  filling a page on its own.
- **CTA**: "Find My Tools" -> "Find my tool". PF-30 applied (no in-card h2), and
  the tagline reads `tf_tagline` rather than the English-only catalog field.
- **Output reads as guidance, not search.** Heading is "Start with X"; the BEST
  MATCH badge is gone and later cards say "You might also use"; `what_to_do`
  renders under "When you get there:"; `workflow` -> `order_note` under "A useful
  order might be". Prompt forbids match/score/relevance language outright.

**S5.5 exemption, deliberate and narrow.** ToolFinder is exempt from the
PRE-result half only. The rule's premise is that a tool should point elsewhere
before the visitor commits — which for the router IS what it does, afterwards,
having read the problem. Any link chosen in advance is a guess made without
reading it. The post-result half still applies; verified the rule still fires by
stripping the pre-result link from another tool.

### Output discipline (same day)

The landlord/mold test returned four tools, a three-step sequence and a
"Multi-step workflow?" box, for someone who came here because they could not
choose. Rules added:

- **THE FEWEST TOOLS THAT GIVE A CLEAR NEXT STEP.** One confident starting point
  beats three plausible matches. A second tool earns its place only by covering
  a DIFFERENT dimension — a second tool about tone is not a second recommendation.
  Everything past the first is conditional and says so. Never pad to a number.
- **The "even though" test.** "Even though you're not apologising, this tool..."
  is the model telling you the recommendation is strained. Drop it. (That is how
  Mend was getting in.)
- **UNDERSTAND, DO NOT DIAGNOSE.** `understanding` stayed inside their words:
  no inferred temperament ("coming in hot"), no announcing which part is the
  hard part.
- **`why`**: describe the tool, do not sell it, and never promise an outcome —
  no "so you stay calm", no "exactly what to say", no inventing how the other
  person reacts.
- **No legal characterisations.** Never say a tool tells them where they stand
  legally; say what it helps them work out and let that tool set its own bounds.
- **`order_note`** is null with one recommendation (one tool has no order), the
  order must be the LOGICAL one rather than the listing order, and — enforced in
  code, not just the prompt — it is dropped if it names a catalog tool that is
  not among the recommendations. It was citing Magic Mouth, which the visitor
  could neither see nor click.
- **Removed the "Multi-step workflow? Also useful" box**, which sat directly
  under "A useful order might be" (the same idea, twice) and reintroduced the
  word the form had just lost.
- **Escape routes merged**: "Not quite right? Tell us more" / "Or browse all
  tools →".

**Audit note:** removing that box left the results block with no cross-ref the
S5.5 regex could see — the recommendation hrefs were `href={cond ? \`/${id}\` : '#'}`,
which the dynamic-href pattern does not match. The backend already drops any id
not in the catalog, so the ternary was belt-and-braces; it is now
`href={\`/${rec.id}\`}` and the rule can see what is actually there.

### Over-interpretation (the second failure mode)

The landlord case exposed over-RECOMMENDATION. The "huge project, every time I
try to begin I get paralyzed" case exposed over-INTERPRETATION. Those are the
two failure modes this prompt has to hold off, and the tool lives between them:
**the visitor supplies the situation, Tool Finder supplies the direction.**

`understanding` now restates only what they said or what follows directly, two
sentences at most:

- **A metaphor is not a diagnosis.** "Paralysed" means they cannot start; it does
  not mean "something in your brain freezes when you try to begin".
- **Never rule a cause OUT.** It asserted "not because you don't know what to do"
  and then its own clarification asked whether they get stuck choosing where to
  begin — contradicting itself inside one answer. That self-check is the useful
  test: if the clarification could disprove the understanding, the understanding
  overreached.
- **Never judge whether their resources suffice.** "A week is enough time, but
  only if you can get unstuck today" is invented and urgent at once; the project
  might take two hours or three months.

`why` describes what the tool changes about the TASK, not about them. No "your
brain stops seeing it", no "resistance collapses", no "it removes the decision
paralysis". Possible effects say CAN or MAY.

`clarification` is deliberately kept AFTER the recommendation — asking first
would rebuild the chatbot interrogation this page exists to avoid. Its options
must be observable situations ("find yourself reorganising instead of starting")
rather than internal states to choose between ("mind goes blank / anxiety kicks
in"). Label: "One thing I'd want to know" — "Want better results?" read as prompt
optimisation.

**Voice, settled.** The SITE says *we* (the catalog description: "We'll find the
best match"). The guide currently helping you says *I* (the tagline and the whole
output: "I hear you", "One thing I'd want to know"). The tagline is the tool's own
voice wherever it appears, so the catalog field matches it.

### The refinement loop (the missing interaction)

"Not quite right" has two meanings and they were sharing a link:

1. you misunderstood me / that pick is wrong
2. DeftBrain genuinely has nothing for this

The bottom link sent (1) to the page for (2) — "No tool for your problem?
Describe it, we build fast" — which answers a different question and tells the
visitor we have nothing when the truth may be that the first guess was poor. A
promise of refinement delivering product feedback.

Four intentions, four separate paths now:

| that's right | the card link |
| that's not right | **Not what you meant? Tell me what's different →** (new) |
| nothing fits at all | Can't find what you need? Suggest a tool → (IdeaPrompt) |
| I'd rather look myself | Or browse all tools → |

**How the loop works.** The link expands a textarea in place; submitting calls
the same endpoint with `refinement` plus `rejected` (the ids already offered).
The prompt reads the two statements together — "the correction narrows the
original, it does not replace it" — and will not re-offer a rejected tool unless
the correction makes one clearly right. Verified end to end: "huge project, I
get paralysed" returns Task Avalanche Breaker; adding "breaking it down isn't
the problem, I know what to do, I just keep avoiding it" returns **Spiral
Stopper**, with nothing re-offered.

**`clarification` folded into it.** It was already the model admitting it might
not have enough to be sure; it now renders as the hint above the correction box
instead of as passive advice with nowhere to answer.

**Heading**: "Start with X" -> "I'd start with X". "Start with" is authoritative
and makes a correction feel like the visitor arguing; "I'd start with" is a
recommendation from available information and leaves room to say no.

### Final pass before freezing

- **Refinement collapsed to a bare line** — "Not quite it? Tell me what's
  different ▾" (shared Caret), no card until it is opened. A full grey card under
  the recommendation reads as "here is your answer, now answer another question";
  a line reads as "if that is not right, here is how to correct me".
- **Universal placeholder.** It said "e.g. I know exactly what to do - breaking
  it down isn't the problem", which was written for one test and read as leftover
  on every other problem. Now "Tell me what's different or what I missed…", which
  fits any correction.
- **`clarification` must be able to change WHICH TOOL.** It was asking "do you
  have the bill in front of you now" — operational, useful only once inside the
  recommended tool. The rule names both halves of that distinction, and forbids
  asking them to choose between two things they already said (the bill case both
  "seems way too high" AND "I don't understand the charges").
- **Describe only what the catalog entry claims.** Do not round a capability up
  to make a match sound better, and do not imply authority a tool does not have —
  a plain-language translator helps them SEE what to question, it does not rule
  on whether a charge is wrong.
- **Prefer their words to a paraphrase.** They wrote "the total seems way too
  high"; do not render it as "the total feels wrong".

**Checked, not assumed:** "danger scoring" was NOT an embellishment — it is in
JargonAssassin's own catalog description, along with red flags and Red-Line's
negotiation edits. The rule is still worth having, but that instance was accurate.

### Two features removed because they sounded intelligent

`order_note` and `clarification` are both gone from the schema. Each read as a
sophisticated capability and each gave the model room to overthink:

- **The sequence contradicted the recommendation.** "I'd start with Difficult
  Talk Coach" at the top, "Map your leverage first" at the bottom. Primary
  recommendation and first-in-a-sequence are not the same concept, and asking a
  visitor to hold that distinction is absurd. The conditional on the second tool
  already carries everything the order was for.
- **The generated question kept asking downstream things.** "Do you have the
  bill in front of you", "is the mold documented anywhere" — useful once inside
  the recommended tool, useless for deciding which tool. The visitor knows why a
  recommendation is wrong better than the model knows what to ask, so the fixed
  correction box replaced it entirely.

**Recommendations capped at TWO in code**, not just in the prompt.

**The restraint hierarchy** now sits at the top of the prompt, in precedence
order: one tool over two; their words over interpretation; "can help" over a
promised outcome; "if you also" over "you need to"; correction-by-visitor over
interrogation-by-model; and the primary IS where to start.

**Worked pairs, because abstract rules got routed around.** Three failures each
needed their own NO/YES:

    NO:  coming in too hard will poison the relationship
    NO:  the mold fixed - that's non-negotiable - ... doesn't tank the relationship
    YES: get a serious maintenance problem addressed without unnecessarily
         damaging your relationship with your landlord
    ("Damage" was their word. "Poison", "tank", "non-negotiable" are the model's.)

    NO:  keeps them cooperative rather than hostile ... gives you a script that
         preserves the relationship
    YES: can help you plan what to say, rehearse it, and prepare for possible
         responses, so you are not working it out in the moment
    (Never narrate the other person's reactions - you cannot predict them.)

    NO:  if your landlord responds with documents or inspection reports
    YES: if you are unsure what you can reasonably ask for, given they have
         ignored it for months
    (TEST: state the second tool's condition in words from THEIR message. If it
    only makes sense after inventing an event that has not happened, there is no
    second tool.)

**Golden flake fixed while here:** `no_perfect_fit` is nullable and the model
sometimes emitted it as null and sometimes omitted the key, which is a coin-flip
for anything comparing response shape. The route now always emits it.

### The three final rules (frozen)

1. **`understanding` never rules a cause OUT.** It may say what they told you is
   happening; it may not say what is not causing it. "The obstacle isn't unclear
   requirements or missing skills" is an elimination the user never made — a
   diagnosis in a summary's clothes. Boring is correct here: the intelligence
   belongs in the recommendation, not in an elaborate restatement.
2. **`why` is shaped, not vocabulary-filtered.** ONE sentence of what the tool
   does, plus at most one clause tying it to what they wrote. Nothing after that.
   Banning phrases only moved the problem — "removes the decision-making burden"
   became "when paralysis happens at the starting line, it's often because…",
   then "you'll walk in grounded instead of hoping it goes well". All the same
   fault: **the sentence that comes after the useful one.** So the rule bans the
   sentence, not the words.
3. **Exactly ONE recommendation by default.** A second only when their own
   description contains a second distinct need the first tool does not address —
   and the test is to name that need by quoting the clause it lives in. No
   clause, no second tool. "Merely because it might also be useful" is the trap,
   and hundreds of tools are also-useful for any problem. This is what put
   Pre-Mortem next to Task Avalanche Breaker for somebody who said one thing.

**Why one is now safe:** the correction box. Before it existed, offering two or
three was a hedge against being wrong. With it, a single confident answer costs
nothing — if it misses, they say so in their own words and it tries again. The
refinement loop should make Tool Finder MORE willing to give one recommendation,
not less.

`what_to_do` carries forward details they already gave (a deadline they mentioned
belongs in it) and adds no qualifiers they did not ask for — do not tell somebody
to begin "without planning" when the tool they are opening is a planning tool.

**FROZEN.** Architecture, visual hierarchy and the refinement/fallback model are
settled. Further work belongs in `src/data/tools.js`: Tool Finder reads tagline +
description for every candidate, so the accuracy of its recommendations is capped
by the accuracy of those entries.

