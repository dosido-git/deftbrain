# Per-tool audit & lock notes

One file per tool, written when a tool is audited and locked (see `../AUDIT-KIT.md`).
Each file records the tool's architecture, the deliberate decisions, and an explicit
**"DO NOT silently reverse"** list — the fixes we'd regret undoing (model choice,
`max_tokens` sizing, prompt rules, guard shapes, etc.).

- Naming: `<TOOL>-NOTES.md` (uppercase tool name). BuyWise predates the convention
  and is `BUYWISE-ARCHITECTURE.md`.
- Paired with a known-good git tag (`<tool>-vN`) and a golden sample
  (`../<tool>-golden-sample.json`); verify with `npm run check:golden <tool>`.
- The golden samples themselves stay in `audit/` (root) — only the prose notes live here.
