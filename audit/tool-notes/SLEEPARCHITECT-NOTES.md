# SleepArchitect — architecture & lock notes (`sleeparchitect-v1`)

Personalized CBT-I / sleep-hygiene protocol — score, diagnosis, quick wins, phased protocol, target
schedule. **Frontend:** `src/tools/SleepArchitect.js` (`sa_` keys). **Backend:**
`backend/routes/sleep-architect.js` (1 endpoint `/sleep-architect/stream` — misnamed, returns
`res.json`, `MODELS.SMART`, max_tokens 4000). **Golden:** `audit/sleep-architect-golden-sample.json`.
Verify: `npm run check:golden sleep-architect`.

## Audit fixes locked here (2026-07-14)
Guard `!diagnosis || !Array.isArray(protocol)` correct; no endpoint down; grep-clean of leaks.
1. **🐛 i18n `phase` enum.** The frontend `phaseConfig` styles each protocol card on
   `immediate|week1|ongoing|environment`, but `withLanguage` localizes string values → a German
   "umgebung" misses the lookup → generic fallback styling on every card in 12 langs. **Fix:** pinned
   `phase` to English tokens in the prompt. Verified DE: all phases English.
2. **⚠️ soft caps hardened.** key_issues/quick_wins/protocol.actions ≤4, protocol 3-5, explicit; the
   schema is bounded so `max_tokens 4000` holds (verified DE ~1542 tok).
3. **⚠️ German quotes.** Added the no-inner-double-quote rule (diagnosis/description/actions free prose).
4. **🛡️ Domain safety (user-approved):** added a static `sa_disclaimer` i18n line (×13) under the
   diagnosis — general sleep-hygiene guidance, not medical advice; see a doctor for chronic insomnia /
   loud snoring / daytime sleepiness.

## DO NOT silently reverse
- `phase` English pin; array caps; the no-inner-double-quote rule; the `sa_disclaimer` line.
