# ScamRadar — architecture & lock notes (`scamradar-v1`)

Paste a suspicious message → SCAM / SUSPICIOUS / LIKELY SAFE verdict + red flags, techniques, and
action steps. **Frontend:** `src/tools/ScamRadar.js` (`scam_*` keys). **Backend:**
`backend/routes/scam-radar.js` (1 endpoint `/scam-radar/stream` — misnamed, returns `res.json`,
`MODELS.SMART`). **Golden:** `audit/scam-radar-golden-sample.json`. Verify: `npm run check:golden scam-radar`.

## Audit fixes locked here (2026-07-14)
1. **🐛 DOWN in ALL 12 non-English languages — 500 every call.** The guard
   `VALID_VERDICTS.includes(parsed.verdict)` checks English literals, but `withLanguage` instructs the
   model to *translate JSON string values* → German verdict "BETRUG" fails the `.includes()` → 500.
   (This is the severe form of the i18n-enum bug: a **backend guard** on a localized enum, not just a
   frontend badge.) **Fix:** pinned `verdict` + `scam_type` + `techniques_used` to their exact English
   code values via an explicit prompt rule; only prose fields are localized. Verified DE: verdict='SCAM'.
2. **🐛 German quote-citation 500.** The prompt cites actual phrases from the message → unescaped
   double-quotes in German → invalid JSON → 500. **Fix:** the no-inner-double-quote rule (paraphrase
   citations). Verified DE on a quote-heavy phishing email.
3. **⚠️ `techniques_used` uncapped** (bounded only by the 14-item enum) → capped at 6.
4. **🛡️ Domain safety (user-approved):** added a static `scam_disclaimer` i18n line (×13) under the
   verdict — "automated guidance, not financial or legal advice — verify independently".

## DO NOT silently reverse
- The English pin on `verdict`/`scam_type`/`techniques_used` (guard + frontend both depend on it);
  the no-inner-double-quote rule; the `scam_disclaimer` line; `techniques_used` ≤6.
