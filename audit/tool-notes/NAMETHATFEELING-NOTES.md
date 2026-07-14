# NameThatFeeling — architecture & lock notes (`namethatfeeling-v1`)

Finds the precise word (often from another language) for a hard-to-name feeling. **Frontend:**
`src/tools/NameThatFeeling.js`. **Backend:** `backend/routes/name-that-feeling.js` (1 endpoint,
`MODELS.FAST`, max_tokens 4000). **Golden:** `audit/name-that-feeling-golden-sample.json`.
Verify: `npm run check:golden name-that-feeling`.

## Audit fixes locked here (2026-07-13)
The healthiest tool in the batch — no 🐛. Guard `!parsed.best_match` is correct (top-level, always
emitted); three-way sync intact; no USD/format-strict hazards.
1. **⚠️→cleaned:** 18 annotation leaks (`— one sentence` ×15, `— 1-2 sentences`, `— 3-6 words`) that
   echoed into both the render and the copy output (`buildFullText`). Replaced with ONE global
   brevity line in PERSONALITY.
2. **⚠️ soft caps hardened:** `close_matches` / `from_other_languages` were "Provide 2-3 … 2-3" →
   "EXACTLY 2-3 … EXACTLY 2-3". Verified DE (Fernweh): 3 + 3, ~1105 tok — no truncation.

## DO NOT silently reverse
- The global brevity line in PERSONALITY; EXACTLY 2-3 caps; no annotation suffixes.
