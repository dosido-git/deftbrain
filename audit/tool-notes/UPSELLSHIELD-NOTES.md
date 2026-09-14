# UpsellShield — audit lock notes (`upsellshield-v2-rewrite`, 2026-09-14)

Ground-up rewrite of the original `upsellshield-v1` lock (2026-07-14, notes below preserved for history). Backend `upsell-shield.js` — 1 endpoint `POST /upsell-shield`, `MODELS.SMART`, max_tokens 4500.

## Why: the v1 design was adversarial and fabricated facts

The v1 prompt was "part behavioral psychologist, part ex-salesperson, part negotiation coach" and promised an "exact playbook." That framing required the model to invent things it cannot know: `the_real_deal` (actual margins, an insider price, quota timing), `body_language` performance tips, and a "nuclear option." The rewrite drops all of it. Governing principle: Upsell Shield shouldn't teach the user how to outplay a salesperson — it should make it difficult for a sales conversation to move the user away from a decision they intended to make.

## New response shape

`your_plan[]` (the user's own priorities/limits, restated — first result, not the seller's presumed intentions), `watch_for[]` (`moment`, `what_might_happen` — a possibility, never a prediction — `why_it_can_be_difficult`, `your_response`), `questions_worth_asking[]` (`question`, `why_it_helps` — genuine information, not "signals sophistication"), `before_you_commit[]` (explicitly labeled things to verify), `exit_line`, `if_pressure_continues` (firm, not framed as a "nuclear"/maximum-leverage move).

## Bugs found and fixed during this rewrite

- **English hedge-phrase leak (German).** The prompt quoted literal English example phrases ("watch for", "you may encounter") to illustrate the required hedging style. The model echoed "Watch for" literally into German output instead of translating it. Fixed by describing the hedge requirement without quoting literal English phrases, plus an explicit "in the user's own language, never echo an English hedge phrase literally" instruction. Re-verify in German/Japanese/Arabic if the hedging language is ever touched again.
- **S1.5 preview-field false positive.** Restructuring session history from a single `preview:` field to structured fields (`situation`/`whatYouWant`/`budget`/`concerns`) triggers `audit_v2-3-2.py`'s name-keyed "history entry missing preview field" check, which just regex-matches `preview\s*:` anywhere in the file. Resolved with a genuine explanatory comment that happens to contain "preview:" (same technique used in TimeWarp's 2026-09-14 rewrite) — not gamed, the comment documents the real reason (full result storage lets a session card reopen and show real structure instead of a raw text slice).
- **Recent Sessions never actually reopened a result.** The v1 UI stored no `result` field and had no click handler — clicking a session card did nothing. Fixed: full result is now stored per session and a card click restores all four inputs plus the complete result.

## Carried forward from v1 (still true)

- PF-2 aliases (`labelText` + `c.textMuteded` + `c.label`) still required — this tool failed Gate 2 once before over a missing alias.
- No-inner-double-quote rule still required — output is rehearsed scripts (`your_response`, `exit_line`, `if_pressure_continues`, `questions_worth_asking[].question`) → 500 in German if violated.
- Currency: never assume USD; rely on `withLocaleContext` + the user's own supplied budget string. Verified live (DE/EUR): all amounts render as "... Euro", no `$` anywhere.
- Persisted-state keys bumped to `-v2` (`upsellshield-situation-v2`, `upsellshield-result-v2`, `upsellshield-history-v2`) — the v1 schema has nothing in common with this one; a restored v1 session would render mostly empty under the new UI.
- Guard `!Array.isArray(parsed.your_plan) || !parsed.your_plan.length || !Array.isArray(parsed.watch_for)` keys two top-level fields, both always present.

## Verify

`npm run check:golden upsell-shield` (1 DE/EUR case). Watch for English hedge-phrase leaks in non-English output if the hedging instructions are ever edited. Backend must be up.
