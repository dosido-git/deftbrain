# SixDegreesOfMe — architecture & lock notes (v1, 2026-07-01)

Identity/introspection tool: builds "six degrees" chains between things, a personal life-web, stories, challenges. In `LOCALIZED_TOOLS`.

- **Model:** all 9 endpoints `claude-haiku-4-5`. No success guards (direct parse; frontend null-safe) — the safe pattern.
- **Endpoints:** `/api/six-degrees` (main), `/flip`, `/surprise`, `/profile-prompt`, `/challenge`, `/what-if`, `/story`, `/tag-nodes`, `/chain-between`.
- **Golden:** `audit/six-degrees-of-me-golden-sample.json` (main chain). Verify: `npm run check:golden six-degrees-of-me`.

## DO NOT silently reverse
1. **`tag-nodes` schema values are clean tokens** — `node` = exact node text, `tag` = one canonical category token, and the `color` field is DROPPED. Previously all three carried `— one sentence`; since the frontend uses `tag`/`node` as lookup keys (`TAG_COLORS[tag]`, legend `n.tag===tag`, `updates[tg.node]`), the annotation broke node colors, the life-web legend, and auto-tag matching. Keep them annotation-free.
2. **`c.textMuteded = c.textMuted` alias present** (after the `c` block). PF-2 requires it; its absence blocks the `--max-warnings=0` audit gate.
3. `difficulty` and `linchpin_assessment` enums stay clean (frontend switches on them for color).
4. `/challenge` max_tokens 3000, `/chain-between` 3000 (long-constraint / two-chain outputs).
5. No currency (identity tool; language-only).
