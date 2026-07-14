# VelvetHammer — audit lock notes (`velvethammer-v1`, 2026-07-14)

Backend `velvet-hammer.js` — 1 endpoint `POST /velvet-hammer`, `MODELS.SMART`, max_tokens 4000. Turns angry drafts into 3 professional rewrites.

## 🐛 i18n-enum + annotation leak — tone badge always red (broken in EVERY language, incl. English)
Frontend `toneColor()`/`toneBg()` switch on English literals `'collaborative'`/`'balanced'` (else → red). But the schema value was `"collaborative — one sentence"` — the leaked ` — one sentence` suffix meant `variant.tone === 'collaborative'` **never matched even in English**, so collaborative + balanced variants always rendered red/firm. In non-English, `withLanguage` localized the value too → still no match. Net: the tone color-coding was dead for everyone.
**Fix:** made `tone` a clean English machine code (`collaborative|balanced|firm`) pinned do-not-translate; `label` carries the localized human word. Badge/heading render `variant.label`; color switches on `variant.tone`. Verified live (DE): `tone=['collaborative','balanced','firm']`, `label=['Kooperativ','Ausgewogen','Bestimmt']` → correct emerald/amber/red.

## Other fixes
- **Self-contradictory message spec:** `"— 3–5 sentences — 2-4 sentences"` → single spec (3–5 sentences, in a RULES line).
- **German unescaped double-quotes:** diplomatic message scripts get quoted → 500 in German. Added the no-inner-double-quote rule.
- **Annotation leaks:** stripped 11 `— one sentence` (reached `label` badge + copy via `buildAllText`) + the message double-annotation; global brevity rule.
- **Dead code:** removed a leftover empty `<div className="flex gap-2"></div>`.
- **PF-2:** added `c.textMuteded` + `c.label` aliases (`labelText` already in c block).

## Not bugs
- Guard `!data.variants?.length` keys a top-level non-nullable array. Correct.
- `sessionHistory` key `velvethammer-history`, capped 6.

## Verify
`npm run check:golden velvet-hammer` (1 DE case). `tone` must stay the 3 English codes. Backend must be up.
