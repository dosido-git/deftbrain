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

