# RoommateCourt — architecture & lock notes (`roommatecourt-v1`)

Roommate dispute mediator + chore assigner. **Frontend:** `src/tools/RoommateCourt.js` (2 tabs:
Dispute + Chores). **Backend:** `backend/routes/roommate-court.js` (1 route, 3 actions
mediate/assign/rebalance, `MODELS.SMART`; mediate **5000**). **Golden:**
`audit/roommate-court-golden-sample.json`. Verify: `npm run check:golden roommate-court`.

## Audit fixes locked here (2026-07-14)
1. **🐛 i18n `whos_right` enum — headline output wrong in 12 languages.** The frontend switches the
   verdict-badge color on `whos_right === 'you'|…` and maps it to a localized label via `t()`, but
   `withLanguage` translates JSON string values → in German the model returned "beide"/"du" → every
   comparison fell through → badge **always rendered "Neither is right"**. **Fix:** pinned `whos_right`
   to English keys in the prompt. Verified DE: whos_right='both'.
2. **🐛 dead history feature.** The frontend sends `sessionHistory` but the backend destructured
   `history` (assign + rebalance) → the entire history-aware balancing (system rules 3 & 5) silently
   never fired. **Fix:** `const hist = history || sessionHistory` in both actions. (Same class as PEP.)
3. **🐛 German quotes.** `conversation_script` is word-for-word dialogue → unescaped double-quotes in
   German → 500. **Fix:** the no-inner-double-quote rule (You:/Them: prefixes, no quote marks).
4. **⚠️ format-strict placeholder exemplars.** `effort: 1-3`, `<total>`, `<number 0-100>`, `<50-100>`
   are consumed as integers (CSS width math, `reduce` sums, `EFFORT_LABEL_KEY` lookup). **Fix:**
   concrete numeric exemplars (effort:2, your/their_fault_pct 40/60, fairness_score 82, totals 6/5).
5. **⚠️ truncation:** mediate `max_tokens 4000→5000` + immediate_actions/boundaries/escalation_options
   ≤3. **⚠️→cleaned:** 10 leaks; PF-2 `c.label` alias reordered.

## DO NOT silently reverse
- `whos_right` English pin; `history || sessionHistory` in assign+rebalance; the no-inner-quote rule;
  concrete numeric exemplars; mediate `5000` + caps; no annotation suffixes.
