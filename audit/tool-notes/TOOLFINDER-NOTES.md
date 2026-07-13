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
